# Component Data Model & Mobile Token Specification

**Feature**: `004-native-mobile-responsive-app`  
**Date**: 2026-08-15  

---

## 1. Mobile Shell Layout Tokens

```css
:root {
  --mobile-top-bar-height: 56px;
  --mobile-bottom-nav-height: 62px;
  --mobile-fab-size: 52px;
  --mobile-touch-min-target: 44px;
  --mobile-sheet-radius: 20px;
  --mobile-card-radius: 14px;
  --mobile-header-bg: #0F172A;
  --mobile-glass-bg: rgba(255, 255, 255, 0.94);
  --mobile-glass-border: #E2E8F0;
  --mobile-shadow-sheet: 0 -10px 30px rgba(15, 23, 42, 0.18);
  --mobile-shadow-fab: 0 8px 24px rgba(15, 23, 42, 0.22);
}
```

---

## 2. Navigation Tab Entities & Drawer Schema

### Bottom Navigation Tabs (`MobileBottomNav`)

| Tab ID | Label | Icon | Route / View Trigger |
|---|---|---|---|
| `dashboard` | Dashboard | `LayoutDashboard` | Switches to `dashboard` |
| `students` | Students | `Users` | Switches to `students` |
| `batches` | Classes | `Layers` / `GraduationCap` | Switches to `batches` |
| `fees` | Fees | `Receipt` / `CreditCard` | Switches to `fees` |
| `more` | More | `Menu` | Opens `MobileMoreDrawer` |

### Secondary Drawer Navigation Items (`MobileMoreDrawer`)

| Module ID | Section | Label | Icon |
|---|---|---|---|
| `teachers` | Core Operations | Teachers & Faculty | `UserSquare2` |
| `attendance` | Core Operations | Attendance Portal | `CheckSquare` |
| `exams` | Academics | Exams & Marksheets | `Award` |
| `homework` | Academics | Homework & Study | `BookOpen` |
| `timetable` | Academics | Timetable Schedules | `Calendar` |
| `crm` | Administration | Inquiries & Leads | `UserPlus` |
| `announcements` | Administration | Broadcasts & SMS | `Megaphone` |
| `settings` | Administration | Academy Settings | `Settings` |

---

## 3. Speed-Dial FAB Actions (`MobileSpeedDialFab`)

| Action ID | Label | Icon | Color Accent | Trigger Event |
|---|---|---|---|---|
| `add-student` | Add Student | `UserPlus` | Emerald `#10B981` | Opens `AddStudentModal` |
| `add-batch` | Create Batch | `FolderPlus` | Blue `#2563EB` | Opens `CreateBatchModal` |
| `record-fee` | Record Payment | `DollarSign` | Indigo `#6366F1` | Opens `CollectFeeModal` |

---

## 4. Mobile Reflow Component Schema

### Mobile Entity Card (`.mobile-entity-card`)
- **Container**: Border 1px solid `#E2E8F0`, Radius 14px, Padding 14px, Background `#FFFFFF`, Shadow `0 2px 8px rgba(15,23,42,0.04)`.
- **Row 1 (Header)**: Avatar Initials circle (36px) + Name (`14px font-bold #0F172A`) + Reg No Badge (`11px font-mono #64748B`) + Class Pill.
- **Row 2 (Metadata)**: Parent Name + Quick dialer button + Single-line Status badges (`Paid ›`, `[ Active ]`).
- **Row 3 (Footer Actions)**: Primary `View` button (32px) + Phone popover + `•••` More Actions sheet.
