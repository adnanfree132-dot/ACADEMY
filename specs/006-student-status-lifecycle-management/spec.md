# Feature Specification: Student Status Lifecycle & Retention Management

**Feature Branch**: `006-student-status-lifecycle-management`  
**Created**: 2026-08-19  
**Status**: Ready for Planning  
**Input**: User description: "now i have to add more features for student related to like student active inactive and other features you thinl realated to that"

---

## Clarifications

### Session 2026-08-19

- Q: When a student is transitioned to "Inactive / On Leave", what should be the default fee invoicing behavior? → A: Option A: Automatic recurring fee generation is paused by default during leave, while providing an administrative toggle in the modal to keep billing active if a seat-retention fee is charged.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprehensive Student Status Transitions & Reason Tracking (Priority: P1)

Academy administrators need the ability to transition a student's status between **Active**, **Inactive / On Leave**, **Suspended**, **Graduated / Alumni**, and **Left / Withdrawn** while recording the exact reason, effective date, and remarks for compliance, billing, and institutional record-keeping.

**Why this priority**: Managing enrollment states is the foundation of student administration. Without granular lifecycle states, academies cannot distinguish between temporarily absent students, graduated alumni, and dropped-out students.

**Independent Test**: Can be fully verified by selecting any student in the directory, changing their status from `Active` to `Inactive / On Leave` with a reason note, and confirming that the status updates in the directory, student 360° drawer, and backend database with a recorded history log.

**Acceptance Scenarios**:
1. **Given** an active student in Grade 10, **When** an admin opens the Status Transition modal, selects `Inactive / On Leave`, chooses reason `Medical Leave`, sets an effective date, and saves, **Then** the student's status updates immediately and a status history entry is created.
2. **Given** a student marked as `Suspended` or `Left`, **When** the admin reviews the student in the directory, **Then** the student displays the appropriate color-coded status badge (`Inactive`: Amber, `Suspended`: Rose, `Alumni`: Purple, `Left`: Gray).
3. **Given** a status transition, **When** the admin specifies a fee action (`Pause Monthly Fees`), **Then** recurring fee generation for that student is paused during the inactive period.

---

### User Story 2 - 1-Click Reactivation & Re-Enrollment Workflow (Priority: P1)

Administrators need to quickly reinstate or reactivate previously inactive, suspended, or withdrawn students when they return, with the option to assign them to their previous or a new class batch.

**Why this priority**: Students frequently return from temporary leave or re-enroll. Re-creating a student from scratch creates duplicate records and breaks financial/academic audit history.

**Independent Test**: Filter directory for `Inactive` or `Archived / Left` students, click `Reactivate Student`, select target batch, confirm, and verify that the student is restored to `Active` status with portal access restored.

**Acceptance Scenarios**:
1. **Given** an `Inactive` or `Left` student, **When** an admin clicks `Reactivate Student`, **Then** a modal presents the option to re-assign a class/batch, confirm fee plan, and reactivate.
2. **Given** the reactivation is confirmed, **When** the directory reloads, **Then** the student appears under the `Active` student roster and their parent login credentials become active again.

---

### User Story 3 - Directory Status Segmentation & Filter Views (Priority: P2)

Administrators need segmented directory tabs to easily toggle views between Active students, Inactive/On-Leave students, Suspended students, Graduated Alumni, and Left/Archived students without losing visibility of historical records.

**Why this priority**: Active daily operations require a clutter-free view of enrolled students, but administrative reviews require instant access to inactive/left cohorts.

**Independent Test**: Click segmented tabs `Active`, `On Leave`, `Suspended`, `Alumni`, and `Archived` in the Students Directory and verify that each tab filters records accurately with single-line count badges.

**Acceptance Scenarios**:
1. **Given** the Students Directory, **When** the admin clicks the `On Leave` tab, **Then** only students with `Inactive / On Leave` status are displayed along with their leave reason.
2. **Given** the `Archived / Left` tab, **When** the admin searches by student name or roll number, **Then** historical archived students are search-findable with full past records intact.

---

### User Story 4 - Parent & Student App Portal Access Gating (Priority: P2)

When a student is transitioned to `Inactive`, `Suspended`, or `Left`, their linked student and parent portal logins must be automatically disabled with a descriptive banner to prevent unauthorized access while preserving past data.

**Why this priority**: Security and access control ensure that parents and students who are no longer enrolled cannot submit assignments, view proprietary announcements, or access academy services.

**Independent Test**: Attempt login with parent/student credentials of an `Inactive` or `Suspended` student and verify that access is blocked with a friendly administrative guidance message.

**Acceptance Scenarios**:
1. **Given** a student changed to `Suspended` status, **When** their parent attempts to sign in to the portal, **Then** login is rejected with the message: "Your account is temporarily suspended. Please contact academy administration."
2. **Given** the student is reactivated to `Active`, **When** the parent signs in, **Then** login succeeds seamlessly.

---

### User Story 5 - Official School Leaving Certificate & Clearance Slip Generator (Priority: P3)

When a student graduates or leaves the academy, administrators need to generate and export an official **Leaving Certificate / Clearance Slip** detailing their enrollment period, attendance rate, fee clearance status, and conduct remarks.

**Why this priority**: Providing formal exit certificates is a mandatory operational requirement for educational institutions when students transfer or finish schooling.

**Independent Test**: Open any graduated or left student's action menu, select `Leaving Certificate`, and verify that the printable preview and WhatsApp sharing link render complete academic and fee clearance data.

**Acceptance Scenarios**:
1. **Given** a student in `Left` or `Graduated` status, **When** the admin selects `Generate Leaving Certificate`, **Then** a clean Floating Island modal displays the institutional certificate with dues clearance status and remarks.
2. **Given** the certificate modal, **When** the admin clicks `Send WhatsApp`, **Then** a pre-filled clearance summary is prepared for direct dispatch to the parent.

---

### Edge Cases

- **Student with Outstanding Dues attempting to Archive/Leave**: System warns the admin if unpaid dues exist before archiving, providing an option to mark dues as "Waived", "Written Off", or "Carried as Overdue Balance".
- **Batch Transfer during Reactivation**: If the student's previous batch has reached maximum capacity (`ACA-05`), the system prompts the admin to select an alternate section or increase batch limit.
- **Bulk Status Changes**: When multiple students are selected, the bulk tools menu supports batch status updates (e.g. bulk graduating an entire outgoing Grade 12 section).
- **Soft Deletion Integrity**: Changing status to `Left` MUST never delete attendance logs, fee transaction ledgers, or exam test results.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support five distinct student status states: `Active`, `Inactive / On Leave`, `Suspended`, `Graduated / Alumni`, and `Left / Withdrawn`.
- **FR-002**: The system MUST provide a `Change Student Status` modal adhering to Floating Island Modal Architecture (Navy header card, white form card, floating pill buttons).
- **FR-003**: The status transition form MUST capture: `Target Status`, `Effective Date`, `Reason Category` (Financial, Medical, Relocation, Disciplinary, Graduation, Personal, Other), `Detailed Remarks`, and `Fee Billing Impact` (Pause Fees / Continue Fees / Waive Balance).
- **FR-004**: The system MUST maintain an immutable `StudentStatusHistory` log recording every status change with timestamp, previous status, new status, reason, remarks, and acting administrator ID.
- **FR-005**: The 360° Student Profile Drawer MUST include a dedicated "Status & History" tab displaying the chronological lifecycle timeline of the student.
- **FR-006**: The system MUST provide a `Reactivate Student` action allowing instant reinstatement of inactive/left students with optional batch assignment and fee plan configuration.
- **FR-007**: The Students Directory header filter tabs MUST include segmented status views: `All`, `Active`, `On Leave`, `Suspended`, `Alumni`, and `Archived / Left` with real-time record counts.
- **FR-008**: The authentication middleware MUST verify student and parent status upon portal login, disabling access for non-active student accounts.
- **FR-009**: The system MUST support generating a standardized, printable **Leaving Certificate / Clearance Slip** featuring student details, attendance score, fee clearance indicator, conduct rating, and principal signature block.
- **FR-010**: The Leaving Certificate MUST provide direct 1-click `Print Slip`, `Copy Details`, and `Send via WhatsApp` actions.
- **FR-011**: The bulk operations menu MUST support batch status updates for multi-selected students (e.g., bulk graduating an entire class).

---

### Key Entities

- **Student**:
  - `status`: String enum (`active`, `inactive`, `suspended`, `graduated`, `left`).
  - `status_reason`: String categorization of the current status reason.
  - `status_updated_at`: DateTime of last status transition.
  - `leaving_date`: Optional date when student departed or graduated.
  - `is_fee_paused`: Boolean flag indicating if recurring fee invoices should be suspended.
- **StudentStatusHistory**:
  - `id`: UUID primary key.
  - `student_id`: Foreign key reference to Student.
  - `previous_status`: Previous status string.
  - `new_status`: New status string.
  - `reason_category`: Reason code / category.
  - `remarks`: Detailed notes or administrative rationale.
  - `effective_date`: Date the transition took effect.
  - `changed_by_user_id`: Foreign key reference to Admin User.
  - `created_at`: Timestamp of transition logging.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can transition student status and record reason notes in under 15 seconds via the dedicated Floating Island modal.
- **SC-002**: 100% of student status transitions are permanently auditable in the status history timeline with zero data loss on financial/academic records.
- **SC-003**: Inactive and Left students are instantly segregated from active rosters, reducing accidental fee generation and attendance confusion by 100%.
- **SC-004**: Reactivation of returning students can be completed in 1 click without requiring manual re-entry of demographics or past history.
- **SC-005**: Official Leaving Certificates and Clearance slips can be generated and printed or shared via WhatsApp in under 5 seconds.

---

## Assumptions

- Students in `Inactive / On Leave` status remain registered with the academy but can have fee billing paused during their leave period.
- Soft-deletion via `Left` status preserves all historical fee payments, attendance sheets, and exam marks in accordance with Constitution Principle III.
- Portal login gating applies to both student user accounts and linked parent user accounts.
- All modals and form interfaces will strictly follow the project's **Floating Island Architecture** (Principle IV).
