import logging
from typing import Dict
from app.schemas.ingestion import IngestionPayload

import asyncpg
import json
import os
import tempfile
from app.services.ingestion.db_utils import (
    get_or_create_chunk,
    get_or_create_slide,
    set_lecture_parsing,
    update_lecture_sub_image_count,
    update_lecture_status,
)
from app.services.ingestion.image_processing import (
    process_slide_sub_images,
    render_and_upload_slide_image,
)
from app.services.ingestion.s3_utils import download_pdf_to_file
from app.services.ingestion.text_processing import chunk_text_by_tokens
from app.services.ingestion.pubsub_utils import (
    publish_embedding_job,
    publish_image_analysis_job,
)
from app.utils.config import Settings
from app.utils.s3_utils import get_s3_client
from app.utils.db_utils import verify_lecture_exists


settings = Settings()


async def ingest(
    payload: IngestionPayload,
):
    lecture_id = payload.lecture_id
    storage_path = payload.storage_path
    customer_identifier = payload.customer_identifier
    name = payload.name
    email = payload.email
    """
    Ingestion and Dispatch Workflow:
    - Parses a PDF into slides, text chunks, and images.
    - Uploads unique images to S3.
    - Dispatches jobs for image analysis and slide explanations via Pub/Sub.
    - Does NOT make any external AI calls.
    """

    if not settings.postgres_dsn:
        logging.error("Postgres DSN not configured")
        raise RuntimeError("Postgres DSN not configured")

    conn = None
    doc = None
    tmp_path = None
    import pymupdf

    s3_client = None
    try:
        s3_client = get_s3_client()
        conn = await asyncpg.connect(settings.postgres_dsn, statement_cache_size=0)

        # Verify the lecture exists before proceeding (Defensive Subscriber)
        if not await verify_lecture_exists(conn, lecture_id):
            logging.warning(
                f"Lecture with ID {lecture_id} not found. Acknowledging message and stopping."
            )
            return

        # Clear any previous embedding-track errors since we're starting fresh
        await conn.execute(
            "UPDATE lectures SET embedding_error_details = NULL, explanation_error_details = NULL WHERE id = $1",
            lecture_id,
        )

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = tmp.name

        download_pdf_to_file(s3_client, settings.s3_bucket_name, storage_path, tmp_path)
        doc = pymupdf.open(tmp_path)
        total_slides = doc.page_count

        await set_lecture_parsing(conn, lecture_id, total_slides)
        processed_images_map: Dict[str, str] = {}
        image_analysis_jobs = []
        for page_index in range(total_slides):
            slide_number = page_index + 1
            page = doc.load_page(page_index)

            async with conn.transaction():
                raw_text = page.get_text("text")
                slide_id = await get_or_create_slide(
                    conn, lecture_id, slide_number, raw_text
                )

                # 2. Create text chunks
                chunks = chunk_text_by_tokens(raw_text)
                for idx, (text_chunk, token_count) in enumerate(chunks):
                    await get_or_create_chunk(
                        conn,
                        slide_id,
                        lecture_id,
                        slide_number,
                        idx,
                        text_chunk,
                        token_count,
                    )

                # 3. Render and process images
                await render_and_upload_slide_image(
                    doc, s3_client, conn, page_index, lecture_id, slide_id
                )
                new_jobs = await process_slide_sub_images(
                    doc,
                    s3_client,
                    conn,
                    page_index,
                    lecture_id,
                    slide_id,
                    processed_images_map,
                )
                image_analysis_jobs.extend(new_jobs)

        # Post-loop operations
        total_sub_images = len(processed_images_map)
        await update_lecture_sub_image_count(conn, lecture_id, total_sub_images)

        # DEPRECATED: Explanation generation has been removed from the data flow
        # We now set status to 'processing' while embeddings/images are being handled
        await update_lecture_status(conn, lecture_id, "processing")

        if total_sub_images > 0:
            for job in image_analysis_jobs:
                publish_image_analysis_job(
                    slide_image_id=job["slide_image_id"],
                    lecture_id=job["lecture_id"],
                    image_hash=job["image_hash"],
                    customer_identifier=customer_identifier,
                    name=name,
                    email=email,
                )
        else:
            publish_embedding_job(
                lecture_id,
                customer_identifier=customer_identifier,
                name=name,
                email=email,
            )

    except Exception as e:
        logging.error(f"Ingestion failed for lecture {lecture_id}: {e}", exc_info=True)
        if conn:
            error_info = {"service": "ingestion", "error": str(e)}
            await update_lecture_status(
                conn,
                lecture_id,
                "failed",
                embedding_error_details=json.dumps(error_info),
            )
        raise
    finally:
        if doc:
            doc.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        if s3_client:
            s3_client.close()
        if conn:
            await conn.close()
