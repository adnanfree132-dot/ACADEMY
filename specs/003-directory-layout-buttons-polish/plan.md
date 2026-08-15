# Implementation Plan: Directory Page Layout, Table Alignment & Button Design Polish

**Branch**: `003-directory-layout-buttons-polish` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-directory-layout-buttons-polish/spec.md` and user-provided reference screenshot.

---

## 1. Summary

Polish and unify all directory views (**Students Directory**, **Teachers Directory**, **Classes & Batches**, and **Fee Management**) across the application:
1. **Header Action Bar**: Compact, single-line typography (`white-space: nowrap`), uniform 36px height, primary dark navy `#0F172A` button, and secondary utility pills with auto-wrap protection.
2. **Table Vertical Alignment**: Strict `vertical-align: middle` across all `<th>` and `<td>` elements, with standard 60px row height and clean 16px cell padding.
3. **Consolidated Row Action Column (`ACTIONS`)**: Primary `View` pill button (28px) paired with a compact 28px icon badge group (`Phone`, `ID Card`, `Credentials Slip`, `Edit`, `Delete`) with uniform borders and hover micro-transitions (`scale: 1.08`).
4. **Status & Attendance Badges**: Clean horizontal inline badge grouping (`[ Active ]` `[ 94% Att. ]` side-by-side) with uniform pill padding (`3px 8px`) and balanced line heights.
5. **CSS Design System**: Dedicated `.data-table`, `.header-action-bar`, and `.table-action-group` classes in `src/index.css` to eliminate ad-hoc styling and guarantee 100% theme consistency.

---

## 2. Technical Context

- **Language / Framework**: TypeScript 5, React 18, Vite 5.
- **Styling Architecture**: Pure Vanilla CSS in `src/index.css` utilizing custom design tokens (No Tailwind or heavy component libraries).
- **Icons**: Lucide React (`lucide-react`).
- **Target Components**:
  - `src/index.css`: Core design system for `.data-table`, `.header-action-bar`, and `.table-action-group`.
  - `src/pages/StudentsView.tsx`: Student Directory header actions, filter bar, table columns, and action button groups.
  - `src/pages/TeachersView.tsx`: Faculty Directory header actions, table alignment, and action buttons.
  - `src/pages/BatchesView.tsx`: Batches/Classes roster header actions and card/table layouts.
  - `src/pages/SecondaryViews.tsx`: Exam Marksheets & Fee Ledger tables.
- **Quality Gates**: `tsc --noEmit` across client and server with 0 errors; Playwright automated test suite pass.

---

## 3. Constitution Check

- **Principle I: Full-Stack Vertical Slices**: PASS — UI styling refactors bind directly to existing REST endpoints and API clients.
- **Principle II: Strict Layered Architecture**: PASS — No changes to backend layers required.
- **Principle III: Data Integrity & Soft Deletes**: PASS — Action buttons (delete/archive, view, edit) preserve soft-delete and state triggers.
- **Principle IV: Mandatory UI/UX Taste Standards (NON-NEGOTIABLE)**: PASS — Directly resolves user's feedback regarding bulky buttons, text misalignment, and theme disparity using curated palettes (`#0F172A`, `#10B981`, `#2563EB`, `#64748B`, `#DC2626`), micro-animations, and unified button dimensions.
- **Principle V: Multi-Role RBAC & Zero-Trust Security**: PASS — Preserves all role gates and credentials security warnings.
- **Principle VI: Automated Quality Gates**: PASS — Validated via `tsc --noEmit` and `node test_quickstart_scenarios.cjs`.

---

## 4. Project Structure & Touch-Points

```text
specs/003-directory-layout-buttons-polish/
├── plan.md              # Technical Implementation Plan & Gates
├── research.md          # Phase 0 Architectural Decisions & CSS Strategies
├── data-model.md        # Phase 1 Component Tokens & Layout Mappings
├── quickstart.md        # Phase 1 Runnable Validation Scenarios
├── contracts/
│   └── directory-layout-design-contract.md  # CSS & JSX Component Markup Contracts
└── checklists/
    └── requirements.md  # Specification Quality Checklist (16/16 pass)

src/
├── index.css            # [MODIFY] Add .data-table, .header-action-bar, .table-action-group, .badge-group
├── pages/
│   ├── StudentsView.tsx # [MODIFY] Header actions, table cell alignment, row action group
│   ├── TeachersView.tsx # [MODIFY] Header actions, table cell alignment, row action group
│   └── BatchesView.tsx  # [MODIFY] Header actions, roster alignment, badge consistency
```

---

## 5. Phase Breakdown & Execution Strategy

1. **Phase 1: CSS Design System Foundation (`src/index.css`)**:
   - Establish `.header-action-bar`, `.data-table`, `.data-table th`, `.data-table td`, `.table-action-group`, `.table-icon-btn`, and `.badge-group` classes with pixel-perfect alignment and typography.
2. **Phase 2: Students Directory Refactoring (`src/pages/StudentsView.tsx`)**:
   - Update the top header action row to use `.header-action-bar` with single-line typography.
   - Refactor table rows to use `.data-table` with strict `vertical-align: middle`.
   - Update `STATUS` to horizontal inline badge group (`[ Active ]` `[ 94% Att. ]`).
   - Refactor `ACTIONS` column to unified `.table-action-group` with 28px icon buttons and hover micro-transitions.
3. **Phase 3: Faculty & Class Directories Refactoring (`TeachersView.tsx`, `BatchesView.tsx`)**:
   - Apply the unified header action bar and table alignment across Teacher and Batch views.
4. **Phase 4: Verification & Quality Audit**:
   - Execute `tsc --noEmit` and run Playwright test suite `test_quickstart_scenarios.cjs`.
