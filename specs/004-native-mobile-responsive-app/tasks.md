# Tasks: Full Native Mobile Responsive App Transformation

**Input**: Design documents from `/specs/004-native-mobile-responsive-app/`  
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

---

## Phase 1: Setup (Mobile Tokens & CSS Framework)

**Purpose**: Establish mobile layout tokens, viewport variables, and safe-area insets in `src/index.css`.

- [ ] T001 Define mobile layout tokens (`--mobile-top-bar-height`, `--mobile-bottom-nav-height`, `--mobile-sheet-radius`, `--mobile-fab-size`) and safe area insets in `src/index.css`
- [ ] T002 [P] Define mobile keyframe animations (`slideUpSheet`, `slideInDrawer`, `fabFanOut`) and glassmorphism tokens in `src/index.css`
- [ ] T003 [P] Add universal mobile touch ergonomics (`touch-action: manipulation`, min 44px tap targets) in `src/index.css`

---

## Phase 2: Foundational (Viewport Switcher & Layout Reset)

**Purpose**: Implement the responsive viewport switcher hiding desktop sidebar/topbar on mobile and establishing the mobile container hierarchy.

- [ ] T004 [P] Implement responsive media query `@media (max-width: 768px)` to hide `.sidebar` and desktop `.topbar` in `src/index.css`
- [ ] T005 [P] Adjust `.main-content` responsive padding for top mobile app bar and bottom navigation bar in `src/index.css`

---

## Phase 3: User Story 1 - Native Mobile App Shell & Bottom Tab Bar (Priority: P1) 🎯 MVP

**Goal**: Deliver the native mobile app shell with top app bar, fixed frosted glass bottom navigation bar, and slide-out more drawer.

**Independent Test**: Open the application on a mobile viewport (< 768px); verify the top app bar is sticky at top, the 5-tab bottom navigation bar (`Dashboard`, `Students`, `Classes`, `Fees`, `More Menu`) is fixed at bottom, and tapping `More Menu` opens the smooth slide-out drawer with all remaining modules.

### Implementation Tasks for User Story 1

- [ ] T006 [P] [US1] Create `<MobileTopBar />` with branding, title, notifications, and profile avatar in `src/components/MobileTopBar.tsx`
- [ ] T007 [P] [US1] Create `<MobileBottomNav />` with frosted glassmorphism and 5 core tab destinations in `src/components/MobileBottomNav.tsx`
- [ ] T008 [P] [US1] Create `<MobileMoreDrawer />` housing secondary modules (Teachers, Attendance, Exams, Homework, Timetable, CRM, Settings) in `src/components/MobileMoreDrawer.tsx`
- [ ] T009 [US1] Integrate `<MobileTopBar />`, `<MobileBottomNav />`, and `<MobileMoreDrawer />` with responsive layout state in `src/App.tsx`

**Checkpoint**: User Story 1 provides a complete native mobile navigation shell!

---

## Phase 4: User Story 2 - Mobile-Reflowed Student, Faculty & Batch Card Rosters (Priority: P1) 🎯 MVP

**Goal**: Auto-reflow data tables into touch-optimized mobile cards on small screens without horizontal scrolling.

**Independent Test**: Navigate to Students, Teachers, and Batches directories on mobile; verify table rows reflow into sleek mobile cards with monospace roll numbers, single-line status badges, one-tap contact popovers, and swipeable filter tabs.

### Implementation Tasks for User Story 2

- [ ] T010 [P] [US2] Implement `.mobile-card-roster` and `.mobile-entity-card` layout and styles in `src/index.css`
- [ ] T011 [P] [US2] Refactor student roster rendering in `src/pages/StudentsView.tsx` to automatically display mobile touch cards on screens < 768px
- [ ] T012 [P] [US2] Implement horizontally scrollable segmented filter pill bars with hidden scrollbars in `src/pages/StudentsView.tsx`
- [ ] T013 [P] [US2] Refactor Faculty cards in `src/pages/TeachersView.tsx` and Batch cards in `src/pages/BatchesView.tsx` for 1-column mobile grids
- [ ] T014 [US2] Refactor Fee Management ledger in `src/pages/FeeManagementView.tsx` to support mobile card reflow

**Checkpoint**: User Story 2 delivers 100% readable, touch-friendly mobile directory cards!

---

## Phase 5: User Story 3 - Native Mobile Bottom Sheet Modals & Forms (Priority: P1)

**Goal**: Transform all modal dialogs and registration forms into native bottom sheets with thumb-accessible action rows on mobile.

**Independent Test**: Trigger any modal (`+ Add Student`, `Edit`, `Record Payment`, `Credentials Slip`) on mobile; verify it slides up smoothly as a native bottom sheet from the bottom edge with rounded top corners and sticky bottom actions.

### Implementation Tasks for User Story 3

- [ ] T015 [P] [US3] Implement responsive bottom sheet modal styles (`.modal-card` at `bottom: 0`, 20px top radius, drag handle pill) in `src/index.css`
- [ ] T016 [P] [US3] Ensure `<AddStudentModal />`, `<EditStudentModal />`, and `<CollectFeeModal />` render with thumb-accessible sticky action rows on mobile
- [ ] T017 [US3] Ensure credential slips and receipts render with mobile-proportioned typography and full-width thumb actions

**Checkpoint**: All modal interactions feel like native mobile bottom sheets!

---

## Phase 6: User Story 4 - Mobile Touch Ergonomics & Expandable Speed-Dial FAB (Priority: P2)

**Goal**: Provide an expandable Speed-Dial Floating Action Button (FAB) and enforce safe-area insets.

**Independent Test**: On mobile viewports, tap the floating `+` FAB in the bottom right; verify it fans out 3 quick action buttons (`+ Student`, `+ Batch`, `💵 Payment`) and triggers creation bottom sheets.

### Implementation Tasks for User Story 4

- [ ] T018 [P] [US4] Create `<MobileSpeedDialFab />` with fan-out animations and quick triggers in `src/components/MobileSpeedDialFab.tsx`
- [ ] T019 [US4] Integrate `<MobileSpeedDialFab />` into `src/App.tsx` and connect actions to open student, batch, and fee payment modals
- [ ] T020 [US4] Verify safe-area padding (`env(safe-area-inset-bottom)`) across bottom nav and FAB on mobile

---

## Phase 7: Polish & Quality Verification

**Purpose**: Type safety check, browser subagent mobile visual inspection, and cross-module polish.

- [ ] T021 [P] Run `npx tsc --noEmit` to verify type safety across all modified views and components
- [ ] T022 Perform browser subagent mobile visual inspection (iPhone 14 Pro 393x852) to confirm native app shell, bottom tab bar, mobile cards, and bottom sheet forms

---

## Dependencies & Execution Order

```
[Phase 1: Setup Tokens (T001-T003)]
       │
       ▼
[Phase 2: Foundational (T004-T005)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[Phase 3: US1 - Mobile App Shell] [Phase 4: US2 - Mobile Cards]  [Phase 5: US3 - Bottom Sheets]
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       │
                                       ▼
                       [Phase 6: US4 - Speed-Dial FAB]
                                       │
                                       ▼
                       [Phase 7: Polish & Mobile QA]
```

---

## Parallel Opportunities

- **Phase 1 & 2**: `T001-T005` in `src/index.css`.
- **Phase 3 (App Shell)**: `T006` (TopBar), `T007` (BottomNav), `T008` (MoreDrawer) can be coded concurrently before `T009` in `src/App.tsx`.
- **Phase 4 (Mobile Cards)**: `T011` (StudentsView), `T013` (Teachers/Batches), `T014` (Fees) can be developed in parallel.
- **Phase 7**: `T021` (Typecheck) followed by `T022` (Playwright mobile visual QA).
