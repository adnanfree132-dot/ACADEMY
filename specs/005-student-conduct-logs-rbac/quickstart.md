# Phase 1: Quickstart Validation Guide

**Feature**: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals  
**Branch**: `005-student-conduct-logs-rbac`  
**Date**: 2026-08-18

---

## Overview

This guide outlines end-to-end verification workflows to validate all functional requirements, role boundaries, and confidentiality rules for Student Conduct Logs across Admin, Teacher, Student, and Parent personas.

---

## Prerequisites & Setup

1. **Start Backend API Server**:
   ```bash
   cd d:\academy\server
   npm run dev
   ```
   *Verify health check at `http://localhost:5000/health` returns status `ok`.*

2. **Start Frontend Dev Server**:
   ```bash
   cd d:\academy
   npm run dev
   ```
   *Open application at `http://localhost:3000` in Google Chrome.*

3. **Ensure Database Seed Data**:
   ```bash
   cd d:\academy\server
   npm run prisma:seed
   ```

---

## Validation Scenario 1: Super Admin Full Lifecycle (Create, Edit, Delete)

1. Open Academy Pro OS dashboard logged in as **Super Admin**.
2. Navigate to **Students** directory and click **View** on any student (e.g., `Zaid Khan`).
3. In the `StudentProfileDrawer`, switch to the **Conduct** tab.
4. **Create a Log**:
   - Select Category: `Commendation` (Emerald).
   - Enter note: `"Demonstrated leadership in Math Olympiad group project."`
   - Keep `Confidential` unchecked.
   - Click **+ Add**.
   - *Expected Result*: The note appears immediately in the timeline with an Emerald Commendation badge, author tag (`Academy Admin`), and relative timestamp (`Just now`).
5. **Edit the Log**:
   - Click the **✏️ Edit** button on the newly created card.
   - Modify text to: `"Demonstrated top-tier leadership in Math Olympiad group project (1st Place)."`
   - Click **✓ Save / Submit** on the floating action pill.
   - *Expected Result*: The card updates immediately with the revised wording and `(Edited)` indicator.
6. **Soft Delete the Log**:
   - Click the **🗑️ Delete** button on the card.
   - Confirm deletion in the popover modal.
   - *Expected Result*: The card smoothly animates out and disappears from the active conduct list. The database record retains `is_deleted = true`.

---

## Validation Scenario 2: Teacher Author vs. Colleague RBAC Enforcement

1. **Teacher A (Author)**:
   - Log in as Teacher A (`Sarah Jenkins`).
   - Navigate to assigned batch roster (e.g., `Grade 10-A`).
   - Open student profile for `Ali Ahmed` and submit a conduct note: `"Completed extra credit calculus exercises."`
   - *Expected Result*: Note is saved with Author: `Sarah Jenkins (Teacher)`. Edit and Delete buttons are visible and active for Sarah.
2. **Teacher B (Colleague)**:
   - Log in as Teacher B (`Ahmed Raza`).
   - Open `Ali Ahmed`'s profile in the same batch.
   - *Expected Result*: Teacher B can read Sarah's note, but Edit and Delete buttons are completely hidden / disabled.
   - *API Test*: Direct `PUT /api/v1/conduct-logs/:id` or `DELETE /api/v1/conduct-logs/:id` with Teacher B's JWT token returns HTTP `403 Forbidden`.

---

## Validation Scenario 3: Multi-Tenant Student & Parent Confidentiality Guard

1. **Create One Public and One Confidential Log as Admin/Teacher**:
   - Note 1 (Public): `"Received Honor Roll commendation for Term 1."` (`is_confidential = false`).
   - Note 2 (Confidential): `"Parent conference advised regarding attention during lectures."` (`is_confidential = true`).
2. **Student Portal Check**:
   - Switch role / log in as the student.
   - Navigate to Student Profile / Remarks view.
   - *Expected Result*: Only Note 1 (Public Honor Roll) is displayed. Note 2 (Confidential) is not returned by the API and is not rendered in the UI.
3. **Parent Portal Check**:
   - Switch role / log in as the linked parent.
   - View linked child's remarks.
   - *Expected Result*: Only Note 1 is displayed. Note 2 is completely hidden.

---

## Automated Verification Script

Run the automated Playwright / API test script:
```bash
node test_all_buttons.cjs
```
