# DEVELOPMENT GUIDE

## Env (server/.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/academy
JWT_ACCESS_SECRET=... JWT_REFRESH_SECRET=... ACCESS_TTL=15m REFRESH_TTL=7d
UPLOAD_DIR=./uploads  (Phase 2: SUPABASE_URL, SUPABASE_SERVICE_KEY, bucket=academy-files)

## Code Rules
- One module folder per PLAN module; files: routes.ts, schema.ts(zod), service.ts, repo.ts
- No raw SQL except migrations; no cross-module DB calls; business rules live in ONE service (ARCHITECTURE.md)
- Every route: validate → rbac → service; every money/attendance/marks write → audit()
- Soft deletes for students, batches, invoices; hard deletes forbidden on fees/attendance
- Pagination: ?page&pageSize (max 100); dates ISO; amounts integer paise OR 2-decimal numeric — pick numeric(10,2) and stick to it

## Git
branches: phase-1/auth, phase-1/students ... commits: `feat(ATT-03): bulk mark present`
PR must cite PLAN IDs; PR adding unlisted feature = rejected.

## Testing
- Unit: fees overdue calc, pass/fail, capacity check, attendance lock
- API smoke per module before phase close; seed script with 1 admin/2 teachers/20 students/2 batches

## AI USAGE RULES
Always attach PLAN.md + this file to the AI context. Prompt format:
"Implement EXACTLY <IDs>. Use DATABASE_SCHEMA.md tables and API_SPEC.md routes. Do not add fields/endpoints."