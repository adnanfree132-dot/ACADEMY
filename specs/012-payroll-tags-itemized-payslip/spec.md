# Feature Specification: Configurable Payroll Settings Tags & Reason-Backed Itemized Payslips

**Feature Branch**: `012-payroll-tags-itemized-payslip`  
**Created**: 2026-09-03  
**Status**: Clarification / In Review  
**Module**: Staff Payroll & Compensation Management  
**Input**: User prompt: "dont add 50 ercent cut or 25 percent cut i added this line becuase i have to check how ai work can it worked or not worked for testing purpose i give this real world scenerio but one issue i facees that on payslip these details are not showing correctly it shows other deduction there is no reason for that so it is not helplfull is there any universal solution like whatsapp auto messaging system in which we have tags tags auto reflect its data like name tag shows name number tag shows numbers so i want that these custome deductions or earnings have to be entered in settings option of payroll and these tags are shown on ai salary generation system this is my thought if you have any better idea which covers many expects you can tell me"

## Clarifications

### Session 2026-09-03
- **Q:** How should the system support applying custom tags across staff members?  
  → **A:** Hybrid Individual & Role Scoping (Option A): Tags can be applied to individual staff members (e.g. `FAC-001: {{TAG}}`), specific roles or departments (e.g. `Science Teachers: {{TAG}}`), or institution-wide batch policy.
- **Q:** How should the system handle custom amount or percentage overrides when applying a tag?  
  → **A:** Flexible Inline Overrides with Fallback to Defaults (Option A): Admins can specify custom amounts or reasons in the prompt/tag (e.g. `{{TAG: 5000}}` or *"5000 PKR via {{TAG}}"*), smoothly falling back to the tag's configured default if omitted.
- **Q:** How should itemized custom deductions and earnings be persisted in the database for each payslip?  
  → **A:** Hybrid Structured JSON Arrays with Synced Totals (Option A): Stores itemized arrays (`tag`, `label`, `amount`, `reason`) on `StaffSalaryPayment`, while maintaining numeric sums for seamless compatibility with existing reports.
- **Q:** Where in the user interface should administrators configure and manage these Payroll Tags?  
  → **A:** Payroll Tab + In-Modal Shortcut (Option A): A 4th tab `[ Tags & Rules ]` in `StaffPayrollView` for complete management, plus an in-context shortcut inside `PayrollRulesModal`.
- **Q:** How should the system handle one-off natural language instructions that do not match any pre-configured tag?  
  → **A:** Strict Tag Enforcement (Option B): All custom deductions and earnings must strictly map to a registered tag in Payroll Settings. Unmapped instructions prompt the user with available tags or a link to create an official tag first, preventing rogue/unvetted line items.
- **Q:** How should the new Expense Management module be structured and integrated into the system navigation?  
  → **A:** Dedicated Top-Level "Expenses" Sidebar Module (Option A): Supports general operational categories (Salaries, Utilities, Rent, Maintenance, Supplies), with automated expense records created whenever a salary disbursement is recorded.
- **Q:** How should partial (multi-installment) salary disbursements be recorded and displayed for each staff member?  
  → **A:** Flexible Multi-Tranche Payment Tracking (Option A): Admins can disburse any partial amount, date, and payment mode (Cash/Bank/Cheque). The register updates status to `Paid`, `Partial`, or `Pending`, displays `Paid` and `Pending` balances, and provides an itemized installment history drawer.
- **Q:** How should last month's attendance data interact with staff salaries on the payroll screen?  
  → **A:** Informational Attendance Badges with Manual Adjustments (Option A): Previous month's attendance stats (Present, Absent, Late) display as visual reference badges alongside each staff member, with base salary remaining clean (no automatic cuts) and all deductions/earnings applied manually via the adjustment button.
- **Q:** How should the Staff Payroll tab structure and historical month navigation be streamlined?  
  → **A:** Unified Register with Prior-Month Selector (Option A): Staff Payroll directly displays all active staff with base salaries, last month's attendance badges, and partial payment actions (defaulting to the prior month, e.g., August 2026 when in September). Past months are navigated via the month selector, eliminating the redundant batch generator and "Historical Cycles" tab while retaining `Deductions & Earnings Heads` and `Salary Packages` tabs.
- **Q:** What core features and financial views should the new Expense Management module provide?  
  → **A:** Full Institutional Expense Tracker with Automated Payroll Posting (Option A): Includes operational categories (Salaries, Utilities, Rent, Maintenance, Supplies), monthly spending summaries, manual expense entry modal, automatic salary disbursement logging, and CSV export.

---

## 1. Executive Summary & Core Value Proposition

This specification establishes a streamlined, transparent, and direct staff payroll and institutional expense architecture for Academia Pro OS:

1. **Direct Active Staff Register (Zero Batch Generation Barrier)**:
   - Eliminates the artificial "Generate Monthly Batch" workflow.
   - When entering **Staff Payroll**, the system immediately displays all active staff members with their clean standard base salary.
   - Defaults to the **prior completed calendar month** (e.g. August 2026 when accessed in September 2026), since salaries are paid in arrears.
   - Prior month's attendance (Present, Absent, Late) is shown as visual reference chips without automatic pay cuts, keeping base salaries intact.

2. **Manual Deduction & Earning Heads (`Amount × Count`)**:
   - In-row `[ Adjust ]` / toolbar button enables administrators to add itemized deductions (e.g. *Late Arrival*, *Advance Salary*) or earnings (e.g. *Overtime*, *Bonus*).
   - Strict formula calculation: $\text{Amount} \times \text{Count} = \text{Total}$, printed with full line-item reasons on payslips.

3. **Multi-Tranche Partial Salary Disbursements**:
   - Supports realistic cash flow scenarios where salaries are disbursed across multiple installments.
   - Tracks `Net Payable`, `Amount Paid`, and `Amount Pending` with real-time status pills (`Paid`, `Partial`, `Pending`).
   - Maintains an append-only installment log (amount, date, payment mode, reference) per staff member per month.

4. **Dedicated Top-Level Expense Management Module**:
   - New primary sidebar section: **Expenses** (`/expenses`).
   - Every salary payment disbursement automatically creates a corresponding expenditure record under the "Salaries" category.
   - Administrators can also record general operational expenses (Utilities, Rent, Maintenance, Academic Supplies) with payment methods, receipt references, and monthly spending analytics.

---

## 2. User Stories & Acceptance Criteria

### User Story 1 - Direct Active Staff Payroll Register & Prior Month Default (Priority: P1)
**As an** Academy Administrator or Finance Officer,  
**I want to** immediately see all active staff members with their base salary and prior-month attendance upon opening Staff Payroll,  
**So that** I don't have to trigger a separate batch generation step or navigate advance calendar months.

**Acceptance Scenarios**:
1. **Given** current date is in September 2026, **When** opening Staff Payroll, **Then** the active register automatically loads August 2026 data.
2. **Given** the staff register, **Then** every active staff member is listed with their designation, base salary, and prior month attendance badges (e.g. 24 Pres / 1 Abs / 2 Late).
3. **Given** standard base salary, **Then** zero automatic deductions are applied; all adjustments are managed explicitly via the adjustment modal.

---

### User Story 2 - Multi-Tranche Partial Salary Disbursements (Priority: P1)
**As an** Administrator disbursing staff salaries,  
**I want to** record partial payments against a staff member's monthly salary and view the remaining pending balance,  
**So that** institutional cash flow constraints are accommodated transparently.

**Acceptance Scenarios**:
1. **Given** a staff member with PKR 50,000 net salary, **When** the admin disburses PKR 20,000 via Cash/Bank, **Then** the status updates to `Partial`, showing `Paid: PKR 20,000` and `Pending: PKR 30,000`.
2. **Given** a partial payment, **When** the admin pays the remaining PKR 30,000, **Then** the status transitions to `Paid` (`Pending: PKR 0`).
3. **Given** any staff row, **When** clicking their disbursement history, **Then** an itemized drawer displays all installment dates, amounts, and payment methods.

---

### User Story 3 - Automated Expense Management Module (Priority: P1)
**As an** Administrator or Academy Owner,  
**I want a** dedicated Expenses module in the sidebar that tracks all operational outflows and automatically logs salary disbursements,  
**So that** academy cash expenditures are centralized in one financial dashboard.

**Acceptance Scenarios**:
1. **Given** the primary sidebar, **When** navigating to **Expenses**, **Then** the user sees monthly expense totals, category breakdowns, and an expense ledger.
2. **Given** a salary payment disbursement in Staff Payroll, **When** confirmed, **Then** an expense record is automatically posted under the "Salaries" category with payee name, month period, and payment mode.
3. **Given** the Expenses module, **When** clicking `[ + Add Expense ]`, **Then** the admin can record manual expenditures for Utilities, Rent, Maintenance, or Supplies.

---

## 3. Data Model Draft

### Entity: `Expense`
- `id`: String (UUID)
- `category`: String ("Salaries" | "Utilities" | "Rent" | "Maintenance" | "Supplies" | "Miscellaneous")
- `title`: String
- `amount`: Float
- `expense_date`: DateTime
- `payment_method`: String ("cash" | "bank_transfer" | "cheque" | "online")
- `reference_number`: String?
- `payee_name`: String?
- `staff_member_id`: String? (linked if salary disbursement)
- `month_period`: String? (e.g. "2026-08")
- `notes`: String?
- `created_at`: DateTime
- `updated_at`: DateTime

### Entity: `StaffSalaryDisbursement` (Multi-Tranche Installments)
- `id`: String (UUID)
- `staff_member_id`: String
- `month_period`: String (e.g. "2026-08")
- `amount`: Float
- `payment_method`: String ("cash" | "bank_transfer" | "cheque")
- `disbursed_at`: DateTime
- `reference_number`: String?
- `notes`: String?
- `expense_id`: String? (linked auto-created expense record)
