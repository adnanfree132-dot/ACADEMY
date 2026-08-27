// ============================================================================
// SERVER TYPES: FEATURE 008 STAFF PORTAL, DYNAMIC TYPES & RBAC
// ============================================================================

export type CanonicalModuleKey =
  | 'students'
  | 'teachers'
  | 'batches'
  | 'subjects'
  | 'attendance'
  | 'fees'
  | 'exams'
  | 'homework'
  | 'timetable'
  | 'crm'
  | 'announcements'
  | 'whatsapp'
  | 'settings';

export type ModuleKey =
  | CanonicalModuleKey
  | 'teachers_staff'
  | 'crm_inquiries'
  | 'dashboard'
  | 'staff_portal'
  | 'staff_types'
  | 'analytics'
  | 'reports';

export const CANONICAL_MODULE_KEYS: readonly CanonicalModuleKey[] = [
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

export type StaffAccessLevel = 'hidden' | 'view_only' | 'editable';
export type AccessLevelString = 'hidden' | 'view_only' | 'editable';
export type AccessLevelNumeric = 0 | 1 | 2;
export type AccessLevel = AccessLevelString | AccessLevelNumeric;

export const ACCESS_LEVEL_MAP: Record<AccessLevelString, AccessLevelNumeric> = {
  hidden: 0,
  view_only: 1,
  editable: 2,
};

export const NUMERIC_TO_ACCESS_LEVEL: Record<AccessLevelNumeric, AccessLevelString> = {
  0: 'hidden',
  1: 'view_only',
  2: 'editable',
};

export function normalizeAccessLevel(level: AccessLevel | undefined | null): AccessLevelString {
  if (level === 2 || level === 'editable') return 'editable';
  if (level === 1 || level === 'view_only') return 'view_only';
  return 'hidden';
}

export type StaffLifecycleStatus =
  | 'active'
  | 'probation'
  | 'on_leave'
  | 'suspended'
  | 'resigned'
  | 'terminated';

export type StaffGender = 'Male' | 'Female' | 'Other';
export type StaffPaymentMethod = 'bank_transfer' | 'cash' | 'cheque';
export type StaffSalaryType = 'monthly' | 'hourly' | 'fixed';

export type StaffLeaveType =
  | 'casual'
  | 'sick'
  | 'maternity'
  | 'emergency'
  | 'annual'
  | 'unpaid'
  | 'other';

export type StaffLeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type StaffAttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'on_leave';

export type StaffDocumentType =
  | 'cnic'
  | 'degree'
  | 'certificate'
  | 'contract'
  | 'resume'
  | 'id_proof'
  | 'police_clearance'
  | 'other';

export type StaffSalaryPaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';

export interface StaffPermissionDTO {
  id?: string;
  staff_type_id?: string | null;
  staff_member_id?: string | null;
  module_key: string;
  access_level: AccessLevelString;
  is_global_scope: boolean;
}

export interface StaffTypeDTO {
  id: string;
  name: string;
  code: string;
  slug?: string | null;
  description?: string | null;
  icon_name: string;
  is_system: boolean;
  is_system_default: boolean;
  is_active: boolean;
  base_permissions?: Record<string, AccessLevel> | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface StaffMemberDTO {
  id: string;
  staff_id: string;
  user_id?: string | null;
  teacher_id?: string | null;
  staff_type_id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  gender: string;
  role?: string | null;
  designation: string;
  qualification?: string | null;
  joining_date: Date;
  status: string;
  status_remarks?: string | null;
  photo_url?: string | null;
  salary_type?: string | null;
  base_salary?: number | null;
  hourly_rate?: number | null;
  payment_method?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_title?: string | null;
  emergency_name?: string | null;
  emergency_phone?: string | null;
  emergency_relation?: string | null;
  is_password_changed: boolean;
  custom_fields?: any;
  created_at: Date;
  updated_at: Date;
}
