# Phase 0: Technical Research & Architectural Decisions

**Feature**: `002-popup-forms-ui-redesign`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Research Decisions & Design System Foundations

### Decision 1: Floating Island Modal Architecture (Transparent Canvas & Stacked Cards)
- **Decision**: Adopt a modular floating island structure consisting of:
  1. `ModalCanvas`: Transparent container (`background: transparent`, `border: none`, `boxShadow: none`, `gap: 12px`). Around and between sections where there are no form inputs, the backdrop is transparent.
  2. `Island 1 (Header)`: Standalone solid `#0F172A` dark navy card (`borderRadius: 16px`), emerald icon badge (`#10B981` on `rgba(16, 185, 129, 0.15)`), bold white title, muted subtitle (`#94A3B8`), and circular close button.
  3. `Island 2 (Notice/Callout)`: Standalone alert banner with soft background (`#FEF2F2` danger, `#FFFBEB` warning, `#F0FDF4` success), crisp `#FCA5A5` border, and bold prefix.
  4. `Island 3 (Form Body)`: Standalone white card container (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `borderRadius: 16px`, `padding: 20px-24px`, `boxShadow: 0 10px 25px -5px rgba(15,23,42,0.12)`) with internal grouped sections.
  5. `Island 4 (Action Pills)`: Pill buttons floating directly over the transparent backdrop (`[ Cancel ]` white pill + `[ ✓ Save ]` dark navy `#0F172A` pill for forms; 3-column action grid for slips).
  6. `Island 5 (Done Action)`: Full-width standalone white pill button (`borderRadius: 9999px`) floating directly over the transparent backdrop for credential slips.
- **Rationale**: Exactly reproduces the user's reference design, giving a sleek, ultra-modern glassmorphic floating feel while maintaining form organization and usability.
- **Alternatives Considered**:
  - *Monolithic white modal wrapper with attached dark header*: Rejected because the user specifically requested the floating island layout with transparent canvas where there are no entries.
  - *Ad-hoc styling in each modal file*: Rejected because inline variances cause visual drift and break Constitution v1.1.0 standards.

---

### Decision 2: Backdrop Stacking & Modal Chaining
- **Decision**: When an admission or bulk operation flow transitions into a secondary slip/receipt (e.g. `RegisterStudentModal` → `CredentialSlipModal`), the parent form container MUST conditionally unmount or replace its contents with the target slip.
- **Rationale**: Prevents dual layered backdrop overlays (`modal-overlay` over `modal-backdrop`) which can block pointer events or cause z-index flickering.
- **Alternatives Considered**:
  - *Stacking modals with higher z-index*: Rejected because multi-backdrop stacking creates muddy blurred overlays and visual clutter.

---

### Decision 3: Viewport Scrolling & Pinned Containers
- **Decision**: Apply `max-height: 90vh`, `display: flex`, `flex-direction: column`, and `overflow-y: auto` to the inner scrollable form body, while keeping the `#0F172A` header bar and bottom action bar crisp and readable on laptops and tablets.
- **Rationale**: Ensures modal accessibility across screens ranging from 720p laptops to 4K displays.
- **Alternatives Considered**:
  - *Full page scrolling (`body` scroll)*: Causes header and actions to scroll out of view.

---

## 2. Modal Inventory Across the 3 Modules

```
Student Module (M2 STU):
├── RegisterStudentModal.tsx     (Add Student Form + Auto Fee Setup)
├── EditStudentModal.tsx         (Student Profile Modification)
├── QuickPaymentModal.tsx        (Receive Fee & Method Selection)
├── StudentIDCardModal.tsx       (Student ID Badge & QR Code Preview)
├── BulkImportModal.tsx          (CSV Roster Ingestion & Dropzone)
├── ClassPromotionModal.tsx      (Grade Advancement & Batch Transfer)
└── CredentialSlipModal.tsx      (Admission Credentials & Security Notice)

Teacher Module (M4 TCH):
├── AddTeacherModal.tsx          (Faculty Onboarding Form)
├── TeacherEvaluationModal.tsx   (Performance & Scoring Review)
└── SubstituteTeacherModal.tsx   (Assign Substitute / Co-Teacher)

Class / Batch Module (M5 ACA):
├── CreateBatchModal.tsx         (Batch Schedule & Capacity Allocation)
└── SplitBatchModal.tsx          (Section Splitting & Seat Redistribution)
```

---

## 3. Technology Stack & Dependencies

- **Frontend**: React 18, Vite 5, Lucide React (standard icon library), Custom CSS tokens in `src/index.css`.
- **Backend**: Express 4 REST API on `http://localhost:5000/api/v1` (no endpoint contract modifications required).
- **Database**: PostgreSQL with Prisma ORM.
