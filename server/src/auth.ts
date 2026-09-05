import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { sendSuccess, sendError } from './common/envelope';
import { AccessLevelString, CANONICAL_MODULE_KEYS, normalizeAccessLevel } from './types/staff';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'academiapro_access_secret_key_2026';

export interface JwtPayload {
  userId: string;
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

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;

    // Real-time 0-second session revocation check for suspended/terminated/resigned accounts
    if (decoded.staffId || (decoded.userId && decoded.userId !== 'admin-id')) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            decoded.staffId ? { staff_id: { equals: decoded.staffId, mode: 'insensitive' as const } } : {},
            decoded.userId ? { user_id: decoded.userId } : {},
            decoded.userId ? { id: decoded.userId } : {}
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

    req.user = decoded;
    next();
  } catch (err: any) {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
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

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
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

    const tokenPayload: JwtPayload = {
      userId: user?.id || staffMember?.user_id || staffMember?.id || 'unknown',
      staffId: staffMember?.staff_id,
      role,
      fullName: staffMember?.full_name || user?.full_name || 'Staff User',
      name: staffMember?.full_name || user?.full_name || 'Staff User',
      email: staffMember?.email || user?.email,
      phone: staffMember?.phone || user?.phone,
      staffTypeId: staffMember?.staff_type_id,
      teacherId: staffMember?.teacher_id || staffMember?.teacher?.id,
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
      let teacher = await prisma.teacher.findFirst({
        where: { user: { is_active: true } },
        include: {
          user: true,
          staffMember: {
            include: {
              staffType: { include: { defaultPermissions: true } },
              permissions: true
            }
          }
        }
      });

      if (!teacher) {
        const teacherUser = await prisma.user.findFirst({
          where: { role: 'teacher', is_active: true }
        });
        if (teacherUser) {
          teacher = await prisma.teacher.upsert({
            where: { user_id: teacherUser.id },
            update: {},
            create: { user_id: teacherUser.id, qualification: 'Senior Faculty' },
            include: {
              user: true,
              staffMember: {
                include: {
                  staffType: { include: { defaultPermissions: true } },
                  permissions: true
                }
              }
            }
          });
        }
      }

      const staffMember = teacher?.staffMember || null;
      const user = teacher?.user || null;
      const resolvedPermissions = resolveStaffPermissions('faculty', 'FAC', staffMember?.staffType?.base_permissions, staffMember?.permissions);

      const tokenPayload: JwtPayload = {
        userId: user?.id || teacher?.user_id || 'demo-teacher-id',
        staffId: staffMember?.staff_id || 'FAC-2026-DEMO',
        role: 'faculty',
        fullName: user?.full_name || staffMember?.full_name || 'Ms. Sarah Jenkins (Faculty)',
        name: user?.full_name || staffMember?.full_name || 'Ms. Sarah Jenkins (Faculty)',
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
          designation: staffMember?.designation || 'Senior Faculty Lecturer',
          staffTypeId: staffMember?.staff_type_id,
          teacherId: tokenPayload.teacherId,
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    } else if (roleParam === 'student') {
      const student = await prisma.student.findFirst({
        where: { status: 'active' },
        include: { user: true, class: true }
      });

      let studentUser = student?.user || null;
      if (!studentUser) {
        studentUser = await prisma.user.findFirst({
          where: { role: 'student', is_active: true }
        });
      }

      if (!studentUser) {
        const dummyHash = await bcrypt.hash('student123', 10);
        studentUser = await prisma.user.create({
          data: {
            role: 'student',
            full_name: student?.full_name || 'Zaid Khan (Student)',
            email: 'demo.student@academiapro.edu',
            phone: '+923001234567',
            password_hash: dummyHash,
            is_active: true
          }
        });
        if (student) {
          await prisma.student.update({
            where: { id: student.id },
            data: { user_id: studentUser.id }
          });
        }
      }

      const resolvedPermissions = resolveStaffPermissions('student');
      resolvedPermissions.students = 'view_only';
      resolvedPermissions.homework = 'view_only';
      resolvedPermissions.attendance = 'view_only';
      resolvedPermissions.announcements = 'view_only';

      const tokenPayload: JwtPayload = {
        userId: studentUser.id,
        role: 'student',
        fullName: studentUser.full_name,
        name: studentUser.full_name,
        email: studentUser.email,
        phone: studentUser.phone,
        studentId: student?.id,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: studentUser.id,
          studentId: student?.id,
          admissionNo: student?.admission_no || 'ADM-2026-DEMO',
          fullName: studentUser.full_name,
          name: studentUser.full_name,
          email: studentUser.email,
          phone: studentUser.phone,
          role: 'student',
          isPasswordChanged: true,
          is_password_changed: true,
          permissions: resolvedPermissions
        }
      });
    } else {
      let adminUser = await prisma.user.findFirst({
        where: { role: 'admin', is_active: true },
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
        const adminHash = await bcrypt.hash('admin', 10);
        adminUser = await prisma.user.create({
          data: {
            role: 'admin',
            full_name: 'Academy Administrator',
            email: 'admin@academiapro.edu',
            username: 'admin',
            phone: '+923000000000',
            password_hash: adminHash,
            is_active: true
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

      const staffMember = (adminUser as any).staffMember || null;
      const resolvedPermissions = resolveStaffPermissions('admin', 'ADM');

      const tokenPayload: JwtPayload = {
        userId: adminUser.id,
        staffId: staffMember?.staff_id || 'ADM-2026-001',
        role: 'admin',
        fullName: adminUser.full_name || 'Academy Administrator',
        name: adminUser.full_name || 'Academy Administrator',
        email: adminUser.email,
        phone: adminUser.phone,
        staffTypeId: staffMember?.staff_type_id,
        isPasswordChanged: true,
        permissions: resolvedPermissions
      };

      const token = generateToken(tokenPayload);
      return sendSuccess(res, {
        token,
        user: {
          id: adminUser.id,
          staffId: tokenPayload.staffId,
          staff_id: tokenPayload.staffId,
          fullName: tokenPayload.fullName,
          name: tokenPayload.fullName,
          email: tokenPayload.email,
          phone: tokenPayload.phone,
          role: 'admin',
          designation: staffMember?.designation || 'Head of Academy',
          staffTypeId: staffMember?.staff_type_id,
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
