# Interface & Markup Contract: Native Mobile App Shell & Layout Reflow

**Feature**: `004-native-mobile-responsive-app`  
**Date**: 2026-08-15  

---

## 1. Mobile App Shell Components

### `<MobileTopBar />`
```tsx
interface MobileTopBarProps {
  academyName: string;
  activeViewTitle: string;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenQuickCreate: () => void;
  userAvatarUrl?: string;
  userName: string;
}
```

### `<MobileBottomNav />`
```tsx
interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenMore: () => void;
}
```

### `<MobileMoreDrawer />`
```tsx
interface MobileMoreDrawerProps {
  isOpen: boolean;
  activeView: string;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
}
```

### `<MobileSpeedDialFab />`
```tsx
interface MobileSpeedDialFabProps {
  onAddStudent: () => void;
  onAddBatch: () => void;
  onRecordPayment: () => void;
}
```

---

## 2. CSS Responsive Breakpoints & Viewport Rules

```css
/* Mobile App Shell Switcher */
@media (max-width: 768px) {
  /* Hide Desktop Chrome */
  .sidebar,
  .topbar {
    display: none !important;
  }

  /* Main Viewport Content */
  .main-content {
    margin-left: 0 !important;
    padding-top: calc(var(--mobile-top-bar-height) + env(safe-area-inset-top) + 12px) !important;
    padding-bottom: calc(var(--mobile-bottom-nav-height) + env(safe-area-inset-bottom) + 32px) !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    min-height: 100vh;
  }

  /* Native Mobile Bottom Sheet Conversion */
  .modal-card {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    border-radius: var(--mobile-sheet-radius) var(--mobile-sheet-radius) 0 0 !important;
    max-height: 88vh !important;
    overflow-y: auto !important;
    box-shadow: var(--mobile-shadow-sheet) !important;
    animation: slideUpSheet 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Single-Column Metric & Card Grids */
  .stats-grid,
  .dashboard-grid,
  .card-grid-3 {
    grid-template-columns: 1fr !important;
  }
}
```
