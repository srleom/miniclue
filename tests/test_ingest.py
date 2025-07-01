import uuid
from unittest.mock import AsyncMock


def test_ingest(client, mocker):
    mocker.patch(
        "app.routers.ingest.ingest_service",
        new_callable=AsyncMock,
    )
    payload = {"lecture_id": str(uuid.uuid4()), "storage_path": "s3://bucket/file.pdf"}
    response = client.post("/ingest", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "queued"}
