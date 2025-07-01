import json
from uuid import UUID

import asyncpg

from app.utils.config import Settings


settings = Settings()


async def update_lecture_slide_count(
    conn: asyncpg.Connection, lecture_id: UUID, total_slides: int
):
    await conn.execute(
        "UPDATE lectures SET total_slides=$1 WHERE id=$2",
        total_slides,
        str(lecture_id),
    )


async def get_or_create_slide(
    conn: asyncpg.Connection, lecture_id: UUID, slide_number: int
) -> UUID:
    await conn.execute(
        """
        INSERT INTO slides
          (lecture_id, slide_number, total_chunks, processed_chunks)
        VALUES ($1, $2, 0, 0)
        ON CONFLICT DO NOTHING
        """,
        str(lecture_id),
        slide_number,
    )
    row = await conn.fetchrow(
        "SELECT id FROM slides WHERE lecture_id=$1 AND slide_number=$2",
        str(lecture_id),
        slide_number,
    )
    return row["id"]


async def update_slide_total_chunks(
    conn: asyncpg.Connection, lecture_id: UUID, slide_number: int, total_chunks: int
):
    await conn.execute(
        """
        UPDATE slides
           SET total_chunks=$1
         WHERE lecture_id=$2
           AND slide_number=$3
        """,
        total_chunks,
        str(lecture_id),
        slide_number,
    )


async def get_or_create_chunk(
    conn: asyncpg.Connection,
    slide_id: UUID,
    lecture_id: UUID,
    slide_number: int,
    chunk_index: int,
    text_chunk: str,
    token_count: int,
) -> UUID:
    result = await conn.fetchrow(
        """
        INSERT INTO chunks
          (slide_id, lecture_id, slide_number, chunk_index, text, token_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING id
        """,
        slide_id,
        str(lecture_id),
        slide_number,
        chunk_index,
        text_chunk,
        token_count,
    )
    if result:
        return result["id"]
    else:
        return await conn.fetchval(
            "SELECT id FROM chunks WHERE slide_id=$1 AND chunk_index=$2",
            slide_id,
            chunk_index,
        )


async def enqueue_embedding_job(
    conn: asyncpg.Connection,
    chunk_id: UUID,
    slide_id: UUID,
    lecture_id: UUID,
    slide_number: int,
):
    payload = {
        "chunk_id": str(chunk_id),
        "slide_id": str(slide_id),
        "lecture_id": str(lecture_id),
        "slide_number": slide_number,
    }
    await conn.execute(
        "SELECT pgmq.send($1::text, $2::jsonb)",
        settings.embedding_queue,
        json.dumps(payload),
    )


async def find_decorative_image(
    conn: asyncpg.Connection, image_hash: str
) -> str | None:
    existing = await conn.fetchrow(
        "SELECT storage_path FROM decorative_images_global WHERE image_hash=$1",
        image_hash,
    )
    return existing["storage_path"] if existing else None


async def insert_decorative_image(
    conn: asyncpg.Connection, image_hash: str, storage_path: str
):
    await conn.execute(
        """
        INSERT INTO decorative_images_global(image_hash, storage_path)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        """,
        image_hash,
        storage_path,
    )


async def insert_slide_image(
    conn: asyncpg.Connection,
    slide_id: UUID,
    lecture_id: UUID,
    slide_number: int,
    image_index: int,
    storage_path: str,
    image_hash: str,
    img_type: str,
    ocr_text: str,
    alt_text: str,
    width: int,
    height: int,
):
    await conn.execute(
        """
        INSERT INTO slide_images
          (slide_id, lecture_id, slide_number, image_index, storage_path,
           image_hash, type, ocr_text, alt_text, width, height)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
        """,
        slide_id,
        str(lecture_id),
        slide_number,
        image_index,
        storage_path,
        image_hash,
        img_type,
        ocr_text,
        alt_text,
        width,
        height,
    )
