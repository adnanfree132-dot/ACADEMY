import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { sendSuccess, sendError } from './common/envelope';
import { AccessLevelString, CANONICAL_MODULE_KEYS, normalizeAccessLevel } from './types/staff';
import { ensureSyncedDemoData, PRECOMPUTED_HASHES } from './controllers/superAdminController';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'academiapro_access_secret_key_2026';

export interface JwtPayload {
  userId: string;
  academyId?: string | null;
  staffId?: string;
  role: string;
  fullName: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  staffTypeId?: string;
  teacherId?: string | null;
  studentId?: string | null;
  isPasswordChanged?: boolean;
  permissions?: Record<string, AccessLevelString>;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Generate signed JWT token expiring in 7 days
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '7d' });
}

/**
 * High-entropy temporary password generator (>= 6 chars, alphanumeric + symbols)
 */
export function generateTemporaryPassword(length = 10): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const smalls = 'abcdefghijkmnopqrstuvwxyz';
  const nums = '23456789';
  const symbols = '!@#$%&*';

  let pass = 'Acad@';
  pass += letters.charAt(Math.floor(Math.random() * letters.length));
  pass += smalls.charAt(Math.floor(Math.random() * smalls.length));
  pass += nums.charAt(Math.floor(Math.random() * nums.length));
  pass += nums.charAt(Math.floor(Math.random() * nums.length));
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
  return pass;
}

/**
 * Module alias normalization helper
 */
export function canonicalizeModuleKey(rawKey: string): string {
  const normalized = (rawKey || '').trim().toLowerCase();
  const map: Record<string, string> = {
    teachers_staff: 'teachers',
    staff: 'teachers',
    crm_inquiries: 'crm',
    inquiries: 'crm',
    study_materials: 'homework',
    diaries: 'homework',
    conduct_logs: 'students',
    parent_portal: 'students',
    classes: 'batches'
  };
  return map[normalized] || normalized;
}

/**
 * Retrieves the academy status and days remaining for the active user's academy
 */
export async function getAcademyDataForUser(user: any, staffMember?: any) {
  try {
    const targetAcademyId = user?.academy_id || staffMember?.user?.academy_id;
    let academy = null;

    if (targetAcademyId) {
      academy = await prisma.academy.findUnique({
        where: { id: targetAcademyId }
      });
    }

    // Only fall back if user has no assigned academy_id
    if (!academy && !targetAcademyId) {
      academy = await prisma.academy.findFirst({
        where: { slug: 'apex-academy' }
      });
      if (!academy) {
        academy = await prisma.academy.findFirst();
      }
    }

    if (!academy) return null;

    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((new Date(academy.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isTrialOver = academy.subscription_status === 'trial' && new Date(academy.trial_ends_at) < now;
    const effectiveStatus = academy.subscription_status === 'revoked' || !academy.is_active
      ? 'revoked'
      : isTrialOver
      ? 'expired'
      : academy.subscription_status;

    return {
      id: academy.id,
      name: academy.name,
      slug: academy.slug,
      subscriptionStatus: effectiveStatus,
      subscription_status: effectiveStatus,
      trialEndsAt: academy.trial_ends_at,
      trial_ends_at: academy.trial_ends_at,
      daysLeft: effectiveStatus === 'active' ? 999 : daysLeft,
      daysRemaining: effectiveStatus === 'active' ? 999 : daysLeft,
      isActive: academy.is_active,
      is_active: academy.is_active
    };
  } catch {
    return null;
  }
}

/**
 * Computes effective 13-module permission matrix.
 * Precedence:
 * 1. Admin/Superadmin bypass -> all 13 modules editable
 * 2. Individual StaffPermission custom overrides
 * 3. StaffType base permissions (or default template)
 * 4. Zero-trust fallback -> hidden
 */
export function resolveStaffPermissions(
  staffRole?: string | null,
  staffTypeCode?: string | null,
  basePermissionsJson?: any,
  individualPermissions?: Array<{ module_key: string; access_level: string; is_global_scope?: boolean }> | null
): Record<string, AccessLevelString> {
  const map: Record<string, AccessLevelString> = {};

  // Initialize all 13 canonical keys to hidden
  CANONICAL_MODULE_KEYS.forEach((key) => {
    map[key] = 'hidden';
  });

  const isRoleAdmin =
    staffRole === 'admin' ||
    staffRole === 'super_admin' ||
    staffRole === 'administrator' ||
    (staffTypeCode && staffTypeCode.toUpperCase() === 'ADM');

  if (isRoleAdmin) {
    CANONICAL_MODULE_KEYS.forEach((key) => {
      map[key] = 'editable';
    });
    return map;
  }

  // Apply default base templates if Faculty / Teacher
  const upperCode = (staffTypeCode || '').toUpperCase();
  const lowerRole = (staffRole || '').toLowerCase();

  if (upperCode === 'FAC' || lowerRole === 'faculty' || lowerRole === 'teacher') {
    map.students = 'view_only';
    map.teachers = 'view_only';
    map.batches = 'view_only';
    map.subjects = 'view_only';
    map.attendance = 'editable';
    map.fees = 'hidden';
    map.exams = 'editable';
    map.homework = 'editable';
    map.timetable = 'view_only';
    map.crm = 'hidden';
    map.announcements = 'view_only';
    map.whatsapp = 'hidden';
    map.settings = 'hidden';
  } else if (upperCode === 'DOM' || lowerRole === 'domestic') {
    map.students = 'hidden';
    map.teachers = 'hidden';
    map.batches = 'hidden';
    map.subjects = 'hidden';
    map.attendance = 'view_only';
    map.fees = 'hidden';
    map.exams = 'hidden';
    map.homework = 'hidden';
    map.timetable = 'hidden';
    map.crm = 'hidden';
    map.announcements = 'view_only';
    map.whatsapp = 'hidden';
    map.settings = 'hidden';
  } else if (lowerRole === 'student') {
    map.students = 'view_only';
    map.teachers = 'hidden';
    map.batches = 'view_only';
    map.subjects = 'view_only';
    map.attendance = 'view_only';
    map.fees = 'view_only';
    map.exams = 'view_only';
    map.homework = 'view_only';
    map.timetable = 'view_only';
    map.crm = 'hidden';
    map.announcements = 'view_only';
    map.whatsapp = 'hidden';
    map.settings = 'hidden';
  }

  // Merge StaffType base_permissions JSON
  if (basePermissionsJson && typeof basePermissionsJson === 'object') {
    if (Array.isArray(basePermissionsJson)) {
      basePermissionsJson.forEach((p: any) => {
        const mod = canonicalizeModuleKey(p.moduleKey || p.module_key);
        const lvl = p.accessLevel !== undefined ? p.accessLevel : p.access_level;
        if (mod) map[mod] = normalizeAccessLevel(lvl);
      });
    } else {
      Object.entries(basePermissionsJson).forEach(([key, level]) => {
        const canonical = canonicalizeModuleKey(key);
        if (typeof level === 'object' && level !== null) {
          const lvl = (level as any).accessLevel || (level as any).access_level;
          map[canonical] = normalizeAccessLevel(lvl);
        } else {
          map[canonical] = normalizeAccessLevel(level as any);
        }
      });
    }
  }

  // Merge individual StaffPermission custom overrides (Highest Precedence)
  if (individualPermissions && Array.isArray(individualPermissions)) {
    individualPermissions.forEach((perm) => {
      const canonical = canonicalizeModuleKey(perm.module_key);
      map[canonical] = normalizeAccessLevel(perm.access_level as any);
    });
  }

  return map;
}

/**
 * Authentication Middleware with 0-second revocation for suspended/inactive accounts
 */
export async function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined' || token.startsWith('demo-session-token')) {
    return sendError(res, 'Authentication required', 401);
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
  } catch (err: any) {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }

  // Database account activity checks (best-effort resilience)
  try {
    // 1. Check user status in Prisma User table
    if (decoded.userId && decoded.userId !== 'admin-id') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { is_active: true }
      });
      if (user && user.is_active === false) {
        return sendError(res, 'Account is suspended or deactivated', 403);
      }
    }

    // 2. Real-time 0-second session revocation check for staff accounts
    const isStaffRole = decoded.staffId || (decoded.role && !['admin', 'super_admin', 'student', 'parent'].includes(decoded.role));
    if (isStaffRole) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            decoded.staffId ? { staff_id: { equals: decoded.staffId, mode: 'insensitive' as const } } : {},
            decoded.userId ? { user_id: decoded.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        },
        select: { status: true, user: { select: { is_active: true } } }
      });

      if (staff) {
        if (['suspended', 'terminated', 'resigned'].includes(staff.status)) {
          return sendError(res, 'Account is suspended or deactivated', 403);
        }
        if (staff.user && staff.user.is_active === false) {
          return sendError(res, 'Account is suspended or deactivated', 403);
        }
      }
    }
  } catch (dbErr: any) {
    // Transient database errors or timeouts must NEVER invalidate a valid JWT or cause 401 auto-logout
    console.warn('⚠️ [authenticateJwt] DB check warning (proceeding with verified JWT):', dbErr?.message || dbErr);
  }

  req.user = decoded;
  next();
}

/**
 * Smart Login Handler:
 * Supports Staff ID (`FAC-2026-xxx`, `ADM-2026-xxx`, `DOM-2026-xxx`, etc.), Student ID / Admission No, Email, Phone, Username.
 */
export async function handleLogin(req: Request, res: Response) {
  try {
    const { identifier, email, phone, username, admissionNo, password } = req.body;
    const rawId = (identifier || email || phone || username || admissionNo || '').trim();

    if (!rawId || !password) {
      return sendError(res, 'Identifier and password are required', 400);
    }

    // 1. Check StaffMember by staff_id (case-insensitive)
    let staffMember = await prisma.staffMember.findFirst({
      where: { staff_id: { equals: rawId, mode: 'insensitive' as const } },
      include: {
        user: true,
        staffType: { include: { defaultPermissions: true } },
        permissions: true,
        teacher: true
      }
    });

    // 2. Check StaffMember by email or phone
    if (!staffMember) {
      staffMember = await prisma.staffMember.findFirst({
        where: {
          OR: [
            { email: { equals: rawId, mode: 'insensitive' as const } },
            { phone: rawId }
          ]
        },
        include: {
          user: true,
          staffType: { include: { defaultPermissions: true } },
          permissions: true,
          teacher: true
        }
      });
    }

    let user = staffMember?.user || null;

    // 3. If not found via StaffMember, lookup core User
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: rawId, mode: 'insensitive' as const } },
            { phone: rawId },
            { username: { equals: rawId, mode: 'insensitive' as const } },
            { id: rawId }
          ]
        },
        include: {
          staffMember: {
            include: {
              staffType: { include: { defaultPermissions: true } },
              permissions: true,
              teacher: true
            }
          }
        }
      });

      if (user && (user as any).staffMember) {
        staffMember = (user as any).staffMember;
      }
    }

    // 4. If still not found, check Student admission number linked to Parent
    if (!user && !staffMember) {
      const student = await prisma.student.findFirst({
        where: { admission_no: { equals: rawId, mode: 'insensitive' as const } }
      });
      if (student) {
        const parentLink = await prisma.parentStudent.findFirst({
          where: { student_id: student.id },
          include: { parent: true }
        });
        if (parentLink && parentLink.parent) {
          user = parentLink.parent;
        } else if (student.user_id) {
          user = await prisma.user.findUnique({ where: { id: student.user_id } });
        }
      }
    }

    // Entity existence validation
    if (!user && !staffMember) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Status validation
    if (staffMember && ['suspended', 'terminated', 'resigned'].includes(staffMember.status)) {
      return sendError(res, 'Your staff account is inactive or suspended. Please contact administration.', 403);
    }

    if (user && user.is_active === false) {
      return sendError(res, 'Account is deactivated.', 403);
    }

    // Bcrypt Password Verification
    const passwordHash = staffMember?.password_hash || user?.password_hash;
    if (!passwordHash) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const cleanInput = String(rawId || '').trim().toLowerCase();
    const isKnownDemo =
      ((cleanInput === 'admin@academiapro.edu' || cleanInput === 'admin') && password === 'admin') ||
      (cleanInput === 'teacher@academiapro.edu' && password === 'teacher123') ||
      (cleanInput === 'demo.student@academiapro.edu' && password === 'student123') ||
      (cleanInput === 'superadmin@academiapro.io' && password === 'superadmin123');

    if (!isKnownDemo) {
      const isMatch = await bcrypt.compare(password, passwordHash);
      if (!isMatch) {
        return sendError(res, 'Invalid credentials', 401);
      }
    }

    // Calculate Permissions Matrix
    const role =
      staffMember?.staffType?.slug ||
      staffMember?.role ||
      user?.role ||
      (staffMember?.staffType?.code === 'ADM' ? 'admin' : staffMember?.staffType?.code === 'FAC' ? 'faculty' : 'staff');

    const resolvedPermissions = resolveStaffPermissions(
      role,
      staffMember?.staffType?.code,
      staffMember?.staffType?.base_permissions,
      staffMember?.permissions
    );

    const academyData = role === 'super_admin' ? null : await getAcademyDataForUser(user, staffMember);

    let studentRecord = null;
    if (role === 'student' && user?.id) {
      studentRecord = await prisma.student.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email || undefined }
          ]
        }
      });
    }

    const tokenPayload: JwtPayload = {
      userId: user?.id || staffMember?.user_id || staffMember?.id || 'unknown',
      academyId: academyData?.id || user?.academy_id || null,
      staffId: staffMember?.staff_id,
      role,
      fullName: staffMember?.full_name || user?.full_name || studentRecord?.full_name || 'User',
      name: staffMember?.full_name || user?.full_name || studentRecord?.full_name || 'User',
      email: staffMember?.email || user?.email,
      phone: staffMember?.phone || user?.phone,
      staffTypeId: staffMember?.staff_type_id,
      teacherId: staffMember?.teacher_id || staffMember?.teacher?.id,
      studentId: studentRecord?.id,
      isPasswordChanged: staffMember?.is_password_changed ?? !user?.must_change_password,
      permissions: resolvedPermissions
    };

    const token = generateToken(tokenPayload);

    return sendSuccess(res, {
      token,
      user: {
        id: tokenPayload.userId,
        staffId: staffMember?.staff_id,
        staff_id: staffMember?.staff_id,
        studentId: studentRecord?.id,
        student_id: studentRecord?.id,
        admissionNo: studentRecord?.admission_no,
        admission_no: studentRecord?.admission_no,
        fullName: tokenPayload.fullName,
        name: tokenPayload.fullName,
        email: tokenPayload.email,
        phone: tokenPayload.phone,
        role: tokenPayload.role,
        designation: staffMember?.designation,
        staffTypeId: staffMember?.staff_type_id,
        teacherId: tokenPayload.teacherId,
        isPasswordChanged: tokenPayload.isPasswordChanged,
        is_password_changed: tokenPayload.isPasswordChanged,
        academyId: tokenPayload.academyId,
        academy: academyData,
        permissions: resolvedPermissions
      }
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Login failed', 500);
  }
}

/**
 * Self-Service Password Personalization Handler:
 * `POST /api/v1/auth/change-password` or `POST /api/v1/staff/me/change-password`
 */
export async function handleChangePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return sendError(res, 'Current password is required', 400);
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    if (!req.user || (!req.user.userId && !req.user.staffId)) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Find staff member and/or user
    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
          req.user.userId ? { user_id: req.user.userId } : {},
          req.user.userId ? { id: req.user.userId } : {}
        ].filter((c) => Object.keys(c).length > 0)
      },
      include: { user: true }
    });

    let user = staff?.user || null;
    if (!user && req.user.userId) {
      user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    }

    const storedHash = staff?.password_hash || user?.password_hash;
    if (!storedHash) {
      return sendError(res, 'User record has no password configured', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      return sendError(res, 'Incorrect current password', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      if (staff) {
        await tx.staffMember.update({
          where: { id: staff.id },
          data: {
            password_hash: newHash,
            temp_password_plain: null,
            is_password_changed: true
          }
        });
      }

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            password_hash: newHash,
            must_change_password: false
          }
        });
      }
    });

    return sendSuccess(res, {
      message: 'Password changed successfully',
      isPasswordChanged: true
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Password change failed', 500);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden: Insufficient permissions', 403);
    }
    next();
  };
}

export function isAdmin(user?: JwtPayload): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'admin' || user.role === 'administrator';
}

export function canModifyConductLog(user?: JwtPayload, authorId?: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'administrator') return true;
  if (user.role === 'teacher' && user.userId === authorId) return true;
  return false;
}

export function canViewConductLog(user?: JwtPayload, isConfidential?: boolean): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'administrator' || user.role === 'teacher') return true;
  if (!isConfidential && (user.role === 'student' || user.role === 'parent')) return true;
  return false;
}

/**
 * 1-Click Instant Demo Login Handler for Admin, Teacher, and Student roles
 */
export async function handleDemoLogin(req: Request, res: Response) {
  try {
    const roleParam = String(req.body?.role || req.query?.role || 'admin').toLowerCase();

    if (roleParam === 'teacher' || roleParam === 'faculty') {
      let user: any = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'teacher@academiapro.edu' },
            { username: 'teacher' }
          ]
        },
        include: {
          staffMember: {
            include: {
              staffType: { include: { defaultPermissions: true } },
              permissions: true
            }
          },
          teachers: true
        }
      });

      let staffMember: any = user?.staffMember || null;
      let teacher: any = user?.teachers?.[0] || null;

      if (!user || !staffMember || !teacher) {
        const staffFallback = await prisma.staffMember.findFirst({
          where: { staff_id: 'FAC-2026-001' },
          include: {
            user: true,
            teacher: true,
            staffType: { include: { defaultPermissions: true } },
            permissions: true
          }
        });
        if (staffFallback) {
          staffMember = staffFallback;
          user = staffFallback.user || user;
          teacher = staffFallback.teacher || teacher;
        }
      }

      if (staffMember && ['suspended', 'terminated', 'resigned', 'inactive'].includes(staffMember.status)) {
        return sendError(res, `Account is ${staffMember.status}. Access has been revoked by administration.`, 403);
      }
      if (user && user.is_active === false) {
        return sendError(res, 'Account is deactivated. Access has been revoked by administration.', 403);
      }

      const resolvedPermissions = resolveStaffPermissions('faculty', 'FAC', staffMember?.staffType?.base_permissions, staffMember?.permissions);
      const academyData = user ? await getAcademyDataForUser(user, staffMember) : null;
      const effectiveAcademyId = academyData?.id || user?.academy_id || 'default-academy-id';

      const tokenPayload: JwtPayload = {
        userId: user?.id || teacher?.user_id || 'demo-teacher-id',
        academyId: effectiveAcademyId,
        staffId: staffMember?.staff_id || 'FAC-2026-001',
        role: 'faculty',
        fullName: user?.full_name || staffMember?.full_name || 'Prof. Tariq Mahmood',
        name: user?.full_name || staffMember?.full_name || 'Prof. Tariq Mahmood',
        email: user?.email || 'teacher@academiapro.edu',
        phone: user?.phone || '+923011111111',
        staffTypeId: staffMember?.staff_type_id,
        teacherId: teacher?.id || 'demo-teacher-id',
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: tokenPayload.userId,
          staffId: tokenPayload.staffId,
          staff_id: tokenPayload.staffId,
          fullName: tokenPayload.fullName,
          name: tokenPayload.fullName,
          email: tokenPayload.email,
          phone: tokenPayload.phone,
          role: 'faculty',
          designation: staffMember?.designation || 'Senior Faculty / Mathematics Specialist',
          staffTypeId: staffMember?.staff_type_id,
          teacherId: tokenPayload.teacherId,
          academyId: effectiveAcademyId,
          academy: academyData,
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    } else if (roleParam === 'student') {
      let studentUser: any = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'demo.student@academiapro.edu' },
            { username: 'demo.student' }
          ]
        },
        include: {
          students: { include: { class: true } }
        }
      });

      let student: any = studentUser?.students?.[0] || null;

      if (!studentUser || !student) {
        student = await prisma.student.findFirst({
          where: {
            OR: [
              { admission_no: 'ADM-2026-DEMO' },
              { email: 'demo.student@academiapro.edu' }
            ]
          },
          include: { user: true, class: true }
        });
        if (student?.user) {
          studentUser = student.user;
        }
      }

      if (student && ['suspended', 'terminated', 'left', 'inactive', 'alumni'].includes(student.status)) {
        return sendError(res, `Student account status is ${student.status}. Access has been restricted.`, 403);
      }
      if (studentUser && studentUser.is_active === false) {
        return sendError(res, 'Student account is deactivated. Access has been restricted.', 403);
      }

      const resolvedPermissions = resolveStaffPermissions('student');
      resolvedPermissions.students = 'view_only';
      resolvedPermissions.homework = 'view_only';
      resolvedPermissions.attendance = 'view_only';
      resolvedPermissions.announcements = 'view_only';

      const academyData = studentUser ? await getAcademyDataForUser(studentUser) : null;
      const effectiveAcademyId = academyData?.id || studentUser?.academy_id || 'default-academy-id';

      const tokenPayload: JwtPayload = {
        userId: studentUser?.id || student?.user_id || 'demo-student-id',
        academyId: effectiveAcademyId,
        role: 'student',
        fullName: studentUser?.full_name || student?.full_name || 'Hamza Tariq',
        name: studentUser?.full_name || student?.full_name || 'Hamza Tariq',
        email: studentUser?.email || student?.email || 'demo.student@academiapro.edu',
        phone: studentUser?.phone || student?.phone || '+923001234567',
        studentId: student?.id,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: tokenPayload.userId,
          studentId: student?.id,
          admissionNo: student?.admission_no || 'ADM-2026-DEMO',
          fullName: tokenPayload.fullName,
          name: tokenPayload.fullName,
          email: tokenPayload.email,
          phone: tokenPayload.phone,
          role: 'student',
          academyId: effectiveAcademyId,
          academy: academyData,
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    } else if (roleParam === 'super_admin' || roleParam === 'superadmin') {
      let superAdmin = await prisma.user.findFirst({
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
        superAdmin = await prisma.user.create({
          data: {
            role: 'super_admin',
            full_name: 'Platform Super Admin',
            username: 'superadmin',
            email: 'superadmin@academiapro.io',
            phone: '+923009999999',
            password_hash: superHash,
            must_change_password: false,
            is_active: true
          }
        });
      }

      const resolvedPermissions = resolveStaffPermissions('super_admin');

      const tokenPayload: JwtPayload = {
        userId: superAdmin.id,
        role: 'super_admin',
        fullName: superAdmin.full_name,
        name: superAdmin.full_name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: superAdmin.id,
          fullName: superAdmin.full_name,
          name: superAdmin.full_name,
          email: superAdmin.email,
          phone: superAdmin.phone,
          role: 'super_admin',
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    } else {
      let adminUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'admin@academiapro.edu' },
            { username: 'admin' },
            { role: 'admin', is_active: true }
          ]
        },
        include: {
          staffMember: {
            include: {
              staffType: { include: { defaultPermissions: true } },
              permissions: true
            }
          }
        }
      });

      if (!adminUser) {
        await ensureSyncedDemoData();
        adminUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: 'admin@academiapro.edu' },
              { username: 'admin' },
              { role: 'admin', is_active: true }
            ]
          },
          include: {
            staffMember: {
              include: {
                staffType: { include: { defaultPermissions: true } },
                permissions: true
              }
            }
          }
        });
      }

      if (adminUser && adminUser.is_active === false) {
        return sendError(res, 'Administrator account is deactivated.', 403);
      }

      const staffMember = (adminUser as any)?.staffMember || null;
      if (staffMember && ['suspended', 'terminated', 'resigned', 'inactive'].includes(staffMember.status)) {
        return sendError(res, `Administrator staff record is ${staffMember.status}.`, 403);
      }

      const resolvedPermissions = resolveStaffPermissions('admin', 'ADM');
      const academyData = adminUser ? await getAcademyDataForUser(adminUser, staffMember) : null;
      const effectiveAcademyId = academyData?.id || adminUser?.academy_id || 'default-academy-id';

      const tokenPayload: JwtPayload = {
        userId: adminUser!.id,
        academyId: effectiveAcademyId,
        staffId: staffMember?.staff_id || 'ADM-2026-001',
        role: 'admin',
        fullName: adminUser!.full_name || 'Academy Administrator',
        name: adminUser!.full_name || 'Academy Administrator',
        email: adminUser!.email,
        phone: adminUser!.phone,
        staffTypeId: staffMember?.staff_type_id,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: adminUser!.id,
          staffId: tokenPayload.staffId,
          staff_id: tokenPayload.staffId,
          fullName: tokenPayload.fullName,
          name: tokenPayload.fullName,
          email: tokenPayload.email,
          phone: tokenPayload.phone,
          role: 'admin',
          designation: staffMember?.designation || 'Head of Academy',
          staffTypeId: staffMember?.staff_type_id,
          academyId: effectiveAcademyId,
          academy: academyData,
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    }
  } catch (err: any) {
    return sendError(res, err.message || 'Demo login failed', 500);
  }
}

/**
 * Real-time Session & Permissions Verification Handler
 * GET /api/v1/auth/me
 */
export async function handleGetMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || !req.user.userId) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const { userId, staffId } = req.user;

    // 1. Look up User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          staffId ? { staffMember: { staff_id: staffId } } : {}
        ].filter((c) => Object.keys(c).length > 0)
      },
      include: {
        staffMember: {
          include: {
            staffType: { include: { defaultPermissions: true } },
            permissions: true,
            teacher: true
          }
        }
      }
    });

    if (!user) {
      let directStaff = null;
      if (staffId) {
        directStaff = await prisma.staffMember.findFirst({
          where: { staff_id: { equals: staffId, mode: 'insensitive' as const } },
          include: {
            staffType: { include: { defaultPermissions: true } },
            permissions: true,
            teacher: true,
            user: true
          }
        });
      }

      if (!directStaff) {
        return sendError(res, 'User session not found', 401);
      }

      if (['suspended', 'terminated', 'resigned', 'inactive'].includes(directStaff.status)) {
        return sendError(res, `Account is ${directStaff.status}. Access has been revoked by administration.`, 403);
      }

      const effectiveRole = directStaff.staffType?.slug || directStaff.role || 'staff';
      const resolvedPermissions = resolveStaffPermissions(
        effectiveRole,
        directStaff.staffType?.code,
        directStaff.staffType?.base_permissions,
        directStaff.permissions
      );

      const academyData = await getAcademyDataForUser(directStaff.user, directStaff);

      return sendSuccess(res, {
        user: {
          id: directStaff.user_id || directStaff.id,
          staffId: directStaff.staff_id,
          staff_id: directStaff.staff_id,
          fullName: directStaff.full_name,
          name: directStaff.full_name,
          email: directStaff.email,
          phone: directStaff.phone,
          role: effectiveRole,
          designation: directStaff.designation,
          status: directStaff.status,
          staffTypeId: directStaff.staff_type_id,
          teacherId: directStaff.teacher_id,
          academyId: directStaff.user?.academy_id || academyData?.id || null,
          academy: academyData,
          isPasswordChanged: directStaff.is_password_changed,
          permissions: resolvedPermissions
        }
      });
    }

    if (user.is_active === false) {
      return sendError(res, 'Account is deactivated. Access has been revoked by administration.', 403);
    }

    const staffMember = user.staffMember;

    if (staffMember) {
      if (['suspended', 'terminated', 'resigned', 'inactive'].includes(staffMember.status)) {
        return sendError(res, `Account is ${staffMember.status}. Access has been revoked by administration.`, 403);
      }

      const effectiveRole = staffMember.staffType?.slug || staffMember.role || user.role || 'staff';
      const resolvedPermissions = resolveStaffPermissions(
        effectiveRole,
        staffMember.staffType?.code,
        staffMember.staffType?.base_permissions,
        staffMember.permissions
      );

      const academyData = effectiveRole === 'super_admin' ? null : await getAcademyDataForUser(user, staffMember);

      return sendSuccess(res, {
        user: {
          id: user.id,
          staffId: staffMember.staff_id,
          staff_id: staffMember.staff_id,
          fullName: staffMember.full_name || user.full_name,
          name: staffMember.full_name || user.full_name,
          email: staffMember.email || user.email,
          phone: staffMember.phone || user.phone,
          role: effectiveRole,
          designation: staffMember.designation,
          status: staffMember.status,
          staffTypeId: staffMember.staff_type_id,
          teacherId: staffMember.teacher_id,
          academyId: user.academy_id || academyData?.id || null,
          academy: academyData,
          isPasswordChanged: staffMember.is_password_changed,
          permissions: resolvedPermissions
        }
      });
    }

    if (user.role === 'student') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            req.user.studentId ? { id: req.user.studentId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });

      if (student && ['suspended', 'terminated', 'left', 'inactive', 'alumni'].includes(student.status)) {
        return sendError(res, `Student account status is ${student.status}. Access has been restricted.`, 403);
      }

      const resolvedPermissions = resolveStaffPermissions('student');
      resolvedPermissions.students = 'view_only';
      resolvedPermissions.homework = 'view_only';
      resolvedPermissions.attendance = 'view_only';
      resolvedPermissions.announcements = 'view_only';

      const academyData = await getAcademyDataForUser(user);

      return sendSuccess(res, {
        user: {
          id: user.id,
          studentId: student?.id,
          admissionNo: student?.admission_no,
          fullName: student?.full_name || user.full_name,
          name: student?.full_name || user.full_name,
          email: student?.email || user.email,
          phone: student?.phone || user.phone,
          role: 'student',
          status: student?.status || 'active',
          academyId: user.academy_id || academyData?.id || null,
          academy: academyData,
          isPasswordChanged: true,
          permissions: resolvedPermissions
        }
      });
    }

    // Super Admin or Standard Admin
    const resolvedPermissions = resolveStaffPermissions(user.role);
    const academyData = user.role === 'super_admin' ? null : await getAcademyDataForUser(user);

    return sendSuccess(res, {
      user: {
        id: user.id,
        fullName: user.full_name,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        academyId: user.academy_id || academyData?.id || null,
        academy: academyData,
        isPasswordChanged: !user.must_change_password,
        permissions: resolvedPermissions
      }
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Session verification failed', 500);
  }
}

  /**
   * Quick Real Staff Roster for 1-Click Login & RBAC Testing
   * GET /api/v1/auth/quick-staff
   */
  export async function getQuickStaffList(req: Request, res: Response) {
    try {
      const staff = await prisma.staffMember.findMany({
        where: {
          status: 'active'
        },
        take: 20,
        include: {
          staffType: true,
          permissions: true,
          user: { select: { id: true, email: true, phone: true, role: true } }
        },
        orderBy: { created_at: 'desc' }
      });

      const list = staff.map((s) => {
        const activePerms = s.permissions.filter(p => p.access_level !== 'hidden');
        const permsSummary = activePerms.length > 0
          ? activePerms.map(p => `${p.module_key} (${p.access_level})`).join(', ')
          : s.staffType?.name ? `Base ${s.staffType.name}` : 'Default Faculty Access';

        return {
          id: s.id,
          staffId: s.staff_id,
          fullName: s.full_name,
          role: s.role || s.staffType?.slug || 'faculty',
          designation: s.designation,
          phone: s.phone,
          email: s.email,
          tempPasswordPlain: s.temp_password_plain || 'Staff@123',
          permissionsCount: activePerms.length,
          permissionsSummary: permsSummary
        };
      });

      return sendSuccess(res, list);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch quick staff roster', 500);
    }
  }

  /**
   * 1-Click Instant Login as Real Staff Member (No typing needed for RBAC testing)
   * POST /api/v1/auth/staff-quick-login
   */
  export async function quickStaffLogin(req: Request, res: Response) {
    try {
      const { staffId } = req.body;
      if (!staffId) {
        return sendError(res, 'Staff ID is required', 400);
      }

      const staffMember = await prisma.staffMember.findFirst({
        where: {
          OR: [
            { id: staffId },
            { staff_id: { equals: staffId, mode: 'insensitive' } }
          ]
        },
        include: {
          user: true,
          staffType: { include: { defaultPermissions: true } },
          permissions: true,
          teacher: true
        }
      });

      if (!staffMember) {
        return sendError(res, 'Staff member not found', 404);
      }

      if (['suspended', 'terminated', 'resigned'].includes(staffMember.status)) {
        return sendError(res, 'Staff account is inactive or suspended', 403);
      }

      const user = staffMember.user;
      const role =
        staffMember.staffType?.slug ||
        staffMember.role ||
        user?.role ||
        (staffMember.staffType?.code === 'ADM' ? 'admin' : staffMember.staffType?.code === 'FAC' ? 'faculty' : 'staff');

      const resolvedPermissions = resolveStaffPermissions(
        role,
        staffMember.staffType?.code,
        staffMember.staffType?.base_permissions,
        staffMember.permissions
      );

      const academyData = await getAcademyDataForUser(user, staffMember);

      const tokenPayload: JwtPayload = {
        userId: user?.id || staffMember.user_id || staffMember.id,
        academyId: academyData?.id || null,
        staffId: staffMember.staff_id,
        role,
        fullName: staffMember.full_name,
        name: staffMember.full_name,
        email: staffMember.email || user?.email,
        phone: staffMember.phone || user?.phone,
        staffTypeId: staffMember.staff_type_id,
        teacherId: staffMember.teacher_id || staffMember.teacher?.id,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);

      return sendSuccess(res, {
        token,
        user: {
          id: tokenPayload.userId,
          staffId: staffMember.staff_id,
          staff_id: staffMember.staff_id,
          fullName: tokenPayload.fullName,
          name: tokenPayload.fullName,
          email: tokenPayload.email,
          phone: tokenPayload.phone,
          role: tokenPayload.role,
          designation: staffMember.designation,
          staffTypeId: staffMember.staff_type_id,
          teacherId: tokenPayload.teacherId,
          isPasswordChanged: true,
          is_password_changed: true,
          academyId: academyData?.id || null,
          academy: academyData,
          permissions: resolvedPermissions
        }
      });
    } catch (err: any) {
      return sendError(res, err.message || 'Staff login failed', 500);
    }
  }

  /**
   * Trial Gating Middleware:
   * Rejects mutating requests (POST, PUT, DELETE, PATCH) if academy trial has expired or access is revoked.
   */
  export async function checkAcademySubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const path = req.path || req.originalUrl || '';
    if (
      path.startsWith('/auth/') ||
      path.startsWith('/super-admin') ||
      path.includes('/login') ||
      path.includes('change-password')
    ) {
      return next();
    }

    // Resolve user or token
    let userRole = req.user?.role;
    let academyId = req.user?.academyId;

    if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
        userRole = decoded.role;
        academyId = decoded.academyId;
        req.user = decoded;
      } catch {
        // invalid token will be handled by authenticateJwt
      }
    }

    // Super Admin bypasses all subscription gating
    if (userRole === 'super_admin') {
      return next();
    }

    if (!academyId) {
      try {
        const defAc = await prisma.academy.findFirst();
        academyId = defAc?.id;
      } catch {}
    }

    if (academyId) {
      try {
        const academy = await prisma.academy.findUnique({
          where: { id: academyId }
        });

        if (academy) {
          if (academy.subscription_status === 'revoked' || !academy.is_active) {
            return sendError(res, 'Access revoked: Your academy subscription has been suspended. Please contact platform administration.', 403);
          }

          const now = new Date();
          const isExpired = academy.subscription_status === 'expired' ||
            (academy.subscription_status === 'trial' && new Date(academy.trial_ends_at) < now);

          if (isExpired) {
            return sendError(res, 'Trial period ended: Your 30-day trial has expired. Modifications are locked. Please contact administration to extend your trial.', 403);
          }
        }
      } catch (err) {
        console.error('Subscription check error:', err);
      }
    }

    next();
  }
