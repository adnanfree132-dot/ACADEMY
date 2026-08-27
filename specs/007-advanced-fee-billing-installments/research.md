# Phase 0 Research: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Feature Branch**: `007-advanced-fee-billing-installments`  
**Date**: 2026-08-19  
**Status**: Completed  

---

## 1. Architectural Decisions & Research Findings

### Research Question 1: How should scholarship discounts be calculated and stored across recurring monthly plans versus fixed-duration course installment plans?

- **Decision**: 
  - For **Monthly Recurring Tuition**: The student's `StudentFeePlan` stores `monthly_amount`, `scholarship_type` (`percentage` | `fixed` | `none`), `scholarship_value`, `scholarship_reason`, and computed `net_monthly_amount`. Each recurring invoice voucher records `amount` (gross), `discount` (calculated or fixed), and `net_amount`.
  - For **Course Installment Plans**: The total course scholarship is deducted upfront from `total_course_fee` to determine the net total course payable amount ($T_{\text{net}} = T_{\text{gross}} - D_{\text{scholarship}}$), which is then divided evenly across $N$ installments.
- **Rationale**: Keeps each installment payment uniform and predictable for parents and accountants. Eliminates uneven cash-flow friction.
- **Alternatives Considered**: 
  - *Applying discount per individual installment*: Rejected because percentage rounding errors across small installments cause penny reconciliation drifts.
  - *Front-loading total discount on the 1st installment*: Rejected as it leads to confusing invoices where installment 1 is 0 PKR while installments 2 & 3 are full price.

---

### Research Question 2: How to handle Month-End Billing Rollovers (e.g. 29th, 30th, 31st) and Leap Years safely?

- **Decision**: Implement a deterministic date-clamping utility `calculateNextCyclePeriod(anchorDay, currentMonth, currentYear)`. If a student has anchor day 31, in February the coverage end date clamps to Feb 28 (or Feb 29 in leap years), and the next billing anchor returns to March 31 without drifting into April.
- **Rationale**: Standard ISO 8601 month calculations in JavaScript can erroneously overflow (e.g. `new Date(2026, 1, 31)` becomes `March 3`). Clamping logic guarantees exact calendar alignment.
- **Alternatives Considered**: 
  - *Restricting anchor days to 1st–28th only*: Rejected because real students join on the 29th, 30th, or 31st and parents expect their cycle to align with their admission day.

---

### Research Question 3: How should the installment lifecycle and voucher generation be structured?

- **Decision**: 
  - Create a lightweight `StudentInstallmentSchedule` table linked to `Enrollment` storing the planned $N$ installments with sequence number, due date, from-to coverage dates, scheduled amount, and optional `invoice_id` foreign key.
  - When the student enrolls, the **1st installment voucher is generated immediately** as an active `FeeInvoice` record (`status="unpaid"`).
  - Subsequent installments remain as scheduled entries until their due date window arrives, at which point the recurring billing service / cron converts them into active `FeeInvoice` vouchers.
- **Rationale**: Avoids cluttering the active billing accounts ledger with future invoices while providing complete forward visibility in the student profile drawer and enrollment schedule.
- **Alternatives Considered**: 
  - *Generating all N invoice vouchers on day 1*: Rejected because creating invoices months in advance distorts total outstanding receivables metrics and overdue dashboards.

---

### Research Question 4: How should penny rounding reconciliation be handled for uneven installment divisions?

- **Decision**: Standard Banker's Penny Balancing Algorithm:
  - Standard installment: $I_{\text{base}} = \lfloor \frac{T_{\text{net}}}{N} \rfloor$
  - Remainder cents/pennies: $R = T_{\text{net}} - (I_{\text{base}} \times N)$
  - Assign $I_{\text{first}} = I_{\text{base}} + R$, while installments $2 \dots N = I_{\text{base}}$.
- **Rationale**: Guarantees $\sum_{k=1}^N I_k \equiv T_{\text{net}}$ with zero discrepancy across all installment counts (1 to 12).
- **Alternatives Considered**: 
  - *Floating point fractional cents*: Rejected because currency transactions in Academy Pro OS must strictly enforce 2-decimal precision.

---

### Research Question 5: Mid-Batch Late Enrollment Fee Calculation Algorithm

- **Decision**:
  - When a student enrolls on date $E$ into a batch running from $S$ to $C$ ($T_{\text{total}}$ months):
    1. **Option 1: Align to Batch End**: Calculate elapsed duration and remaining duration. Propose prorated fee $T_{\text{prorated}} = T_{\text{net}} \times \frac{\text{Remaining Days}}{\text{Total Batch Days}}$, providing a toggle between `[ Prorate by Remaining Duration ]` and `[ Full Course Fee ]`, alongside an editable override text box. Installment count $N_{\text{rem}}$ adjusts to remaining months.
    2. **Option 2: Extend Student Timeline**: Keep total course fee and full $N$ installments, setting student's individualized completion date to $E + \text{Duration Months}$.
- **Rationale**: Matches real-world academy policies where late joiners either receive makeup classes (full fee, extended timeline) or join for remaining lectures only (prorated fee).

---

## 2. Technical Stack Verification

| Layer | Selected Library / Standard | Compliance Justification |
|---|---|---|
| **Form Inputs** | `ModernSelect`, `ModernDatePicker` | Required by Constitution Principle IV & Rule 8. Raw `<select>` and `<input type="date">` forbidden. |
| **Modal Layout** | Floating Island Modal Architecture | Required by Constitution Principle IV. Transparent canvas with separate Navy Header, White Form Card, and Floating Action Pills. |
| **Date Arithmetic** | Pure TypeScript ISO 8601 helper (`dateUtils.ts`) | Zero runtime bundle overhead; deterministic month clamping and leap-year safety. |
| **Validation** | Zod 3.24 | Required on all `/api/v1` routes. |
| **Database** | Prisma 5 with PostgreSQL | Relational integrity, soft-deletions, cascade rules. |
