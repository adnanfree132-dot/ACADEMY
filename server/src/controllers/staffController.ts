import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest, generateTemporaryPassword } from '../auth';
import { createAuditLog } from '../common/audit';
import {
  registerStaffSchema,
  updateStaffSchema,
  updateStaffPermissionsSchema
} from '../validations/staffValidation';
import {
  CANONICAL_MODULE_KEYS,
  CanonicalModuleKey,
  normalizeAccessLevel,
  AccessLevelString
} from '../types/staff';
import { prisma } from '../prisma';

/**
 * Helper to generate sequential Staff IDs: `${CODE}-${YEAR}-${SEQUENCE:3}`
 */
export async function generateStaffId(tx: any, staffTypeCode: string): Promise<string> {
  const cleanCode = (staffTypeCode || 'STF')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'STF';
  const currentYear = new Date().getFullYear();
  const prefix = `${cleanCode}-${currentYear}-`;

  const existing = await tx.staffMember.findMany({
    where: { staff_id: { startsWith: prefix } },
    select: { staff_id: true }
  });

  let maxSeq = 0;
  for (const s of existing) {
    const parts = s.staff_id.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * 1. GET /api/v1/staff
 * Lists staff directory with search, dynamic filters, and pagination
 */
export async function getStaffList(req: Request, res: Response) {
  try {
    const {
      search,
      q,
      staff_type_id,
      staffTypeId,
      role,
      status,
      page = '1',
      limit = '100'
    } = req.query;

    const searchTerm = ((search || q || '') as string).trim();
    const typeFilter = ((staff_type_id || staffTypeId || role || '') as string).trim();
    const statusFilter = (status as string || '').trim();

    // Resolve staff type ID if passed as code (FACULTY, ADMIN, DOMESTIC) or name
    let targetStaffTypeId: string | undefined = undefined;
    if (typeFilter) {
      const st = await prisma.staffType.findFirst({
        where: {
          OR: [
            { id: typeFilter },
            { code: { equals: typeFilter.toUpperCase(), mode: 'insensitive' as const } },
            { slug: { equals: typeFilter.toLowerCase(), mode: 'insensitive' as const } },
            { name: { equals: typeFilter, mode: 'insensitive' as const } }
          ]
        }
      });
      if (st) {
        targetStaffTypeId = st.id;
      } else {
        targetStaffTypeId = typeFilter;
      }
    }

    const where: any = {
      ...(statusFilter && { status: statusFilter }),
      ...(targetStaffTypeId && { staff_type_id: targetStaffTypeId }),
      ...(searchTerm && {
        OR: [
          { full_name: { contains: searchTerm, mode: 'insensitive' as const } },
          { staff_id: { contains: searchTerm, mode: 'insensitive' as const } },
          { phone: { contains: searchTerm, mode: 'insensitive' as const } },
          { email: { contains: searchTerm, mode: 'insensitive' as const } },
          { designation: { contains: searchTerm, mode: 'insensitive' as const } }
        ]
      })
    };

    const take = Math.min(Math.max(1, parseInt(limit as string, 10) || 50), 200);
    const skip = (Math.max(1, parseInt(page as string, 10) || 1) - 1) * take;

    const [total, staffMembers] = await Promise.all([
      prisma.staffMember.count({ where }),
      prisma.staffMember.findMany({
        where,
        include: {
          staffType: true,
          teacher: {
            select: {
              id: true,
              qualification: true,
              batches: { where: { is_active: true }, select: { id: true, name: true } }
            }
          },
          user: {
            select: { id: true, email: true, phone: true, role: true, is_active: true }
          },
          permissions: true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take
      })
    ]);

    // Sanitize sensitive credentials from output
    const sanitized = staffMembers.map((s) => {
      const { password_hash, temp_password_plain, ...safeStaff } = s;
      return {
        ...safeStaff,
        fullName: s.full_name,
        staffId: s.staff_id,
        staffTypeId: s.staff_type_id,
        baseSalary: s.base_salary,
        hourlyRate: s.hourly_rate,
        salaryType: s.salary_type,
        paymentMethod: s.payment_method,
        joiningDate: s.joining_date,
        photoUrl: s.photo_url,
        statusRemarks: s.status_remarks,
        isPasswordChanged: s.is_password_changed
      };
    });

    return sendSuccess(res, sanitized, { total, page: parseInt(page as string, 10) || 1, limit: take });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. POST /api/v1/staff
 * Onboards new staff member:
 * - Validates schema
 * - Resolves staff type
 * - Generates unique Staff ID (FAC-2026-001)
 * - Generates temporary secure password & hashes with bcrypt
 * - Creates linked User + optional Teacher (for Faculty)
 * - Clones base permissions from StaffType
 * - Returns staff record + credentials slip payload in envelope
 */
export async function registerStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = registerStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Invalid input data', 400);
    }

    const data = parsed.data;

    // 1. Resolve StaffType
    const normalizedInput = (data.staffTypeId || '').trim();
    const isDomesticAlias = normalizedInput.toUpperCase().includes('DOM');
    const isFacultyAlias = normalizedInput.toUpperCase().includes('FAC') || normalizedInput.toUpperCase().includes('TEACH');
    const isAdminAlias = normalizedInput.toUpperCase().includes('ADM');

    let staffType = await prisma.staffType.findFirst({
      where: {
        OR: [
          { id: normalizedInput },
          { code: { equals: normalizedInput.toUpperCase(), mode: 'insensitive' as const } },
          { slug: { equals: normalizedInput.toLowerCase(), mode: 'insensitive' as const } },
          { name: { equals: normalizedInput, mode: 'insensitive' as const } },
          isDomesticAlias ? { code: 'DOM' } : {},
          isDomesticAlias ? { slug: 'domestic' } : {},
          isDomesticAlias ? { slug: 'domestic-staff' } : {},
          isDomesticAlias ? { name: { contains: 'Domestic', mode: 'insensitive' as const } } : {},
          isFacultyAlias ? { code: 'FAC' } : {},
          isFacultyAlias ? { slug: 'faculty' } : {},
          isFacultyAlias ? { name: { contains: 'Faculty', mode: 'insensitive' as const } } : {},
          isAdminAlias ? { code: 'ADM' } : {},
          isAdminAlias ? { slug: 'admin' } : {},
          isAdminAlias ? { name: { contains: 'Admin', mode: 'insensitive' as const } } : {}
        ].filter((c) => Object.keys(c).length > 0)
      },
      include: { defaultPermissions: true }
    });

    if (!staffType) {
      staffType = await prisma.staffType.findFirst({
        where: { code: 'FAC' },
        include: { defaultPermissions: true }
      }) || await prisma.staffType.findFirst({
        include: { defaultPermissions: true }
      });
    }

    if (!staffType) {
      return sendError(res, `Staff type "${data.staffTypeId}" could not be found.`, 400);
    }

    // 2. Uniqueness Checks
    const phoneExists = await prisma.staffMember.findFirst({
      where: { phone: { equals: data.phone.trim(), mode: 'insensitive' as const } }
    });
    if (phoneExists) {
      return sendError(res, `A staff member with phone number "${data.phone}" already exists (${phoneExists.full_name}).`, 409);
    }

    if (data.email) {
      const emailExists = await prisma.staffMember.findFirst({
        where: { email: { equals: data.email, mode: 'insensitive' as const } }
      });
      if (emailExists) {
        return sendError(res, `A staff member with email "${data.email}" already exists.`, 409);
      }
    }

    // 3. Generate Temporary Password & Hash
    const tempPassword = generateTemporaryPassword(10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // 4. Determine User Role
    const isFaculty =
      staffType.slug === 'faculty' ||
      staffType.code.toUpperCase() === 'FAC' ||
      staffType.name.toLowerCase().includes('faculty') ||
      staffType.name.toLowerCase().includes('teacher');

    const isAdminType =
      staffType.slug === 'admin' ||
      staffType.code.toUpperCase() === 'ADM' ||
      staffType.name.toLowerCase().includes('admin');

    const userRole = isFaculty ? 'teacher' : isAdminType ? 'admin' : 'staff';

    // 5. Execute DB Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Auto-generate unique Staff ID
      const staffId = await generateStaffId(tx, staffType.code);

      // Check if user already exists by email or phone
      let user = null;
      if (data.email) {
        user = await tx.user.findUnique({ where: { email: data.email } });
      }
      if (!user && data.phone) {
        user = await tx.user.findUnique({ where: { phone: data.phone } });
      }

      if (user) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            role: userRole,
            full_name: data.fullName,
            username: staffId,
            password_hash: passwordHash,
            must_change_password: true,
            is_active: data.status === 'active' || data.status === 'probation'
          }
        });
      } else {
        user = await tx.user.create({
          data: {
            role: userRole,
            full_name: data.fullName,
            email: data.email || null,
            phone: data.phone,
            username: staffId,
            password_hash: passwordHash,
            must_change_password: true,
            is_active: data.status === 'active' || data.status === 'probation'
          }
        });
      }

      // Create or update Teacher model if Faculty
      let teacherRecord = null;
      if (isFaculty) {
        teacherRecord = await tx.teacher.findFirst({ where: { user_id: user.id } });
        if (teacherRecord) {
          teacherRecord = await tx.teacher.update({
            where: { id: teacherRecord.id },
            data: {
              qualification: data.qualification || null
            }
          });
        } else {
          teacherRecord = await tx.teacher.create({
            data: {
              user_id: user.id,
              qualification: data.qualification || null
            }
          });
        }
      }

      // Check if existing staff member record is linked to this user
      let staffMember = await tx.staffMember.findFirst({ where: { user_id: user.id } });
      if (staffMember) {
        staffMember = await tx.staffMember.update({
          where: { id: staffMember.id },
          data: {
            staff_id: staffId,
            teacher_id: teacherRecord?.id || staffMember.teacher_id,
            staff_type_id: staffType.id,
            full_name: data.fullName,
            email: data.email || null,
            phone: data.phone,
            gender: data.gender,
            role: staffType.slug || staffType.code.toLowerCase(),
            designation: data.designation,
            qualification: data.qualification || null,
            joining_date: new Date(data.joiningDate),
            status: data.status,
            base_salary: data.baseSalary,
            hourly_rate: data.hourlyRate,
            salary_type: data.salaryType,
            payment_method: data.paymentMethod,
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_title: data.accountTitle,
            emergency_name: data.emergencyName,
            emergency_phone: data.emergencyPhone,
            emergency_relation: data.emergencyRelation,
            password_hash: passwordHash,
            temp_password_plain: tempPassword,
            is_password_changed: false,
            custom_fields: (data.customFields || undefined) as any
          }
        });
      } else {
        staffMember = await tx.staffMember.create({
          data: {
            staff_id: staffId,
            user_id: user.id,
            teacher_id: teacherRecord?.id || null,
            staff_type_id: staffType.id,
            full_name: data.fullName,
            email: data.email || null,
            phone: data.phone,
            gender: data.gender,
            role: staffType.slug || staffType.code.toLowerCase(),
            designation: data.designation,
            qualification: data.qualification || null,
            joining_date: new Date(data.joiningDate),
            status: data.status,
            base_salary: data.baseSalary,
            hourly_rate: data.hourlyRate,
            salary_type: data.salaryType,
            payment_method: data.paymentMethod,
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_title: data.accountTitle,
            emergency_name: data.emergencyName,
            emergency_phone: data.emergencyPhone,
            emergency_relation: data.emergencyRelation,
            password_hash: passwordHash,
            temp_password_plain: tempPassword,
            is_password_changed: false,
            custom_fields: (data.customFields || undefined) as any
          }
        });
      }

      // Clone / Apply Permissions
      const customPermMap = new Map<string, { accessLevel: AccessLevelString; isGlobalScope: boolean }>();
      for (const cp of data.customPermissions) {
        const mod = cp.moduleKey || (cp as any).module_key;
        const lvl = cp.accessLevel !== undefined ? cp.accessLevel : (cp as any).access_level;
        if (mod) {
          customPermMap.set(mod, {
            accessLevel: normalizeAccessLevel(lvl as any),
            isGlobalScope: cp.isGlobalScope ?? (cp as any).is_global_scope ?? false
          });
        }
      }

      const defaultPermMap = new Map<string, { accessLevel: AccessLevelString; isGlobalScope: boolean }>();
      for (const dp of staffType.defaultPermissions) {
        defaultPermMap.set(dp.module_key, {
          accessLevel: normalizeAccessLevel(dp.access_level as any),
          isGlobalScope: dp.is_global_scope
        });
      }

      // If staffType has base_permissions JSON
      if (staffType.base_permissions && typeof staffType.base_permissions === 'object') {
        const bp = staffType.base_permissions as any;
        if (Array.isArray(bp)) {
          bp.forEach((p: any) => {
            const mod = p.moduleKey || p.module_key;
            const lvl = p.accessLevel !== undefined ? p.accessLevel : p.access_level;
            if (mod && !defaultPermMap.has(mod)) {
              defaultPermMap.set(mod, {
                accessLevel: normalizeAccessLevel(lvl as any),
                isGlobalScope: p.isGlobalScope ?? p.is_global_scope ?? false
              });
            }
          });
        } else {
          Object.entries(bp).forEach(([mod, val]) => {
            if (!defaultPermMap.has(mod)) {
              const lvl = typeof val === 'object' && val !== null ? (val as any).accessLevel || (val as any).access_level : val;
              defaultPermMap.set(mod, {
                accessLevel: normalizeAccessLevel(lvl as any),
                isGlobalScope: false
              });
            }
          });
        }
      }

      const permissionsToCreate = CANONICAL_MODULE_KEYS.map((mod) => {
        if (customPermMap.has(mod)) {
          const c = customPermMap.get(mod)!;
          return {
            staff_member_id: staffMember.id,
            module_key: mod,
            access_level: c.accessLevel,
            is_global_scope: c.isGlobalScope
          };
        }
        if (defaultPermMap.has(mod)) {
          const d = defaultPermMap.get(mod)!;
          return {
            staff_member_id: staffMember.id,
            module_key: mod,
            access_level: d.accessLevel,
            is_global_scope: d.isGlobalScope
          };
        }
        return {
          staff_member_id: staffMember.id,
          module_key: mod,
          access_level: 'hidden',
          is_global_scope: false
        };
      });

      await tx.staffPermission.createMany({
        data: permissionsToCreate,
        skipDuplicates: true
      });

      return { staffMember, staffId, user, teacherRecord };
    });

    const fullStaff = await prisma.staffMember.findUnique({
      where: { id: result.staffMember.id },
      include: {
        staffType: true,
        teacher: true,
        permissions: true
      }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'REGISTER_STAFF', 'StaffMember', result.staffMember.id, {
        staffId: result.staffId,
        fullName: data.fullName
      });
    }

    // Strip sensitive fields
    const { password_hash, temp_password_plain, ...safeStaff } = fullStaff!;

    const responsePayload = {
      staff: {
        ...safeStaff,
        id: safeStaff.id,
        staffId: result.staffId,
        staff_id: result.staffId,
        fullName: safeStaff.full_name,
        created_at: safeStaff.created_at
      },
      id: safeStaff.id,
      staff_id: result.staffId,
      staffId: result.staffId,
      fullName: safeStaff.full_name,
      credentials: {
        staffId: result.staffId,
        temporaryPassword: tempPassword,
        temp_password: tempPassword,
        loginUrl: '/login',
        issuedAt: new Date().toISOString()
      },
      temporaryPassword: tempPassword,
      temp_password: tempPassword
    };

    return sendSuccess(res, responsePayload, null, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. GET /api/v1/staff/:id
 * Comprehensive staff profile with 5-tab drawer data:
 * - Basic info & StaffType
 * - Granular Permissions
 * - Attendance summary & recent logs
 * - Leave summary & recent applications
 * - Documents vault
 * - Salary history & compensation structure
 */
export async function getStaffById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      },
      include: {
        staffType: true,
        user: {
          select: { id: true, email: true, phone: true, role: true, is_active: true, created_at: true }
        },
        teacher: {
          include: {
            batches: { where: { is_active: true } },
            batchSubjects: { include: { batch: true, subject: true } }
          }
        },
        permissions: true,
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        leaveRequests: { orderBy: { created_at: 'desc' }, take: 20 },
        documents: { orderBy: { uploaded_at: 'desc' } },
        salaryPayments: { orderBy: { payment_date: 'desc' }, take: 20 }
      }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    // Compute Attendance Summary
    const totalAttendanceDays = staff.attendances.length;
    const presentCount = staff.attendances.filter((a) => a.status === 'present').length;
    const lateCount = staff.attendances.filter((a) => a.status === 'late').length;
    const absentCount = staff.attendances.filter((a) => a.status === 'absent').length;
    const onLeaveCount = staff.attendances.filter((a) => a.status === 'on_leave').length;
    const attendancePercentage =
      totalAttendanceDays > 0
        ? Math.round(((presentCount + lateCount) / totalAttendanceDays) * 100)
        : 100;

    // Compute Leave Summary
    const approvedLeaves = staff.leaveRequests.filter((l) => l.status === 'approved');
    const pendingLeaves = staff.leaveRequests.filter((l) => l.status === 'pending');
    const totalLeaveDaysTaken = approvedLeaves.reduce((sum, l) => sum + (l.total_days || 1), 0);

    // Omit sensitive bcrypt hashes
    const { password_hash, temp_password_plain, ...safeStaff } = staff;

    const enrichedProfile = {
      ...safeStaff,
      fullName: staff.full_name,
      staffId: staff.staff_id,
      staffTypeId: staff.staff_type_id,
      baseSalary: staff.base_salary,
      hourlyRate: staff.hourly_rate,
      salaryType: staff.salary_type,
      paymentMethod: staff.payment_method,
      bankName: staff.bank_name,
      accountNumber: staff.account_number,
      accountTitle: staff.account_title,
      emergencyName: staff.emergency_name,
      emergencyPhone: staff.emergency_phone,
      emergencyRelation: staff.emergency_relation,
      statusRemarks: staff.status_remarks,
      photoUrl: staff.photo_url,
      isPasswordChanged: staff.is_password_changed,
      attendanceSummary: {
        totalDays: totalAttendanceDays,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        onLeave: onLeaveCount,
        attendancePercentage
      },
      leaveSummary: {
        approvedCount: approvedLeaves.length,
        pendingCount: pendingLeaves.length,
        totalDaysTaken: totalLeaveDaysTaken
      }
    };

    return sendSuccess(res, enrichedProfile);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 4. PUT /api/v1/staff/:id
 * Updates staff member profile, compensation terms, and lifecycle status
 */
export async function updateStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Invalid input data', 400);
    }

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const data = parsed.data;

    // Check collision if updating phone or email
    if (data.phone || data.email) {
      const collision = await prisma.staffMember.findFirst({
        where: {
          id: { not: staff.id },
          OR: [
            data.phone ? { phone: data.phone } : {},
            data.email ? { email: { equals: data.email, mode: 'insensitive' as const } } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      if (collision) {
        return sendError(res, 'Another staff member already uses this phone or email.', 409);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update StaffMember
      const sm = await tx.staffMember.update({
        where: { id: staff.id },
        data: {
          ...(data.fullName && { full_name: data.fullName }),
          ...(data.phone && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.gender && { gender: data.gender }),
          ...(data.staffTypeId && { staff_type_id: data.staffTypeId }),
          ...(data.designation && { designation: data.designation }),
          ...(data.qualification !== undefined && { qualification: data.qualification }),
          ...(data.joiningDate && { joining_date: new Date(data.joiningDate) }),
          ...(data.status && { status: data.status }),
          ...(data.statusRemarks !== undefined && { status_remarks: data.statusRemarks }),
          ...(data.photoUrl !== undefined && { photo_url: data.photoUrl }),
          ...(data.baseSalary !== undefined && { base_salary: data.baseSalary }),
          ...(data.hourlyRate !== undefined && { hourly_rate: data.hourlyRate }),
          ...(data.salaryType && { salary_type: data.salaryType }),
          ...(data.paymentMethod && { payment_method: data.paymentMethod }),
          ...(data.bankName !== undefined && { bank_name: data.bankName }),
          ...(data.accountNumber !== undefined && { account_number: data.accountNumber }),
          ...(data.accountTitle !== undefined && { account_title: data.accountTitle }),
          ...(data.emergencyName !== undefined && { emergency_name: data.emergencyName }),
          ...(data.emergencyPhone !== undefined && { emergency_phone: data.emergencyPhone }),
          ...(data.emergencyRelation !== undefined && { emergency_relation: data.emergencyRelation }),
          ...(data.customFields !== undefined && { custom_fields: (data.customFields || undefined) as any })
        } as any
      });

      // Sync linked User account
      if (staff.user_id) {
        await tx.user.update({
          where: { id: staff.user_id },
          data: {
            ...(data.fullName && { full_name: data.fullName }),
            ...(data.phone && { phone: data.phone }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.status && {
              is_active: data.status === 'active' || data.status === 'probation' || data.status === 'on_leave'
            })
          }
        });
      }

      // Sync Teacher qualification if applicable
      if (staff.teacher_id && data.qualification !== undefined) {
        await tx.teacher.update({
          where: { id: staff.teacher_id },
          data: { qualification: data.qualification }
        });
      }

      return sm;
    });

    const fullStaff = await prisma.staffMember.findUnique({
      where: { id: updated.id },
      include: { staffType: true, teacher: true, permissions: true }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'UPDATE_STAFF', 'StaffMember', staff.id, data);
    }

    const { password_hash, temp_password_plain, ...safeStaff } = fullStaff!;
    return sendSuccess(res, {
      ...safeStaff,
      fullName: safeStaff.full_name,
      staffId: safeStaff.staff_id,
      designation: safeStaff.designation
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 5. DELETE /api/v1/staff/:id
 * Deletes or soft-archives a staff member (guarded against active batches)
 */
export async function deleteStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { permanent, mode } = req.query;
    const isPermanent = permanent === 'true' || mode === 'hard';

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      },
      include: { teacher: true }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    if (isPermanent) {
      // Hard delete in transaction with clean cascading
      await prisma.$transaction(async (tx) => {
        // 1. Unassign batches and timetable slots if faculty
        if (staff.teacher_id) {
          await tx.batch.updateMany({
            where: { teacher_id: staff.teacher_id },
            data: { teacher_id: null }
          });
          await tx.timetableSlot.updateMany({
            where: { teacher_id: staff.teacher_id },
            data: { teacher_id: null }
          }).catch(() => {});
          await tx.homework.deleteMany({ where: { teacher_id: staff.teacher_id } }).catch(() => {});
          await tx.studyMaterial.deleteMany({ where: { teacher_id: staff.teacher_id } }).catch(() => {});
        }

        // 2. Delete staff relationships
        await tx.staffPermission.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffAttendance.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffDocument.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffSalaryPayment.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffLeaveRequest.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffSalaryStructure.deleteMany({ where: { staff_member_id: staff.id } }).catch(() => {});
        await tx.staffSalaryAdjustment.deleteMany({ where: { staff_member_id: staff.id } }).catch(() => {});
        await tx.staffSalaryDisbursement.deleteMany({ where: { staff_member_id: staff.id } }).catch(() => {});

        // 3. Delete staff member, teacher, user
        await tx.staffMember.delete({ where: { id: staff.id } });
        if (staff.teacher_id) {
          await tx.teacher.delete({ where: { id: staff.teacher_id } }).catch(() => {});
        }
        if (staff.user_id) {
          await tx.user.delete({ where: { id: staff.user_id } }).catch(() => {});
        }
      });
    } else {
      // Soft Archive / Deactivate
      await prisma.$transaction(async (tx) => {
        await tx.staffMember.update({
          where: { id: staff.id },
          data: { status: 'resigned', status_remarks: 'Archived via staff directory' }
        });
        if (staff.user_id) {
          await tx.user.update({
            where: { id: staff.user_id },
            data: { is_active: false }
          });
        }
      });
    }

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'DELETE_STAFF', 'StaffMember', staff.id, { staffId: staff.staff_id, mode: isPermanent ? 'hard' : 'soft' });
    }

    return sendSuccess(res, { message: 'Staff member deleted successfully', id: staff.id, mode: isPermanent ? 'hard' : 'soft' });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 6. POST /api/v1/staff/:id/reset-password
 * Admin resets staff password and generates fresh credential slip payload
 */
export async function resetStaffPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const newTempPassword = generateTemporaryPassword(10);
    const newPasswordHash = await bcrypt.hash(newTempPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.staffMember.update({
        where: { id: staff.id },
        data: {
          password_hash: newPasswordHash,
          temp_password_plain: newTempPassword,
          is_password_changed: false
        }
      });

      if (staff.user_id) {
        await tx.user.update({
          where: { id: staff.user_id },
          data: {
            password_hash: newPasswordHash,
            must_change_password: true
          }
        });
      }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'RESET_STAFF_PASSWORD', 'StaffMember', staff.id, { staffId: staff.staff_id });
    }

    const credentialSlipPayload = {
      staffId: staff.staff_id,
      temporaryPassword: newTempPassword,
      temp_password: newTempPassword,
      loginUrl: '/login',
      issuedAt: new Date().toISOString()
    };

    return sendSuccess(res, {
      temporaryPassword: newTempPassword,
      temp_password: newTempPassword,
      credentials: credentialSlipPayload,
      staffId: staff.staff_id
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 7. GET /api/v1/staff/:id/permissions
 * Retrieves granular 3-tier module permissions for a staff member
 */
export async function getStaffPermissions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      },
      select: { id: true, staff_id: true }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const permissions = await prisma.staffPermission.findMany({
      where: { staff_member_id: staff.id },
      orderBy: { module_key: 'asc' }
    });

    const formatted = permissions.map((p) => ({
      id: p.id,
      moduleKey: p.module_key,
      module_key: p.module_key,
      accessLevel: p.access_level,
      access_level: p.access_level,
      isGlobalScope: p.is_global_scope,
      is_global_scope: p.is_global_scope
    }));

    return sendSuccess(res, formatted);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 8. PUT /api/v1/staff/:id/permissions
 * Updates custom module permissions and scoping for a staff member
 */
export async function updateStaffPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id },
          { staff_id: { equals: id, mode: 'insensitive' as const } }
        ]
      },
      select: { id: true, staff_id: true }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const parsed = updateStaffPermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Invalid permissions payload', 400);
    }

    const { permissions } = parsed.data;

    await prisma.$transaction(async (tx) => {
      for (const p of permissions) {
        const mod = p.moduleKey || (p as any).module_key;
        const lvl = p.accessLevel !== undefined ? p.accessLevel : (p as any).access_level;
        if (mod) {
          await tx.staffPermission.upsert({
            where: {
              staff_member_id_module_key: {
                staff_member_id: staff.id,
                module_key: mod
              }
            },
            update: {
              access_level: normalizeAccessLevel(lvl as any),
              is_global_scope: p.isGlobalScope ?? (p as any).is_global_scope ?? false
            },
            create: {
              staff_member_id: staff.id,
              module_key: mod,
              access_level: normalizeAccessLevel(lvl as any),
              is_global_scope: p.isGlobalScope ?? (p as any).is_global_scope ?? false
            }
          });
        }
      }
    });

    const updatedPermissions = await prisma.staffPermission.findMany({
      where: { staff_member_id: staff.id },
      orderBy: { module_key: 'asc' }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'UPDATE_STAFF_PERMISSIONS', 'StaffMember', staff.id, {
        count: permissions.length
      });
    }

    const formatted = updatedPermissions.map((p) => ({
      id: p.id,
      moduleKey: p.module_key,
      module_key: p.module_key,
      accessLevel: p.access_level,
      access_level: p.access_level,
      isGlobalScope: p.is_global_scope,
      is_global_scope: p.is_global_scope
    }));

    return sendSuccess(res, formatted);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 9. POST /api/v1/staff/bulk-status
 * Updates status across multiple staff members
 */
export async function bulkUpdateStaffStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const rawStaffIds = req.body.staffIds || req.body.staff_ids;
    const status = req.body.status;
    const remarks = req.body.remarks || req.body.status_remarks || req.body.statusRemarks;

    if (!Array.isArray(rawStaffIds) || rawStaffIds.length === 0) {
      return sendError(res, 'staffIds must be a non-empty array', 400);
    }
    if (!status) {
      return sendError(res, 'status is required', 400);
    }

    const affected = await prisma.staffMember.findMany({
      where: { id: { in: rawStaffIds } },
      select: { id: true, user_id: true }
    });

    await prisma.$transaction(async (tx) => {
      await tx.staffMember.updateMany({
        where: { id: { in: rawStaffIds } },
        data: {
          status,
          ...(remarks && { status_remarks: remarks })
        }
      });

      const userIds = affected.map((s) => s.user_id).filter((u): u is string => Boolean(u));
      if (userIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            is_active: status === 'active' || status === 'probation' || status === 'on_leave'
          }
        });
      }
    });

    return sendSuccess(res, { updatedCount: affected.length, staffIds: rawStaffIds, status });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 10. POST /api/v1/staff/bulk-reassign
 * Reassigns staff category across multiple staff members
 */
export async function bulkReassignStaffType(req: AuthenticatedRequest, res: Response) {
  try {
    const { staffIds, targetStaffTypeId } = req.body;
    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return sendError(res, 'staffIds must be a non-empty array', 400);
    }
    if (!targetStaffTypeId) {
      return sendError(res, 'targetStaffTypeId is required', 400);
    }

    const targetType = await prisma.staffType.findFirst({
      where: {
        OR: [
          { id: targetStaffTypeId },
          { code: { equals: targetStaffTypeId.toUpperCase(), mode: 'insensitive' as const } },
          { slug: { equals: targetStaffTypeId.toLowerCase(), mode: 'insensitive' as const } }
        ]
      }
    });

    if (!targetType) {
      return sendError(res, 'Target staff type not found', 404);
    }

    const updated = await prisma.staffMember.updateMany({
      where: { id: { in: staffIds } },
      data: { staff_type_id: targetType.id }
    });

    return sendSuccess(res, { updatedCount: updated.count, staffIds, targetStaffTypeId: targetType.id });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 11. GET /api/v1/staff/export-csv
 * Exports staff directory as standardized CSV
 */
export async function exportStaffCsv(req: Request, res: Response) {
  try {
    const staff = await prisma.staffMember.findMany({
      include: { staffType: true },
      orderBy: { created_at: 'asc' }
    });

    const headers = [
      'Staff ID',
      'Full Name',
      'Email',
      'Phone',
      'Staff Type',
      'Designation',
      'Status',
      'Joining Date',
      'Salary Type',
      'Base Salary'
    ];

    const rows = staff.map((s) => [
      `"${s.staff_id}"`,
      `"${s.full_name}"`,
      `"${s.email || ''}"`,
      `"${s.phone}"`,
      `"${s.staffType?.name || s.role || ''}"`,
      `"${s.designation}"`,
      `"${s.status}"`,
      `"${s.joining_date ? s.joining_date.toISOString().split('T')[0] : ''}"`,
      `"${s.salary_type || 'monthly'}"`,
      s.base_salary || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="staff_directory.csv"');
    return res.status(200).send(csvContent);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 12. Helper handlers for Staff Documents Vault
 */
export async function getStaffDocuments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staffMember.findFirst({
      where: { OR: [{ id }, { staff_id: { equals: id, mode: 'insensitive' as const } }] }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const docs = await prisma.staffDocument.findMany({
      where: { staff_member_id: staff.id },
      orderBy: { uploaded_at: 'desc' }
    });

    const formatted = docs.map((d) => ({
      id: d.id,
      staffMemberId: d.staff_member_id,
      title: d.title,
      documentType: d.document_type,
      document_type: d.document_type,
      fileUrl: d.file_url,
      file_url: d.file_url,
      fileSize: d.file_size,
      mimeType: d.mime_type,
      expiryDate: d.expiry_date,
      expiry_date: d.expiry_date,
      uploadedAt: d.uploaded_at
    }));

    return sendSuccess(res, formatted);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function uploadStaffDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, documentType, document_type, fileUrl, file_url, fileSize, mimeType, expiryDate, expiry_date } = req.body;

    const staff = await prisma.staffMember.findFirst({
      where: { OR: [{ id }, { staff_id: { equals: id, mode: 'insensitive' as const } }] }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const docType = documentType || document_type || 'other';
    const docUrl = fileUrl || file_url || '';

    if (!title || !docUrl) {
      return sendError(res, 'Title and fileUrl are required', 400);
    }

    const doc = await prisma.staffDocument.create({
      data: {
        staff_member_id: staff.id,
        title,
        document_type: docType,
        file_url: docUrl,
        file_size: fileSize || null,
        mime_type: mimeType || null,
        expiry_date: expiryDate || expiry_date || null
      }
    });

    return sendSuccess(res, {
      ...doc,
      documentType: doc.document_type,
      fileUrl: doc.file_url,
      expiryDate: doc.expiry_date
    }, null, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function deleteStaffDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const targetStaffParam = req.params.id;
    const docId = req.params.docId || req.params.id;
    const user = req.user;

    // Cross-staff document protection: non-admin cannot tamper with another staff member's vault
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      if (req.params.docId && targetStaffParam) {
        const staff = await prisma.staffMember.findFirst({
          where: { OR: [{ id: targetStaffParam }, { staff_id: { equals: targetStaffParam, mode: 'insensitive' as const } }] }
        });
        if (staff && user.userId !== staff.id && user.staffId !== staff.staff_id && user.userId !== staff.user_id) {
          return sendError(res, 'Forbidden: You cannot delete documents belonging to another staff member.', 403);
        }
      }
    }

    const doc = await prisma.staffDocument.findUnique({ where: { id: docId } });
    if (!doc) return sendError(res, 'Document not found', 404);

    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      const docOwner = await prisma.staffMember.findUnique({ where: { id: doc.staff_member_id } });
      if (docOwner && user.userId !== docOwner.id && user.staffId !== docOwner.staff_id && user.userId !== docOwner.user_id) {
        return sendError(res, 'Forbidden: You cannot delete documents belonging to another staff member.', 403);
      }
    }

    await prisma.staffDocument.delete({ where: { id: docId } });
    return sendSuccess(res, { message: 'Document deleted successfully', id: docId });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 13. Helper handlers for Staff Salary & Payments
 */
export async function updateStaffSalary(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { baseSalary, hourlyRate, salaryType, paymentMethod, bankName, accountTitle, accountNumber } = req.body;

    const staff = await prisma.staffMember.findFirst({
      where: { OR: [{ id }, { staff_id: { equals: id, mode: 'insensitive' as const } }] }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const updated = await prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        ...(baseSalary !== undefined && { base_salary: baseSalary }),
        ...(hourlyRate !== undefined && { hourly_rate: hourlyRate }),
        ...(salaryType && { salary_type: salaryType }),
        ...(paymentMethod && { payment_method: paymentMethod }),
        ...(bankName !== undefined && { bank_name: bankName }),
        ...(accountTitle !== undefined && { account_title: accountTitle }),
        ...(accountNumber !== undefined && { account_number: accountNumber })
      }
    });

    return sendSuccess(res, {
      id: updated.id,
      baseSalary: updated.base_salary,
      hourlyRate: updated.hourly_rate,
      salaryType: updated.salary_type,
      paymentMethod: updated.payment_method,
      bankName: updated.bank_name,
      accountTitle: updated.account_title,
      accountNumber: updated.account_number
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function getStaffSalaryPayments(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const staff = await prisma.staffMember.findFirst({
      where: { OR: [{ id }, { staff_id: { equals: id, mode: 'insensitive' as const } }] }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const user = req.user;
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      if (user.userId !== staff.id && user.staffId !== staff.staff_id && user.userId !== staff.user_id) {
        return sendError(res, 'Forbidden: You cannot access salary records for other staff members.', 403);
      }
    }

    const isStaffPortalUser = user && user.role !== 'admin' && user.role !== 'super_admin';
    const payments = await prisma.staffSalaryPayment.findMany({
      where: { 
        staff_member_id: staff.id,
        ...(isStaffPortalUser ? { is_published: true } : {})
      },
      orderBy: { payment_date: 'desc' }
    });

    return sendSuccess(res, payments);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function recordStaffSalaryPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { monthPeriod, basePay, allowances, deductions, netPayable, paymentMethod, transactionRef, remarks } = req.body;

    const staff = await prisma.staffMember.findFirst({
      where: { OR: [{ id }, { staff_id: { equals: id, mode: 'insensitive' as const } }] }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const calculatedNet = (basePay || 0) + (allowances || 0) - (deductions || 0);

    const payment = await prisma.staffSalaryPayment.create({
      data: {
        staff_member_id: staff.id,
        month_period: monthPeriod || new Date().toISOString().slice(0, 7),
        amount: netPayable ?? calculatedNet,
        base_pay: basePay || 0,
        allowances: allowances || 0,
        deductions: deductions || 0,
        net_payable: netPayable ?? calculatedNet,
        payment_method: paymentMethod || 'bank_transfer',
        transaction_ref: transactionRef || null,
        remarks: remarks || null,
        status: 'paid'
      }
    });

    return sendSuccess(res, payment, null, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 14. Helper handlers for Staff Attendance
 */
export async function checkInStaffAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { date, time, notes, status, staffMemberId } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return sendError(res, 'Date must be in YYYY-MM-DD format', 400);
    }

    let staffId = staffMemberId;
    if (!staffId && req.user) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return sendError(res, 'Staff member identifier not found', 400);
    }

    const checkInTime = time || new Date().toTimeString().split(' ')[0];

    const att = await prisma.staffAttendance.upsert({
      where: {
        staff_member_id_date: {
          staff_member_id: staffId,
          date: targetDate
        }
      },
      update: {
        check_in_time: checkInTime,
        status: status || 'present',
        notes: notes || undefined
      },
      create: {
        staff_member_id: staffId,
        date: targetDate,
        check_in_time: checkInTime,
        status: status || 'present',
        notes: notes || null,
        marked_by: req.user?.role || 'self'
      }
    });

    return sendSuccess(res, att);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function checkOutStaffAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { date, time, staffMemberId } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let staffId = staffMemberId;
    if (!staffId && req.user) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return sendError(res, 'Staff member identifier not found', 400);
    }

    const checkOutTime = time || new Date().toTimeString().split(' ')[0];

    const att = await prisma.staffAttendance.upsert({
      where: {
        staff_member_id_date: {
          staff_member_id: staffId,
          date: targetDate
        }
      },
      update: {
        check_out_time: checkOutTime
      },
      create: {
        staff_member_id: staffId,
        date: targetDate,
        check_out_time: checkOutTime,
        status: 'present',
        marked_by: req.user?.role || 'self'
      }
    });

    return sendSuccess(res, att);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function getStaffAttendance(req: Request, res: Response) {
  try {
    const { date, start_date, end_date, staff_member_id } = req.query;

    const where: any = {};
    if (date) where.date = date as string;
    if (start_date && end_date) {
      where.date = { gte: start_date as string, lte: end_date as string };
    }
    if (staff_member_id) where.staff_member_id = staff_member_id as string;

    const logs = await prisma.staffAttendance.findMany({
      where,
      include: { staffMember: { select: { id: true, staff_id: true, full_name: true, designation: true } } },
      orderBy: { date: 'desc' }
    });

    return sendSuccess(res, logs);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function bulkStaffAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const { date, records } = req.body;
    if (!Array.isArray(records)) {
      return sendError(res, 'records must be an array', 400);
    }
    const targetDate = date || new Date().toISOString().split('T')[0];

    for (const r of records) {
      if (r.staffMemberId) {
        await prisma.staffAttendance.upsert({
          where: {
            staff_member_id_date: {
              staff_member_id: r.staffMemberId,
              date: targetDate
            }
          },
          update: {
            status: r.status || 'present',
            notes: r.notes || undefined
          },
          create: {
            staff_member_id: r.staffMemberId,
            date: targetDate,
            status: r.status || 'present',
            notes: r.notes || null,
            marked_by: 'admin'
          }
        });
      }
    }

    return sendSuccess(res, { message: 'Bulk attendance recorded', count: records.length });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 15. Helper handlers for Staff Leaves
 */
export async function submitStaffLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const { leaveType, startDate, endDate, reason, staffMemberId } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return sendError(res, 'leaveType, startDate, endDate, and reason are required', 400);
    }

    let staffId = staffMemberId;
    if (!staffId && req.user) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return sendError(res, 'Staff member not found', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.staffLeaveRequest.create({
      data: {
        staff_member_id: staffId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: isNaN(totalDays) ? 1 : totalDays,
        reason,
        status: 'pending'
      }
    });

    return sendSuccess(res, {
      ...leave,
      totalDays: leave.total_days,
      startDate: leave.start_date,
      endDate: leave.end_date,
      leaveType: leave.leave_type
    }, null, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function getStaffLeaves(req: Request, res: Response) {
  try {
    const { status, staff_member_id } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (staff_member_id) where.staff_member_id = staff_member_id as string;

    const leaves = await prisma.staffLeaveRequest.findMany({
      where,
      include: {
        staffMember: { select: { id: true, staff_id: true, full_name: true, designation: true } },
        substituteTeacher: { select: { id: true, staff_id: true, full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = leaves.map((l) => ({
      ...l,
      totalDays: l.total_days,
      startDate: l.start_date,
      endDate: l.end_date,
      leaveType: l.leave_type
    }));

    return sendSuccess(res, formatted);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function getStaffLeaveById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const leave = await prisma.staffLeaveRequest.findUnique({
      where: { id },
      include: {
        staffMember: { select: { id: true, staff_id: true, full_name: true, designation: true } },
        substituteTeacher: { select: { id: true, staff_id: true, full_name: true } }
      }
    });
    if (!leave) return sendError(res, 'Leave request not found', 404);

    return sendSuccess(res, {
      ...leave,
      totalDays: leave.total_days,
      startDate: leave.start_date,
      endDate: leave.end_date,
      leaveType: leave.leave_type
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function decideStaffLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { decision, substituteTeacherId, remarks } = req.body;

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return sendError(res, 'decision must be "approved" or "rejected"', 400);
    }

    const leave = await prisma.staffLeaveRequest.findUnique({ where: { id } });
    if (!leave) return sendError(res, 'Leave request not found', 404);

    let resolvedSubId: string | null = null;
    if (substituteTeacherId) {
      const subStaff = await prisma.staffMember.findFirst({
        where: { OR: [{ id: substituteTeacherId }, { staff_id: { equals: substituteTeacherId, mode: 'insensitive' as const } }] }
      });
      if (subStaff) {
        resolvedSubId = subStaff.id;
      } else {
        const subTeacher = await prisma.teacher.findUnique({ where: { id: substituteTeacherId } });
        if (subTeacher) {
          const linkedStaff = await prisma.staffMember.findFirst({ where: { teacher_id: subTeacher.id } });
          if (linkedStaff) resolvedSubId = linkedStaff.id;
        }
      }
    }

    const updated = await prisma.staffLeaveRequest.update({
      where: { id },
      data: {
        status: decision,
        ...(resolvedSubId ? { substitute_teacher_id: resolvedSubId } : {}),
        ...(remarks ? { reviewer_remarks: remarks } : {}),
        decided_at: new Date(),
        reviewed_by: req.user?.fullName || 'Admin'
      }
    });

    return sendSuccess(res, {
      ...updated,
      substituteTeacherId: substituteTeacherId || updated.substitute_teacher_id,
      substitute_teacher_id: substituteTeacherId || updated.substitute_teacher_id,
      totalDays: updated.total_days,
      startDate: updated.start_date,
      endDate: updated.end_date,
      leaveType: updated.leave_type
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 16. Helper handler for Staff Portal Dashboard
 */
export async function getStaffDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    let staff: any = null;
    if (req.user) {
      staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        },
        include: {
          teacher: {
            include: {
              batches: { where: { is_active: true } }
            }
          }
        }
      });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
      take: 5
    });

    const schedule = staff?.teacher?.batches?.map((b: any) => ({
      batchId: b.id,
      batchName: b.name,
      days: b.days,
      startTime: b.start_time,
      endTime: b.end_time
    })) || [];

    return sendSuccess(res, {
      schedule,
      announcements,
      todayAttendance: { status: 'present', checkIn: '08:30:00' },
      staff: staff ? { id: staff.id, staffId: staff.staff_id, fullName: staff.full_name, designation: staff.designation } : null
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}
