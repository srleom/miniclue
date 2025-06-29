import uuid


def test_summarize(client):
    payload = {"lecture_id": str(uuid.uuid4())}
    response = client.post("/summarize", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "queued"}
