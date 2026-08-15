# ARCHITECTURE

## High-level (Phase 1 — local)
```
[React Client] --HTTPS--> [Express API /api/v1] --Prisma--> [PostgreSQL (Docker local)]
                                 |
                          [local disk /uploads] (files)
```

## High-level (Phase 2 — Supabase)
```
[React Client] --HTTPS--> [Express API on Render/Railway] --Prisma--> [Supabase Postgres]
                                 |
                          [Supabase Storage] (files)
```
NO rewrite: Prisma schema unchanged; only DATABASE_URL changes; upload adapter switches
from local disk to Supabase Storage behind one interface `FileStore`.

## Layers (server)
1. routes → 2. zod validation → 3. rbac middleware → 4. service (business rules) →
5. repository (Prisma) → 6. audit/logger. Services never called across modules except via
explicit imports (e.g., fees service calls notifications service).

## Auth Flow
login → verify bcrypt → issue access JWT (role, userId) + refresh JWT (httpOnly cookie, stored
hashed in `refresh_tokens` table) → /auth/refresh rotates → logout revokes.

## Business Rules Location (single place each)
- Capacity check: enrollments service (ACA-05)
- Overdue calc: fees service (FEE-09)
- Pass/fail: tests service (EX-04)
- Attendance lock: attendance service (ATT-06)
- Teacher scoping ("own batches"): common/rbac helper `assertOwnBatch(teacherId, batchId)`

## Notifications
All events insert into `notifications` (event-driven in code, no queues in Phase 1).
Phase 2 adds push/email adapters reading the same table.

## Security
- Helmet, cors whitelist, rate-limit on /auth, Zod everywhere, parameterized via Prisma,
  RBAC on every route, audit on STU/ATT/FEE/EX/SYS writes, secrets only in env.