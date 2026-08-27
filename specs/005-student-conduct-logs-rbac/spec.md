# Feature Specification: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals

**Feature Branch**: `005-student-conduct-logs-rbac`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "these logs can be editable and deletable and also theses logs can be entered by teacher also through teacher portal super admin can delete these logs and deltete but other teachers can only view i think currently there is no student and parents related multitenat system is made so you have to create this also"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conduct Log Creation & Recording (Priority: P1)

As a Teacher or Super Admin, I want to record behavioral, disciplinary, and commendable conduct notes for a specific student, so that the academy maintains an official and chronological record of student demeanor and progress.

**Why this priority**: Core value driver. Without the ability to create structured conduct logs with tags and timestamps, no historical student behavioral data exists to manage or view.

**Independent Test**: Can be fully tested by creating a conduct log entry for a student with a category (e.g., "Commendation", "Infraction", "General Note") and verifying that it appears in the student's chronological conduct timeline.

**Acceptance Scenarios**:

1. **Given** a logged-in Super Admin or assigned Batch Teacher viewing a student's profile, **When** they submit a conduct note with a selected category and severity/visibility flag, **Then** the note is saved and displayed immediately in the student's Conduct history with the author's name, role, and formatted timestamp.
2. **Given** a teacher attempting to submit a note with empty text, **When** they trigger submission, **Then** the system prompts for required content and prevents creating an empty log.

---

### User Story 2 - Role-Based Editing & Deletion Permissions (Priority: P1)

As a Super Admin or the Authoring Teacher, I want to edit or delete existing conduct logs, while preventing unauthorized teachers from altering notes they did not write, so that records remain authentic, auditable, and protected against unauthorized tampering.

**Why this priority**: Essential for data integrity and institutional compliance. Enforces strict authority boundaries between Super Admins, authoring teachers, and non-author colleagues.

**Independent Test**: Can be verified by creating a log as Teacher A, logging in as Teacher B to confirm edit/delete controls are disabled, and logging in as Super Admin to verify full edit/delete privileges.

**Acceptance Scenarios**:

1. **Given** a Super Admin viewing any conduct log, **When** they choose to edit the content or delete the record, **Then** the action succeeds and updates or removes the log from the active list.
2. **Given** Teacher A who authored a conduct log, **When** Teacher A accesses that log, **Then** Teacher A can edit the remark or soft-delete it.
3. **Given** Teacher B who did NOT author the conduct log, **When** Teacher B views the same student's conduct list, **Then** Teacher B can read the note but edit and delete action buttons are strictly disabled or hidden.
4. **Given** a deleted conduct log, **When** a regular teacher or student views the profile, **Then** the deleted log is excluded from the active view, while preserved in audit logs.

---

### User Story 3 - Teacher Portal Integrated Conduct Entry & Batch Scoping (Priority: P2)

As a Teacher logged into the Teacher Portal, I want to easily log student conduct remarks directly from my batch roster, attendance sheet, or student overview, so that I do not need administrative workspace access to record observations.

**Why this priority**: Streamlines daily classroom workflows for instructors and ensures teachers only interact with students enrolled in their assigned classes/batches.

**Independent Test**: Can be tested by logging into the Teacher Portal as an instructor assigned to Batch 10-A, navigating to the student roster, adding a conduct remark for an enrolled student, and verifying the remark is linked to the teacher and batch.

**Acceptance Scenarios**:

1. **Given** an instructor logged into the Teacher Portal, **When** viewing their assigned batch roster, **Then** they can open the Conduct panel for any enrolled student and log an observation.
2. **Given** an instructor attempting to access a student not enrolled in any of their assigned batches, **When** attempting to log or view conduct notes, **Then** the system enforces batch ownership boundaries and denies unauthorized access.

---

### User Story 4 - Student & Parent Multi-Role Scoped Access & Log Visibility (Priority: P2)

As a Student or Parent logged into their respective portal, I want to view official school remarks, achievements, and feedback intended for family communication, while confidential staff-only notes remain securely hidden.

**Why this priority**: Completes the multi-tenant role boundary across Admin, Teacher, Student, and Parent personas, allowing healthy school-home collaboration while safeguarding sensitive internal teacher notes.

**Independent Test**: Can be tested by creating one public remark ("Outstanding science presentation") and one confidential staff note ("Parent conference requested due to attendance"), then logging in as the Student/Parent to verify only the public remark is visible.

**Acceptance Scenarios**:

1. **Given** a Parent logged into the Parent Portal, **When** viewing their linked child's profile, **Then** they see only conduct logs marked as "Visible to Parents/Students" and cannot view confidential staff-only logs.
2. **Given** a Parent with multiple registered children, **When** switching between children, **Then** the system strictly displays data belonging only to the selected linked child.
3. **Given** a Student logged into the Student Portal, **When** accessing their profile, **Then** they can review their personal achievement badges and positive/public conduct feedback with no edit or delete access.

---

### Edge Cases

- **Authoring Teacher Departs / Deactivated**: What happens if a teacher who authored conduct logs is deactivated or leaves the academy? The logs remain intact in the student's profile showing the original author's name, and can be edited or deleted exclusively by a Super Admin.
- **Student Transferred Between Batches**: What happens when a student moves to a new batch? Historical conduct logs remain permanently attached to the student record; the new batch teacher can view past non-confidential notes.
- **Concurrent Edits**: What happens if an admin and the authoring teacher edit a log simultaneously? The system processes updates sequentially and updates the last-modified timestamp with the latest modifying actor.
- **Offline / Interrupted Network**: If network drops while saving or deleting a conduct note, the interface displays an immediate non-blocking error notification without losing the user's typed draft.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support creating, viewing, updating, and soft-deleting Student Conduct & Behavior Logs.
- **FR-002**: Each Conduct Log MUST record: Student Reference, Author Reference (User ID & Name), Author Role, Category/Type (e.g., `Commendation`, `Infraction`, `Attendance Notice`, `General Remark`), Severity/Status, Content Text, Confidentiality Flag (`is_confidential` / `visible_to_parents`), Created Timestamp, and Updated Timestamp.
- **FR-003**: Super Admins MUST have full permissions to create, view all (including confidential), edit all, and soft-delete all student conduct logs.
- **FR-004**: Teachers MUST be able to create conduct logs for any student enrolled in their assigned batches.
- **FR-005**: Authoring Teachers MUST be able to edit and delete conduct logs they personally created within their allowed editing window.
- **FR-006**: Non-authoring Teachers MUST have read-only access to conduct logs of students within their assigned batches, and MUST NOT be able to edit or delete logs authored by other staff members.
- **FR-007**: Teachers MUST NOT be able to view or edit conduct logs of students outside their assigned batches.
- **FR-008**: The Teacher Portal MUST provide direct, intuitive UI controls for adding, editing, and viewing student conduct logs from classroom rosters and student profile views.
- **FR-009**: The system MUST implement strict Role-Based Access Control (RBAC) supporting four distinct system roles: `admin`, `teacher`, `student`, and `parent`.
- **FR-010**: The system MUST establish a Parent-Student linkage model allowing a Parent user to be securely associated with one or more student records.
- **FR-011**: Parent and Student portal users MUST only have read-only access to their own data or linked children's data.
- **FR-012**: Conduct logs flagged as `is_confidential = true` MUST be strictly excluded from Student and Parent portal queries and views.
- **FR-013**: Conduct logs flagged as `is_confidential = false` (or `visible_to_parents = true`) MUST be visible to linked Parents and the Student on their respective portals.
- **FR-014**: Deleting a conduct log MUST perform a soft delete (`is_deleted = true` or `deleted_at = timestamp`) to preserve audit trail integrity.
- **FR-015**: Modifying or deleting a conduct log MUST record an entry in the system audit log capturing the modifying user, action type, timestamp, and entity ID.
- **FR-016**: The UI for conduct logs MUST adhere to the Floating Island Modal Architecture, curated color palettes, and single-line badge standards.

---

### Key Entities

- **ConductLog**: Represents an individual behavioral note or incident report. Key attributes: `id`, `student_id`, `batch_id`, `author_id`, `category` (Praise, Warning, Disciplinary, General), `title`, `remark_text`, `severity` (Positive, Neutral, Warning, Critical), `is_confidential` (Boolean), `is_deleted` (Boolean), `created_at`, `updated_at`.
- **User**: Represents system actors with authentication credentials and a defined `role` (`admin`, `teacher`, `student`, `parent`).
- **Student**: Represents an enrolled student with academic, batch enrollment, and conduct records. Linked to optional `User` account.
- **Teacher**: Represents an academic staff member with assigned batches and subjects. Linked to `User` account.
- **ParentGuardian**: Represents a parent or legal guardian user linked to one or more `Student` records via guardian relationship mapping (`father`, `mother`, `guardian`).
- **AuditLog**: Immutable historical record tracking creation, updates, and deletions of conduct logs for institutional compliance.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of conduct log modifications and deletions enforce author-or-admin permission checks with 0 unauthorized edits across non-author teachers.
- **SC-002**: Super Admins and Teachers can create and view conduct logs in under 1 second without full page reloads.
- **SC-003**: 100% of confidential staff notes remain completely hidden from Student and Parent views during security validation audits.
- **SC-004**: Teachers can log a conduct note directly from their classroom roster or profile drawer in 3 clicks or fewer.
- **SC-005**: 100% of deleted conduct records are preserved as soft-deletes in the audit log for administrative traceability.

---

## Assumptions

- **Authentication Framework**: Uses the existing JWT-based authentication system with role payloads (`admin`, `teacher`, `student`, `parent`).
- **Database Architecture**: SQLite / PostgreSQL with Prisma ORM following non-destructive soft-delete patterns as mandated by the Constitution.
- **UI Architecture**: React components styled with the established Floating Island Modal standards, glassmorphism, and responsive drawer layouts.
- **Portal Navigation**: Role-specific navigation already routes users to their corresponding dashboard view based on active role context.
