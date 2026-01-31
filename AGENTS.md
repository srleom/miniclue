# CLAUDE.md

MiniClue is an educational AI platform with three apps:

- **apps/web**: Next.js 16 (React 19) frontend
- **apps/backend**: Go 1.24+ API Gateway
- **apps/ai**: Python 3.13+ FastAPI microservices

Stack: Supabase (Postgres + Auth), Google Cloud Pub/Sub, OpenAI/Anthropic/Gemini.

## Quick Commands

```bash
# Root (Turborepo)
pnpm dev/build/test/lint/format

# To run the dev server for all apps, run:
pnpm conductor:run

# Backend (Go) - apps/backend
go run ./cmd/app # Dev server
make swagger # CRITICAL after API changes
go test ./...

# AI Service (Python) - apps/ai
poetry run start
poetry run pytest

# Frontend (Next.js) - apps/web
pnpm dev
pnpm openapi:all # CRITICAL after backend API changes
pnpm test:ts
```

## Critical Patterns

### Type Generation (MANDATORY for API changes)

1. Update Go handlers with Swagger comments
2. Run `make swagger` in apps/backend
3. Run `pnpm openapi:all` in apps/web → generates `src/types/api.ts`

### Database Schema

- Edit `apps/backend/supabase/schemas/schema.sql` directly
- **No manual migration files** - I will execute the migrations manually
- RLS enabled on all tables - always consider `user_id` restrictions

### Pub/Sub: "Defensive Subscriber" Pattern

**CRITICAL**: Every worker MUST check entity exists before processing. If missing, Ack the message without processing to prevent infinite retries.

Topics: `ingestion` (PDF parsing) → `embedding` (vectors) + `image-analysis` (VLM)

### Auth Flow

Supabase Google OAuth → JWT in cookie → Go Gateway validates → extracts `user_id` for RLS

### Code Organization

- **Backend (Go)**: `internal/{api/v1, service, repository, model, pubsub, middleware}` - All handlers need Swagger comments
- **AI (Python)**: `app/{routers, services, schemas, utils}` - SSE streaming for chat
- **Frontend (Next.js)**: `src/{lib/api, hooks, components, types}` - shadcn/ui patterns

## Architecture Notes

**Data Pipeline**: Ingestion worker extracts PDFs → dispatches to embedding (fast) + image-analysis (slow) workers in parallel

**Message Queue**: Push-based, 60s Ack deadline, exponential backoff (10s-10m), DLQ logs to DB at `/v1/dlq`

## Feature Implementation Flow (TDD - MANDATORY)

1. **Plan**: Use plan mode to identify tests needed and implementation approach
2. **Write Tests First**:
   - **Backend**: Create `*_test.go` files for handlers/services/repos
   - **AI**: Create test files in `tests/` directory
   - **Frontend**: Plan type checks and manual browser test scenarios
3. **Implement** (minimum code to pass tests):
   - **Schema** (if needed): Edit `schema.sql`, add RLS policies
   - **Backend**: Update Repository/Service/API, add Swagger comments, run `make swagger`
   - **AI Service** (if needed): Update schemas/routers, handle Pub/Sub messages
   - **Frontend**: Run `pnpm openapi:all`, implement UI
4. **Verify**: Run `go test ./...` (backend), `poetry run pytest` (AI), `pnpm test:ts` + browser testing (frontend)
5. **Mark complete** only after tests pass and verification succeeds

## Rules

- Always update GitHub Actions workflows when changing environment variables.
