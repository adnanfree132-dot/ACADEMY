# Research & Architectural Decisions: Native Mobile Responsive App Transformation

**Feature**: `004-native-mobile-responsive-app`  
**Date**: 2026-08-15  
**Author**: Antigravity  

---

## 1. Architectural Decisions & Mobile Patterns

### Decision 1: Mobile App Shell vs Desktop Dual-Mode Layout
- **Decision**: Implement a clean CSS-driven viewport switcher (`@media (max-width: 768px)`) that hides the desktop sidebar (`.sidebar`) and desktop topbar (`.topbar`) on mobile devices and renders the dedicated **`<MobileTopBar />`** and **`<MobileBottomNav />`**.
- **Rationale**: Trying to "shrink" the desktop 260px sidebar on mobile breaks layout hierarchy and wastes precious screen space. A native mobile bottom tab bar paired with a top app bar mimics native iOS/Android OS navigation patterns (Apple Human Interface Guidelines and Material Design 3).
- **Alternatives Considered**: Collapsible hamburger-only menu (rejected: requires 2 taps for every single page switch, feeling like a clumsy web app).

### Decision 2: Tabular Data to Mobile Touch Cards Reflow
- **Decision**: Use responsive CSS `@media (max-width: 768px)` with dedicated `.data-table-container` / `.mobile-card-roster` reflow. On desktop, `.data-table` renders as standard horizontal grid. On mobile, each record renders as a **Native Mobile Touch Card** (`.mobile-entity-card`).
- **Rationale**: Tables on mobile screens < 768px cause horizontal scrolling, truncated text, or microscopic unreadable columns. Mobile cards display primary identifiers (Student Name, Monospace ID, Class pill) in bold, with single-line status badges, one-tap phone/WhatsApp popover, and a clean 3-dot action menu.
- **Alternatives Considered**: Pure horizontal scrolling tables with sticky columns (rejected: feels like an Excel spreadsheet on mobile rather than a native mobile application).

### Decision 3: Native Bottom Sheet Modal Architecture
- **Decision**: On viewports `< 768px`, transform all modal dialogs into **Native Bottom Sheets** (`.modal-card` transitions to `position: fixed; bottom: 0; border-radius: 20px 20px 0 0; max-height: 90vh; width: 100%;` with a top pull indicator pill).
- **Rationale**: Desktop centered modals force users to reach to the top of the mobile screen to close or submit. Bottom sheets place action buttons (`[ Cancel ]` and `[ ✓ Save / Submit ]`) within comfortable thumb reach with smooth upward slide animations (`slideUpSheet`).
- **Alternatives Considered**: Full-screen page replacement (rejected: loses contextual anchor of current view).

### Decision 4: Expandable Speed-Dial FAB (Floating Action Button)
- **Decision**: Render a floating action button (`.mobile-speed-dial-fab`) in the bottom right corner (positioned above the bottom tab bar at `bottom: calc(64px + env(safe-area-inset-bottom) + 16px)`). When tapped, it fans out 3 quick action pills: `+ Student`, `+ Batch`, and `💵 Payment`.
- **Rationale**: High-velocity administrative workflows on mobile demand instant creation access without having to navigate to specific sub-menus.

### Decision 5: Safe-Area Insets & Touch Ergonomics
- **Decision**: Enforce CSS environment variables `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` across top and bottom app shells, with a universal minimum touch hit target of 44x44px and `touch-action: manipulation` (disabling double-tap delay).
- **Rationale**: Guarantees zero clipping on bezel-less iPhones (Dynamic Island, Home Indicator bar) and modern Android gesture navigation devices.

---

## 2. Technology & Performance Strategy

1. **Pure CSS & React 18 Architecture**: Zero heavy external dependencies (no bulky component libraries). Built directly with vanilla CSS media queries in `src/index.css` and React functional components.
2. **GPU-Accelerated Micro-Animations**: All bottom sheet entries, drawer slide-outs, and FAB expansions use `transform: translateY(...)` and `opacity` with `cubic-bezier(0.16, 1, 0.3, 1)` for 60fps native feel.
3. **Zero Layout Shifts (CLS)**: Sticky layout containers with explicit heights prevent jitter during route transitions.
