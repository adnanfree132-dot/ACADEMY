# Quickstart Validation Guide: Native Mobile Responsive App

**Feature**: `004-native-mobile-responsive-app`  
**Date**: 2026-08-15  

---

## 1. Prerequisites & Dev Server
- Dev server running on `http://localhost:3000`
- Backend Express server running on `http://localhost:5000`

---

## 2. Validation Scenarios

### Scenario 1: Mobile Viewport Shell & Bottom Tab Navigation
1. Open Chrome DevTools with mobile viewport emulation (e.g. iPhone 14 Pro, 393 x 852).
2. Navigate to `http://localhost:3000`.
3. **Verify**:
   - Desktop 260px sidebar and desktop header are completely hidden.
   - Fixed Top Mobile App Bar is rendered at top with academy branding and user profile.
   - Fixed Frosted Glass Bottom Navigation Bar is docked at bottom with 5 tabs (`Dashboard`, `Students`, `Classes`, `Fees`, `More Menu`).
   - Tapping `Students`, `Classes`, and `Fees` tabs instantly changes views with smooth icon active states.

### Scenario 2: More Menu Slide-Out Drawer
1. On mobile viewport, tap the `More Menu ▾` tab in the bottom bar.
2. **Verify**:
   - Slide-out navigation drawer smoothly opens from the side/bottom.
   - Secondary tabs (`Teachers`, `Attendance`, `Exams`, `Homework`, `CRM`, `Settings`) are clearly listed with touch-friendly icons.
   - Tapping `Teachers` navigates to Faculty view and automatically dismisses drawer.

### Scenario 3: Student Directory Mobile Touch Card Reflow
1. Navigate to Students Directory on mobile viewport.
2. **Verify**:
   - Student records render as sleek **Mobile Touch Cards** with student avatar, bold name, monospace roll number, and class pill.
   - `Fee Status` and `Status` badges are displayed clearly on a single line without wrapping.
   - Tapping the `Phone` button opens the floating contact menu (`💬 WhatsApp Chat` + `📞 Mobile Call`).
   - Zero horizontal viewport scrolling or clipped elements.

### Scenario 4: Native Mobile Bottom Sheet Form
1. Tap the `+` FAB or `+ Add Student` on mobile viewport.
2. **Verify**:
   - Registration modal slides up from the bottom as a **Native Bottom Sheet** with rounded top corners (`border-radius: 20px 20px 0 0`) and top drag pill.
   - Action buttons (`Cancel` and `Save`) are docked within thumb reach at the bottom of the sheet.
   - Sheet closes cleanly when tapping backdrop or close icon.

### Scenario 5: Expandable Speed-Dial FAB
1. On mobile viewport, locate the floating `+` button in the bottom right corner.
2. Tap the `+` FAB.
3. **Verify**:
   - FAB rotates and smoothly fans out 3 quick creation pills: `+ Student`, `+ Batch`, `💵 Payment`.
   - Tapping any option triggers its respective modal bottom sheet.

---

## 3. Automated Validation Command
```bash
npx tsc --noEmit
```
