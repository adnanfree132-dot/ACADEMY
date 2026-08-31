import { z } from 'zod';
import { 
  DATE_REGEX, 
  STAFF_ID_REGEX,
  staffGenderEnum, 
  staffLifecycleStatusEnum, 
  staffPaymentMethodEnum, 
  staffSalaryTypeEnum 
} from './commonValidation';
import { staffPermissionItemSchema } from './staffTypeValidation';

export * from './commonValidation';
export * from './staffTypeValidation';
export * from './staffAttendanceValidation';
export * from './staffLeaveValidation';
export * from './staffDocumentValidation';
export * from './staffSalaryValidation';

export const registerStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
  phone: z.string().trim().min(7, "Phone must be at least 7 characters").max(20, "Phone too long"),
  email: z.string().trim().email("Invalid email format").toLowerCase().optional().nullable().or(z.literal('')),
  gender: staffGenderEnum.optional(),
  staffTypeId: z.string().trim().min(1, "Staff type is required").optional(),
  staff_type_id: z.string().trim().min(1, "Staff type is required").optional(),
  designation: z.string().trim().min(2, "Designation must be at least 2 characters").max(100),
  qualification: z.string().trim().max(200).optional().nullable(),
  joiningDate: z.string().regex(DATE_REGEX, "Joining date must be YYYY-MM-DD").optional(),
  joining_date: z.string().regex(DATE_REGEX, "Joining date must be YYYY-MM-DD").optional(),
  status: staffLifecycleStatusEnum.optional(),
  
  // Financial & Compensation Terms
  baseSalary: z.number().min(0, "Base salary must be non-negative").optional(),
  base_salary: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  hourly_rate: z.number().min(0).optional(),
  salaryType: staffSalaryTypeEnum.optional(),
  salary_type: staffSalaryTypeEnum.optional(),
  paymentMethod: staffPaymentMethodEnum.optional(),
  payment_method: staffPaymentMethodEnum.optional(),
  
  // Bank Details
  bankName: z.string().trim().max(100).optional().nullable(),
  bank_name: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  account_number: z.string().trim().max(50).optional().nullable(),
  accountTitle: z.string().trim().max(100).optional().nullable(),
  account_title: z.string().trim().max(100).optional().nullable(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountTitle: z.string().optional()
  }).optional(),
  
  // Emergency Contact
  emergencyName: z.string().trim().max(100).optional().nullable(),
  emergency_name: z.string().trim().max(100).optional().nullable(),
  emergencyPhone: z.string().trim().max(20).optional().nullable(),
  emergency_phone: z.string().trim().max(20).optional().nullable(),
  emergencyRelation: z.string().trim().max(50).optional().nullable(),
  emergency_relation: z.string().trim().max(50).optional().nullable(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional()
  }).optional(),
  
  // Permissions & Custom Metadata
  customPermissions: z.array(staffPermissionItemSchema).optional(),
  permissions: z.array(staffPermissionItemSchema).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  custom_fields: z.record(z.string(), z.any()).optional()
}).refine(data => data.fullName || data.full_name, {
  message: "Full name is required",
  path: ["fullName"]
}).refine(data => data.staffTypeId || data.staff_type_id, {
  message: "Staff type ID is required",
  path: ["staffTypeId"]
}).transform(data => ({
  fullName: (data.fullName || data.full_name)!,
  phone: data.phone,
  email: data.email || null,
  gender: data.gender || "Male",
  staffTypeId: (data.staffTypeId || data.staff_type_id)!,
  designation: data.designation,
  qualification: data.qualification || null,
  joiningDate: data.joiningDate || data.joining_date || new Date().toISOString().split('T')[0],
  status: data.status || "active",
  baseSalary: data.baseSalary ?? data.base_salary ?? 0,
  hourlyRate: data.hourlyRate ?? data.hourly_rate ?? 0,
  salaryType: data.salaryType || data.salary_type || "monthly",
  paymentMethod: data.paymentMethod || data.payment_method || "bank_transfer",
  bankName: data.bankName || data.bank_name || data.bankDetails?.bankName || null,
  accountNumber: data.accountNumber || data.account_number || data.bankDetails?.accountNumber || null,
  accountTitle: data.accountTitle || data.account_title || data.bankDetails?.accountTitle || null,
  emergencyName: data.emergencyName || data.emergency_name || data.emergencyContact?.name || null,
  emergencyPhone: data.emergencyPhone || data.emergency_phone || data.emergencyContact?.phone || null,
  emergencyRelation: data.emergencyRelation || data.emergency_relation || data.emergencyContact?.relationship || null,
  customPermissions: data.customPermissions || data.permissions || [],
  customFields: data.customFields || data.custom_fields || null
}));

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  email: z.string().trim().email().toLowerCase().optional().nullable().or(z.literal('')),
  gender: staffGenderEnum.optional(),
  staffTypeId: z.string().trim().optional(),
  staff_type_id: z.string().trim().optional(),
  designation: z.string().trim().min(2).max(100).optional(),
  qualification: z.string().trim().max(200).optional().nullable(),
  joiningDate: z.string().regex(DATE_REGEX).optional(),
  joining_date: z.string().regex(DATE_REGEX).optional(),
  status: staffLifecycleStatusEnum.optional(),
  statusRemarks: z.string().trim().max(500).optional().nullable(),
  status_remarks: z.string().trim().max(500).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable(),
  photoUrl: z.string().trim().optional().nullable(),
  photo_url: z.string().trim().optional().nullable(),
  baseSalary: z.number().min(0).optional().nullable(),
  base_salary: z.number().min(0).optional().nullable(),
  hourlyRate: z.number().min(0).optional().nullable(),
  hourly_rate: z.number().min(0).optional().nullable(),
  salaryType: staffSalaryTypeEnum.optional(),
  paymentMethod: staffPaymentMethodEnum.optional(),
  payment_method: staffPaymentMethodEnum.optional(),
  bankName: z.string().trim().max(100).optional().nullable(),
  bank_name: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  account_number: z.string().trim().max(50).optional().nullable(),
  accountTitle: z.string().trim().max(100).optional().nullable(),
  account_title: z.string().trim().max(100).optional().nullable(),
  emergencyName: z.string().trim().max(100).optional().nullable(),
  emergency_name: z.string().trim().max(100).optional().nullable(),
  emergencyPhone: z.string().trim().max(20).optional().nullable(),
  emergency_phone: z.string().trim().max(20).optional().nullable(),
  emergencyRelation: z.string().trim().max(50).optional().nullable(),
  emergency_relation: z.string().trim().max(50).optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
  custom_fields: z.record(z.string(), z.any()).optional().nullable()
}).transform(data => ({
  fullName: data.fullName || data.full_name,
  phone: data.phone,
  email: data.email === '' ? null : data.email,
  gender: data.gender,
  staffTypeId: data.staffTypeId || data.staff_type_id,
  designation: data.designation,
  qualification: data.qualification,
  joiningDate: data.joiningDate || data.joining_date,
  status: data.status,
  statusRemarks: data.statusRemarks || data.status_remarks || data.remarks,
  photoUrl: data.photoUrl || data.photo_url,
  baseSalary: data.baseSalary !== undefined ? data.baseSalary : data.base_salary,
  hourlyRate: data.hourlyRate !== undefined ? data.hourlyRate : data.hourly_rate,
  salaryType: data.salaryType,
  paymentMethod: data.paymentMethod || data.payment_method,
  bankName: data.bankName || data.bank_name,
  accountNumber: data.accountNumber || data.account_number,
  accountTitle: data.accountTitle || data.account_title,
  emergencyName: data.emergencyName || data.emergency_name,
  emergencyPhone: data.emergencyPhone || data.emergency_phone,
  emergencyRelation: data.emergencyRelation || data.emergency_relation,
  customFields: data.customFields || data.custom_fields
}));

export const updateStaffPermissionsSchema = z.object({
  permissions: z.array(staffPermissionItemSchema).min(1, "At least one module permission must be provided")
});

export const resetStaffPasswordSchema = z.object({
  staffId: z.string().regex(STAFF_ID_REGEX).optional(),
  temporaryPassword: z.string().min(6).optional()
});
