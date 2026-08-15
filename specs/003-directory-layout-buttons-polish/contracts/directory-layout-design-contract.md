# Design Contract: Directory Page Layout, Table Alignment & Button Design System

**Feature**: Directory Page Layout, Table Alignment & Button Design Polish  
**Spec**: [spec.md](../spec.md)

---

## 1. CSS Design System Contract (`src/index.css`)

```css
/* ==========================================================================
   DIRECTORY HEADER & ACTION BAR
   ========================================================================== */
.directory-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.header-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

.header-btn-utility {
  height: 36px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1px solid #CBD5E1;
  background: #FFFFFF;
  color: #334155;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.15s ease;
}

.header-btn-utility:hover {
  background: #F8FAFC;
  border-color: #94A3B8;
  color: #0F172A;
  transform: translateY(-1px);
}

.header-btn-primary {
  height: 36px;
  padding: 0 18px;
  border-radius: 9999px;
  border: none;
  background: #0F172A;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: all 0.15s ease;
}

.header-btn-primary:hover {
  background: #1E293B;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
}

/* ==========================================================================
   DATA TABLE DESIGN SYSTEM
   ========================================================================== */
.data-table-container {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table thead th {
  background: #F8FAFC;
  color: #64748B;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  color: #334155;
  height: 60px;
  box-sizing: border-box;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #F8FAFC;
}

/* Table Badge Group */
.badge-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

/* ==========================================================================
   ROW ACTION BUTTON GROUP
   ========================================================================== */
.table-action-group {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.table-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.table-icon-btn:hover {
  transform: scale(1.08);
}
```
