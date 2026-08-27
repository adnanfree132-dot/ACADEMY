import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError } from '../common/envelope';
import { AuthenticatedRequest, JwtPayload } from '../auth';
import {
  AccessLevelNumeric,
  AccessLevelString,
  normalizeAccessLevel,
  ACCESS_LEVEL_MAP
} from '../types/staff';
import { prisma } from '../prisma';

export interface EffectivePermission {
  moduleKey: string;
  accessLevel: AccessLevelString;
  numericLevel: AccessLevelNumeric;
  isGlobalScope: boolean;
  source: 'admin_bypass' | 'jwt' | 'staff_override' | 'staff_type_template' | 'zero_trust_default';
}

/**
 * Module alias normalization map
 */
export const MODULE_ALIAS_MAP: Record<string, string> = {
  teachers_staff: 'teachers',
  staff: 'teachers',
  crm_inquiries: 'crm',
  inquiries: 'crm',
  dashboard: 'analytics',
  study_materials: 'homework',
  syllabus: 'batches',
  diaries: 'homework',
  conduct_logs: 'students',
  parent_portal: 'students',
  classes: 'batches'
};

export function canonicalizeModuleKey(rawKey: string): string {
  const normalized = (rawKey || '').trim().toLowerCase();
  return MODULE_ALIAS_MAP[normalized] || normalized;
}

/**
 * Resolves the effective module permission for an authenticated user.
 * Priority order:
 * 1. Admin/Superadmin bypass -> Editable (2)
 * 2. Student/Parent role on staff routes -> Hidden (0)
 * 3. Suspended/Terminated staff status -> Hidden (0)
 * 4. Staff-level custom permission override (StaffPermission where staff_member_id = X)
 * 5. StaffType-level template permission (StaffPermission where staff_type_id = Y OR base_permissions JSON)
 * 6. JWT payload permissions map
 * 7. Zero-trust fallback -> Hidden (0)
 */
export async function getEffectiveStaffPermission(
  user: JwtPayload,
  rawModuleKey: string
): Promise<EffectivePermission> {
  const moduleKey = canonicalizeModuleKey(rawModuleKey);

  // 1. Superadmin / Admin bypass
  if (
    user.role === 'super_admin' ||
    user.role === 'admin' ||
    user.role === 'administrator' ||
    user.userId === 'admin-id'
  ) {
    return {
      moduleKey,
      accessLevel: 'editable',
      numericLevel: 2,
      isGlobalScope: true,
      source: 'admin_bypass'
    };
  }

  // 2. Student / Parent guard
  if (user.role === 'student' || user.role === 'parent') {
    return {
      moduleKey,
      accessLevel: 'hidden',
      numericLevel: 0,
      isGlobalScope: false,
      source: 'zero_trust_default'
    };
  }

  // 3. Find staff member in DB
  let staffMember: any = null;
  if (user.staffId || user.userId) {
    staffMember = await prisma.staffMember.findFirst({
      where: {
        OR: [
          user.staffId ? { staff_id: { equals: user.staffId, mode: 'insensitive' as const } } : {},
          user.userId ? { user_id: user.userId } : {},
          user.userId ? { id: user.userId } : {}
        ].filter((c) => Object.keys(c).length > 0)
      },
      include: {
        staffType: { include: { defaultPermissions: true } },
        permissions: true
      }
    });
  }

  // If no staff member record in DB, fallback to JWT payload permissions if present
  if (!staffMember) {
    if (user.permissions && (user.permissions[moduleKey] || user.permissions[rawModuleKey])) {
      const rawLvl = user.permissions[moduleKey] || user.permissions[rawModuleKey];
      const normLvl = normalizeAccessLevel(rawLvl);
      return {
        moduleKey,
        accessLevel: normLvl,
        numericLevel: ACCESS_LEVEL_MAP[normLvl],
        isGlobalScope: false,
        source: 'jwt'
      };
    }

    return {
      moduleKey,
      accessLevel: 'hidden',
      numericLevel: 0,
      isGlobalScope: false,
      source: 'zero_trust_default'
    };
  }

  // Immediate 0-second suspension/termination check
  if (
    staffMember.status === 'suspended' ||
    staffMember.status === 'terminated' ||
    staffMember.status === 'resigned'
  ) {
    return {
      moduleKey,
      accessLevel: 'hidden',
      numericLevel: 0,
      isGlobalScope: false,
      source: 'zero_trust_default'
    };
  }

  // 4. Custom StaffPermission Override on staff member (Highest Precedence)
  const customPerm = staffMember.permissions?.find(
    (p: any) => canonicalizeModuleKey(p.module_key) === moduleKey || p.module_key === rawModuleKey
  );

  if (customPerm) {
    const normLvl = normalizeAccessLevel(customPerm.access_level as AccessLevelString);
    return {
      moduleKey,
      accessLevel: normLvl,
      numericLevel: ACCESS_LEVEL_MAP[normLvl],
      isGlobalScope: customPerm.is_global_scope,
      source: 'staff_override'
    };
  }

  // 5. StaffType Default Permissions Template
  if (staffMember.staffType) {
    // Check template StaffPermission rows
    const typePerm = staffMember.staffType.defaultPermissions?.find(
      (p: any) => canonicalizeModuleKey(p.module_key) === moduleKey || p.module_key === rawModuleKey
    );

    if (typePerm) {
      const normLvl = normalizeAccessLevel(typePerm.access_level as AccessLevelString);
      return {
        moduleKey,
        accessLevel: normLvl,
        numericLevel: ACCESS_LEVEL_MAP[normLvl],
        isGlobalScope: typePerm.is_global_scope,
        source: 'staff_type_template'
      };
    }

    // Check base_permissions JSON
    if (staffMember.staffType.base_permissions) {
      const basePerms = staffMember.staffType.base_permissions as any;
      if (typeof basePerms === 'object' && basePerms !== null) {
        if (Array.isArray(basePerms)) {
          const matched = basePerms.find(
            (p: any) =>
              canonicalizeModuleKey(p.moduleKey || p.module_key) === moduleKey ||
              p.moduleKey === rawModuleKey ||
              p.module_key === rawModuleKey
          );
          if (matched) {
            const lvl = matched.accessLevel !== undefined ? matched.accessLevel : matched.access_level;
            const normLvl = normalizeAccessLevel(lvl);
            return {
              moduleKey,
              accessLevel: normLvl,
              numericLevel: ACCESS_LEVEL_MAP[normLvl],
              isGlobalScope: matched.isGlobalScope ?? matched.is_global_scope ?? false,
              source: 'staff_type_template'
            };
          }
        } else {
          const matched = basePerms[moduleKey] ?? basePerms[rawModuleKey];
          if (matched !== undefined) {
            const lvl = typeof matched === 'object' && matched !== null ? (matched.accessLevel || matched.access_level) : matched;
            const normLvl = normalizeAccessLevel(lvl);
            return {
              moduleKey,
              accessLevel: normLvl,
              numericLevel: ACCESS_LEVEL_MAP[normLvl],
              isGlobalScope: false,
              source: 'staff_type_template'
            };
          }
        }
      }
    }

    // Default category fallback based on code/slug
    const code = staffMember.staffType.code?.toUpperCase();
    const slug = staffMember.staffType.slug?.toLowerCase();
    if (code === 'ADM' || slug === 'admin') {
      return {
        moduleKey,
        accessLevel: 'editable',
        numericLevel: 2,
        isGlobalScope: true,
        source: 'staff_type_template'
      };
    }
    if (code === 'FAC' || slug === 'faculty') {
      const facultyDefaults: Record<string, AccessLevelString> = {
        students: 'view_only',
        teachers: 'view_only',
        batches: 'view_only',
        subjects: 'view_only',
        attendance: 'editable',
        fees: 'hidden',
        exams: 'editable',
        homework: 'editable',
        timetable: 'view_only',
        crm: 'hidden',
        announcements: 'view_only',
        whatsapp: 'hidden',
        settings: 'hidden'
      };
      const defLvl = facultyDefaults[moduleKey] || 'hidden';
      return {
        moduleKey,
        accessLevel: defLvl,
        numericLevel: ACCESS_LEVEL_MAP[defLvl],
        isGlobalScope: false,
        source: 'staff_type_template'
      };
    }
    if (code === 'DOM' || slug === 'domestic' || slug === 'domestic-staff') {
      const domDefaults: Record<string, AccessLevelString> = {
        attendance: 'view_only',
        announcements: 'view_only'
      };
      const defLvl = domDefaults[moduleKey] || 'hidden';
      return {
        moduleKey,
        accessLevel: defLvl,
        numericLevel: ACCESS_LEVEL_MAP[defLvl],
        isGlobalScope: false,
        source: 'staff_type_template'
      };
    }
  }

  // 6. Zero-trust fallback
  return {
    moduleKey,
    accessLevel: 'hidden',
    numericLevel: 0,
    isGlobalScope: false,
    source: 'zero_trust_default'
  };
}

/**
 * Express Middleware enforcing 3-Tier Module RBAC (Hidden, View Only, Editable).
 */
export function requireModulePermission(
  moduleKey: string,
  requiredLevel?: 'view_only' | 'editable'
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthenticated', 401);
      }

      // Admin / Superadmin bypass
      if (
        req.user.role === 'super_admin' ||
        req.user.role === 'admin' ||
        req.user.role === 'administrator' ||
        req.user.userId === 'admin-id'
      ) {
        return next();
      }

      const permission = await getEffectiveStaffPermission(req.user, moduleKey);
      (req as any).modulePermission = permission;

      const method = req.method.toUpperCase();
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

      // Level 0: Hidden
      if (permission.numericLevel === 0 || permission.accessLevel === 'hidden') {
        return sendError(
          res,
          `Forbidden: You do not have permission to access the '${moduleKey}' module.`,
          403
        );
      }

      // Level 1: View Only
      if (permission.numericLevel === 1 || permission.accessLevel === 'view_only') {
        if (requiredLevel === 'editable' || isMutation) {
          return sendError(
            res,
            'You have view-only access to this module. Editing is restricted.',
            403
          );
        }
        return next();
      }

      // Level 2: Editable
      if (permission.numericLevel === 2 || permission.accessLevel === 'editable') {
        return next();
      }

      return sendError(res, 'Forbidden: Insufficient permissions', 403);
    } catch (err: any) {
      return sendError(res, err.message || 'Internal authorization error', 500);
    }
  };
}

/**
 * Middleware ensuring caller has administrative privileges
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 'Unauthenticated', 401);
  }
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin' &&
    req.user.role !== 'administrator' &&
    req.user.userId !== 'admin-id'
  ) {
    return sendError(res, 'Forbidden: Administrative access required', 403);
  }
  next();
}
