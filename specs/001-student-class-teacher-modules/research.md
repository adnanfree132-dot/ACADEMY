# Technical Research & Architecture Decisions: Student, Class, and Teacher Core Modules

**Feature**: `001-student-class-teacher-modules`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Full-Stack Vertical Slice & Layered Architecture

### Decision
Implement every capability across the three core modules as a strict, unidirectional vertical slice:
1. **Presentation Layer (React 18 + Vite)**: Component views ([StudentsView.tsx](file:///d:/academy/src/pages/StudentsView.tsx), [BatchesView.tsx](file:///d:/academy/src/pages/BatchesView.tsx), [TeachersView.tsx](file:///d:/academy/src/pages/TeachersView.tsx)), modals, and drawers utilizing the curated CSS design system and Taste Standards.
2. **Client API Layer ([apiClient.ts](file:///d:/academy/src/api/apiClient.ts))**: Strongly typed asynchronous fetch methods handling the `/api/v1` response envelope `{ success, data, error, meta }` and JWT bearer headers.
3. **API Routing & Validation ([routes.ts](file:///d:/academy/server/src/routes.ts))**: Express 4 routes with Zod schema validation middleware and role-based access control (`authenticateJwt`).
4. **Data Persistence ([schema.prisma](file:///d:/academy/server/prisma/schema.prisma))**: Prisma Client ORM managing PostgreSQL tables (`Student`, `Teacher`, `Class`, `Batch`, `Enrollment`, `BatchSubject`, `StudentFeePlan`, `AuditLog`).

### Rationale
Adheres to Constitution Principle I (Full-Stack Vertical Slices) and Principle II (Strict Layering). Prevents code fragmentation, frontend mocks, and unvalidated backend mutations.

### Alternatives Considered
- *Direct Database Access in Controllers*: Rejected due to maintainability issues and violation of single-responsibility audit tracking.
- *Ad-hoc Mock State in React*: Rejected by Constitution Principle I.

---

## 2. Student Lifecycle & Departure Fee Plan Freezing

### Decision
When updating a student's status to `left` or `suspended`:
- Set `Student.status = 'left'` (or `'suspended'`).
- Update all associated active batch enrollments (`Enrollment.status = 'removed'`).
- Deactivate recurring invoice billing by removing or setting active status on `StudentFeePlan` to prevent subsequent invoice cron runs from billing departed students.
- Retain all historical `FeeInvoice` records and `FeePayment` records unchanged to support ledger auditing and debt recovery.
- Record an audit log entry in `AuditLog` (`action: 'STUDENT_DEPARTURE_FEE_FREEZE'`).

### Rationale
Directly addresses Clarification Q2. Prevents phantom billing while preserving legal debt and financial ledger integrity.

### Alternatives Considered
- *Voiding / Deleting Unpaid Invoices*: Rejected because historical dues and defaulter tracking must remain auditable.
- *Hard Deleting Student Record*: Prohibited by Constitution Principle III (Data Integrity & Soft Deletes).

---

## 3. Batch Capacity Ceiling Enforcement & Admin Override

### Decision
1. **Enrollment Check**: When an enrollment is requested (`POST /students` or `POST /batches/:id/enroll`), calculate current active enrollments:
   `activeCount = await prisma.enrollment.count({ where: { batch_id: batchId, status: 'active' } })`.
2. **Capacity Comparison**: Compare `activeCount` against `batch.capacity`.
3. **Rejection / Override Path**:
   - If `activeCount >= batch.capacity` and request does NOT carry `adminOverride = true`: Return HTTP 409 Conflict with `{ success: false, error: "Batch capacity ceiling reached (30/30)", meta: { current: activeCount, capacity: batch.capacity, canOverride: true } }`.
   - If `adminOverride = true` (only allowed for users with `role: 'admin'`): Proceed with enrollment and insert an `AuditLog` record (`action: 'BATCH_CAPACITY_OVERRIDE'`).

### Rationale
Resolves Clarification Q3. Protects classroom limits while maintaining operational flexibility for emergency academy admissions with accountability.

### Alternatives Considered
- *Unconditional Over-enrollment*: Rejected as it violates `ACA-05` and causes scheduling/room overcrowding.
- *Strict Hard Block without Override*: Rejected because real-world academy admissions require administrative discretion for siblings or special cases.

---

## 4. Faculty Deletion Guard & Active Batch Reassignment Gate

### Decision
Before allowing deletion or deactivation of a `Teacher` record:
1. Query active batch assignments:
   `activeBatches = await prisma.batch.findMany({ where: { teacher_id: teacherId, is_active: true } })`.
2. If `activeBatches.length > 0`: Return HTTP 400 Bad Request with `{ success: false, error: "Cannot delete faculty member assigned to active batches. Reassign batches first.", data: { activeBatches } }`.
3. Client UI displays a "Reassign Batches" dialog prompting the admin to designate a replacement teacher for each affected batch.

### Rationale
Resolves Clarification Q1. Eliminates orphaned batch records and prevents broken attendance or grading permission checks for active classes.

### Alternatives Considered
- *Silently Setting `teacher_id = null`*: Rejected because classes would be left instructorless without staff notification.
- *Cascading Batch Deletion*: Strictly prohibited as deleting active batches destroys student enrollment records and attendance history.

---

## 5. UI/UX Taste Standards & Component Aesthetics

### Decision
All modified components in Student, Class, and Teacher views MUST incorporate:
- **Palette**: Slate foundation (`#0F172A`, `#1E293B`, `#334155`), Emerald `#F0FDF4` / `#15803D`, Indigo `#EFF6FF` / `#1D4ED8`, Amber `#FEF3C7` / `#B45309`, Rose `#FEE2E2` / `#B91C1C`.
- **Glassmorphism & Depth**: Card backdrops (`backdrop-filter: blur(16px)`, border `1px solid rgba(226, 232, 240, 0.8)`), 12px+ border radius, and layered box-shadows (`0 10px 25px -5px rgba(15, 23, 42, 0.08)`).
- **Interactive Micro-Animations**: Action button hover scaling (`transform: scale(1.04)`), active press states, and keyframe entrance fades.
- **Explicit Action Labels**: Badges paired with clear human-readable labels (e.g., "💵 Quick Payment", "📝 Edit Details", "🎓 Promote Class").

### Rationale
Enforces Constitution Principle IV (Mandatory UI/UX Taste Standards & Taste Skill).

---

## Summary of Architectural Constraints

| Constraint | Value / Standard |
| :--- | :--- |
| **API Path Prefix** | `/api/v1` |
| **Envelope Schema** | `{ success: boolean, data?: any, error?: string, meta?: any }` |
| **Authentication** | Bearer JWT (15m expiry) in `Authorization` header |
| **Validation** | Zod schemas on all incoming request bodies and query parameters |
| **Database ORM** | Prisma Client 5.x on PostgreSQL |
| **Audit Trails** | `audit_logs` table populated on all mutations |
