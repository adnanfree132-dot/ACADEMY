# Quickstart & Runnable Validation: Directory Layout & Button Polish

**Feature**: Directory Page Layout, Table Alignment & Button Design Polish  
**Spec**: [spec.md](./spec.md)

---

## 1. Automated Verification Commands

Run the TypeScript type checker and automated Playwright test suite:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Automated quickstart & E2E validation script
node test_quickstart_scenarios.cjs
```

---

## 2. Visual Inspection Scenarios

### Scenario 1: Students Directory Header & Action Bar
1. Navigate to `http://localhost:5173/` and open **Students**.
2. Verify top action buttons:
   - Single-line labels without text wrapping (`Leave Requests`, `Promote Class`, `Bulk Print Cards`, `Import CSV`, `Export CSV`, `+ Add New Student`).
   - Primary `+ Add New Student` button in bold dark navy `#0F172A`.
   - Secondary utility pills in clean white with `#CBD5E1` borders and 36px heights.

### Scenario 2: Data Table Alignment & Typography
1. Inspect the student table rows.
2. Verify `REG NO & NAME`: bold name + monospace slate roll number.
3. Verify `STATUS`: horizontal badge group `[ Active ]` `[ 94% Att. ]` cleanly aligned.
4. Verify all table cells have strict `vertical-align: middle` with uniform 60px row height.

### Scenario 3: Row Action Button Group
1. Inspect the `ACTIONS` column.
2. Verify primary `View` button (28px) followed by compact 28px icon buttons (`PhoneCall`, `Award`, `ShieldCheck`, `Edit`, `Trash2`).
3. Hover over icon buttons to confirm micro-transitions (`scale(1.08)`) and themed hover tooltips.
