# Quickstart & Verification Guide: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Feature Branch**: `007-advanced-fee-billing-installments`  
**Date**: 2026-08-19  

This guide provides end-to-end verification workflows to prove that all functional requirements, UI/UX taste standards, and data integrity guarantees for Feature 007 are working as specified.

---

## Prerequisites & Environment Setup

1. **Start Backend API Server**:
   ```bash
   cd d:\academy\server
   npm run dev
   ```
2. **Start Frontend Client**:
   ```bash
   cd d:\academy
   npm run dev
   ```
3. **Seed Baseline Data** (optional if already populated):
   ```bash
   cd d:\academy\server
   npx prisma db seed
   ```

---

## Scenario 1: Register Student with 25% Merit Scholarship & Anchor Date

1. Navigate to **Students** (`/students`) and click **+ Add Student**.
2. Fill standard personal details (`Name: Hamza Tariq`, `Phone: +92 300 1234567`).
3. In the **Fee Terms & Scholarship** section:
   - Base Monthly Fee: `4000`
   - Scholarship Type: Select `Percentage Discount`
   - Scholarship Value: Enter `25`
   - Scholarship Reason: Select `Academic Merit`
   - Admission Date: Select `18-Aug-2026`
4. **Verification**:
   - The reactive calculation breakdown displays: `Gross: PKR 4,000` | `Scholarship: -PKR 1,000 (25%)` | `Net Monthly: PKR 3,000`.
   - Submit the form.
5. In the student list, click **Fee Ledger** on Hamza Tariq.
   - Initial Invoice Voucher is present with `Period: 18-Aug-2026 to 17-Sep-2026`.
   - Net Amount: `PKR 3,000`, Due Date: `23-Aug-2026`.

---

## Scenario 2: Mid-Month Admission with Pro-Rata Preset & Admin Override

1. Open **+ Add Student** modal.
2. Select Admission Date as `20-Aug-2026` and Base Fee as `5000`.
3. **Verification**:
   - The system displays a mid-month notice badge with presets: `[ 50% Half-Month (PKR 2,500) ]` and `[ Exact Daily Pro-Rata (PKR 1,935) ]`.
   - Click `[ 50% Half-Month ]` -> initial fee field automatically updates to `2500`.
   - Manually type `2000` in the Initial Fee Override field.
   - Submit student registration.
4. Verify the generated initial voucher has `Net Amount: PKR 2,000` and coverage `20-Aug-2026 to 19-Sep-2026`.

---

## Scenario 3: Batch Course Installments with Banker's Penny Balancing

1. Navigate to **Batches** (`/batches`) and click **+ Create Batch**.
2. Enter Name `Mobile App Development Masterclass`, select Course Type `Fixed Duration Course`.
3. Set Start Date `2026-08-01`, End Date `2026-10-31`, Total Course Fee `10000`, Default Installments `3`.
4. Click **Save Batch**.
5. Enroll a student with a 20% Scholarship (`Net Course Fee = PKR 8,000`).
6. Open the student's **Installment Schedule**:
   - Total Net Fee: `PKR 8,000` across 3 installments.
   - **Installment 1**: `PKR 2,668` (Penny balanced: $2,666 + 2$), Due `06-Aug-2026` (`Invoiced / Active Voucher`).
   - **Installment 2**: `PKR 2,666`, Due `01-Sep-2026` (`Scheduled`).
   - **Installment 3**: `PKR 2,666`, Due `01-Oct-2026` (`Scheduled`).
   - Sum total exactly equals `PKR 8,000.00`.

---

## Scenario 4: Mid-Batch Late Enrollment with Extended Student Timeline

1. Locate an existing 3-Month Batch running `01-Aug-2026` to `31-Oct-2026`.
2. Click **Enroll Student**, select Student B, and set Enrollment Date to `10-Sep-2026`.
3. **Verification**:
   - The modal displays two options:
     1. `Align to Batch End (31-Oct-2026)` with toggle between `Prorate Remaining Duration` and `Full Course Fee`.
     2. `Extend Student Timeline` with individual completion date picker.
   - Choose `Extend Student Timeline` and set Individual End Date to `30-Nov-2026`.
   - Confirm enrollment.
4. Verify Student B's installment schedule spans `Sep 10` to `Nov 30`, while the parent Batch entity start/end dates remain unchanged.

---

## Scenario 5: Printable Voucher & Slip Verification

1. Navigate to **Fees** (`/fees`) or open **Student Ledger**.
2. Click **View Slip** on any generated invoice voucher.
3. **Verification**:
   - Header card displays clear period badge: `Coverage: 15-Aug-2026 to 14-Sep-2026`.
   - Installment badge (if applicable): `Installment 1 of 3 (Mobile App Development)`.
   - Due Date explicitly formatted: `Due: 20-Aug-2026 (5 Days Grace Window)`.
   - Zero Unicode emojis; theme-matching slate Lucide icons; Floating Island architecture.
