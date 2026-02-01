# CLAUDE.md

MiniClue is an educational AI platform with three apps:

- **apps/web**: Next.js 16 (React 19) frontend
- **apps/backend**: Go 1.24+ API Gateway
- **apps/ai**: Python 3.13+ FastAPI microservices

Stack: Supabase (Postgres + Auth), Google Cloud Pub/Sub, OpenAI/Anthropic/Gemini.

## Quick Commands

```bash
# Root - Run all services with Conductor
pnpm conductor:run

# Root - Turborepo commands (run from project root)
pnpm dev      # Start all apps in dev mode
pnpm build    # Build all apps
pnpm test     # Run all tests
pnpm lint     # Lint all apps
pnpm format   # Format all code

# Backend (Go) - run from apps/backend/
go run ./cmd/app           # Start dev server
make swagger               # Generate Swagger docs (CRITICAL after API changes)
go test ./...              # Run all tests
make setup-pubsub-local    # Setup Pub/Sub emulator topics/subscriptions

# AI Service (Python) - run from apps/ai/
poetry run start    # Start FastAPI server
poetry run pytest   # Run tests

# Frontend (Next.js) - run from apps/web/
pnpm dev           # Start Next.js dev server
pnpm openapi:all   # Generate TypeScript types from backend Swagger (CRITICAL after backend API changes)
pnpm test:ts       # Type check
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

## Feature/Fix Implementation Flow (MANDATORY)

1. **Plan**: Use plan mode to identify implementation approach, edge cases, and verification strategy

2. **Implement with Tests** (write implementation and tests together):

   **If changing database schema:**
   - Edit `apps/backend/supabase/schemas/schema.sql` directly
   - Add RLS policies for new tables (consider `user_id` restrictions)
   - Do NOT create migration files - User will execute migrations manually

   **If changing backend API:**
   - Update Repository/Service/API code with implementation
   - Write corresponding tests in `*_test.go` files (handlers/services/repos packages)
   - Add/update Swagger comments on Go handlers in `apps/backend/internal/api/v1/`
   - From `apps/backend/`: run `make swagger` to regenerate Swagger docs
   - Ensure backend is running
   - From `apps/web/`: run `pnpm openapi:all` to generate TypeScript types
   - Verify `apps/web/src/types/api.ts` is updated

   **If changing AI service:**
   - Update schemas/routers in `apps/ai/app/` with implementation
   - Write corresponding tests in `tests/` directory
   - Handle Pub/Sub message format changes if needed

   **If changing frontend:**
   - Implement UI using generated types from `src/types/api.ts`
   - Define manual browser test scenarios for verification using Claude Chrome extension

3. **Verify Immediately** (run tests and fix if needed):
   - **Backend**: `cd apps/backend && go test ./...`
   - **AI**: `cd apps/ai && poetry run pytest`
   - **Frontend**: `cd apps/web && pnpm test:ts` + execute browser test scenarios

   **Alternatively**: Run `pnpm conductor:run` from root to start all services and verify end-to-end

4. **Format and Lint** (from project root):
   - Run `pnpm check` to verify all code is formatted, linted, and tested
   - Fix all errors if any appear
   - Re-run until no errors remain

5. **Iterate**: If any step fails (tests, formatting, linting), fix and re-verify from that step

6. **Mark complete** only after all tests pass, code is formatted, and no linting errors remain

## Rules

- Always update GitHub Actions workflows and .env.example when changing environment variables.
