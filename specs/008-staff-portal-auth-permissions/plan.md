# Implementation Plan: Staff Portal Authentication, Dynamic Roles & Granular Permission Management

**Branch**: `008-staff-portal-auth-permissions` | **Date**: 2026-08-21 | **Spec**: [specs/008-staff-portal-auth-permissions/spec.md](file:///d:/academy/specs/008-staff-portal-auth-permissions/spec.md)

**Input**: Feature specification from `/specs/008-staff-portal-auth-permissions/spec.md`

## Summary

This feature delivers a comprehensive staff management and role-based access control (RBAC) architecture for Academy Pro OS. Whenever a staff member (Faculty, Admin, Domestic Staff, or custom roles like Librarian) is registered, the system automatically creates a unique System Staff ID (`FAC-2026-xxx`, `ADM-2026-xxx`, `DOM-2026-xxx`) and randomized temporary password, immediately opening an official **Credential Slip Modal** with Print, PDF, and direct WhatsApp dispatch. Administrators can define dynamic custom staff types and customize granular 3-tier permissions (`Hidden`, `View Only`, `Editable`) per module. Teaching faculty are granted scoped data access to their assigned classes, while self-service portals empower staff to view schedules, mark daily attendance, and submit leave requests.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: React 18, Vite 5, Express 4, Prisma Client 5, Zod 3, Lucide React, Tailwind CSS  
**Storage**: PostgreSQL 16 (Relational tables for `StaffMember`, `StaffType`, `StaffPermission`, `StaffAttendance`, `StaffLeaveRequest`, `StaffDocument`)  
**Testing**: Playwright E2E automated test scripts, TypeScript compiler verification (`tsc --noEmit`), Vite production build  
**Target Platform**: Responsive Web Application (Desktop & Mobile)  
**Project Type**: Full-Stack Web Application (SPA Client + RESTful Backend)  
**Performance Goals**: 0ms optimistic UI reflection upon creation/updates, sub-second staff login and credential slip generation  
**Constraints**: Strict compliance with Constitution v1.7.0 (Floating Island modal architecture, zero emojis, unified theme-matching SVG icon styling, 0ms optimistic updates)  
**Scale/Scope**: Designed for multi-branch institutions managing hundreds of staff members across academic, administrative, and support roles.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verification Status | Compliance Details |
| :--- | :--- | :--- |
| **I. Full-Stack Vertical Slices** | ✅ PASS | Every action (register staff, create staff type, edit permissions, approve leaves) spans React UI, `apiClient.ts`, Express Zod routes, and Prisma schema. |
| **II. Layered Architecture** | ✅ PASS | Centralized `staffService.ts` and `rbacMiddleware.ts` encapsulate business logic and classroom batch scoping (`assertStaffPermission`, `assertOwnBatch`). |
| **III. Data Integrity & Auditing** | ✅ PASS | Non-destructive soft statuses (`status="terminated"`, `is_active=false`), audit log recording on permission/salary mutations. |
| **IV. UI/UX Taste Standards** | ✅ PASS | Strict Floating Island modal architecture for all forms, zero Unicode emojis, uniform theme slate Lucide icons, `ModernSelect` and `ModernDatePicker` throughout. |
| **V. Multi-Role RBAC & Zero-Trust** | ✅ PASS | Bcrypt password hashing, rotatable JWT authentication, granular module permission checks on both backend middleware and frontend navigation. |
| **VI. Automated Quality Gates** | ✅ PASS | TypeScript validation, Prisma schema synchronization, Playwright E2E smoke tests. |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-staff-portal-auth-permissions/
├── spec.md              # Feature specification
├── plan.md              # This technical implementation plan
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Phase 1 Prisma schema models & state transitions
├── quickstart.md        # Phase 1 validation scenarios
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── contracts/
    └── staff-api.yaml   # OpenAPI REST contract definitions
```

### Source Code Architecture

```text
# Backend Architecture
server/
├── prisma/
│   └── schema.prisma                   # StaffMember, StaffType, StaffPermission, StaffAttendance, StaffLeaveRequest
├── src/
│   ├── middleware/
│   │   └── rbacMiddleware.ts          # Granular module permission & data scoping middleware
│   ├── services/
│   │   └── staffService.ts            # Staff business logic, credential generator, leave workflows
│   ├── routes.ts                      # REST endpoints for /api/v1/staff, /api/v1/staff-types, etc.
│   └── envelope.ts                    # Standardized error sanitation and response envelopes

# Frontend Architecture
src/
├── types.ts                           # TypeScript interfaces (StaffMember, StaffType, StaffPermission, etc.)
├── api/
│   └── apiClient.ts                   # Strongly typed frontend API methods
├── components/
│   ├── RegisterStaffModal.tsx         # Floating island staff registration form with auto-credentials
│   ├── StaffTypeManagerModal.tsx      # Floating island modal to create and manage custom staff types
│   ├── StaffPermissionsModal.tsx      # Granular module permission toggle matrix
│   ├── StaffCredentialSlipModal.tsx   # Printable credential slip with WhatsApp dispatch
│   ├── StaffDetailDrawer.tsx          # Comprehensive staff profile drawer with documents & salary
│   ├── StaffLeaveRequestModal.tsx     # Staff leave request submission form
│   └── SubstituteTeacherModal.tsx     # Substitute teacher assignment dialog upon leave approval
└── pages/
    └── TeachersStaffPage.tsx          # Unified Directory with staff type filters, tools menu, and batch actions
```

---

## Complexity Tracking

| Component / Pattern | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| **Dedicated `StaffMember` model linked to `Teacher`** | Unifies Faculty, Admin, and Domestic staff under a single credential & permission system while preserving classroom batch foreign keys | Modifying `Teacher` directly would pollute non-teaching employees with irrelevant classroom subject fields |
| **Granular 3-Tier Permissions Matrix** | Allows fine-grained `Hidden`, `View Only`, and `Editable` module access | Binary boolean flags cannot distinguish between read-only reviewers and editors |
| **Floating Island Credential Slip** | Matches Student Credential Slip standard for instant printing and WhatsApp sharing | Plain alerts or browser prints provide poor user experience and zero branding |
