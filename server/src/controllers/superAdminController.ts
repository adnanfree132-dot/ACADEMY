import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest, generateToken, resolveStaffPermissions } from '../auth';

/**
 * Ensures the default primary academy exists and all orphaned users/data link to it.
 * Also ensures the super_admin account is seeded.
 */
export async function ensureDefaultAcademy() {
  try {
    let defaultAcademy = await prisma.academy.findFirst({
      where: {
        OR: [
          { id: 'default-academy-id' },
          { slug: 'apex-academy' }
        ]
      }
    });

    if (!defaultAcademy) {
      defaultAcademy = await prisma.academy.create({
        data: {
          id: 'default-academy-id',
          name: 'Apex International Academy',
          slug: 'apex-academy',
          phone: '+92 300 1234567',
          email: 'admin@apexacademy.edu',
          address: 'Main Campus, Sector F-8, Islamabad',
          subscription_status: 'active',
          trial_started_at: new Date(),
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          is_active: true
        }
      });
      console.log('Created default academy:', defaultAcademy.name);
    }

    // Link unassigned non-super_admin users to the default academy
    await prisma.user.updateMany({
      where: {
        academy_id: null,
        role: { not: 'super_admin' }
      },
      data: {
        academy_id: defaultAcademy.id
      }
    });

    // Ensure Super Admin user exists
    const superAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'super_admin' },
          { username: 'superadmin' },
          { email: 'superadmin@academiapro.io' }
        ]
      }
    });

    if (!superAdmin) {
      const superHash = PRECOMPUTED_HASHES.superadmin;
      await prisma.user.create({
        data: {
          role: 'super_admin',
          full_name: 'Platform Super Admin',
          username: 'superadmin',
          email: 'superadmin@academiapro.io',
          phone: '+923009999999',
          password_hash: superHash,
          must_change_password: false,
          is_active: true,
          academy_id: null
        }
      });
      console.log('Created Platform Super Admin account (superadmin / superadmin123)');
    }

    // Ensure synchronized demo triad: Admin, Teacher (Prof. Tariq Mahmood), and Student (Hamza Tariq)
    await ensureSyncedDemoData(defaultAcademy.id);
  } catch (err) {
    console.error('Error in ensureDefaultAcademy:', err);
  }
}

// Precomputed verified bcrypt hashes to prevent CPU starvation (Error 1102 / 503) on Cloudflare Workers
export const PRECOMPUTED_HASHES = {
  admin: '$2a$10$qKqE.eiUvb4WZ5/b31aMDuETmFzkXZv8p7itehmhSTUUDUd5pjZhm',
  teacher: '$2a$10$BcyDci9BnysT92xt06zTj.j7vbxEeKEAX4CGCJtleXhyO7Lj9hjhO',
  student: '$2a$10$KX9nrEw7H8v8vLivZs8G7.n.V6RXn9Hf67s9Cpvlfy1QabCFgGn.G',
  superadmin: '$2a$10$sglf/t8oMIY7f3RcJb0apu8WP9OoW/4jngyoHwlpPM1S8AePe2r.C'
};

let isDemoDataSynced = false;

/**
 * Ensures the synchronized Demo Triad (Admin, Teacher, Student) exists,
 * strictly linked to the same default Academy, with real active batch assignment,
 * student enrollment, attendance, timetable slots, and fee records.
 */
export async function ensureSyncedDemoData(academyId: string = 'default-academy-id') {
  if (isDemoDataSynced) return;
  try {
    // 1. Staff Types (ADM, FAC)
    let adminType = await prisma.staffType.findFirst({ where: { code: 'ADM' } });
    if (!adminType) {
      adminType = await prisma.staffType.create({
        data: { name: 'Administrative Staff', code: 'ADM', description: 'System administrators with full privileges' }
      });
    }
    let facultyType = await prisma.staffType.findFirst({ where: { code: 'FAC' } });
    const facultyBasePerms = {
      crm: { access_level: 'hidden', is_global_scope: false },
      fees: { access_level: 'hidden', is_global_scope: false },
      exams: { access_level: 'editable', is_global_scope: false },
      batches: { access_level: 'view_only', is_global_scope: false },
      reports: { access_level: 'hidden', is_global_scope: false },
      homework: { access_level: 'editable', is_global_scope: false },
      settings: { access_level: 'hidden', is_global_scope: false },
      students: { access_level: 'view_only', is_global_scope: false },
      subjects: { access_level: 'view_only', is_global_scope: false },
      teachers: { access_level: 'view_only', is_global_scope: false },
      whatsapp: { access_level: 'hidden', is_global_scope: false },
      analytics: { access_level: 'hidden', is_global_scope: false },
      timetable: { access_level: 'view_only', is_global_scope: false },
      attendance: { access_level: 'editable', is_global_scope: false },
      staff_types: { access_level: 'hidden', is_global_scope: false },
      staff_portal: { access_level: 'editable', is_global_scope: false },
      announcements: { access_level: 'view_only', is_global_scope: false }
    };
    if (!facultyType) {
      facultyType = await prisma.staffType.create({
        data: {
          name: 'Teaching Faculty',
          code: 'FAC',
          slug: 'faculty',
          description: 'Academic teachers and lecturers',
          base_permissions: facultyBasePerms
        }
      });
    } else {
      await prisma.staffType.update({
        where: { id: facultyType.id },
        data: { base_permissions: facultyBasePerms }
      });
      await prisma.staffPermission.updateMany({
        where: {
          staff_type_id: facultyType.id,
          module_key: 'teachers'
        },
        data: { access_level: 'view_only' }
      });
    }

    const adminHash = PRECOMPUTED_HASHES.admin;
    const teacherHash = PRECOMPUTED_HASHES.teacher;
    const studentHash = PRECOMPUTED_HASHES.student;

    // 2. Demo Admin User
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@academiapro.edu' },
          { username: 'admin', role: 'admin' }
        ]
      }
    });

    if (adminUser) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          role: 'admin',
          email: 'admin@academiapro.edu',
          username: 'admin',
          full_name: 'Academy Administrator',
          phone: '+923000000001',
          academy_id: academyId,
          password_hash: adminHash,
          must_change_password: false
        }
      });
    } else {
      adminUser = await prisma.user.create({
        data: {
          role: 'admin',
          email: 'admin@academiapro.edu',
          username: 'admin',
          full_name: 'Academy Administrator',
          phone: '+923000000001',
          academy_id: academyId,
          password_hash: adminHash,
          is_active: true,
          must_change_password: false
        }
      });
    }

    // Admin StaffMember
    let adminStaff = await prisma.staffMember.findFirst({
      where: { user_id: adminUser.id }
    });
    if (!adminStaff) {
      const existingAdm = await prisma.staffMember.findUnique({ where: { staff_id: 'ADM-2026-001' } });
      if (existingAdm) {
        await prisma.staffMember.update({
          where: { id: existingAdm.id },
          data: { staff_id: 'ADM-2026-OLD' }
        });
      }
      adminStaff = await prisma.staffMember.create({
        data: {
          user_id: adminUser.id,
          staff_id: 'ADM-2026-001',
          full_name: 'Academy Administrator',
          email: 'admin@academiapro.edu',
          phone: '+923000000001',
          role: 'admin',
          designation: 'Head of Academy',
          status: 'active',
          staff_type_id: adminType.id,
          password_hash: adminHash,
          temp_password_plain: 'admin',
          is_password_changed: true
        }
      });
    } else {
      adminStaff = await prisma.staffMember.update({
        where: { id: adminStaff.id },
        data: {
          staff_id: 'ADM-2026-001',
          full_name: 'Academy Administrator',
          email: 'admin@academiapro.edu',
          phone: '+923000000001',
          role: 'admin',
          designation: 'Head of Academy',
          staff_type_id: adminType?.id,
          password_hash: adminHash,
          temp_password_plain: 'admin',
          is_password_changed: true
        }
      });
    }

    // 3. Demo Teacher User
    let teacherUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'teacher@academiapro.edu' },
          { username: 'teacher' }
        ]
      }
    });

    if (teacherUser) {
      teacherUser = await prisma.user.update({
        where: { id: teacherUser.id },
        data: {
          role: 'teacher',
          email: 'teacher@academiapro.edu',
          username: 'teacher',
          full_name: 'Prof. Tariq Mahmood',
          phone: '+923011111111',
          academy_id: academyId,
          password_hash: teacherHash,
          must_change_password: false
        }
      });
    } else {
      teacherUser = await prisma.user.create({
        data: {
          role: 'teacher',
          email: 'teacher@academiapro.edu',
          username: 'teacher',
          full_name: 'Prof. Tariq Mahmood',
          phone: '+923011111111',
          academy_id: academyId,
          password_hash: teacherHash,
          is_active: true,
          must_change_password: false
        }
      });
    }

    // Teacher record
    let teacher = await prisma.teacher.findFirst({
      where: { user_id: teacherUser.id }
    });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          user_id: teacherUser.id,
          qualification: 'M.Sc. Mathematics, Senior Faculty Specialist'
        }
      });
    } else {
      teacher = await prisma.teacher.update({
        where: { id: teacher.id },
        data: { qualification: 'M.Sc. Mathematics, Senior Faculty Specialist' }
      });
    }

    // Free staff_id FAC-2026-001 if held by another staff
    const existingFac1 = await prisma.staffMember.findUnique({ where: { staff_id: 'FAC-2026-001' } });
    if (existingFac1 && existingFac1.user_id !== teacherUser.id) {
      await prisma.staffMember.update({
        where: { id: existingFac1.id },
        data: { staff_id: 'FAC-2026-999' }
      });
    }

    // Ensure Teacher StaffMember
    let teacherStaff = await prisma.staffMember.findFirst({
      where: { user_id: teacherUser.id }
    });
    if (teacherStaff) {
      teacherStaff = await prisma.staffMember.update({
        where: { id: teacherStaff.id },
        data: {
          staff_id: 'FAC-2026-001',
          teacher_id: teacher.id,
          full_name: 'Prof. Tariq Mahmood',
          email: 'teacher@academiapro.edu',
          phone: '+923011111111',
          role: 'faculty',
          designation: 'Senior Faculty / Mathematics Specialist',
          staff_type_id: facultyType?.id,
          password_hash: teacherHash,
          temp_password_plain: 'teacher123',
          is_password_changed: true
        }
      });
    } else {
      teacherStaff = await prisma.staffMember.create({
        data: {
          user_id: teacherUser.id,
          staff_id: 'FAC-2026-001',
          teacher_id: teacher.id,
          full_name: 'Prof. Tariq Mahmood',
          email: 'teacher@academiapro.edu',
          phone: '+923011111111',
          gender: 'Male',
          role: 'faculty',
          designation: 'Senior Faculty / Mathematics Specialist',
          status: 'active',
          staff_type_id: facultyType.id,
          password_hash: teacherHash,
          temp_password_plain: 'teacher123',
          is_password_changed: true
        }
      });
    }

    // 4. Shared Academic Structure: Class, Subject, Batch
    let demoClass = await prisma.class.findFirst({ where: { name: 'Grade 10' } });
    if (!demoClass) {
      demoClass = await prisma.class.create({ data: { name: 'Grade 10', is_active: true } });
    }

    let demoSubject = await prisma.subject.findFirst({
      where: { OR: [{ code: 'MATH-10' }, { name: 'Mathematics' }] }
    });
    if (!demoSubject) {
      demoSubject = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH-10' } });
    }

    let demoBatch = await prisma.batch.findFirst({ where: { name: 'Grade 10 - Section A' } });
    if (!demoBatch) {
      demoBatch = await prisma.batch.create({
        data: {
          name: 'Grade 10 - Section A',
          class_id: demoClass.id,
          teacher_id: teacher.id,
          start_time: '09:00',
          end_time: '10:30',
          room: 'Room 101',
          capacity: 35,
          is_active: true,
          course_type: 'regular',
          total_fee: 12000
        }
      });
    } else {
      demoBatch = await prisma.batch.update({
        where: { id: demoBatch.id },
        data: {
          class_id: demoClass.id,
          teacher_id: teacher.id,
          is_active: true
        }
      });
    }

    // BatchSubject
    let batchSubject = await prisma.batchSubject.findFirst({
      where: { batch_id: demoBatch.id, subject_id: demoSubject.id }
    });
    if (!batchSubject) {
      await prisma.batchSubject.create({
        data: {
          batch_id: demoBatch.id,
          subject_id: demoSubject.id,
          teacher_id: teacher.id
        }
      });
    } else if (batchSubject.teacher_id !== teacher.id) {
      await prisma.batchSubject.update({
        where: {
          batch_id_subject_id: {
            batch_id: demoBatch.id,
            subject_id: demoSubject.id
          }
        },
        data: { teacher_id: teacher.id }
      });
    }

    // Weekday Timetable slots
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (const day of weekdays) {
      const existing = await prisma.timetableSlot.findFirst({ where: { batch_id: demoBatch.id, day } });
      if (!existing) {
        await prisma.timetableSlot.create({
          data: {
            batch_id: demoBatch.id,
            subject_id: demoSubject.id,
            teacher_id: teacher.id,
            day,
            start_time: '09:00',
            end_time: '10:30',
            room: 'Room 101',
            topic: day === 'Monday' ? 'Quadratic Equations' : day === 'Wednesday' ? 'Trigonometry' : 'Algebraic Functions'
          }
        });
      } else {
        await prisma.timetableSlot.update({
          where: { id: existing.id },
          data: {
            subject_id: demoSubject.id,
            teacher_id: teacher.id,
            room: 'Room 101'
          }
        });
      }
    }

    // 5. Demo Student User
    let studentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo.student@academiapro.edu' },
          { username: 'demo.student' }
        ]
      }
    });

    if (studentUser) {
      studentUser = await prisma.user.update({
        where: { id: studentUser.id },
        data: {
          role: 'student',
          email: 'demo.student@academiapro.edu',
          username: 'demo.student',
          full_name: 'Hamza Tariq',
          phone: '+923001234567',
          academy_id: academyId,
          password_hash: studentHash,
          must_change_password: false
        }
      });
    } else {
      studentUser = await prisma.user.create({
        data: {
          role: 'student',
          email: 'demo.student@academiapro.edu',
          username: 'demo.student',
          full_name: 'Hamza Tariq',
          phone: '+923001234567',
          academy_id: academyId,
          password_hash: studentHash,
          is_active: true,
          must_change_password: false
        }
      });
    }

    // Student record
    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { user_id: studentUser.id },
          { admission_no: 'ADM-2026-DEMO' },
          { email: 'demo.student@academiapro.edu' }
        ]
      }
    });

    if (student) {
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          user_id: studentUser.id,
          admission_no: 'ADM-2026-DEMO',
          full_name: 'Hamza Tariq',
          phone: '+923001234567',
          email: 'demo.student@academiapro.edu',
          class_id: demoClass.id,
          custom_fields: { parentName: 'Tariq Mahmood' }
        }
      });
    } else {
      student = await prisma.student.create({
        data: {
          user_id: studentUser.id,
          admission_no: 'ADM-2026-DEMO',
          full_name: 'Hamza Tariq',
          phone: '+923001234567',
          email: 'demo.student@academiapro.edu',
          class_id: demoClass.id,
          status: 'active',
          custom_fields: { parentName: 'Tariq Mahmood' }
        }
      });
    }

    // 6. Enrollment of Student in Demo Batch
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_batch_id: {
          student_id: student.id,
          batch_id: demoBatch.id
        }
      }
    });
    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          student_id: student.id,
          batch_id: demoBatch.id,
          status: 'active'
        }
      });
    } else if (enrollment.status !== 'active') {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'active' }
      });
    }

    // 7. Fee Plan & Invoice
    let feePlan = await prisma.studentFeePlan.findUnique({ where: { student_id: student.id } });
    if (!feePlan) {
      feePlan = await prisma.studentFeePlan.create({
        data: { student_id: student.id, monthly_amount: 12000, billing_anchor_day: 1 }
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const monthStr = todayStr.slice(0, 7);

    let feeInvoice = await prisma.feeInvoice.findFirst({
      where: { student_id: student.id, period: monthStr }
    });
    if (!feeInvoice) {
      feeInvoice = await prisma.feeInvoice.create({
        data: {
          student_id: student.id,
          period: monthStr,
          amount: 12000,
          discount: 0,
          net_amount: 12000,
          status: 'paid',
          due_date: monthStr + '-10'
        }
      });
      await prisma.feePayment.create({
        data: {
          student_id: student.id,
          invoice_id: feeInvoice.id,
          receipt_no: 'REC-DEMO-' + Date.now().toString().slice(-4),
          amount: 12000,
          method: 'cash',
          cleared_status: 'cleared',
          note: 'Tuition Fee - Verified',
          recorded_by: 'admin'
        }
      });
    }

    // 8. Attendance Record for today
    const att = await prisma.attendance.findUnique({
      where: {
        batch_id_student_id_date: {
          batch_id: demoBatch.id,
          student_id: student.id,
          date: todayStr
        }
      }
    });
    if (!att) {
      await prisma.attendance.create({
        data: {
          batch_id: demoBatch.id,
          student_id: student.id,
          date: todayStr,
          status: 'present',
          marked_by: 'Prof. Tariq Mahmood'
        }
      });
    }

    // 9. Homework & Test
    const hw = await prisma.homework.findFirst({
      where: { batch_id: demoBatch.id, subject_id: demoSubject.id }
    });
    if (!hw) {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await prisma.homework.create({
        data: {
          batch_id: demoBatch.id,
          subject_id: demoSubject.id,
          teacher_id: teacher.id,
          title: 'Quadratic Equations Exercise 3.2',
          description: 'Solve questions 1 through 15 from Chapter 3 on Quadratic Equations.',
          due_date: dueDate
        }
      });
    }

    const test = await prisma.test.findFirst({
      where: { batch_id: demoBatch.id, subject_id: demoSubject.id }
    });
    if (!test) {
      const examDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await prisma.test.create({
        data: {
          batch_id: demoBatch.id,
          subject_id: demoSubject.id,
          title: 'Mathematics Mid-Term Assessment',
          exam_date: examDate,
          max_marks: 100,
          pass_marks: 50
        }
      });
    }

    isDemoDataSynced = true;
    console.log('[SYNC] Synced Demo Triad verified: Admin, Prof. Tariq Mahmood, and Hamza Tariq in Apex International Academy.');
  } catch (syncErr) {
    console.error('Error ensuring synced demo data:', syncErr);
  }
}

/**
 * Helper to slugify an academy name safely
 */
function slugifyAcademy(name: string): string {
  const base = (name || 'academy')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base || 'academy';
}

/**
 * Calculate trial days remaining
 */
function getDaysRemaining(trialEndsAt: Date): number {
  const now = new Date();
  const diffMs = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 1. POST /api/v1/auth/register-academy
 * Self-serve academy registration:
 * - Provisions 30-day free trial (trial_ends_at = now() + 30 days)
 * - Creates Academy record
 * - Creates linked Administrator User
 * - Generates session token and returns complete authenticated vertical slice
 */
export async function registerAcademy(req: Request, res: Response) {
  try {
    const { academyName, adminName, fullName, email, password, phone, address } = req.body;

    const cleanAcademyName = (academyName || '').trim();
    const cleanAdminName = (adminName || fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanAddress = (address || '').trim();

    if (!cleanAcademyName) {
      return sendError(res, 'Academy name is required', 400);
    }
    if (!cleanAdminName) {
      return sendError(res, 'Administrator name is required', 400);
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return sendError(res, 'A valid email address is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    // Check if user email is already registered
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists. Please sign in.', 400);
    }

    // Generate unique slug
    let baseSlug = slugifyAcademy(cleanAcademyName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.academy.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day trial

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Academy
      const academy = await tx.academy.create({
        data: {
          name: cleanAcademyName,
          slug: finalSlug,
          phone: cleanPhone || null,
          email: cleanEmail,
          address: cleanAddress || null,
          subscription_status: 'trial',
          trial_started_at: now,
          trial_ends_at: trialEndsAt,
          is_active: true
        }
      });

      // 2. Create Admin User
      const user = await tx.user.create({
        data: {
          academy_id: academy.id,
          role: 'admin',
          full_name: cleanAdminName,
          email: cleanEmail,
          phone: cleanPhone || null,
          password_hash: passwordHash,
          must_change_password: false,
          is_active: true
        }
      });

      // 3. Set Academy owner
      await tx.academy.update({
        where: { id: academy.id },
        data: { owner_id: user.id }
      });

      return { academy, user };
    });

    const daysLeft = getDaysRemaining(result.academy.trial_ends_at);
    const resolvedPermissions = resolveStaffPermissions('admin', 'ADM');

    const tokenPayload = {
      userId: result.user.id,
      academyId: result.academy.id,
      role: 'admin',
      fullName: result.user.full_name,
      name: result.user.full_name,
      email: result.user.email,
      phone: result.user.phone,
      isPasswordChanged: true,
      permissions: resolvedPermissions
    };

    const token = generateToken(tokenPayload as any);

    const academyData = {
      id: result.academy.id,
      name: result.academy.name,
      slug: result.academy.slug,
      subscriptionStatus: result.academy.subscription_status,
      subscription_status: result.academy.subscription_status,
      trialEndsAt: result.academy.trial_ends_at,
      trial_ends_at: result.academy.trial_ends_at,
      daysLeft,
      daysRemaining: daysLeft,
      isActive: result.academy.is_active
    };

    return sendSuccess(res, {
      token,
      academy: academyData,
      user: {
        id: result.user.id,
        fullName: result.user.full_name,
        name: result.user.full_name,
        email: result.user.email,
        phone: result.user.phone,
        role: 'admin',
        academyId: result.academy.id,
        academy: academyData,
        isPasswordChanged: true,
        is_password_changed: true,
        permissions: resolvedPermissions
      }
    });
  } catch (err: any) {
    console.error('Error registering academy:', err);
    return sendError(res, err.message || 'Academy registration failed', 500);
  }
}

/**
 * 2. GET /api/v1/super-admin/stats
 * Platform overview KPIs for Super Admin:
 * - Total Academies
 * - Active Trials
 * - Expired Trials
 * - Revoked Academies
 * - Total Platform Users & Students
 */
export async function getSuperAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const now = new Date();

    const [
      totalAcademies,
      activeTrials,
      expiredTrials,
      revokedAcademies,
      activeSubscriptions,
      totalUsers,
      totalStudents
    ] = await Promise.all([
      prisma.academy.count(),
      prisma.academy.count({
        where: {
          subscription_status: 'trial',
          trial_ends_at: { gte: now },
          is_active: true
        }
      }),
      prisma.academy.count({
        where: {
          OR: [
            { subscription_status: 'expired' },
            {
              subscription_status: 'trial',
              trial_ends_at: { lt: now }
            }
          ]
        }
      }),
      prisma.academy.count({
        where: {
          OR: [
            { subscription_status: 'revoked' },
            { is_active: false }
          ]
        }
      }),
      prisma.academy.count({
        where: {
          subscription_status: 'active',
          is_active: true
        }
      }),
      prisma.user.count(),
      prisma.student.count()
    ]);

    return sendSuccess(res, {
      totalAcademies,
      activeTrials,
      expiredTrials,
      revokedAcademies,
      activeSubscriptions,
      totalUsers,
      totalStudents
    });
  } catch (err: any) {
    console.error('Error fetching super admin stats:', err);
    return sendError(res, err.message || 'Failed to fetch platform stats', 500);
  }
}

/**
 * 3. GET /api/v1/super-admin/academies
 * Comprehensive academy directory for Super Admin:
 * Lists all academies with owner contact, trial status, days remaining, staff & student counts.
 */
export async function getSuperAdminAcademies(req: AuthenticatedRequest, res: Response) {
  try {
    const academies = await prisma.academy.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          where: { role: 'admin' },
          select: { id: true, full_name: true, email: true, phone: true }
        }
      }
    });

    const now = new Date();

    const academyIds = academies.map(ac => ac.id);
    const users = await prisma.user.findMany({
      where: { academy_id: { in: academyIds } },
      select: {
        id: true,
        academy_id: true,
        students: { select: { id: true } },
        staffMember: { select: { id: true } }
      }
    });

    const statsMap: Record<string, { studentsCount: number; staffCount: number; usersCount: number }> = {};
    for (const ac of academies) {
      statsMap[ac.id] = { studentsCount: 0, staffCount: 0, usersCount: 0 };
    }
    for (const u of users) {
      if (u.academy_id && statsMap[u.academy_id]) {
        statsMap[u.academy_id].usersCount += 1;
        statsMap[u.academy_id].studentsCount += u.students.length;
        if (u.staffMember) {
          statsMap[u.academy_id].staffCount += 1;
        }
      }
    }

    const formatted = academies.map((ac) => {
      const daysRemaining = getDaysRemaining(ac.trial_ends_at);
      const isTrialOver = ac.subscription_status === 'trial' && new Date(ac.trial_ends_at) < now;
      const effectiveStatus = ac.subscription_status === 'revoked' || !ac.is_active
        ? 'revoked'
        : isTrialOver
        ? 'expired'
        : ac.subscription_status;

      const adminUser = ac.users[0] || null;
      const academyStats = statsMap[ac.id] || { studentsCount: 0, staffCount: 0, usersCount: 0 };
      const ownerObj = adminUser ? {
        id: adminUser.id,
        full_name: adminUser.full_name,
        fullName: adminUser.full_name,
        username: adminUser.full_name,
        email: adminUser.email || '',
        phone: adminUser.phone || ''
      } : null;

      return {
        id: ac.id,
        name: ac.name,
        slug: ac.slug,
        logoUrl: ac.logo_url,
        logo_url: ac.logo_url,
        phone: ac.phone,
        email: ac.email,
        address: ac.address,
        subscriptionStatus: effectiveStatus,
        subscription_status: effectiveStatus,
        trialStartedAt: ac.trial_started_at,
        trial_started_at: ac.trial_started_at,
        trialEndsAt: ac.trial_ends_at,
        trial_ends_at: ac.trial_ends_at,
        daysRemaining: effectiveStatus === 'active' ? 999 : daysRemaining,
        days_remaining: effectiveStatus === 'active' ? 999 : daysRemaining,
        isActive: ac.is_active,
        is_active: ac.is_active,
        createdAt: ac.created_at,
        created_at: ac.created_at,
        adminUser: ownerObj,
        owner: ownerObj,
        stats: academyStats
      };
    });

    return sendSuccess(res, formatted);
  } catch (err: any) {
    console.error('Error fetching academies for super admin:', err);
    return sendError(res, err.message || 'Failed to fetch academies directory', 500);
  }
}

/**
 * 4. POST /api/v1/super-admin/academies/:id/extend-trial
 * Direct Super Admin action: Extend trial period by N days or set custom end date.
 */
export async function extendAcademyTrial(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { days, newEndDate } = req.body;

    const academy = await prisma.academy.findUnique({
      where: { id }
    });

    if (!academy) {
      return sendError(res, 'Academy not found', 404);
    }

    let updatedEndDate: Date;

    if (newEndDate) {
      updatedEndDate = new Date(newEndDate);
      if (isNaN(updatedEndDate.getTime())) {
        return sendError(res, 'Invalid end date format', 400);
      }
    } else {
      const extensionDays = parseInt(days as any, 10) || 30;
      const now = new Date();
      // If current trial is in future, add to it; otherwise add from now
      const baseDate = new Date(academy.trial_ends_at) > now ? new Date(academy.trial_ends_at) : now;
      updatedEndDate = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.academy.update({
      where: { id },
      data: {
        trial_ends_at: updatedEndDate,
        subscription_status: 'trial',
        is_active: true
      }
    });

    const daysRemaining = getDaysRemaining(updated.trial_ends_at);

    return sendSuccess(res, {
      id: updated.id,
      name: updated.name,
      subscriptionStatus: updated.subscription_status,
      subscription_status: updated.subscription_status,
      trialEndsAt: updated.trial_ends_at,
      trial_ends_at: updated.trial_ends_at,
      daysRemaining,
      days_remaining: daysRemaining,
      isActive: updated.is_active,
      is_active: updated.is_active,
      message: `Trial successfully extended until ${updated.trial_ends_at.toISOString().split('T')[0]}`
    });
  } catch (err: any) {
    console.error('Error extending trial:', err);
    return sendError(res, err.message || 'Failed to extend trial', 500);
  }
}

/**
 * 5. POST /api/v1/super-admin/academies/:id/revoke
 * Direct Super Admin action: Revoke access or restore revoked academy.
 */
export async function revokeAcademyAccess(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { revoke } = req.body;

    const academy = await prisma.academy.findUnique({
      where: { id }
    });

    if (!academy) {
      return sendError(res, 'Academy not found', 404);
    }

    const shouldRevoke = revoke !== undefined ? Boolean(revoke) : academy.subscription_status !== 'revoked';

    let newStatus = 'trial';
    let newIsActive = true;

    if (shouldRevoke) {
      newStatus = 'revoked';
      newIsActive = false;
    } else {
      // Restoring: check if trial expired or still valid
      const now = new Date();
      if (new Date(academy.trial_ends_at) < now) {
        // give 7 days grace on restoration if already expired
        await prisma.academy.update({
          where: { id },
          data: {
            trial_ends_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      }
      newStatus = 'trial';
      newIsActive = true;
    }

    const updated = await prisma.academy.update({
      where: { id },
      data: {
        subscription_status: newStatus,
        is_active: newIsActive
      }
    });

    const daysRemaining = getDaysRemaining(updated.trial_ends_at);

    return sendSuccess(res, {
      id: updated.id,
      name: updated.name,
      subscriptionStatus: updated.subscription_status,
      subscription_status: updated.subscription_status,
      daysRemaining,
      days_remaining: daysRemaining,
      isActive: updated.is_active,
      is_active: updated.is_active,
      message: shouldRevoke ? 'Academy access has been revoked.' : 'Academy access has been restored.'
    });
  } catch (err: any) {
    console.error('Error modifying academy access:', err);
    return sendError(res, err.message || 'Failed to update academy access', 500);
  }
}
