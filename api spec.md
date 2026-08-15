# API SPEC — /api/v1 — envelope: { success, data?, error?, meta? }
Errors: 400 validation · 401 unauthenticated · 403 forbidden · 404 not found · 409 business conflict · 500.

## auth [AUTH]
POST /auth/login (email|phone + password) → tokens
POST /auth/refresh · POST /auth/logout · POST /auth/forgot · POST /auth/reset · POST /auth/change-password

## students [STU] roles in PRD matrix
GET /students?class&batch&status&q&page · POST /students · GET /students/:id · PUT /students/:id
POST /students/:id/guardians · POST /students/:id/remarks · GET /students/:id/summary
POST /students/:id/move-batch · POST /students/promote (bulk)

## teachers [TCH]
GET/POST /teachers · GET/PUT /teachers/:id · GET /teachers/:id/batches · POST /teachers/:id/leave

## academic [ACA]
CRUD /classes · CRUD /batches · CRUD /subjects · PUT /batches/:id/subjects (assign teacher+subject)

## attendance [ATT]
GET /attendance?batch&date · POST /attendance/bulk {batch,date,entries[]} · PUT /attendance/:id
GET /reports/attendance/student/:id?month · GET /reports/attendance/batch/:id?month · GET /reports/attendance/absentees

## leave [LV]
POST /leaves · GET /leaves?student&status · PUT /leaves/:id/decision {approve|reject}

## timetable [TT]
GET /timetable/batch/:id · GET /timetable/teacher/:id · POST/PUT/DELETE /timetable/slots · POST /timetable/overrides

## homework [HW] / materials [SM]
POST/GET /homework?batch · PUT /homework/:id · PUT /homework/:id/status {studentId,status}
POST/GET/DELETE /materials?batch

## tests [EX]
POST/GET /tests?batch · PUT /tests/:id · POST /tests/:id/marks (bulk) · POST /tests/:id/publish
GET /students/:id/results · GET /tests/:id/report

## fees [FEE]
CRUD /fee-structures · PUT /students/:id/fee-plan · POST /fees/generate-invoices {month}
GET /fees/invoices?student&status · POST /fees/payments {invoiceId?,amount,method}
GET /students/:id/ledger · GET /fees/defaulters · GET /reports/fees/collection?from&to

## inquiries [INQ]
CRUD /inquiries · POST /inquiries/:id/followup · POST /inquiries/:id/convert

## communication [COM]
POST /announcements · GET /announcements?audience · GET/PUT /notifications (mark read)
GET /messages/:userId · POST /messages

## dashboards [DASH] / reports [REP] / system [SYS]
GET /dashboard (role-aware) · GET /reports/students?... · GET /reports/academic/progress/:studentId
GET/PUT /settings · GET /audit-logs · GET /login-logs   (admin only)