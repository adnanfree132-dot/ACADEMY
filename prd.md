# PRODUCT REQUIREMENTS DOCUMENT

## 1. Personas
- Owner/Admin: runs academy; admissions, fees, reports, staff.
- Teacher: marks attendance, homework, marks; communicates with parents.
- Student: sees attendance, homework, materials, results, fees, notices.
- Parent: monitors child (attendance/fees/results), pays offline, receives alerts.

## 2. Role Permission Matrix (C=create R=read U=update D=delete)
| Module            | Admin | Teacher            | Student      | Parent       |
|-------------------|-------|--------------------|--------------|--------------|
| Students          | CRUD  | R (own batches)    | R (self)     | R (child)    |
| Teachers          | CRUD  | R (self)           | –            | –            |
| Classes/Batches   | CRUD  | R (own)            | R (own)      | R (child)    |
| Attendance        | CRU   | CRU (own batches)  | R (self)     | R (child)    |
| Leave             | CRU   | RU (approve own)   | CR (self)    | CR (child)   |
| Timetable         | CRUD  | R (own)            | R (own)      | R (child)    |
| Homework          | CRUD  | CRU (own batches)  | RU (status)  | R (child)    |
| Materials         | CRUD  | CRUD (own)         | R            | R (child)    |
| Tests/Marks       | CRUD  | CRU (own)          | R (self, published) | R (child, published) |
| Fee structures    | CRUD  | –                  | –            | –            |
| Invoices/Payments | CRU   | –                  | R (self)     | R (child)    |
| Inquiries         | CRUD  | –                  | –            | –            |
| Announcements     | CR    | –                  | R            | R            |
| Messages          | CR    | CR (own batches)   | CR (teacher/admin) | CR (teacher/admin) |
| Reports/Dashboard | R     | R (own)            | R (self)     | R (child)    |
| Settings/Audit    | RU    | –                  | –            | –            |

## 3. Functional Requirements
Exactly PLAN.md M1–M18. Each user story must cite a PLAN ID.

## 4. Non-Functional
- Security: bcrypt(12), JWT, Zod validation on all inputs, RBAC middleware on every route, audit on money/attendance/marks.
- Data safety: daily local backups (Phase 1), Supabase PITR (Phase 2). No hard deletes on fees/attendance (soft delete + audit).
- Performance: list endpoints paginated (default 20), indexed per DATABASE_SCHEMA.md.
- Availability target: single-region, small user base (<2k users) — simple deployment.

## 5. Success KPIs
- Admission entry < 2 min; attendance marking < 30 sec/batch; payment record < 30 sec.
- 100% of fee changes audited; 0 features outside PLAN.md.