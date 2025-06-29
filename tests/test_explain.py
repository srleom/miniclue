import uuid


def test_explain(client):
    payload = {
        "slide_id": str(uuid.uuid4()),
        "lecture_id": str(uuid.uuid4()),
        "slide_number": 1,
    }
    response = client.post("/explain", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "queued"}
