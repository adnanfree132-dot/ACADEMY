# Implementation Plan: Modal & Popup Forms UI/UX Redesign

**Branch**: `002-popup-forms-ui-redesign` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-popup-forms-ui-redesign/spec.md` with reference design screenshot.

---

## 1. Summary

Unify and elevate all modal dialogs, creation popups, and credential slips across the **Student (`M2 STU`)**, **Teacher (`M4 TCH`)**, and **Class/Batch (`M5 ACA`)** modules to match the exact **Floating Island Modal Architecture** shown in the user's reference design. 

This architecture features a **transparent modal canvas** (`background: transparent; border: none; box-shadow: none;`) rendering a vertical stack of floating islands/cards over the blurred backdrop:
- **Island 1**: Floating `#0F172A` dark navy header card with an Emerald `#10B981` icon badge and circular close button.
- **Island 2**: Floating critical notice / warning card (`#FEF2F2` background, `#FCA5A5` border).
- **Island 3**: Floating white content/form card (`#FFFFFF`, `borderRadius: 16px`, `boxShadow: 0 10px 25px -5px rgba(15,23,42,0.12)`) containing grouped inner sections with colored headers (`#2563EB` blue, `#7C3AED` purple, `#059669` emerald).
- **Island 4**: Floating action pill row (`[ Cancel ]` white pill + `[ ✓ Save ]` dark navy `#0F172A` pill for forms; 3-column action grid for slips).
- **Island 5**: Floating full-width `✓ Done & Close` white pill button for slips.

Where there are no form entries (around and between the islands), the canvas is completely transparent, revealing the blurred background.

---

## 2. Technical Context

- **Language / Framework**: TypeScript 5, React 18, Vite 5.
- **Styling Architecture**: Custom CSS tokens in `src/index.css` paired with structured Floating Island JSX style contracts. No Tailwind or third-party UI component libraries.
- **Icons**: Lucide React (`lucide-react`).
- **Target Components**:
  - *Student Module*: `RegisterStudentModal.tsx`, `EditStudentModal.tsx`, `QuickPaymentModal.tsx`, `StudentIDCardModal.tsx`, `BulkImportModal.tsx`, `ClassPromotionModal.tsx`, `CredentialSlipModal.tsx`.
  - *Teacher Module*: `AddTeacherModal.tsx`, `TeacherEvaluationModal.tsx`, `SubstituteTeacherModal.tsx`.
  - *Class/Batch Module*: `CreateBatchModal.tsx`, `SplitClassModal.tsx`, `SyllabusTrackerModal.tsx`.
- **Backend**: Express 4 REST API on `http://localhost:5000/api/v1` (100% backend contract preservation).
- **Quality Gates**: `tsc --noEmit` across client and server with 0 errors; Playwright automated test suite pass.

---

## 3. Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Full-Stack Vertical Slices**: PASS — UI modifications bind to existing typed API clients and Express backend routes.
- **Principle II: Decoupled Architecture & Shared Contracts**: PASS — Contract defined in `contracts/popup-forms-design-contract.md`.
- **Principle III: Standardized API Envelope & Resilient Error Handling**: PASS — Reuses standard envelope helpers.
- **Principle IV: State Integrity & Soft Delete Cascades**: PASS — Modal dismissals and transitions preserve local and remote state integrity.
- **Principle V: Strict Security & Role-Based Access**: PASS — Retains credential security warnings and audit logs.
- **Principle VI: UI/UX Design Aesthetics & Taste Standards**: PASS — Directly implements the user's reference design with dark `#0F172A` headers, emerald badges, grouped cards, and pill buttons.

---

## 4. Project Structure & Touch-Points

```text
specs/002-popup-forms-ui-redesign/
├── plan.md              # Technical Implementation Plan & Gates
├── research.md          # Phase 0 Architectural Decisions
├── data-model.md        # Phase 1 Component Models & Token Map
├── quickstart.md        # Phase 1 Runnable Validation Scenarios
├── contracts/
│   └── popup-forms-design-contract.md  # Visual & Component Markup Contracts
└── checklists/
    └── requirements.md  # Specification Quality Checklist (16/16 pass)

src/components/
├── RegisterStudentModal.tsx     # [MODIFY] Slate header + Grouped cards + Pill buttons
├── EditStudentModal.tsx         # [MODIFY] Slate header + Grouped cards + Pill buttons
├── QuickPaymentModal.tsx        # [MODIFY] Slate header + Amount card + Method selector
├── StudentIDCardModal.tsx       # [MODIFY] Slate header + High-res card preview
├── BulkImportModal.tsx          # [MODIFY] Slate header + Dropzone card + Sample CSV pill
├── ClassPromotionModal.tsx      # [MODIFY] Slate header + Batch selector card
├── CredentialSlipModal.tsx      # [VERIFY] Exact reference match
├── AddTeacherModal.tsx          # [MODIFY] Slate header + Emerald badge + Grouped cards
├── TeacherEvaluationModal.tsx   # [MODIFY] Slate header + Category scoring cards
├── SubstituteTeacherModal.tsx   # [MODIFY] Slate header + Instructor picker card
├── CreateBatchModal.tsx         # [MODIFY] Slate header + Schedule & Capacity cards
└── SplitBatchModal.tsx          # [MODIFY] Slate header + Section preview card
```

---

## 5. Phase Breakdown & Execution Strategy

1. **Phase 1: Setup & CSS Utilities Verification**:
   - Verify modal overlay, backdrop blur, and pill button utility classes in `src/index.css`.
2. **Phase 2: Student Module Modal Overhaul**:
   - Update `RegisterStudentModal.tsx`, `EditStudentModal.tsx`, `QuickPaymentModal.tsx`, `StudentIDCardModal.tsx`, `BulkImportModal.tsx`, and `ClassPromotionModal.tsx`.
3. **Phase 3: Teacher Module Modal Overhaul**:
   - Update `AddTeacherModal.tsx`, `TeacherEvaluationModal.tsx`, and `SubstituteTeacherModal.tsx`.
4. **Phase 4: Class & Batch Module Modal Overhaul**:
   - Update `CreateBatchModal.tsx` and `SplitBatchModal.tsx`.
5. **Phase 5: Polish & E2E Validation**:
   - Execute `tsc --noEmit` and run `node test_quickstart_scenarios.cjs` across all 5 validation scenarios.
