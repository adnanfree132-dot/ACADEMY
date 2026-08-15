# Feature Specification: Directory Page Layout, Table Alignment & Button Design Polish

**Feature Branch**: `003-directory-layout-buttons-polish`  
**Created**: 2026-08-15  
**Status**: Draft  
**Input**: "I DIDNOT LIKE THE LAYOUT SOME BUTTONS ARE BULKY TEXT IS NOT ALLIGNED BUTTONS ARE NOT RELATIVE TO THEME ALSO MUCH MORE" (with reference screenshot of Students Directory)

## Clarifications

### Session 2026-08-15
- Q: Row action buttons layout in table cells → A: Option A — Primary `View` pill button (28px height, 12px font) paired with a compact 28px icon badge group (`Phone/Dialer`, `ID Card`, `Credentials Slip`, `Edit`, `Delete`) with uniform styling, subtle borders, and hover micro-transitions (`scale: 1.08`).
- Q: Header utility action buttons layout → A: Option A — Primary dark navy `#0F172A` `+ Add New` button paired with compact single-line secondary utility pills (`Leave Requests`, `Promote Class`, `Bulk Print`, `Import CSV`, `Export CSV`) with auto-wrap protection (`white-space: nowrap`), uniform 36px height, and consistent 6px icon spacing.
- Q: Status and attendance badge styling in table cells → A: Option A — Clean horizontal badge group (`[ Active ]` `[ 94% Att. ]` side-by-side) with uniform pill padding (`3px 8px`), unified pill borders, and strict vertical-centering (`vertical-align: middle`) across all table cells.

---

## 1. Problem Statement & Design Objectives

Based on the provided screenshot and user feedback, the directory pages (Students Directory, Teachers Directory, Batches Roster, and Fee Management) suffer from visual clutter, bulky action buttons, misaligned table baselines, and a lack of unified theme cohesion:

1. **Bulky, Wrapping Header Action Buttons**:
   - The top action bar contains 6 bulky pill buttons (`Leave Requests`, `Promote Class`, `Bulk Print Cards`, `Import CSV`, `Export CSV`, `+ Add New Student`) with uneven padding, mismatched icon-to-text spacing, and awkward multi-line text wrapping (`Leave\nRequests`, `Bulk Print\nCards (6)`).
   - Buttons lack theme hierarchy: secondary actions compete visually with the primary call-to-action (`+ Add New Student`).

2. **Table Text & Vertical Alignment Defects**:
   - Column headers (`REG NO & NAME`, `PARENT & CONTACT`, `GRADE / CLASS`, `FEE STATUS`, `STATUS`, `ACTIONS`) and table cell contents have inconsistent vertical baselines (`vertical-align: middle`).
   - In the **Status** column, the `Active` badge and `94% Att.` badge are stacked vertically with uneven line heights and awkward margins.
   - In the **Reg No & Name** and **Parent & Contact** columns, primary titles and secondary subtitles (e.g., student ID, phone number) lack consistent typography scaling and contrast hierarchy.

3. **Cluttered, Misaligned Row Actions Column ("ACTIONS")**:
   - Each row crams 6 individual action buttons (`View`, `Phone/Dialer`, `Award`, `Credential Slip`, `Edit`, `Delete`) into a single cell with mismatched padding, varied border colors, and no grouping.
   - This excessive horizontal width forces the table to stretch and causes horizontal misalignment with the `ACTIONS` header.
   - Secondary and utility actions need to be consolidated into a sleek, theme-consistent action toolbar or dropdown with crisp icon badges.

4. **Theme Cohesion & Modern Styling System**:
   - Buttons, badges, search inputs, and segmented filter tabs must strictly conform to the **AcademyPro Design Language**: Dark Navy (`#0F172A`), Emerald (`#10B981`), Indigo (`#6366F1`), and Slate (`#334155 / #F8FAFC`).
   - All interactive buttons must feature unified heights (e.g. 36px for primary/secondary, 30px for table action badges), unified border radii (9999px or 8px), and responsive whitespace.

---

## 2. User Scenarios & Testing

### User Story 1 - Streamlined Directory Header & Theme-Cohesive Action Toolbar (Priority: P1) 🎯 MVP

**User Goal**: As an administrator managing the student, teacher, or class directory, I want a clean, balanced page header where action buttons are compact, single-line, hierarchically themed, and visually harmonious so that I can quickly perform common operations without visual clutter.

**Acceptance Scenarios**:
1. **Given** an administrator on the Students Directory page, **When** viewing the top header action row, **Then** all action buttons render with compact, single-line typography (`white-space: nowrap`), uniform height (36px), consistent icon spacing (6px), and subtle micro-transitions without awkward text wrapping.
2. **Given** primary vs secondary actions, **When** viewing the header, **Then** the primary action (`+ Add New Student`) stands out in bold dark navy `#0F172A` with emerald accent, while secondary utilities (`Leave Requests`, `Promote Class`, `Bulk Print`, `Import`, `Export`) render as clean, cohesive light pill buttons (`#FFFFFF`, `#E2E8F0` border, `#334155` text) or an integrated action dropdown group on narrow viewports.
3. **Given** a responsive or compressed desktop viewport (< 1200px), **When** viewing the header actions, **Then** buttons gracefully adapt without stacking or overlapping the directory title.

---

### User Story 2 - Pixel-Perfect Table Alignment, Typography & Badge Hierarchy (Priority: P1)

**User Goal**: As an administrator scanning student and staff records, I want table rows with vertical-centering, aligned text baselines, distinct typography weights, and clean badge layouts so that data is easily readable at a glance.

**Acceptance Scenarios**:
1. **Given** a directory data table, **When** records are rendered, **Then** every table cell (`<td>`) adheres to strict vertical centering (`vertical-align: middle`), consistent row height (60px), and clean horizontal padding (16px).
2. **Given** the `REG NO & NAME` column, **When** rendered, **Then** the student's full name is displayed in bold `#0F172A` (14px) and the registration number in a crisp monospace slate badge/caption (`#64748B`, 11px).
3. **Given** the `STATUS` and `FEE STATUS` columns, **When** rendered, **Then** status badges (`Active`, `94% Att.`, `Paid`, `Partially Paid`, `Pending`) render with uniform padding (`4px 10px`), pill border-radii (`9999px`), and aligned inline or pill-group layouts without awkward vertical stacking.
4. **Given** the `PARENT & CONTACT` column, **When** rendered, **Then** the parent name is bold `#334155` and the phone number is a subtle clickable dialer link with consistent line height.

---

### User Story 3 - Consolidated, Modern Table Actions & Interaction Polishing (Priority: P1)

**User Goal**: As an administrator performing row-level actions (viewing 360 profile, calling parent, printing ID, viewing login slip, editing, deleting), I want a consolidated, beautifully styled action group so that table rows remain clean and actions are effortless to trigger.

**Acceptance Scenarios**:
1. **Given** a table row in the directory, **When** inspecting the `ACTIONS` column, **Then** actions are presented as a sleek, aligned action group featuring a primary `View Profile` pill button paired with cohesive icon action buttons (or a clean popover menu for secondary options).
2. **Given** action icon buttons (Dialer, ID Card, Credentials Slip, Edit, Delete), **When** hovered, **Then** each button provides a smooth micro-scale transition (`transform: scale(1.08)`), clear hover background highlights, and helpful instant tooltips.
3. **Given** the delete/archive action, **When** rendered, **Then** it uses soft danger styling (`#FEE2E2` background, `#DC2626` icon) distinct from neutral edit/view actions.

---

### User Story 4 - Cross-Module Consistency across Teachers, Batches & Fees (Priority: P2)

**User Goal**: As an administrator switching between Students, Teachers, Classes/Batches, and Fee Management views, I want the polished header layout, table styling, and action button system to be uniformly applied across all 4 core modules.

**Acceptance Scenarios**:
1. **Given** an administrator navigating to `TeachersView.tsx` or `BatchesView.tsx`, **When** the page renders, **Then** the table headers, action buttons, search bar, and filter tabs match the exact polished styling established in `StudentsView.tsx`.
2. **Given** batch filter and status filter segmented tabs, **When** rendered, **Then** filter pill counts display with consistent padding, font sizing, and active state elevation.

---

## 3. Visual & Functional Requirements

- **FR-001**: Header action buttons across all directory pages MUST use single-line text (`white-space: nowrap`), uniform height (36px), 12px-13px font size, and consistent icon size (15px-16px) with 6px spacing.
- **FR-002**: The primary action button (`+ Add New Student` / `+ Add Faculty` / `+ Create Batch`) MUST be visually distinct in Dark Navy `#0F172A` with white text and subtle elevation shadow (`0 4px 12px rgba(15,23,42,0.15)`).
- **FR-003**: Secondary header utility buttons (`Leave Requests`, `Promote Class`, `Bulk Print`, `Import`, `Export`) MUST use unified light pill styling (`#FFFFFF` background, `#CBD5E1` border, `#334155` text) with subtle hover elevation.
- **FR-004**: All directory tables (`.data-table`) MUST enforce strict vertical alignment (`vertical-align: middle`) across all `<th>` and `<td>` elements, with 12px-14px vertical padding and 16px horizontal cell padding.
- **FR-005**: Column headers (`<th>`) MUST be uppercase, tracking `0.05em`, fontSize `11px`, color `#64748B`, with left alignment for text columns and right alignment for the `ACTIONS` column.
- **FR-006**: Status badges and attendance tags in table cells MUST be aligned horizontally or cleanly grouped without ragged multi-line distortion.
- **FR-007**: Row action buttons in the `ACTIONS` column MUST be constrained to a compact, unified button group: primary `View` button (height 28px, font 12px) followed by consistent 28px circular or rounded icon buttons (`Phone`, `ID Card`, `Credentials`, `Edit`, `Delete`) with matching dimensions and subtle borders.
- **FR-008**: Search input bar and segmented filter controls MUST have aligned baselines, consistent heights (40px for search, 36px for tabs), and polished counter badges.
- **FR-009**: The CSS design system in `src/index.css` MUST provide dedicated, reusable classes for `.data-table`, `.data-table th`, `.data-table td`, `.table-action-group`, and `.header-action-bar` to eliminate ad-hoc styling discrepancies.

---

## 4. Success Criteria

- **SC-001**: **Zero Text Wrapping in Action Buttons**: 100% of header action buttons render on a single line on standard 1080p and 1366x768 screens without awkward line breaks.
- **SC-002**: **100% Vertical Alignment in Tables**: All table cells across Students, Teachers, and Batches directories align to `vertical-align: middle` with unified 60px row heights.
- **SC-003**: **Action Column Width Optimization**: The `ACTIONS` column is streamlined, maintaining clear button hit targets (28px-32px) without forcing table horizontal overflow.
- **SC-004**: **Theme Consistency Score**: All button colors, badges, and tab pills map 100% to the core palette (`#0F172A`, `#10B981`, `#2563EB`, `#64748B`, `#DC2626`).
- **SC-005**: **Zero Automated Test Regressions**: All Playwright E2E full-flow and button audit tests pass with 0 console errors.

---

## 5. Assumptions & Dependencies

- **Data Models & APIs**: No backend or database schema modifications required; all changes are pure UI/UX styling, layout alignment, and CSS design system refinements.
- **Icon Library**: Lucide React (`lucide-react`) is used consistently across all buttons and actions.
- **Browser Compatibility**: Fully responsive and tested across Chromium desktop viewports (1280px to 1920px).
