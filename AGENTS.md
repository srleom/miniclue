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

## Feature Implementation Flow (TDD - MANDATORY)

1. **Plan**: Use plan mode to identify implementation approach and tests needed

2. **Write Tests First**:
   - **Backend**: Create `*_test.go` files in appropriate packages (handlers/services/repos)
   - **AI**: Create test files in `tests/` directory
   - **Frontend**: Plan type checks and manual browser test scenarios

3. **Implement** (minimum code to pass tests):

   **If changing database schema:**
   - Edit `apps/backend/supabase/schemas/schema.sql` directly
   - Add RLS policies for new tables (consider `user_id` restrictions)
   - User will execute migrations manually - do NOT create migration files

   **If changing backend API:**
   - Update Repository/Service/API code
   - Add/update Swagger comments on Go handlers in `apps/backend/internal/api/v1/`
   - From `apps/backend/`: run `make swagger` to regenerate Swagger docs
   - Ensure backend is running
   - From `apps/web/`: run `pnpm openapi:all` to generate TypeScript types
   - Verify `apps/web/src/types/api.ts` is updated

   **If changing AI service:**
   - Update schemas/routers in `apps/ai/app/`
   - Handle Pub/Sub message format changes if needed

   **If changing frontend:**
   - Implement UI using generated types from `src/types/api.ts`

4. **Verify** (run from appropriate directory):
   - apps/backend: `cd apps/backend && go test ./...`
   - apps/ai: `cd apps/ai && poetry run pytest`
   - apps/web: `cd apps/web && pnpm test:ts` + browser testing

   Alternatively:
   - Run `pnpm conductor:run` from root to start all services in development mode and verify the changes.

5. **Mark complete** only after all tests pass and verification succeeds

## Rules

- Always update GitHub Actions workflows and .env.example when changing environment variables.
