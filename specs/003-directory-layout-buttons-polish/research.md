# Research & Architectural Decisions: Directory Layout & Button Polish

**Feature**: Directory Page Layout, Table Alignment & Button Design Polish  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Architectural Decisions

### Decision 1: Dedicated CSS Classes vs Inline Overrides
- **Context**: The existing tables used scattered inline styles (`style={{ paddingLeft: '16px' }}`, `style={{ padding: '4px 8px' }}`), leading to visual inconsistency and difficult maintenance.
- **Decision**: Define canonical CSS utility classes in `src/index.css` (`.data-table-container`, `.data-table`, `.data-table th`, `.data-table td`, `.header-action-bar`, `.table-action-group`, `.table-action-btn`, `.badge-group`) and use standard classes across all directory views.
- **Rationale**: Guarantees pixel-perfect consistency across Students, Teachers, Classes, and Fees views.
- **Alternatives Considered**: 
  - *Pure inline styles everywhere*: Causes drift and makes table header alignment brittle.
  - *External component library (e.g. AntD / MUI)*: Violates project rules against heavy third-party UI libraries.

### Decision 2: Header Action Bar & Wrapping Protection
- **Context**: On screens < 1400px, 6 pill buttons with `display: flex; gap: 10px;` cause two-line text wrapping (`Leave\nRequests`, `Bulk Print\nCards (6)`), making buttons look bulky and awkward.
- **Decision**:
  - Add `white-space: nowrap`, `height: 36px`, `font-size: 12.5px`, and `padding: 0 14px` with `display: inline-flex; align-items: center; gap: 6px;` to all secondary utility pills.
  - Make the primary CTA (`+ Add New Student`) stand out in dark navy `#0F172A` with bold white text.
  - Use `overflow-x: auto; flex-wrap: nowrap;` for the action container with smooth scroll support on narrow viewports.
- **Rationale**: Prevents multi-line text wrapping while preserving immediate access to all tools.

### Decision 3: Row Actions Column Organization
- **Context**: The `ACTIONS` column crammed 6 independent buttons (`View`, `Phone`, `ID`, `Slip`, `Edit`, `Delete`) with different paddings and colors into one table cell.
- **Decision**:
  - Keep `View` as a primary 28px pill button (`.btn-secondary.btn-sm`).
  - Standardize all secondary action buttons to uniform 28px × 28px square/circle action badges (`.table-icon-btn`) with 14px icons, subtle translucent borders (`#E2E8F0`), and smooth micro-scale hover transitions (`transform: scale(1.08)`).
  - Use soft color accents on hover (Blue for Phone, Sky for ID Card, Emerald for Slip, Slate for Edit, Rose for Delete).
- **Rationale**: Provides instant single-click access for high-frequency admin actions while keeping the table cell compact, beautifully aligned, and uncluttered.

### Decision 4: Table Cell Baseline & Badge Layout
- **Context**: Stacked badges (`Active` + `94% Att.`) created uneven row heights.
- **Decision**:
  - Render status badges in a horizontal `.badge-group` (`display: inline-flex; align-items: center; gap: 6px; flex-wrap: nowrap;`).
  - Set `.data-table td { vertical-align: middle; height: 60px; padding: 10px 16px; }`.
- **Rationale**: Enforces a strict horizontal baseline across the entire table row.
