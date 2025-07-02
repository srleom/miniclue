from uuid import UUID
import logging

import asyncpg
import boto3
import pymupdf

from app.services.ingest.db_utils import (
    enqueue_embedding_job,
    get_or_create_chunk,
    get_or_create_slide,
    update_lecture_slide_count,
    update_slide_total_chunks,
)
from app.services.ingest.image_processing import (
    initialize_blip,
    process_rendered_slide,
    process_slide_images,
)
from app.services.ingest.s3_utils import download_pdf
from app.services.ingest.text_processing import chunk_text_by_tokens
from app.utils.config import Settings


settings = Settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:     %(message)s",
)


async def ingest(lecture_id: UUID, storage_path: str):
    """Ingest PDF: download, parse slides, chunk text, process images, and enqueue embedding jobs"""
    logging.info(
        f"Starting ingestion for lecture_id={lecture_id}, storage_path={storage_path}"
    )
    if not settings.postgres_dsn:
        logging.error("Postgres DSN not configured")
        raise RuntimeError("Postgres DSN not configured")

    blip_processor, blip_model, blip_enabled = initialize_blip()

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.s3_access_key or None,
        aws_secret_access_key=settings.s3_secret_key or None,
        endpoint_url=settings.s3_endpoint_url or None,
    )
    logging.info("S3 client initialized")

    pdf_bytes = download_pdf(s3_client, settings.s3_bucket_name, storage_path)
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    total_slides = doc.page_count
    logging.info(f"PDF opened, total slides: {total_slides}")

    conn = await asyncpg.connect(settings.postgres_dsn)
    logging.info("Postgres connection established")
    try:
        await update_lecture_slide_count(conn, lecture_id, total_slides)
        logging.info(f"Updated lecture {lecture_id} with total_slides={total_slides}")

        content_registry: dict[str, str] = {}
        logging.info(f"Processing {total_slides} slides...")
        for page_index in range(total_slides):
            slide_number = page_index + 1
            page = doc.load_page(page_index)
            logging.info(f"Processing slide {slide_number}/{total_slides}")

            async with conn.transaction():
                slide_id = await get_or_create_slide(conn, lecture_id, slide_number)

                raw_text = page.get_text()
                # Persist raw slide text
                await conn.execute(
                    "UPDATE slides SET raw_text=$1 WHERE id=$2",
                    raw_text,
                    slide_id,
                )
                chunks = chunk_text_by_tokens(raw_text)
                total_chunks = len(chunks)
                logging.info(f"Slide {slide_number}: Created {total_chunks} chunks")

                await update_slide_total_chunks(
                    conn, lecture_id, slide_number, total_chunks
                )

                logging.info(
                    f"Inserting {total_chunks} chunks for slide {slide_number} and enqueuing embedding jobs..."
                )
                for idx, (text_chunk, token_count) in enumerate(chunks):
                    chunk_id = await get_or_create_chunk(
                        conn,
                        slide_id,
                        lecture_id,
                        slide_number,
                        idx,
                        text_chunk,
                        token_count,
                    )
                    await enqueue_embedding_job(
                        conn, chunk_id, slide_id, lecture_id, slide_number
                    )

                await process_slide_images(
                    doc,
                    s3_client,
                    conn,
                    page_index,
                    lecture_id,
                    slide_id,
                    blip_processor,
                    blip_model,
                    blip_enabled,
                    content_registry,
                )

                await process_rendered_slide(
                    doc,
                    s3_client,
                    conn,
                    page_index,
                    lecture_id,
                    slide_id,
                    blip_processor,
                    blip_model,
                    blip_enabled,
                )
    finally:
        await conn.close()
        logging.info("Postgres connection closed")

    logging.info(f"Finished ingestion for lecture_id={lecture_id}")
