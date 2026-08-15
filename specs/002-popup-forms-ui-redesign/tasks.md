# Tasks: Modal & Popup Forms UI/UX Redesign

**Input**: Design documents from `/specs/002-popup-forms-ui-redesign/`  
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

---

## Phase 1: Setup (Design System Tokens & CSS Utilities)

**Purpose**: Verify custom CSS tokens and utility classes for glassmorphic modal overlays, dark headers, and pill action buttons

- [ ] T001 Verify modal backdrop, glassmorphism, and border-radius tokens in `src/index.css`
- [ ] T002 [P] Verify responsive scrolling rules (`max-height: 90vh`, `overflow-y: auto`) in `src/index.css`

---

## Phase 2: Foundational (Shared Modal Layout Contracts)

**Purpose**: Establish uniform `#0F172A` dark header styling, Emerald `#10B981` badge styling, and dual-convention action button layouts

- [ ] T003 [P] Verify visual contract and reusable style objects per `specs/002-popup-forms-ui-redesign/contracts/popup-forms-design-contract.md`
- [ ] T004 [P] Ensure clean modal chaining and single backdrop unmounting logic across modal triggers

---

## Phase 3: User Story 1 - Unified Admission & Student Management Popups (Priority: P1) 🎯 MVP

**Goal**: Redesign all student registration, editing, fee payment, and credential slip dialogs to use the dark slate header, grouped white cards, and pill buttons matching the reference design.

**Independent Test**: Open "Add New Student", verify dark `#0F172A` header with emerald badge, fill in student details across grouped cards, submit, and verify the styled `CredentialSlipModal` displays with critical security callout, monospace credentials, emerald password badges, and action pills.

### Implementation Tasks for User Story 1

- [ ] T005 [P] [US1] Redesign `RegisterStudentModal.tsx` with `#0F172A` header, Emerald icon badge, grouped cards (*Profile*, *Guardian*, *Academic & Fee*), and right-aligned pill buttons in `src/components/RegisterStudentModal.tsx`
- [ ] T006 [P] [US1] Redesign `EditStudentModal.tsx` with `#0F172A` header, Emerald icon badge, grouped cards, and paired pill buttons in `src/components/EditStudentModal.tsx`
- [ ] T007 [P] [US1] Redesign `QuickPaymentModal.tsx` with `#0F172A` header, Emerald badge, payment method selector card, and confirm payment pill in `src/components/QuickPaymentModal.tsx`
- [ ] T008 [P] [US1] Redesign `StudentIDCardModal.tsx` with `#0F172A` header, Emerald badge, high-res ID badge preview card, and print action pills in `src/components/StudentIDCardModal.tsx`
- [ ] T009 [US1] Ensure `CredentialSlipModal.tsx` perfectly aligns with reference screenshot (critical security notice callout, monospace usernames, emerald password pills, 3-column action row, and full-width `✓ Done & Close`) in `src/components/CredentialSlipModal.tsx`
- [ ] T010 [US1] Verify student directory modal open/close integrations and state refreshes in `src/pages/StudentsView.tsx`

**Checkpoint**: User Story 1 delivers a complete, independently testable Student Popup MVP!

---

## Phase 4: User Story 2 - Elevated Faculty Onboarding & Management Popups (Priority: P1)

**Goal**: Redesign faculty onboarding, evaluation, and substitution popups with the dark `#0F172A` header, emerald badge, and grouped cards.

**Independent Test**: Open "Add Faculty Member", verify the dark header with emerald badge, enter qualifications into grouped cards, submit to save, and open the teacher evaluation popup.

### Implementation Tasks for User Story 2

- [ ] T011 [P] [US2] Redesign `AddTeacherModal.tsx` with `#0F172A` header, Emerald badge, grouped cards (*Personal Info*, *Contact*, *Academic Qualifications*, *Custom Fields*), and right-aligned paired pill buttons in `src/components/AddTeacherModal.tsx`
- [ ] T012 [P] [US2] Redesign `TeacherEvaluationModal.tsx` with `#0F172A` header, Emerald badge, category rating slider cards, and submit evaluation pill in `src/components/TeacherEvaluationModal.tsx`
- [ ] T013 [P] [US2] Redesign `SubstituteTeacherModal.tsx` with `#0F172A` header, Emerald badge, substitute teacher picker card, date picker, and save assignment pill in `src/components/SubstituteTeacherModal.tsx`
- [ ] T014 [US2] Connect faculty creation, evaluation, and substitution triggers in `src/pages/TeachersView.tsx`

**Checkpoint**: User Stories 1 and 2 operate independently with 100% visual consistency.

---

## Phase 5: User Story 3 - Class & Batch Creation with Capacity Controls (Priority: P1)

**Goal**: Redesign batch creation, capacity limits, and section splitting dialogs with the dark `#0F172A` header, emerald badge, and grouped schedule cards.

**Independent Test**: Open "Create Batch", verify dark `#0F172A` header with emerald badge, enter schedule/capacity details into grouped cards, and submit to save the batch.

### Implementation Tasks for User Story 3

- [ ] T015 [P] [US3] Redesign `CreateBatchModal.tsx` with `#0F172A` header, Emerald badge, grouped cards (*Class Level & Name*, *Timing & Days*, *Seat Capacity & Room*), and paired pill buttons in `src/components/CreateBatchModal.tsx`
- [ ] T016 [P] [US3] Redesign `SplitBatchModal.tsx` with `#0F172A` header, Emerald badge, seat redistribution preview card, and confirm split pill in `src/components/SplitBatchModal.tsx`
- [ ] T017 [US3] Verify batch creation and section management modal flows in `src/pages/BatchesView.tsx`

**Checkpoint**: User Stories 1, 2, and 3 provide a unified modal experience across all three core modules!

---

## Phase 6: User Story 4 - Bulk Operations & CSV Ingestion Popups (Priority: P2)

**Goal**: Redesign bulk student CSV roster ingestion and grade advancement dialogs to use the dark header, dropzone container cards, and action pills.

**Independent Test**: Open "Import CSV", verify dark `#0F172A` header, dashed dropzone card with cloud icon, sample download pill, and column mapping preview.

### Implementation Tasks for User Story 4

- [ ] T018 [P] [US4] Redesign `BulkImportModal.tsx` with `#0F172A` header, Emerald badge, dashed CSV dropzone card with cloud icon, sample template pill, and import action pill in `src/components/BulkImportModal.tsx`
- [ ] T019 [P] [US4] Redesign `ClassPromotionModal.tsx` with `#0F172A` header, Emerald badge, batch advancement selector cards, and confirm promotion pill in `src/components/ClassPromotionModal.tsx`
- [ ] T020 [US4] Verify bulk import and promotion triggers in `src/pages/StudentsView.tsx`

**Checkpoint**: All 4 user stories are fully implemented and verified!

---

## Phase 7: Polish & Quality Verification

**Purpose**: Cross-cutting design taste verification, end-to-end test execution, and cleanup

- [ ] T021 [P] Conduct UI/UX Taste Audit on all 12 redesigned modals verifying `#0F172A` headers, Emerald `#10B981` badges, grouped cards, monospace badges, and pill buttons
- [ ] T022 [P] Verify TypeScript compilation with `tsc --noEmit` across client and server
- [ ] T023 Run automated Playwright end-to-end verification suite in `test_quickstart_scenarios.cjs`
- [ ] T024 Perform manual verification against scenarios in `specs/002-popup-forms-ui-redesign/quickstart.md`

---

## Dependencies & Execution Order

```
[Phase 1: Setup]
       │
       ▼
[Phase 2: Foundational (Layout Contracts & Overlay Rules)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[Phase 3: US1 - Student Modals (P1)] [Phase 4: US2 - Faculty (P1)] [Phase 5: US3 - Batches (P1)]
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       │
                                       ▼
                       [Phase 6: US4 - Bulk Operations (P2)]
                                       │
                                       ▼
                       [Phase 7: Polish & E2E Validation]
```

---

## Parallel Opportunities

- **Phase 1 & 2**: `T001`, `T002`, `T003`, `T004` can run in parallel.
- **Phase 3 (US1)**: `T005` (RegisterModal), `T006` (EditModal), `T007` (PaymentModal), `T008` (IDCardModal) can run in parallel.
- **Phase 4 (US2)**: `T011` (AddTeacherModal), `T012` (EvaluationModal), `T013` (SubstituteModal) can run in parallel.
- **Phase 5 (US3)**: `T015` (CreateBatchModal), `T016` (SplitBatchModal) can run in parallel.
- **Phase 6 (US4)**: `T018` (BulkImportModal), `T019` (ClassPromotionModal) can run in parallel.
- **Phase 7**: `T021` (Taste Audit) and `T022` (TypeScript check) can run in parallel.
