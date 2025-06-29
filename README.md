# AI Lecture Service

A FastAPI microservice to handle AI‐driven lecture pipeline jobs (ingestion, embedding, explanation, summarization).

## Setup

1. Ensure Python 3.13+ (<4.0) is installed.
2. Clone the repository.
3. Create a `.env` file in the project root with the environment variables listed below.
4. Install dependencies:
   ```
   poetry install
   ```
5. Run the server:
   ```
   poetry run start
   ```

## Environment Variables

Set the following environment variables:

- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_BUCKET_NAME
- S3_ENDPOINT_URL
- POSTGRES_DSN
- LLM_API_KEY
- LLM_API_ENDPOINT
- INGESTION_QUEUE
- EMBEDDING_QUEUE
- EXPLANATION_QUEUE
- SUMMARY_QUEUE

## API Endpoints

### Health Check

**GET** `/health`

Response:

```json
{ "status": "ok" }
```

### Ingest

**POST** `/ingest`

Payload:

```json
{ "lecture_id": "UUID", "storage_path": "string" }
```

Response:

```json
{ "status": "queued" }
```

### Embed

**POST** `/embed`

Payload:

```json
{
  "chunk_id": "UUID",
  "slide_id": "UUID",
  "lecture_id": "UUID",
  "slide_number": 1
}
```

Response:

```json
{ "status": "queued" }
```

### Explain

**POST** `/explain`

Payload:

```json
{ "slide_id": "UUID", "lecture_id": "UUID", "slide_number": 1 }
```

Response:

```json
{ "status": "queued" }
```

### Summarize

**POST** `/summarize`

Payload:

```json
{ "lecture_id": "UUID" }
```

Response:

```json
{ "status": "queued" }
```

## Testing

Run tests with:

```
poetry run pytest
```
