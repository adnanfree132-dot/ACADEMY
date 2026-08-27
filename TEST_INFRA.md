# Academy Pro OS — Enterprise Staff Payroll & GPS Attendance E2E Test Infrastructure

## Overview

The Enterprise Staff Payroll & GPS Attendance E2E Test Suite provides comprehensive, requirement-driven, opaque-box integration verification for:
1. **Campus GPS Geofence Configuration & Geolocation Attendance Gateway** (Haversine formula perimeter verification, shift arrival status, 15-minute grace window).
2. **Administrative Attendance Oversight & Manual Override** (Daily/Monthly roster, status adjustments, mandatory audit reason logging).
3. **Staff Salary Structures & 1-Click Monthly Batch Payroll** (Itemized allowances, statutory deductions, days-in-month base rate, pro-rata absence deduction algorithm).
4. **Salary Disbursement & Institutional Payslips** (Payment methods, transaction references, PDF/WhatsApp digital advice).

The test harness communicates over standard HTTP/REST network boundaries against the backend Express server (`http://localhost:5000/api/v1`), asserting response contracts, status codes, payload structures, calculation precision, boundary extremes, and real-world multi-step workflows.

---

## 4-Tier Test Methodology & Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│     ACADEMY PRO OS — ENTERPRISE PAYROLL & GPS ATTENDANCE E2E SUITE      │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│    TIER 1     │             │    TIER 2     │             │    TIER 3     │
│   FEATURE     │             │  BOUNDARY &   │             │ CROSS-FEATURE │
│   COVERAGE    │             │ CORNER CASES  │             │ PAIRWISE FLOW │
│  (8 Features) │             │ (11 Boundary) │             │(Combinations) │
│  [40 Tests]   │             │  [55 Tests]   │             │  [19 Tests]   │
└───────────────┘             └───────────────┘             └───────────────┘
       │                             │                             │
       └─────────────────────────────┼─────────────────────────────┘
                                     ▼
                              ┌───────────────┐
                              │    TIER 4     │
                              │  REAL-WORLD   │
                              │5 STAFF CYCLES │
                              │ + BATCH AGGR  │
                              │   [6 Tests]   │
                              └───────────────┘
                                     │
                              ┌───────────────┐
                              │  TOTAL SUITE  │
                              │   120 TESTS   │
                              └───────────────┘
```

### 1. Tier 1: Feature Coverage (40 Tests)
Validates primary behavior and interface contracts for all 8 functional features (>= 5 test cases per feature):
- **Feature 1.1: Campus GPS Geofence Settings** (`GET`, `PUT /api/v1/settings/geofence`, `POST /api/v1/settings/geofence/test`) — 5 tests.
- **Feature 1.2: Haversine Distance & Perimeter Gateway** (`POST /api/v1/staff-attendance/check-in`, distance feedback) — 5 tests.
- **Feature 1.3: Shift Arrival & Grace Period Logic** (Shift start + 15m grace window -> 'present' vs 'late') — 5 tests.
- **Feature 1.4: Staff Check-In & Check-Out Backend** (`check-in`, `check-out`, `roster`, total working hours) — 5 tests.
- **Feature 1.5: Administrative Attendance Oversight & Override** (`POST /api/v1/staff-attendance/override`, mandatory reason, `AuditLog`) — 5 tests.
- **Feature 1.6: Staff Salary Structure Management** (`GET`, `POST`, `PUT /api/v1/staff-salary-structures`, itemized compensation) — 5 tests.
- **Feature 1.7: Pro-Rata Absence Deduction Engine** (`(base / days_in_month) * (absences + 0.5 * half_days)`) — 5 tests.
- **Feature 1.8: 1-Click Monthly Batch Payroll & Disbursement** (`POST /generate-batch`, `batches`, `payslips/:id/disburse`) — 5 tests.

### 2. Tier 2: Boundary & Corner Cases (55 Tests)
Stresses mathematical limits, calendar anomalies, edge coordinates, and strict validation (5 tests per boundary):
- **Boundary 2.1: Exact Boundary Radius Limits** ($d = R$, $d = R - 0.001$, $d = R + 0.001$, $d = R + 10\text{m}$, dynamic 500m) — 5 tests.
- **Boundary 2.2: 0m Distance & Campus Origin** (Exact center 0.00m, sub-meter micro-offsets, equator $0,0$, polar $60^\circ\text{N}$, 0m radius) — 5 tests.
- **Boundary 2.3: Antipodal & Extreme Spherical Coordinates** (True antipode ~20,015 km, pole-to-pole, Date Line crossing, out-of-range lat $>90^\circ$, non-numeric) — 5 tests.
- **Boundary 2.4: Zero Absence Days Full Payout** (31-day, 30-day, 28-day, 29-day leap year, approved excused leaves -> 0 deduction) — 5 tests.
- **Boundary 2.5: Month Lengths (31 vs 30 vs 28 Days)** (Jan/Aug/Dec 31, Apr/Jun/Sep/Nov 30, Feb 28, daily rates: $50\text{k}/31=1612.90$, $50\text{k}/30=1666.67$) — 5 tests.
- **Boundary 2.6: Leap Year February (29 vs 28 Days)** (2024=29, 2025=28, 2028=29, Century 2000=29, Century 2100=28) — 5 tests.
- **Boundary 2.7: Maximum Allowances & High Financial Precision** (5M base, fractional allowances, 30 days absence, 100% absence deduction, 2-decimal rounding) — 5 tests.
- **Boundary 2.8: Zero Base Pay Handling** (0 base with allowances, 0 base absence calc without NaN, 0 gross/net, negative base rejection, missing staff ID rejection) — 5 tests.
- **Boundary 2.9: Negative Balance Guard** (Deductions $>$ Gross clamped to Net = 0.00, full absence + tax clamp, extreme other deductions clamp, non-negative balance constraint, batch aggregate sum) — 5 tests.
- **Boundary 2.10: Invalid Timestamps & Malformed Payloads** (Invalid month 13, month 0, negative year -2026, check-out before check-in 0h clamp, non-existent staff member 404/400) — 5 tests.
- **Boundary 2.11: Mandatory Audit Reason & Access Oversight** (Missing reason rejection, empty string rejection, whitespace rejection, invalid status enum rejection, audit log trail creation) — 5 tests.

### 3. Tier 3: Cross-Feature Combinations & Pairwise Flows (19 Tests)
Validates interactions across multiple subsystems:
- **Combination 3.1**: Check-in late $\rightarrow$ Admin override to present with audit reason $\rightarrow$ Monthly payroll generation treats day as present (0 deduction) — 3 tests.
- **Combination 3.2**: Unexcused absence + half-day + excused leave $\rightarrow$ Payroll deduction isolates unexcused units ($2 + 0.5 = 2.5$) and computes net pay — 3 tests.
- **Combination 3.3**: Batch payroll generation $\rightarrow$ Individual payslip disbursement via Bank Transfer $\rightarrow$ Transaction ref recorded, batch financial ledger verified — 3 tests.
- **Combination 3.4**: Campus radius dynamically increased from 100m to 200m $\rightarrow$ Device at 111m transitions from rejected to accepted — 2 tests.
- **Combination 3.5**: Approved medical leave request excluded from payroll absence deduction $\rightarrow$ Leave records linked to staff member verified — 2 tests.
- **Combination 3.6**: Staff salary structure updated mid-cycle $\rightarrow$ Batch payroll regenerated reflecting new base and daily rate — 2 tests.
- **Combination 3.7**: Admin override modifying Absent (1.0 unit) to Half-Day (0.5 unit) $\rightarrow$ Net pay increases by 50% daily rate — 2 tests.
- **Combination 3.8**: Complete check-in to check-out cycle $\rightarrow$ Working hours computed as 8.5 hours with orphan safety — 2 tests.

### 4. Tier 4: Real-World Scenarios (6 Tests / Workflows)
Exercises 5 end-to-end full month cycles for diverse faculty members in August 2026 (31 days) plus institutional batch aggregation:
- **Workflow 4.1: Dr. Sarah Khan (On-Time Model Teacher)**
  - Base: 80,000 | HRA: 20,000 | Med: 8,000 | Conv: 5,000 | Tax: 5,000 | PF: 4,000
  - On-time check-ins every day $\rightarrow$ Absences: 0 $\rightarrow$ Gross: 113,000 | Deductions: 9,000 | **Net: 104,000.00**.
- **Workflow 4.2: Prof. Tariq Mahmood (Late Within Grace Period)**
  - Base: 70,000 | HRA: 15,000 | Med: 7,000 | Conv: 4,000 | Tax: 4,000 | PF: 3,500
  - Check-in 08:08 AM (within 15m grace) $\rightarrow$ Status: Present $\rightarrow$ Gross: 96,000 | Deductions: 7,500 | **Net: 88,500.00**.
- **Workflow 4.3: Mr. Bilal Ahmed (Late Past Grace Period)**
  - Base: 55,000 | HRA: 12,000 | Med: 5,000 | Conv: 3,000 | Tax: 2,500 | PF: 2,500
  - Check-in 08:25 AM (past grace) $\rightarrow$ Status: Late logged $\rightarrow$ Gross: 75,000 | Deductions: 5,000 | **Net: 70,000.00**.
- **Workflow 4.4: Ms. Ayesha Siddiqa (Teacher on Approved Medical Leave)**
  - Base: 62,000 | HRA: 14,000 | Med: 6,000 | Conv: 4,000 | Tax: 3,000 | PF: 3,000
  - 3 approved medical leave days $\rightarrow$ Absence deduction: 0.00 $\rightarrow$ Gross: 86,000 | Deductions: 6,000 | **Net: 80,000.00**.
- **Workflow 4.5: Mr. Hamza Ali (Teacher with Unexcused Absences & Half-Day)**
  - Base: 62,000 | HRA: 10,000 | Med: 5,000 | Conv: 3,000 | Tax: 2,000 | PF: 2,000
  - 2 unexcused absences + 1 half-day ($2.5$ units) $\rightarrow$ Daily rate: $2,000.00$ $\rightarrow$ Absence deduction: $5,000.00$.
  - Gross: 80,000 | Total Deductions: 9,000 ($5\text{k} + 2\text{k} + 2\text{k}$) $\rightarrow$ **Net: 71,000.00**.
- **Workflow 4.6: Institutional Monthly Batch Aggregation & Disbursement**
  - Total Gross: **450,000.00** | Total Deductions: **36,500.00** | Total Net Payable: **413,500.00**.
  - Verified ledger consistency: $\text{Gross} - \text{Deductions} = \text{Net}$.

---

## Complete Coverage Matrix

| Tier | Category / Feature | Test Count | Status |
|:----:|:-------------------|:----------:|:------:|
| **Tier 1** | Campus GPS Geofence Settings | 5 | ✅ Passed (100%) |
| **Tier 1** | Haversine Distance & Perimeter Gateway | 5 | ✅ Passed (100%) |
| **Tier 1** | Shift Arrival & Grace Period Logic | 5 | ✅ Passed (100%) |
| **Tier 1** | Staff Check-In & Check-Out Backend | 5 | ✅ Passed (100%) |
| **Tier 1** | Administrative Attendance Override | 5 | ✅ Passed (100%) |
| **Tier 1** | Staff Salary Structure Management | 5 | ✅ Passed (100%) |
| **Tier 1** | Pro-Rata Absence Deduction Engine | 5 | ✅ Passed (100%) |
| **Tier 1** | 1-Click Monthly Batch Payroll & Disbursement | 5 | ✅ Passed (100%) |
| **Tier 2** | Exact Boundary Radius Limits | 5 | ✅ Passed (100%) |
| **Tier 2** | 0m Distance & Campus Origin | 5 | ✅ Passed (100%) |
| **Tier 2** | Antipodal & Extreme Coordinates | 5 | ✅ Passed (100%) |
| **Tier 2** | Zero Absence Days Full Payout | 5 | ✅ Passed (100%) |
| **Tier 2** | Month Lengths (31 vs 30 vs 28 Days) | 5 | ✅ Passed (100%) |
| **Tier 2** | Leap Year February (29 vs 28 Days) | 5 | ✅ Passed (100%) |
| **Tier 2** | Maximum Allowances & High Financial Precision | 5 | ✅ Passed (100%) |
| **Tier 2** | Zero Base Pay Handling | 5 | ✅ Passed (100%) |
| **Tier 2** | Negative Balance Guard | 5 | ✅ Passed (100%) |
| **Tier 2** | Invalid Timestamps & Malformed Payloads | 5 | ✅ Passed (100%) |
| **Tier 2** | Mandatory Audit Reason & Access Oversight | 5 | ✅ Passed (100%) |
| **Tier 3** | Cross-Feature Combinations & Pairwise Flows | 19 | ✅ Passed (100%) |
| **Tier 4** | Real-World Full Month Cycles & Aggregation | 6 | ✅ Passed (100%) |
| **TOTAL** | **Enterprise Payroll & Attendance E2E Suite** | **120** | **✅ 100.0% Pass Rate** |

---

## Execution Guide

### Prerequisites
- Node.js v18+ (tested on Node v24.17.0)
- Backend Express server running on port 5000

### Running the Full Test Suite
```bash
# Run all 120 tests across Tiers 1-4
npx ts-node server/tests/e2e_payroll_attendance.test.ts
```

### Running Individual Tiers
```bash
# Run Tier 1: Feature Coverage (40 Tests)
npx ts-node server/tests/e2e_payroll_attendance.test.ts --tier=1

# Run Tier 2: Boundary & Corner Cases (55 Tests)
npx ts-node server/tests/e2e_payroll_attendance.test.ts --tier=2

# Run Tier 3: Cross-Feature Combinations (19 Tests)
npx ts-node server/tests/e2e_payroll_attendance.test.ts --tier=3

# Run Tier 4: Real-World Scenarios (6 Tests)
npx ts-node server/tests/e2e_payroll_attendance.test.ts --tier=4
```

### Non-Exiting Diagnostic Mode
```bash
# Run with --soft to execute all tests without early exit
npx ts-node server/tests/e2e_payroll_attendance.test.ts --soft
```

### Custom Host / Port Configuration
```bash
# Target custom backend endpoint
API_URL=http://localhost:5000/api/v1 npx ts-node server/tests/e2e_payroll_attendance.test.ts
```
