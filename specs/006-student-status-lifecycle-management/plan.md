# Implementation Plan: Student Status Lifecycle, Audit History & Retention Management

**Branch**: `006-student-status-lifecycle-management` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-student-status-lifecycle-management/spec.md`

---

## Summary

Implement a comprehensive full-stack vertical slice for student enrollment lifecycles (`Active`, `Inactive / On Leave`, `Suspended`, `Graduated / Alumni`, `Left / Withdrawn`). Provides dedicated Floating Island modals for status transitions with reason categorization and fee pause options, immutable audit history logs, a 1-click reactivation workflow, segmented directory status tabs, portal login gating, and an official printable/WhatsApp-ready Leaving Certificate & Clearance Slip generator.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ / React 18.2+  
**Primary Dependencies**: Express 4, Prisma Client 5, Zod 3.24, Lucide React, CSS Design System  
**Storage**: PostgreSQL (via Supabase) / Prisma ORM  
**Testing**: Playwright automated E2E audits, REST API integration checks, `tsc` compilation checks  
**Target Platform**: Responsive Web (Desktop, Tablet & Mobile)  
**Project Type**: Full-Stack Web Application (React SPA + Express API Backend)  
**Performance Goals**: < 100ms API response for status transitions; instant optimistic UI updates; < 3 click reactivation  
**Constraints**: Zero hard deletes (soft-delete with status history); Floating Island Modal Architecture on all forms; strict single-line badges  
**Scale/Scope**: Multi-batch academy with hundreds of active and historical student profiles  

---

## Constitution Check

*GATE: Must pass before implementation. Evaluated against `/memory/constitution.md`.*

| Principle | Compliance Status | Architectural Justification |
| :--- | :---: | :--- |
| **I. Full-Stack Vertical Slices** | ✅ PASS | Fully covers all 4 layers: Frontend UI components (`ChangeStudentStatusModal`, `LeavingCertificateModal`, `StudentProfileDrawer`), API Client (`apiClient.ts`), Backend Express Router with Zod validation (`routes.ts`), and Prisma ORM Models (`Student`, `StudentStatusHistory`). |
| **II. Layered Architecture** | ✅ PASS | Routes strictly pass through JWT authentication (`authenticateJwt`), role verification (`requireRole`), Zod validation schemas, business logic (fee pausing & status transitions), Prisma queries, and audit logging. |
| **III. Soft Deletes & Auditing** | ✅ PASS | Hard deletes are strictly forbidden; status transitions to `left` preserve financial ledgers, test marks, and attendance registers; every transition is permanently logged in `StudentStatusHistory` and `AuditLog`. |
| **IV. UI/UX Taste Standards** | ✅ PASS | Adheres strictly to Floating Island Modal Architecture (transparent canvas, dark navy `#0F172A` header island, white form card island, floating action pill island), curated color badges (`#F0FDF4` emerald, `#EFF6FF` blue, `#FEF3C7` amber, `#FEF2F2` rose, `#FAF5FF` purple), and `white-space: nowrap` status indicators. |
| **V. Multi-Role RBAC** | ✅ PASS | Admin/Super Admin authorization for status modifications; portal login gatekeeper automatically blocks inactive/suspended accounts with clear feedback. |
| **VI. Quality Gates** | ✅ PASS | Validated with `tsc --noEmit`, Playwright scenario runs, and deterministic database updates. |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-student-status-lifecycle-management/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Phase 1 Prisma models & Zod validation
├── quickstart.md        # Phase 1 verification workflows
├── contracts/           # Phase 1 API schema contracts
│   └── api-contracts.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Modifications

```text
d:/academy/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma         # [MODIFY] Add StudentStatusHistory model & status fields to Student
│   │   └── seed.ts               # [MODIFY] Add sample status transition history
│   └── src/
│       └── routes.ts             # [MODIFY] Add /api/v1/students/:id/status, /status-history, /reactivate, /leaving-certificate
├── src/
│   ├── api/
│   │   └── apiClient.ts          # [MODIFY] Add student lifecycle API methods
│   ├── types.ts                  # [MODIFY] Add lifecycle types, history interfaces, and certificate types
│   ├── components/
│   │   ├── ChangeStudentStatusModal.tsx # [NEW] Floating Island modal for changing student status & reasons
│   │   ├── LeavingCertificateModal.tsx  # [NEW] Floating Island modal for official Leaving Certificate & Clearance
│   │   └── StudentProfileDrawer.tsx     # [MODIFY] Add Status & Lifecycle History timeline tab
│   └── pages/
│       └── StudentsView.tsx      # [MODIFY] Status filter tabs (Active, On Leave, Suspended, Alumni, Left), row actions
```

---

## Implementation Phases

### Phase 1: Database Schema & Backend API
1. Update `server/prisma/schema.prisma` with `StudentStatusHistory` and extended `Student` status fields.
2. Run `npx prisma generate` and `npx prisma db push`.
3. Implement REST endpoints in `server/src/routes.ts`:
   - `POST /api/v1/students/:id/status` (Change status, record reason, update fee billing flag, log history).
   - `GET /api/v1/students/:id/status-history` (Fetch chronological timeline).
   - `POST /api/v1/students/:id/reactivate` (Reinstate student with batch assignment).
   - `GET /api/v1/students/:id/leaving-certificate` (Compute clearance summary & certificate data).
4. Update portal login logic to verify active student enrollment.

### Phase 2: Frontend API Client & State Types
1. Add interfaces to `src/types.ts` (`StudentLifecycleStatus`, `StatusReasonCategory`, `StudentStatusHistoryItem`, `LeavingCertificateData`).
2. Add API methods in `src/api/apiClient.ts` (`changeStudentStatus`, `getStudentStatusHistory`, `reactivateStudent`, `getLeavingCertificate`).

### Phase 3: UI Components & Floating Island Modals
1. Create `ChangeStudentStatusModal.tsx` adhering to Floating Island Modal Architecture.
2. Create `LeavingCertificateModal.tsx` with print layout and WhatsApp link generator.
3. Update `StudentProfileDrawer.tsx` to include the **Status & History** audit timeline tab.
4. Update `StudentsView.tsx` with segmented status filter tabs (`All`, `Active`, `On Leave`, `Suspended`, `Alumni`, `Archived / Left`), color-coded badges, and row action menu triggers (`Change Status`, `Leaving Certificate`, `Reactivate Student`).

### Phase 4: Verification & Quality Assurance
1. Run `npx tsc --noEmit` across frontend and backend.
2. Verify all status transition paths, leaving certificates, and reactivation flows.
