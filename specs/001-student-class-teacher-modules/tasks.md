# Tasks: Student, Class, and Teacher Core Modules

**Input**: Design documents from `/specs/001-student-class-teacher-modules/`  
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment and dependency verification across client and server

- [x] T001 Verify project structure, Node.js runtime, and dependencies in `package.json` and `server/package.json`
- [x] T002 [P] Verify PostgreSQL database connection string and environment variables in `server/.env`
- [x] T003 [P] Synchronize and validate Prisma ORM schema definitions in `server/prisma/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend routing, validation envelope, and authentication middleware

- [x] T004 Verify standard API envelope `{ success, data, error, meta }` helper in `server/src/common/envelope.ts`
- [x] T005 [P] Verify JWT authentication guard and role middleware in `server/src/common/auth.ts`
- [x] T006 [P] Verify persistent audit trail utility function in `server/src/common/audit.ts`
- [x] T007 [P] Configure typed client API fetch wrapper and token handling in `src/api/apiClient.ts`
- [x] T008 Verify design system CSS tokens, glassmorphism utilities, and animation classes in `src/index.css`

---

## Phase 3: User Story 1 - Register Student with Automatic Class & Fee Provisioning (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to register a new student with auto-generated admission numbers (`ACAD-2026-XXX`), assign classes/batches, and automatically provision monthly fee plans.

**Independent Test**: Register a new student via modal, verify the record appears in the database and directory table, and confirm an active `StudentFeePlan` and `Enrollment` record are created.

### Implementation Tasks for User Story 1

- [x] T009 [P] [US1] Define student registration Zod validation schema in `server/src/routes.ts`
- [x] T010 [US1] Implement `POST /api/v1/students` endpoint with automatic admission number generation, fee plan creation, and enrollment in `server/src/routes.ts`
- [x] T011 [US1] Add `createStudent` client method with typed payload in `src/api/apiClient.ts`
- [x] T012 [P] [US1] Build `RegisterStudentModal` component with curated palette, glassmorphism, and explicit action buttons in `src/components/RegisterStudentModal.tsx`
- [x] T013 [US1] Integrate `RegisterStudentModal` submission into `src/pages/StudentsView.tsx` with instant table refresh
- [x] T014 [US1] Record `CREATE_STUDENT` event in `audit_logs` table upon student creation in `server/src/routes.ts`

**Checkpoint**: User Story 1 delivers a complete, independently testable Student Admission MVP!

---

## Phase 4: User Story 2 - Faculty Onboarding & Batch Assignment (Priority: P1)

**Goal**: Enable administrators to onboard faculty members with qualifications, provision linked user authentication accounts, and assign them to lead academic batches.

**Independent Test**: Add a new teacher via modal, verify linked User creation (`role='teacher'`), assign them to a batch, and test that deleting an assigned teacher is blocked until batches are reassigned.

### Implementation Tasks for User Story 2

- [x] T015 [P] [US2] Define teacher onboarding and update Zod validation schema in `server/src/routes.ts`
- [x] T016 [US2] Implement `POST /api/v1/teachers` endpoint with bcrypt password hashing and linked user record in `server/src/routes.ts`
- [x] T017 [US2] Implement `PUT /api/v1/teachers/:id` endpoint for profile updates in `server/src/routes.ts`
- [x] T018 [US2] Implement guarded `DELETE /api/v1/teachers/:id` blocking deletion if active batches exist in `server/src/routes.ts`
- [x] T019 [P] [US2] Add `getTeachers`, `createTeacher`, `updateTeacher`, and `deleteTeacher` client methods in `src/api/apiClient.ts`
- [x] T020 [P] [US2] Build `AddTeacherModal` with qualification inputs and taste standards in `src/components/AddTeacherModal.tsx`
- [x] T021 [P] [US2] Build `TeacherProfileDrawer` displaying assigned batches and contact channels in `src/components/TeacherProfileDrawer.tsx`
- [x] T022 [US2] Connect faculty creation, drawer inspection, and deletion guard handling in `src/pages/TeachersView.tsx`

**Checkpoint**: User Stories 1 and 2 operate independently with complete faculty management and scheduling integrity.

---

## Phase 5: User Story 3 - Academic Batch Creation with Capacity & Schedule Controls (Priority: P1)

**Goal**: Allow administrators to create classes and batches, set maximum capacity limits, and enforce capacity ceilings during student enrollments with an administrative override path.

**Independent Test**: Create a batch with capacity 25, attempt to enroll 26 students to verify capacity rejection, and test the admin override workflow with audit trail verification.

### Implementation Tasks for User Story 3

- [x] T023 [P] [US3] Define batch creation and enrollment Zod validation schemas in `server/src/routes.ts`
- [x] T024 [US3] Implement `GET /api/v1/classes` and `GET /api/v1/batches` endpoints in `server/src/routes.ts`
- [x] T025 [US3] Implement `POST /api/v1/batches` and `PUT /api/v1/batches/:id` endpoints in `server/src/routes.ts`
- [x] T026 [US3] Implement `POST /api/v1/batches/:id/enroll` with capacity checking and admin override logic in `server/src/routes.ts`
- [x] T027 [P] [US3] Add `getClasses`, `getBatches`, `createBatch`, `updateBatch`, and `enrollStudentInBatch` methods in `src/api/apiClient.ts`
- [x] T028 [P] [US3] Build `CreateBatchModal` with time picker, room, and capacity limits in `src/components/CreateBatchModal.tsx`
- [x] T029 [US3] Integrate batch roster inspection and student enrollment/removal controls in `src/pages/BatchesView.tsx`
- [x] T030 [US3] Record `BATCH_CAPACITY_OVERRIDE` event in `audit_logs` upon admin override in `server/src/routes.ts`

**Checkpoint**: User Stories 1, 2, and 3 provide a resilient, capacity-constrained academic core!

---

## Phase 6: User Story 4 - Student 360 Profile & Multi-Action Workspace (Priority: P2)

**Goal**: Provide a comprehensive 360° student drawer with attendance summaries, fee balance indicators, quick payment triggers, status transitions (`left`/`suspended` fee plan freeze), and ID card generation.

**Independent Test**: Open the student drawer, verify attendance/fee widgets render correctly, perform a quick payment, and test that setting status to 'left' freezes the recurring fee plan while retaining invoice history.

### Implementation Tasks for User Story 4

- [x] T031 [P] [US4] Implement student departure fee plan freezing logic on `PUT /api/v1/students/:id` in `server/src/routes.ts`
- [x] T032 [P] [US4] Build `StudentProfileDrawer` with glassmorphic cards, fee badges, and action shortcuts in `src/components/StudentProfileDrawer.tsx`
- [x] T033 [P] [US4] Build `QuickPaymentModal` with payment methods (Cash, UPI, Bank) and auto receipt in `src/components/QuickPaymentModal.tsx`
- [x] T034 [P] [US4] Build `StudentIDCardModal` and `CredentialSlipModal` with QR codes in `src/components/StudentIDCardModal.tsx` and `src/components/CredentialSlipModal.tsx`
- [x] T035 [US4] Integrate student 360 drawer and quick payment flows into `src/pages/StudentsView.tsx`

**Checkpoint**: User Story 4 delivers an efficient, context-rich operational workspace for staff.

---

## Phase 7: User Story 5 - Bulk Student Roster Operations & CSV Pipeline (Priority: P3)

**Goal**: Allow administrators to import student rosters via CSV, perform bulk batch transfers, and export filtered directory datasets.

**Independent Test**: Upload a CSV roster via the modal, verify all students and classes are created, and execute a bulk batch transfer on selected students.

### Implementation Tasks for User Story 5

- [x] T036 [P] [US5] Implement `POST /api/v1/students/bulk` for batch roster CSV ingestion in `server/src/routes.ts`
- [x] T037 [P] [US5] Implement `POST /api/v1/students/bulk-transfer` and `POST /api/v1/students/bulk-delete` in `server/src/routes.ts`
- [x] T038 [P] [US5] Add `bulkImportStudents`, `bulkTransferStudents`, and `bulkDeleteStudents` methods in `src/api/apiClient.ts`
- [x] T039 [P] [US5] Build `BulkImportModal` with sample template download and validation in `src/components/BulkImportModal.tsx`
- [x] T040 [P] [US5] Build `ClassPromotionModal` for bulk grade advancement in `src/components/ClassPromotionModal.tsx`
- [x] T041 [US5] Integrate multi-student checkbox selection, bulk transfer bar, and CSV export in `src/pages/StudentsView.tsx`

**Checkpoint**: All 5 user stories are fully implemented and verified!

---

## Phase 8: Polish & Quality Verification

**Purpose**: Cross-cutting design taste verification, end-to-end test execution, and cleanup

- [x] T042 [P] Conduct UI/UX Taste Audit on all modals and drawers verifying glassmorphism (`blur(16px)`), curated HSL/HEX palettes, 12px+ rounded corners, and explicit action labels
- [x] T043 [P] Verify TypeScript compilation with `tsc --noEmit` across client and server
- [x] T044 Execute Playwright end-to-end verification suite in `test_e2e_full_flow.cjs`
- [x] T045 Execute full interactive button and modal audit in `test_all_buttons.cjs`
- [x] T046 Perform end-to-end validation against scenarios in `specs/001-student-class-teacher-modules/quickstart.md`

---

## Dependencies & Execution Order

```
[Phase 1: Setup]
       │
       ▼
[Phase 2: Foundational (Envelope, Auth, Audit, API Client, CSS)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[Phase 3: US1 - Student Admin (P1)] [Phase 4: US2 - Faculty (P1)] [Phase 5: US3 - Batches (P1)]
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       │
                                       ▼
                       [Phase 6: US4 - Student 360 Workspace (P2)]
                                       │
                                       ▼
                       [Phase 7: US5 - Bulk Operations & CSV (P3)]
                                       │
                                       ▼
                       [Phase 8: Polish & Quality Verification]
```

---

## Parallel Opportunities

- **Phase 1**: `T002` (Env check) and `T003` (Prisma check) run in parallel.
- **Phase 2**: `T005` (Auth), `T006` (Audit), `T007` (API Client), and `T008` (CSS) run in parallel.
- **Phase 3 (US1)**: `T009` (Zod schema) and `T012` (RegisterStudentModal UI) run in parallel.
- **Phase 4 (US2)**: `T015` (Zod schema), `T019` (API Client), `T020` (AddTeacherModal), and `T021` (TeacherProfileDrawer) run in parallel.
- **Phase 5 (US3)**: `T023` (Zod schema), `T027` (API Client), and `T028` (CreateBatchModal) run in parallel.
- **Phase 6 (US4)**: `T031` (Freeze logic), `T032` (StudentDrawer), `T033` (PaymentModal), and `T034` (IDCardModal) run in parallel.
- **Phase 7 (US5)**: `T036` (Bulk API), `T037` (Transfer API), `T039` (BulkImportModal), and `T040` (ClassPromotionModal) run in parallel.
- **Phase 8**: `T042` (Taste Audit) and `T043` (TypeScript check) run in parallel.

---

## Implementation Strategy & MVP Scope

1. **MVP Scope (Phase 1 → Phase 3)**:
   - Complete Setup & Foundation.
   - Implement User Story 1 (`T009` - `T014`) to provide end-to-end student registration with fee plan generation and directory display.
   - Validate independently.
2. **Core Faculty & Academic Structure (Phase 4 → Phase 5)**:
   - Onboard faculty with user accounts and deletion guards (`T015` - `T022`).
   - Create batches with capacity enforcement and admin overrides (`T023` - `T030`).
3. **Advanced Workspaces & Bulk Operations (Phase 6 → Phase 7)**:
   - Add 360° profile drawer, departure billing freezes, quick payments (`T031` - `T035`).
   - Deliver CSV bulk roster import, class promotions, and bulk transfers (`T036` - `T041`).
4. **Taste Audit & E2E Validation (Phase 8)**:
   - Execute Playwright suites and verify compliance with Constitution v1.1.0 (`T042` - `T046`).
