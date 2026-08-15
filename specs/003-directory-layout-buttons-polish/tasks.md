# Tasks: Directory Page Layout, Table Alignment & Button Design Polish

**Input**: Design documents from `/specs/003-directory-layout-buttons-polish/`  
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

---

## Phase 1: Setup (Design System Tokens & CSS Utilities)

**Purpose**: Implement canonical `.data-table`, `.header-action-bar`, `.table-action-group`, and `.badge-group` classes in `src/index.css`.

- [x] T001 Define `.directory-header-container`, `.header-action-bar`, `.header-btn-utility`, and `.header-btn-primary` with `white-space: nowrap` and 36px height in `src/index.css`
- [x] T002 [P] Define `.data-table-container`, `.data-table`, `.data-table thead th`, and `.data-table tbody td` with strict `vertical-align: middle` (60px height) in `src/index.css`
- [x] T003 [P] Define `.table-action-group`, `.table-icon-btn` (28px square/round with hover scale), and `.badge-group` in `src/index.css`

---

## Phase 2: Foundational (Layout & Typography Verification)

**Purpose**: Verify typography scaling, color tokens, and table baseline alignment rules.

- [x] T004 [P] Verify color variables and elevation shadows for table action badges and utility buttons in `src/index.css`
- [x] T005 [P] Verify responsive scrolling and wrap protection rules for directory action bars in `src/index.css`

---

## Phase 3: User Story 1 - Streamlined Directory Header & Theme-Cohesive Action Toolbar (Priority: P1) 🎯 MVP

**Goal**: Redesign the Students Directory top action bar with auto-wrap protection, unified 36px button heights, and distinct theme hierarchy.

**Independent Test**: Open the Students Directory, verify that all 6 action buttons (`Leave Requests`, `Promote Class`, `Bulk Print Cards`, `Import CSV`, `Export CSV`, `+ Add New Student`) render on a single clean line without awkward two-line text wrapping or mismatched heights.

### Implementation Tasks for User Story 1

- [x] T006 [P] [US1] Refactor the top header action button bar in `src/pages/StudentsView.tsx` to use `.header-action-bar`, `.header-btn-utility`, and `.header-btn-primary` with single-line typography
- [x] T007 [P] [US1] Polish the Search bar and Segmented Filter control tabs in `src/pages/StudentsView.tsx` with unified heights (40px search, 34px tabs) and aligned count badges
- [x] T008 [US1] Verify header responsiveness and visual hierarchy between primary CTA and utility buttons in `src/pages/StudentsView.tsx`

**Checkpoint**: User Story 1 eliminates all button bulkiness and multi-line wrapping in the header!

---

## Phase 4: User Story 2 - Pixel-Perfect Table Alignment, Typography & Badge Hierarchy (Priority: P1)

**Goal**: Enforce strict vertical centering (`vertical-align: middle`), 60px row heights, and clean horizontal badge layouts across all student table rows.

**Independent Test**: Inspect the Students Directory table; verify that student names, parent info, unit batches, fee statuses, and status badges align to a perfect vertical center with distinct typographic contrast.

### Implementation Tasks for User Story 2

- [x] T009 [P] [US2] Apply `.data-table` and `.data-table-container` classes to the main student roster table in `src/pages/StudentsView.tsx`
- [x] T010 [P] [US2] Refactor `REG NO & NAME` and `PARENT & CONTACT` cell layouts with clear typographic hierarchy and consistent line heights in `src/pages/StudentsView.tsx`
- [x] T011 [P] [US2] Refactor `STATUS` and `FEE STATUS` table cells to use horizontal `.badge-group` (`[ Active ]` `[ 94% Att. ]` side-by-side) in `src/pages/StudentsView.tsx`

**Checkpoint**: User Stories 1 and 2 deliver clean, beautifully aligned directory rows!

---

## Phase 5: User Story 3 - Consolidated, Modern Table Actions (Priority: P1)

**Goal**: Reorganize the `ACTIONS` column into a streamlined action group with primary `View` button and 28px icon buttons.

**Independent Test**: Inspect the `ACTIONS` column in the student table; verify the primary `View` button paired with compact 28px icon buttons (`PhoneCall`, `Award`, `ShieldCheck`, `Edit`, `Trash2`) with micro-scale hover transitions (`scale: 1.08`).

### Implementation Tasks for User Story 3

- [x] T012 [P] [US3] Refactor the `ACTIONS` table cell in `src/pages/StudentsView.tsx` to use `.table-action-group` and `.table-icon-btn` with 28px dimensions
- [x] T013 [P] [US3] Connect unified dialer popover (`PhoneCall`), ID card trigger (`Award`), credentials slip trigger (`ShieldCheck`), edit modal (`Edit`), and archive modal (`Trash2`) with themed hover colors in `src/pages/StudentsView.tsx`
- [x] T014 [US3] Verify alignment of `ACTIONS` column header with table action buttons in `src/pages/StudentsView.tsx`

**Checkpoint**: Table actions are compact, beautiful, and effortless to click!

---

## Phase 6: User Story 4 - Cross-Module Consistency across Teachers, Batches & Fees (Priority: P2)

**Goal**: Roll out the unified header action bar, table alignment, and action button system to Faculty and Batch directories.

**Independent Test**: Navigate to Teachers and Batches views; verify identical header styling, table alignment, and button aesthetics.

### Implementation Tasks for User Story 4

- [x] T015 [P] [US4] Apply `.header-action-bar`, `.data-table`, and `.table-action-group` to the Faculty Directory in `src/pages/TeachersView.tsx`
- [x] T016 [P] [US4] Apply `.header-action-bar` and unified card/table alignment to the Academic Batches view in `src/pages/BatchesView.tsx`
- [x] T017 [P] [US4] Ensure exam marksheet and fee ledger tables in `src/pages/SecondaryViews.tsx` adhere to `.data-table` vertical alignment rules

**Checkpoint**: All directory views across the entire application share a cohesive, polished design!

---

## Phase 7: Polish & Quality Verification

**Purpose**: Automated type check, E2E test verification, and visual inspection.

- [x] T018 [P] Run `npx tsc --noEmit` to verify type safety across all modified views
- [x] T019 Run Playwright validation suite `node test_quickstart_scenarios.cjs` to confirm 0 console errors and 100% scenario pass rate
- [x] T020 Perform visual verification of Students Directory layout against reference design

---

## Dependencies & Execution Order

```
[Phase 1: CSS Setup (T001-T003)]
       │
       ▼
[Phase 2: Foundational (T004-T005)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[Phase 3: US1 - Header Bar]   [Phase 4: US2 - Table Alignment]  [Phase 5: US3 - Actions]
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       │
                                       ▼
                       [Phase 6: US4 - Cross-Module Rollout]
                                       │
                                       ▼
                       [Phase 7: Polish & E2E Validation]
```

---

## Parallel Opportunities

- **Phase 1 & 2**: `T001`, `T002`, `T003`, `T004`, `T005` can be developed together in `src/index.css`.
- **Phase 3, 4, 5 (Students Directory)**: `T006` (Header), `T009-T011` (Table), `T012-T013` (Actions) in `src/pages/StudentsView.tsx`.
- **Phase 6 (Cross-Module)**: `T015` (TeachersView) and `T016` (BatchesView) can run in parallel.
- **Phase 7**: `T018` (Type check) and `T019` (Playwright E2E) run in sequence.
