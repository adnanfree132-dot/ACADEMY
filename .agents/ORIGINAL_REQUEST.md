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

## 2026-09-05T03:09:37Z

Full multi-agent audit team (parallel inspection across modules and architectural layers). Conduct an exhaustive, read-only edge-case audit across the entire Academy Pro OS web application—focusing specifically on Student lifecycle, Staff management, Payroll calculations/disbursements, Fee payments, and related domain modules—to uncover race conditions, transaction hazards, validation gaps, data integrity risks, and state desynchronization, delivering a comprehensive, prioritized remediation blueprint without modifying any code.

Working directory: /home/adnan/Desktop/academy
Integrity mode: development

## Requirements

### R1. Deep Domain Edge-Case Discovery (Student, Staff, Payroll, Fees)
Audit all domain workflows for edge-case vulnerabilities, including:
- **Student Module**: Duplicate admissions, status transition race conditions, soft-delete cascades (batches, enrollments, attendance, dues), leaving certificate edge cases.
- **Staff & Teacher Module**: Multi-role assignment collisions, batch teacher reassignments, cascade deletion anomalies, teacher-own-batch access boundary escapes.
- **Payroll Module**: Overlapping pay periods, partial salary disbursements, negative adjustment calculations, prorated leaves, deduction precision rounding, duplicate payroll processing triggers.
- **Fees & Payments Module**: Concurrent receipt generation, partial vs full payment idempotency, negative discount overflows, invoice status transitions, defaulter calculation boundary shifts.
- **Batches & Attendance**: Capacity limit race conditions, attendance retroactive lock bypasses, multi-session conflicts.

### R2. Cloudflare Worker & Database Runtime Hazard Analysis
Cross-examine backend routes against Cloudflare Worker runtime invariants:
- Sequential Prisma execution constraints and $transaction single-client limitations.
- Single-connection pool exhaustion and timeout behaviors (ssl: false, DIRECT_URL).
- AsyncLocalStorage client lifecycle during request termination or timeouts.
- Worker-to-Worker proxy Authorization header drops between Pages Functions and Worker.

### R3. Strict Zero-Modification Guardrail
Operate exclusively as a read-only audit. Make zero edits to source files, database migrations, package dependencies, or infrastructure configurations.

### R4. Prioritized Actionable Remediation Plan
Deliver a structured remediation blueprint categorized by severity (Critical, High, Medium, Low), providing for each finding:
1. Module & Failure Category
2. Exact Source File & Line Range
3. Edge-Case Reproduction Conditions
4. Architectural Root Cause & Risk Impact
5. Detailed Remediation Blueprint (step-by-step fix recommendations)

## Acceptance Criteria

### Audit Scope & Module Coverage
- [ ] Dedicated audit sections provided for Student, Staff, Payroll, Fees/Payments, Batches, and Attendance modules.
- [ ] Cloudflare Worker execution limits (sequential queries, connection pooling, proxy header forwarding) evaluated for each mutation endpoint.
- [ ] Soft-delete and relational integrity checks completed against Prisma schema definitions and database foreign key behaviors.

### Non-Destructive Operation
- [ ] Working tree remains completely clean with zero code or configuration changes (git status --porcelain is clean).

### Actionability & Defect Verification
- [ ] Every listed edge-case finding cites exact source file paths and line ranges.
- [ ] Every finding details the specific trigger conditions and business failure impact.
- [ ] Concrete, phased remediation steps are provided for all identified items, ordered by priority.

## 2026-09-06T12:47:06Z

Full multi-agent implementation team. Implement the permanent architectural remediation plan across the Academy Pro OS full-stack web application (https://edu.toolnestr.com) to eliminate recurring login failures, proxy stream drops, Wasm panics, and retry storms, delivering a robust, resilient system verified in production.

Working directory: /home/adnan/Desktop/academy
Integrity mode: development

## Requirements

### R1. Direct Edge Routing & Unified API Client
Eliminate the Cloudflare Pages double-proxy bottleneck. Configure the frontend API client (src/api/apiClient.ts) to communicate directly with the Cloudflare Worker backend (https://academy-api.adnanfree132.workers.dev/api/v1) in production via standard CORS, retaining clean local fallback (/api/v1) for local development (localhost / 127.0.0.1). Ensure public/_redirects contains only SPA history fallback routing (/* /index.html 200) without conflicting proxy rewrite rules.

### R2. Elimination of Retry Amplification Storms & Misleading Error Masking
Dismantle the compounding retry loops between the Pages Function (functions/api/[[path]].js) and the frontend client (src/api/apiClient.ts). Simplify the proxy to a single buffered pass-through with CORS headers. Remove recursive error-masking blocks in functions/api/[[path]].js, src/api/apiClient.ts, and server/src/common/envelope.ts that convert real failures into generic "warming up" banners, returning accurate HTTP status codes and actionable, polite error messages.

### R3. Resilient Database Connection Pooling & Wasm Exception Boundaries
In server/src/prisma.ts, eliminate per-request connection pool creation and teardown on res.finish, maintaining a persistent connection pool across the Cloudflare Worker isolate lifecycle to enable socket reuse and reduce cold-start latency. Support Supabase PgBouncer transaction mode (port 6543) where configured. Guard database query errors so that socket resets or connection drops are caught cleanly without triggering Rust WebAssembly RuntimeError: unreachable traps.

### R4. Frontend Startup Thundering Herd Protection
In src/App.tsx, stage the post-authentication initial data fetch (fetchData). Replace the burst of 11 simultaneous parallel queries with a staged loader: fetch essential primary data (getMe, getDashboard, getStudents, getBatches) first, followed by secondary modules (getTeachers, getSubjects, getNotifications, getAnnouncements, getCRMLeads, getSettings, getTransactions) in a deferred batch so that database connection limits are never saturated on login.

### R5. End-to-End Build, Deployment & Production Verification
Verify that both root and server pass TypeScript compilation (npx tsc --noEmit) with zero errors, and that npm run build succeeds cleanly. Deploy the updated Worker (npx wrangler deploy --config server/wrangler.toml) and Pages (npx wrangler pages deploy dist --project-name academy --branch main). Conduct automated live tests against both the direct Worker API and https://edu.toolnestr.com confirming 100% login success rate across all roles (admin, teacher, student, super_admin) with zero error banners.

## Acceptance Criteria

### Edge Routing & Proxy Architecture
- [ ] src/api/apiClient.ts targets https://academy-api.adnanfree132.workers.dev/api/v1 directly in production with automatic fallback for local environments.
- [ ] public/_redirects contains only SPA client-side routing (/* /index.html 200) with no conflicting /api/* rule.
- [ ] functions/api/[[path]].js operates as a single buffered pass-through without nested 3x retry amplification.

### Database Connection Resilience
- [ ] server/src/prisma.ts preserves connection pools across requests within the Worker isolate rather than destroying them on res.finish.
- [ ] Supabase connection configuration supports transaction mode pooler (port 6543) without connection starvation.
- [ ] Database error handling intercepts socket drops safely without Rust Wasm opcode 0x00 (unreachable) traps.

### Concurrency & Error Honesty
- [ ] Initial data loading in src/App.tsx is staged to prevent 11-request thundering herds on PgBouncer upon login.
- [ ] Generic "warming up" error masking is eliminated across client, proxy, and server envelope, preserving genuine status codes.

### Build, Deploy & Live Verification
- [ ] npx tsc --noEmit passes with 0 errors across root and server.
- [ ] npm run build produces production assets cleanly.
- [ ] Live automated tests on https://edu.toolnestr.com succeed with HTTP 200 across Admin, Teacher, Student, and Super Admin roles.
