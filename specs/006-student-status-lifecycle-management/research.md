# Research & Architectural Decisions: Student Status Lifecycle & Retention Management

**Feature**: `006-student-status-lifecycle-management`  
**Date**: 2026-08-19  
**Status**: Completed

---

## 1. Student Lifecycle State Machine

### Decision
Model student status as an explicit 5-state lifecycle enum:
1. `active` (Standard enrolled student with active attendance, assessment, and recurring fee generation)
2. `inactive` (Temporarily on leave/pause: medical leave, extended absence, family travel; recurring fees paused by default)
3. `suspended` (Disciplinary/administrative block; portal login access revoked; recurring fees paused)
4. `graduated` (Successfully completed academy curriculum/program; preserved in alumni archives)
5. `left` (Withdrawn/soft-archived from academy; reason recorded; portal access disabled; past records preserved)

### Rationale
- Simple boolean `is_active` flags lose critical business context (e.g. distinguishing a temporarily sick student on leave from a graduate or an expelled student).
- A 5-state lifecycle model reflects actual operational workflows in educational academies.
- Explicit states allow deterministic behavior in downstream modules (e.g. Fee Generator skips `inactive`, `suspended`, `graduated`, `left` students).

### State Transitions Table

| Current Status | Allowed Transitions | Typical Triggers | Fee Billing Impact | Portal Access |
| :--- | :--- | :--- | :--- | :--- |
| **`active`** | `inactive`, `suspended`, `graduated`, `left` | Approved leave request, disciplinary action, graduation, withdrawal | Active | Allowed |
| **`inactive`** | `active`, `suspended`, `left` | Return from leave, reinstatement, withdrawal | Paused by default | Blocked |
| **`suspended`** | `active`, `left` | Suspension term completed, expulsion/withdrawal | Paused | Blocked |
| **`graduated`** | `active` (re-enrollment) | Alumni re-enrolling in advanced program | No active fees | Alumni Read-Only |
| **`left`** | `active` (re-admission) | Returning student re-enrollment | No active fees | Blocked |

---

## 2. Status Transition Auditing & History Tracking

### Decision
Create a dedicated `StudentStatusHistory` model in Prisma rather than only updating the `Student` table in place.

### Rationale
- Educational institutions require complete regulatory traceability on when a student was placed on leave, why they left, or who authorized their graduation.
- Captures: `previous_status`, `new_status`, `reason_category` (`medical`, `financial`, `relocation`, `disciplinary`, `graduation`, `personal`, `other`), `remarks`, `effective_date`, `changed_by_user_id`, and `created_at`.
- Enables a dedicated "Status & History" timeline in the student 360° drawer.

---

## 3. UI/UX & Floating Island Modal Architecture

### Decision
Implement two dedicated modals adhering strictly to the Academy Pro OS Constitution (Principle IV):
1. **`ChangeStudentStatusModal.tsx`**:
   - **Island 1**: Navy `#0F172A` header with Amber/Emerald badge and circular close button.
   - **Island 2**: Summary pill of current student and current status.
   - **Island 3**: White form card with Target Status selector, Reason Category dropdown, Effective Date picker, Detailed Remarks textarea, and Fee Billing Action toggles.
   - **Island 4**: Paired floating action pills (`[ Cancel ]` + `[ ✓ Update Status ]`).
2. **`LeavingCertificateModal.tsx`**:
   - **Island 1**: Navy `#0F172A` header with Emerald badge (`ShieldCheck`).
   - **Island 2**: Official Academy Institutional Seal & Header preview.
   - **Island 3**: White card rendering the formal Clearance & Leaving Certificate with attendance %, fee clearance badge, conduct rating, and principal signature block.
   - **Island 4**: 3-button floating grid (`[ 📋 Copy Info ]`, `[ 🖨️ Print Slip ]`, `[ 💬 Send WhatsApp ]`) and full-width `[ ✓ Done & Close ]` pill.

---

## 4. Directory Status Segmentation & Filter UX

### Decision
Add dedicated segmented status tabs on the Students Directory:
- `All` (All non-archived + optional toggle)
- `Active`
- `On Leave`
- `Suspended`
- `Alumni`
- `Archived / Left`

Each tab includes a real-time count pill and is fully synchronized with search and batch filtering.
