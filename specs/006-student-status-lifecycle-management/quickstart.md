# Quickstart Validation Guide: Student Status Lifecycle & Retention Management

**Feature**: `006-student-status-lifecycle-management`  
**Date**: 2026-08-19

---

## 1. Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Authenticated Admin or Super Admin session

---

## 2. Validation Scenarios

### Scenario A: Transition Active Student to "Inactive / On Leave"
1. Open the Students Directory at `http://localhost:3000`.
2. Find any active student, open the row `•••` More Actions menu, and click **Change Status** (or click their status badge).
3. In the Floating Island modal:
   - Select **Target Status**: `Inactive / On Leave`
   - Select **Reason**: `Medical Leave`
   - Choose **Fee Action**: `Pause Monthly Fees`
   - Enter **Remarks**: "2 months medical leave"
   - Click `✓ Update Status`.
4. **Expected Result**: 
   - Student's status updates to Amber `On Leave` badge.
   - Student appears under the `On Leave` segmented directory tab.
   - Status history entry is logged.

### Scenario B: View Status History on 360° Profile Drawer
1. Click `View` on the updated student.
2. Navigate to the **Status & History** tab in the drawer.
3. **Expected Result**: Chronological timeline displays the status transition with previous status, new status, timestamp, admin name, and remarks.

### Scenario C: 1-Click Reactivation & Batch Assignment
1. In the directory, click the `On Leave` or `Archived / Left` tab.
2. On an inactive student, click **Reactivate Student**.
3. Select target batch (e.g. `Grade 10 - Section A`), confirm fee plan, and submit.
4. **Expected Result**: Student immediately returns to `Active` status, restored to the active roster and fee cycle.

### Scenario D: Leaving Certificate / Clearance Slip Generator
1. On any Graduated or Left student, click `Leaving Certificate`.
2. **Expected Result**:
   - Floating Island modal opens rendering official clearance slip with attendance %, fee dues clearance status, conduct rating, and principal signature block.
   - Clicking `Send WhatsApp` prepares a direct WhatsApp Web link to the parent.
   - Clicking `Print Slip` triggers the browser print dialog cleanly.
