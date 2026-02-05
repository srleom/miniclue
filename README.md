# MiniClue Technical Specification

**Version:** 1.0 | **Status:** Active Development

## 1. System Overview

MiniClue is an educational AI platform allowing students to upload lecture PDFs and interact with them via a RAG-based chat interface. The system automates the ingestion, text extraction, image analysis, and vector embedding of course materials to support context-aware Q&A.

This project is organized as a **monorepo** using [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/) to manage our frontend, backend, and AI services in a single repository.

> For more details on how to setup and contribute to the project, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

## 2. Project Structure

The codebase is divided into several applications and packages managed within the `apps/` directory.

### Applications

- **[`apps/web`](apps/web)**: Next.js 16 (React 19) frontend application. Dashboard, course management, and RAG chat UI.
- **[`apps/backend`](apps/backend)**: Golang 1.24+ API Gateway. Handles Auth, DB access, and orchestrates AI pipelines via Pub/Sub.
- **[`apps/ai`](apps/ai)**: Python 3.13 (FastAPI) microservices. Handles heavy-duty AI tasks like PDF parsing, OCR, and RAG.

### Tech Stack Summary

| Layer    | Component      | Technology                                                                                                                           |
| -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend | Web App        | Next.js 16 (React 19)<br>• TipTap Editor, React PDF Viewer<br>• Vercel AI SDK, PostHog Analytics<br>• HeyAPI Client (Auto-generated) |
| Backend  | API Gateway    | Golang 1.24+<br>• Huma v2 (OpenAPI 3.1)<br>• Middleware: CORS, Auth (JWT), Logging<br>• Automatic type generation                    |
| Backend  | AI Worker      | Python 3.13 (FastAPI)<br>• PyMuPDF (Parsing)<br>• OpenAI/Anthropic/Gemini (LLM & Embeddings)                                         |
| Async    | Message Queue  | Google Cloud Pub/Sub<br>• Push-based subscriptions                                                                                   |
| Data     | Database       | Supabase Postgres<br>• pgvector, Row Level Security (RLS)                                                                            |
| Data     | Object Storage | Supabase Storage (S3-compatible)                                                                                                     |

---

## 3. Getting Started

Since this is a monorepo, you can manage all services from the root directory.

### Prerequisites

- **Node.js**: >= 20.x
- **pnpm**: >= 10.x
- **Go**: >= 1.24
- **Python**: 3.13 (AI app requires 3.13; 3.14 is not yet supported by pydantic-core/PyO3)
- **Poetry**: For Python dependency management
- **Docker**: For local Pub/Sub emulator

### Quick Start

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure Environment:**
   Each app has its own `.env.example`. Copy them to `.env` and fill in the required values.

   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/backend/.env.example apps/backend/.env
   cp apps/ai/.env.example apps/ai/.env
   ```

3. **Run all services in development mode:**

   ```bash
   pnpm dev
   ```

4. **Build all applications:**
   ```bash
   pnpm build
   ```

---

## 4. Core Data Pipelines (Ingestion & RAG)

The pipeline is designed for robustness and concurrency. The ingestion service acts as a dispatcher, splitting work into a fast "Embedding" track and a slower "Image Analysis" track.

### 3.1 Workflow Visualizer

```mermaid
sequenceDiagram
    participant User
    participant GoAPI as Go API Gateway
    participant DB as Supabase DB
    participant PubSub as Google Pub/Sub
    participant Ingest as Python: Ingestion
    participant Embed as Python: Embedding
    participant Vision as Python: Image Analysis

    User->>GoAPI: Upload PDF (Batch)
    GoAPI->>User: Return Presigned S3 URLs
    User->>DB: Upload directly to Storage
    User->>GoAPI: POST /upload-complete
    GoAPI->>PubSub: Publish to [ingestion] topic

    PubSub->>Ingest: Push Message
    Note over Ingest: 1. Validate Lecture Exists<br>2. Parse PDF & Extract Text<br>3. Render Slide Images<br>4. Identify Unique Sub-images

    par Concurrent Dispatch
        Ingest->>PubSub: Publish to [embedding]
        Ingest->>PubSub: Publish to [image-analysis] (x N unique images)
    end

    Note over Embed: 1. Fetch all text chunks<br>2. Batch Generate Embeddings<br>3. UPSERT to DB<br>4. Mark Status: Complete

    Note over Vision: 1. Send Image to Gemini<br>2. Extract OCR & Alt Text<br>3. Update Slide Records

```

### 3.2 Step-by-Step Logic

#### **Step 1: Upload & Trigger**

- **Frontend**: Requests presigned URLs from Go API (`/v1/lectures/batch-upload-url`).
- **Storage**: Frontend uploads directly to Supabase Storage (S3).
- **Trigger**: Frontend notifies Go API (`/upload-complete`), which sets status to `pending_processing` and publishes to the `ingestion` topic.

#### **Step 2: Ingestion & Dispatch (Python)**

- **Role**: Mechanical dispatcher. No external AI calls.
- **Process**:

1. Verifies lecture existence (Defensive Subscriber).
2. Iterates through PDF pages inside atomic DB transactions.
3. Extracts raw text (Chunks) and renders full-slide images.
4. Detects sub-images; uses hashing to deduplicate against `processed_images_map`.
5. **Dispatch**: Concurrently publishes one `embedding` job and `image-analysis` jobs.

#### **Step 3: Image Analysis (Python)**

- **Role**: Enriches visual data.
- **Process**:

1. Receives `slide_image_id`.
2. Calls Gemini to extract `ocr_text`, `alt_text`, and `image_type`.
3. Updates all `slide_images` records matching the hash (propagating results to duplicates).

#### **Step 4: Embedding (Python)**

- **Role**: Enables Search. Optimized for speed.
- **Process**:

1. Fetches all text chunks for the lecture (does _not_ wait for Image Analysis).
2. Generates vectors using Gemini in a single batch.
3. Performs Batch UPSERT to `embeddings` table.
4. Updates lecture status to `complete`.

---

## 4. API Reference (Gateway)

**Base URL**: `https://api.miniclue.com` (Prod) | `/v1` prefix required

**API Documentation**:

- **OpenAPI 3.1 Spec**: `GET /v1/openapi.json` - Auto-generated from code
- **Type Generation**: Frontend automatically generates TypeScript types from OpenAPI spec
- **Interactive Docs**: Visit `/docs` for Swagger UI (coming soon)

**Developer Workflow**:

1. Update backend handler → Restart server
2. OpenAPI spec auto-updates at `/v1/openapi.json`
3. Run `pnpm openapi:generate` in frontend to regenerate types
4. File watcher auto-detects changes during `pnpm dev` (polls every 2s)

### Course & Lecture Management

| Method | Endpoint                            | Description                                     |
| ------ | ----------------------------------- | ----------------------------------------------- |
| `POST` | `/v1/courses`                       | Create a new course container.                  |
| `GET`  | `/v1/lectures`                      | List lectures (Query: `?course_id=`, `limit=`). |
| `POST` | `/v1/lectures/batch-upload-url`     | Get presigned S3 URLs for uploading PDFs.       |
| `POST` | `/v1/lectures/{id}/upload-complete` | Trigger the ingestion processing pipeline.      |
| `GET`  | `/v1/lectures/{id}/url`             | Get a signed download URL for the original PDF. |

### Chat & Streaming

| Method | Endpoint                                    | Description                                              |
| ------ | ------------------------------------------- | -------------------------------------------------------- |
| `POST` | `/v1/lectures/{id}/chats`                   | Initialize a new chat session.                           |
| `POST` | `/v1/lectures/{id}/chats/{chatId}/stream`   | **SSE Stream**. Uses Vercel AI SDK Data Stream Protocol. |
| `GET`  | `/v1/lectures/{id}/chats/{chatId}/messages` | History fetch for chat UI.                               |

### User & Config

| Method | Endpoint               | Description                                          |
| ------ | ---------------------- | ---------------------------------------------------- |
| `GET`  | `/v1/users/me`         | Fetch profile and settings.                          |
| `POST` | `/v1/users/me/api-key` | Securely store BYOK LLM keys.                        |
| `POST` | `/v1/dlq`              | **Internal**: Webhook for Pub/Sub Dead Letter Queue. |

---

## 5. Event-Driven Architecture (Internal)

### 5.1 Pub/Sub Configuration

- **Subscription Type**: Push (to Python Service HTTP endpoints).
- **Ack Deadline**: 60s (Auto-extended by client library for long-running jobs).
- **Retry Policy**: Exponential backoff (Min: 10s, Max: 10m).
- **Dead Letter Queue**: Max delivery attempts exceeded DLQ Topic Pushed to Gateway `/v1/dlq` for DB logging.

### 5.2 Topics & Push Endpoints

| Topic Name       | Push Target (Python) | Purpose                                    |
| ---------------- | -------------------- | ------------------------------------------ |
| `ingestion`      | `/ingestion`         | PDF parsing and job dispatching.           |
| `embedding`      | `/embedding`         | Vector generation and status finalization. |
| `image-analysis` | `/image-analysis`    | VLM calls for sub-images.                  |

### 5.3 Message Schemas

**Ingestion Payload:**

```json
{
  "lecture_id": "UUID",
  "storage_path": "lectures/{id}/original.pdf",
  "customer_identifier": "string",
  "name": "string",
  "email": "string"
}
```

**Image Analysis Payload:**

```json
{
  "slide_image_id": "UUID",
  "lecture_id": "UUID",
  "image_hash": "string (for deduplication)",
  "customer_identifier": "string",
  "name": "string",
  "email": "string"
}
```

**Embedding Payload:**

```json
{
  "lecture_id": "UUID",
  "customer_identifier": "string",
  "name": "string",
  "email": "string"
}
```

---

## 6. Data Persistence (Schema)

### Database: Supabase Postgres

- **Vector Search**: `pgvector` (1536 dimensions, IVFFlat index).
- **Security**: RLS enabled on all tables.

### Key Tables

- `courses` / `user_profiles`: Standard SaaS entities.
- `lectures`: Stores processing status (`uploading`, `parsing`, `complete`, `failed`) and error logs.
- `slides`: Raw text extracted per page.
- `slide_images`: Hash-based deduplication. Stores `ocr_text` and `alt_text`.
- `embeddings`: Text vectors linked to chunks.
- `chats` / `messages`: Conversation history.

---

## 7. Infrastructure & Reliability Patterns

### 7.1 Authentication Flow

1. **Frontend**: Auth via Supabase (Google OAuth). JWT stored in HTTP-Only cookie.
2. **Request**: Client sends request to Go Gateway with `Authorization: Bearer <JWT>`.
3. **Gateway**: Middleware validates JWT signature and extracts `user_id` for RLS context.

### 7.2 The "Defensive Subscriber" Pattern

Pub/Sub does not support deleting in-flight messages. To handle race conditions (e.g., user deletes a lecture while it is processing):

- **Rule**: Every worker must query the database to confirm the entity (`lecture_id` or `slide_id`) exists **before** processing.
- **Action**: If the entity is missing, the worker must **Ack** the message (mark as successful) to remove it from the queue without taking further action.

### 7.3 Environment Configuration

- **Local**: Gateway (`:8080`), Python Svc (`:8000`)
- **Staging**: `stg.api.miniclue.com` / `stg.svc.miniclue.com`
- **Production**: `api.miniclue.com` / `svc.miniclue.com`

### 7.4 Required Environment Variables

> See `.env.example` in the respective repositories for the required environment variables.
