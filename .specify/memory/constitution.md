<!--
Sync Impact Report:
- Version change: 1.2.0 → 1.3.0 (MINOR: Added Clean Minimal Directory, Table Column Layout & Dual-Action Contact Standards to Principle IV)
- Modified Principles:
  - Principle IV: Expanded "IV. Mandatory UI/UX Taste Standards & Taste Skill (NON-NEGOTIABLE)" with strict rules for Clean Minimal Layouts, Streamlined Action Toolbars, Single-Line Status Badges, Dual-Action Contact Popovers, and Floating Island Modal Architecture across all forms.
- Added Architectural Guidelines:
  - Mandatory single-line auto-wrap protection (`white-space: nowrap`) across all data table status badges and action groups.
  - Streamlined header toolbars (Export CSV + consolidated Tools dropdown + primary Add CTA).
  - Dual-action Phone triggers (WhatsApp Chat + Mobile Call redirecting to device dialer).
- Governance updates:
  - Added Clean Minimal Layout compliance to UI/UX Taste Audit Gate.
- Follow-up TODOs: None
-->

# Academy Pro OS Constitution

## Core Principles

### I. Full-Stack Vertical Slices & Single Source of Truth
Every feature, action, or UI modification MUST be implemented as a complete vertical slice across all layers:
- **Frontend UI**: React components with typed state and user feedback handling.
- **API Client**: Strongly typed methods in `apiClient.ts` communicating with `/api/v1`.
- **Backend Routes**: Express route endpoints with Zod schema validation in `server/src/routes.ts`.
- **Database Layer**: Prisma ORM models, relations, cascading rules, and migrations in `schema.prisma`.

Partial implementations, frontend-only mocks without backend endpoints, or dangling API endpoints without consumer contracts are strictly forbidden. `PLAN.md` is the authoritative source of truth for all feature identifiers (e.g., `STU`, `TCH`, `ACA`, `ATT`, `LV`, `TT`, `HW`, `EX`, `FEE`, `INQ`, `COM`, `DASH`, `SYS`). Unlisted features MUST NOT be introduced without amending the project plan.

### II. Strict Layered Architecture & Domain Separation
The backend MUST adhere to a unidirectional layered pipeline:
1. `routes` → 2. `zod validation` → 3. `rbac middleware` → 4. `service` (business rules) → 5. `repository/Prisma` → 6. `audit logger`.

Business logic MUST reside in its designated service layer rather than inside route controllers or client components:
- Capacity enforcement in Enrollments (`ACA-05`).
- Overdue fee calculations in Fees (`FEE-09`).
- Pass/fail grading logic in Tests (`EX-04`).
- Attendance lock rules in Attendance (`ATT-06`).
- Teacher batch scoping via `assertOwnBatch(teacherId, batchId)`.

Direct cross-module database querying is forbidden; cross-domain coordination MUST occur via explicit service method calls.

### III. Data Integrity, Soft Deletes & Mandatory Auditing
The system prioritizes non-destructive data handling and complete traceability:
- **Soft Deletions**: Core entities (students, batches, fee invoices) MUST use status or active flags (`status="removed"`, `is_active=false`). Hard deletes are strictly prohibited on student records, fees, invoices, payments, and attendance history.
- **Audit Logging**: All state-modifying mutations on financial records (fees/payments), attendance registers, test marks, and user privileges MUST record an entry in `audit_logs`.
- **Precision & Formatting**: Financial figures MUST use standardized 2-decimal numeric precision. All timestamps and date strings MUST follow ISO 8601 / `YYYY-MM-DD` format.

### IV. Mandatory UI/UX Taste Standards & Taste Skill (NON-NEGOTIABLE)
For ANY and ALL UI, UX, and form changes, developers and AI agents MUST ALWAYS adhere to and apply the project Taste Standards and design taste skills (`TasteSkill` / `gstack-design-review` / `AGENTS.md`). No plain, generic, bulky, or unstyled UI is permitted:
- **Curated Color Palettes**: Raw primary red/blue/green colors are strictly forbidden. Interfaces MUST use curated, harmonious HSL/HEX shades (e.g., emerald `#F0FDF4`, indigo `#EFF6FF`, slate `#334155`) paired with high-contrast text and crisp visual hierarchy.
- **Glassmorphism & Elevation**: Floating panels, menus, popovers, cards, and modals MUST incorporate frosted glassmorphism (`backdrop-filter: blur(16px)`), modern rounded corners (`12px`+), subtle translucent borders (`rgba(255, 255, 255, 0.6)` or `rgba(255, 255, 255, 0.08)`), and layered elevation shadows (`0 12px 28px -4px rgba(15,23,42,0.12)`).
- **Clean Minimal Directory & Toolbar Layouts**:
  - Directory headers MUST avoid button overload. Use a clean, dignified header with page title, subtle total badge, direct `Export CSV`, consolidated `Tools ▾` dropdown menu (housing bulk imports, promotions, and batch utilities), and a single primary `+ Add [Entity]` button in dark navy `#0F172A`.
  - Search & filter controls MUST be unified and clean (e.g., 34px-38px inset search box + subtle segmented filter tabs with single-line numeric count indicators).
- **Data Table Alignment & Single-Line Statuses**:
  - All tables MUST enforce `vertical-align: middle` across `<th>` and `<td>` with standard cell padding.
  - Table badges (e.g., `Paid`, `Partial`, `Pending`, `Defaulter`, `Active`, `94% Att.`) MUST use strict `white-space: nowrap` and single-line concise wording. Multi-line wrapping inside table badges or distorted pill shapes are strictly prohibited.
- **Dual-Action Contact Interactions**:
  - Phone/Contact buttons (`Phone` icon) MUST open a clean, floating popover menu with two explicit options:
    1. **💬 WhatsApp Chat**: Opens WhatsApp chat in a new tab.
    2. **📞 Mobile Call**: Redirects to `tel:...`, immediately launching the device/system dialer.
- **Row Action Groups**:
  - Table rows MUST feature a primary `View` button (30px height, 12px font) paired with compact 30px icon buttons and a consolidated `•••` More Actions popover menu for secondary operations (ID cards, credentials slips, edits, and archive).
- **Micro-Animations & Dynamic States**: All interactive touchpoints MUST feature smooth micro-animations (e.g., `transform: scale(1.08)` on action badges, active press states, keyframe entrance animations, and fluid hover transitions).

#### Floating Island Architecture for ALL Forms & Modals (NON-NEGOTIABLE):
Every modal dialog, creation popup, edit form, or credential slip across ANY module MUST implement the **Floating Island Modal Architecture**:
1. **Transparent Modal Canvas**: The parent modal container (`modal-card` / `modal-container`) MUST have `background: transparent; border: none; box-shadow: none; padding: 0; display: flex; flex-direction: column; gap: 12px; max-width: 540px-680px; width: 100%;`. Monolithic single-box modal containers wrapping all elements into one solid white box are **strictly prohibited**. Where there are no form entries (around and between islands), the transparent canvas reveals the blurred background backdrop (`backdrop-filter: blur(12px)`).
2. **Island 1 — Floating Dark Navy Header Card**: Solid `#0F172A` dark navy card (`border-radius: 16px`, `padding: 16px 20px`, `box-shadow: 0 10px 25px -5px rgba(15,23,42,0.4)`), featuring uniform Emerald `#10B981` icon badge accents (`background: rgba(16, 185, 129, 0.15)`, `border: 1px solid rgba(16, 185, 129, 0.35)`), high-contrast white title, muted slate `#94A3B8` subtitle, and circular close button (`border-radius: 50%`).
3. **Island 2 — Floating Notice / Callout / Tab Bar (When Applicable)**: Standalone floating island card directly over the transparent canvas (e.g. `#FEF2F2` critical security notice, `#EFF6FF` info alert, or dark `#0F172A` category tab selector).
4. **Island 3 — Floating White Content & Form Card**: Standalone floating white card (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `border-radius: 16px`, `padding: 20px 24px`, `box-shadow: 0 10px 25px -5px rgba(15,23,42,0.12)`, `max-height: 70vh`, `overflow-y: auto`) containing grouped inner sections with colored headers (`#2563EB` blue, `#7C3AED` purple, `#059669` emerald).
5. **Island 4 — Floating Action Pills Row**: Action pill buttons (`border-radius: 9999px`, `height: 42px`) floating directly over the transparent backdrop:
   - *Data Entry / Edit Forms*: Right-aligned paired floating pills (`[ Cancel ]` white pill with `#CBD5E1` border + `[ ✓ Save / Submit ]` dark navy `#0F172A` pill with `#FFFFFF` text).
   - *Credential Slips & Receipts*: 3-column floating action grid (`📋 Copy All`, `🖨️ Print Slip`, `✈️ Send via WhatsApp`) and a full-width floating `[ ✓ Done & Close ]` white pill button.

### V. Multi-Role RBAC & Zero-Trust Security
Security MUST be enforced at both network and application boundaries:
- **Role-Based Access Control**: Strict role checks (`admin`, `teacher`, `student`, `parent`) MUST be evaluated on every backend endpoint and reflected in client navigation.
- **Authentication & Token Lifecycle**: Authentication requires bcrypt password hashing, short-lived JWT access tokens (15 minutes), and rotatable refresh tokens (7 days, stored hashed in database / httpOnly cookie).
- **Input Sanitization & Injection Prevention**: All incoming HTTP payloads MUST be validated via Zod schemas before processing. Database queries MUST use parameterized Prisma ORM calls. Application secrets MUST reside exclusively in environment variables.

### VI. Automated Quality Gates & Deterministic Testing
Quality and stability MUST be verified through reproducible testing:
- **E2E & UI Audits**: Critical user paths, button interactions, and modal workflows MUST pass Playwright automated audits (e.g., `test_e2e_full_flow.cjs`, `test_all_buttons.cjs`).
- **Domain Unit Verification**: Business logic calculations (overdue fee formulas, grading, capacity constraints) MUST have automated unit tests.
- **Deterministic Seeding**: Development and testing environments MUST rely on `prisma/seed.ts` to maintain consistent baseline data across all testing runs.

## Technology Stack & Architectural Constraints

- **Client Runtime**: React 18, Vite 5, TypeScript 5, Lucide React, Tailwind / CSS design system.
- **API Server**: Node.js, Express 4, TypeScript, Zod 3, Prisma Client 5.
- **Database**: PostgreSQL 16 (Local Docker in Phase 1; Supabase PostgreSQL in Phase 2 with identical Prisma schema).
- **File Storage**: Abstracted `FileStore` interface (Local disk `/uploads` in Phase 1; Supabase Storage in Phase 2).
- **Communication Protocol**: RESTful JSON at `/api/v1` using standardized envelope `{ success: boolean, data?: any, error?: string, meta?: any }`.

## Development Workflow & Quality Gates

1. **Branch & Commit Hygiene**: Work branches must follow module-specific naming (`phase-1/<module>`). Commits MUST reference feature plan identifiers (e.g., `feat(ATT-03): bulk mark present`).
2. **UI/UX Taste & Form Architecture Audit Gate**: Any frontend change MUST pass a visual quality inspection verifying adherence to Principle IV:
   - Curated Palette, Glassmorphism, Elevation, Micro-Animations, and Explicit Action Labeling.
   - Clean Minimal Directory Layouts and strict `white-space: nowrap` on all table status badges.
   - Dual-Action Phone Popover menu (`WhatsApp Chat` + `Mobile Call` dialer redirect).
   - Strict Floating Island Architecture for all modal popups and forms (transparent canvas, `#0F172A` header island, white form card island, and floating action pill island).
   - Monolithic solid-box modals MUST be rejected.
3. **Pre-Landing Verification**:
   - TypeScript compilation checks (`tsc --noEmit` across client and server).
   - Database schema synchronization (`prisma validate` / `prisma migrate`).
   - E2E smoke tests covering modified vertical slices.
4. **Review & Approval Gate**: Any Pull Request introducing features outside `PLAN.md` or violating full-stack vertical slice completeness MUST be rejected until the plan is updated.

## Governance

- **Supremacy**: This Constitution represents the non-negotiable architectural baseline for Academy Pro OS and supersedes undocumented conventions.
- **Amendment Process**: Amendments require formal documentation of rationale, architectural impact analysis, backwards-compatibility review, and an explicit version bump.
- **Versioning Policy**: Semantic versioning (SemVer) is strictly enforced:
  - **MAJOR (X.0.0)**: Removal, deprecation, or incompatible redefinition of core principles or architectural constraints.
  - **MINOR (x.Y.0)**: Addition of new principles, governance sections, or material expansion of development standards.
  - **PATCH (x.y.Z)**: Clarifications, formatting adjustments, or non-semantic wording refinements.
- **Compliance**: All automated agents, developers, and code reviews MUST verify compliance against this document before merging changes.

**Version**: 1.3.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
