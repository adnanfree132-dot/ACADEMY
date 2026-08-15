# Quickstart & End-to-End Validation Guide: Student, Class, and Teacher Modules

**Feature**: `001-student-class-teacher-modules`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

---

## 1. Prerequisites & Environment Setup

1. **Backend Server Running**:
   ```bash
   cd d:/academy/server
   npm run dev
   # Verifies: Express running on http://localhost:5000/api/v1
   ```

2. **Frontend Development Server Running**:
   ```bash
   cd d:/academy
   npm run dev
   # Verifies: Vite app loaded on http://localhost:3000
   ```

3. **Database Migration & Seed Check**:
   ```bash
   cd d:/academy/server
   npx prisma generate
   npm run prisma:seed
   ```

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Admit New Student & Verify Capacity + Fee Plan
1. Navigate to `http://localhost:3000` and select **Students** from the navigation sidebar.
2. Click **"➕ Register New Student"** (incorporating Taste standard modal).
3. Fill student details: Name: `"Zayn Tariq"`, Phone: `"+923001112233"`, Batch: `"Grade 10 - Morning Alpha"`, Total Fee: `15000`.
4. Click **"Confirm Admission"**.
5. **Expected Outcome**:
   - Student appears in the directory table with registration number `ACAD-2026-XXX`.
   - Fee status badge displays `Pending` ($15000 balance).
   - Enrolled batch count increments by 1.

---

### Scenario 2: Batch Capacity Ceiling & Admin Override Test
1. Attempt to admit another student into a batch that is at maximum capacity (e.g. 30/30).
2. **Expected Outcome**:
   - Modal displays an alert dialog: *"Batch capacity ceiling reached (30/30)"*.
   - If administrator clicks *"Authorize Override"*, the student is admitted and an audit event `BATCH_CAPACITY_OVERRIDE` is written to `audit_logs`.

---

### Scenario 3: Faculty Deletion Guard & Reassignment Gate
1. Navigate to **Teachers** view.
2. Attempt to delete a teacher who is actively assigned as the instructor for `"Grade 10 - Morning Alpha"`.
3. **Expected Outcome**:
   - The deletion is blocked with an alert: *"Cannot delete faculty member assigned to active batches. Reassign batches first."*
   - Reassigning the batch to another faculty member unlocks successful deletion/archiving.

---

### Scenario 4: Student Departure & Fee Plan Freeze
1. In **Students** view, click a student card to open the **Student 360 Profile Drawer**.
2. Change the status from `Active` to `Left`.
3. **Expected Outcome**:
   - Student is removed from active attendance sheets and active batch rosters.
   - Recurring monthly fee generation is frozen.
   - Any prior unpaid invoices remain intact on the **Student Ledger** for audit and collection tracking.

---

### Scenario 5: Automated E2E Test Suite Run
Execute the automated Playwright verification suite:
```bash
node test_e2e_full_flow.cjs
node test_all_buttons.cjs
```
**Expected Outcome**: All tests pass with zero console errors.
