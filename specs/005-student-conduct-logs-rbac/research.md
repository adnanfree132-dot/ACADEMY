# Phase 0: Research & Architectural Decisions

**Feature**: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals  
**Branch**: `005-student-conduct-logs-rbac`  
**Date**: 2026-08-18

---

## 1. Conduct Log Data Storage & Soft Delete Architecture

### Decision
Model `ConductLog` as a first-class Prisma entity directly attached to `Student` and optionally `Batch`, with non-destructive soft-delete fields (`is_deleted`, `deleted_at`, `deleted_by`) as mandated by Constitution Principle III.

### Rationale
- Disciplinary and commendation records are legally sensitive institutional documents. Hard deletion would destroy auditability.
- Soft-deletion preserves the full historical chain while filtering out deleted logs from active UI views.
- Attaching both `student_id` and optional `batch_id` allows conduct tracking both across the student's tenure and within specific batch contexts.

### Alternatives Considered
- *In-memory mock array (current state)*: Rejected because changes are lost on refresh and cannot be shared across multi-user portals.
- *Unstructured JSON blob in Student table*: Rejected because it prevents indexed filtering, author attribution, and row-level RBAC enforcement.

---

## 2. Role-Based Access Control (RBAC) & Authority Hierarchy

### Decision
Implement hierarchical RBAC middleware and controller-level ownership verification:
1. **Super Admin (`role === 'admin'`)**: Universal permissions across all logs (Create, Read all including confidential, Update all, Soft-delete all).
2. **Authoring Teacher (`role === 'teacher' && log.author_id === user.id`)**: Can create logs for students in assigned batches; can edit and soft-delete their own logs.
3. **Colleague Teacher (`role === 'teacher' && log.author_id !== user.id`)**: Read-only access to logs of students enrolled in batches assigned to that teacher. Edit and delete controls are disabled in UI and rejected by backend (403 Forbidden).
4. **Unassigned Teacher**: No access to students outside assigned batches (403 Forbidden).

### Rationale
- Prevents accidental or malicious modification of teacher remarks by peers while giving the Academy Administrator ultimate corrective oversight.
- Ensures teachers maintain authority over their own pedagogical assessments and incident reports.

### Alternatives Considered
- *Allow all teachers to edit any log*: Rejected because it compromises accountability and attribution integrity.
- *Strictly immutable logs (no edits)*: Rejected because teachers frequently need to fix typos, clarify incident descriptions, or append outcome notes.

---

## 3. Student & Parent Multi-Role Linkage & Confidentiality Guard

### Decision
1. Introduce a `ParentStudent` linkage model mapping parent `User` accounts to `Student` records with relationship types (`father`, `mother`, `guardian`).
2. Implement strict query filtering:
   - When the requester is `student` or `parent`, the backend automatically enforces `WHERE is_confidential = false AND is_deleted = false`.
   - When the requester is `student`, the query is hard-scoped to `WHERE student.user_id = requester.userId`.
   - When the requester is `parent`, the query is hard-scoped to `WHERE student_id IN (SELECT student_id FROM ParentStudent WHERE parent_id = requester.userId)`.

### Rationale
- Staff need a safe space to document internal notes (e.g. child protection alerts, staff conference notes, fee follow-up warnings) without causing alarm to parents or students.
- Positive commendations and formal notifications can be made visible to parents and students to foster encouragement and transparent home-school collaboration.

### Alternatives Considered
- *Separate tables for internal notes and parent notes*: Rejected because it duplicates schema logic and creates fragmented UI experiences. A single `is_confidential` boolean flag is simpler, standard, and query-efficient.

---

## 4. UI/UX Design & Floating Island Form Architecture

### Decision
1. **Conduct Tab in StudentProfileDrawer**:
   - Modern timeline list of conduct cards with categorized icon badges (*Emerald Commendation*, *Amber Warning*, *Rose Infraction*, *Slate General Note*).
   - Author metadata badge with timestamp (e.g. `By Ms. Sarah Jenkins (Teacher) • Today at 2:30 PM`).
   - Action toolbar per card: Edit (Pencil) and Delete (Trash) buttons displayed only if user is Super Admin or the authoring teacher.
   - Quick-add form with category picker, title, remark textarea, and `🔒 Confidential Staff Note` toggle.
2. **Edit Modal**:
   - Implements Constitution Principle IV **Floating Island Modal Architecture** (Navy `#0F172A` header island with Emerald badge, white form card island with categorized inputs, and floating action pill buttons).

### Rationale
- Adheres strictly to the project's non-negotiable UI/UX Taste Standards and AGENTS.md rules.
- Prevents UI clutter while making action capabilities visually unambiguous.

---

## 5. API Contracts & Envelope

### Decision
Expose RESTful endpoints under `/api/v1` matching the standardized `{ success: boolean, data?: any, error?: string }` envelope:
- `GET /api/v1/students/:studentId/conduct-logs`
- `POST /api/v1/students/:studentId/conduct-logs`
- `PUT /api/v1/conduct-logs/:id`
- `DELETE /api/v1/conduct-logs/:id`
- `GET /api/v1/parents/my-children` (Parent portal student list)

### Rationale
- Seamlessly fits into existing `apiClient.ts` patterns and Express router architecture.
