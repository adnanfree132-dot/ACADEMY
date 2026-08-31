export type TabType = 
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'batches'
  | 'subjects'
  | 'attendance'
  | 'staff_attendance'
  | 'staff_payroll'
  | 'fees'
  | 'exams'
  | 'homework'
  | 'timetable'
  | 'crm'
  | 'announcements'
  | 'whatsapp'
  | 'settings';

export type StudentLifecycleStatus = 'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left';

export type StatusReasonCategory = 
  | 'medical'
  | 'financial'
  | 'relocation'
  | 'disciplinary'
  | 'graduation'
  | 'personal'
  | 'other';

export type ScholarshipType = 'none' | 'percentage' | 'fixed';
export type ScholarshipReason = 'merit' | 'need_based' | 'sibling' | 'staff_child' | 'special_grant' | 'other';

export interface StudentFeePlan {
  studentId: string;
  monthlyAmount: number;
  discount: number;
  scholarshipType: ScholarshipType;
  scholarshipValue: number;
  scholarshipReason?: ScholarshipReason;
  billingAnchorDay: number;
  billingMode: 'monthly_recurring' | 'course_installments';
  dueDay: number;
  notes?: string;
}

export interface StudentInstallmentSchedule {
  id: string;
  enrollmentId: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  feePeriodStart: string;
  feePeriodEnd: string;
  invoiceId?: string;
  invoiceStatus?: string;
  status: 'scheduled' | 'invoiced' | 'paid' | 'cancelled';
  batchName?: string;
  createdAt?: string;
}

export interface Student {
  id: string;
  regNo: string;
  admission_no?: string;
  name: string;
  fullName?: string;
  parentName: string;
  phone: string;
  email: string;
  gradeBatch: string;
  gender: 'Male' | 'Female';
  status: StudentLifecycleStatus;
  statusReason?: StatusReasonCategory;
  statusRemarks?: string;
  statusUpdatedAt?: string;
  leavingDate?: string;
  isFeePaused?: boolean;
  scholarshipType?: ScholarshipType;
  scholarshipValue?: number;
  scholarshipReason?: ScholarshipReason;
  billingAnchorDay?: number;
  baseMonthlyFee?: number;
  totalFee: number;
  paidFee: number;
  dueBalance: number;
  isDefaulter: boolean;
  dueDate: string;
  photoUrl?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject?: string;
  qualification?: string;
  assignedSubjects?: string[];
  assignedBatches?: string[];
  email: string;
  phone: string;
  batchesAssigned?: string[];
  status?: 'Active' | 'On Leave';
  avatar?: string;
}

export interface Batch {
  id: string;
  code?: string;
  name: string;
  sectionName?: string;
  section_name?: string;
  classLevel?: string;
  teacherName?: string;
  timing?: string;
  instructor?: string;
  room?: string;
  schedule?: string;
  studentsCount?: number;
  capacity?: number;
  maxCapacity?: number;
  courseType?: 'recurring_monthly' | 'fixed_course';
  course_type?: 'recurring_monthly' | 'fixed_course';
  fee?: number;
  monthlyFee?: number;
  baseMonthlyFee?: number;
  totalFee?: number;
  total_fee?: number;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  defaultInstallments?: number;
  default_installments?: number;
}

export interface FeeHeadItem {
  id?: string;
  type: string;
  amount: number;
}

export interface FeeTransaction {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  regNo: string;
  amount: number;
  grossAmount?: number;
  discount?: number;
  discountRemarks?: string;
  netAmount?: number;
  date: string;
  feePeriodStart?: string;
  feePeriodEnd?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  billingAnchorDay?: number;
  method: string;
  notes?: string;
  status?: 'paid' | 'unpaid' | 'partial' | 'overdue';
  dueDate?: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  regNo: string;
  batchId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
}

export interface CRMLead {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  gradeInterest?: string;
  targetClass?: string;
  source?: string;
  status: 'New Inquiry' | 'Follow Up' | 'Trial Class' | 'Enrolled' | 'Closed' | 'New' | 'Contacted' | 'Converted';
  followUpDate?: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  date: string;
  author?: string;
  urgent?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export type ConductCategory = 'commendation' | 'infraction' | 'academic' | 'attendance' | 'general';
export type ConductSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface ConductLog {
  id: string;
  studentId: string;
  batchId?: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'teacher';
  category: ConductCategory;
  severity: ConductSeverity;
  title?: string;
  remark: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConductLogPayload {
  student_id?: string;
  batch_id?: string;
  category?: ConductCategory;
  severity?: ConductSeverity;
  title?: string;
  remark: string;
  is_confidential?: boolean;
}

export interface UpdateConductLogPayload {
  category?: ConductCategory;
  severity?: ConductSeverity;
  title?: string;
  remark?: string;
  is_confidential?: boolean;
}

export interface ParentStudent {
  id: string;
  parentId: string;
  studentId: string;
  relationship: 'father' | 'mother' | 'guardian';
  student?: Student;
}

export interface StudentStatusHistoryItem {
  id: string;
  studentId: string;
  previousStatus: string;
  newStatus: string;
  reasonCategory: string;
  remarks?: string;
  effectiveDate: string;
  feeAction?: string;
  changedByUserId?: string;
  changedByName?: string;
  createdAt: string;
}

export interface StatusTransitionPayload {
  targetStatus: 'active' | 'inactive' | 'suspended' | 'graduated' | 'left';
  reasonCategory: StatusReasonCategory;
  remarks?: string;
  effectiveDate?: string;
  feeAction?: 'pause_fees' | 'continue_fees' | 'waive_balance';
  targetBatchId?: string;
}

export interface LeavingCertificateData {
  admissionNo: string;
  studentName: string;
  parentName: string;
  phone: string;
  gradeBatch: string;
  enrollmentDate: string;
  leavingDate: string;
  reason: string;
  status: string;
  attendancePercentage: number;
  feeStatus: 'Cleared' | 'Pending Dues' | 'Waived';
  dueBalance: number;
  conductRating: 'Exemplary' | 'Good' | 'Satisfactory' | 'Needs Improvement';
  remarks: string;
}

// ============================================================================
// FEATURE 008: STAFF PORTAL, DYNAMIC TYPES & GRANULAR 3-TIER RBAC TYPES
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

export interface StaffPermission {
  id: string;
  staffTypeId?: string | null;
  staff_type_id?: string | null;
  staffMemberId?: string | null;
  staff_member_id?: string | null;
  moduleKey: ModuleKey | string;
  module_key?: ModuleKey | string;
  accessLevel: AccessLevelString;
  access_level?: AccessLevelString;
  isGlobalScope: boolean;
  is_global_scope?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffPermissionInput {
  moduleKey?: ModuleKey | string;
  module_key?: ModuleKey | string;
  accessLevel?: AccessLevel;
  access_level?: AccessLevel;
  isGlobalScope?: boolean;
  is_global_scope?: boolean;
}

export interface StaffType {
  id: string;
  name: string;
  code: string;
  slug?: string | null;
  description?: string | null;
  iconName?: string;
  icon_name?: string;
  isSystem?: boolean;
  is_system?: boolean;
  isSystemDefault?: boolean;
  is_system_default?: boolean;
  isActive?: boolean;
  is_active?: boolean;
  basePermissions?: Record<string, AccessLevel>;
  base_permissions?: Record<string, AccessLevel>;
  defaultPermissions?: StaffPermission[];
  staffCount?: number;
  _count?: {
    staffMembers?: number;
  };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StaffTypeCreateInput {
  name: string;
  code?: string;
  slug?: string;
  description?: string | null;
  iconName?: string;
  icon_name?: string;
  baseTemplate?: 'Faculty' | 'Admin' | 'Domestic Staff' | 'Blank';
  baseTemplateId?: string;
  defaultPermissions?: StaffPermissionInput[] | Record<string, AccessLevel>;
  permissions?: StaffPermissionInput[];
}

export interface StaffTypeUpdateInput {
  name?: string;
  code?: string;
  slug?: string;
  description?: string | null;
  iconName?: string;
  icon_name?: string;
  isActive?: boolean;
  is_active?: boolean;
  defaultPermissions?: StaffPermissionInput[] | Record<string, AccessLevel>;
  permissions?: StaffPermissionInput[];
}

export interface StaffMember {
  id: string;
  staffId?: string;
  staff_id: string;
  userId?: string | null;
  user_id?: string | null;
  teacherId?: string | null;
  teacher_id?: string | null;
  staffTypeId?: string;
  staff_type_id: string;
  staffType?: StaffType;
  fullName?: string;
  full_name: string;
  email?: string | null;
  phone: string;
  gender: StaffGender;
  role?: string | null;
  designation: string;
  qualification?: string | null;
  joiningDate?: string;
  joining_date: string;
  status: StaffLifecycleStatus;
  statusRemarks?: string | null;
  status_remarks?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  
  // Financial & Compensation
  salaryType?: StaffSalaryType;
  salary_type?: StaffSalaryType;
  baseSalary?: number | null;
  base_salary?: number | null;
  hourlyRate?: number | null;
  hourly_rate?: number | null;
  paymentMethod?: StaffPaymentMethod;
  payment_method?: StaffPaymentMethod;
  bankName?: string | null;
  bank_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  accountTitle?: string | null;
  account_title?: string | null;
  
  // Emergency Contact
  emergencyName?: string | null;
  emergency_name?: string | null;
  emergencyPhone?: string | null;
  emergency_phone?: string | null;
  emergencyRelation?: string | null;
  emergency_relation?: string | null;
  
  // Auth & Security
  password_hash?: string;
  tempPasswordPlain?: string | null;
  temp_password_plain?: string | null;
  isPasswordChanged?: boolean;
  is_password_changed?: boolean;
  
  // Custom Dynamic Metadata
  customFields?: Record<string, any> | null;
  custom_fields?: Record<string, any> | null;
  
  // Academic 1-to-1 Linkage (for Faculty)
  teacher?: {
    id: string;
    qualification?: string | null;
    batches?: Array<{ id: string; name: string }>;
    batchSubjects?: Array<{ batch_id: string; subject_id: string }>;
  } | null;

  // Populated Relationships
  permissions?: StaffPermission[];
  attendances?: StaffAttendance[];
  leaveRequests?: StaffLeaveRequest[];
  documents?: StaffDocument[];
  salaryPayments?: StaffSalaryPayment[];
  
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StaffCredentials {
  staffId: string;
  fullName?: string;
  temporaryPassword: string;
  loginUrl: string;
  issuedAt: string;
  roleName?: string;
  mustChangePassword?: boolean;
}

export interface StaffCredentialsPayload {
  staffId: string;
  fullName: string;
  temporaryPassword?: string;
  loginUrl: string;
  roleName: string;
  issuedAt: string;
}

export interface StaffRegisterInput {
  fullName?: string;
  full_name?: string;
  phone: string;
  email?: string | null;
  gender?: StaffGender;
  staffTypeId?: string;
  staff_type_id?: string;
  designation: string;
  qualification?: string | null;
  joiningDate?: string;
  joining_date?: string;
  status?: StaffLifecycleStatus;
  baseSalary?: number;
  base_salary?: number;
  hourlyRate?: number;
  hourly_rate?: number;
  salaryType?: StaffSalaryType;
  salary_type?: StaffSalaryType;
  paymentMethod?: StaffPaymentMethod;
  payment_method?: StaffPaymentMethod;
  bankName?: string | null;
  bank_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  accountTitle?: string | null;
  account_title?: string | null;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
  };
  emergencyName?: string | null;
  emergency_name?: string | null;
  emergencyPhone?: string | null;
  emergency_phone?: string | null;
  emergencyRelation?: string | null;
  emergency_relation?: string | null;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  customPermissions?: StaffPermissionInput[];
  permissions?: StaffPermissionInput[];
  customFields?: Record<string, any>;
  custom_fields?: Record<string, any>;
}

export interface CreateStaffPayload {
  fullName: string;
  email?: string;
  phone: string;
  gender?: StaffGender;
  staffTypeId: string;
  designation: string;
  qualification?: string;
  joiningDate?: string;
  baseSalary?: number;
  hourlyRate?: number;
  paymentMethod?: StaffPaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountTitle?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  customPermissions?: Array<{
    module_key: string;
    access_level: StaffAccessLevel;
    is_global_scope?: boolean;
  }>;
}

export interface CreateStaffTypePayload {
  name: string;
  code: string;
  slug?: string;
  description?: string;
  iconName?: string;
  baseTemplateId?: string;
  permissions?: Array<{
    moduleKey: string;
    accessLevel: StaffAccessLevel;
  }>;
}

export interface StaffRegisterResponse {
  staff: StaffMember;
  credentials: StaffCredentials;
}

export interface StaffResetPasswordResponse {
  staffId: string;
  temporaryPassword: string;
  loginUrl: string;
  issuedAt: string;
}

export interface StaffUpdateInput {
  fullName?: string;
  full_name?: string;
  phone?: string;
  email?: string | null;
  gender?: StaffGender;
  staffTypeId?: string;
  staff_type_id?: string;
  designation?: string;
  qualification?: string | null;
  joiningDate?: string;
  joining_date?: string;
  status?: StaffLifecycleStatus;
  statusRemarks?: string | null;
  status_remarks?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  baseSalary?: number | null;
  base_salary?: number | null;
  hourlyRate?: number | null;
  hourly_rate?: number | null;
  salaryType?: StaffSalaryType;
  paymentMethod?: StaffPaymentMethod;
  payment_method?: StaffPaymentMethod;
  bankName?: string | null;
  bank_name?: string | null;
  accountNumber?: string | null;
  account_number?: string | null;
  accountTitle?: string | null;
  account_title?: string | null;
  emergencyName?: string | null;
  emergency_name?: string | null;
  emergencyPhone?: string | null;
  emergency_phone?: string | null;
  emergencyRelation?: string | null;
  emergency_relation?: string | null;
  customFields?: Record<string, any> | null;
  custom_fields?: Record<string, any> | null;
}

export interface StaffAttendance {
  id: string;
  staffMemberId?: string;
  staff_member_id: string;
  staffMember?: StaffMember;
  date: string;                   // YYYY-MM-DD
  checkInTime?: string | null;    // HH:mm:ss
  check_in_time?: string | null;
  checkOutTime?: string | null;   // HH:mm:ss
  check_out_time?: string | null;
  status: StaffAttendanceStatus;
  notes?: string | null;
  markedBy?: string;
  marked_by?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StaffCheckInInput {
  staffMemberId?: string;
  staff_member_id?: string;
  date?: string;                  // YYYY-MM-DD
  checkInTime?: string;           // HH:mm:ss
  check_in_time?: string;
  notes?: string;
}

export interface StaffCheckOutInput {
  staffMemberId?: string;
  staff_member_id?: string;
  date?: string;                  // YYYY-MM-DD
  checkOutTime?: string;          // HH:mm:ss
  check_out_time?: string;
  notes?: string;
}

export interface StaffBulkAttendanceItem {
  staffMemberId: string;
  status: StaffAttendanceStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
}

export interface StaffBulkAttendanceInput {
  date: string;
  records: StaffBulkAttendanceItem[];
}

export interface StaffLeaveRequest {
  id: string;
  staffMemberId?: string;
  staff_member_id: string;
  staffMember?: StaffMember;
  leaveType?: StaffLeaveType;
  leave_type: StaffLeaveType;
  startDate?: string;             // YYYY-MM-DD
  start_date: string;
  endDate?: string;               // YYYY-MM-DD
  end_date: string;
  totalDays?: number;
  total_days: number;
  reason: string;
  status: StaffLeaveStatus;
  reviewedBy?: string | null;
  reviewed_by?: string | null;
  reviewerRemarks?: string | null;
  reviewer_remarks?: string | null;
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  substituteTeacherId?: string | null;
  substitute_teacher_id?: string | null;
  substituteTeacher?: {
    id: string;
    fullName?: string;
    full_name?: string;
    designation?: string;
    phone?: string;
  } | null;
  approved_by_id?: string | null;
  decidedAt?: string | null;
  decided_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StaffLeaveCreateInput {
  staffMemberId?: string;
  staff_member_id?: string;
  leaveType?: StaffLeaveType;
  leave_type?: StaffLeaveType;
  startDate?: string;             // YYYY-MM-DD
  start_date?: string;
  endDate?: string;               // YYYY-MM-DD
  end_date?: string;
  reason: string;
}

export interface StaffLeaveDecisionInput {
  decision?: 'approved' | 'rejected';
  status?: 'approved' | 'rejected';
  reviewerRemarks?: string;
  remarks?: string;
  rejectionReason?: string;
  substituteTeacherId?: string | null;
  substitute_teacher_id?: string | null;
}

export interface StaffDocument {
  id: string;
  staffMemberId?: string;
  staff_member_id: string;
  title: string;
  documentType?: StaffDocumentType;
  document_type: StaffDocumentType;
  fileUrl?: string;
  file_url: string;
  fileSize?: number | null;
  file_size?: number | null;
  mimeType?: string | null;
  mime_type?: string | null;
  expiryDate?: string | null;     // YYYY-MM-DD
  expiry_date?: string | null;
  uploadedAt?: string;
  uploaded_at: string;
}

export interface StaffDocumentCreateInput {
  title: string;
  documentType?: StaffDocumentType;
  document_type?: StaffDocumentType;
  fileUrl?: string;
  file_url?: string;
  fileSize?: number | null;
  file_size?: number | null;
  mimeType?: string | null;
  mime_type?: string | null;
  expiryDate?: string | null;
  expiry_date?: string | null;
}

export interface StaffSalaryPayment {
  id: string;
  staffMemberId?: string;
  staff_member_id: string;
  staffMember?: StaffMember;
  monthPeriod?: string;            // YYYY-MM
  month_period?: string;
  amount?: number;
  basePay?: number;
  base_pay?: number;
  allowances?: number;
  deductions?: number;
  netPayable?: number;
  net_payable?: number;
  status: StaffSalaryPaymentStatus;
  paymentDate?: string;            // YYYY-MM-DD
  payment_date: string;
  paymentMethod?: StaffPaymentMethod | string;
  payment_method: StaffPaymentMethod | string;
  referenceNo?: string | null;
  reference_no?: string | null;
  transactionRef?: string | null;
  transaction_ref?: string | null;
  slipUrl?: string | null;
  slip_url?: string | null;
  notes?: string | null;
  remarks?: string | null;
  createdAt?: string;
  created_at?: string;
}

export interface StaffSalaryPaymentCreateInput {
  monthPeriod?: string;            // YYYY-MM
  month_period?: string;
  amount?: number;
  basePay?: number;
  base_pay?: number;
  allowances?: number;
  deductions?: number;
  netPayable?: number;
  net_payable?: number;
  status?: StaffSalaryPaymentStatus;
  paymentDate?: string;
  payment_date?: string;
  paymentMethod?: StaffPaymentMethod | string;
  payment_method?: StaffPaymentMethod | string;
  referenceNo?: string;
  reference_no?: string;
  transactionRef?: string;
  transaction_ref?: string;
  slipUrl?: string;
  slip_url?: string;
  notes?: string;
  remarks?: string;
}

// ============================================================================
// GPS GEOFENCING, STAFF ATTENDANCE & ADMIN OVERRIDE TYPES
// ============================================================================

export type AttendanceVerificationMode = 
  | 'verified_gps'
  | 'admin_override' 
  | 'remote_duty' 
  | 'biometric_sync'
  | 'manual';

export interface CampusGeofenceConfig {
  id?: string;
  campus_name?: string;
  campusName?: string;
  latitude?: number;
  longitude?: number;
  campusLatitude?: number;
  campusLongitude?: number;
  radius_meters?: number;
  radius?: number;
  geofenceRadiusMeters?: number;
  shift_start_time?: string;      // "08:00"
  shiftStartTime?: string;
  shift_end_time?: string;        // "16:00"
  shiftEndTime?: string;
  grace_period_minutes?: number;  // 15
  gracePeriodMinutes?: number;
  half_day_late_cutoff_minutes?: number;
  halfDayLateCutoffMinutes?: number;
  half_day_min_hours?: number;
  halfDayMinHours?: number;
  absent_min_hours?: number;
  absentMinHours?: number;
  is_active?: boolean;
  isActive?: boolean;
  enforceGeofence?: boolean;
}

export interface StaffAttendanceRecord {
  id: string;
  staffMemberId?: string;
  staff_member_id: string;
  staff_id?: string;
  staff_name?: string;
  staffMember?: StaffMember;
  designation?: string;
  department?: string;
  photo_url?: string | null;
  phone?: string;
  date: string;                   // YYYY-MM-DD
  checkInTime?: string | null;
  check_in_time?: string | null;
  checkOutTime?: string | null;
  check_out_time?: string | null;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_duty' | 'excused' | 'on_leave' | 'unmarked';
  shift_status?: string | null;
  checkInLatitude?: number | null;
  check_in_lat?: number | null;
  checkInLongitude?: number | null;
  check_in_lng?: number | null;
  checkInDistanceMeters?: number | null;
  distance_meters?: number | null;
  locationVerified?: boolean;
  location_verified?: boolean;
  verificationMode?: AttendanceVerificationMode;
  status_tag?: string;
  gps_tag?: string;
  totalWorkingHours?: number | null;
  total_hours?: number | null;
  isOverridden?: boolean;
  admin_override?: boolean;
  overrideReason?: string | null;
  override_reason?: string | null;
  overriddenBy?: string | null;
  override_by_user_id?: string | null;
  override_timestamp?: string | null;
  notes?: string | null;
  marked_by?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAttendanceOverridePayload {
  staff_member_id: string;
  staffMemberId?: string;
  date: string;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_duty' | 'excused';
  check_in_time?: string | null;
  checkInTime?: string | null;
  check_out_time?: string | null;
  checkOutTime?: string | null;
  verification_mode?: AttendanceVerificationMode;
  verificationMode?: AttendanceVerificationMode;
  override_reason: string;
  overrideReason?: string;
  notes?: string;
}

// ============================================================================
// ENTERPRISE STAFF PAYROLL & COMPENSATION TYPES
// ============================================================================

export interface StaffSalaryStructure {
  id?: string;
  staff_member_id?: string;
  staffMemberId?: string;
  staffMember?: StaffMember;
  base_salary?: number;
  baseSalary?: number;
  house_rent_allowance?: number;
  houseRentAllowance?: number;
  medical_allowance?: number;
  medicalAllowance?: number;
  conveyance_allowance?: number;
  conveyanceAllowance?: number;
  special_allowance?: number;
  specialAllowance?: number;
  custom_earnings?: { id: string; name: string; amount: number }[];
  customEarnings?: { id: string; name: string; amount: number }[];
  gross_salary?: number;
  grossSalary?: number;
  income_tax?: number;
  incomeTax?: number;
  provident_fund?: number;
  providentFund?: number;
  other_deductions?: number;
  otherDeductions?: number;
  custom_deductions?: { id: string; name: string; amount: number }[];
  customDeductions?: { id: string; name: string; amount: number }[];
  total_fixed_deductions?: number;
  totalFixedDeductions?: number;
  net_standard_salary?: number;
  netStandardSalary?: number;
  salary_type?: 'monthly' | 'hourly' | 'fixed';
  salaryType?: 'monthly' | 'hourly' | 'fixed';
  payment_method?: 'bank_transfer' | 'cash' | 'cheque';
  paymentMethod?: 'bank_transfer' | 'cash' | 'cheque';
  bank_name?: string | null;
  bankName?: string | null;
  account_number?: string | null;
  accountNumber?: string | null;
  account_title?: string | null;
  accountTitle?: string | null;
  iban?: string | null;
}

export interface MonthlyPayrollItem {
  id: string;
  payslip_number?: string;
  payroll_batch_id?: string;
  staff_member_id: string;
  staffMemberId?: string;
  staffMember?: StaffMember;
  monthPeriod?: string;          // YYYY-MM
  month_period?: string;
  daysInMonth?: number;
  days_in_month?: number;
  daysPresent?: number;
  days_present?: number;
  daysLate?: number;
  days_late?: number;
  daysHalfDay?: number;
  days_half_day?: number;
  daysAbsent?: number;
  days_absent?: number;
  daysExcused?: number;
  days_excused?: number;
  baseSalary?: number;
  base_salary?: number;
  base_pay?: number;
  basePay?: number;
  totalAllowances?: number;
  total_allowances?: number;
  allowances?: number;
  custom_earnings?: { id: string; name: string; amount: number }[];
  customEarnings?: { id: string; name: string; amount: number }[];
  grossSalary?: number;
  gross_salary?: number;
  attendanceDeduction?: number;
  attendance_deduction?: number;
  attendance_deduction_amount?: number;
  unexcused_absences?: number;
  unexcusedAbsences?: number;
  taxDeduction?: number;
  tax_deduction?: number;
  providentFundDeduction?: number;
  provident_fund_deduction?: number;
  provident_fund?: number;
  providentFund?: number;
  otherDeductions?: number;
  other_deductions?: number;
  custom_deductions?: { id: string; name: string; amount: number }[];
  customDeductions?: { id: string; name: string; amount: number }[];
  totalDeductions?: number;
  total_deductions?: number;
  deductions?: number;
  netPayable?: number;
  net_payable?: number;
  amount?: number;
  status: 'pending' | 'calculated' | 'paid' | 'cancelled';
  disbursedAt?: string | null;
  disbursed_at?: string | null;
  disbursedBy?: string | null;
  disbursed_by?: string | null;
  paymentMethod?: 'bank_transfer' | 'cash' | 'cheque';
  payment_method?: 'bank_transfer' | 'cash' | 'cheque';
  transactionReference?: string | null;
  transaction_reference?: string | null;
  slipUrl?: string | null;
  slip_url?: string | null;
  remarks?: string | null;
}


export interface PayrollBatch {
  id: string;
  batch_code: string;
  year: number;
  month: number;
  period: string;
  total_staff_count: number;
  total_gross_amount: number;
  total_allowances: number;
  total_deductions: number;
  total_attendance_deductions: number;
  total_net_amount: number;
  status: 'draft' | 'processed' | 'partially_paid' | 'paid' | 'cancelled';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  payslips?: MonthlyPayrollItem[];
}

export interface BatchPayrollSummary {
  monthPeriod: string;
  totalStaffCount: number;
  totalGrossPayable: number;
  totalAttendanceDeductions: number;
  totalNetPayable: number;
  paidCount: number;
  pendingCount: number;
}
