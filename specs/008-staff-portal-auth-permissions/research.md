# Technical Research & Architecture Decisions: Staff Portal Authentication & Permissions

**Feature**: `008-staff-portal-auth-permissions` | **Date**: 2026-08-21 | **Spec**: [specs/008-staff-portal-auth-permissions/spec.md](file:///d:/academy/specs/008-staff-portal-auth-permissions/spec.md)

---

## 1. Unified Staff Entity Model vs Teacher Model Integration

### Decision
Introduce a first-class `StaffMember` entity in PostgreSQL / Prisma that unifies all academy employees (Faculty, Administrative Staff, Domestic/Support Workers, and user-defined custom staff types), while establishing a clean 1-to-1 link with the existing `Teacher` model to guarantee 100% backwards compatibility with academic batches, schedules, and subject allocations.

### Rationale
- The existing `Teacher` model is tightly coupled to `Batch`, `BatchSubject`, `Homework`, and `Test`. Renaming or deleting it would create massive breaking changes across existing modules.
- By introducing `StaffMember` linked to `User` and `StaffType`, every employee (whether a Math Teacher, an Accountant, a Security Guard, or a Librarian) obtains an identical authentication credential, profile drawer, document vault, and permission profile.
- A `Teacher` simply becomes a `StaffMember` with `staff_type = 'Faculty'`, with `staffMember.teacher` referencing their classroom assignments.

### Alternatives Considered
- *Overloading the `Teacher` model for non-teaching staff*: Rejected because fields like `assignedSubjects` and `batches` are irrelevant for accountants, drivers, and janitors, creating data pollution.
- *Separate distinct tables for each role (`Faculty`, `AdminStaff`, `SupportStaff`)*: Rejected because it violates DRY, multiplies authentication routes by 3x, and prevents dynamic custom staff types.

---

## 2. Automated Alphanumeric Staff ID & Password Generation Pattern

### Decision
Automate System Staff ID generation using a prefix-year-sequence format:
- **Faculty**: `FAC-YYYY-NNN` (e.g. `FAC-2026-001`)
- **Administrative Staff**: `ADM-YYYY-NNN` (e.g. `ADM-2026-001`)
- **Domestic / Support Staff**: `DOM-YYYY-NNN` (e.g. `DOM-2026-001`)
- **Custom Staff Types**: `STF-YYYY-NNN` or `<CUSTOM_CODE>-YYYY-NNN` (e.g. `LIB-2026-001`)

Passwords will be generated as human-readable, cryptographically random 8-character tokens with standard complexity (e.g. `Acad#7392`, `Staff#4815`), hashed using `bcrypt` (10 rounds) into the `User` table, and presented in cleartext ONLY once in the instant **Credential Slip modal**.

### Rationale
- Standardizes staff credentials to match student IDs (`ACAD-2026-xxx`), providing professional identity for ID card printing and attendance badges.
- Immediate floating digital Credential Slip provides one-click Print, PDF download, and WhatsApp sharing directly to the new employee.

### Alternatives Considered
- *Manual password entry during registration*: Rejected because it slows down administrative onboarding and leads to weak, insecure default passwords (`123456`).
- *Pure random UUID passwords*: Rejected because they are difficult for staff to type on mobile devices and physical credential slips.

---

## 3. Granular 3-Tier Module Permissions Matrix

### Decision
Implement a 3-tier access level per module:
1. `hidden` (0 - No access; module omitted from navigation, API returns 403 Forbidden)
2. `view_only` (1 - Read access; staff can view data but mutation buttons/endpoints are disabled)
3. `editable` (2 - Read & Write access; full creation and modification privileges)

Permissions will be stored in `StaffPermission` records associated with `StaffType` (as default templates) and optionally overridden on individual `StaffMember` records.

### Module Keys:
`students`, `teachers_staff`, `batches`, `subjects`, `attendance`, `fees`, `exams`, `homework`, `timetable`, `crm_inquiries`, `announcements`, `whatsapp`, `settings`.

### Rationale
- Simple, powerful, and easy for school administrators to understand compared to complex Unix bitmasks.
- Protects confidential financial modules (like `fees`) by defaulting non-admin roles to `hidden`.

---

## 4. Scoped Data Isolation for Teaching Faculty

### Decision
Faculty accounts operating with `editable` or `view_only` access to `students`, `attendance`, `homework`, or `exams` will have their data queries automatically scoped by the backend service layer:
```ts
// Example scoped query in backend service
const isGlobalViewAllowed = staffMember.permissions['students']?.is_global;
const studentFilter = isGlobalViewAllowed 
  ? {} 
  : { enrollments: { some: { batch: { teacher_id: teacherId } } } };
```

### Rationale
- Satisfies strict privacy standards: Subject teachers only see their own classroom rosters and homework submissions, eliminating accidental cross-class modifications.

---

## 5. Staff Attendance, Leave Approvals & Substitute Prompt

### Decision
- Create `StaffAttendance` table tracking `date`, `check_in_time`, `check_out_time`, `status` (`present`, `late`, `absent`, `half_day`, `on_leave`).
- Create `StaffLeaveRequest` table tracking leave requests with status (`pending`, `approved`, `rejected`).
- When an Administrator approves a leave for a Faculty member with scheduled batches on those dates, the system automatically prompts an **Instant Substitute Teacher Assignment** dialog (`SubstituteTeacherModal`).

### Rationale
- Connects HR attendance directly with academic operations, preventing unattended classes and student disruptions.
