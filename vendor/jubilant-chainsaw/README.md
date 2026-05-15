# Cortex Omni — AI Tutor Platform

This repository contains the Cortex Omni full-stack AI tutor platform.

## Project structure

- `artifacts/api-server/` — Express + TypeScript backend API
- `artifacts/cortex/` — React + Vite frontend app
- `lib/db/` — PostgreSQL schema and Drizzle ORM config
- `lib/api-spec/` — OpenAPI contract source
- `lib/api-client-react/` — Generated React Query hooks and API client
- `lib/api-zod/` — Generated Zod schemas and validators

## Current implementation status

### Implemented

- Frontend login / auth UI
- Upgrade modal and premium plan flow
- Study plan generation endpoint and UI panel
- Topic explanation endpoint for syllabus content
- Mock auth and payment routes for local flow
- OpenAPI schema and client hook generation
- Database schema config with Drizzle and seed scripts

### Incomplete / aspirational

- Teacher dashboard backend is not built (UI only)
- Analytics backend is not built
- Additional language support (10 languages) is not yet implemented
- Marketing claims such as "12+ languages", "6 pilot schools", and "94% improvement" are aspirational and not currently backed by product functionality

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Create a `.env` file at the repository root with values like:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cortex
SESSION_SECRET=your-random-secret
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai
OPENROUTER_MODEL=gpt-4o-mini
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com
AI_INTEGRATIONS_GEMINI_API_KEY=your-gemini-api-key-here
```

3. Push DB schema

```bash
pnpm --filter @workspace/db run push
```

4. Seed the database (if available)

```bash
pnpm exec tsx lib/db/scripts/seed.ts
```

5. Run the API server

```bash
pnpm --filter @workspace/api-server run dev
```

6. Run the frontend

```bash
pnpm --filter @workspace/cortex run dev
```

## Notes

- The `.env` file is ignored by `.gitignore` and should not be committed.
- This project is a work in progress and contains partial implementations aligned with the current roadmap.
- The README is intentionally explicit about what is built and what remains unfinished.
