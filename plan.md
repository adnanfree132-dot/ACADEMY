# ACADEMY MANAGEMENT SYSTEM — MASTER PLAN (SOURCE OF TRUTH)

## 0. RULES FOR AI / DEVELOPERS (ANTI-HALLUCINATION)
1. Implement ONLY features with an ID in this file. If a feature has no ID, it DOES NOT EXIST.
2. If anything is ambiguous, ASK. Do not invent fields, tables, endpoints, or modules.
3. Every DB table and API endpoint must reference a PLAN ID in a comment.
4. No new module may be added without first updating this file.
5. Out of scope (NEVER build): library, hostel, transport, payroll/HR, certificates/ID cards,
   multi-branch, online payment gateway (Phase 1), biometrics, SMS/WhatsApp (Phase 1).

## 1. SCOPE
Small/medium academy (tuition/coaching center). Roles: Admin(Owner), Teacher, Student, Parent.
Optional roles later: Accountant, Front Desk. Web app first, same API reused for mobile later.

## 2. MODULES — FEATURES — SUB-FEATURES

### M1 AUTH — Authentication & Access
- AUTH-01 Login (email or phone + password)
- AUTH-02 Logout / invalidate refresh token
- AUTH-03 Forgot password → reset via token/OTP
- AUTH-04 Change password (logged-in)
- AUTH-05 Roles: admin, teacher, student, parent (enum, fixed in Phase 1)
- AUTH-06 Role-based route guard on every endpoint (matrix in PRD.md)
- AUTH-07 JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- AUTH-08 Login history log (user, ip, time)

### M2 STU — Student Management
- STU-01 Add student (manual form)
- STU-02 Edit student
- STU-03 Profile fields: name, photo, dob, gender, phone, address, admission_no (auto), admitted_on
- STU-04 Status: active / left / suspended / completed
- STU-05 Link 1+ parents (guardians) with relation
- STU-06 Assign to class + batch (capacity check)
- STU-07 Move student to another batch (history kept)
- STU-08 Promote student to next class (bulk supported)
- STU-09 Student list + filters (class, batch, status, search)
- STU-10 Student 360 view: attendance summary, fee summary, results, homework, remarks
- STU-11 Teacher/admin remarks on student (append-only notes)

### M3 PAR — Parent Access
- PAR-01 Add/edit parent (auto login account on student admission)
- PAR-02 One parent ↔ many students
- PAR-03 Parent login (same AUTH module)
- PAR-04 View child attendance
- PAR-05 View child fee status & payment history
- PAR-06 View child published results
- PAR-07 View child homework & materials
- PAR-08 Receive notifications: absence, late, fee due, fee paid, announcement, result published
- PAR-09 Message teacher/admin (thread per child)

### M4 TCH — Teacher Management
- TCH-01 Add/edit teacher profile (qualification, joined_on)
- TCH-02 Assign subjects to teacher
- TCH-03 Assign batches to teacher
- TCH-04 Teacher login
- TCH-05 View assigned batches + enrolled student list
- TCH-06 View own timetable
- TCH-07 Mark/edit attendance for own batches only
- TCH-08 Create homework for own batches only
- TCH-09 Enter/edit marks for own tests only
- TCH-10 Upload study materials for own batches
- TCH-11 Message parents/students of own batches
- TCH-12 Leave request → admin approve/reject

### M5 ACA — Academic Structure
- ACA-01 Classes CRUD (e.g., Class 8, Class 9, JEE Batch)
- ACA-02 Batches CRUD: name, class, days, start/end time, capacity, teacher
- ACA-03 Subjects CRUD
- ACA-04 Attach subjects to batch + assign teacher (batch_subjects)
- ACA-05 Enforce batch capacity on enrollment
- ACA-06 Deactivate batch (soft) without deleting data

### M6 ATT — Attendance
- ATT-01 Mark attendance per batch + date
- ATT-02 Statuses: present / absent / late / leave
- ATT-03 Bulk mark: "mark all present" then adjust exceptions
- ATT-04 Edit attendance (teacher own batch; admin any) → writes audit log
- ATT-05 Remark per student-day (optional)
- ATT-06 Lock editing after N days (configurable in settings)
- ATT-07 Reports: student-wise monthly, batch-wise daily, absentees list, low-attendance list
- ATT-08 Auto-notify parent on absent/late (notification row)
- ATT-09 Monthly attendance summary notification to parent

### M7 LV — Leave
- LV-01 Leave request by student or parent (dates + reason)
- LV-02 Approve/reject by teacher (own batch) or admin
- LV-03 Statuses: pending / approved / rejected
- LV-04 Approved leave auto-marks attendance status = leave for those dates
- LV-05 Leave history per student
- LV-06 Teacher leave request + admin approval (TCH-12)

### M8 TT — Timetable
- TT-01 Create weekly slots per batch: day, start/end, subject, teacher
- TT-02 Conflict check: same teacher overlapping slot in another batch → block
- TT-03 View timetable: by batch (student/parent), by teacher
- TT-04 Edit slot + notify affected batch
- TT-05 Substitute teacher on a slot (one-off override with date)

### M9 HW — Homework
- HW-01 Create: title, description, batch, subject, due_date
- HW-02 Optional file attachment
- HW-03 Student/parent view list (pending/done)
- HW-04 Mark student status: pending / completed (teacher)
- HW-05 Notify students+parents on new homework
- HW-06 History per batch

### M10 SM — Study Materials
- SM-01 Upload file or link: title, batch, subject
- SM-02 Student/parent view + download
- SM-03 Teacher edits/deletes own materials
- SM-04 List per batch/subject

### M11 EX — Tests & Results
- EX-01 Create test: title, batch, subject, date, max_marks, pass_marks
- EX-02 Enter marks per student
- EX-03 Edit marks (until published)
- EX-04 Auto status: pass / fail (marks >= pass_marks)
- EX-05 Teacher remark per student
- EX-06 Publish test → visible to student/parent + notification
- EX-07 Student view: own marks per test, history
- EX-08 Batch report: all students' marks for a test
- EX-09 Simple progress summary per student (tests + attendance %)

### M12 FEE — Fee Management
- FEE-01 Fee structures per class/batch: type (admission/tuition/exam/material/misc), amount, frequency (one_time/monthly)
- FEE-02 Assign fee plan to student: monthly_amount, discount, due_day; custom override allowed
- FEE-03 Generate monthly invoice per student (auto job or manual button): period, net amount, due_date, status
- FEE-04 Invoice statuses: unpaid / partial / paid
- FEE-05 Record payment: amount, method (cash/upi/bank/card/cheque), note
- FEE-06 Partial & advance payments supported (advance adjusts next invoice)
- FEE-07 Auto receipt_no (format from settings), payment confirmation notification
- FEE-08 Student fee ledger: invoices + payments history
- FEE-09 Pending/overdue calculation (due_date < today AND balance > 0)
- FEE-10 Defaulters list (students with overdue)
- FEE-11 Fee due reminder notification (manual trigger + optional daily job)
- FEE-12 Reports: daily collection, monthly collection, method-wise, pending summary
- FEE-13 Only admin (and accountant later) can record/edit payments; teacher read-only none

### M13 INQ — Inquiry & Admission
- INQ-01 Add inquiry: name, phone, interested class, source, date
- INQ-02 Follow-up date + notes (multiple follow-ups)
- INQ-03 Statuses: new / contacted / interested / demo / admitted / not_interested
- INQ-04 Convert to student → opens admission with fields prefilled
- INQ-05 Inquiry list + filters by status/source

### M14 COM — Communication
- COM-01 Announcements: title, body, audience (all/students/parents/teachers/specific batch)
- COM-02 In-app notification center per user (from ATT, FEE, EX, HW, COM events)
- COM-03 Read/unread, mark all read
- COM-04 Direct messages: teacher↔parent, admin↔any (thread view)
- COM-05 (Phase 2) Email/SMS/WhatsApp adapters — same notification table

### M15 DASH — Dashboards (data only, design separate)
- DASH-01 Admin: totals (students/teachers/batches), today attendance %, today+month collection, pending fees, defaulters count, new inquiries, upcoming tests
- DASH-02 Teacher: today's slots, own batches, pending tasks (attendance not marked, marks not entered)
- DASH-03 Student: attendance %, pending homework, upcoming tests, fee status, latest announcements
- DASH-04 Parent: same as student per child (child switcher)

### M16 REP — Reports (export CSV in Phase 1)
- REP-01 Students: list by class/batch/status, new admissions in range, left students
- REP-02 Attendance: daily by batch, monthly by student, absentees, low attendance (<75%)
- REP-03 Fees: collection in range, pending, defaulters, student ledger, method-wise
- REP-04 Academic: test result by batch, student progress summary

### M17 SYS — Settings & Audit
- SYS-01 Academy profile: name, phone, address, logo (for receipts later)
- SYS-02 Academic session (year) label
- SYS-03 Attendance lock days, receipt no format, due reminder toggle
- SYS-04 Notification channel toggles
- SYS-05 Audit log: every create/update/delete on students, attendance, fees, marks, settings (user, action, before/after, time)
- SYS-06 Login history view (admin)

### M18 MOB — Mobile Readiness (non-negotiable from day 1)
- MOB-01 Every feature above exposed via REST `/api/v1/*`
- MOB-02 Frontend consumes ONLY the API (no direct DB access)
- MOB-03 JWT auth usable by mobile unchanged
- MOB-04 Notifications stored in DB → push-ready later

## 3. PHASE MAPPING (see ROADMAP.md for dates/checklists)
- Phase 1: AUTH, ACA, STU, PAR, TCH, INQ
- Phase 2: ATT, LV, TT
- Phase 3: FEE
- Phase 4: HW, SM, EX
- Phase 5: COM, DASH, REP, SYS
- Phase 6: Hardening + audit + CSV exports
- Phase 7: Supabase migration (DEPLOYMENT.md)