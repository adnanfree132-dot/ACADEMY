# Feature Specification: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Feature Branch**: `007-advanced-fee-billing-installments`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "YOU ADD SCHOLARSHIP IN THE VIEW BUTTON BUT NOT IN THE STUDENT ADD FORM ALSO THERE MUST BE A DATE WHICH SHOW WHEN TO WHEN FEES IS CHARGED LIKE A STUDENT JOINED ON 15TH IS NEXT FEES WILL BE GENERATED ON NEXT MONTH 15 ALSO IN SOME CASES AFTER HALF MOTNH IS PASSED LIKE 16 PARENTS SAYS THAT WE SUBMIT HALF FEES OF THAT MONTH SO SYSTE HAVE TO AUTO CALCULATE THAT HALF FEES BUT THIS HALF FEES CAN BE CHANGED BY USER BECAUSE IN SOME CASE WE DONT HAVE TO SIMPLY CHARGE FEES HALF SOMETIMEE USER CHARGE LESS SO FIRST TIME FEES WLL BE CHANGE BY USER IF STUDENTS ADMISSION DATE IS DIFFERENT ONE MORE THING IN BATCH SYSTEM THERE IS INSTALLMENTS OF FEESES NOT MONTHLY BASE SO THERE IS OPTION OF THAT USER HAVE TO SELECT START OF THE STUDENT BATCH AND ENDING OF THE BATCH AND TELL HOW MUCH INSTALLMENTS SYTEM AUTO CALCULATE INSTALLEMNEST AMOUNT AND ALSO THEIR DUE DATES BUT THEIR IS EDGE CASE WE HAVE TO CREATE BATCH SECTION IN CLASS SECTION ALSO BUT THERE IS ANOTHER EDGE CASE SOME STUDENTS JOIN MID OF THE BATCH SO THEIR BATCH ENDING DATE IS NOT RELATED TO BATCH ENDING DATE FOR EXAMPLE STUDENT ENROLL ONE COMPUTER 3 MONTH COURSE START FROM AUGUT TO OCTOBER BUT ANOTHER STUDENT JOIN SAME BATCH IN SEPTEMBER BUT IN SOME SCENRIOS STUDENT BATCHES ENDED IN OCTOBER BUT IN SOME CASES STUDENTS MISSES ONE MONTH HAVE TO BE EXTENDED TO NOVEMBER AND ALSO FEES"

## Clarifications

### Session 2026-08-19
- Q: When a student takes admission midway through a billing month (e.g. on or after 16th), how should the default fee proposal calculate? → A: Preset chips for `[ 50% Half-Month ]` and `[ Exact Daily Pro-Rata ]` with an editable input field for manual override.
- Q: When a student is enrolled in a multi-installment batch course, how should the system create and track the installment vouchers in their fee ledger? → A: Generate only the 1st installment voucher at enrollment, and auto-generate subsequent vouchers via recurring cron as each due date arrives.
- Q: When applying a scholarship discount (percentage or fixed amount) to a student on a multi-installment course plan, how should the discount be distributed across installments? → A: Deduct the discount from the total course fee first, then divide the net amount evenly across all installments.
- Q: When a student with an individualized billing cycle (e.g., 15th of each month) is invoiced, how should the payment due date and grace period before overdue status be determined? → A: Standard 5 calendar days from the invoice anchor date (e.g., issued Aug 15 → Due Aug 20; marked Overdue on Aug 21 if unpaid).
- Q: When a student joins a batch course mid-way (e.g., Month 2 of a 3-month course) and chooses to align with the existing batch end date, how should the system calculate the fee amount? → A: Toggle between "Prorate by Remaining Duration" and "Full Course Fee", with an editable input field for manual override.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scholarship & Custom Fee Plan at Student Registration (Priority: P1)

As an Academy Administrator, when registering a new student, I want to configure their base tuition fee, scholarship discount percentage/fixed amount, discount category/reason, and customized first billing cycle directly on the registration form, so that the student is immediately enrolled with accurate fee terms without requiring a secondary navigation step.

**Why this priority**: Eliminates administrative friction, ensures billing accuracy from day one, and prevents billing discrepancies for newly admitted students.

**Independent Test**: Register a new student with a 25% Merit Scholarship and a custom base fee. The created student profile immediately reflects the discounted net fee and correct initial invoice voucher.

**Acceptance Scenarios**:
1. **Given** the Student Registration modal is open, **When** the admin selects or enters a Scholarship Discount (percentage or fixed PKR amount) and Reason, **Then** the net monthly fee is live-calculated and displayed with clear breakdown before submission.
2. **Given** a student is submitted with a 20% scholarship, **When** the student record is created, **Then** their initial fee ledger and recurring fee plan reflect the 20% discount automatically.

---

### User Story 2 - From-To Coverage Dates & Anchor-Date Recurring Billing (Priority: P1)

As an Administrator, I need every generated fee voucher and receipt to explicitly show the exact coverage period ("From Date to To Date", e.g., "15 Aug 2026 to 14 Sep 2026"), and have subsequent monthly fees anchor to the student's admission/start date (e.g., generating next month on the 15th).

**Why this priority**: Provides total transparency for parents and accountants regarding which date range a fee payment covers, eliminating disputes over billing periods.

**Independent Test**: Enroll a student on August 15. Verify that the initial fee voucher specifies `15-Aug-2026 to 14-Sep-2026`, and the system sets the next billing cycle anchor to `15-Sep-2026`.

**Acceptance Scenarios**:
1. **Given** a student joining on date $D$ (e.g. 15th), **When** a monthly fee voucher is generated, **Then** it clearly states the coverage range from $D$ to $(D - 1)$ of the following month, sets the payment due date to $D + 5$ calendar days (e.g. 20th), and transitions to `Overdue` on $D + 6$ calendar days if unpaid.
2. **Given** a monthly recurring invoice job, **When** evaluating dues, **Then** each student's billing date recurs based on their individualized cycle anchor date.

---

### User Story 3 - Prorated Mid-Month Admission Fee with Editable Admin Override (Priority: P1)

As an Administrator, when a student takes admission midway through a calendar month or billing period (e.g., after the 15th), I want the system to auto-calculate a proposed half-month or prorated fee, while allowing me to freely edit and override this first-month charge to any custom amount agreed upon with the parent.

**Why this priority**: Real-world admissions frequently happen mid-month. Parents expect reduced fees for partial months, but academy rules or negotiations vary (e.g. 50% flat, exact pro-rata, or special discounted entry).

**Independent Test**: Select an admission date of August 18 for a standard 4,000 PKR monthly fee. The modal proposes an initial fee of 2,000 PKR (or daily pro-rata), but allows the admin to edit this value to 1,500 PKR before confirming.

**Acceptance Scenarios**:
1. **Given** a student registered on the 16th or later in a month, **When** the admission date is chosen, **Then** the system presents an auto-calculated partial/half fee recommendation badge.
2. **Given** the auto-calculated partial fee, **When** the admin manually edits the first-month charge input field, **Then** the system accepts and commits the overridden amount for the initial invoice.

---

### User Story 4 - Batch/Course Installment Billing with Auto-Calculated Due Dates (Priority: P2)

As a Course / Batch Coordinator, for fixed-duration programs (e.g., 3-Month Web Development or 6-Month Graphics Course), I want to configure total course fees and divide them into a specified number of installments ($N$ installments), with the system automatically generating the installment breakdown, amounts, and scheduled due dates distributed across the course start and end dates.

**Why this priority**: Short-term courses and bootcamps operate on installment plans rather than indefinite monthly tuition.

**Independent Test**: Create a 3-month course running Aug 1 to Oct 31 with a 15,000 PKR total fee in 3 installments. Verify that the system schedules 3 installments of 5,000 PKR, issues the initial voucher (Installment 1 of 3) immediately at enrollment, and schedules installments 2 and 3 for automatic generation on Sep 1 and Oct 1.

**Acceptance Scenarios**:
1. **Given** a batch course with start date, end date, total fee, and installment count $N$, **When** the plan is configured, **Then** the system calculates $N$ equal (or custom) installment amounts and evenly spaces due dates across the duration.
2. **Given** an enrolled student in installment mode, **When** viewing the student's fee ledger, **Then** the 1st installment voucher is generated immediately, while upcoming installments are tracked as scheduled plan entries that auto-generate active invoice vouchers as their due dates arrive.

---

### User Story 5 - Mid-Batch Enrollment with Individual Extended Completion Timelines (Priority: P2)

As an Administrator, when a student joins an existing batch mid-way (e.g. Batch started in August, student joins in September), I want the flexibility to either:
1. Prorate/adjust remaining installments to complete with the batch in October, OR
2. Extend that specific student's personal completion date to November (to cover missed curriculum) with an individualized installment schedule.

**Why this priority**: Accommodates students joining late who receive makeup lectures or extended access without disrupting the shared batch entity.

**Independent Test**: Enroll Student A in Month 2 of a 3-month batch. Choose "Extended Student Timeline" extending completion from Oct 31 to Nov 30. Verify Student A's installment schedule spans September to November while the parent batch timeline remains intact.

**Acceptance Scenarios**:
1. **Given** an existing batch running Aug–Oct, **When** a student is enrolled on Sep 10, **Then** the enrollment modal offers "Align to Batch End (Oct)" (with a toggle between "Prorate by Remaining Duration" and "Full Course Fee", plus editable override) or "Extend Student Timeline (e.g. Nov)".
2. **Given** "Extend Student Timeline" is selected, **When** installments are computed, **Then** the student's personal due dates and invoice vouchers follow the extended timeline.

---

### Edge Cases

- **Admission on 29th, 30th, or 31st**: For dates like Jan 31st, the next billing date automatically rolls safely to the last day of February (Feb 28/29) without crashing or skipping months.
- **100% Full Scholarship / Free Ship**: Zero fee invoices are created with a special status `Scholarship 100% (No Payment Required)` and generate clean zero-due certificates.
- **Custom Installment Uneven Division**: If 10,000 PKR is divided into 3 installments (3,333.33), the system assigns 3,334 to the first installment and 3,333 to the remaining two to ensure exact penny balancing.
- **Student Dropping / Early Batch Exit**: If a student leaves a batch course mid-way, remaining future installments are marked `Cancelled - Withdrawn` without corrupting past paid installments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow configuring Scholarship Type (Percentage or Fixed Amount), Scholarship Reason, and Custom Base Fee directly inside `RegisterStudentModal` and `CreateModal`.
- **FR-002**: System MUST display a live breakdown of Gross Fee, Scholarship Discount, and Net Payable Fee inside the student registration and edit forms.
- **FR-003**: System MUST record explicit `feePeriodStart` (From Date) and `feePeriodEnd` (To Date) on all invoice vouchers and display this range on generated slips and receipts.
- **FR-004**: System MUST support customized billing anchor dates (e.g. recurring on the 15th of each month for a student who joined on the 15th) with automated payment due date set to 5 calendar days after the anchor issuance date before transitioning to `Overdue`.
- **FR-005**: System MUST automatically suggest a prorated fee amount when a student's admission date falls mid-cycle (e.g. $\ge 16\text{th}$ of the month).
- **FR-006**: System MUST provide an editable override field for the initial/first-month fee so administrators can manually set any agreed-upon initial amount.
- **FR-007**: System MUST support Batch / Course Installment Billing Mode in addition to standard Monthly Tuition Mode.
- **FR-008**: System MUST auto-calculate installment amounts and distributed due dates based on Total Course Fee (deducting any applicable scholarship discount upfront before dividing into $N$ equal installments), Start Date, End Date, and Installment Count ($N$), issuing the 1st installment voucher immediately at enrollment and auto-generating subsequent vouchers via recurring schedule as their due dates arrive.
- **FR-009**: System MUST allow administrators to customize individual installment amounts and specific due dates if unequal distribution is desired.
- **FR-010**: System MUST support Mid-Batch Late Enrollment, providing options for both "Prorated Batch Completion" (with toggle between pro-rata duration calculation and full course fee, plus editable amount override) and "Extended Individual Student Timeline".
- **FR-011**: System MUST support Batch / Section mapping across Classes and Courses.

### Key Entities

- **StudentFeeProfile**: Stores `baseMonthlyFee`, `scholarshipType` (`percentage` | `fixed` | `none`), `scholarshipValue`, `scholarshipReason`, `billingCycleAnchorDay`, `billingMode` (`monthly_recurring` | `course_installments`).
- **FeeInvoice / FeeVoucher**: Includes `feePeriodStart`, `feePeriodEnd`, `installmentNumber`, `totalInstallments`, `grossAmount`, `discountAmount`, `netAmount`, `paidAmount`, `dueDate`, `status`.
- **BatchCoursePlan**: Stores `totalCourseFee`, `defaultInstallments`, `startDate`, `endDate`, `courseDurationMonths`.
- **StudentBatchEnrollment**: Stores `studentId`, `batchId`, `enrolledOn`, `individualEndDate`, `isExtendedTimeline`, `customInstallmentPlan`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can configure scholarship discounts during initial registration in under 15 seconds without navigating to secondary menus.
- **SC-002**: 100% of generated fee slips and PDF receipts display unambiguous "From [Date] to [Date]" coverage periods.
- **SC-003**: Prorated first-month fee calculations appear instantly (< 50ms) upon selecting an admission date, with 1-click manual override capability.
- **SC-004**: Batch course installment schedules generate accurately with exact penny reconciliation matching total course fees across all installment counts (1 to 12).
- **SC-005**: Mid-batch late enrollments with extended timelines correctly calculate individual schedules without modifying batch-level baseline dates.

## Assumptions

- **Currency & Formatting**: All amounts default to Pakistani Rupee (PKR) or standard active institute currency formatted with thousands separators.
- **UI Design System**: All new form controls and date selectors will strictly adhere to `ModernSelect`, `ModernDatePicker`, and Floating Island architecture per `.agents/AGENTS.md`.
- **Backward Compatibility**: Existing students without explicit billing anchors default to standard 1st-of-the-month cycles.
