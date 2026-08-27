# Feature Specification: Enterprise Examinations, Automated Gradebook & Dynamic Student Report Cards

**Feature Branch**: `011-enterprise-exams-gradebook-report-cards`  
**Created**: 2026-08-27  
**Status**: Ready for Planning / Implementation  
**Module**: Academic Assessment & Gradebook Engine

---

## 1. Executive Summary & Core Value Proposition

This feature upgrades the Academic Assessment subsystem in Academy Pro OS from a basic test stub into a full-featured institutional Examinations & Gradebook engine:

1. **Structured Assessment Creation**: Allows teachers and administrators to schedule assessment tests by Batch, Subject, Exam Date, Max Marks, and Pass Marks using the 4-Island Floating Architecture, `ModernSelect`, and `ModernDatePicker`.
2. **Bulk Marksheet Entry Grid**: Fast, keyboard-friendly marksheet entry grid for entering student marks and pedagogical remarks with instant 0ms letter grade generation ($A+, A, B+, B, C, F$) and pass/fail indicators.
3. **Dynamic Student Term Report Cards**: Computes real student examination averages, subject-by-subject percentage breakdowns, attendance summary integration, letter grading curves, and class position ranking into a printable institutional Report Card.
4. **Academic Performance Analytics**: Dashboard metrics displaying Class Average Score, Assessment Pass Rate, Top Performing Students, and Grade Distribution.

---

## 2. User Stories & Acceptance Criteria

### User Story 1 - Create & Schedule Assessment Tests (Priority: P1)
**As an** Academic Coordinator,  
**I want to** schedule new examinations linked to specific Classes, Batches, and Subjects with custom Max and Pass Marks,  
**So that** assessment records are properly organized by curriculum and date.

**Acceptance Scenarios**:
1. **Given** the Exams & Results Portal, **When** clicking `[ + Create Assessment Test ]`, **Then** the 4-Island Floating modal opens with `ModernSelect` for Batch and Subject, `ModernDatePicker` for Exam Date, and numeric inputs for Max & Pass Marks.
2. **Given** test creation, **When** submitted, **Then** the test immediately reflects in the exams table (0ms optimistic UI) and saves to the database.

---

### User Story 2 - Bulk Marksheet Score Entry & Real-Time Grading (Priority: P1)
**As a** Teacher / Faculty Member,  
**I want to** enter marks for all enrolled students in a batch with instant grade computation and remarks,  
**So that** grading is fast, error-free, and transparent.

**Acceptance Scenarios**:
1. **Given** a scheduled test, **When** clicking `[ Marksheet Entry ]`, **Then** a roster of all enrolled students in the target batch opens with input fields for Score and Pedagogical Remark.
2. **Given** a student score, **When** entered, **Then** the letter grade ($A+, A, B, C, F$) and Pass/Fail status badge update instantly.
3. **Given** invalid scores ($< 0$ or $>$ Max Marks), **When** entered, **Then** input validation alerts the user and prevents invalid submission.

---

### User Story 3 - Dynamic Student Academic Report Card Generation (Priority: P1)
**As a** Principal, Teacher, or Parent,  
**I want to** generate and print a comprehensive Term Academic Report Card for any student,  
**So that** academic performance, subject grades, overall percentage, and faculty remarks can be reviewed and printed.

**Acceptance Scenarios**:
1. **Given** the Student Profile Drawer (Academics Tab) or the Exams Portal, **When** clicking `[ Generate Report Card ]`, **Then** the system aggregates all actual assessment test marks for that student across enrolled subjects.
2. **Given** aggregated test marks, **When** rendering the Report Card, **Then** it calculates:
   - Subject-wise Obtained / Max Marks and percentage
   - Letter grade based on standardized curve ($A+ \ge 90\%$, $A \ge 80\%$, $B+ \ge 70\%$, $B \ge 60\%$, $C \ge 50\%$, $F < 50\%$)
   - Cumulative Grade Point / Overall Percentage
   - Term Attendance Summary (Days Present, Absent, Attendance %)
3. **Given** the Report Card preview, **When** clicking `[ Print / PDF ]`, **Then** a clean print-optimized layout renders without navigation chrome, complete with institutional header and signature lines.

---

## 3. Data Model & Grading Standards

### Standard Grading Curve:
- **A+ (Outstanding)**: $\ge 90.0\%$
- **A (Excellent)**: $80.0\% - 89.9\%$
- **B+ (Very Good)**: $70.0\% - 79.9\%$
- **B (Good)**: $60.0\% - 69.9\%$
- **C (Satisfactory)**: $50.0\% - 59.9\%$
- **F (Needs Improvement / Fail)**: $< 50.0\%$ or Score $<$ Pass Marks

---

## 4. Success Criteria
1. **100% Dynamic Marks Retrieval**: Report cards pull real scores from `TestMark` records (zero hardcoded mock arrays).
2. **0ms Optimistic Marksheet Entry**: Real-time grade letter and pass/fail evaluation on keystroke.
3. **Zero UI Jumps or Emojis**: 100% compliant with the 4-Island Floating Architecture and Lucide SVG standards.
4. **Print & PDF Perfection**: Print media styling isolating the Report Card canvas with high-resolution typography.
