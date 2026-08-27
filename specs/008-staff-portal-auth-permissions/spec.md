# Feature Specification: Staff Portal Authentication, Dynamic Roles & Granular Permission Management

**Feature Branch**: `008-staff-portal-auth-permissions`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "like student section login id and passwords are generated for every student for staff there is also id and passwords will be generated upon their entry as a staff it can see only date related to that but admin can enable other options if he want as view only or editable also there must be an option to chooose staff type basic staff types Facualty,Admin,Domestic Staff enter as a defaulth but other option can be add by user also suggest other options realteed to staff which you think is good add on for staff"

## Clarifications

### Session 2026-08-21
- Q: How should staff members log into the Academy Pro OS platform? → A: Unified Smart Login Portal (`/login`) that automatically detects user role from Staff ID, Student ID, or Email and routes to their scoped dashboard.
- Q: How should default permissions be initialized when an Administrator creates a new custom Staff Type? → A: Template Clone + Zero-Trust Fallback (Admin selects a base template like Faculty, Admin, Domestic Staff, or Blank to pre-populate safe defaults while keeping fees locked).
- Q: Should staff members be required to change their temporary auto-generated password upon their first login? → A: Optional Password Change with Security Reminder (staff can directly access their dashboard with their generated password, with an optional profile banner/reminder to update it at their convenience).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Staff Credential Generation & Credential Slips (Priority: P1)

When an Administrator registers any new staff member (faculty, administrative staff, or domestic/support worker) in the Academy system, the platform automatically generates a unique System Staff Login ID (e.g. `FAC-2026-001`, `ADM-2026-002`, `DOM-2026-003`) along with a secure, human-readable temporary password. Upon saving, a floating digital Credential Slip is displayed with one-click print, PDF download, and direct WhatsApp dispatch capabilities, ensuring smooth onboarding.

**Why this priority**: Seamless automated credential creation is the foundational prerequisite for multi-role staff access, self-service portals, and secure authentication across the institution.

**Independent Test**: Can be verified independently by creating a new staff member under Teachers/Staff management, observing the instant generation of credentials, and downloading/previewing the printable staff credential slip.

**Acceptance Scenarios**:

1. **Given** an Administrator is on the Staff Registration modal, **When** they fill in staff name, phone, designation, and staff type and click Submit, **Then** a unique alphanumeric Staff ID and a randomized secure password are automatically created and stored securely.
2. **Given** a new staff member has been created, **When** the registration completes, **Then** a theme-matching Credential Slip modal pops up showing the Staff ID, temporary password, designated staff role, and buttons to `[ 🖨️ Print Credential Slip ]`, `[ ⤓ Download PDF ]`, and `[ 💬 Send via WhatsApp ]`.
3. **Given** a staff member forgets their password or needs reset, **When** an Administrator clicks `Reset Password` in the staff row actions, **Then** a new temporary password is generated instantly with an updated credential slip.

---

### User Story 2 - Dynamic Staff Type Categorization & Management (Priority: P1)

The system provides standard default Staff Types out-of-the-box:
1. **Faculty** (Teachers, Lecturers, Subject Specialists, Instructors)
2. **Admin / Management** (Principal, Academic Coordinators, Front Desk, Accountants)
3. **Domestic / Support Staff** (Lab Assistants, Security Personnel, Janitorial, Drivers, Maintenance)

Administrators have full autonomy to add new custom Staff Types (e.g. *Librarian*, *School Counselor*, *Nurse / First Aid*, *Sports Coach*, *IT Support Specialist*), rename existing types, or archive unused types.

**Why this priority**: Academic institutions operate with diverse employee categories with differing organizational duties, salary structures, and operational workflows.

**Independent Test**: Can be tested independently by navigating to Staff Type Settings, adding a new staff type (e.g., "Librarian"), and assigning a newly registered staff member to that custom category.

**Acceptance Scenarios**:

1. **Given** the staff registration form, **When** selecting Staff Type, **Then** the dropdown displays Faculty, Admin, Domestic Staff, plus any custom user-created types with clean category badges.
2. **Given** an Administrator is in Settings or the Staff Directory header tools, **When** they click `+ Add Staff Type`, **Then** a floating island modal allows defining the Staff Type name, category code, icon badge, and default permission template.
3. **Given** an existing Staff Type is modified, **When** changes are saved, **Then** all staff members linked to that type reflect the updated category name without breaking existing permissions.

---

### User Story 3 - Granular Role-Based Permissions & Module Visibility Control (Priority: P1)

Administrators can configure granular module-by-module access permissions either as template presets (by Staff Type) or through custom overrides on individual staff profiles. For every system module, the Admin can assign one of three permission levels:
- **Hidden / No Access**: The module is completely hidden from the staff member's sidebar and API routes return 403 Forbidden.
- **View Only (Read)**: Staff can view information in that module (e.g., student directory, timetable) but cannot create, edit, delete, or perform mutations.
- **Editable (Read & Write)**: Full operational control to add, edit, and record data within that module.

Additionally, non-administrative staff (like Faculty) operate under **Scoped Data Isolation**: by default, they can only view students, attendance registers, and gradebooks associated with their assigned academic batches and subjects.

**Why this priority**: Protects sensitive financial, managerial, and student personal data while empowering faculty and support staff to perform daily duties without administrative bottleneck.

**Independent Test**: Can be tested independently by logging in as a Faculty member with restricted fee permissions, verifying that the Fees module is absent from navigation, and confirming that student attendance can only be marked for assigned batches.

**Acceptance Scenarios**:

1. **Given** a Faculty staff member, **When** they log into their portal, **Then** they only see modules enabled by the Administrator (e.g., My Batches, Attendance, Homework, Tests) and only see students enrolled in their assigned classes.
2. **Given** an Administrator editing a staff member's permissions, **When** they toggle the *Fee Billing* module to `Hidden` and the *Student Directory* to `View Only`, **Then** upon saving, the staff member immediately loses access to fee operations and cannot modify student profiles.
3. **Given** a Domestic Staff member (e.g. Security), **When** they log in, **Then** their portal only shows duty shifts, campus announcements, and staff attendance check-in.

---

### User Story 4 - Staff Self-Service Portal & Dedicated Dashboard (Priority: P2)

Every employee with generated credentials can log into the Academy Pro OS web and mobile interface. Upon login, the portal automatically adapts to their role and configured permissions:
- Shows their personal daily class timetable / duty schedule.
- Highlights active assignments, pending exam test mark entries, and announcements.
- Allows staff to record their daily check-in / check-out time.
- Lets staff view their own monthly attendance summary and submit leave requests.

**Why this priority**: Increases operational efficiency by replacing manual paper rosters and verbal leave requests with structured self-service tools.

**Independent Test**: Can be tested independently by logging in with staff credentials and verifying that the dashboard displays the staff member's personalized schedule, announcements, and quick duty actions.

**Acceptance Scenarios**:

1. **Given** a logged-in staff member, **When** visiting their dashboard, **Then** they see their personalized schedule for today, quick attendance status, and recent academy notices.
2. **Given** a faculty member on their dashboard, **When** clicking on an assigned batch card, **Then** it takes them directly to the batch roster to mark today's attendance or enter test results.

---

### User Story 5 - Staff Attendance & Leave Management Workflow (Priority: P2)

Staff members can mark their daily presence (check-in/check-out) or have attendance marked in bulk by an Admin/Biometric gateway. Staff can apply for leaves (e.g., Casual, Sick, Maternity, Emergency) with date ranges and attached notes. Administrators receive instant notifications to Approve or Reject leave applications with remarks.

**Why this priority**: Essential for human resource management, substitute teacher allocations, and accurate monthly salary computations.

**Independent Test**: Can be tested independently by submitting a leave request from a staff account, approving it from the Admin dashboard, and verifying that the staff member's status reflects `On Leave`.

**Acceptance Scenarios**:

1. **Given** a staff member needing time off, **When** they fill the Leave Request form (date range, leave type, reason), **Then** the request appears in the Admin Leave Approval queue with `Pending` status.
2. **Given** an Administrator in the Leave Approval queue, **When** they click `Approve`, **Then** the staff member's calendar marks those days as Approved Leave, and if the staff is a teacher, an option to assign a Substitute Teacher is prompted.

---

### User Story 6 - Staff Payroll Structure, Document Vault & Recommended Add-ons (Priority: P3)

Administrators can maintain comprehensive staff profiles including:
- **Salary & Compensation Structure**: Basic monthly pay, hourly rates (for visiting faculty), allowances (conveyance, medical), deductions, and payment method (Bank transfer / Cash).
- **Document & Compliance Vault**: Secure storage of National Identity Card (CNIC), academic degrees, certifications, police verification, and employment contract copies.
- **Emergency Contact & Next of Kin**: Contact numbers, relationship, and medical notes.
- **Lifecycle Status Management**: `Active`, `Probation`, `On Leave`, `Suspended`, `Resigned`, `Terminated (Archived)`.

**Why this priority**: Completes the full employee lifecycle, ensuring legal compliance, transparent payroll records, and secure organizational records.

**Independent Test**: Can be tested independently by adding salary terms and uploading a document copy to a staff member's profile and verifying the summary in the Staff Detail Drawer.

**Acceptance Scenarios**:

1. **Given** an Admin viewing a staff profile, **When** navigating to the *Documents* tab, **Then** they can upload PDF/Image scans with title and expiration dates.
2. **Given** monthly payroll generation, **When** an Admin reviews a staff member's compensation, **Then** the system calculates net payable based on base pay, active allowances, approved paid/unpaid leaves, and deductions.

---

## Edge Cases

- **Staff with No Assigned Batches**: When a newly hired faculty member has not yet been assigned to any academic batch, their dashboard gracefully displays a friendly empty state prompting them to contact the Academic Coordinator, rather than crashing or showing unauthorized batches.
- **Simultaneous Multiple Roles**: If a staff member acts as both a Subject Teacher (Faculty) and an Assistant Coordinator (Admin), the system allows assigning a hybrid permission set without requiring two separate accounts.
- **Emergency Account Deactivation / Suspension**: If an employee is terminated or suspended, changing their status to `Suspended` or `Terminated` immediately revokes active JWT session tokens, blocking further access within 0 seconds.
- **Password Reset on First Login**: Option for administrators to mandate `Require Password Change on First Login` so staff personalize their initial generated credentials upon entry.
- **Permission Downgrade in Real Time**: If an Admin removes editing rights from a staff member while they are logged in, background API authorization immediately rejects unauthorized write attempts and shows a polite message.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically generate a unique System Staff ID and a randomized secure initial password whenever a new staff member is registered.
- **FR-002**: System MUST render an official theme-matching Credential Slip upon staff registration, supporting print view, PDF generation, and one-click WhatsApp sharing.
- **FR-003**: System MUST support default built-in staff types: `Faculty`, `Admin`, and `Domestic Staff`.
- **FR-004**: System MUST allow Administrators to create, edit, and archive custom Staff Types (e.g. Librarian, IT Coordinator, Security Guard) with support for pre-populating permissions from a base template (`Faculty`, `Admin`, `Domestic Staff`, or `Blank`).
- **FR-005**: System MUST provide a granular permission matrix for every staff type and individual staff member across all application modules (Students, Batches, Attendance, Fees, Exams, Homework, Timetable, CRM, Settings).
- **FR-006**: Each module permission MUST support three discrete access levels: `Hidden`, `View Only`, and `Editable`.
- **FR-007**: Faculty and non-admin staff MUST have data access scoped exclusively to their assigned batches, timetable slots, and subjects unless explicitly granted broader view permissions.
- **FR-008**: System MUST provide a unified smart authentication portal at `/login` supporting Staff ID (e.g. `FAC-2026-001`, `ADM-2026-001`, `DOM-2026-001`) or registered email, automatically detecting role and routing to the scoped dashboard.
- **FR-009**: System MUST allow staff members to directly access their dashboard using their initial generated credentials, with an optional security reminder to personalize their password in profile settings at their convenience.
- **FR-010**: System MUST provide an Admin password reset action in the staff management directory that regenerates credentials and issues a fresh credential slip.
- **FR-011**: System MUST support staff lifecycle statuses: `Active`, `Probation`, `On Leave`, `Suspended`, `Resigned`, and `Terminated`.
- **FR-012**: Changing a staff member's status to `Suspended` or `Terminated` MUST immediately invalidate active sessions and block portal login.
- **FR-013**: System MUST provide a Staff Attendance module supporting daily check-in, check-out, and presence tracking (Present, Late, Absent, Half-Day, On Leave).
- **FR-014**: System MUST support a Staff Leave Request workflow where staff submit leave applications with dates and reasons, and Administrators approve or reject with remarks.
- **FR-015**: Approving a Faculty member's leave MUST trigger an automated prompt to assign a Substitute Teacher for affected scheduled batches.
- **FR-016**: System MUST allow configuring basic staff salary terms (monthly salary, hourly visiting rate, allowances, deductions, and payment method).
- **FR-017**: System MUST provide a Document Vault on staff profiles for uploading CNIC/ID copies, academic degrees, and contracts.
- **FR-018**: System MUST record audit log entries whenever staff permissions, salary terms, or lifecycle statuses are modified.
- **FR-019**: All modal dialogues for staff creation, permission editing, and credential viewing MUST follow the project's Floating Island Modal Architecture (transparent canvas, dark navy header island, white form card island, floating action pill island).
- **FR-020**: All form controls inside staff modals MUST use `ModernSelect` for dropdowns and `ModernDatePicker` for calendar dates, strictly banning raw browser selects and Unicode emojis.
- **FR-021**: The UI MUST update instantaneously (0ms optimistic UI reflection) when staff are added, edited, or have their status changed.
- **FR-022**: Backend API errors must be sanitized through `envelope.ts` to prevent raw database or constraint errors from reaching the user interface.

---

### Key Entities

- **StaffMember**: Represents an employee at the academy. Key attributes include `id`, `staffId` (e.g. `FAC-2026-001`), `fullName`, `email`, `phone`, `gender`, `staffTypeId`, `designation`, `qualification`, `joiningDate`, `status`, `photoUrl`, `baseSalary`, `hourlyRate`, `bankDetails`, and `emergencyContact`.
- **StaffType**: Defines a category of staff. Attributes include `id`, `name` (e.g. Faculty, Admin, Domestic Staff, Librarian), `code`, `description`, `iconName`, `isSystemDefault`, `isActive`, and `defaultPermissions`.
- **StaffPermission**: Defines module-by-module access rights. Attributes include `id`, `staffId` (or `staffTypeId`), `moduleKey` (e.g. `students`, `fees`, `attendance`), and `accessLevel` (`hidden`, `view_only`, `editable`).
- **StaffAttendance**: Tracks daily employee presence. Attributes include `id`, `staffId`, `date`, `checkInTime`, `checkOutTime`, `status` (`Present`, `Late`, `Absent`, `Half Day`, `On Leave`), and `notes`.
- **StaffLeaveRequest**: Records employee leave requests. Attributes include `id`, `staffId`, `leaveType` (`casual`, `sick`, `maternity`, `emergency`), `startDate`, `endDate`, `totalDays`, `reason`, `status` (`pending`, `approved`, `rejected`), `reviewedBy`, and `reviewRemarks`.
- **StaffDocument**: Stores attached staff credentials and compliance files. Attributes include `id`, `staffId`, `title`, `documentType` (`cnic`, `degree`, `resume`, `contract`), `fileUrl`, `uploadedAt`, and `expiryDate`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registering a new staff member automatically produces valid login credentials and displays a printable Credential Slip in under 1 second.
- **SC-002**: 100% of non-admin staff logins strictly respect configured permission boundaries (modules set to `Hidden` never render in navigation and protected API endpoints reject unauthorized calls with 403 Forbidden).
- **SC-003**: Administrators can create custom Staff Types and configure full permission matrices in fewer than 4 clicks.
- **SC-004**: Faculty members logging into their portal can view their assigned batches, mark attendance, and input grades with zero exposure to school fee financials.
- **SC-005**: Staff leave request approval automatically alerts the coordinator and updates the attendance register without manual double-entry.
- **SC-006**: 100% of staff modal forms and popovers comply with the Floating Island standard, zero-emoji policy, and theme-matching SVG icon rules.

---

## Assumptions

- **Shared Authentication Architecture**: The existing JWT and bcrypt user authentication system used for Admin and Students will be extended to support Staff role logins via their unique Staff ID or email.
- **Backwards Compatibility with Teachers Table**: Existing `Teacher` records will smoothly map to `StaffMember` records with type `Faculty`, preserving all existing batch assignments, subject links, and attendance histories.
- **Client-Side Permission Scoping**: The frontend routing and sidebar navigation will dynamically read the active user's permissions array and render only authorized navigation items.
- **Multi-Role Single Sign-On**: A user with multiple assigned administrative roles can switch contexts seamlessly without multiple credentials.

---

## Recommended Additional Add-Ons for Staff Management (Suggested Expansion)

To provide an elite, end-to-end institutional management experience, the following features are integrated into this specification as high-value additions:

1. **Direct WhatsApp Onboarding Dispatch**:
   - One-click trigger from the Credential Slip to send a pre-formatted welcoming message to the staff member's WhatsApp with their Staff ID, temporary password, and portal login URL.

2. **Automated Substitute Teacher Assignment Prompt**:
   - When a faculty member's leave request is approved, the system highlights all affected batch sessions during the leave window and allows one-click assignment of available substitute teachers.

3. **Digital Staff ID Card Generation & Batch Print**:
   - Matching the student CR80 ID card standard, generating standardized, printable staff identity cards with employee photo, designation, Staff ID barcode/QR code, and emergency contact details.

4. **Staff Performance & Attendance Analytics**:
   - Interactive attendance rate percentage, punctuality score, syllabus coverage pace, and student rating summary accessible in the staff detail drawer.

5. **Payroll Preview & Monthly Pay Slip Generation**:
   - Automated compilation of monthly salary slips factoring in base pay, allowances, overtime/hourly lectures, and deductions for quick PDF export.
