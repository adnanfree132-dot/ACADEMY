# Agent Rules

## Full-Stack Vertical Slices
When instructed to build or add a new feature (e.g., a button, a form, an action) in this full-stack application, you must NEVER partially code it. 

You must implement and verify the entire vertical slice before considering the task complete:
1. **Frontend UI**: Build the React components and local state logic.
2. **API Client**: Ensure the frontend API client (`apiClient.ts`) has the correct method to call the backend.
3. **Backend Routes**: Verify that the Express server (`server/src/routes.ts`) actually has the corresponding REST endpoint (e.g., `POST`, `PUT`, `DELETE`). If it does not exist, you MUST build it.
4. **Database Operations**: Ensure the backend route correctly interacts with the Prisma ORM and handles edge cases (e.g., Soft Deletes, Cascading updates).

Do not stop at the frontend. Always check the backend before finishing your turn.

## UI/UX Design Aesthetics & Taste Standards
Whenever building or modifying any UI/UX element (buttons, popover menus, cards, modals, tables):
1. **Curated Color Palettes**: Never use plain primary red/blue/green boxes or random rainbow button clusters. Use soft, harmonious HSL/HEX shades (e.g., `#F0FDF4` emerald, `#EFF6FF` indigo) paired with crisp slate text (`#334155`).
2. **Glassmorphism & Elevation**: Floating menus and popovers must feature glassmorphism (`backdrop-filter: blur(16px)`), rounded corners (`12px`+), and layered box-shadows (`0 12px 28px -4px rgba(15,23,42,0.12)`).
3. **Icon Badges & Micro-Animations**: Use soft circular icon badges for actions and add subtle micro-transitions (`transform: scale(1.08)`, smooth hover state changes, keyframe entry animations).
4. **Explicit Action Labeling**: Never rely solely on ambiguous icon-only buttons. Use clear, human-readable labels with Lucide icons (e.g. `<CreditCard size={14} /> Receive Fee` instead of a bare "$").
5. **Floating Island Architecture for All Forms & Modals (ABSOLUTE MANDATORY STANDARD)**:
   - Modals and popups MUST NEVER be a single monolithic white box or standard bootstrap-style dialog.
   - Monolithic `.modal-card` / `.modal-container` with a single white background enclosing the entire dialog is **STRICTLY PROHIBITED**.
   - **Overlay**: Always use `.floating-island-overlay` with `backdrop-filter: blur(12px)` and `background: rgba(15, 23, 42, 0.65)`.
   - **Container**: Use `.floating-island-container` (`background: transparent; border: none; box-shadow: none; padding: 0; display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 500px - 680px;`).
   - **The 4 Independent Floating Islands**:
     1. **Island 1 (Header Card)**: Deep `#0F172A` dark navy card (`border-radius: 16px; padding: 16px 20px; color: #FFFFFF; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.3); border: 1px solid rgba(255,255,255,0.08);`). Must feature an Emerald `#10B981` (or `#EF4444` for danger) icon badge, bold title, subtitle description, and a circular glass close button (`border-radius: 50%; background: rgba(255,255,255,0.08); width: 32px; height: 32px;`).
     2. **Island 2 (Optional Selector / Tab / Notice Island)**: Floating choice card or tab selector directly on the transparent canvas (e.g. Mode Switcher, Soft Archive vs Hard Delete).
     3. **Island 3 (Scrollable Content / Form Card)**: White `#FFFFFF` card (`border-radius: 16px; border: 1px solid #E2E8F0; padding: 20px 22px; box-shadow: 0 10px 25px -5px rgba(15,23,42,0.12); max-height: 74vh; overflow-y: auto;`). Form sections must be grouped in light cards (`#F8FAFC; border-radius: 14px; border: 1px solid #E2E8F0; padding: 16px;`).
     4. **Island 4 (Floating Action Pill Row)**: Dual pill buttons (`border-radius: 9999px; gap: 10px; display: flex;`) floating directly over the transparent blurred background:
        - `[ Cancel ]`: White glass pill with slate text (`#334155`, `border: 1px solid #CBD5E1; background: #FFFFFF;`).
        - `[ ✓ Action / Submit ]`: Deep `#0F172A` dark navy pill with white text & shadow (or `#DC2626` red for destructive actions).
   - **Form Controls Inside Modals**: Use ONLY `ModernSelect` for dropdowns, `ModernDatePicker` for dates, and standard slate Lucide SVG icons. No raw default browser selects or datepickers.
6. **Clean Minimal Directory & Table Standards (MANDATORY)**:
   - Headers: Avoid button explosions. Use a clean header with page title, count badge, `[ ⤓ Export CSV ]`, consolidated `[ ⚙ Tools ▾ ]` dropdown menu for batch operations, and a primary navy `[ + Add Entity ]` button (`#0F172A`).
   - Tables: Strict `vertical-align: middle`, standardized cell heights, and strict `white-space: nowrap` across status badges and row action groups. Multi-line badge text wrapping or distorted badge shapes are strictly forbidden.
7. **Dual-Option Contact Popover (MANDATORY)**:
   - Phone/Dialer triggers MUST open an anchored popup menu offering:
     1. **WhatsApp Chat**: `<MessageSquare size={15} color="#16A34A" /> WhatsApp Chat` (opens WhatsApp in a new tab).
     2. **Mobile Call**: `<Phone size={15} color="#2563EB" /> Mobile Call` (redirects to `tel:...`).
8. **Modernized Theme-Matching Form Controls & Calendars (MANDATORY)**:
   - Raw default browser `<select>` and raw unstyled `<input type="date">` are strictly FORBIDDEN across all modal forms and pages.
   - Always use theme-matching custom components:
     1. **`ModernSelect`** for all dropdowns: Features sleek border radius (`10px`), subtle focus rings (`0 0 0 3px rgba(37,99,235,0.12)`), smooth 180° chevron rotation, and floating glassmorphic popover menus (`backdrop-filter: blur(16px)`).
     2. **`ModernDatePicker`** for all dates/calendars: Features a human-readable formatted trigger badge (`📅 Wed, Aug 19, 2026`), floating glassmorphic calendar popover, `#0F172A` navy month/year navigator, quick preset chips (`[ Today ]`, `[ Tomorrow ]`, `[ In 7 Days ]`), and color-coded day grids with `#10B981` emerald selection indicators.
9. **Strict Prohibition of Emojis Across Entire UI (ABSOLUTE RULE)**:
   - Raw/system Unicode emojis (e.g. ⚡, 🎲, 📱, 🎓, 🏥, 💰, 📦, ⚠️, 🤝, 👨, 👩, 💵, 💳, 📢, 🗓️, 🟢, 🟡, 🔴, 💡, 🔒, 🌐, 🏷️, ⏸️, ▶️, 📚, 📖, ⭐, 📋, 👥, 📍, ⏰, ✍️, 🎯, 🎉, ⚙️, 🎨, ℹ️, 🖨️, etc.) are **STRICTLY FORBIDDEN** anywhere in UI components, including:
     - Dropdown menus and select options
     - Form input labels, placeholders, and helper text
     - Quick preset password / action chips
     - Notification banners, callouts, and empty state cards
     - Modal headers, tab bars, drawer tabs, and accordion headers
     - Action buttons, table headers, table cells, and status badges
   - All icons in UI components MUST be clean Lucide SVG components.
10. **Unified Theme-Matching SVG Icon & Button Styling (ABSOLUTE RULE)**:
    - Standard action icons, table row actions, quick action buttons, card headers, preset buttons, and toolbar options MUST use uniform theme slate Lucide SVG icons (`#475569` or `#64748B`), smoothly transitioning to dark navy (`#0F172A`) on hover (matching the `Edit` button pattern).
    - Random/rainbow button background colors (`#FEF3C7`, `#EFF6FF`, `#ECFDF5`, `#FDE68A`, etc.) on card action buttons or table icon buttons are **STRICTLY PROHIBITED**. Use standardized `.table-icon-btn` styles.
    - Destructive / critical actions (e.g. `Archive`, `Delete`, `Remove`) MUST strictly use `.table-icon-btn.danger` / `#DC2626` red.
    - Only official external brand triggers (e.g. WhatsApp `#16A34A`) or status pill badges carry explicit semantic colors.
11. **Zero-Delay Instant Optimistic UI Reflection (ABSOLUTE MANDATORY STANDARD)**:
    - Whenever any entity is created, edited, deleted, status-changed, or fee recorded, the UI (all tables, drawers, popups, and dashboard metrics) MUST reflect the change **instantly (0ms)** in local React state.
    - Under NO circumstances may the UI wait for or block on network/backend responses before updating local visual state.
    - Modals and confirmation dialogs MUST close immediately upon action confirmation.
    - Backend API calls (`api.deleteStudent`, `api.updateStudent`, `api.createBatch`, etc.) MUST execute silently in the background.
    - Dashboard cards and aggregate stats MUST compute directly and reactively from live state arrays (`students`, `teachers`, `batches`, `transactions`) so that deleting or adding an entity updates dashboard counts, pending dues, and defaulter badges with zero latency.
12. **Graceful Dependency Handling & Zero Technical Error Leaks (MANDATORY STANDARD)**:
    - Raw database stack traces, Prisma constraint codes (e.g. `P2003`, `Foreign key constraint violated`), or system `alert()` boxes are **strictly forbidden** in UI views.
    - **Backend Deletes**: Endpoints deleting entities with dependent children (e.g. Subjects with homework, Batches with schedules, Exams with test marks) MUST either cleanly cascade-delete the child relationships OR provide safe soft-archiving.
    - **API Error Sanitation**: All API errors must pass through `sanitizeErrorMessage` in `envelope.ts` to return clear, polite human explanations (e.g. *"Cannot delete this item because active records depend on it. Please reassign linked items first."*).
13. **Zero Layout Shift & Non-Jumping Button Transitions (ABSOLUTE MANDATORY STANDARD)**:
    - Interactive elements (buttons, selector cards, segment tabs, toggles, filter pills) MUST NEVER produce layout jumps, shifts, or twitching on hover, focus, or active selection.
    - **Fixed Border Width**: NEVER change border width between states (e.g. going from `1px solid` to `2px solid`). Always use consistent border thickness (e.g. `1.5px solid #E2E8F0` transitioning to `1.5px solid #2563EB` or `#10B981`) paired with `box-shadow: 0 0 0 1px <color>` if extra emphasis is needed.
    - **No Disruptive Scale / Translate Transforms in Flow**: Do NOT apply `transform: scale(...)` or `translateY(...)` to buttons inside flex/grid layouts that displace neighboring elements.
    - **Safe CSS Transitions**: Restrict transitions strictly to non-layout visual properties: `transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease`.
14. **Theme-Matching Rounded-Edge Input & Box Standard (ABSOLUTE MANDATORY STANDARD)**:
    - All input text boxes (`<input type="text">`, `<input type="number">`, `<input type="email">`, `<input type="password">`, `<input type="tel">`, `<input type="search">`, `<textarea>`), search bars, form containers, card sections, and preset chips MUST have sleek theme-matching rounded edges (`border-radius: 10px` to `12px` / `rounded-xl`).
    - Sharp, squared, or unrounded box corners (`border-radius: 0px` or raw default unstyled `<input>`) are **STRICTLY PROHIBITED** across all pages, forms, modals, drawers, and cards.
    - Input text fields must perfectly match the curvature, height, and border styling of `ModernSelect` and `ModernDatePicker`:
      - `border-radius: 10px` to `12px` (`rounded-xl`)
      - `border: 1px solid #CBD5E1` (transitioning to `#3B82F6` on focus)
      - `background: #FFFFFF`
      - `padding: 8px 14px` (height ~38px)
      - `font-size: 13px; font-weight: 500; color: #0F172A`
      - `box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04)`
      - Focus glow: `box-shadow: 0 0 0 3.5px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(15, 23, 42, 0.08) !important; outline: none;`
    - Form Section Cards: Inner modal grouping cards must use `border-radius: 14px` or `16px` (`rounded-2xl`), `background: #F8FAFC`, and `border: 1px solid #E2E8F0`.
15. **Theme-Matching Drawer & Modal Tab Navigation Standard (ABSOLUTE MANDATORY STANDARD)**:
    - All tab navigation bars across drawers, modals, cards, and sub-views MUST use the theme-matching active navy solid pill design with Lucide SVG icons (as established in `StudentProfileDrawer`).
    - **Active Tab Pill**: Deep `#0F172A` dark navy solid pill background (`border-radius: 8px`–`10px`, `padding: 7px 10px`), pure white text (`#FFFFFF`), bold font (`font-weight: 800`), and pure white Lucide SVG icon (`color: #FFFFFF`).
    - **Inactive Tab**: Clean transparent background, slate text (`#64748B`), slate Lucide SVG icon (`#64748B`), and subtle hover background (`#F1F5F9` / `#F8FAFC`).
    - **Mandatory SVG Icons**: Every single tab button MUST include a relevant Lucide SVG icon paired with its label (e.g. `<FileText size={12} /> Overview`, `<Calendar size={12} /> Attendance`, `<GraduationCap size={12} /> Academics`, `<Clock size={12} /> Leaves`).
    - **Prohibition**: Text-only tabs, underline-style tabs (`border-bottom: 2px solid #2563EB`), and raw non-pill navigation bars are **STRICTLY PROHIBITED** across all drawers and modal views.
