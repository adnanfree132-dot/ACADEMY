# Research & Architectural Decisions: Direct Staff Payroll, Multi-Tranche Disbursements & Integrated Expense Management

## 1. Direct Active Staff Register vs Batch Generation Barrier

- **Decision**: Eliminate the "Generate Monthly Batch" modal and batch generation workflow entirely.
- **Rationale**: 
  - Academy administrators found the batch generation barrier confusing, artificial, and cumbersome for manual institutions.
  - In real schools and academies, all active teachers and staff members are inherently on the payroll every month with their contracted standard/base salary.
  - The primary view should be an immediate, live register of all active staff members with their base salary, visual attendance indicators for the prior completed month, and status badges.
- **Alternatives Considered**:
  - *Draft vs Finalized Batch State Machine*: Still required a "Create Draft" button before rows could be viewed, adding friction.
  - *One-Click Batch Generator*: Forced admins to click a button and wait for background calculations before seeing any staff member.

---

## 2. Default Prior-Month Billing Period (Salaries Paid in Arrears)

- **Decision**: Staff Payroll automatically defaults to the **prior completed calendar month** (e.g., if the current calendar date is September 2026, the register loads **August 2026**).
- **Rationale**:
  - Salaries in academic institutions are paid in arrears after the work month completes. Nobody pays September salaries in advance on September 1st.
  - Prior month's attendance (Days Present, Absent, Late Arrivals) is finalized and ready for review only after the month closes.
  - The calendar period selector only allows past completed months and the active payroll period, preventing nonsensical future/advance calendar selections.
- **Alternatives Considered**:
  - *Current Month Default*: Required every user on September 3rd to immediately switch the dropdown back to August to process August payroll.

---

## 3. Attendance Badges with Zero Automated Pay Cuts

- **Decision**: Display prior month attendance stats (Present, Absent, Late) as visual reference badges on each staff row, with zero automated pay reductions.
- **Rationale**:
  - Automatic deductions for absences or late arrivals often produce billing disputes or deduct money for approved medical excuses that weren't yet logged in the system.
  - Base salary starts at the full contracted rate. The administrator reviews the attendance badge and, if warranted, clicks `[ Adjust ]` to manually add an explicit deduction head (e.g. *Late Arrival: 2,000 PKR × 3 = 6,000 PKR*) with an audit reason.
- **Alternatives Considered**:
  - *Strict Biometric Penalty Calculation*: Caused unintended deductions that teachers had to appeal.

---

## 4. Multi-Tranche Partial Salary Disbursements

- **Decision**: Introduce a flexible `StaffSalaryDisbursement` installment entity tracking partial payments against any staff member's monthly net salary.
- **Rationale**:
  - Due to tuition fee collection timing, institutions often disburse salaries in 2 or 3 installments (e.g. PKR 20,000 upfront, PKR 30,000 two weeks later).
  - The table calculates:
    $$\text{Net Payable} = \text{Base Salary} + \text{Earnings} - \text{Deductions}$$
    $$\text{Amount Paid} = \sum \text{Disbursements for that month}$$
    $$\text{Amount Pending} = \max(0, \text{Net Payable} - \text{Amount Paid})$$
  - Status transitions automatically:
    - If $\text{Amount Paid} == 0 \implies \text{Pending}$ (red badge)
    - If $0 < \text{Amount Paid} < \text{Net Payable} \implies \text{Partial}$ (amber badge)
    - If $\text{Amount Paid} \ge \text{Net Payable} \implies \text{Paid}$ (emerald badge)
  - An installment history drawer displays every disbursement with date, time, amount, payment method (Cash/Bank/Cheque), and notes.
- **Alternatives Considered**:
  - *All-or-Nothing Paid Flag*: Impossible to record when an employee is given a 10,000 PKR cash advance towards their salary.

---

## 5. Top-Level Expense Management Module & Auto-Posting

- **Decision**: Create a dedicated primary sidebar module: **Expenses** (`/expenses`), supported by a unified `Expense` entity in Prisma. Every salary disbursement automatically creates a synchronized expense record.
- **Rationale**:
  - Currently, the application had fee income tracking in Finance/Fees but zero operational expenditure tracking.
  - Academy administrators need a single view showing total monthly expenditures:
    - Automated category: **Salaries** (created automatically upon every partial or full salary disbursement).
    - Manual operational categories: **Utilities** (Electricity, Internet, Water), **Rent**, **Maintenance & Repairs**, **Academic & Lab Supplies**, and **Miscellaneous**.
  - Provides monthly summary cards (Total Spent, Salary Outflow, Operational Outflow), category filtering, search, date range filtering, receipt references, and CSV export.
- **Alternatives Considered**:
  - *Sub-tab inside Staff Payroll*: Failed to provide a place to track electricity bills, rent, or maintenance costs.
  - *Full Accounting Chart of Accounts*: Overkill with unnecessary debit/credit journal complexity for academy administrators.
