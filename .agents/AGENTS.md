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
1. **Curated Color Palettes**: Never use plain primary red/blue/green boxes. Use soft, harmonious HSL/HEX shades (e.g., `#F0FDF4` emerald, `#EFF6FF` indigo) paired with crisp slate text (`#334155`).
2. **Glassmorphism & Elevation**: Floating menus and popovers must feature glassmorphism (`backdrop-filter: blur(16px)`), rounded corners (`12px`+), and layered box-shadows (`0 12px 28px -4px rgba(15,23,42,0.12)`).
3. **Icon Badges & Micro-Animations**: Use soft circular icon badges for actions and add subtle micro-transitions (`transform: scale(1.08)`, smooth hover state changes, keyframe entry animations).
4. **Explicit Action Labeling**: Never rely solely on ambiguous icon-only buttons. Use clear, human-readable labels (e.g. "💵 Receive Fee" instead of a bare "$").
5. **Floating Island Architecture for All Forms & Modals (MANDATORY)**:
   - Modals MUST NOT be a single monolithic white box.
   - The modal container (`.modal-card` / `.modal-container`) MUST have `background: transparent; border: none; box-shadow: none; padding: 0; display: flex; flex-direction: column; gap: 12px;` so that where there are no entries, the blurred background is visible (`backdrop-filter: blur(12px)`).
   - **Island 1**: Floating `#0F172A` dark navy header card with Emerald `#10B981` badge and circular close button.
   - **Island 2**: Optional floating notice/callout or tab bar island directly on the transparent canvas.
   - **Island 3**: Floating white content/form card (`#FFFFFF`, `border-radius: 16px`, `border: 1px solid #E2E8F0`, `box-shadow: 0 10px 25px -5px rgba(15,23,42,0.12)`).
   - **Island 4**: Floating action pill row (`border-radius: 9999px`) directly over the transparent backdrop (`[ Cancel ]` white pill + `[ ✓ Save / Submit ]` dark navy `#0F172A` pill for forms; `[ ✓ Done & Close ]` for slips/receipts).
6. **Clean Minimal Directory & Table Standards (MANDATORY)**:
   - Headers: Avoid button explosions. Use a clean header with page title, count badge, `[ ⤓ Export CSV ]`, consolidated `[ ⚙ Tools ▾ ]` dropdown menu for batch operations, and a primary navy `[ + Add Entity ]` button (`#0F172A`).
   - Tables: Strict `vertical-align: middle`, standardized cell heights, and strict `white-space: nowrap` across status badges and row action groups. Multi-line badge text wrapping or distorted badge shapes are strictly forbidden.
7. **Dual-Option Contact Popover (MANDATORY)**:
   - Phone/Dialer triggers MUST open an anchored popup menu offering:
     1. **💬 WhatsApp Chat**: Opens WhatsApp Web / App directly in a new tab.
     2. **📞 Mobile Call**: Redirects to `tel:...`, immediately launching the device/system dialer.
