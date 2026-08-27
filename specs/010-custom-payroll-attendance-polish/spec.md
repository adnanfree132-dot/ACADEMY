# Feature Specification: Dynamic Salary Remuneration, Upward Modal Dropdowns, Individual Disbursement & Multi-Status Attendance Policy

**Feature Branch**: `010-custom-payroll-attendance-polish`  
**Created**: 2026-08-27  
**Status**: Ready for Planning / Implementation  
**Input**: User prompt: "these 2 drop down menu i want to open above the layer and upside not bootomside + remove hous rent allownce +deduction types are customizablae user add deduction type and earning type tehy are not fixed cells in both deduction and earnings+layout of this whole page is not ok + there are disbursh person button for each person+there is other option also like late is there already but half leave absent"

## Clarifications

### Session 2026-08-27
- **Q:** When configuring a staff member's salary structure, how should the initial earnings and deductions list be initialized?  
  → **A:** Quick Preset Chips + Custom Item Builder (Option A): Present quick-add suggestion chips (`[ + Medical ]`, `[ + Travel ]`, `[ + Income Tax ]`, `[ + EOBI ]`, `[ + Custom Item ]`) allowing instant insertion and customizable values, alongside a free-form custom line builder.
- **Q:** How should the system determine and configure the automated thresholds for Half-Day and Absentee daily attendance?  
  → **A:** User-Configurable Hybrid Thresholds (Option A with custom inputs): Administrators configure shift grace period (minutes), late cutoff (minutes to Half-Day), minimum shift hours for Half-Day (e.g. user-defined, defaulting to 4.0 hrs), and minimum shift hours for Absent (e.g. user-defined, defaulting to 2.0 hrs).

---

## 1. Executive Summary & Core Value Proposition

This specification upgrades and polishes the Staff Payroll & Attendance subsystem in Academy Pro OS across five core functional dimensions:

1. **Upward-Opening Modal Dropdowns (`openUpward`)**: Eliminates dropdown clipping at the bottom of floating island modal forms (specifically `Payment Method` and `Disbursement Frequency`) by allowing menus to open upwards with top-layer elevation.
2. **Dynamic / Customizable Remuneration & Deductions**: Replaces rigid, hardcoded salary cells (e.g., fixed House Rent, static deductions) with a dynamic row builder with quick-add preset chips (`+ Medical`, `+ Travel`, `+ Tax`, `+ EOBI`, `+ Custom`) where administrators can add, name, value, and remove arbitrary earning/allowance items and statutory/custom deduction lines.
3. **Individual Employee Disbursement**: Guarantees clear, prominent per-row `[ Disburse ]` action buttons in the monthly payroll roster to disburse salaries on an individual basis with full payment channel and transaction reference tracking.
4. **User-Configurable 5-State Attendance Policy Engine**: Expands attendance shift rules from basic Present/Late to include user-configurable thresholds for **Present**, **Late Arrival**, **Half-Day** (user-defined cutoff mins & minimum hours), **Absent** (user-defined minimum hours), and **Approved Leave / Excused Duty**.
5. **Clean, Balanced Page Layouts**: Redesigns `CampusGeofenceSettings`, `StaffSalaryStructureModal`, and `StaffAttendanceGateway` to eliminate awkward text line wraps, fragmented spans, and misaligned grids.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Upward-Opening Dropdowns in Modal Dialogs (Priority: P1)

**As an** Administrator configuring staff compensation or attendance in a floating modal,  
**I want** dropdown select menus positioned near the bottom of the dialog to open upwards above the form layer,  
**So that** options are fully visible, selectable, and never cut off by modal borders or scrolling boundaries.

**Acceptance Scenarios**:
1. **Given** the `StaffSalaryStructureModal` is open, **When** clicking the `Payment Method` or `Disbursement Frequency` dropdown trigger, **Then** the popover menu opens upwards above the trigger element without being clipped by the scrollable card or bottom button row.
2. **Given** any `ModernSelect` component, **When** configured with `openUpward={true}` or when detecting proximity to the bottom viewport boundary, **Then** the floating menu positions above the trigger with smooth chevron rotation and high elevation z-index.

---

### User Story 2 - Dynamic Earnings & Customizable Allowances (Priority: P1)

**As an** HR/Finance Administrator,  
**I want to** define flexible, custom earning and allowance components for each staff member with quick-add suggestion chips rather than being locked into fixed fields like House Rent Allowance,  
**So that** compensation packages accurately reflect various institutional contracts (e.g., Medical, Travel, Responsibility Allowance, Overtime, Dearness Allowance).

**Acceptance Scenarios**:
1. **Given** the salary configuration dialog, **When** viewing the Earnings section, **Then** `Base Salary` is provided as the core mandatory baseline, and fixed House Rent Allowance is removed.
2. **Given** an administrator adding allowances, **When** they click a preset chip (e.g. `[ + Medical ]`, `[ + Travel ]`) or click `[ + Custom Allowance ]`, **Then** a new dynamic row appears with fields for `Allowance Title` and `Amount (PKR)`.
3. **Given** multiple dynamic earnings, **When** values are entered or rows are deleted, **Then** the `Gross Salary` automatically recalculates in real time ($\text{Gross} = \text{Base Salary} + \sum \text{Custom Earnings}$).

---

### User Story 3 - Dynamic Statutory & Custom Deductions (Priority: P1)

**As a** Finance Manager,  
**I want to** configure tailored deduction lines (Tax, EOBI, Advance Loan Repayment, Security Deposit, Late Penalty) dynamically with quick-add chips,  
**So that** institutional deductions are not restricted to fixed static cells.

**Acceptance Scenarios**:
1. **Given** the salary configuration dialog, **When** viewing the Deductions section, **Then** the user can add deduction lines using quick preset chips (`[ + Income Tax ]`, `[ + EOBI ]`, `[ + Advance Loan ]`) or `[ + Custom Deduction ]` specifying `Deduction Label` and `Amount (PKR)`.
2. **Given** dynamic deductions, **When** values change, **Then** the live Net Monthly Payable updates instantly:
   $$\text{Net Salary} = \max\left(0, \text{Gross Salary} - \sum \text{Deductions}\right)$$
3. **Given** dynamic items saved for a staff member, **When** generating monthly batch payroll or viewing digital payslips, **Then** all custom earning and deduction lines are preserved, categorized, and rendered in the institutional itemized breakdown.

---

### User Story 4 - Individual Staff Salary Disbursement (Priority: P1)

**As a** Cashier or Finance Officer,  
**I want to** disburse monthly salary to individual employees one by one with a dedicated button in the payroll table,  
**So that** staggered payments (e.g. cash payouts or phased bank transfers) can be recorded individually alongside batch disbursement.

**Acceptance Scenarios**:
1. **Given** a generated monthly payroll register, **When** viewing any staff member with `Pending` status, **Then** a prominent `[ Disburse ]` action button is available directly on that table row.
2. **Given** the user clicks `[ Disburse ]` for a single staff member, **When** the `SalaryDisbursementModal` opens, **Then** it pre-fills the employee's net payable amount, payment channel, and allows entering a transaction reference and date.
3. **Given** a successful disbursement confirmation, **When** saved, **Then** that staff row immediately reflects `Paid` status (0ms optimistic UI) with transaction details.

---

### User Story 5 - Multi-State Attendance Policy Engine (Priority: P1)

**As an** Administrator configuring campus attendance rules,  
**I want to** establish user-configurable thresholds for Present, Late, Half-Day, Absent, and Excused Leave,  
**So that** daily attendance classification and unexcused payroll absence deductions are calculated automatically with zero ambiguity.

**Acceptance Scenarios**:
1. **Given** `CampusGeofenceSettings`, **When** configuring shift rules, **Then** the interface provides structured, customizable inputs for:
   - **Present**: Shift start time + grace period window (e.g. 08:30 + user-defined grace mins).
   - **Late Arrival**: Arrival after grace period but before half-day cutoff (e.g., user-defined late cutoff mins).
   - **Half-Day**: Arrival after half-day cutoff OR total daily shift hours $<$ user-configured threshold (e.g. 4.0 hrs).
   - **Absent**: No check-in recorded OR shift hours $<$ user-configured threshold (e.g. 2.0 hrs).
   - **Excused / Approved Leave**: Formal leave requests approved by Admin (0 payroll deduction).
2. **Given** the updated policy layout, **When** viewing `CampusGeofenceSettings`, **Then** all sentences, input cards, and policy badges render in cohesive, clean cards with proper typography, zero fragmented line breaks, and responsive alignment.

---

## 3. Data Model & Entity Requirements

### 3.1 Dynamic Salary Structure (`StaffSalaryStructure`)
- `base_salary`: Float (required)
- `custom_earnings`: JSON array of `{ id: string, name: string, amount: number }`
- `custom_deductions`: JSON array of `{ id: string, name: string, amount: number }`
- `gross_salary`: Computed sum ($\text{base} + \sum \text{earnings}$)
- `total_deductions`: Computed sum ($\sum \text{deductions}$)
- `net_standard_salary`: Computed net ($\max(0, \text{gross} - \text{total\_deductions})$)
- `payment_method`: String (`'Bank Transfer' | 'Cash' | 'Cheque' | 'Mobile Wallet'`)
- `disbursement_frequency`: String (`'Monthly' | 'Bi-Weekly' | 'Weekly'`)
- `bank_name`, `account_number`, `account_title`: Optional strings

### 3.2 Monthly Payroll Item (`StaffSalaryPayment`)
- Preserves itemized `custom_earnings` and `custom_deductions` snapshots in JSON format.
- Pro-rata unexcused absence calculations deduct:
  $$\text{Deduction} = \left(\frac{\text{Base Salary}}{\text{Days in Month}}\right) \times \text{Unexcused Units}$$
  *(where Absent = 1.0 unit, Half-Day = 0.5 unit, Late = policy-defined or 0 unit, Excused Leave = 0 unit).*

### 3.3 Institutional Attendance Shift Policy (`AppSetting: "attendance_policy"`)
- `shift_start_time`: String (e.g. `"08:30"`)
- `shift_end_time`: String (e.g. `"16:30"`)
- `grace_period_minutes`: Number (e.g. `15`)
- `half_day_late_cutoff_minutes`: Number (e.g. `90`)
- `half_day_min_hours`: Number (e.g. `4.0`)
- `absent_min_hours`: Number (e.g. `2.0`)
- `strict_geofence`: Boolean

---

## 4. Success Criteria

1. **100% Upward Dropdown Visibility**: All bottom dropdowns in modal dialogs open upwards cleanly without overflow clipping.
2. **Infinite Dynamic Remuneration Lines**: Users can add and remove unlimited custom earning/deduction rows with 0 layout shift and instant real-time gross/net recalculation.
3. **1-Click Individual & Batch Disbursement**: Every row offers dedicated individual disbursement alongside top-level bulk disbursement.
4. **Complete 5-State User-Configurable Attendance Classification**: Real-time evaluation of Present, Late, Half-Day, Absent, and Leave states with user-customizable hour/minute thresholds.
5. **Zero Compilation or Runtime Errors**: Frontend and backend pass all builds and automated tests with 100% test pass rate.
