# Original User Request

## 2026-08-25T11:40:12Z

Implement an Enterprise Staff Payroll Management System and GPS Geolocation-Based Attendance with Admin Override in Academy Pro OS (`d:\academy`).

Working directory: `d:\academy`  
Integrity mode: `development`

## Requirements

### R1. Campus GPS Geofence Configuration & Geolocation Attendance Gateway
- Provide administrative configuration to set and test physical campus coordinates (Latitude, Longitude) and allowable geofence radius (meters).
- Allow staff members to mark daily Check-In and Check-Out using device GPS with real-time Haversine distance verification against the campus perimeter.
- Block off-site check-in attempts outside the configured perimeter with informative distance feedback.
- Calculate shift arrival status (Present vs Late) using scheduled shift timings and a 15-minute grace period.

### R2. Administrative Attendance Oversight & Manual Override
- Display daily and monthly staff attendance registers with GPS verification tags (`Verified On-Site`, `Admin Override`, `Remote`), check-in/out timestamps, and total working hours.
- Empower Administrators to manually override or record attendance status (`Present`, `Late`, `Half-Day`, `Absent`, `On Duty`, `Excused`) with custom time and audit reason logging.

### R3. Enterprise Staff Salary Structures & 1-Click Monthly Batch Payroll
- Configure itemized staff compensation packages (Base Salary, House Rent, Medical, Conveyance, Special Allowances, Tax, and Provident Fund deductions).
- 1-click batch monthly payroll generation computing gross salary, pro-rata attendance deductions (Base / Days in Month per unexcused absence), and net payable amount.
- Record salary disbursement with payment method (Bank Transfer, Cash, Cheque) and generate printable, PDF-downloadable, and WhatsApp-ready payslips.

### R4. UI/UX Standard Compliance
- Implement all forms and dialogs strictly using the 4-Island Floating Architecture (`.floating-island-overlay`, `.floating-island-container`, Dark Navy Header Card, Scrollable Form Card, Floating Action Pill Row).
- Use `ModernSelect`, `ModernDatePicker`, and Lucide SVG icons only (zero Unicode emojis, non-jumping 1.5px borders, 0ms optimistic UI reflection).

## Acceptance Criteria

### Geolocation & Geofencing
- [ ] Device GPS coordinates captured on Check-In / Check-Out with < 1s distance computation.
- [ ] Check-ins outside the configured radius are blocked with a clear distance alert.
- [ ] Check-ins within radius record `location_verified: true` with accurate coordinates and distance.

### Attendance Administration & Override
- [ ] Daily attendance roster displays real-time check-in/out times, hours worked, and verification badges.
- [ ] Administrator override modal updates attendance records instantly in local UI and logs audit reasons.

### Payroll & Payslip Generation
- [ ] 1-click monthly payroll calculates gross pay, itemized allowances, attendance deductions, and net pay without mathematical discrepancies.
- [ ] Salary disbursement updates status to `Paid` with payment method and transaction details.
- [ ] Printable/downloadable digital payslip renders complete institutional compensation breakdown.

### Full-Stack Build & Integrity
- [ ] Backend routes and database models created and tested cleanly with zero compilation errors.
- [ ] Frontend builds cleanly (`tsc && vite build`) with 0 errors.
