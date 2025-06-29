from uuid import UUID


async def ingest(lecture_id: UUID, storage_path: str):
    """Stub for ingestion: fetch PDF from S3, store metadata, enqueue ingestion job"""
    pass
