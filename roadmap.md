# ROADMAP (checklist style; every item cites PLAN IDs)

## Phase 0 — Setup
- [ ] Repo, monorepo layout (README), Docker Postgres, Prisma init, ESLint/Prettier
- [ ] Common: errors, envelope, zod, rbac middleware, audit, auth skeleton

## Phase 1 — People & Structure (AUTH, ACA, STU, PAR, TCH, INQ)
- [ ] AUTH-01..08 · ACA-01..06 · STU-01..11 · PAR-01..03 · TCH-01..06 · INQ-01..05

## Phase 2 — Daily Operations (ATT, LV, TT)
- [ ] ATT-01..09 · LV-01..06 · TT-01..05

## Phase 3 — Money (FEE)
- [ ] FEE-01..13 (invoices job, payments, receipts, defaulters, reminders)

## Phase 4 — Academics (HW, SM, EX)
- [ ] HW-01..06 · SM-01..04 · EX-01..09

## Phase 5 — Visibility (COM, DASH, REP, SYS)
- [ ] COM-01..04 · DASH-01..04 · REP-01..04 · SYS-01..06

## Phase 6 — Hardening
- [ ] CSV exports, pagination everywhere, audit verification, rate limits, backup script, seed data

## Phase 7 — Supabase Migration (see DEPLOYMENT.md)
- [ ] Create Supabase project → apply migrations → switch DATABASE_URL → storage bucket → deploy API → smoke test → cutover

## Phase 8 — Mobile Ready
- [ ] Verify every PLAN module reachable via API only; document push adapter plan (COM-05)