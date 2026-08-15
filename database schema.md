# DATABASE SCHEMA (PostgreSQL — works local & Supabase unchanged)
Enums stored as TEXT + CHECK for portability. All FKs indexed.

users(id UUID PK, role CHECK(admin,teacher,student,parent), full_name, email UQ NULL,
 phone UQ NULL, password_hash, is_active BOOL, created_at, updated_at)
refresh_tokens(id, user_id FK, token_hash, expires_at, revoked_at NULL)
login_logs(id, user_id FK, ip, user_agent, created_at)

classes(id, name UQ, is_active)
subjects(id, name, code)
batches(id, class_id FK, name, teacher_id FK users NULL, days TEXT "MON,WED", start_time,
 end_time, capacity INT, is_active)
batch_subjects(batch_id FK, subject_id FK, teacher_id FK, PK(batch_id,subject_id))

students(id, user_id FK NULL, admission_no UQ, full_name, phone, email NULL, dob, gender,
 address, photo_url, admitted_on, status CHECK(active,left,suspended,completed),
 class_id FK, created_at)
student_guardians(student_id FK, user_id FK, relation, PK(student_id,user_id))
enrollments(id, student_id FK, batch_id FK, enrolled_on, status CHECK(active,removed),
 UQ(student_id,batch_id))  -- idx(batch_id)

attendance(id, batch_id FK, student_id FK, date DATE, status CHECK(present,absent,late,leave),
 remark NULL, marked_by FK, UQ(batch_id,student_id,date))  -- idx(date), idx(batch_id,date)

leaves(id, student_id FK, requester_id FK, from_date, to_date, reason,
 status CHECK(pending,approved,rejected), decided_by NULL, decided_at)

timetable_slots(id, batch_id FK, day INT 0-6, start_time, end_time, subject_id FK, teacher_id FK)
slot_overrides(id, slot_id FK, date DATE, substitute_teacher_id FK)  -- TT-05

homework(id, batch_id FK, subject_id FK, teacher_id FK, title, description, due_date,
 attachment_url NULL, created_at)
homework_status(homework_id FK, student_id FK, status CHECK(pending,completed), PK both)

study_materials(id, batch_id FK, subject_id FK, teacher_id FK, title, file_url, created_at)

tests(id, batch_id FK, subject_id FK, title, exam_date, max_marks, pass_marks,
 is_published BOOL)
test_marks(test_id FK, student_id FK, marks, remark NULL, PK both)

fee_structures(id, class_id FK NULL, batch_id FK NULL,
 fee_type CHECK(admission,tuition,exam,material,misc), amount, frequency CHECK(one_time,monthly))
student_fee_plans(student_id PK FK, monthly_amount, discount, due_day INT, notes)
fee_invoices(id, student_id FK, period "YYYY-MM", amount, discount, net_amount, due_date,
 status CHECK(unpaid,partial,paid), UQ(student_id,period))
fee_payments(id, invoice_id FK NULL, student_id FK, amount,
 method CHECK(cash,upi,bank,card,cheque), receipt_no UQ, note NULL, paid_at, recorded_by FK)

announcements(id, title, body, audience CHECK(all,students,parents,teachers,batch),
 batch_id NULL, created_by, created_at)
notifications(id, user_id FK, type, title, body, ref_type NULL, ref_id NULL, is_read BOOL, created_at)
  -- idx(user_id,is_read)
messages(id, sender_id FK, receiver_id FK, student_context_id FK NULL, body, is_read, created_at)

inquiries(id, name, phone, class_interest, source, status CHECK(new,contacted,interested,
 demo,admitted,not_interested), follow_up_on, notes, created_at)

audit_logs(id, user_id FK, action, entity, entity_id, changes JSONB, created_at)
app_settings(key PK, value JSONB)