# Tasks: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Input**: Design documents from `/specs/007-advanced-fee-billing-installments/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-contracts.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`, `US4`, `US5`)
- Strict checklist format with exact file paths

---

## Phase 1: Setup & Foundational (Prerequisites)

**Purpose**: Database schema migrations, utility algorithms, and shared types.

- [X] T001 Update Prisma schema with models `StudentFeePlan`, `Batch`, `Enrollment`, `FeeInvoice`, and `StudentInstallmentSchedule` in `server/prisma/schema.prisma`
- [X] T002 Synchronize Prisma database schema and client via `npx prisma generate` and `npx prisma db push` in `server/`
- [X] T003 [P] Implement pro-rata arithmetic, Banker's penny balancing, date-clamping, and installment calculation algorithms in `server/src/utils/billingUtils.ts`
- [X] T004 [P] Create frontend client-side fee calculation, discount percentage, and pro-rata preset helpers in `src/utils/feeCalculator.ts`
- [X] T005 [P] Update shared TypeScript interfaces with scholarship types, installment schedule models, and coverage period fields in `src/types.ts`

---

## Phase 2: User Story 1 - Scholarship & Custom Fee Plan at Student Registration (Priority: P1) 🎯 MVP

**Goal**: Configure base tuition fee, scholarship discount (% or fixed PKR), reason, and custom fee terms directly inside `RegisterStudentModal` and `EditStudentModal` with live mathematical breakdowns.

**Independent Test**: Register a new student with a 25% Merit Scholarship and a custom base fee. The created student profile immediately reflects the discounted net fee and correct initial invoice voucher.

- [X] T006 [US1] Implement student registration fee processing and fee plan endpoints in `server/src/routes.ts` (`POST /api/v1/students` and `PUT /api/v1/students/:id/fee-plan`) with Zod validation
- [X] T007 [P] [US1] Add `updateStudentFeePlan` method and extended student creation payload in `src/api/apiClient.ts`
- [X] T008 [US1] Update `src/components/RegisterStudentModal.tsx` with Floating Island Scholarship & Custom Fee Plan section (base tuition fee, scholarship discount %/fixed, reason dropdown with `ModernSelect`, and live reactive calculation breakdown card)
- [X] T009 [P] [US1] Update `src/components/EditStudentModal.tsx` to support editing scholarship terms, reasons, and custom base fees with live fee breakdown

**Checkpoint**: At this point, User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 3: User Story 2 - From-To Coverage Dates & Anchor-Date Recurring Billing (Priority: P1)

**Goal**: Every invoice voucher explicitly displays "From [Date] to [Date]" coverage periods, anchors recurring fees to student start dates (e.g. 15th to 14th), and applies a 5-day due date window.

**Independent Test**: Enroll a student on August 15. Verify that the initial fee voucher specifies `15-Aug-2026 to 14-Sep-2026`, sets due date to `20-Aug-2026`, and sets next cycle anchor to `15-Sep-2026`.

- [X] T010 [US2] Update invoice creation and recurring billing routes in `server/src/routes.ts` to compute and store `fee_period_start`, `fee_period_end`, and 5-day due date offsets from anchor days
- [X] T011 [P] [US2] Update `src/components/FeeSlipModal.tsx` to display explicit `From [Date] to [Date]` coverage range, anchor cycle, and 5-day due date window on printable/WhatsApp slips
- [X] T012 [P] [US2] Update `src/components/RecordFeeModal.tsx` and `src/components/StudentLedgerModal.tsx` to display explicit coverage periods and cycle anchor badges
- [X] T013 [US2] Update `src/pages/FeesView.tsx` to show From-To coverage date columns, cycle badges, and single-line status indicators

**Checkpoint**: User Stories 1 AND 2 work together seamlessly.

---

## Phase 4: User Story 3 - Prorated Mid-Month Admission Fee with Editable Admin Override (Priority: P1)

**Goal**: Auto-calculate proposed half-month or daily prorated fees when admission falls mid-cycle ($\ge 16$th), with 1-click preset chips and full manual override control.

**Independent Test**: Select an admission date of August 18 for a 4,000 PKR monthly fee. The modal proposes 2,000 PKR (`[ 50% Half-Month ]`), but allows the admin to edit this value to 1,500 PKR before confirming.

- [X] T014 [US3] Implement mid-month admission pro-rata fee calculation and manual override handler in `server/src/routes.ts` (`POST /api/v1/students`)
- [X] T015 [US3] Update `src/components/RegisterStudentModal.tsx` to detect mid-cycle admission dates, render `[ 50% Half-Month ]` and `[ Exact Daily Pro-Rata ]` preset chips, and bind to the editable initial fee override field

**Checkpoint**: User Stories 1, 2, and 3 are fully operational.

---

## Phase 5: User Story 4 - Batch/Course Installment Billing with Auto-Calculated Due Dates (Priority: P2)

**Goal**: Divide total fixed-duration course fees into $N$ installments, auto-calculate distributed due dates across start and end dates with Banker's penny balancing, issuing voucher 1 immediately and scheduling subsequent installments.

**Independent Test**: Create a 3-month course running Aug 1 to Oct 31 with a 15,000 PKR total fee in 3 installments. Verify that the system schedules 3 installments of 5,000 PKR, issues Installment 1 immediately at enrollment, and schedules installments 2 and 3 for automatic generation.

- [X] T016 [US4] Implement batch course plan creation (`POST /api/v1/batches`) and installment schedule generator (`POST /api/v1/batches/:id/enroll`) in `server/src/routes.ts` with Banker's penny balancing, issuing voucher 1 immediately and storing future scheduled installments in `StudentInstallmentSchedule`
- [X] T017 [P] [US4] Add `getStudentInstallmentSchedule` method and batch course configuration payloads in `src/api/apiClient.ts`
- [X] T018 [US4] Update `src/pages/BatchesView.tsx` and `src/components/CreateModal.tsx` to configure `course_type`, `total_fee`, `start_date`, `end_date`, `default_installments`, and `section_name`
- [X] T019 [P] [US4] Update `src/components/StudentProfileDrawer.tsx` to add an **Installment Schedule & Roadmap** tab displaying scheduled installments and active vouchers

**Checkpoint**: Fixed-duration course installment plans operate alongside monthly recurring tuition.

---

## Phase 6: User Story 5 - Mid-Batch Enrollment with Individual Extended Completion Timelines (Priority: P2)

**Goal**: Accommodate mid-batch late joiners with options to either align to batch end (pro-rata duration toggle vs full course fee) or extend their individual completion date with customized installment schedules.

**Independent Test**: Enroll Student A in Month 2 of a 3-month batch. Choose "Extend Student Timeline" extending completion from Oct 31 to Nov 30. Verify Student A's installment schedule spans September to November while the parent batch timeline remains intact.

- [X] T020 [US5] Extend `POST /api/v1/batches/:id/enroll` in `server/src/routes.ts` to handle late enrollments with "Align to Batch End" (pro-rata duration toggle or full fee) and "Extend Student Timeline" (customized end date and schedule)
- [X] T021 [US5] Create `src/components/EnrollStudentBatchModal.tsx` adhering to Floating Island Modal Architecture, providing late enrollment choices, pro-rata toggle, and custom end date picker with `ModernDatePicker`
- [X] T022 [US5] Integrate `EnrollStudentBatchModal.tsx` into `src/pages/BatchesView.tsx` and `src/pages/StudentsView.tsx`

**Checkpoint**: All 5 user stories are completely implemented and integrated.

---

## Phase 7: Polish, Verification & Quality Assurance

**Purpose**: Multi-layer verification, automated testing, and Constitution UI/UX taste audit.

- [X] T023 [P] Execute TypeScript compilation verification (`npx tsc --noEmit`) across client (`d:/academy`) and backend (`d:/academy/server`)
- [X] T024 Create and execute automated end-to-end verification script `test_feature_007_fees.cjs` validating all 5 quickstart scenarios
- [X] T025 Audit all modified UI components for strict compliance with Constitution Principle IV (Floating Island Architecture, zero Unicode emojis, theme-matching slate Lucide icons, `ModernSelect`, `ModernDatePicker`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup & Foundational)**: Must complete before any user story begins (BLOCKING).
- **Phase 2 (User Story 1 - MVP)**: Can start immediately after Phase 1.
- **Phase 3 (User Story 2)**: Builds upon Phase 1 & 2 invoice models.
- **Phase 4 (User Story 3)**: Enhances User Story 1 registration flow with pro-rata presets.
- **Phase 5 (User Story 4)**: Course installment engine building upon Phase 1 & 2 models.
- **Phase 6 (User Story 5)**: Extends User Story 4 batch enrollment for late joiners.
- **Phase 7 (Polish & Verification)**: Final end-to-end audit across all user stories.

### Parallel Opportunities

- `T003`, `T004`, `T005` in Phase 1 can be developed simultaneously.
- `T007`, `T009` in Phase 2 can proceed in parallel with frontend UI development.
- `T011`, `T012` in Phase 3 can be updated in parallel across slip and ledger modals.
- `T017`, `T019` in Phase 5 can be implemented in parallel with batch creation.
- `T023`, `T025` in Phase 7 can run alongside automated test execution.

---

## Implementation Strategy (MVP First)

1. **Step 1**: Execute Phase 1 (Schema & Core Calculation Utilities).
2. **Step 2**: Execute Phase 2 (User Story 1 - Scholarship & Custom Fee Plan at Registration) -> **Validate MVP**.
3. **Step 3**: Execute Phase 3 & 4 (Coverage Dates, Anchor Billing & Prorated Mid-Month Overrides).
4. **Step 4**: Execute Phase 5 & 6 (Batch Course Installments & Mid-Batch Late Enrollments).
5. **Step 5**: Execute Phase 7 (Full Verification & Taste Standard Audit).
