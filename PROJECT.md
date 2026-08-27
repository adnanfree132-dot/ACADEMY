# Project: Academy Pro OS — Enterprise Staff Payroll & GPS Geolocation Attendance

## Architecture
Academy Pro OS is a full-stack educational management platform with a React 18 / TypeScript frontend built with Vite, and an Express / Node.js backend using Prisma ORM with PostgreSQL.

### Data Flow & Component Architecture
```
[ Browser Client / React Frontend ]
  │
  ├─► Geolocation Attendance Gateway (GPS Coordinates, Haversine distance, shift status)
  ├─► Administrative Staff Attendance Register (Daily/Monthly view, verification tags, 4-Island Override Modal)
  ├─► Staff Salary Structure Configuration (Itemized allowances & deductions)
  ├─► 1-Click Monthly Batch Payroll Dashboard (Pro-rata deductions, gross/net computation, batch disbursement)
  └─► Digital Payslip Viewer (Printable, PDF-ready, WhatsApp-formatted advice)
  │
  ▼ (Envelope REST API: /api/v1/*)
[ Express Backend & Services ]
  │
  ├─► Geofence & Location Service (Haversine formula, perimeter verification, shift & 15m grace window)
  ├─► Attendance Engine (Check-in/out, hours worked, admin override, audit logging)
  ├─► Payroll Batch Engine (Days-in-month base rate, unexcused absence pro-rata deduction, atomic transactions)
  └─► Error Sanitization & Envelope Handler (Zero Prisma/DB error leaks)
  │
  ▼ (Prisma Client)
[ PostgreSQL Database ]
  │
  ├─► CampusGeofence (Coordinates, radius, shift timings, grace window)
  ├─► StaffAttendance (GPS coordinates, distance, location_verified, override audit)
  ├─► StaffSalaryStructure (Itemized allowances, statutory deductions, bank details)
  ├─► PayrollBatch (Monthly container, aggregate totals, status)
  ├─► StaffSalaryPayment (Itemized payslips, attendance metrics, payment disbursement)
  └─► AuditLog (Immutable audit trail for overrides and financial actions)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|:------:|
| 1 | Campus GPS Geofence Model & Settings | Store and manage campus coordinates, radius, shift times, and grace period in DB | M1 | Survey / R1 | DONE |
| 2 | Haversine Distance & Perimeter Validation | High-precision mathematical distance calculation (< 1s) and geofence boundary enforcement | M1 | Survey / R1 | DONE |
| 3 | Shift Arrival & Grace Period Logic | Categorize arrival as Present vs Late based on shift start + 15-minute grace window | M1 | Survey / R1 | DONE |
| 4 | Staff Check-In & Check-Out Backend | API endpoints for timestamp recording, location verification, and total working hours computation | M1 | Survey / R1 | DONE |
| 5 | Administrative Attendance Override Backend | Secure endpoint allowing admins to modify status/times with mandatory audit reason logging | M1 | Survey / R2 | DONE |
| 6 | Staff Salary Structure Models & APIs | CRUD for itemized base salary, HRA, medical, conveyance, special allowances, tax, PF | M2 | Survey / R3 | DONE |
| 7 | Pro-Rata Absence Deduction Engine | Exact deduction algorithm: `(base_salary / days_in_month) * (absences + 0.5 * half_days)` | M2 | Survey / R3 | DONE |
| 8 | 1-Click Monthly Batch Payroll Engine | Atomic batch generation creating PayrollBatch and individual itemized payslips | M2 | Survey / R3 | DONE |
| 9 | Salary Disbursement & Payslip Status Tracking | Record payment disbursement (Bank Transfer, Cash, Cheque) with transaction reference | M2 | Survey / R3 | DONE |
| 10 | Geolocation Attendance Gateway UI | Browser GPS capture, live distance & perimeter status pill, shift indicator | M3 | Survey / R1 | DONE |
| 11 | Administrative Staff Attendance Register UI | Daily roster & monthly matrix with GPS verification badges, working hours, filter tools | M3 | Survey / R2 | DONE |
| 12 | 4-Island Admin Attendance Override Modal | Strict 4-Island floating architecture for manual attendance adjustments with 0ms optimistic UI | M3 | Survey / R2, R4 | DONE |
| 13 | Campus Geofence Settings & Test UI | Interactive coordinate configuration, radius setting, shift timings, live test tool | M3 | Survey / R1, R4 | DONE |
| 14 | Staff Salary Structure Management UI | Itemized salary structure builder and configuration view per staff member | M4 | Survey / R3, R4 | DONE |
| 15 | 1-Click Monthly Batch Payroll Dashboard | Batch payroll generator, salary summary cards, employee breakdown, batch approval | M4 | Survey / R3, R4 | DONE |
| 16 | 4-Island Salary Disbursement Modal | Quick payment recording with payment method, reference, and instant state update | M4 | Survey / R3, R4 | DONE |
| 17 | 4-Island Digital Payslip Viewer & WhatsApp Advice | Complete institutional payslip with printable view, download trigger, and WhatsApp advice template | M4 | Survey / R3, R4 | DONE |
| 18 | Opaque-Box E2E Testing Suite (Tiers 1-4) | Comprehensive requirement-driven test harness and test suite validating R1-R4 (120/120 tests) | M-E2E | Survey / Testing | DONE |
| 19 | Adversarial Coverage Hardening (Tier 5) | White-box stress tests, edge cases, financial precision, boundary coordinates, and audit verification | M5 | Survey / Acceptance | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:------:|
| M1 | Data Models & GPS Geofence Attendance Backend | Prisma schema update, DB push/generate, Geofence API, Check-In/Out APIs, Haversine verification, Shift arrival logic, Override API, Audit logging | none | **DONE** |
| M2 | Staff Salary Structures & Batch Payroll Backend | Salary structure APIs, pro-rata absence deduction calculation, 1-click batch generation, disbursement API, payslip querying | M1 | **DONE** |
| M-E2E | E2E Test Suite Creation | Design opaque-box test runner, harness, and comprehensive test cases (Tiers 1-4: 120/120 passing) | none (parallel) | **DONE** |
| M3 | Geolocation Attendance UI, Roster & 4-Island Override Modal | Staff Attendance View, Geofence Gateway, Daily/Monthly Roster, 4-Island Override Modal, Geofence Settings Tab, apiClient integration | M1 | **DONE** |
| M4 | Salary Structures, 1-Click Batch Payroll UI & Payslips | Salary Structure UI, Batch Payroll Dashboard, 4-Island Disbursement Modal, 4-Island Digital Payslip Viewer & WhatsApp sharing | M2, M3 | **DONE** |
| M5 | Full-Tier Integration, Adversarial Hardening & Build Verification | Pass 100% E2E tests (Tiers 1-4), Tier 5 adversarial tests, Forensic Integrity Audit, clean backend & frontend builds (`tsc && vite build`) | M3, M4, M-E2E | **DONE** |

## Verification Summary
- **Backend Build**: `npm --prefix server run build` (`tsc`) $\to$ **0 errors**
- **Frontend Build**: `npm run build` (`tsc && vite build`) $\to$ **0 errors**
- **E2E Test Suite (Tiers 1-4)**: 120 / 120 tests passing (100.0%)
- **Adversarial Stress Suite (Tier 5)**: 391 / 391 assertions passing (100.0%)
- **Forensic Audit**: **CLEAN** (zero dummy/facade implementations, authentic Prisma `$transaction` operations, genuine Haversine and pro-rata formulas)
- **UI/UX Compliance**: 100% compliance with `AGENTS.md` (Full-Stack Vertical Slices, 4-Island Floating Architecture, ModernSelect, ModernDatePicker, 0 Unicode emojis, 0ms optimistic UI)
