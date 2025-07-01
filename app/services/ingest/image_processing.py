import io
import logging
from uuid import UUID

import imagehash
import pymupdf
import pytesseract
from PIL import Image

from app.services.ingest.db_utils import (
    find_decorative_image,
    insert_decorative_image,
    insert_slide_image,
)
from app.services.ingest.s3_utils import upload_image
from app.utils.config import Settings


settings = Settings()


def initialize_blip():
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration

        blip_processor = BlipProcessor.from_pretrained(
            "Salesforce/blip-image-captioning-base", use_fast=True
        )
        blip_model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        blip_enabled = True
        logging.info("BLIP models loaded successfully.")
        return blip_processor, blip_model, blip_enabled
    except ImportError:
        logging.warning(
            "transformers/BLIP dependencies not found. BLIP will be disabled."
        )
        return None, None, False


def _process_image_content(
    img: Image.Image,
    blip_processor,
    blip_model,
    blip_enabled: bool,
    log_identifier: str,
) -> tuple[str, str]:
    """Helper to run OCR and BLIP on a PIL image."""
    ocr_text = pytesseract.image_to_string(img)

    alt_text = ""
    if blip_enabled and blip_processor and blip_model:
        try:
            inputs = blip_processor(images=img, return_tensors="pt")
            out = blip_model.generate(**inputs)
            alt_text = blip_processor.decode(out[0], skip_special_tokens=True)
        except Exception as e:
            logging.warning(f"BLIP failed for {log_identifier}: {e}")
            pass
    return ocr_text, alt_text


def _classify_image(alt_text: str, ocr_text: str) -> str:
    lower_alt_text = alt_text.lower()

    content_keywords = {
        "diagram",
        "chart",
        "graph",
        "table",
        "screenshot",
        "code",
        "equation",
        "map",
        "plot",
    }

    decorative_keywords = {
        "logo",
        "icon",
        "banner",
        "background",
        "illustration",
        "photo",
        "picture",
        "drawing",
        "artwork",
        "decoration",
    }

    if any(kw in lower_alt_text for kw in content_keywords):
        img_type = "content"
    elif any(kw in lower_alt_text for kw in decorative_keywords):
        img_type = "decorative"
    elif ocr_text and len(ocr_text) >= 30:
        img_type = "content"
    elif alt_text and len(alt_text.split()) >= 4 and len(alt_text) >= 30:
        img_type = "content"
    else:
        img_type = "decorative"
    return img_type


async def process_slide_images(
    doc,
    s3_client,
    conn,
    page_index: int,
    lecture_id: UUID,
    slide_id: UUID,
    blip_processor,
    blip_model,
    blip_enabled,
    content_registry,
):
    page = doc.load_page(page_index)
    slide_number = page_index + 1
    images = page.get_images(full=True)

    if not images:
        logging.info(f"No images found on slide {slide_number}")
        return

    logging.info(f"Found {len(images)} images on slide {slide_number}, processing...")
    for img_index, img_ref in enumerate(images):
        xref = img_ref[0]
        try:
            info = doc.extract_image(xref)
        except Exception as e:
            logging.error(
                f"Failed to extract image xref={xref} on slide {slide_number}: {e}"
            )
            continue

        img_bytes = info["image"]
        width = info["width"]
        height = info["height"]
        ext = info.get("ext", "png")
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        log_identifier = f"Image {img_index+1} on slide {slide_number}"
        ocr_text, alt_text = _process_image_content(
            img, blip_processor, blip_model, blip_enabled, log_identifier
        )
        phash = str(imagehash.phash(img))
        img_type = _classify_image(alt_text, ocr_text)
        logging.info(f"Image {img_index+1} classified as '{img_type}'")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_data = buffer.getvalue()

        if img_type == "content":
            if phash in content_registry:
                img_path = content_registry[phash]
            else:
                img_key = f"lectures/{lecture_id}/slides/{slide_number}/raw_images/{img_index}.{ext}"
                upload_image(
                    s3_client,
                    settings.s3_bucket_name,
                    img_key,
                    img_data,
                    f"image/{ext}",
                )
                img_path = f"s3://{settings.s3_bucket_name}/{img_key}"
                content_registry[phash] = img_path
        else:
            img_path = await find_decorative_image(conn, phash)
            if not img_path:
                img_key = f"global/images/{phash}.png"
                upload_image(
                    s3_client,
                    settings.s3_bucket_name,
                    img_key,
                    img_data,
                    "image/png",
                )
                img_path = f"s3://{settings.s3_bucket_name}/{img_key}"
                await insert_decorative_image(conn, phash, img_path)

        await insert_slide_image(
            conn,
            slide_id,
            lecture_id,
            slide_number,
            img_index,
            img_path,
            phash,
            img_type,
            ocr_text,
            alt_text,
            width,
            height,
        )


async def process_rendered_slide(
    doc,
    s3_client,
    conn,
    page_index: int,
    lecture_id: UUID,
    slide_id: UUID,
    blip_processor,
    blip_model,
    blip_enabled,
):
    slide_number = page_index + 1
    page = doc.load_page(page_index)
    try:
        matrix = pymupdf.Matrix(2, 2)
        pix = page.get_pixmap(matrix=matrix)
        img_full = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        log_identifier_full = f"Rendered slide {slide_number}"
        ocr_full, alt_full = _process_image_content(
            img_full, blip_processor, blip_model, blip_enabled, log_identifier_full
        )
        phash_full = str(imagehash.phash(img_full))

        buffer_full = io.BytesIO()
        img_full.save(buffer_full, format="PNG")
        full_data = buffer_full.getvalue()
        key_full = f"lectures/{lecture_id}/slides/{slide_number}/slide_image.png"
        upload_image(
            s3_client, settings.s3_bucket_name, key_full, full_data, "image/png"
        )
        path_full = f"s3://{settings.s3_bucket_name}/{key_full}"

        await insert_slide_image(
            conn,
            slide_id,
            lecture_id,
            slide_number,
            -1,
            path_full,
            phash_full,
            "slide_image",
            ocr_full,
            alt_full,
            pix.width,
            pix.height,
        )
        logging.info(f"Rendered full slide image uploaded for slide {slide_number}")
    except Exception as e:
        logging.error(f"Failed to render full slide {slide_number}: {e}")
