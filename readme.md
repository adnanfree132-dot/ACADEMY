# Academy Management System (Web → Mobile later)

## Overview
Web app for small/medium academies: students, teachers, parents, attendance, fees,
tests, homework, announcements. API-first so the same backend powers a future mobile app.

## Source of Truth
`PLAN.md` is the ONLY feature list. AI/developers must not build anything not in it.

## Tech Stack (fixed — do not change without updating docs)
- Frontend: React + Vite + TypeScript + React Router + TanStack Query + Axios
- Backend: Node.js + Express + TypeScript + Zod (validation)
- ORM: Prisma
- DB Phase 1: PostgreSQL 16 (Docker, local)
- DB Phase 2: Supabase (managed Postgres) — same Prisma schema, only DATABASE_URL changes
- Auth: bcrypt + JWT (access 15m / refresh 7d httpOnly)

## Repository Layout
```
/academy
  /client        # React app
  /server        # Express API
    /src
      /modules   # auth, students, attendance, fees, ... (one folder per PLAN module)
      /common    # auth middleware, rbac, errors, logger, audit
      /prisma    # schema.prisma, migrations, seed.ts
  /docs          # all .md files
```

## Quickstart (local)
```
docker run -d --name academy-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
cd server && npm i && npx prisma migrate dev && npx prisma db seed && npm run dev
cd client && npm i && npm run dev
```

## Docs Index
PLAN.md · PRD.md · ARCHITECTURE.md · DATABASE_SCHEMA.md · API_SPEC.md ·
ROADMAP.md · DEVELOPMENT_GUIDE.md · DEPLOYMENT.md