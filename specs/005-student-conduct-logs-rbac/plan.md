# Implementation Plan: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals

**Branch**: `005-student-conduct-logs-rbac` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-student-conduct-logs-rbac/spec.md`

---

## Summary

Implement a full-stack vertical slice for Student Conduct & Behavior Logs with strict Role-Based Access Control (RBAC). Enables Super Admins and Teachers to record categorized behavioral incidents and commendations, allows Super Admins to edit/delete any log, empowers authoring teachers to modify their own logs while restricting peer teachers to read-only access, and enforces multi-tenant confidentiality boundaries so sensitive staff notes are shielded from Student and Parent portals.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ / React 18.2+  
**Primary Dependencies**: Express 4, Prisma Client 5, Zod 3.24, Lucide React, Tailwind / Vanilla CSS  
**Storage**: PostgreSQL (via Supabase / Local PostgreSQL) / SQLite for local development (`dev.db`) with Prisma ORM  
**Testing**: Playwright automated E2E audits, REST API integration scripts, `tsc` compilation checks  
**Target Platform**: Responsive Web (Desktop, Tablet & Mobile Chrome/Safari)  
**Project Type**: Full-Stack Web Application (React SPA + Express API Backend)  
**Performance Goals**: < 100ms API response for conduct queries; instant optimistic client updates; < 3 click teacher workflows  
**Constraints**: Zero hard deletes (soft-delete with audit trails); strict confidential note isolation; Floating Island Modal Architecture on all forms  
**Scale/Scope**: Multi-batch academy with hundreds of students, thousands of conduct logs, and multi-tenant Parent/Student/Teacher access  

---

## Constitution Check

*GATE: Must pass before implementation. Evaluated against `/memory/constitution.md`.*

| Principle | Compliance Status | Architectural Justification |
| :--- | :---: | :--- |
| **I. Full-Stack Vertical Slices** | ✅ PASS | Implemented across all 4 layers: Frontend UI component (`StudentProfileDrawer`), API Client (`apiClient.ts`), Backend Express Router with Zod validation (`routes.ts`), and Prisma ORM Schema (`ConductLog`, `ParentStudent`). |
| **II. Layered Architecture** | ✅ PASS | Routes strictly delegate through JWT authentication (`authenticateJwt`), role verification (`requireRole`), payload validation (Zod schemas), service/database mutations, and audit logging. |
| **III. Soft Deletes & Auditing** | ✅ PASS | Conduct logs implement soft-deletion (`is_deleted`, `deleted_at`, `deleted_by`) preserving historical integrity; all mutations emit entries to `audit_logs`. |
| **IV. UI/UX Taste Standards** | ✅ PASS | Conduct timeline features categorized HSL badges (*Emerald Commendation*, *Rose Infraction*, *Amber Warning*), micro-animations, and uses the **Floating Island Modal Architecture** for all edit modals and confirmation dialogs. |
| **V. Multi-Role RBAC** | ✅ PASS | Strict 4-role hierarchy (`admin`, `teacher`, `student`, `parent`); author-or-admin ownership checks; automatic filtering of `is_confidential = true` records for parents and students. |
| **VI. Quality Gates** | ✅ PASS | `tsc` compilation checks, Playwright UI/button tests, and deterministic database seeding in `prisma/seed.ts`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-student-conduct-logs-rbac/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Phase 1 Prisma models & Zod validation
├── quickstart.md        # Phase 1 verification workflows
├── contracts/           # Phase 1 API schema contracts
│   └── conduct-logs-api.json
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Modifications

```text
d:/academy/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # [MODIFY] Add ConductLog & ParentStudent models
│   │   └── seed.ts               # [MODIFY] Seed sample conduct logs & parent links
│   └── src/
│       ├── common/
│       │   ├── auth.ts           # [VERIFY] Role checking utilities
│       │   └── audit.ts          # [USE] Audit logger for conduct mutations
│       └── routes.ts             # [MODIFY] Add /api/v1/conduct-logs & /api/v1/students/:id/conduct-logs
├── src/
│   ├── api/
│   │   └── apiClient.ts          # [MODIFY] Add conductLogs API client methods
│   ├── types.ts                  # [MODIFY] Add ConductLog & ParentStudent TypeScript interfaces
│   ├── components/
│   │   ├── StudentProfileDrawer.tsx # [MODIFY] Live Conduct timeline, Add/Edit/Delete flows, RBAC buttons
│   │   └── ConductLogEditModal.tsx  # [NEW] Floating Island modal for editing conduct notes
│   └── pages/
│       ├── Teachers.tsx          # [MODIFY] Quick conduct entry from Teacher batch roster
│       └── Students.tsx          # [VERIFY] Conduct integration
```

---

## Implementation Phases

### Phase 0: Schema & Database Layer
1. Update `server/prisma/schema.prisma` with `ConductLog` and `ParentStudent` models.
2. Run `npx prisma db push` / `npx prisma generate` to sync Prisma client.
3. Update `server/prisma/seed.ts` with diverse sample logs across categories (Commendation, Infraction, Academic, Attendance, General) with varying confidentiality.

### Phase 1: Backend Express API & RBAC Routes
1. Add Zod validation schemas for conduct log creation and updates.
2. Implement endpoints in `server/src/routes.ts`:
   - `GET /api/v1/students/:studentId/conduct-logs` (Filtered by role and confidentiality).
   - `POST /api/v1/students/:studentId/conduct-logs` (Admin & assigned teacher only).
   - `PUT /api/v1/conduct-logs/:id` (Admin & author teacher only).
   - `DELETE /api/v1/conduct-logs/:id` (Admin & author teacher only; soft delete).
3. Connect audit logging to record all state modifications.

### Phase 2: Frontend API Client & TypeScript Interfaces
1. Add `ConductLog` interface and payload types to `src/types.ts`.
2. Add `api.conductLogs` helper methods to `src/api/apiClient.ts` with offline fallback for static deployments.

### Phase 3: Frontend UI & Floating Island Modal Integration
1. Build `ConductLogEditModal.tsx` following the mandatory Floating Island Architecture.
2. Refactor Conduct tab in `StudentProfileDrawer.tsx` to display live logs, author badges, categories, quick-add input with category selection, and role-conditioned Edit/Delete controls.
3. Integrate Teacher Portal quick conduct logging from classroom batch rosters.
4. Verify Student & Parent views suppress confidential records.

### Phase 4: Verification & E2E Validation
1. Verify with `npm run build` across frontend and backend.
2. Execute validation workflows from `quickstart.md`.

---

## Complexity Tracking

*No constitutional violations detected. Full compliance achieved.*
