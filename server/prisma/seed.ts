import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Precomputed verified bcrypt hashes (cost factor 10) to avoid CPU starvation
const HASHES = {
  admin: '$2a$10$qKqE.eiUvb4WZ5/b31aMDuETmFzkXZv8p7itehmhSTUUDUd5pjZhm',
  teacher: '$2a$10$BcyDci9BnysT92xt06zTj.j7vbxEeKEAX4CGCJtleXhyO7Lj9hjhO',
  student: '$2a$10$KX9nrEw7H8v8vLivZs8G7.n.V6RXn9Hf67s9Cpvlfy1QabCFgGn.G',
  superadmin: '$2a$10$sglf/t8oMIY7f3RcJb0apu8WP9OoW/4jngyoHwlpPM1S8AePe2r.C',
  domestic: '$2a$10$qKqE.eiUvb4WZ5/b31aMDuETmFzkXZv8p7itehmhSTUUDUd5pjZhm'
};

const CANONICAL_MODULES = [
  'students', 'teachers', 'batches', 'subjects', 'attendance',
  'fees', 'exams', 'homework', 'timetable', 'crm',
  'announcements', 'whatsapp', 'settings', 'staff_types',
  'staff_portal', 'analytics', 'reports'
];

async function cleanAndSeed() {
  console.log('🧹 [1/3] Clearing all bloated seed data from database...');

  // Delete in order of child-to-parent dependencies
  await prisma.expense.deleteMany({});
  await prisma.staffSalaryDisbursement.deleteMany({});
  await prisma.conductLog.deleteMany({});
  await prisma.whatsAppLog.deleteMany({});
  await prisma.whatsAppTemplate.deleteMany({});
  await prisma.inquiryFollowUp.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.testMark.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.homeworkSubmission.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.studyMaterial.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.studentInstallmentSchedule.deleteMany({});
  await prisma.studentFeePlan.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.batchSubstitute.deleteMany({});
  await prisma.batchWaitlist.deleteMany({});
  await prisma.batchSubject.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.parentStudent.deleteMany({});
  await prisma.studentStatusHistory.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.staffSalaryPayment.deleteMany({});
  await prisma.payrollBatch.deleteMany({});
  await prisma.staffSalaryAdjustment.deleteMany({});
  await prisma.payrollComponentTag.deleteMany({});
  await prisma.salaryHead.deleteMany({});
  await prisma.staffSalaryStructure.deleteMany({});
  await prisma.staffLeaveRequest.deleteMany({});
  await prisma.staffDocument.deleteMany({});
  await prisma.staffAttendance.deleteMany({});
  await prisma.campusGeofence.deleteMany({});
  await prisma.staffPermission.deleteMany({});
  await prisma.staffMember.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.staffType.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.loginLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.academy.deleteMany({});

  console.log('✅ Database completely clean and empty.');
  console.log('🌱 [2/3] Seeding exactly 3-4 pristine records per module...');

  // 1. ACADEMIES (3 records: 1 Active Default, 1 Active Trial, 1 Expired Trial)
  const defaultAcademy = await prisma.academy.create({
    data: {
      id: 'default-academy-id',
      name: 'Apex International Academy',
      slug: 'apex-academy',
      phone: '+923000000001',
      email: 'info@apexacademy.edu',
      address: 'Main Campus, Gulberg III, Lahore',
      subscription_status: 'active',
      trial_started_at: new Date(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_active: true
    }
  });

  await prisma.academy.create({
    data: {
      id: 'beaconhouse-academy-id',
      name: 'Beaconhouse Cambridge Institute',
      slug: 'beaconhouse-cambridge',
      phone: '+923000000002',
      email: 'admissions@beaconhouse.edu',
      address: 'Clifton Block 5, Karachi',
      subscription_status: 'trial',
      trial_started_at: new Date(),
      trial_ends_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      is_active: true
    }
  });

  await prisma.academy.create({
    data: {
      id: 'horizon-grammar-id',
      name: 'Horizon Grammar School',
      slug: 'horizon-grammar',
      phone: '+923000000003',
      email: 'office@horizongrammar.edu',
      address: 'F-8/2 Markaz, Islamabad',
      subscription_status: 'expired',
      trial_started_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      trial_ends_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      is_active: true
    }
  });
  console.log('✅ 3 Academies created');

  // 2. STAFF TYPES & RBAC
  const adminType = await prisma.staffType.create({
    data: {
      name: 'Administrative Staff',
      slug: 'admin',
      code: 'ADM',
      description: 'System administrators with full privileges',
      is_system: true,
      is_system_default: true,
      is_active: true,
      base_permissions: Object.fromEntries(CANONICAL_MODULES.map(m => [m, { access_level: 'editable', is_global_scope: true }]))
    }
  });

  const facultyType = await prisma.staffType.create({
    data: {
      name: 'Teaching Faculty',
      slug: 'faculty',
      code: 'FAC',
      description: 'Academic teachers and lecturers',
      is_system: true,
      is_system_default: true,
      is_active: true,
      base_permissions: {
        students: { access_level: 'view_only', is_global_scope: false },
        teachers: { access_level: 'view_only', is_global_scope: false },
        batches: { access_level: 'view_only', is_global_scope: false },
        subjects: { access_level: 'view_only', is_global_scope: false },
        attendance: { access_level: 'editable', is_global_scope: false },
        fees: { access_level: 'hidden', is_global_scope: false },
        exams: { access_level: 'editable', is_global_scope: false },
        homework: { access_level: 'editable', is_global_scope: false },
        timetable: { access_level: 'view_only', is_global_scope: false },
        crm: { access_level: 'hidden', is_global_scope: false },
        announcements: { access_level: 'view_only', is_global_scope: false },
        whatsapp: { access_level: 'hidden', is_global_scope: false },
        settings: { access_level: 'hidden', is_global_scope: false },
        staff_types: { access_level: 'hidden', is_global_scope: false },
        staff_portal: { access_level: 'editable', is_global_scope: false },
        analytics: { access_level: 'hidden', is_global_scope: false },
        reports: { access_level: 'hidden', is_global_scope: false }
      }
    }
  });

  const domesticType = await prisma.staffType.create({
    data: {
      name: 'Domestic Staff',
      slug: 'domestic-staff',
      code: 'DOM',
      description: 'Support and maintenance staff',
      is_system: true,
      is_system_default: true,
      is_active: true,
      base_permissions: Object.fromEntries(CANONICAL_MODULES.map(m => [m, { access_level: m === 'staff_portal' ? 'editable' : 'hidden', is_global_scope: false }]))
    }
  });
  console.log('✅ 3 Staff Types created');

  // 3. USERS (Super Admin, Academy Admin, 3 Teachers, 1 Domestic Staff)
  await prisma.user.create({
    data: {
      role: 'super_admin',
      full_name: 'Platform Super Admin',
      username: 'superadmin',
      email: 'superadmin@academiapro.io',
      phone: '+923009999999',
      password_hash: HASHES.superadmin,
      must_change_password: false,
      is_active: true,
      academy_id: null
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      role: 'admin',
      full_name: 'Academy Administrator',
      username: 'admin',
      email: 'admin@academiapro.edu',
      phone: '+923000000001',
      password_hash: HASHES.admin,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });

  await prisma.staffMember.create({
    data: {
      user_id: adminUser.id,
      staff_id: 'ADM-2026-001',
      full_name: 'Academy Administrator',
      email: 'admin@academiapro.edu',
      phone: '+923000000001',
      gender: 'Male',
      role: 'admin',
      designation: 'Head of Academy',
      status: 'active',
      staff_type_id: adminType.id,
      password_hash: HASHES.admin,
      temp_password_plain: 'admin',
      is_password_changed: true,
      base_salary: 120000,
      payment_method: 'bank_transfer'
    }
  });

  // Teacher 1: Prof. Tariq Mahmood (Mathematics)
  const teacherUser1 = await prisma.user.create({
    data: {
      role: 'faculty',
      full_name: 'Prof. Tariq Mahmood',
      username: 'teacher',
      email: 'teacher@academiapro.edu',
      phone: '+923011111111',
      password_hash: HASHES.teacher,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const teacher1 = await prisma.teacher.create({
    data: { user_id: teacherUser1.id, qualification: 'M.Sc. Mathematics, Senior Faculty Specialist' }
  });
  await prisma.staffMember.create({
    data: {
      user_id: teacherUser1.id,
      teacher_id: teacher1.id,
      staff_id: 'FAC-2026-001',
      full_name: 'Prof. Tariq Mahmood',
      email: 'teacher@academiapro.edu',
      phone: '+923011111111',
      gender: 'Male',
      role: 'faculty',
      designation: 'Senior Mathematics Specialist',
      qualification: 'M.Sc. Mathematics',
      status: 'active',
      staff_type_id: facultyType.id,
      password_hash: HASHES.teacher,
      temp_password_plain: 'teacher123',
      is_password_changed: true,
      base_salary: 65000,
      payment_method: 'bank_transfer'
    }
  });

  // Teacher 2: Ms. Sarah Jenkins (Physics)
  const teacherUser2 = await prisma.user.create({
    data: {
      role: 'faculty',
      full_name: 'Ms. Sarah Jenkins',
      username: 'sarah.jenkins',
      email: 'sarah.jenkins@academiapro.edu',
      phone: '+923012222222',
      password_hash: HASHES.teacher,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const teacher2 = await prisma.teacher.create({
    data: { user_id: teacherUser2.id, qualification: 'M.Phil. Physics, Senior Lecturer' }
  });
  await prisma.staffMember.create({
    data: {
      user_id: teacherUser2.id,
      teacher_id: teacher2.id,
      staff_id: 'FAC-2026-002',
      full_name: 'Ms. Sarah Jenkins',
      email: 'sarah.jenkins@academiapro.edu',
      phone: '+923012222222',
      gender: 'Female',
      role: 'faculty',
      designation: 'Senior Physics Lecturer',
      qualification: 'M.Phil. Physics',
      status: 'active',
      staff_type_id: facultyType.id,
      password_hash: HASHES.teacher,
      temp_password_plain: 'teacher123',
      is_password_changed: true,
      base_salary: 60000,
      payment_method: 'bank_transfer'
    }
  });

  // Teacher 3: Dr. Ahmed Khan (Chemistry)
  const teacherUser3 = await prisma.user.create({
    data: {
      role: 'faculty',
      full_name: 'Dr. Ahmed Khan',
      username: 'ahmed.khan',
      email: 'ahmed.khan@academiapro.edu',
      phone: '+923013333333',
      password_hash: HASHES.teacher,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const teacher3 = await prisma.teacher.create({
    data: { user_id: teacherUser3.id, qualification: 'Ph.D. Organic Chemistry' }
  });
  await prisma.staffMember.create({
    data: {
      user_id: teacherUser3.id,
      teacher_id: teacher3.id,
      staff_id: 'FAC-2026-003',
      full_name: 'Dr. Ahmed Khan',
      email: 'ahmed.khan@academiapro.edu',
      phone: '+923013333333',
      gender: 'Male',
      role: 'faculty',
      designation: 'Head of Chemistry Dept',
      qualification: 'Ph.D. Organic Chemistry',
      status: 'active',
      staff_type_id: facultyType.id,
      password_hash: HASHES.teacher,
      temp_password_plain: 'teacher123',
      is_password_changed: true,
      base_salary: 75000,
      payment_method: 'bank_transfer'
    }
  });

  // Support Staff: Mr. Rafiq Ahmed
  const domesticUser = await prisma.user.create({
    data: {
      role: 'staff',
      full_name: 'Mr. Rafiq Ahmed',
      username: 'domestic',
      email: 'domestic@academiapro.edu',
      phone: '+923033333333',
      password_hash: HASHES.domestic,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  await prisma.staffMember.create({
    data: {
      user_id: domesticUser.id,
      staff_id: 'DOM-2026-001',
      full_name: 'Mr. Rafiq Ahmed',
      email: 'domestic@academiapro.edu',
      phone: '+923033333333',
      gender: 'Male',
      role: 'domestic',
      designation: 'Campus Operations & Security Officer',
      qualification: 'Intermediate',
      status: 'active',
      staff_type_id: domesticType.id,
      password_hash: HASHES.domestic,
      temp_password_plain: 'staff123',
      is_password_changed: true,
      base_salary: 35000,
      payment_method: 'cash'
    }
  });
  console.log('✅ 4 Staff Members & 3 Faculty records created');

  // 4. CLASSES (4 records)
  const classG9 = await prisma.class.create({ data: { name: 'Grade 9', is_active: true } });
  const classG10 = await prisma.class.create({ data: { name: 'Grade 10', is_active: true } });
  const classG11 = await prisma.class.create({ data: { name: 'Grade 11 - Pre-Engineering', is_active: true } });
  const classG12 = await prisma.class.create({ data: { name: 'Grade 12 - Pre-Medical', is_active: true } });
  console.log('✅ 4 Classes created');

  // 5. SUBJECTS (4 records)
  const subMath = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH-10' } });
  const subPhy = await prisma.subject.create({ data: { name: 'Physics', code: 'PHY-10' } });
  const subChem = await prisma.subject.create({ data: { name: 'Chemistry', code: 'CHEM-10' } });
  const subEng = await prisma.subject.create({ data: { name: 'English Literature', code: 'ENG-10' } });
  console.log('✅ 4 Subjects created');

  // 6. BATCHES (4 records)
  const batch1 = await prisma.batch.create({
    data: {
      name: 'Grade 10 - Section A',
      class_id: classG10.id,
      teacher_id: teacher1.id,
      start_time: '09:00',
      end_time: '10:30',
      room: 'Room 101',
      capacity: 35,
      is_active: true,
      course_type: 'regular',
      total_fee: 12000
    }
  });

  const batch2 = await prisma.batch.create({
    data: {
      name: 'Grade 10 - Section B',
      class_id: classG10.id,
      teacher_id: teacher2.id,
      start_time: '10:45',
      end_time: '12:15',
      room: 'Room 102',
      capacity: 30,
      is_active: true,
      course_type: 'regular',
      total_fee: 12000
    }
  });

  const batch3 = await prisma.batch.create({
    data: {
      name: 'Grade 9 - Section A',
      class_id: classG9.id,
      teacher_id: teacher3.id,
      start_time: '09:00',
      end_time: '10:30',
      room: 'Room 103',
      capacity: 25,
      is_active: true,
      course_type: 'regular',
      total_fee: 10000
    }
  });

  const batch4 = await prisma.batch.create({
    data: {
      name: 'Grade 11 - Evening Advanced',
      class_id: classG11.id,
      teacher_id: teacher1.id,
      start_time: '17:00',
      end_time: '18:30',
      room: 'Room 201',
      capacity: 20,
      is_active: true,
      course_type: 'crash',
      total_fee: 15000
    }
  });

  // BatchSubject mappings
  await prisma.batchSubject.createMany({
    data: [
      { batch_id: batch1.id, subject_id: subMath.id, teacher_id: teacher1.id },
      { batch_id: batch2.id, subject_id: subPhy.id, teacher_id: teacher2.id },
      { batch_id: batch3.id, subject_id: subChem.id, teacher_id: teacher3.id },
      { batch_id: batch4.id, subject_id: subMath.id, teacher_id: teacher1.id }
    ]
  });
  console.log('✅ 4 Batches created');

  // 7. STUDENTS (4 records)
  // Student 1: Hamza Tariq (The Demo Student)
  const studentUser1 = await prisma.user.create({
    data: {
      role: 'student',
      full_name: 'Hamza Tariq',
      username: 'demo.student',
      email: 'demo.student@academiapro.edu',
      phone: '+923001234567',
      password_hash: HASHES.student,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const student1 = await prisma.student.create({
    data: {
      user_id: studentUser1.id,
      admission_no: 'ADM-2026-DEMO',
      full_name: 'Hamza Tariq',
      phone: '+923001234567',
      email: 'demo.student@academiapro.edu',
      gender: 'Male',
      class_id: classG10.id,
      status: 'active',
      custom_fields: { parentName: 'Tariq Mahmood' }
    }
  });

  // Student 2: Zaid Khan
  const studentUser2 = await prisma.user.create({
    data: {
      role: 'student',
      full_name: 'Zaid Khan',
      username: 'zaid.khan',
      email: 'zaid.khan@student.edu',
      phone: '+923001234568',
      password_hash: HASHES.student,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const student2 = await prisma.student.create({
    data: {
      user_id: studentUser2.id,
      admission_no: 'ADM-2026-001',
      full_name: 'Zaid Khan',
      phone: '+923001234568',
      email: 'zaid.khan@student.edu',
      gender: 'Male',
      class_id: classG10.id,
      status: 'active',
      custom_fields: { parentName: 'Javed Khan' }
    }
  });

  // Student 3: Ayesha Siddiqui
  const studentUser3 = await prisma.user.create({
    data: {
      role: 'student',
      full_name: 'Ayesha Siddiqui',
      username: 'ayesha.s',
      email: 'ayesha.s@student.edu',
      phone: '+923001234569',
      password_hash: HASHES.student,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const student3 = await prisma.student.create({
    data: {
      user_id: studentUser3.id,
      admission_no: 'ADM-2026-002',
      full_name: 'Ayesha Siddiqui',
      phone: '+923001234569',
      email: 'ayesha.s@student.edu',
      gender: 'Female',
      class_id: classG10.id,
      status: 'active',
      custom_fields: { parentName: 'Siddiqui Ahmed' }
    }
  });

  // Student 4: Bilal Ahmed
  const studentUser4 = await prisma.user.create({
    data: {
      role: 'student',
      full_name: 'Bilal Ahmed',
      username: 'bilal.a',
      email: 'bilal.a@student.edu',
      phone: '+923001234570',
      password_hash: HASHES.student,
      must_change_password: false,
      is_active: true,
      academy_id: defaultAcademy.id
    }
  });
  const student4 = await prisma.student.create({
    data: {
      user_id: studentUser4.id,
      admission_no: 'ADM-2026-003',
      full_name: 'Bilal Ahmed',
      phone: '+923001234570',
      email: 'bilal.a@student.edu',
      gender: 'Male',
      class_id: classG10.id,
      status: 'active',
      custom_fields: { parentName: 'Tanveer Ahmed' }
    }
  });
  console.log('✅ 4 Students created');

  // 8. ENROLLMENTS (4 records: 3 in Grade 10-A, 1 in Grade 10-B)
  await prisma.enrollment.createMany({
    data: [
      { student_id: student1.id, batch_id: batch1.id, status: 'active' },
      { student_id: student2.id, batch_id: batch1.id, status: 'active' },
      { student_id: student3.id, batch_id: batch1.id, status: 'active' },
      { student_id: student4.id, batch_id: batch2.id, status: 'active' }
    ]
  });
  console.log('✅ 4 Enrollments created');

  // 9. TIMETABLE SLOTS (4 records)
  await prisma.timetableSlot.createMany({
    data: [
      {
        batch_id: batch1.id,
        subject_id: subMath.id,
        teacher_id: teacher1.id,
        day: 'Monday',
        start_time: '09:00',
        end_time: '10:30',
        room: 'Room 101',
        topic: 'Quadratic Equations & Factors'
      },
      {
        batch_id: batch1.id,
        subject_id: subMath.id,
        teacher_id: teacher1.id,
        day: 'Wednesday',
        start_time: '09:00',
        end_time: '10:30',
        room: 'Room 101',
        topic: 'Trigonometric Identities'
      },
      {
        batch_id: batch2.id,
        subject_id: subPhy.id,
        teacher_id: teacher2.id,
        day: 'Tuesday',
        start_time: '10:45',
        end_time: '12:15',
        room: 'Room 102',
        topic: 'Kinematics & Vector Laws'
      },
      {
        batch_id: batch3.id,
        subject_id: subChem.id,
        teacher_id: teacher3.id,
        day: 'Thursday',
        start_time: '09:00',
        end_time: '10:30',
        room: 'Room 103',
        topic: 'Periodic Trends & Elements'
      }
    ]
  });
  console.log('✅ 4 Timetable Slots created');

  // 10. ATTENDANCE (4 records for today)
  const todayStr = new Date().toISOString().split('T')[0];
  await prisma.attendance.createMany({
    data: [
      { batch_id: batch1.id, student_id: student1.id, date: todayStr, status: 'present', marked_by: 'Prof. Tariq Mahmood' },
      { batch_id: batch1.id, student_id: student2.id, date: todayStr, status: 'present', marked_by: 'Prof. Tariq Mahmood' },
      { batch_id: batch1.id, student_id: student3.id, date: todayStr, status: 'late', marked_by: 'Prof. Tariq Mahmood', remark: 'Arrived 10 mins late' },
      { batch_id: batch2.id, student_id: student4.id, date: todayStr, status: 'present', marked_by: 'Ms. Sarah Jenkins' }
    ]
  });
  console.log('✅ 4 Attendance records created');

  // 11. FEE INVOICES & PAYMENTS (4 Invoices, 4 Payments)
  const invDueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const invDueDateSoon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const inv1 = await prisma.feeInvoice.create({
    data: {
      student_id: student1.id,
      period: '2026-09',
      amount: 12000,
      discount: 0,
      net_amount: 12000,
      due_date: invDueDate,
      status: 'paid'
    }
  });

  const inv2 = await prisma.feeInvoice.create({
    data: {
      student_id: student2.id,
      period: '2026-09',
      amount: 12000,
      discount: 0,
      net_amount: 12000,
      due_date: invDueDate,
      status: 'partial'
    }
  });

  const inv3 = await prisma.feeInvoice.create({
    data: {
      student_id: student3.id,
      period: '2026-09',
      amount: 12000,
      discount: 2000,
      net_amount: 10000,
      due_date: invDueDateSoon,
      status: 'unpaid'
    }
  });

  const inv4 = await prisma.feeInvoice.create({
    data: {
      student_id: student4.id,
      period: '2026-09',
      amount: 10000,
      discount: 0,
      net_amount: 10000,
      due_date: invDueDate,
      status: 'paid'
    }
  });

  await prisma.feePayment.createMany({
    data: [
      {
        student_id: student1.id,
        invoice_id: inv1.id,
        amount: 12000,
        method: 'cash',
        receipt_no: 'RCP-2026-00001',
        paid_at: new Date(),
        recorded_by: adminUser.id,
        cleared_status: 'cleared'
      },
      {
        student_id: student2.id,
        invoice_id: inv2.id,
        amount: 6000,
        method: 'bank_transfer',
        receipt_no: 'RCP-2026-00002',
        paid_at: new Date(),
        recorded_by: adminUser.id,
        cleared_status: 'cleared',
        note: 'First installment of September fee'
      },
      {
        student_id: student4.id,
        invoice_id: inv4.id,
        amount: 10000,
        method: 'online',
        receipt_no: 'RCP-2026-00003',
        paid_at: new Date(),
        recorded_by: adminUser.id,
        cleared_status: 'cleared'
      },
      {
        student_id: student1.id,
        amount: 2000,
        method: 'cash',
        receipt_no: 'RCP-2026-00004',
        paid_at: new Date(),
        recorded_by: adminUser.id,
        cleared_status: 'cleared',
        note: 'Annual Examination & Lab Fee'
      }
    ]
  });
  console.log('✅ 4 Fee Invoices & 4 Fee Payments created');

  // 12. HOMEWORK (3 records)
  await prisma.homework.createMany({
    data: [
      {
        batch_id: batch1.id,
        subject_id: subMath.id,
        teacher_id: teacher1.id,
        title: 'Quadratic Equations Exercise 3.2',
        description: 'Complete questions 1 to 15 from Chapter 3 on Quadratic Equations.',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        batch_id: batch1.id,
        subject_id: subPhy.id,
        teacher_id: teacher2.id,
        title: 'Newton Laws of Motion Lab Report',
        description: 'Write an experimental summary of friction and acceleration.',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        batch_id: batch2.id,
        subject_id: subChem.id,
        teacher_id: teacher3.id,
        title: 'Covalent & Ionic Bonding Worksheet',
        description: 'Draw Lewis structures for all molecules in Table 4.1.',
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  });
  console.log('✅ 3 Homework records created');

  // 13. TESTS & TEST MARKS (2 Tests, 4 Test Marks)
  const test1 = await prisma.test.create({
    data: {
      batch_id: batch1.id,
      subject_id: subMath.id,
      title: 'Mathematics Mid-Term Assessment',
      exam_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_marks: 100,
      pass_marks: 50
    }
  });

  const test2 = await prisma.test.create({
    data: {
      batch_id: batch1.id,
      subject_id: subPhy.id,
      title: 'Physics Mechanics Quiz',
      exam_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_marks: 50,
      pass_marks: 25
    }
  });

  await prisma.testMark.createMany({
    data: [
      { test_id: test1.id, student_id: student1.id, marks: 94, remark: 'Excellent conceptual grasp and clean derivations.', status: 'scored' },
      { test_id: test1.id, student_id: student2.id, marks: 78, remark: 'Good effort, revise quadratic formula.', status: 'scored' },
      { test_id: test1.id, student_id: student3.id, marks: 88, remark: 'Strong performance across all sections.', status: 'scored' },
      { test_id: test2.id, student_id: student1.id, marks: 46, remark: 'Flawless problem solving in kinematics.', status: 'scored' }
    ]
  });
  console.log('✅ 2 Tests & 4 Marks created');

  // 14. ANNOUNCEMENTS (3 records)
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Semester Mid-Term Examination Schedule Released',
        body: 'All students and faculty are advised to review the mid-term datesheet posted on the notice board.',
        audience: 'all',
        pinned: true,
        urgent: true,
        created_by: adminUser.full_name
      },
      {
        title: 'Campus Science Laboratory Maintenance',
        body: 'The Physics and Chemistry labs will be closed this Friday afternoon for annual calibration.',
        audience: 'students',
        pinned: false,
        urgent: false,
        created_by: adminUser.full_name
      },
      {
        title: 'Annual Mathematics Olympiad 2026 Registrations',
        body: 'Registrations are open for students of Grade 9 to Grade 12 wishing to participate in the National Math Olympiad.',
        audience: 'all',
        pinned: false,
        urgent: false,
        created_by: teacherUser1.full_name
      }
    ]
  });
  console.log('✅ 3 Announcements created');

  // 15. CONDUCT LOGS (3 records)
  await prisma.conductLog.createMany({
    data: [
      {
        student_id: student1.id,
        author_id: adminUser.id,
        author_name: adminUser.full_name,
        author_role: 'admin',
        category: 'commendation',
        severity: 'positive',
        title: 'Mathematics Olympiad Leadership',
        remark: 'Demonstrated outstanding academic leadership and supported peers during preparatory workshops.',
        is_confidential: false,
        is_deleted: false
      },
      {
        student_id: student2.id,
        author_id: teacherUser1.id,
        author_name: teacherUser1.full_name,
        author_role: 'teacher',
        category: 'general',
        severity: 'neutral',
        title: 'Class Participation Advisory',
        remark: 'Student is attentive; advised to maintain consistent homework submissions.',
        is_confidential: false,
        is_deleted: false
      },
      {
        student_id: student3.id,
        author_id: teacherUser1.id,
        author_name: teacherUser1.full_name,
        author_role: 'teacher',
        category: 'general',
        severity: 'neutral',
        title: 'Attendance Advisory',
        remark: 'Parent notified regarding morning arrival punctuality.',
        is_confidential: false,
        is_deleted: false
      }
    ]
  });
  console.log('✅ 3 Conduct Logs created');

  // 16. CRM INQUIRIES (3 records)
  await prisma.inquiry.createMany({
    data: [
      {
        name: 'Danyal Mirza',
        phone: '+923005555501',
        class_interest: 'Grade 10',
        source: 'walk_in',
        status: 'new',
        notes: 'Interested in Science subjects with focus on Mathematics and Physics.',
        parent_name: 'Mirza Salman'
      },
      {
        name: 'Fatima Noor',
        phone: '+923005555502',
        class_interest: 'Grade 11 - Pre-Engineering',
        source: 'referral',
        status: 'contacted',
        notes: 'Seeking admissions for upcoming session. Trial class arranged.',
        parent_name: 'Dr. Noor Ul Huda'
      },
      {
        name: 'Usman Ali',
        phone: '+923005555503',
        class_interest: 'Grade 9',
        source: 'social_media',
        status: 'trial',
        notes: 'Attending trial lectures this week.',
        parent_name: 'Ali Raza'
      }
    ]
  });
  console.log('✅ 3 CRM Inquiries created');

  // 17. EXPENSES (3 records)
  await prisma.expense.createMany({
    data: [
      {
        category: 'Utilities',
        title: 'Campus High-Speed Dedicated Fiber Bill - August 2026',
        amount: 8500,
        expense_date: new Date(),
        payment_method: 'bank_transfer',
        reference_number: 'TXN-FIBER-8821',
        payee_name: 'PTCL Enterprise Services',
        month_period: '2026-08',
        notes: 'Main campus high-speed connectivity'
      },
      {
        category: 'Supplies',
        title: 'Laboratory Glassware & Physics Apparatus Restock',
        amount: 24000,
        expense_date: new Date(),
        payment_method: 'cheque',
        reference_number: 'CHQ-991024',
        payee_name: 'Standard Scientific Supplies',
        month_period: '2026-08',
        notes: 'Equipping new physics lab room 102'
      },
      {
        category: 'Maintenance',
        title: 'Campus Central AC & Power Backup Maintenance',
        amount: 15000,
        expense_date: new Date(),
        payment_method: 'cash',
        reference_number: 'RCP-AC-551',
        payee_name: 'Lahore HVAC Services',
        month_period: '2026-08',
        notes: 'Quarterly preventative maintenance'
      }
    ]
  });
  console.log('✅ 3 Expenses created');

  // 18. APP SETTINGS
  const settings = [
    { key: 'academy_name', value: JSON.stringify('Apex International Academy') },
    { key: 'session_label', value: JSON.stringify('Session 2026-2027') },
    { key: 'receipt_prefix', value: JSON.stringify('REC-2026-') },
    { key: 'attendance_lock_days', value: JSON.stringify(7) }
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }
  console.log('✅ App Settings updated');

  console.log('🎉 [3/3] Pristine clean seed completed successfully! Exactly 3-4 records per module.');
}

cleanAndSeed()
  .catch(err => {
    console.error('❌ Error during clean seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
