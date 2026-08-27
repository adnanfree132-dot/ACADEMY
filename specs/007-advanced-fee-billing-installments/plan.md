# Implementation Plan: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Branch**: `007-advanced-fee-billing-installments` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-advanced-fee-billing-installments/spec.md`

---

## Summary

Implement a robust full-stack vertical slice for advanced fee management in Academy Pro OS:
1. **Scholarship & Fee Configuration at Student Registration**: Configure base fees, scholarship discounts (% or fixed PKR), discount reasons, and customizable initial billing cycles directly inside `RegisterStudentModal` with live mathematical breakdowns.
2. **From-To Coverage Dates & Anchor-Date Recurring Billing**: Display unambiguous "From [Date] to [Date]" coverage periods on all fee slips and receipts, with automated cycle anchor tracking (e.g. 15th to 14th) and standard 5-day due date windows before transitioning to overdue.
3. **Prorated Mid-Month Admissions**: Live pro-rata and half-month fee recommendations with editable admin overrides for students admitted mid-cycle.
4. **Batch Course Installments**: Automated installment breakdown ($N$ installments), exact penny balancing, and scheduled due date spacing across course duration for fixed-term batches.
5. **Mid-Batch Late Enrollments**: Flexible alignment options ("Align to Batch End" with pro-rata duration toggle or "Extend Student Timeline" with individualized installment schedule).

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ / React 18.2+  
**Primary Dependencies**: Express 4, Prisma Client 5, Zod 3.24, Lucide React, CSS Design System  
**Storage**: PostgreSQL (via Supabase) / Prisma ORM  
**Testing**: Playwright automated E2E audits, REST API integration checks, `tsc` compilation checks  
**Target Platform**: Responsive Web (Desktop, Tablet & Mobile)  
**Project Type**: Full-Stack Web Application (React SPA + Express API Backend)  
**Performance Goals**: < 50ms reactive fee calculation in registration modals; < 100ms API response for batch installment generation; zero penny-reconciliation drift  
**Constraints**: Zero hard deletes (soft-deletes with status flags); Floating Island Modal Architecture on all forms; strict `ModernSelect` and `ModernDatePicker` controls; strict prohibition of raw Unicode emojis  
**Scale/Scope**: Multi-batch academy with recurring monthly students and multi-installment course bootcamps  

---

## Constitution Check

*GATE: Must pass before implementation. Evaluated against `/memory/constitution.md`.*

| Principle | Compliance Status | Architectural Justification |
| :--- | :---: | :--- |
| **I. Full-Stack Vertical Slices** | PASS | Fully covers all 4 layers: Frontend UI components (`RegisterStudentModal`, `EditStudentModal`, `RecordFeeModal`, `StudentLedgerModal`, `BatchesView`), API Client (`apiClient.ts`), Backend Express Router with Zod validation (`routes.ts`), and Prisma ORM Models (`StudentFeePlan`, `FeeInvoice`, `Batch`, `Enrollment`, `StudentInstallmentSchedule`). |
| **II. Layered Architecture** | PASS | Routes strictly pass through JWT authentication (`authenticateJwt`), role verification (`requireRole`), Zod validation schemas, business logic (installment calculators, pro-rata formulas, anchor clamping), Prisma queries, and audit logging. |
| **III. Soft Deletes & Auditing** | PASS | Hard deletes are strictly forbidden; cancelled installment schedules and removed enrollments preserve historical financial records; all fee overrides and adjustments are logged in `AuditLog`. |
| **IV. UI/UX Taste Standards** | PASS | Adheres strictly to Floating Island Modal Architecture (transparent canvas, dark navy `#0F172A` header island, white form card island, floating action pill island), `ModernSelect`, `ModernDatePicker`, theme-matching Lucide icons, and zero Unicode emojis. |
| **V. Multi-Role RBAC** | PASS | Admin authorization required for fee discounts, custom overrides, and installment schedule configurations; parents/students receive read-only ledger views. |
| **VI. Quality Gates** | PASS | Validated with `tsc --noEmit`, Playwright scenario runs, and deterministic database updates. |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-advanced-fee-billing-installments/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural decisions & calculation algorithms
├── data-model.md        # Phase 1 Prisma models & Zod validation schemas
├── quickstart.md        # Phase 1 verification workflows & test scenarios
├── contracts/           # Phase 1 API schema contracts
│   └── api-contracts.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Modifications

```text
d:/academy/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # [MODIFY] Extend Batch, Enrollment, FeeInvoice, StudentFeePlan, add StudentInstallmentSchedule
│   │   └── seed.ts               # [MODIFY] Seed batches with course installment plans and students with anchor dates
│   └── src/
│       ├── utils/
│       │   └── billingUtils.ts   # [NEW] Pro-rata, anchor clamping, installment calculation, and penny balancing utilities
│       └── routes.ts             # [MODIFY] Extend student creation/edit, fee invoice generation, batch enrollment, installment plans
├── src/
│   ├── api/
│   │   └── apiClient.ts          # [MODIFY] Add fee plan, batch installment, and prorated admission API methods
│   ├── types.ts                  # [MODIFY] Add scholarship types, installment schedule interfaces, coverage date fields
│   ├── utils/
│   │   └── feeCalculator.ts      # [NEW] Frontend client-side live calculation & pro-rata presets helper
│   ├── components/
│   │   ├── RegisterStudentModal.tsx # [MODIFY] Add scholarship section, anchor day, pro-rata chips, and live calculation card
│   │   ├── EditStudentModal.tsx     # [MODIFY] Support scholarship edits, base fee adjustment, and anchor day changes
│   │   ├── RecordFeeModal.tsx       # [MODIFY] Display From-To coverage dates, installment indicator (e.g. "Inst. 1 of 3")
│   │   ├── StudentLedgerModal.tsx   # [MODIFY] Display coverage periods, installment sequence, and scheduled vouchers
│   │   ├── EnrollStudentBatchModal.tsx # [NEW/MODIFY] Batch enrollment with installment preview & late joiner timeline toggle
│   │   └── FeeSlipModal.tsx         # [MODIFY] Explicit From-To coverage display on print/share slips
│   └── pages/
│       ├── FeesView.tsx             # [MODIFY] Show From-To coverage dates, installment badges, and overdue indicators
│       └── BatchesView.tsx          # [MODIFY] Batch course duration, total course fee, and default installment configuration
```

---

## Implementation Phases

### Phase 1: Database Schema & Backend Core Logic
1. Update `server/prisma/schema.prisma`:
   - Extend `Batch` (`course_type`, `total_fee`, `start_date`, `end_date`, `default_installments`, `section_name`).
   - Extend `StudentFeePlan` (`scholarship_type`, `scholarship_value`, `scholarship_reason`, `billing_anchor_day`, `billing_mode`).
   - Extend `FeeInvoice` (`fee_period_start`, `fee_period_end`, `installment_number`, `total_installments`, `billing_anchor_day`).
   - Extend `Enrollment` (`is_extended_timeline`, `individual_end_date`).
   - Add `StudentInstallmentSchedule` (`id`, `enrollment_id`, `installment_number`, `total_installments`, `amount`, `due_date`, `fee_period_start`, `fee_period_end`, `invoice_id`, `status`).
2. Run `npx prisma generate` and `npx prisma db push`.
3. Create `server/src/utils/billingUtils.ts` containing pure mathematical and date-clamping helpers:
   - `calculateProRataFee(baseMonthlyFee, admissionDate, anchorDay)`
   - `calculateInstallmentSchedule(totalFee, scholarshipDiscount, startDate, endDate, installmentCount)`
   - `calculateNextCyclePeriod(anchorDay, currentMonth, currentYear)`
4. Extend `server/src/routes.ts`:
   - Registration endpoint `POST /api/v1/students` to handle scholarship fields, anchor days, and initial prorated invoice creation.
   - Batch enrollment endpoint `POST /api/v1/batches/:id/enroll` to support installment plan generation and late enrollment timeline extension.
   - Invoice generation endpoints to embed `fee_period_start`, `fee_period_end`, and installment metadata.

### Phase 2: Frontend API Client & State Types
1. Update `src/types.ts` with `ScholarshipType`, `ScholarshipReason`, `StudentFeePlanData`, `InstallmentScheduleItem`, `FeeInvoiceWithPeriod`.
2. Update `src/api/apiClient.ts` with typed endpoints for fee calculations, batch installment setup, and schedule fetching.
3. Create `src/utils/feeCalculator.ts` for reactive instant (< 50ms) preview calculations in UI modals.

### Phase 3: UI Components & Floating Island Modals
1. Update `RegisterStudentModal.tsx`:
   - Incorporate the Floating Island Scholarship & Custom Fee Plan section.
   - Add Admission Date selector with automatic mid-month pro-rata proposal badge (`[ 50% Half-Month ]`, `[ Exact Daily Pro-Rata ]`) and editable initial fee override field.
   - Add live calculation breakdown card displaying Gross Fee, Scholarship Discount (-PKR), and Net Payable Initial Fee.
2. Update `EditStudentModal.tsx` to allow updating scholarships and billing anchor days.
3. Update `EnrollStudentBatchModal.tsx` / `BatchesView.tsx`:
   - Support Course Installment mode configuration.
   - Provide Mid-Batch Late Enrollment controls ("Align to Batch End" vs "Extend Student Timeline").
4. Update `RecordFeeModal.tsx`, `StudentLedgerModal.tsx`, `FeeSlipModal.tsx`, and `FeesView.tsx`:
   - Display unambiguous `From [Date] to [Date]` coverage ranges on all table rows, vouchers, ledger items, and printable slips.
   - Display Installment badges (e.g., `Installment 1 of 3`) for course batches.

### Phase 4: Verification & Automated E2E Testing
1. Run `npx tsc --noEmit` across client and server.
2. Create automated validation script verifying:
   - Student registration with 20% scholarship creating correct discounted initial invoice.
   - Admission on August 18 generating pro-rata proposal and accepting manual override.
   - Course batch with 3 installments penny-reconciled to exact total.
   - Mid-batch late enrollment with extended timeline.
   - Accurate From-To coverage display on fee slips.
