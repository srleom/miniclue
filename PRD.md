# Tech Stack

| Layer / Component                        | Technology & Notes                                      |
| ---------------------------------------- | ------------------------------------------------------- |
| **Frontend**                             | Next.js 16 (React 19)                                   |
| • TipTap WYSIWYG editor                  |                                                         |
| • React PDF Viewer                       |                                                         |
| • AI SDK (Vercel)                        |                                                         |
| • PostHog Analytics                      |                                                         |
| • TanStack Query                         |                                                         |
| **API Gateway**                          | Golang 1.24+ (net/http, ServeMux)                       |
| • Route groups under `/v1` (see below)   |                                                         |
| • JWT middleware validating Supabase JWT |                                                         |
| • Swagger/OpenAPI documentation          |                                                         |
| • CORS middleware                        |                                                         |
| **Auth**                                 | Supabase Auth (Google provider)                         |
| **Object Storage**                       | Supabase Storage (S3-compatible)                        |
| **Relational & Vector**                  | Supabase Postgres (serverless)                          |
| • pgvector (vector embeddings)           |                                                         |
| • Row Level Security (RLS)               |                                                         |
| **Message Queue**                        | Google Cloud Pub/Sub                                    |
| **AI Microservices**                     | Python 3.13+ (FastAPI)                                  |
| **PDF Parsing**                          | PyMuPDF (fitz)                                          |
| **Embeddings**                           | OpenAI (text-embedding-3-small)                         |
| **LLM Inference**                        | OpenAI, Anthropic, Google Gemini, X.AI, DeepSeek (BYOK) |
| **Secret Management**                    | Google Cloud Secret Manager                             |
| **Containerization**                     | Docker on Google Cloud Run                              |
| **CI/CD**                                | GitHub Actions                                          |
| **Monitoring & Logging**                 | Supabase Logs / PostHog                                 |
| **Cache (Later)**                        | Managed Redis (e.g. Upstash or Redis Cloud)             |

# Repos

| Purpose                         | Type   | Deployment                    |
| ------------------------------- | ------ | ----------------------------- |
| Frontend                        | NextJS | Vercel Serverless             |
| Backend API Gateway             | Go     | Google Cloud Run (Serverless) |
| PDF processing and AI LLM calls | Python | Google Cloud Run (Serverless) |

# Pub/Sub Push-Based Workflow

We use Google Cloud Pub/Sub with push subscriptions to Python API endpoints:

- **Topics**: ingestion, embedding, image-analysis
- **DEPRECATED Topics** (no longer published): explanation, summary
- **Subscriptions**: configured as push to `/{topic}` on your API server
- **Retry & Dead-Letter**: Each subscription has an exponential backoff policy (min:10s, max:10m). After exceeding max delivery attempts, failed messages are forwarded to a dead-letter topic, which pushes via HTTP POST to the `/dlq` endpoint on your API gateway. There, payloads are persisted in the database for logging and manual inspection.
- **Ack Deadline**: Configure each subscription's `ackDeadlineSeconds` to match your expected processing time (e.g., 60s), and use the client library's ack-deadline lease-extension API in long-running handlers to renew the deadline before it expires, preventing premature redelivery.
- **Handling Deleted Data (Defensive Subscribers)**: Pub/Sub does not support directly deleting specific in-flight messages. Instead, subscribers must be "defensive." Before processing a message, a subscriber should always query the database to confirm the associated lecture or entity still exists. If it has been deleted, the subscriber should simply acknowledge the message to prevent redelivery and take no further action. This approach is resilient to race conditions and simplifies the deletion logic in the main API.

# FastAPI Push Handlers

Base URL:

- Local: http://127.0.0.1:8000
- Staging: https://stg.svc.miniclue.com
- Production: https://svc.miniclue.com

/ingestion → Python ingestion endpoint (POST)
/embedding → Python embedding endpoint (POST)
/image-analysis → Python image analysis endpoint (POST)
/chat → Python chat endpoint (POST, streaming SSE)
/chat/generate-title → Python chat title generation endpoint (POST)
/health → Health check endpoint (GET)
/debug/config → Debug configuration endpoint (GET)

**DEPRECATED endpoints** (no longer actively used):
/explanation → Python explanation endpoint (POST) - kept for legacy data access
/summary → Python summary endpoint (POST) - kept for legacy data access

Pub/Sub pushes directly to your Python services for ingestion, embedding, and image-analysis. The explanation and summary endpoints are deprecated and no longer receive new jobs. The chat endpoint is called directly from the Go API gateway for real-time streaming responses.

# Go API Routes

Base URL:

- Local: http://127.0.0.1:8080
- Staging: https://stg.api.miniclue.com/v1
- Production: https://api.miniclue.com/v1

```
/v1/courses
├── POST / → create course
├── GET /:courseId → fetch course
├── PATCH /:courseId → update course
└── DELETE /:courseId → delete course

/v1/lectures
├── POST /batch-upload-url → get presigned URLs for batch upload
├── GET / → list lectures (query by course_id) (`?limit=&offset=`)
├── GET /:lectureId → fetch lecture
├── PATCH /:lectureId → update lecture metadata
└── DELETE /:lectureId → delete lecture

/v1/lectures/:lectureId
├── POST /upload-complete → complete upload and trigger processing
├── GET /summary → get lecture summary
├── GET /explanations → list lecture explanations (`?limit=&offset=`)
├── GET /url → get signed URL for lecture PDF file
├── GET /note → get lecture note
├── POST /note → create lecture note
└── PATCH /note → update lecture note

/v1/lectures/:lectureId/chats
├── POST / → create new chat
├── GET / → list chats for lecture (`?limit=&offset=`)

/v1/lectures/:lectureId/chats/:chatId
├── GET / → get chat details
├── PATCH / → update chat title
└── DELETE / → delete chat and messages

/v1/lectures/:lectureId/chats/:chatId/stream
└── POST / → stream chat response (SSE, AI SDK Data Stream Protocol)

/v1/lectures/:lectureId/chats/:chatId/messages
└── GET / → list messages in chat (`?limit=`)

/v1/users/me
├── GET / → fetch user profile
├── POST / → create or update profile
├── GET /courses → list user's courses
├── GET /recents → list recent lectures (`?limit=&offset=`)
├── GET /api-key → get API keys
├── POST /api-key → create or update API key
├── DELETE /api-key → delete API key
├── GET /models → get model preferences
└── POST /models → update model preferences

/v1/dlq
└── POST / → handle dead-letter queue messages (Pub/Sub push)

/swagger/swagger.json → Swagger API documentation (JSON)
/swagger/ → Swagger UI interface
```

# Authentication

1. **Sign-in**
   - Next.js → Supabase Auth (Google OAuth) → issues a JWT.
   - JWT stored in a secure, HTTP-only cookie.
2. **API Gateway**
   - Every request to `/v1/*` carries the Supabase JWT in the Authorization header.
   - Go middleware verifies token, extracts `user_id` from JWT claims, and enforces row-level security.
   - The `/api/*` path redirects to `/v1/*` for backward compatibility.

# AI Processing Design: Simplified Chat-Only Pipeline

The system is designed around a streamlined processing pipeline focused on enabling RAG-based chat functionality:

1.  **The Search-Enrichment Track:** This track's goal is to meticulously extract all text, generate embeddings, and prepare the data for the RAG-based chat feature. It runs automatically after PDF upload and includes:
    - PDF parsing and text extraction
    - Image analysis for content-rich images
    - Embedding generation for semantic search

**DEPRECATED:** The explanation and summary generation features have been removed. The system no longer generates slide-by-slide explanations or lecture summaries. Users interact with lecture content exclusively through the chat interface.

# Chat Feature (RAG-Based)

The system includes a RAG (Retrieval-Augmented Generation) chat feature that allows users to ask questions about their lectures:

- **Chat Management**: Users can create multiple chat conversations per lecture, each with a custom title
- **RAG Pipeline**:
  - Query rewriting for better semantic search
  - Vector similarity search using pgvector embeddings
  - Context retrieval from lecture chunks and slide images
  - LLM response generation with streaming support
- **Model Support**: Supports multiple LLM providers (OpenAI, Anthropic, Google Gemini, X.AI, DeepSeek) via Bring Your Own Key (BYOK)
- **Streaming**: Real-time streaming responses using Server-Sent Events (SSE) with AI SDK Data Stream Protocol
- **Title Generation**: Automatic chat title generation based on first user message and assistant response

# Database Schema

## Core Tables

- **courses**: User courses with default course support
- **user_profiles**: User profile information, API keys (encrypted in Secret Manager), and model preferences
- **lectures**: Lecture metadata, processing status, progress tracking
- **slides**: Slide records with raw text extraction
- **chunks**: Text chunks extracted from slides for embedding
- **slide_images**: Sub-images within slides with hash-based deduplication
- **explanations**: Slide-by-slide AI-generated explanations
- **summaries**: Lecture-level summary/cheatsheet
- **notes**: User-created notes per lecture
- **embeddings**: Vector embeddings for RAG search (pgvector, 1536 dimensions)
- **chats**: Chat conversations per lecture
- **messages**: Chat messages with parts (text, metadata)
- **dead_letter_messages**: Failed Pub/Sub messages for manual inspection

## Key Features

- Row Level Security (RLS) enabled on all tables
- Vector similarity search using IVFFlat index on embeddings
- Image hash-based deduplication for slide images
- Status tracking with multiple error detail fields (explanation_error_details, search_error_details)

# Format of messages in topics

1. ingestion

```json
{
  "lecture_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "storage_path": "lectures/55bdef4b-b9ac-4783-b8e4-87b47675333e/original.pdf",
  "customer_identifier": "customer_1",
  "name": "Hendrix Liu",
  "email": "hendrix@keywordsai.co"
}
```

2. image-analysis

```json
{
  "slide_image_id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "lecture_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "image_hash": "b432a1098fedcba",
  "customer_identifier": "customer_1",
  "name": "Hendrix Liu",
  "email": "hendrix@keywordsai.co"
}
```

3. embedding

```json
{
  "lecture_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customer_identifier": "customer_1",
  "name": "Hendrix Liu",
  "email": "hendrix@keywordsai.co"
}
```

4. summary (DEPRECATED - no longer published)

```json
{
  "lecture_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customer_identifier": "customer_1",
  "name": "Hendrix Liu",
  "email": "hendrix@keywordsai.co"
}
```

5. explanation (DEPRECATED - no longer published)

```json
{
  "lecture_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "slide_id": "c1b2a398-d4e5-f678-90ab-cdef12345678",
  "slide_number": 5,
  "total_slides": 30,
  "slide_image_path": "lectures/a1b2.../slides/5.png",
  "customer_identifier": "customer_1",
  "name": "Hendrix Liu",
  "email": "hendrix@keywordsai.co"
}
```

# The Full Data Flow, Step-by-Step

## Step 1: User Initiates Upload

- **Trigger:** The user selects one or more PDF files and clicks "Upload" in the Next.js application.
- **Action:**
  1.  The frontend sends a `POST` request to `/v1/lectures/batch-upload-url` with the course ID and array of filenames.
  2.  The Go API validates the user's course access and checks upload limits (if subscription-based limits are enforced).
  3.  For each file, the API creates a new record in the `lectures` table with a status of `uploading` and generates a unique storage path.
  4.  The API generates presigned URLs for direct S3 uploads (using AWS S3 SDK) and returns them to the frontend along with the lecture IDs.
  5.  The frontend uploads each PDF file directly to S3 using the provided presigned URLs (using @aws-sdk/lib-storage for multipart uploads).
  6.  Once all uploads are complete, the frontend calls `POST /v1/lectures/{lectureId}/upload-complete` for each lecture.
  7.  The API verifies the S3 file exists, updates the lecture status to `pending_processing`, and publishes a message to the Google Cloud Pub/Sub topic named `ingestion`. This message contains the unique ID of the lecture, storage path, and user information, kicking off the entire automated pipeline.

## Step 2: Ingestion and Dispatch Workflow

- **Trigger:** A message arrives from the `ingestion` topic, pushed to your Python API (`/ingestion`).
- **Action:** This service is a fast, mechanical dispatcher. It makes no external AI calls. Its modern implementation includes key improvements for robustness and data integrity.

  1.  **Preparation**: It receives the lecture ID and connects to the database.
  2.  **Verification & Setup**: It **verifies the lecture exists (a defensive subscriber pattern)**, and **clears any previous error details** from the `lectures` table. This ensures that retries start from a clean state. It then downloads the PDF from storage, and updates the lecture status to `parsing` while saving the total slide count.
  3.  **Page-by-Page Processing Loop**: It processes the PDF one page at a time. Each page's processing is wrapped in its own **atomic database transaction** to ensure data integrity.
      - **Create Slide & Chunks**: It extracts raw text and creates records for the slide and its text chunks.
      - **Render Main Image**: It renders the high-resolution, full-page image and saves its record.
      - **Process Sub-Images**: It finds all sub-images within the slide, computing a hash for each one.
        - It uses an in-memory map (`processed_images_map`) to track unique images.
        - If an image is new, it's uploaded, its details are added to the map, a new `slide_images` record is created, and an `image-analysis` job is added to an in-memory list.
        - If an image is a duplicate, a `slide_images` record is created using the existing path, and no new job is dispatched.
  4.  **Batch Dispatch**: After the loop finishes, it performs its dispatching operations.
      - It saves the final count of unique sub-images (`total_sub_images`) to the `lectures` table.
      - **DEPRECATED:** Explanation job publishing has been removed. The system no longer generates slide-by-slide explanations.
      - It publishes all the collected `image-analysis` jobs at once.
      - **Handle No-Image Case**: If `total_sub_images == 0`, it publishes the `embedding` job directly.
  5.  **Finalize**: It updates the lecture status to `processing` (skipping the deprecated `explaining` status).
  6.  **Robust Error Handling**: The entire process is wrapped in a `try/except` block. If any error occurs, the lecture status is set to `failed` with detailed error information, and the exception is re-raised to ensure the message is not lost.

## Step 3: Image Analysis

- **Trigger:** An `image-analysis` message arrives (only for unique images).
- **Action:** This handler performs a single AI analysis for each unique image, with improved observability and transaction management.

  1.  **Verification**: It receives the `slide_images` ID, **first verifies the associated lecture exists**, then fetches the corresponding image from storage.
  2.  **Make One LLM Call**: It sends the image to a multi-modal LLM, asking for the image's `type` (`content` or `decorative`), its `ocr_text`, and its `alt_text`. The implementation also includes a **mocking flag** to bypass the real LLM call for testing.
  3.  **Atomic Updates**: It uses a **tightly-scoped, atomic database transaction** for all write operations to ensure data consistency and minimize lock times.
      - **Propagate Results:** It runs an `UPDATE` query on the `slide_images` table **where the `lecture_id` and `image_hash` match**. This ensures the analysis is written to every record representing that unique image.
      - **The "Last Job" Logic:** It increments the `processed_sub_images` counter in the main `lectures` table.
  4.  **Trigger Embedding Job (If Last):** After the transaction is successfully committed, it checks if `processed_sub_images == total_sub_images`. If they match, it publishes the single `embedding` message.
  5.  **Granular Error Handling**: If an error occurs, it is caught, and a structured JSON error object is written to a dedicated `search_error_details` field in the `lectures` table before the exception is re-raised to trigger a Pub/Sub retry.

## Step 4: Creating Searchable Embeddings

- **Trigger:** The single message arrives from the `embedding` topic.
- **Action:** This service is highly optimized for performance and correctness.

  1.  **Verification**: It receives the `lecture_id` and **verifies the lecture still exists**.
  2.  **Efficient Data Fetching**: It queries the database to get all `chunks` and all content-rich `slide_images` for the entire lecture in **two efficient, bulk queries**, avoiding the N+1 problem. It then uses an in-memory dictionary for fast lookups.
  3.  **Handle No-Text Case**: It gracefully handles the edge case where a lecture contains no text chunks, logs a warning, and proceeds to finalize the track to unblock the pipeline.
  4.  **Enrich the Text**: For each chunk, it builds a richer block of text by combining the original chunk text with the `ocr_text` and `alt_text` from its associated content images. It adds explicit labels like `"OCR Text:"` to provide better semantic context for the embedding model.
  5.  **Generate Embeddings**: It sends all enriched text blocks to the OpenAI Embedding API in an efficient batch request. A mocking flag is also supported.
  6.  **Atomic Finalization**: The entire finalization process occurs within a **single atomic transaction**.
      - **Batch Upsert**: The returned vectors are saved to the `embeddings` table using a **performant batch `UPSERT` operation**, which is both fast and idempotent.
      - **Finalize Processing**: It sets `embeddings_complete = TRUE` and updates the lecture status to `complete`.
  7.  **Error Handling**: On failure, the lecture status is set to `failed` with error details.

## DEPRECATED: Step 5 - Generating Explanations

**This step has been removed from the data flow.** The system no longer generates slide-by-slide explanations. The code remains in the codebase but is commented out and marked as deprecated.

## DEPRECATED: Step 6 - Creating the Final Lecture Summary

**This step has been removed from the data flow.** The system no longer generates lecture summaries. The code remains in the codebase but is commented out and marked as deprecated.
