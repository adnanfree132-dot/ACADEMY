# Implementation Plan: Direct Staff Payroll, Multi-Tranche Disbursements & Integrated Expense Management

**Branch**: `012-payroll-tags-itemized-payslip` | **Date**: 2026-09-03 | **Spec**: [specs/012-payroll-tags-itemized-payslip/spec.md](file:///home/adnan/Desktop/academy/specs/012-payroll-tags-itemized-payslip/spec.md)

**Input**: Feature specification and 5 clarified decisions from `/specs/012-payroll-tags-itemized-payslip/spec.md`

## Summary

This plan eliminates the artificial monthly batch generation workflow, establishing an immediate, direct **Active Staff Payroll Register** and a new primary **Expense Management Module** (`/expenses`):

1. **Direct Active Staff Register (Zero Batch Barrier)**:
   - When entering Staff Payroll, all active staff members are immediately displayed with their base salary.
   - Automatically defaults to the **prior completed month** (e.g. August 2026 when in September 2026), since salaries are paid in arrears.
   - Displays prior month attendance (Present, Absent, Late) as visual reference badges with **zero automated pay cuts**.
2. **Manual Adjustment Engine (`Amount × Count`)**:
   - In-row `[ Adjust ]` button allows applying deductions (*Late Arrival*, *Advance Salary*) or earnings (*Overtime*, *Bonus*) using the formula $\text{Amount} \times \text{Count} = \text{Total}$.
3. **Multi-Tranche Partial Salary Disbursements**:
   - Tracks `Net Payable`, `Amount Paid`, and `Amount Pending` per staff member with real-time status pills (`Paid`, `Partial`, `Pending`).
   - Admins can record custom partial installment amounts with payment mode and reference, viewable in an installment history drawer.
4. **Integrated Expense Management Module**:
   - Dedicated top-level sidebar link: **Expenses** (`/expenses`).
   - Every salary disbursement automatically creates a synchronized expense record under the **Salaries** category.
   - Admins can also record operational expenses (Utilities, Rent, Maintenance, Supplies) with monthly spending summaries and CSV export.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: React 18, Vite 5, Express 4, Prisma Client 5, Zod 3, Lucide React, Tailwind CSS  
**Storage**: PostgreSQL 16 (New models: `Expense`, `StaffSalaryDisbursement`, `SalaryHead`, `StaffSalaryAdjustment`)  
**Testing**: Automated Playwright E2E verification, API curl tests, `npm run build`, `npm --prefix server run build`  
**Target Platform**: Responsive Web Application  
**Performance Goals**: 0ms optimistic local UI updates; instantaneous financial balance computations  
**Constraints**: Strict adherence to Constitution & `AGENTS.md` (Floating Island modal architecture, zero emojis, active dark navy solid pill tab navigation, theme-matching slate Lucide icons)  

---

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Verification Status | Compliance Details |
| :--- | :--- | :--- |
| **I. Full-Stack Vertical Slices** | ✅ PASS | Implements full vertical slices across UI (`ExpenseManagementView.tsx`, `StaffPayrollView.tsx`), API client (`apiClient.ts`), Express routes (`/api/v1/expenses`, `/api/v1/payroll/disbursements`), and Prisma schema (`Expense`, `StaffSalaryDisbursement`). |
| **II. Layered Architecture** | ✅ PASS | Route controllers in `server/src/controllers/` separate database persistence, auto-posting expense triggers, and serialization. |
| **III. Data Integrity & Auditing** | ✅ PASS | Reverting a disbursement safely updates the staff balance and voids/removes the linked expense record; non-destructive tracking. |
| **IV. UI/UX Taste Standards** | ✅ PASS | Floating Island modals for Add Expense and Salary Disbursement; zero emojis; active navy solid pill navigation; single-line nowrap badges. |
| **V. Multi-Role RBAC & Zero-Trust** | ✅ PASS | Endpoints protected with JWT authentication and admin role checks. |
| **VI. Zero-Delay Optimistic UI** | ✅ PASS | Recording adjustments or disbursements updates table balances and metric cards immediately (0ms) in local React state. |

---

## Project Structure & Source Code Architecture

```text
# Backend Architecture
server/
├── prisma/
│   └── schema.prisma                  # Expense & StaffSalaryDisbursement models
├── src/
│   ├── controllers/
│   │   ├── expenseController.ts       # CRUD & monthly analytics for institutional expenses
│   │   ├── payrollBatchController.ts  # Salary heads, adjustments, and live staff register
│   │   └── salaryDisbursementController.ts # Multi-tranche payments & auto-posting to Expense
│   └── routes.ts                      # /api/v1/expenses and /api/v1/payroll/disbursements endpoints

# Frontend Architecture
src/
├── types.ts                           # Expense, StaffSalaryDisbursement, LiveStaffPayrollRow
├── api/
│   └── apiClient.ts                   # Expense and disbursement API methods
├── components/
│   ├── SalaryDisbursementModal.tsx    # Floating Island modal for full/partial payments
│   ├── DisbursementHistoryDrawer.tsx  # Installment history log drawer
│   ├── ExpenseModal.tsx               # Floating Island modal to add/edit operational expenses
│   └── StaffAdjustmentModal.tsx       # Amount × Count adjustment modal
├── pages/
│   ├── StaffPayrollView.tsx           # Streamlined unified register (defaulting to prior month)
│   └── ExpenseManagementView.tsx      # Top-level Expenses module with category cards & ledger
└── App.tsx                            # Sidebar navigation item for Expenses (/expenses)
```

---

## Execution Phases

### Phase 1: Database Models & Prisma Migration
1. Add `Expense` model to `server/prisma/schema.prisma`.
2. Add `StaffSalaryDisbursement` model to `server/prisma/schema.prisma`.
3. Run `npx prisma db push` to push schema to Supabase PostgreSQL.

### Phase 2: Backend Routes & Auto-Posting Controller Logic
1. Create `server/src/controllers/expenseController.ts`:
   - `getExpensesController`: list with category and period filtering.
   - `getExpenseSummaryController`: total spent, salary outflow, operational outflow.
   - `createExpenseController`: manual expense creation.
   - `deleteExpenseController`: delete manual expense.
2. Create `server/src/controllers/salaryDisbursementController.ts`:
   - `createSalaryDisbursementController`: records partial or full payment installment; automatically creates linked `Expense` under "Salaries".
   - `getStaffDisbursementsController`: returns installment payment history for a staff member and month.
   - `deleteSalaryDisbursementController`: deletes installment and removes linked auto-created expense.
3. Update `getStaffLiveRegisterController`:
   - Dynamically aggregates base salary, manual adjustments, previous month attendance, paid installments, and pending balance.
4. Register all endpoints in `server/src/routes.ts`.

### Phase 3: Frontend API Client & Types
1. Update `src/types.ts` with `Expense`, `StaffSalaryDisbursement`, and `PaymentStatus`.
2. Add methods in `src/api/apiClient.ts` for expenses and disbursements.

### Phase 4: Direct Staff Payroll View
1. Refactor `StaffPayrollView.tsx`:
   - Remove "Generate Batch" workflow and redundant "Historical Cycles" tab.
   - Default period to prior completed month (e.g. August 2026 when in September).
   - Display all active staff members with: Base Salary, Prior Month Attendance badges, Adjustments, Net Payable, Paid, Pending, and Status (`Paid` / `Partial` / `Pending`).
2. Add `SalaryDisbursementModal.tsx`:
   - 4-Island Floating Architecture modal to disburse custom partial or full amount.
3. Add `DisbursementHistoryDrawer.tsx`:
   - Slide-over drawer displaying past installment payments for that month.

### Phase 5: Top-Level Expense Management Module
1. Build `src/pages/ExpenseManagementView.tsx`:
   - Three summary cards: Total Expenditures, Salary Outflows, Operational Outflows.
   - Category filter pills (`All`, `Salaries`, `Utilities`, `Rent`, `Maintenance`, `Supplies`).
   - Month period dropdown + search bar + `[ ⤓ Export CSV ]` + `[ + Add Expense ]`.
   - Table displaying Date, Title, Category, Amount, Payment Method, Reference, and Actions.
2. Create `src/components/ExpenseModal.tsx`:
   - 4-Island Floating Architecture modal for creating manual operational expenses.
3. Add **Expenses** link in `App.tsx` navigation sidebar (`<Receipt size={18} /> Expenses`).

### Phase 6: Quality Verification & End-to-End Testing
1. Run backend build: `npm --prefix server run build`.
2. Run frontend build: `npm run build`.
3. Verify live flow: add adjustment, record partial disbursement, confirm auto-created expense in Expenses module.
