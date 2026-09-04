# Tasks: Direct Staff Payroll, Multi-Tranche Disbursements & Integrated Expense Management

**Input**: Design documents from `/specs/012-payroll-tags-itemized-payslip/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/expenses-api.yaml`, `contracts/payroll-live-api.yaml`, `quickstart.md`
**Organization**: Tasks are grouped by user story (P1) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Database Schema Foundation

**Purpose**: Database schema expansion, model migrations, and core TypeScript interface definitions.

- [x] T001 Add `Expense` and `StaffSalaryDisbursement` models with relations and indexes to `server/prisma/schema.prisma`
- [x] T002 [P] Synchronize database schema with PostgreSQL using Prisma db push in `server/prisma/schema.prisma`
- [x] T003 [P] Define TypeScript interfaces (`Expense`, `StaffSalaryDisbursement`, `LiveStaffPayrollRow`) in `src/types.ts`

---

## Phase 2: Foundational Architecture & Core Services

**Purpose**: Backend controllers, auto-posting expense triggers, route endpoints, and frontend API client methods blocking user stories.

- [x] T004 Implement `getExpensesController`, `getExpenseSummaryController`, `createExpenseController`, and `deleteExpenseController` in `server/src/controllers/expenseController.ts`
- [x] T005 Implement `createSalaryDisbursementController`, `getStaffDisbursementsController`, and `deleteSalaryDisbursementController` with automatic posting to `Expense` in `server/src/controllers/salaryDisbursementController.ts`
- [x] T006 Implement live staff register controller aggregating active staff, contracted base salaries, adjustments, prior-month attendance, and paid/pending balances in `server/src/controllers/payrollBatchController.ts`
- [x] T007 Register `/api/v1/expenses` and `/api/v1/payroll/disbursements` REST endpoints with JWT authentication in `server/src/routes.ts`
- [x] T008 [P] Add strongly typed frontend API methods (`getExpenses`, `getExpenseSummary`, `createExpense`, `deleteExpense`, `createSalaryDisbursement`, `getStaffDisbursements`, `getLiveStaffPayrollRegister`) in `src/api/apiClient.ts`

---

## Phase 3: User Story 1 - Direct Active Staff Payroll Register & Prior Month Default (Priority: P1) 🎯 MVP

**Goal**: When clicking Staff Payroll, all active staff members are immediately displayed with base salary, prior month attendance badges, and manual adjustment controls without any batch generation workflow.

**Independent Test**: Open Staff Payroll, confirm the view defaults to the previous calendar month (e.g., August 2026 when in September), verify all active staff are listed with clean base salaries, check that attendance badges (Present, Absent, Late) display without automatic pay cuts, and apply a manual adjustment (`Amount × Count`).

- [x] T009 [US1] Refactor `StaffPayrollView.tsx` to directly load and display the active staff register defaulting to the prior completed month (e.g. August 2026) in `src/pages/StaffPayrollView.tsx`
- [x] T010 [P] [US1] Build the live staff register table with staff info, contracted base salary, attendance reference badges (Present, Absent, Late with zero automated cuts), adjustments breakdown, net payable, paid, pending, and status pill in `src/pages/StaffPayrollView.tsx`
- [x] T011 [US1] Connect `StaffAdjustmentModal.tsx` (`Amount × Count`) for adding manual deductions or earnings with instant 0ms optimistic UI reflection in `src/pages/StaffPayrollView.tsx`
- [x] T012 [US1] Add clean month period dropdown in the toolbar permitting selection of prior completed months with immediate register reload in `src/pages/StaffPayrollView.tsx`

**Checkpoint**: User Story 1 (MVP) is functional. Administrators can view all active staff for the prior completed month with contracted salaries, attendance badges, and manual adjustment triggers without generating a batch.

---

## Phase 4: User Story 2 - Multi-Tranche Partial Disbursements & Payment History (Priority: P1)

**Goal**: Support partial salary disbursements across multiple installments per staff member, tracking paid/pending balances and displaying a detailed payment history drawer.

**Independent Test**: In `StaffPayrollView.tsx`, click `[ Pay ]` on a staff member with PKR 50,000 net payable, enter PKR 20,000, confirm payment, verify the row status becomes "Partial" with Paid = PKR 20,000 and Pending = PKR 30,000, click `[ History ]` and verify the PKR 20,000 installment is listed with timestamp.

- [x] T013 [P] [US2] Create `SalaryDisbursementModal.tsx` using 4-Island Floating Architecture allowing partial/full payment entry, payment method, and reference notes in `src/components/SalaryDisbursementModal.tsx`
- [x] T014 [P] [US2] Create `DisbursementHistoryDrawer.tsx` slide-over drawer displaying chronological payment installments with timestamp, method, reference, and void action in `src/components/DisbursementHistoryDrawer.tsx`
- [x] T015 [US2] Wire `[ Pay / Disburse ]` and `[ History ]` row action triggers in `StaffPayrollView.tsx` with instant 0ms optimistic balance calculations and status transitions in `src/pages/StaffPayrollView.tsx`

**Checkpoint**: User Story 2 is functional. Administrators can record partial or full disbursements and track payment history per staff member.

---

## Phase 5: User Story 3 - Automated Expense Management Module (Priority: P1)

**Goal**: Provide a top-level Expenses module in the sidebar that tracks all operational academy outflows and automatically synchronizes salary disbursements under the "Salaries" category.

**Independent Test**: Navigate to `/expenses` from the sidebar, verify summary cards display accurate spending totals, confirm that salary disbursements from Staff Payroll automatically appear under "Salaries", click `[ + Add Expense ]` to record an operational electricity bill, and verify updated totals.

- [x] T016 [P] [US3] Create `ExpenseModal.tsx` using 4-Island Floating Architecture for recording operational expenses (Utilities, Rent, Maintenance, Supplies) in `src/components/ExpenseModal.tsx`
- [x] T017 [US3] Create `ExpenseManagementView.tsx` featuring 3 summary metrics cards (Total Expenditures, Salary Outflows, Operational Outflows), category filter pills, month filter, search bar, and expenses ledger in `src/pages/ExpenseManagementView.tsx`
- [x] T018 [US3] Add top-level **Expenses** navigation item with `<Receipt size={18} />` icon to the primary sidebar and router in `src/App.tsx`
- [x] T019 [US3] Connect automated salary expense posting between `salaryDisbursementController.ts` and `ExpenseManagementView.tsx`, ensuring 0ms reflection upon salary disbursements

**Checkpoint**: User Story 3 is functional. The academy has a centralized expense management system seamlessly synced with staff salary disbursements.

---

## Phase 6: Polish, Audits & Cross-Cutting Concerns

**Purpose**: Format validation, CSV export, layout stability, and zero-error builds.

- [x] T020 [P] Implement CSV export for the live active staff payroll register and institutional expenses in `src/utils/csvExporter.ts`
- [x] T021 Enforce strict prohibition of Unicode emojis across all new views, drawers, and modal forms per Rule 9 in `src/pages/ExpenseManagementView.tsx` and `src/pages/StaffPayrollView.tsx`
- [x] T022 Enforce single-line nowrap (`white-space: nowrap`) across all table status badges (`Paid`, `Partial`, `Pending`) and action buttons per Rule 6 in `src/pages/StaffPayrollView.tsx` and `src/pages/ExpenseManagementView.tsx`
- [x] T023 Run full frontend and backend compilation verification (`npm run build` and `npm --prefix server run build`) ensuring zero errors and zero warnings

---

## Dependencies & User Story Flow

```text
Phase 1 (Setup: Prisma Models & DB Sync)
   ↓
Phase 2 (Foundational: Backend Controllers & APIs)
   ↓
Phase 3 (User Story 1: Active Staff Register & Prior Month Default) [MVP]
   ↓
Phase 4 (User Story 2: Multi-Tranche Partial Disbursements & History Drawer)
   ↓
Phase 5 (User Story 3: Top-Level Expenses Module & Auto-Posting)
   ↓
Phase 6 (Polish: CSV Export, UI Audits, Build Verification)
```

---

## Parallel Execution Opportunities

- **T002** (DB Push) and **T003** (TypeScript types) can execute in parallel after T001.
- **T007** (Routes) and **T008** (API Client) can execute in parallel after controllers T004-T006.
- **T013** (`SalaryDisbursementModal.tsx`) and **T014** (`DisbursementHistoryDrawer.tsx`) can be built concurrently.
- **T016** (`ExpenseModal.tsx`) and **T020** (`csvExporter.ts`) can be built concurrently.
