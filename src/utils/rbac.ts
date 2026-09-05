// ============================================================================
// FRONTEND DYNAMIC RBAC & PERMISSION EVALUATOR
// ============================================================================

export type AccessLevel = 'hidden' | 'view_only' | 'editable';

export const CANONICAL_MODULES = [
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
  'settings'
] as const;

export type CanonicalModule = typeof CANONICAL_MODULES[number];

const MODULE_ALIASES: Record<string, CanonicalModule> = {
  staff_attendance: 'attendance',
  staff_payroll: 'fees',
  expenses: 'fees',
  leaves: 'attendance',
  conduct: 'students',
  teachers_staff: 'teachers',
  crm_inquiries: 'crm',
  study_materials: 'homework'
};

export function canonicalizeModule(moduleKey: string): CanonicalModule {
  const norm = (moduleKey || '').trim().toLowerCase();
  return MODULE_ALIASES[norm] || (norm as CanonicalModule);
}

/**
 * Checks if the current user possesses permission for a module at a specified access level.
 * Handles Super Admin / Admin bypass, Student portal scopes, dynamic staff permissions,
 * and zero-trust fallback for non-admin accounts.
 */
export function hasPermission(
  user: any,
  rawModuleKey: string,
  requiredLevel: 'view_only' | 'editable' = 'view_only'
): boolean {
  if (!user) return false;

  const role = (user.role || '').toLowerCase();

  const rawLower = (rawModuleKey || '').trim().toLowerCase();

  // 1. Super Admin Platform Oversight (Strictly super_admin only)
  if (rawLower === 'super_admin' || rawLower === 'academies') {
    return role === 'super_admin';
  }

  // 2. Super Admin & Full Academy Admin Bypass
  if (role === 'super_admin' || role === 'admin' || role === 'administrator') {
    return true;
  }

  const moduleKey = canonicalizeModule(rawModuleKey);

  // 3. Student Scoped Navigation
  if (role === 'student') {
    const studentProhibited = [
      'staff_attendance',
      'staff_payroll',
      'expenses',
      'teachers',
      'batches',
      'subjects',
      'crm',
      'whatsapp',
      'settings',
      'conduct',
      'super_admin',
      'academies'
    ];
    if (studentProhibited.includes(rawLower) || studentProhibited.includes(moduleKey)) {
      return false;
    }

    const studentPermitted = [
      'dashboard',
      'attendance',
      'homework',
      'exams',
      'timetable',
      'fees',
      'announcements',
      'leaves'
    ];
    if (studentPermitted.includes(rawLower) || studentPermitted.includes(moduleKey)) {
      if (requiredLevel === 'editable') {
        // Students can only mutate their own leave requests
        return rawLower === 'leaves';
      }
      return true;
    }
    return false;
  }

  // 4. Dynamic Permissions Object / Array Evaluation
  if (user.permissions) {
    let resolvedLevel: AccessLevel | undefined = undefined;

    if (Array.isArray(user.permissions)) {
      const entry = user.permissions.find((p: any) => {
        const k = (p.module_key || p.moduleKey || '').toLowerCase();
        return k === moduleKey || k === rawLower;
      });
      if (entry) {
        resolvedLevel = (entry.access_level || entry.accessLevel || 'hidden').toLowerCase() as AccessLevel;
      }
    } else if (typeof user.permissions === 'object' && user.permissions !== null) {
      const lowerKeys = Object.keys(user.permissions).reduce<Record<string, any>>((acc, key) => {
        acc[key.toLowerCase()] = user.permissions[key];
        return acc;
      }, {});
      const rawVal = lowerKeys[rawLower] || lowerKeys[moduleKey.toLowerCase()];
      if (rawVal !== undefined) {
        if (typeof rawVal === 'string') {
          resolvedLevel = rawVal.toLowerCase() as AccessLevel;
        } else if (typeof rawVal === 'object' && rawVal !== null) {
          resolvedLevel = (rawVal.level || rawVal.access_level || rawVal.accessLevel || 'hidden').toLowerCase() as AccessLevel;
        }
      }
    }

    if (resolvedLevel !== undefined) {
      if (resolvedLevel === 'hidden') return false;
      if (requiredLevel === 'editable') return resolvedLevel === 'editable';
      if (requiredLevel === 'view_only') return resolvedLevel === 'view_only' || resolvedLevel === 'editable';
    }
  }

  // 4. Default Faculty / Teacher Matrix Fallback
  if (role === 'faculty' || role === 'teacher') {
    const facultyEditable = ['attendance', 'staff_attendance', 'exams', 'homework', 'conduct', 'leaves'];
    const facultyViewOnly = ['students', 'batches', 'subjects', 'timetable', 'announcements', 'dashboard'];
    const facultyHidden = ['fees', 'staff_payroll', 'expenses', 'crm', 'whatsapp', 'settings', 'teachers'];

    if (facultyHidden.includes(rawModuleKey.toLowerCase()) || facultyHidden.includes(moduleKey)) {
      return false;
    }

    if (requiredLevel === 'editable') {
      return facultyEditable.includes(rawModuleKey.toLowerCase()) || facultyEditable.includes(moduleKey);
    }

    return (
      facultyEditable.includes(rawModuleKey.toLowerCase()) ||
      facultyEditable.includes(moduleKey) ||
      facultyViewOnly.includes(rawModuleKey.toLowerCase()) ||
      facultyViewOnly.includes(moduleKey)
    );
  }

  // 5. Zero-trust fallback for non-faculty staff without explicit permissions
  return false;
}

/**
 * Helper to check if a module is visible (not hidden) for the current user
 */
export function canAccessModule(user: any, moduleKey: string): boolean {
  return hasPermission(user, moduleKey, 'view_only');
}

/**
 * Helper to check if a user can create/edit entities in this module
 */
export function canEditModule(user: any, moduleKey: string): boolean {
  return hasPermission(user, moduleKey, 'editable');
}
