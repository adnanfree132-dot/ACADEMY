import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const MODULE_KEYS = [
  'students',
  'teachers',
  'batches',
  'subjects',
  'attendance',
  'fees',
  'exams',
  'homework',
  'timetable',
  'crm',
  'announcements',
  'whatsapp',
  'settings',
  'staff_types',
  'staff_portal',
  'analytics',
  'reports'
] as const;

export type ModuleKey = typeof MODULE_KEYS[number];
export type AccessLevel = 'hidden' | 'view_only' | 'editable';

export interface ModulePermissionConfig {
  access_level: AccessLevel;
  is_global_scope: boolean;
}

export const DEFAULT_RBAC_MATRIX: Record<string, Record<ModuleKey, ModulePermissionConfig>> = {
  faculty: {
    students: { access_level: 'view_only', is_global_scope: false },
    teachers: { access_level: 'hidden', is_global_scope: false },
    batches: { access_level: 'view_only', is_global_scope: false },
    subjects: { access_level: 'view_only', is_global_scope: false },
    attendance: { access_level: 'editable', is_global_scope: false },
    fees: { access_level: 'hidden', is_global_scope: false },
    exams: { access_level: 'editable', is_global_scope: false },
    homework: { access_level: 'editable', is_global_scope: false },
    timetable: { access_level: 'editable', is_global_scope: false },
    crm: { access_level: 'hidden', is_global_scope: false },
    announcements: { access_level: 'view_only', is_global_scope: false },
    whatsapp: { access_level: 'hidden', is_global_scope: false },
    settings: { access_level: 'hidden', is_global_scope: false },
    staff_types: { access_level: 'hidden', is_global_scope: false },
    staff_portal: { access_level: 'editable', is_global_scope: false },
    analytics: { access_level: 'hidden', is_global_scope: false },
    reports: { access_level: 'hidden', is_global_scope: false }
  },
  admin: {
    students: { access_level: 'editable', is_global_scope: true },
    teachers: { access_level: 'editable', is_global_scope: true },
    batches: { access_level: 'editable', is_global_scope: true },
    subjects: { access_level: 'editable', is_global_scope: true },
    attendance: { access_level: 'editable', is_global_scope: true },
    fees: { access_level: 'editable', is_global_scope: true },
    exams: { access_level: 'editable', is_global_scope: true },
    homework: { access_level: 'editable', is_global_scope: true },
    timetable: { access_level: 'editable', is_global_scope: true },
    crm: { access_level: 'editable', is_global_scope: true },
    announcements: { access_level: 'editable', is_global_scope: true },
    whatsapp: { access_level: 'editable', is_global_scope: true },
    settings: { access_level: 'editable', is_global_scope: true },
    staff_types: { access_level: 'editable', is_global_scope: true },
    staff_portal: { access_level: 'editable', is_global_scope: true },
    analytics: { access_level: 'editable', is_global_scope: true },
    reports: { access_level: 'editable', is_global_scope: true }
  },
  domestic: {
    students: { access_level: 'hidden', is_global_scope: false },
    teachers: { access_level: 'hidden', is_global_scope: false },
    batches: { access_level: 'hidden', is_global_scope: false },
    subjects: { access_level: 'hidden', is_global_scope: false },
    attendance: { access_level: 'hidden', is_global_scope: false },
    fees: { access_level: 'hidden', is_global_scope: false },
    exams: { access_level: 'hidden', is_global_scope: false },
    homework: { access_level: 'hidden', is_global_scope: false },
    timetable: { access_level: 'hidden', is_global_scope: false },
    crm: { access_level: 'hidden', is_global_scope: false },
    announcements: { access_level: 'view_only', is_global_scope: false },
    whatsapp: { access_level: 'hidden', is_global_scope: false },
    settings: { access_level: 'hidden', is_global_scope: false },
    staff_types: { access_level: 'hidden', is_global_scope: false },
    staff_portal: { access_level: 'editable', is_global_scope: false },
    analytics: { access_level: 'hidden', is_global_scope: false },
    reports: { access_level: 'hidden', is_global_scope: false }
  }
};

export async function seedStaffTypesAndPermissions(prismaClient: PrismaClient) {
  console.log('📦 Seeding default Staff Types & RBAC Matrix...');

  const staffTypesData = [
    {
      name: 'Faculty',
      slug: 'faculty',
      code: 'FAC',
      description: 'Teaching staff with batch-scoped access',
      icon_name: 'GraduationCap',
      is_system: true,
      is_system_default: true,
      is_active: true
    },
    {
      name: 'Admin',
      slug: 'admin',
      code: 'ADM',
      description: 'Full system administrative access',
      icon_name: 'ShieldCheck',
      is_system: true,
      is_system_default: true,
      is_active: true
    },
    {
      name: 'Domestic Staff',
      slug: 'domestic-staff',
      code: 'DOM',
      description: 'Support staff with portal-only access',
      icon_name: 'Wrench',
      is_system: true,
      is_system_default: true,
      is_active: true
    }
  ];

  const typeMap: Record<string, any> = {};

  for (const st of staffTypesData) {
    const matrixKey = st.slug === 'domestic-staff' ? 'domestic' : st.slug;
    const basePermissionsJson = DEFAULT_RBAC_MATRIX[matrixKey];

    // Upsert StaffType
    const staffType = await prismaClient.staffType.upsert({
      where: { code: st.code },
      update: {
        name: st.name,
        slug: st.slug,
        description: st.description,
        icon_name: st.icon_name,
        is_system: st.is_system,
        is_system_default: st.is_system_default,
        is_active: st.is_active,
        base_permissions: basePermissionsJson as any
      },
      create: {
        name: st.name,
        slug: st.slug,
        code: st.code,
        description: st.description,
        icon_name: st.icon_name,
        is_system: st.is_system,
        is_system_default: st.is_system_default,
        is_active: st.is_active,
        base_permissions: basePermissionsJson as any
      }
    });

    typeMap[st.slug] = staffType;
    typeMap[st.code.toLowerCase()] = staffType;
    typeMap[matrixKey] = staffType;
    console.log(`✅ Staff Type seeded: ${staffType.name} (${staffType.code})`);

    // Upsert default StaffPermissions for the StaffType template
    for (const [moduleKey, cfg] of Object.entries(basePermissionsJson)) {
      await prismaClient.staffPermission.upsert({
        where: {
          staff_type_id_module_key: {
            staff_type_id: staffType.id,
            module_key: moduleKey
          }
        },
        update: {
          access_level: cfg.access_level,
          is_global_scope: cfg.is_global_scope
        },
        create: {
          staff_type_id: staffType.id,
          module_key: moduleKey,
          access_level: cfg.access_level,
          is_global_scope: cfg.is_global_scope
        }
      });
    }
  }

  return typeMap;
}

export async function syncLegacyTeachersToStaff(prismaClient: PrismaClient, facultyType: any) {
  console.log('🔄 Syncing legacy Teacher records into StaffMember entity...');
  const currentYear = new Date().getFullYear();

  const teachers = await prismaClient.teacher.findMany({
    include: { user: true }
  });

  const existingStaff = await prismaClient.staffMember.findMany({
    where: { staff_id: { startsWith: `FAC-${currentYear}-` } },
    select: { staff_id: true }
  });

  let counter = 1;
  const existingNumbers = existingStaff
    .map((s) => {
      const parts = s.staff_id.split('-');
      return parseInt(parts[2], 10);
    })
    .filter((n) => !isNaN(n));

  if (existingNumbers.length > 0) {
    counter = Math.max(...existingNumbers) + 1;
  }

  for (const teacher of teachers) {
    const existing = await prismaClient.staffMember.findFirst({
      where: {
        OR: [
          { user_id: teacher.user_id },
          { teacher_id: teacher.id }
        ]
      }
    });

    if (existing) {
      console.log(`ℹ️ StaffMember already synced for ${teacher.user.full_name} (${existing.staff_id})`);
      continue;
    }

    const staffId = `FAC-${currentYear}-${String(counter).padStart(3, '0')}`;
    counter++;

    const staffMember = await prismaClient.staffMember.create({
      data: {
        user_id: teacher.user_id,
        staff_id: staffId,
        full_name: teacher.user.full_name,
        email: teacher.user.email,
        phone: teacher.user.phone || '+923011111111',
        gender: 'Male',
        staff_type_id: facultyType.id,
        role: 'faculty',
        designation: teacher.qualification || 'Senior Faculty Lecturer',
        qualification: teacher.qualification,
        joining_date: teacher.joined_on || new Date(),
        status: teacher.user.is_active ? 'active' : 'inactive',
        base_salary: 50000,
        hourly_rate: 1500,
        payment_method: 'bank_transfer',
        teacher_id: teacher.id,
        is_password_changed: true
      }
    });

    // Seed individual permissions matching Faculty template
    const perms = DEFAULT_RBAC_MATRIX.faculty;
    for (const [moduleKey, cfg] of Object.entries(perms)) {
      await prismaClient.staffPermission.upsert({
        where: {
          staff_member_id_module_key: {
            staff_member_id: staffMember.id,
            module_key: moduleKey
          }
        },
        update: {
          access_level: cfg.access_level,
          is_global_scope: cfg.is_global_scope
        },
        create: {
          staff_member_id: staffMember.id,
          module_key: moduleKey,
          access_level: cfg.access_level,
          is_global_scope: cfg.is_global_scope
        }
      });
    }

    console.log(`✅ Synced Teacher ${teacher.user.full_name} -> StaffMember ${staffId}`);
  }
}

export async function seedDefaultAdminAndDomesticStaff(prismaClient: PrismaClient, typeMap: Record<string, any>) {
  console.log('👤 Seeding default Admin & Domestic Staff members...');
  const currentYear = new Date().getFullYear();

  // 1. Ensure Admin User has a StaffMember record
  const adminUser = await prismaClient.user.findFirst({
    where: { OR: [{ email: 'admin' }, { role: 'admin' }] }
  });

  if (adminUser && typeMap.admin) {
    const existingAdminStaff = await prismaClient.staffMember.findFirst({
      where: { user_id: adminUser.id }
    });

    if (!existingAdminStaff) {
      const adminStaff = await prismaClient.staffMember.create({
        data: {
          user_id: adminUser.id,
          staff_id: `ADM-${currentYear}-001`,
          full_name: adminUser.full_name || 'Academy Administrator',
          email: adminUser.email || 'admin@academiapro.edu',
          phone: adminUser.phone || '+923000000000',
          gender: 'Male',
          staff_type_id: typeMap.admin.id,
          role: 'admin',
          designation: 'Chief System Administrator',
          qualification: 'M.S. Information Systems',
          joining_date: new Date(),
          status: 'active',
          base_salary: 85000,
          payment_method: 'bank_transfer',
          is_password_changed: true
        }
      });

      // Seed all editable permissions for Admin StaffMember
      const adminPerms = DEFAULT_RBAC_MATRIX.admin;
      for (const [moduleKey, cfg] of Object.entries(adminPerms)) {
        await prismaClient.staffPermission.upsert({
          where: {
            staff_member_id_module_key: {
              staff_member_id: adminStaff.id,
              module_key: moduleKey
            }
          },
          update: {
            access_level: cfg.access_level,
            is_global_scope: cfg.is_global_scope
          },
          create: {
            staff_member_id: adminStaff.id,
            module_key: moduleKey,
            access_level: cfg.access_level,
            is_global_scope: cfg.is_global_scope
          }
        });
      }
      console.log(`✅ Admin StaffMember created: ADM-${currentYear}-001`);
    }
  }

  // 2. Ensure Domestic Staff member exists for testing
  const domesticType = typeMap['domestic-staff'] || typeMap.domestic;
  if (domesticType) {
    const domesticStaffId = `DOM-${currentYear}-001`;
    const existingDomesticStaff = await prismaClient.staffMember.findUnique({
      where: { staff_id: domesticStaffId }
    });

    if (!existingDomesticStaff) {
      const domesticPassHash = await bcrypt.hash('staff123', 10);
      const domesticUser = await prismaClient.user.upsert({
        where: { email: 'domestic@academiapro.edu' },
        update: { password_hash: domesticPassHash },
        create: {
          role: 'staff',
          full_name: 'Mr. Rafiq Ahmed',
          email: 'domestic@academiapro.edu',
          phone: '+923033333333',
          password_hash: domesticPassHash,
          is_active: true
        }
      });

      const domesticStaff = await prismaClient.staffMember.create({
        data: {
          user_id: domesticUser.id,
          staff_id: domesticStaffId,
          full_name: 'Mr. Rafiq Ahmed',
          email: 'domestic@academiapro.edu',
          phone: '+923033333333',
          gender: 'Male',
          staff_type_id: domesticType.id,
          role: 'domestic',
          designation: 'Campus Security & Facilities Incharge',
          qualification: 'Intermediate',
          joining_date: new Date(),
          status: 'active',
          base_salary: 32000,
          payment_method: 'cash',
          is_password_changed: true
        }
      });

      // Seed domestic permissions (staff_portal editable, all others hidden)
      const domesticPerms = DEFAULT_RBAC_MATRIX.domestic;
      for (const [moduleKey, cfg] of Object.entries(domesticPerms)) {
        await prismaClient.staffPermission.upsert({
          where: {
            staff_member_id_module_key: {
              staff_member_id: domesticStaff.id,
              module_key: moduleKey
            }
          },
          update: {
            access_level: cfg.access_level,
            is_global_scope: cfg.is_global_scope
          },
          create: {
            staff_member_id: domesticStaff.id,
            module_key: moduleKey,
            access_level: cfg.access_level,
            is_global_scope: cfg.is_global_scope
          }
        });
      }
      console.log(`✅ Domestic StaffMember created: DOM-${currentYear}-001`);
    }
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: { password_hash: adminPasswordHash },
    create: {
      role: 'admin',
      full_name: 'Academy Administrator',
      email: 'admin',
      phone: '+923000000000',
      password_hash: adminPasswordHash,
      is_active: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create default classes
  const classes = ['Grade 9', 'Grade 10', 'Grade 11 Pre-Eng', 'Grade 12 Pre-Med'];
  for (const className of classes) {
    await prisma.class.upsert({
      where: { name: className },
      update: {},
      create: { name: className, is_active: true }
    });
  }
  console.log('✅ Default classes created');

  // Create default app settings
  const settings = [
    { key: 'academy_name', value: JSON.stringify('AcademiaPro Management OS') },
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
  console.log('✅ App settings seeded');

  // Seed Teacher user
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@academiapro.edu' },
    update: { password_hash: teacherPasswordHash },
    create: {
      role: 'teacher',
      full_name: 'Ms. Sarah Jenkins',
      email: 'teacher@academiapro.edu',
      phone: '+923011111111',
      password_hash: teacherPasswordHash,
      is_active: true
    }
  });

  const teacherRecord = await prisma.teacher.upsert({
    where: { user_id: teacherUser.id },
    update: {},
    create: {
      user_id: teacherUser.id,
      qualification: 'M.Sc. Mathematics'
    }
  });
  console.log('✅ Default teacher created:', teacherRecord.id);

  // Seed Parent user
  const parentPasswordHash = await bcrypt.hash('parent123', 10);
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@academiapro.edu' },
    update: { password_hash: parentPasswordHash },
    create: {
      role: 'parent',
      full_name: 'Tariq Khan',
      email: 'parent@academiapro.edu',
      phone: '+923022222222',
      password_hash: parentPasswordHash,
      is_active: true
    }
  });

  // Ensure sample student exists
  const grade10 = await prisma.class.findFirst({ where: { name: 'Grade 10' } });
  if (grade10) {
    const student = await prisma.student.upsert({
      where: { admission_no: 'ADM-2026-001' },
      update: {},
      create: {
        admission_no: 'ADM-2026-001',
        full_name: 'Zaid Khan',
        phone: '+923001234567',
        email: 'zaid.khan@student.edu',
        gender: 'Male',
        class_id: grade10.id,
        status: 'active'
      }
    });

    // Link Parent to Student
    await prisma.parentStudent.upsert({
      where: {
        parent_id_student_id: {
          parent_id: parentUser.id,
          student_id: student.id
        }
      },
      update: {},
      create: {
        parent_id: parentUser.id,
        student_id: student.id,
        relationship: 'father'
      }
    });

    // Seed Sample Conduct Logs
    const existingLog = await prisma.conductLog.findFirst({ where: { student_id: student.id } });
    if (!existingLog) {
      await prisma.conductLog.createMany({
        data: [
          {
            student_id: student.id,
            author_id: admin.id,
            author_name: admin.full_name,
            author_role: 'admin',
            category: 'commendation',
            severity: 'positive',
            title: 'Mathematics Olympiad Leadership',
            remark: 'Demonstrated high performance and exceptional leadership in Chapter 3 Mathematics assessment.',
            is_confidential: false,
            is_deleted: false
          },
          {
            student_id: student.id,
            author_id: teacherUser.id,
            author_name: teacherUser.full_name,
            author_role: 'teacher',
            category: 'general',
            severity: 'neutral',
            title: 'Attendance Notice',
            remark: 'Parent notified regarding upcoming semester examination fee due date.',
            is_confidential: false,
            is_deleted: false
          },
          {
            student_id: student.id,
            author_id: teacherUser.id,
            author_name: teacherUser.full_name,
            author_role: 'teacher',
            category: 'infraction',
            severity: 'warning',
            title: 'Staff Conference Advisory',
            remark: 'Confidential staff note: Teacher requested monitoring of student participation during morning lectures.',
            is_confidential: true,
            is_deleted: false
          }
        ]
      });
      console.log('✅ Sample conduct logs seeded');
    }
  }

  // ==========================================
  // FEATURE 008: SEED STAFF TYPES & SYNC USERS
  // ==========================================
  const typeMap = await seedStaffTypesAndPermissions(prisma);
  const facultyType = typeMap.faculty || typeMap.FAC;
  if (facultyType) {
    await syncLegacyTeachersToStaff(prisma, facultyType);
  }
  await seedDefaultAdminAndDomesticStaff(prisma, typeMap);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
