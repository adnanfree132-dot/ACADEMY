# Tasks: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals

**Input**: Design documents from `specs/005-student-conduct-logs-rbac/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/conduct-logs-api.json`, `quickstart.md`)

**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/conduct-logs-api.json`

**Organization**: Phased implementation tasks organized by foundational infrastructure and user stories to enable incremental delivery and testing.

---

## Phase 1: Setup & Data Foundation

**Purpose**: Database schema models, seed fixtures, and shared type definitions.

- [X] T001 [P] Define `ConductLog` and `ParentStudent` models with relations and indexes in `server/prisma/schema.prisma`
- [X] T002 Generate Prisma Client and apply migrations to local database via `server/prisma`
- [X] T003 [P] Add seed data with diverse sample conduct logs and parent-student links in `server/prisma/seed.ts`
- [X] T004 [P] Define TypeScript interfaces for `ConductLog`, `ParentStudent`, and API payloads in `src/types.ts`
- [X] T005 [P] Create Zod validation schemas for conduct log creation and updates in `server/src/validations/conductLogValidation.ts`

---

## Phase 2: Foundational API & Client Services

**Purpose**: Core API client and authorization middleware shared across all user stories.

- [X] T006 [P] Implement `api.conductLogs` methods (`getStudentConductLogs`, `createConductLog`, `updateConductLog`, `deleteConductLog`, `getMyChildren`) in `src/api/apiClient.ts`
- [X] T007 Implement batch ownership check and conduct authorization helpers (`canModifyConductLog`) in `server/src/common/auth.ts`

---

## Phase 3: User Story 1 (Priority: P1) - Conduct Log Creation & Recording 🎯 MVP

**Goal**: Allow Super Admins and assigned Teachers to record categorized student conduct notes and view them in a live timeline.

**Independent Test**: Create a conduct log with category, severity, and remark text; verify it immediately renders in the student's Conduct timeline with author attribution and relative timestamp.

- [X] T008 [US1] Implement `POST /api/v1/students/:studentId/conduct-logs` endpoint with Zod validation and audit logging in `server/src/routes.ts`
- [X] T009 [US1] Implement `GET /api/v1/students/:studentId/conduct-logs` endpoint with role-based query filtering in `server/src/routes.ts`
- [X] T010 [US1] Refactor Conduct tab in `src/components/StudentProfileDrawer.tsx` to fetch live conduct logs from API and render categorized cards
- [X] T011 [US1] Build quick-add conduct remark form in `src/components/StudentProfileDrawer.tsx` with category selector, severity flags, and confidentiality toggle

**Checkpoint**: User Story 1 is functional as a standalone MVP increment.

---

## Phase 4: User Story 2 (Priority: P1) - Role-Based Editing & Deletion Permissions

**Goal**: Enable Super Admins and authoring Teachers to edit and soft-delete their own conduct logs, while restricting non-author colleagues to read-only access.

**Independent Test**: Create a log as Teacher A, verify Teacher A can edit/delete it, verify Teacher B cannot edit/delete it, and verify Super Admin has universal edit/delete access.

- [X] T012 [US2] Implement `PUT /api/v1/conduct-logs/:id` route enforcing Author-or-Admin permission checks and audit logging in `server/src/routes.ts`
- [X] T013 [US2] Implement `DELETE /api/v1/conduct-logs/:id` route performing non-destructive soft deletion (`is_deleted=true`, `deleted_at`, `deleted_by`) in `server/src/routes.ts`
- [X] T014 [P] [US2] Create `ConductLogEditModal.tsx` following the mandatory Floating Island Modal Architecture in `src/components/ConductLogEditModal.tsx`
- [X] T015 [US2] Connect Edit modal and soft-delete confirmation popover to conduct cards in `src/components/StudentProfileDrawer.tsx`

**Checkpoint**: User Stories 1 and 2 are fully integrated with strict RBAC security.

---

## Phase 5: User Story 3 (Priority: P2) - Teacher Portal Integrated Conduct Entry & Batch Scoping

**Goal**: Enable Teachers to log conduct notes directly from classroom batch rosters without requiring admin access, while preventing access to unassigned batches.

**Independent Test**: Log in as a Teacher, navigate to assigned batch roster in `Teachers.tsx`, open student conduct drawer, and log a note. Verify access is denied for students outside assigned batches.

- [X] T016 [US3] Integrate quick conduct logging trigger and student drawer launcher from batch student rosters in `src/pages/Teachers.tsx`
- [X] T017 [US3] Enforce teacher batch scoping boundary in `server/src/routes.ts` returning 403 Forbidden for students in unassigned batches

---

## Phase 6: User Story 4 (Priority: P2) - Student & Parent Multi-Role Scoped Access & Log Visibility

**Goal**: Provide Parent and Student portals with access to official positive feedback and commendations while securely suppressing confidential staff notes.

**Independent Test**: Create one public and one confidential conduct note. Log in as Student or Parent and verify confidential notes are 100% hidden.

- [X] T018 [US4] Implement `GET /api/v1/parents/my-children` endpoint linking parent users to registered children in `server/src/routes.ts`
- [X] T019 [US4] Add confidentiality filter in `GET /api/v1/students/:studentId/conduct-logs` ensuring `is_confidential = true` records are excluded for `student` and `parent` roles in `server/src/routes.ts`
- [X] T020 [P] [US4] Implement read-only student/parent conduct feedback views with praise badges in `src/components/StudentProfileDrawer.tsx`

---

## Phase 7: Polish, Quality Gates & Verification

**Purpose**: Cross-cutting quality checks, compiler verification, and end-to-end smoke testing.

- [X] T021 [P] Verify full-stack TypeScript builds with `npm run build` across frontend (`d:/academy`) and backend (`d:/academy/server`)
- [X] T022 Execute multi-role validation scenarios from `specs/005-student-conduct-logs-rbac/quickstart.md`
- [X] T023 Verify compliance with Constitution Principle IV (Floating Island Modals, single-line badges, and curated color palettes)


---

## Dependencies & Execution Order

```text
Phase 1: Setup & Data Foundation (T001-T005)
   │
   ▼
Phase 2: Foundational Services (T006-T007)
   │
   ├───────────────────────────────┐
   ▼                               ▼
Phase 3: US1 Creation MVP (T008-T011)  Phase 4: US2 RBAC Edit/Delete (T012-T015)
   │                               │
   ├───────────────────────────────┘
   ▼
Phase 5: US3 Teacher Portal (T016-T017)
   │
   ▼
Phase 6: US4 Multi-Role & Parent Isolation (T018-T020)
   │
   ▼
Phase 7: Polish & Verification (T021-T023)
```

---

## Parallel Opportunities

- **Phase 1**: `T001` (Prisma schema), `T003` (Seed fixtures), `T004` (Types), and `T005` (Validation schemas) can run in parallel.
- **Phase 2**: `T006` (API client) and `T007` (Auth helpers) can run in parallel.
- **Phase 4**: `T014` (`ConductLogEditModal.tsx`) can be built in parallel with backend endpoints `T012`/`T013`.
- **Phase 6**: `T020` (Parent/Student view) can be developed in parallel with backend `T018`/`T019`.

---

## Implementation Strategy

1. **MVP First (Phases 1, 2, 3)**:
   - Deliver basic conduct logging (Create & Read timeline with categories) for Super Admins and Teachers.
2. **Incremental Polish (Phases 4, 5, 6)**:
   - Add author-or-admin editing/deleting with Floating Island modal.
   - Embed within Teacher Portal classroom roster views.
   - Enforce Student & Parent multi-tenant confidentiality boundaries.
3. **Validation (Phase 7)**:
   - Complete build checks and live browser smoke testing.
