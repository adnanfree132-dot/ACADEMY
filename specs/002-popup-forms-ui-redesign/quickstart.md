# Quickstart & Visual Verification Guide: Modal & Popup Forms Redesign

**Feature**: `002-popup-forms-ui-redesign`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

---

## 1. Prerequisites

1. Ensure the web application is running locally:
   - Backend API: `http://localhost:5000/api/v1`
   - Frontend Vite: `http://localhost:3000`

---

## 2. Visual Validation Scenarios

### Scenario 1: Student Admission Modal & Credential Slip
1. Open `http://localhost:3000` and navigate to **Students** view.
2. Click **"Add New Student"**.
3. **Verify Visual Archetype**:
   - Header is solid `#0F172A` with Emerald shield badge (`#10B981`) and subtitle.
   - Form is divided into grouped cards (*Student Profile*, *Guardian*, *Academic & Fee*).
   - Action buttons are right-aligned paired pills (`Cancel` + `✓ Complete Registration`).
4. Fill in student info and click **"✓ Complete Registration"**.
5. **Verify Credential Slip**:
   - Matches reference screenshot: Critical security notice callout, monospace usernames, emerald password pills (`Pass#7877`), 3-column action row, and full-width `✓ Done & Close` pill.
   - Clicking `✓ Done & Close` smoothly closes the modal without backdrop locking.

---

### Scenario 2: Faculty Onboarding & Evaluation Modals
1. Navigate to **Teachers & Staff** view.
2. Click **"Add Faculty Member"**.
3. **Verify Visual Archetype**:
   - Solid `#0F172A` dark header with Emerald icon badge and subtitle.
   - Grouped cards for Personal Info, Contact, and Qualification.
   - Right-aligned paired pill buttons (`Cancel` + `✓ Save Teacher Profile`).
4. Click **"Review"** on any teacher card:
   - Verify `TeacherEvaluationModal` opens with dark header, scoring slider cards, and clean submit button.

---

### Scenario 3: Batch Creation & Capacity Ceiling Notice
1. Navigate to **Classes & Batches** view.
2. Click **"+ Create Batch"**.
3. **Verify Visual Archetype**:
   - Solid `#0F172A` dark header with Emerald icon badge.
   - Grouped cards for *Class Level & Name*, *Timing & Days*, *Seat Capacity & Room*.
   - Right-aligned paired pill buttons.

---

### Scenario 4: Fee Payment & Bulk Import Dialogs
1. In **Students** view, click a student fee badge or open **"Import CSV"**.
2. **Verify Visual Archetype**:
   - `QuickPaymentModal`: Dark header, amount input card, method selector, receipt trigger.
   - `BulkImportModal`: Dark header, dashed CSV dropzone with cloud icon, sample download pill.

---

### Scenario 5: Automated E2E Regression Suite
Run the automated Playwright validation suite:
```bash
node test_quickstart_scenarios.cjs
```
**Expected Outcome**: 100% of modal workflows open, submit, and close with zero console errors.
