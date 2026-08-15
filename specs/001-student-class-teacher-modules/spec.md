# Feature Specification: Student, Class, and Teacher Core Modules

**Feature Branch**: `001-student-class-teacher-modules`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "DOCUMENT THE CURRENT BEHAVOIUOR OF STUDENT CLASS AND TEACHER MODULE WHAT ID DOES WHAT IT INPUTS OUTPUTS , EDGE CASES IT HANDLES ABD WHAT THE COMPLETE VERSION OF FEATURE SHOULD INCLUDE"

## Overview & Current State Analysis

This specification captures the operational baseline, data contracts, input/output behaviors, current edge case handling, and full feature scope for the three interconnected core academic entities in Academy Pro OS:
1. **Student Management** (M2 STU)
2. **Academic Structure & Batch Management** (M5 ACA)
3. **Teacher & Faculty Management** (M4 TCH)

## Clarifications

### Session 2026-08-15
- Q: How should the system handle the deletion or deactivation of a faculty member who is currently assigned to active batches? → A: Block deletion and prompt the administrator to reassign active batches to another instructor before proceeding.
- Q: How should the system handle outstanding fee invoices and recurring fee plans when a student's status changes to "Left" or "Suspended"? → A: Freeze future recurring fee generation by deactivating the fee plan, while preserving existing unpaid invoices on the student ledger for debt tracking.
- Q: When an administrator attempts to enroll a student into a batch that has already reached its maximum capacity ceiling, what should the system allow? → A: Default to strictly blocking enrollment when full, but permit an explicit administrative override confirmation dialog with mandatory audit logging.

---

## Current Behavior & Data Flow

### 1. Student Management Module (M2 STU)

#### What It Currently Does:
- **Directory Listing & Filtering**: Displays enrolled student roster with search by name, admission number, or parent contact; filterable by Batch and Fee Payment Status (`All`, `Paid`, `Partially Paid`, `Pending`, `Defaulter`).
- **Individual Registration**: Captures student demographic and enrollment details via modal, auto-generates sequential registration numbers (`ACAD-YYYY-NNN`), provisions monthly fee plan records, and creates initial batch enrollments.
- **Student Profile Drawer (360° View)**: Side-drawer rendering personal details, parent contact actions (direct call, WhatsApp deep-links), academic enrollments, attendance metrics, and quick action shortcuts.
- **Financial & Operational Modals**:
  - *Quick Payment Modal*: Instant fee collection recording payment method, receipt numbering, and balance updates.
  - *Student Ledger*: Detailed chronological ledger of invoices and transactions.
  - *ID Card & Credential Slips*: Printable modal views with QR codes and formatted credentials.
  - *Leave Management*: Application of student leave dates with auto-flagging in attendance.
- **Bulk Operations**: Bulk CSV import with automatic user/class creation, bulk soft-delete archiving, bulk batch transfer, and bulk ID card printing.
- **Status Lifecycle & Deletion**: Supports active status management; soft-deletes students to `status = 'left'` and updates enrollments to `status = 'removed'`.

#### Inputs & Outputs:
- **Inputs**:
  - *Registration Payload*: `name` (string), `parentName` (string), `phone` (string), `email` (string, optional), `gender` ('Male' | 'Female'), `gradeBatch` (string), `totalFee` (number), `dueDate` (string), `photoUrl` (string, optional), `custom_fields` (JSON, optional), `batchIds` (array of string IDs).
  - *Query Filters*: `q` (search term), `status` ('active' | 'left' | 'suspended' | 'completed'), `classId` (UUID string), `batchFilter` (string).
  - *Bulk Payload*: Array of student objects or array of student UUIDs.
- **Outputs**:
  - Structured student entity with embedded class details, fee plan, and enrollment status.
  - Calculated fee metrics (`totalFee`, `paidFee`, `dueBalance`, `isDefaulter`).
  - Printable HTML/SVG canvas for ID cards and credential slips.
  - CSV export file `Students_Directory.csv`.

---

### 2. Academic Structure & Class/Batch Module (M5 ACA)

#### What It Currently Does:
- **Class & Batch Hierarchy**: Maintains academic classes (e.g., Grade 9, Grade 10, O-Levels) and associated batch instances (e.g., Morning Batch A, Evening JEE).
- **Batch Configuration**: Manages batch names, room assignments, schedules/timings, maximum student capacity limits, and designated lead instructor/teacher.
- **Batch Detail & Enrollment Manager**: Inspects active enrollments per batch, allowing ad-hoc enrollment of existing students or removal of enrolled students.
- **Subject-Faculty Matrix**: Associates subjects to batches and assigns specific faculty instructors to individual subject slots (`BatchSubject` mapping).
- **Advanced Class Utilities**:
  - *Substitute Teacher Modal*: Temporary instructor overrides for specific scheduling conflicts.
  - *Class Splitting*: Tooling to divide overloaded batches into balanced sub-groups.
  - *Syllabus Tracker*: Milestone tracking across curriculum chapters.

#### Inputs & Outputs:
- **Inputs**:
  - *Create Batch Payload*: `name` (string), `classLevel` (string), `teacherId` (UUID, optional), `timing` (string format "HH:MM - HH:MM"), `room` (string), `capacity` (integer).
  - *Enrollment Action*: `batchId` (UUID), `studentId` (UUID).
  - *Subject Attachment*: `batchId` (UUID), `subjectId` (UUID), `teacherId` (UUID).
- **Outputs**:
  - List of active classes with batch counts.
  - Batch objects with computed `studentsCount`, linked `teacher` object, and embedded class metadata.
  - Roster of enrolled students inside the batch inspection view.

---

### 3. Teacher & Faculty Management Module (M4 TCH)

#### What It Currently Does:
- **Faculty Directory**: Card-based directory displaying faculty avatars, contact information (email, phone), primary qualifications, and assigned subject tags.
- **Faculty Onboarding**: Adds new teachers, provisions a linked authentication user account with `role = 'teacher'` and default credentials, and links teacher metadata.
- **Profile & Workload Inspection**: Dedicated drawer detailing teacher contact channels, assigned batches, assigned subjects, and teaching workload.
- **Evaluation & Reviews**: Star rating and qualitative feedback modal for teacher performance records.
- **Faculty Management**: Edit profile details (name, email, phone, qualifications) with cascading user profile updates, or soft/hard deletion of teacher records.

#### Inputs & Outputs:
- **Inputs**:
  - *Add Teacher Payload*: `fullName` (string), `email` (string), `phone` (string), `qualification` (string), `assignedSubjects` (array of strings, optional).
  - *Update Payload*: `id` (UUID), `fullName` (string), `email` (string), `phone` (string), `qualification` (string).
  - *Evaluation Payload*: `teacherId` (UUID), `rating` (1-5), `feedback` (string).
- **Outputs**:
  - Teacher entity containing user credentials ID, qualification, joined date, and linked batch assignments.
  - Faculty workload metrics and assigned student counts.

---

## Edge Cases Handled vs. Gaps in Current Version

| Edge Case / Scenario | Current Behavior | Gap / Required in Complete Version |
| :--- | :--- | :--- |
| **Over-Capacity Batch Enrollment** | Handled in database schema constraint (`capacity`), but UI allows selecting batches without warning when full. | Enforce real-time capacity validation (`ACA-05`) blocking enrollment with clear UI warning when capacity is reached. |
| **Duplicate Student Admission / Phone** | Handled at DB level with unique `admission_no` and auto-generated counter. | Validate phone and email uniqueness in UI with helpful inline validation instead of generic API rejection. |
| **Soft Delete vs. Historical Data** | Deleting a student marks `status = 'left'` and removes active batch enrollments. Attendance and past fee invoices are preserved. | Retain full batch movement history log (`STU-07`) with timestamped audit records when students transfer or leave. |
| **Teacher Deletion with Active Batches** | Deleting a teacher leaves batches with `teacher_id = null`. | Require reassigning active batches to another teacher or explicitly unassigning with confirmation before deletion. |
| **Bulk Promotion Across Academic Years** | Current modal handles batch re-assignment. | Complete version must support bulk class promotion (`STU-08`) with promotion criteria, archiving old batches, and resetting fee plans. |
| **Parent Account Auto-Linking** | Student registration accepts parent name and phone. | Complete version must provision dedicated Parent User account (`PAR-01`, `STU-05`) and link multi-child relationships. |
| **Teacher Batch-Scoping Security** | Teachers can view general directory in admin mode. | Enforce strict RBAC scoping (`assertOwnBatch`) so teachers only access students, marks, and attendance for their own assigned batches. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register Student with Automatic Class & Fee Provisioning (Priority: P1)
As an Academy Administrator, I want to admit a new student with personal, academic batch, and fee structure details in a single guided flow so that the student is instantly active in the attendance roster, ledger, and batch schedule.

**Why this priority**: Core business workflow required for academy daily operations.

**Independent Test**: Can be tested by filling the student registration form, submitting, and verifying that the student appears in the student directory, the designated batch roster, and the fee ledger with an active fee plan.

**Acceptance Scenarios**:
1. **Given** an administrator on the Students page, **When** they fill the registration form with valid student data, select Grade 10 Batch A, set monthly fee to $150, and submit, **Then** a student record is created with an auto-generated admission number (`ACAD-2026-XXX`), enrolled in Batch A, and assigned a $150 monthly fee plan.
2. **Given** a batch that has reached its maximum capacity (e.g. 30/30 students), **When** an administrator attempts to enroll a 31st student, **Then** the system prevents submission and displays an "Exceeds Batch Capacity" alert with an option to select another batch or override with admin authorization.

---

### User Story 2 - Faculty Onboarding & Batch Assignment (Priority: P1)
As an Academy Administrator, I want to onboard new faculty members, specify their subjects, and assign them to active batches so that schedules, attendance, and student evaluations are correctly linked to instructors.

**Why this priority**: Required for teaching assignments, timetable conflict prevention, and attendance marking.

**Independent Test**: Can be tested by creating a faculty member, assigning them to a batch and subject, and verifying that the teacher's profile shows the assigned batches and the batch displays the assigned teacher name.

**Acceptance Scenarios**:
1. **Given** an administrator in the Teachers view, **When** they enter teacher name, phone, email, and qualification "M.Sc Mathematics" and save, **Then** a Teacher record and linked User account with teacher role are created.
2. **Given** an existing batch, **When** the administrator assigns the teacher as lead instructor, **Then** the batch card updates to show the instructor and the teacher drawer displays the newly linked batch.

---

### User Story 3 - Academic Batch Creation with Capacity & Schedule Controls (Priority: P1)
As an Academy Administrator, I want to create and configure class batches with timing, room numbers, capacity limits, and attached subjects so that the academy's timetable and student capacity are structured.

**Why this priority**: Classes and batches are the foundational container for students, teachers, exams, and attendance.

**Independent Test**: Can be tested by creating a new batch under "Grade 11", setting timing "16:00 - 18:00" and capacity 25, and verifying it appears in batch listings and is selectable during student admission.

**Acceptance Scenarios**:
1. **Given** an administrator in the Batches view, **When** they create "Grade 11 Physics Alpha" with capacity 25 and schedule "16:00 - 18:00", **Then** the batch is created and available in class filters across the application.
2. **Given** an active batch with enrolled students, **When** the administrator edits the batch capacity to a number lower than the currently enrolled student count, **Then** the system rejects the change with a validation error stating capacity cannot be less than active enrollments.

---

### User Story 4 - Student 360 Profile & Multi-Action Workspace (Priority: P2)
As an Administrator or Teacher, I want to click any student to open a comprehensive 360° profile drawer displaying attendance percentages, payment status, contact shortcuts, ID card generation, and notes so that I have all student context without navigating away.

**Why this priority**: Greatly enhances operational efficiency for staff handling inquiries, attendance issues, and fee collection.

**Independent Test**: Can be tested by clicking a student row and verifying that personal details, attendance summary, fee balance, WhatsApp direct contact button, and ID card generation work within the drawer.

**Acceptance Scenarios**:
1. **Given** an open student drawer, **When** the user clicks "💵 Quick Payment", **Then** the payment modal opens pre-filled with the student's admission number and outstanding balance.
2. **Given** an open student drawer, **When** the user clicks "WhatsApp Parent", **Then** a WhatsApp messaging window opens with the pre-formatted guardian contact.

---

### User Story 5 - Bulk Student Roster Operations & CSV Pipeline (Priority: P3)
As an Administrator, I want to import student rosters via CSV, perform bulk batch transfers, and export filtered student directories so that semester transitions and bulk administrative tasks take minutes instead of hours.

**Why this priority**: Essential for high-volume admissions, new academic sessions, and external reporting.

**Independent Test**: Can be tested by importing a 10-row CSV file and verifying all 10 students are created with appropriate accounts and classes.

**Acceptance Scenarios**:
1. **Given** a CSV file with student names, contacts, and target grades, **When** uploaded via Bulk Import, **Then** the system creates corresponding student accounts and reports the total count imported.
2. **Given** multiple selected students in the directory, **When** the administrator triggers "Bulk Transfer" to "Grade 11 B", **Then** all selected students have their active class and batch updated and audit logs are recorded.

---

## Edge Cases

- **Teacher Account Collision**: When onboarding a teacher with an email or phone number already existing in the system, the system MUST show an informative duplicate conflict message rather than an unhandled 500 error.
- **Batch Deactivation with Active Enrollees**: When an administrator deactivates a batch (`is_active = false`), enrolled students MUST remain in the system, but the batch MUST be excluded from new student registration pickers.
- **Student Status Transitions**: Changing a student status to `Suspended` or `Left` MUST automatically set their batch enrollment status to `removed` and exclude them from daily attendance sheets while preserving historical attendance, grades, and invoices.
- **Student Multi-Batch Enrollment**: A student enrolled in multiple subjects/batches MUST have distinct enrollment rows and attendance tracking per batch without cross-polluting attendance rates.
- **Custom Form Fields & Metadata**: Extended profile attributes (emergency contact, medical notes, previous school) MUST be safely serialized and deserialized via `custom_fields` JSON without schema breaking.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Student Management
- **FR-001**: System MUST create, view, update, and soft-delete student profiles with unique admission numbers (`ACAD-YYYY-NNN`).
- **FR-002**: System MUST link each student to personal attributes: full name, phone, optional email, date of birth, gender, address, photo URL, and custom fields.
- **FR-003**: System MUST record parent/guardian details and link parent user credentials.
- **FR-004**: System MUST maintain student statuses: `active`, `left`, `suspended`, `completed`. Soft deletion MUST set status to `left` and MUST NOT delete historical records. Transitioning to `left` or `suspended` MUST automatically freeze the recurring fee plan while retaining any existing unpaid invoices on the ledger.
- **FR-005**: System MUST provide a student 360 view aggregating attendance statistics, fee balances, exam marks, and administrative remarks.
- **FR-006**: System MUST support student batch transfers with timestamped history and audit tracking (`STU-07`).
- **FR-007**: System MUST support bulk class promotions (`STU-08`) with batch reassignment and history preservation.
- **FR-008**: System MUST support CSV roster import and export with validation for required headers.

#### Academic & Batch Structure
- **FR-009**: System MUST support CRUD operations for academic Classes and Batches.
- **FR-010**: System MUST enforce batch maximum capacity constraints during student enrollment (`ACA-05`). System MUST block enrollment when capacity is full by default, while allowing administrators to confirm an explicit capacity override that is logged in `audit_logs`.
- **FR-011**: System MUST allow attaching subjects to batches and assigning designated faculty instructors (`ACA-04`).
- **FR-012**: System MUST support soft deactivation of batches (`is_active = false`) without deleting past academic or financial records (`ACA-06`).
- **FR-013**: System MUST support substitute teacher assignment overrides for specific dates (`TT-05`).
- **FR-014**: System MUST allow batch splitting and syllabus milestone tracking across academic terms.

#### Teacher & Faculty Management
- **FR-015**: System MUST manage teacher profiles with qualifications, contact details, joined date, and avatar. System MUST block deletion or deactivation of any teacher actively assigned to active batches until all batches are reassigned.
- **FR-016**: System MUST provision linked authentication accounts for faculty members with `role = 'teacher'` and secure password hashing.
- **FR-017**: System MUST support assigning subjects and batches to teachers (`TCH-02`, `TCH-03`).
- **FR-018**: System MUST provide a teacher profile drawer displaying assigned workloads, batches, and student rosters.
- **FR-019**: System MUST record teacher evaluations, ratings (1-5 stars), and administrative reviews.
- **FR-020**: System MUST enforce teacher-scoped permissions (`assertOwnBatch`) restricting attendance marking, homework creation, and grading to the teacher's assigned batches.

#### User Interface & Experience
- **FR-021**: All UI views, drawers, modals, tables, and buttons across Student, Class, and Teacher modules MUST comply with Taste Standards (curated HSL/HEX color palettes, glassmorphism backdrops, rounded corners 12px+, and explicit action labeling).
- **FR-022**: Action buttons MUST include descriptive labels and icon badges (e.g., "💵 Quick Payment", "📝 Edit Details", "🎓 Promote Class").
- **FR-023**: Interactive components MUST provide smooth micro-transitions and loading states.
- **FR-024**: Tables MUST provide responsive layouts, sticky headers, and clear empty/error states.

---

### Key Entities

```
+-------------------------------------------------------------+
|                            USER                             |
| id (UUID, PK), role ('admin'|'teacher'|'student'|'parent')   |
| full_name, email, phone, password_hash, is_active           |
+------------------------------+------------------------------+
                               | 1:1
              +----------------+----------------+
              |                                 |
              v                                 v
+-----------------------------+   +-----------------------------+
|           TEACHER           |   |           STUDENT           |
| id (UUID, PK)               |   | id (UUID, PK)               |
| user_id (FK -> User)        |   | user_id (FK -> User, opt)   |
| qualification, joined_on    |   | admission_no (Unique)       |
| custom_fields (JSON)        |   | full_name, phone, email     |
+--------------+--------------+   | dob, gender, photo_url      |
               |                  | status, class_id (FK)       |
               | 1:N              +--------------+--------------+
               v                                 | 1:N
+-----------------------------+                  |
|            BATCH            |                  |
| id (UUID, PK)               |                  |
| class_id (FK -> Class)      |                  |
| name, days, start_time      |                  |
| end_time, capacity          |                  |
| teacher_id (FK -> Teacher)  |                  |
| is_active (Boolean)         |                  |
+--------------+--------------+                  |
               | 1:N                             |
               v                                 v
+-------------------------------------------------------------+
|                         ENROLLMENT                          |
| id (UUID, PK), student_id (FK), batch_id (FK)               |
| enrolled_on (DateTime), status ('active' | 'removed')       |
+-------------------------------------------------------------+
```

- **Student**: Core learner record with admission credentials, demographic data, fee plan link, and status flags.
- **Teacher**: Faculty profile linked to a system User account with qualification records and assigned teaching slots.
- **Class**: High-level academic grade/tier (e.g., Grade 9, Grade 10, Cambridge O-Levels).
- **Batch**: Specific scheduling instance of a class with designated timings, room, instructor, and capacity ceiling.
- **Enrollment**: Explicit join entity linking a student to a batch with enrollment date and active/removed state.
- **BatchSubject**: Junction model mapping a subject and teacher to a specific batch.
- **StudentFeePlan**: Fee structure configuration linking monthly tuition, discount, and due day to a student.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrative staff can complete new student registration including batch assignment and fee plan setup in under **60 seconds**.
- **SC-002**: Directory search and multi-criteria filtering across 1,000+ student records returns updated results in under **100 milliseconds**.
- **SC-003**: 100% of batch capacity constraints are strictly enforced, with **zero** unauthorized over-enrollments occurring without explicit administrative override.
- **SC-004**: Bulk CSV roster import processes 100 student records with user provisioning and class linking in under **5 seconds** with complete error reporting for invalid rows.
- **SC-005**: 100% of state-modifying actions (student creation, batch transfer, status change, teacher onboarding) record persistent entries in `audit_logs`.
- **SC-006**: 100% of UI components across Student, Class, and Teacher modules pass the mandatory UI/UX Taste Audit (curated palettes, glassmorphism, explicit labeling, and micro-animations).

---

## Assumptions

- **Authentication System**: Existing JWT-based authentication and role middleware (`/common/auth.ts`) are leveraged for all module endpoints.
- **Single Campus Deployment**: Current Phase 1 scope operates on a single academy campus; multi-branch tenancy is not in scope.
- **Currency & Units**: Fee amounts are formatted in local standard currency units with 2-decimal precision.
- **Soft Deletion Default**: All deletion operations on students, teachers, and batches default to soft archiving to safeguard data integrity and audit trails.
- **Browser Compatibility**: The web application supports modern evergreen browsers (Chrome, Edge, Firefox, Safari) on desktop and tablet viewport widths (>= 768px).
