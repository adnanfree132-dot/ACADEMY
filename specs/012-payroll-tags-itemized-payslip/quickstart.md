# Quickstart Validation Guide: Direct Staff Payroll, Multi-Tranche Disbursements & Integrated Expense Management

This validation guide outlines end-to-end scenarios to verify the implementation.

---

## Scenario 1: Immediate Active Staff Register Defaulting to Prior Month

1. Open Academy Pro OS in browser (`http://localhost:3001`).
2. Navigate to **Staff** $\to$ **Staff Payroll & Salaries**.
3. **Verify**:
   - The view immediately displays the active staff list without requiring any "Generate Batch" button or modal.
   - The period dropdown automatically defaults to the **prior completed month** (e.g., if calendar date is in September 2026, it displays **August 2026**).
   - Past months (e.g., July 2026, June 2026) can be selected via the dropdown.
   - Future months (e.g. October 2026) are not defaulted or forced.

---

## Scenario 2: Clean Base Salary with Prior Month Attendance Badges

1. On any active staff member (e.g., Teacher with standard base salary of PKR 60,000):
2. **Verify**:
   - The row displays the staff member's contracted base salary (PKR 60,000).
   - The attendance column shows August 2026 attendance badges (e.g., `24 Pres`, `2 Abs`, `1 Late`).
   - Base salary has **zero automatic deductions** applied from attendance (salary remains PKR 60,000 until manually adjusted).

---

## Scenario 3: Manual Adjustment with Head, Amount, and Count

1. Click the `[ Adjust ]` button on the staff row.
2. The Floating Island modal opens:
   - Select Head: **Late Arrival** (Deduction).
   - Enter **Amount**: `2000`.
   - Enter **Count**: `5`.
   - Live breakdown displays: $\text{PKR 2,000} \times 5 = \text{-PKR 10,000}$.
   - Enter reason: *"5 late arrivals logged in August"*.
   - Click `[ Save & Apply to Salary ]`.
3. **Verify**:
   - Net Payable instantly reflects: $\text{PKR 60,000} - \text{PKR 10,000} = \text{PKR 50,000}$.
   - Pending balance shows `PKR 50,000`, Paid shows `PKR 0`, Status shows `Pending`.

---

## Scenario 4: Partial Salary Disbursement (Multi-Tranche)

1. Click the `[ Pay / Disburse ]` action button on the staff row.
2. The disbursement modal opens:
   - Total Net Payable: `PKR 50,000`.
   - Already Paid: `PKR 0`.
   - Remaining: `PKR 50,000`.
   - Enter Disbursement Amount: `20000` (PKR 20,000 partial payment).
   - Select Payment Method: `Cash`.
   - Enter Reference: `CASH-VOUCHER-101`.
   - Click `[ Confirm Disbursement ]`.
3. **Verify**:
   - Status pill instantly transitions to `Partial` (amber badge).
   - Total Paid displays `PKR 20,000`.
   - Total Pending displays `PKR 30,000`.
   - Clicking `[ History ]` displays an installment drawer showing PKR 20,000 paid in Cash with timestamp.

---

## Scenario 5: Automated Integration into New Expense Management Module

1. In the main application sidebar, click the new **Expenses** navigation link (`/expenses`).
2. **Verify**:
   - The Expenses page loads with three summary metrics cards:
     - **Total Expenditures**: PKR 20,000+
     - **Salary Outflows**: PKR 20,000
     - **Operational Outflows**: PKR 0
   - Under the expenses table, an auto-posted record exists:
     - **Category**: `Salaries`
     - **Title**: *"August 2026 Salary Disbursement - [Staff Name]"*
     - **Amount**: `PKR 20,000`
     - **Payment Method**: `Cash`
     - **Reference**: `CASH-VOUCHER-101`
3. Click `[ + Add Expense ]` on the Expenses page:
   - Category: `Utilities`.
   - Title: *"Campus Electricity Bill - August 2026"*.
   - Amount: `15000`.
   - Payment Method: `Bank Transfer`.
   - Click `[ Save Expense ]`.
4. **Verify**:
   - Total Expenditures updates to `PKR 35,000` (PKR 20,000 salary + PKR 15,000 utility).
   - Category filter `[ Utilities ]` and `[ Salaries ]` correctly filters the list.

---

## Scenario 6: Final Clearance of Remaining Salary

1. Return to **Staff Payroll**.
2. Click `[ Pay / Disburse ]` on the same staff member.
3. The modal pre-fills with remaining pending amount: `PKR 30,000`.
4. Enter payment method `Bank Transfer`, Reference `HBL-TRX-99881`.
5. Click `[ Confirm Disbursement ]`.
6. **Verify**:
   - Status pill transitions to `Paid` (emerald badge).
   - Paid shows `PKR 50,000`, Pending shows `PKR 0`.
   - In **Expenses**, total salary outflow updates to `PKR 50,000`.
