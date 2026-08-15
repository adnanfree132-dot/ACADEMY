# Feature Specification: Modal & Popup Forms UI/UX Redesign for Student, Teacher, and Class Modules

**Feature Branch**: `002-popup-forms-ui-redesign`  
**Created**: 2026-08-15  
**Status**: Draft  
**Input**: "ON THREE MODULES POPUP FORMS UI IS NOT UPTO THE MARK I WANT THIS TYPE OF UI" (with reference design screenshot)

## Clarifications

### Session 2026-08-15
- Q: Header Icon Badge Accents Across Modules → A: Option B — Uniform single accent badge: Emerald (`#10B981`) on all modal headers across all three modules for strict visual uniformity.
- Q: Action Button Layout for Multi-Input Creation & Edit Forms → A: Option A — Dual layout convention: Right-aligned paired pill buttons (`[ Cancel ]` secondary white pill + `[ ✓ Save / Complete Registration ]` primary navy `#0F172A` pill) for data-entry forms; 3-column action grid + full-width `[ ✓ Done & Close ]` for credential slips and receipt modals.

---

## 1. Design Archetype & Visual Standard: Floating Island Modal Architecture

Based on the provided reference screenshot and Constitution v1.1.0 Taste Standards, all popup forms and modal dialogs across the **Student (`M2 STU`)**, **Teacher (`M4 TCH`)**, and **Class/Batch (`M5 ACA`)** modules MUST adopt the exact **Floating Island Modal Architecture**:

### Key Architectural Characteristics:
1. **Transparent Modal Container**: The parent modal container (`modal-container` / `modal-card`) MUST have `background: transparent; border: none; box-shadow: none; display: flex; flex-direction: column; gap: 12px; max-width: 540px; width: 100%;`. Where there are no entries or between sections, the backdrop is completely transparent, revealing the blurred background.
2. **Island 1 - Floating Dark Header Card**: Solid `#0F172A` dark navy floating card (`borderRadius: 16px`, `padding: 16px 20px`, `boxShadow: 0 10px 25px -5px rgba(15,23,42,0.4)`), featuring uniform Emerald (`#10B981`) badge accents (`background: rgba(16, 185, 129, 0.15)`, `border: 1px solid rgba(16, 185, 129, 0.35)`), high-contrast white title, muted slate subtitle, and circular close button.
3. **Island 2 - Floating Notice / Warning Callout (When Applicable)**: Standalone floating card (`background: #FEF2F2`, `border: 1px solid #FCA5A5`, `borderRadius: 14px`, `padding: 14px 18px`, `boxShadow: 0 4px 12px rgba(239, 68, 68, 0.1)`) with red critical alert text.
4. **Island 3 - Floating White Content & Form Card**: Standalone floating white card (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 16px`, `padding: 20px 24px`, `boxShadow: 0 10px 25px -5px rgba(15,23,42,0.1)`) containing header KPIs/Admission numbers and grouped form sections with uppercase colored section headers (`#2563EB` blue, `#7C3AED` purple, `#059669` emerald).
5. **Island 4 - Floating Action Pills Row**: Action pill buttons (`borderRadius: 9999px`, `height: 42px`) floating directly over the transparent backdrop:
   - For Slips: 3-column action grid (`Copy All`, `Print Slip`, `Send via WhatsApp`).
   - For Forms: Right-aligned paired floating pills (`[ Cancel ]` white pill + `[ ✓ Save / Submit ]` dark navy `#0F172A` pill).
6. **Island 5 - Floating Full-Width Done Pill (For Slips/Receipts)**: Full-width standalone white pill button (`borderRadius: 9999px`, `background: #FFFFFF`, `color: #0F172A`, `fontWeight: 800`, `boxShadow: 0 4px 12px rgba(0,0,0,0.1)`) floating directly over the transparent backdrop.

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [ISLAND 1: FLOATING DARK HEADER CARD]
│ ┌─────────────────────────────────────────────────────────────────────┐ │
  │ 🛡️  Admission Credentials Slip / Modal Title                      ✕ │
│ │     Auto-Generated System Access Accounts / Modal Subtitle          │ │
  │     [Solid Dark Slate: #0F172A | Emerald Badge | White Text]        │
│ └─────────────────────────────────────────────────────────────────────┘ │
  
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [Transparent Spacing Gap] ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
  
│ [ISLAND 2: FLOATING WARNING NOTICE CARD]                                │
  ┌─────────────────────────────────────────────────────────────────────┐
│ │ ⚠️  CRITICAL NOTICE: Plaintext passwords displayed ONCE only.       │ │
  │     [Soft pink #FEF2F2 | Border #FCA5A5 | Red text]                 │
│ └─────────────────────────────────────────────────────────────────────┘ │
  
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [Transparent Spacing Gap] ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
  
│ [ISLAND 3: FLOATING WHITE FORM & CONTENT CARD]                          │
  ┌─────────────────────────────────────────────────────────────────────┐
│ │ ADMISSION NO / HEADER KPI                             ACAD-2026-012 │ │
  │ ─────────────────────────────────────────────────────────────────── │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
  │ │ SECTION 1: STUDENT ACCOUNT / PROFILE DETAILS                    │ │
│ │ │ Username: std_acad2026012       Temp Password: [ Pass#7877 ]   │ │ │
  │ └─────────────────────────────────────────────────────────────────┘ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
  │ │ SECTION 2: PARENT / GUARDIAN CONTACT DETAILS                    │ │
│ │ │ Username: prt_993546            Temp Password: [ Par#4776 ]    │ │ │
  │ └─────────────────────────────────────────────────────────────────┘ │
│ └─────────────────────────────────────────────────────────────────────┘ │
  
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [Transparent Spacing Gap] ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
  
│ [ISLAND 4: FLOATING ACTION PILLS ROW (DIRECTLY ON BACKDROP)]            │
  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
│ │  📋  Copy All    │  │  🖨️  Print Slip   │  │  ✈️  Send WhatsApp    │ │
  └──────────────────┘  └──────────────────┘  └───────────────────────┘
│                                                                         │
  [ISLAND 5: FLOATING FULL-WIDTH DONE PILL (DIRECTLY ON BACKDROP)]
│ ┌─────────────────────────────────────────────────────────────────────┐ │
  │                    ✓ Done & Close / Complete Action                 │
│ └─────────────────────────────────────────────────────────────────────┘ │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

---

## 2. User Scenarios & Testing

### User Story 1 - Unified Admission & Student Management Popups (Priority: P1) 🎯 MVP

**User Goal**: As an administrator registering a new student, editing student details, or viewing credential slips, I want high-contrast, visually structured modal forms with dark navy header banners, grouped form cards, and explicit action buttons so that form completion is intuitive, delightful, and error-free.

**Why this priority**: Student registration and management are the primary high-frequency workflows of the academy. Elevating these forms directly delivers the visual standard shown in the reference design.

**Independent Test**: Open the Student Registration modal, verify the dark slate header with emerald badge, fill in student details inside grouped cards, submit the form, and verify the newly styled Credential Slip modal renders seamlessly with copy/print/WhatsApp action pills.

**Acceptance Scenarios**:
1. **Given** an administrator in the Students directory, **When** they click "Add New Student", **Then** a modal opens featuring a `#0F172A` header with an icon badge, subtitle, and grouped inner cards for *Student Profile*, *Parent/Guardian Details*, and *Academic & Fee Configuration*.
2. **Given** a student registration form, **When** the administrator selects a photo or enters custom fields, **Then** inputs display icon prefix badges, clean borders (`#CBD5E1`), and soft focus rings without layout distortion.
3. **Given** a successful student registration, **When** the submission completes, **Then** the Admission Credentials Slip modal displays matching the reference image: critical security warning callout, monospace usernames, emerald password pills (`Pass#XXXX`), and rounded action buttons (`Copy All`, `Print Slip`, `Send via WhatsApp`, and full-width `✓ Done & Close`).
4. **Given** an administrator clicking "Quick Pay" or "Edit Student", **Then** the respective modals (`QuickPaymentModal.tsx`, `EditStudentModal.tsx`) render with the matching slate header, grouped cards, and pill buttons.

---

### User Story 2 - Elevated Faculty Onboarding & Management Popups (Priority: P1)

**User Goal**: As an administrator onboarding or evaluating teachers, I want the faculty creation, evaluation, and substitution popups to share the exact dark header and grouped card styling as the student modals.

**Why this priority**: Maintains cross-module visual harmony and high design taste across all administrative management forms.

**Independent Test**: Open "Add Faculty Member", verify the `#0F172A` header with indigo/blue badge, enter profile/qualification details into grouped cards, and submit to verify the teacher record is saved.

**Acceptance Scenarios**:
1. **Given** an administrator in the Teachers view, **When** they click "Add Faculty Member", **Then** a modal opens with a dark header banner (`#0F172A`), subtitle "Faculty member profile and academic qualifications", and inner grouped cards for *Personal Information*, *Contact Details*, and *Academic Specialization*.
2. **Given** an administrator clicking "Review / Evaluate", **Then** `TeacherEvaluationModal.tsx` opens with a dark header, star-rating slider cards, and clean submit pills.
3. **Given** an administrator clicking "Assign Substitute", **Then** `SubstituteTeacherModal.tsx` opens with a dark header, calendar date picker, reason textarea, and explicit action buttons.

---

### User Story 3 - Class & Batch Creation with Capacity Warning Callouts (Priority: P1)

**User Goal**: As an academic coordinator creating batches or defining subject assignments, I want the batch creation and roster popups to feature capacity meters, timing grids, and dark header cards matching the reference design.

**Why this priority**: Prevents scheduling errors, surfaces batch capacity limits clearly, and completes the three-module visual redesign.

**Independent Test**: Open "Create Batch", verify the dark header with purple badge, enter batch details, set capacity limits, and verify the form validates and creates the batch section.

**Acceptance Scenarios**:
1. **Given** an administrator in the Batches view, **When** they click "+ Create Batch", **Then** a modal opens with a `#0F172A` header banner, purple badge, subtitle "Configure batch schedule, teacher assignment, and seat capacity", and grouped cards for *Class Level & Name*, *Timing & Days*, and *Capacity & Room Allocation*.
2. **Given** a batch that has reached maximum capacity, **When** an administrator attempts to enroll an extra student, **Then** a high-visibility warning callout banner (`#FEF2F2` background, red border) displays with the option to authorize an administrative override.
3. **Given** an administrator clicking "Bulk Class Promotion" or "Split Batch", **Then** the respective modals (`ClassPromotionModal.tsx`, `SplitBatchModal.tsx`) render with the dark header and rounded pill buttons.

---

### User Story 4 - Bulk Operations & CSV Ingestion Popups (Priority: P2)

**User Goal**: As an administrator uploading CSV student rosters or generating bulk ID cards, I want file dropzones and preview tables to live inside the elevated dark-header modal containers.

**Why this priority**: Ensures heavy batch-processing tools look as polished and premium as single-record dialogs.

**Independent Test**: Open "Import CSV", verify the dark header with upload icon badge, drag-and-drop a CSV file, inspect the parsed table preview, and complete the import.

**Acceptance Scenarios**:
1. **Given** an administrator clicking "Import CSV", **Then** `BulkImportModal.tsx` opens with a `#0F172A` header, drag-and-drop dropzone with dashed border and cloud icon, sample CSV download pill, and column mapping preview card.
2. **Given** an administrator clicking "Bulk Print Cards", **Then** `BulkIDCardModal.tsx` opens with a dark header, print preview roster, and print trigger buttons.

---

## 3. Edge Cases & Visual Constraints

1. **Mobile / Small Viewport Scaling**: When viewport height is constrained (< 700px), modal containers MUST enable internal vertical scrolling (`overflow-y: auto`, `max-height: 90vh`) while keeping the dark header bar and bottom action bar pinned or easily accessible.
2. **Dynamic Form Custom Fields**: When dynamic custom fields are configured in Academy Settings, they MUST render inside a dedicated grouped card (`CUSTOM FIELDS / ADDITIONAL ATTRIBUTES`) rather than breaking the core layout.
3. **Long Input Text & Labels**: Usernames, email addresses, and phone numbers must not overflow their container cards; monospace code snippets and passwords must use `word-break: break-all` or badge pills.
4. **Modal Stacking & Backdrop Dismissal**: When one modal opens another (e.g. `RegisterStudentModal` completing and opening `CredentialSlipModal`), the parent modal MUST cleanly transition without rendering dual dark overlays or blocking click events.

---

## 4. Requirements

### Functional & Visual Requirements

- **FR-001**: All popup modals across Student, Teacher, and Batch modules MUST feature the **Floating Island Architecture**: transparent modal container (`background: transparent`, `border: none`, `boxShadow: none`, `gap: 12px-14px`), with a standalone floating `#0F172A` dark navy header card, emerald (`#10B981`) icon badge, bold white title, soft slate subtitle, and circular close button.
- **FR-002**: Critical notices, security warnings, and capacity alerts MUST render as standalone floating callout islands with pastel backgrounds (`#FEF2F2`, `#FFFBEB`, `#F0FDF4`), crisp borders, and icon prefixes.
- **FR-003**: Modal form fields MUST be housed inside a dedicated floating white card (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 16px`, `box-shadow: 0 10px 25px -5px rgba(15,23,42,0.1)`) structured into grouped inner sections with uppercase colored section headers (`#2563EB` blue, `#7C3AED` purple, `#059669` emerald). Where there are no entries or outside the card, the backdrop remains transparent.
- **FR-004**: Credentials, admission numbers, passwords, and status indicators MUST use monospace typography and soft colored badge pills (`Pass#7877` on `#DCFCE7`).
- **FR-005**: Action buttons MUST float directly over the transparent backdrop: data-entry creation/edit forms MUST feature right-aligned paired floating pill buttons (`[ Cancel ]` white pill + `[ ✓ Save / Submit ]` dark navy `#0F172A` pill), while single-step credential slips and receipts MUST feature the 3-column floating action grid (`📋 Copy All`, `🖨️ Print Slip`, `✈️ Send via WhatsApp`) and a full-width floating `[ ✓ Done & Close ]` pill button.
- **FR-006**: Student module popups (`RegisterStudentModal.tsx`, `EditStudentModal.tsx`, `QuickPaymentModal.tsx`, `StudentIDCardModal.tsx`, `BulkImportModal.tsx`, `ClassPromotionModal.tsx`, `CredentialSlipModal.tsx`) MUST all adopt this visual standard.
- **FR-007**: Teacher module popups (`AddTeacherModal.tsx`, `TeacherEvaluationModal.tsx`, `SubstituteTeacherModal.tsx`) MUST all adopt this visual standard.
- **FR-008**: Class/Batch module popups (`CreateBatchModal.tsx`, `SplitBatchModal.tsx`, `BatchFeeStructureModal.tsx`) MUST all adopt this visual standard.
- **FR-009**: Transitions between modals (e.g. registration form to credential slip) MUST be smooth, with zero residual backdrop stacking or event intercept bugs.

---

## 5. Success Criteria

### Measurable Outcomes

- **SC-001**: **100% Visual Consistency**: All 12 modal forms across Student, Teacher, and Class modules conform to the dark header + grouped card + pill button design archetype.
- **SC-002**: **Zero Backdrop Stacking Defects**: 100% of chained modal workflows (e.g., Admission Form → Credential Slip → Directory) transition cleanly with zero pointer-event interception bugs.
- **SC-003**: **Task Completion Time**: Administrators can complete student registration, teacher onboarding, or batch creation in under 45 seconds without visual friction.
- **SC-004**: **Taste Standard Audit**: 100% pass rate on Constitution v1.1.0 Design Aesthetics (no plain red/blue boxes, curated HSL/HEX palettes, glassmorphic elevation, explicit action labeling).
- **SC-005**: **Zero Automated Test Regressions**: All Playwright E2E full-flow and button audit tests pass with 0 console errors.

---

## 6. Assumptions & Dependencies

- **Existing Backend Routes**: All existing Express REST endpoints (`/api/v1/students`, `/api/v1/teachers`, `/api/v1/batches`, etc.) remain fully functional and are reused without breaking API contracts.
- **Design Tokens**: Standard tokens defined in `src/index.css` (`--bg-app`, `--bg-surface`, `--color-primary-500`, etc.) are utilized along with the dedicated `#0F172A` dark header style.
- **Component Scope**: Scoped exclusively to the modal dialogs, popup forms, and credential slips belonging to the Student, Teacher, and Class/Batch modules.
