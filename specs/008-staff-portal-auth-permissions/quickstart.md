# Quickstart Validation Guide: Staff Portal Authentication & Permissions

**Feature**: `008-staff-portal-auth-permissions` | **Date**: 2026-08-21 | **Spec**: [specs/008-staff-portal-auth-permissions/spec.md](file:///d:/academy/specs/008-staff-portal-auth-permissions/spec.md)

This guide documents the end-to-end validation scenarios for verifying staff credential generation, custom staff types, granular permissions, and self-service staff workflows.

---

## Scenario 1: Staff Registration & Automated Credential Slip

**Objective**: Verify that adding any staff member generates a unique Staff ID, secure temporary password, and displays a floating Credential Slip with WhatsApp and Print actions.

1. **Navigate**: Go to Teachers / Staff Directory (`/teachers` or `/staff`).
2. **Action**: Click `+ Add Staff Member`.
3. **Fill Form**:
   - Staff Name: `Dr. Tariq Mahmood`
   - Staff Type: `Faculty`
   - Designation: `Senior Chemistry Lecturer`
   - Phone: `+92 300 1234567`
4. **Submit**: Click `[ Complete Registration & Issue Credentials ]`.
5. **Expected Outcome**:
   - Instant 0ms optimistic visual update in the staff directory table.
   - A floating island `CredentialSlipModal` opens immediately with:
     - Staff ID: `FAC-2026-001`
     - Temporary Password: (e.g. `Acad#8492`)
     - Role Badge: `Faculty`
     - Action Pills: `[ 🖨️ Print Slip ]`, `[ ⤓ Download PDF ]`, and `[ 💬 WhatsApp Send ]`.

---

## Scenario 2: Dynamic Custom Staff Type Creation

**Objective**: Verify that an Administrator can create a custom staff category (e.g., "Librarian") and assign staff members to it.

1. **Navigate**: Open the directory header `[ ⚙ Tools ▾ ]` menu → Select `Staff Types Manager`.
2. **Action**: Click `+ Add Staff Type`.
3. **Fill Form**:
   - Type Name: `Librarian`
   - Code: `LIB`
   - Icon: `BookOpen`
   - Default Permission Preset: `Students: View Only`, `Attendance: View Only`, `Fees: Hidden`.
4. **Save**: Click `[ Save Staff Type ]`.
5. **Verify**:
   - The Staff Types filter pill bar now includes `[ 📚 Librarian (0) ]`.
   - The Staff Registration dropdown now lists `Librarian` as an option.

---

## Scenario 3: Granular Permission Customization & Scoped Access

**Objective**: Verify that setting a module permission to `Hidden` or `View Only` restricts access in real-time.

1. **Navigate**: In the Staff Directory, click the `•••` actions on a staff profile → Select `Configure Permissions`.
2. **Action**:
   - Set `Fee Billing` to `Hidden`.
   - Set `Student Directory` to `View Only`.
   - Set `Attendance` to `Editable`.
3. **Save**: Click `[ Update Permissions ]`.
4. **Login Verification**:
   - Log out of Admin account and log in with the staff member's Staff ID and temporary password.
   - **Check Sidebar**: The `Fees` menu item is completely hidden.
   - **Check Students**: The Student Directory is visible, but `+ Add Student`, `Edit`, and `Delete` buttons are hidden.
   - **Check Attendance**: Staff can view and mark attendance registers for assigned classes.

---

## Scenario 4: Staff Leave Request & Substitute Teacher Prompt

**Objective**: Verify the employee leave application and automated substitute teacher assignment flow.

1. **Staff Portal**: Staff member logs into their self-service dashboard → Clicks `Request Leave`.
2. **Submit**: Selects dates `Aug 25 – Aug 28`, type `Casual`, reason `Family Emergency`.
3. **Admin Queue**: Admin opens `Leave Requests` tab → Clicks `Approve`.
4. **Substitute Prompt**: An alert prompts: *"Dr. Tariq has 3 scheduled batches on these dates. Would you like to assign a substitute teacher?"*
5. **Assign**: Selects substitute `Prof. Salman` and confirms.
6. **Verify**: Batch timetable reflects substitute teacher tag for those days, and Dr. Tariq's status reflects `On Leave`.
