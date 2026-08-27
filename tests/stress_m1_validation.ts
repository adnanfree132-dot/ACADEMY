/**
 * M1 Challenger 2: Empirical Stress Test Harness for Zod Validations
 * Target: server/src/validations/staffValidation.ts & associated schemas
 */

import { z } from 'zod';
import {
  DATE_REGEX,
  TIME_REGEX,
  MONTH_PERIOD_REGEX,
  STAFF_ID_REGEX,
  moduleKeyEnum,
  accessLevelEnum,
  staffLifecycleStatusEnum,
  staffGenderEnum,
  staffPaymentMethodEnum,
  staffSalaryTypeEnum,
  staffLeaveTypeEnum,
  staffAttendanceStatusEnum,
  staffDocumentTypeEnum,
  staffSalaryPaymentStatusEnum,
  staffPermissionItemSchema,
  createStaffTypeSchema,
  updateStaffTypeSchema,
  registerStaffSchema,
  updateStaffSchema,
  updateStaffPermissionsSchema,
  resetStaffPasswordSchema,
  staffCheckInSchema,
  staffCheckOutSchema,
  staffBulkAttendanceSchema,
  staffBulkAttendanceItemSchema,
  staffLeaveCreateSchema,
  staffLeaveDecisionSchema,
  staffDocumentCreateSchema,
  staffSalaryPaymentCreateSchema
} from '../server/src/validations/staffValidation';
import { sanitizeErrorMessage } from '../server/src/common/envelope';

interface TestCase {
  id: string;
  category: string;
  description: string;
  schema?: z.ZodTypeAny;
  fn?: () => any;
  input?: any;
  expectSuccess: boolean;
  validateOutput?: (output: any) => boolean | string;
  expectedErrorMessage?: string | RegExp;
}

const testCases: TestCase[] = [
  // =========================================================================
  // CATEGORY 1: REGEX BOUNDARIES & PATTERNS
  // =========================================================================
  {
    id: 'REG-01',
    category: 'Regex Pattern',
    description: 'DATE_REGEX matches valid YYYY-MM-DD',
    fn: () => DATE_REGEX.test('2026-08-21'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-02',
    category: 'Regex Pattern',
    description: 'DATE_REGEX rejects single digit month/day YYYY-M-D',
    fn: () => DATE_REGEX.test('2026-8-21'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-03',
    category: 'Regex Pattern',
    description: 'DATE_REGEX rejects slash format YYYY/MM/DD',
    fn: () => DATE_REGEX.test('2026/08/21'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-04',
    category: 'Regex Pattern',
    description: 'TIME_REGEX matches HH:mm (09:30)',
    fn: () => TIME_REGEX.test('09:30'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-05',
    category: 'Regex Pattern',
    description: 'TIME_REGEX matches HH:mm:ss (14:45:30)',
    fn: () => TIME_REGEX.test('14:45:30'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-06',
    category: 'Regex Pattern',
    description: 'TIME_REGEX rejects single digit hour (9:30)',
    fn: () => TIME_REGEX.test('9:30'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-07',
    category: 'Regex Pattern',
    description: 'MONTH_PERIOD_REGEX matches valid YYYY-MM (2026-08)',
    fn: () => MONTH_PERIOD_REGEX.test('2026-08'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-08',
    category: 'Regex Pattern',
    description: 'MONTH_PERIOD_REGEX rejects single digit month (2026-8)',
    fn: () => MONTH_PERIOD_REGEX.test('2026-8'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-09',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX matches standard prefix FAC-2026-001',
    fn: () => STAFF_ID_REGEX.test('FAC-2026-001'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-10',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX matches 2-letter prefix AD-2026-001',
    fn: () => STAFF_ID_REGEX.test('AD-2026-001'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-11',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX matches 6-letter prefix TEACHR-2026-0001',
    fn: () => STAFF_ID_REGEX.test('TEACHR-2026-0001'),
    expectSuccess: true,
    validateOutput: res => res === true
  },
  {
    id: 'REG-12',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX rejects 1-letter prefix T-2026-001',
    fn: () => STAFF_ID_REGEX.test('T-2026-001'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-13',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX rejects 7-letter prefix FACULTY-2026-001',
    fn: () => STAFF_ID_REGEX.test('FACULTY-2026-001'),
    expectSuccess: true,
    validateOutput: res => res === false
  },
  {
    id: 'REG-14',
    category: 'Regex Pattern',
    description: 'STAFF_ID_REGEX rejects lowercase prefix fac-2026-001',
    fn: () => STAFF_ID_REGEX.test('fac-2026-001'),
    expectSuccess: true,
    validateOutput: res => res === false
  },

  // =========================================================================
  // CATEGORY 2: ENUM DEFINITIONS & COERCIONS
  // =========================================================================
  {
    id: 'ENUM-01',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum accepts "hidden", "view_only", "editable"',
    schema: accessLevelEnum,
    input: 'view_only',
    expectSuccess: true,
    validateOutput: res => res === 'view_only'
  },
  {
    id: 'ENUM-02',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum transforms numeric 0 to "hidden"',
    schema: accessLevelEnum,
    input: 0,
    expectSuccess: true,
    validateOutput: res => res === 'hidden'
  },
  {
    id: 'ENUM-03',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum transforms numeric 1 to "view_only"',
    schema: accessLevelEnum,
    input: 1,
    expectSuccess: true,
    validateOutput: res => res === 'view_only'
  },
  {
    id: 'ENUM-04',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum transforms numeric 2 to "editable"',
    schema: accessLevelEnum,
    input: 2,
    expectSuccess: true,
    validateOutput: res => res === 'editable'
  },
  {
    id: 'ENUM-05',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum rejects invalid number 3',
    schema: accessLevelEnum,
    input: 3,
    expectSuccess: false
  },
  {
    id: 'ENUM-06',
    category: 'Enum & Coercion',
    description: 'accessLevelEnum rejects invalid string "admin"',
    schema: accessLevelEnum,
    input: 'admin',
    expectSuccess: false
  },
  {
    id: 'ENUM-07',
    category: 'Enum & Coercion',
    description: 'moduleKeyEnum accepts all canonical and extended modules',
    schema: z.array(moduleKeyEnum),
    input: [
      'students', 'teachers', 'teachers_staff', 'batches', 'subjects',
      'attendance', 'fees', 'exams', 'homework', 'timetable', 'crm',
      'crm_inquiries', 'announcements', 'whatsapp', 'settings', 'dashboard',
      'staff_portal', 'staff_types', 'analytics', 'reports'
    ],
    expectSuccess: true,
    validateOutput: res => res.length === 20
  },
  {
    id: 'ENUM-08',
    category: 'Enum & Coercion',
    description: 'moduleKeyEnum rejects unknown module "superadmin_secret"',
    schema: moduleKeyEnum,
    input: 'superadmin_secret',
    expectSuccess: false
  },

  // =========================================================================
  // CATEGORY 3: STAFF PERMISSION ITEM SCHEMA (staffPermissionItemSchema)
  // =========================================================================
  {
    id: 'PERM-01',
    category: 'Staff Permission Schema',
    description: 'Accepts camelCase permission item with string accessLevel',
    schema: staffPermissionItemSchema,
    input: {
      moduleKey: 'students',
      accessLevel: 'editable',
      isGlobalScope: true
    },
    expectSuccess: true,
    validateOutput: res => res.moduleKey === 'students' && res.accessLevel === 'editable' && res.isGlobalScope === true
  },
  {
    id: 'PERM-02',
    category: 'Staff Permission Schema',
    description: 'Accepts snake_case permission item with numeric 0 (hidden)',
    schema: staffPermissionItemSchema,
    input: {
      module_key: 'fees',
      access_level: 0,
      is_global_scope: false
    },
    expectSuccess: true,
    validateOutput: res => res.moduleKey === 'fees' && res.accessLevel === 'hidden' && res.isGlobalScope === false
  },
  {
    id: 'PERM-03',
    category: 'Staff Permission Schema',
    description: 'Preserves numeric 0 (hidden) without treating 0 as falsy missing',
    schema: staffPermissionItemSchema,
    input: {
      moduleKey: 'reports',
      accessLevel: 0
    },
    expectSuccess: true,
    validateOutput: res => res.moduleKey === 'reports' && res.accessLevel === 'hidden' && res.isGlobalScope === false
  },
  {
    id: 'PERM-04',
    category: 'Staff Permission Schema',
    description: 'Rejects permission item missing both moduleKey and module_key',
    schema: staffPermissionItemSchema,
    input: {
      accessLevel: 'editable'
    },
    expectSuccess: false,
    expectedErrorMessage: /moduleKey or module_key is required/
  },
  {
    id: 'PERM-05',
    category: 'Staff Permission Schema',
    description: 'Rejects permission item missing both accessLevel and access_level',
    schema: staffPermissionItemSchema,
    input: {
      moduleKey: 'students'
    },
    expectSuccess: false,
    expectedErrorMessage: /accessLevel or access_level is required/
  },

  // =========================================================================
  // CATEGORY 4: STAFF TYPE SCHEMAS (createStaffTypeSchema, updateStaffTypeSchema)
  // =========================================================================
  {
    id: 'TYPE-01',
    category: 'Staff Type Schema',
    description: 'Creates staff type with auto-generated code and slug',
    schema: createStaffTypeSchema,
    input: {
      name: 'Lab Assistant',
      description: 'Manages physics and chemistry labs'
    },
    expectSuccess: true,
    validateOutput: res => res.name === 'Lab Assistant' && res.code === 'LAB' && res.slug === 'lab-assistant' && res.iconName === 'UserCheck'
  },
  {
    id: 'TYPE-02',
    category: 'Staff Type Schema',
    description: 'Creates staff type with explicit uppercase code, custom slug, and permissions record',
    schema: createStaffTypeSchema,
    input: {
      name: 'Senior Accountant',
      code: 'acct',
      slug: 'senior-acct',
      icon_name: 'Calculator',
      defaultPermissions: {
        fees: 'editable',
        reports: 'view_only',
        students: 1
      }
    },
    expectSuccess: true,
    validateOutput: res => res.code === 'ACCT' && res.slug === 'senior-acct' && res.iconName === 'Calculator'
  },
  {
    id: 'TYPE-03',
    category: 'Staff Type Schema',
    description: 'Creates staff type with array of permission items',
    schema: createStaffTypeSchema,
    input: {
      name: 'Librarian',
      permissions: [
        { moduleKey: 'dashboard', accessLevel: 'view_only' },
        { module_key: 'students', access_level: 'view_only' }
      ]
    },
    expectSuccess: true,
    validateOutput: res => Array.isArray(res.defaultPermissions) && res.defaultPermissions.length === 2
  },
  {
    id: 'TYPE-04',
    category: 'Staff Type Schema',
    description: 'Rejects staff type name shorter than 2 chars',
    schema: createStaffTypeSchema,
    input: { name: 'A' },
    expectSuccess: false,
    expectedErrorMessage: /Staff type name must be at least 2 characters/
  },
  {
    id: 'TYPE-05',
    category: 'Staff Type Schema',
    description: 'Rejects staff type code longer than 10 chars',
    schema: createStaffTypeSchema,
    input: { name: 'Librarian', code: 'VERYLONGCODE123' },
    expectSuccess: false,
    expectedErrorMessage: /Code cannot exceed 10 characters/
  },
  {
    id: 'TYPE-06',
    category: 'Staff Type Schema',
    description: 'Updates staff type preserving isActive: false (testing falsy boolean preservation)',
    schema: updateStaffTypeSchema,
    input: {
      is_active: false,
      description: 'Archived staff category'
    },
    expectSuccess: true,
    validateOutput: res => res.isActive === false && res.description === 'Archived staff category'
  },
  {
    id: 'TYPE-07',
    category: 'Staff Type Schema',
    description: 'Updates staff type with camelCase isActive: true',
    schema: updateStaffTypeSchema,
    input: {
      isActive: true
    },
    expectSuccess: true,
    validateOutput: res => res.isActive === true
  },

  // =========================================================================
  // CATEGORY 5: REGISTER STAFF SCHEMA (registerStaffSchema)
  // =========================================================================
  {
    id: 'REGSTF-01',
    category: 'Register Staff Schema',
    description: 'Valid complete camelCase registration payload with defaults',
    schema: registerStaffSchema,
    input: {
      fullName: 'Muhammad Adnan',
      phone: '+92 300 1234567',
      email: 'ADNAN@ACADEMY.EDU',
      gender: 'Male',
      staffTypeId: 'type-uuid-1234',
      designation: 'Senior Physics Lecturer',
      qualification: 'M.Sc. Physics',
      joiningDate: '2026-08-01',
      status: 'active',
      baseSalary: 85000,
      salaryType: 'monthly',
      paymentMethod: 'bank_transfer',
      bankName: 'Meezan Bank',
      accountNumber: '01020304050607',
      accountTitle: 'Muhammad Adnan',
      emergencyName: 'Fatima Adnan',
      emergencyPhone: '+92 300 7654321',
      emergencyRelation: 'Spouse',
      customPermissions: [
        { moduleKey: 'students', accessLevel: 'editable', isGlobalScope: false },
        { moduleKey: 'attendance', accessLevel: 'editable' }
      ]
    },
    expectSuccess: true,
    validateOutput: res => (
      res.fullName === 'Muhammad Adnan' &&
      res.email === 'adnan@academy.edu' && // lowercased
      res.baseSalary === 85000 &&
      res.salaryType === 'monthly' &&
      res.customPermissions.length === 2 &&
      res.bankName === 'Meezan Bank' &&
      res.emergencyRelation === 'Spouse'
    )
  },
  {
    id: 'REGSTF-02',
    category: 'Register Staff Schema',
    description: 'Valid snake_case registration payload transforms to camelCase DTO',
    schema: registerStaffSchema,
    input: {
      full_name: 'Sarah Connor',
      phone: '03129876543',
      email: null,
      staff_type_id: 'type-uuid-5678',
      designation: 'Lab Coordinator',
      joining_date: '2026-01-15',
      base_salary: 45000,
      hourly_rate: 0,
      salary_type: 'monthly',
      payment_method: 'cash',
      bank_name: null,
      account_number: null,
      emergency_name: 'John Connor',
      emergency_phone: '03120000000',
      emergency_relation: 'Son',
      permissions: [
        { module_key: 'timetable', access_level: 'view_only' }
      ]
    },
    expectSuccess: true,
    validateOutput: res => (
      res.fullName === 'Sarah Connor' &&
      res.staffTypeId === 'type-uuid-5678' &&
      res.baseSalary === 45000 &&
      res.email === null &&
      res.paymentMethod === 'cash' &&
      res.customPermissions.length === 1 &&
      res.customPermissions[0].moduleKey === 'timetable'
    )
  },
  {
    id: 'REGSTF-03',
    category: 'Register Staff Schema',
    description: 'Nested bankDetails and emergencyContact objects are unpacked properly',
    schema: registerStaffSchema,
    input: {
      fullName: 'Tariq Mehmood',
      phone: '03335555555',
      staffTypeId: 'type-dom-001',
      designation: 'Campus Security Lead',
      bankDetails: {
        bankName: 'HBL',
        accountNumber: '9988776655',
        accountTitle: 'Tariq M'
      },
      emergencyContact: {
        name: 'Ali Tariq',
        phone: '03334444444',
        relationship: 'Brother'
      }
    },
    expectSuccess: true,
    validateOutput: res => (
      res.bankName === 'HBL' &&
      res.accountNumber === '9988776655' &&
      res.accountTitle === 'Tariq M' &&
      res.emergencyName === 'Ali Tariq' &&
      res.emergencyPhone === '03334444444' &&
      res.emergencyRelation === 'Brother' &&
      res.status === 'active' &&
      res.gender === 'Male'
    )
  },
  {
    id: 'REGSTF-04',
    category: 'Register Staff Schema',
    description: 'Preserves baseSalary: 0 and hourlyRate: 0 (falsy numeric boundary check)',
    schema: registerStaffSchema,
    input: {
      fullName: 'Volunteer Teacher',
      phone: '03001112233',
      staffTypeId: 'type-faculty',
      designation: 'Honorary Guest Lecturer',
      baseSalary: 0,
      hourlyRate: 0
    },
    expectSuccess: true,
    validateOutput: res => res.baseSalary === 0 && res.hourlyRate === 0
  },
  {
    id: 'REGSTF-05',
    category: 'Register Staff Schema',
    description: 'Empty string email is sanitized to null',
    schema: registerStaffSchema,
    input: {
      fullName: 'Hamza Khan',
      phone: '03009998877',
      staffTypeId: 'type-admin',
      designation: 'Junior Clerk',
      email: ''
    },
    expectSuccess: true,
    validateOutput: res => res.email === null
  },
  {
    id: 'REGSTF-06',
    category: 'Register Staff Schema',
    description: 'Rejects missing fullName/full_name',
    schema: registerStaffSchema,
    input: {
      phone: '03001234567',
      staffTypeId: 'type-123',
      designation: 'Teacher'
    },
    expectSuccess: false,
    expectedErrorMessage: /Full name is required/
  },
  {
    id: 'REGSTF-07',
    category: 'Register Staff Schema',
    description: 'Rejects missing staffTypeId/staff_type_id',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '03001234567',
      designation: 'Sports Coach'
    },
    expectSuccess: false,
    expectedErrorMessage: /Staff type ID is required/
  },
  {
    id: 'REGSTF-08',
    category: 'Register Staff Schema',
    description: 'Rejects phone shorter than 7 characters',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '123456',
      staffTypeId: 'type-sports',
      designation: 'Coach'
    },
    expectSuccess: false,
    expectedErrorMessage: /Phone must be at least 7 characters/
  },
  {
    id: 'REGSTF-09',
    category: 'Register Staff Schema',
    description: 'Rejects phone longer than 20 characters',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '123456789012345678901',
      staffTypeId: 'type-sports',
      designation: 'Coach'
    },
    expectSuccess: false,
    expectedErrorMessage: /Phone too long/
  },
  {
    id: 'REGSTF-10',
    category: 'Register Staff Schema',
    description: 'Rejects negative base salary (-100)',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '03001234567',
      staffTypeId: 'type-sports',
      designation: 'Coach',
      baseSalary: -100
    },
    expectSuccess: false,
    expectedErrorMessage: /Base salary must be non-negative/
  },
  {
    id: 'REGSTF-11',
    category: 'Register Staff Schema',
    description: 'Rejects invalid email format',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '03001234567',
      staffTypeId: 'type-sports',
      designation: 'Coach',
      email: 'not-a-valid-email'
    },
    expectSuccess: false,
    expectedErrorMessage: /Invalid email format/
  },
  {
    id: 'REGSTF-12',
    category: 'Register Staff Schema',
    description: 'Rejects invalid joining date format (DD/MM/YYYY)',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '03001234567',
      staffTypeId: 'type-sports',
      designation: 'Coach',
      joiningDate: '21/08/2026'
    },
    expectSuccess: false,
    expectedErrorMessage: /Joining date must be YYYY-MM-DD/
  },
  {
    id: 'REGSTF-13',
    category: 'Register Staff Schema',
    description: 'Rejects invalid lifecycle status ("fired")',
    schema: registerStaffSchema,
    input: {
      fullName: 'Kamran Akmal',
      phone: '03001234567',
      staffTypeId: 'type-sports',
      designation: 'Coach',
      status: 'fired'
    },
    expectSuccess: false
  },

  // =========================================================================
  // CATEGORY 6: UPDATE STAFF SCHEMA (updateStaffSchema)
  // =========================================================================
  {
    id: 'UPDSTF-01',
    category: 'Update Staff Schema',
    description: 'Accepts partial camelCase updates',
    schema: updateStaffSchema,
    input: {
      designation: 'Head of Mathematics',
      baseSalary: 95000,
      statusRemarks: 'Promoted to department head'
    },
    expectSuccess: true,
    validateOutput: res => res.designation === 'Head of Mathematics' && res.baseSalary === 95000 && res.statusRemarks === 'Promoted to department head'
  },
  {
    id: 'UPDSTF-02',
    category: 'Update Staff Schema',
    description: 'Accepts partial snake_case updates and maps to camelCase',
    schema: updateStaffSchema,
    input: {
      photo_url: 'https://example.com/avatar.jpg',
      status_remarks: 'On annual leave',
      base_salary: 60000
    },
    expectSuccess: true,
    validateOutput: res => res.photoUrl === 'https://example.com/avatar.jpg' && res.statusRemarks === 'On annual leave' && res.baseSalary === 60000
  },
  {
    id: 'UPDSTF-03',
    category: 'Update Staff Schema',
    description: 'Preserves baseSalary: 0 in partial update',
    schema: updateStaffSchema,
    input: {
      baseSalary: 0
    },
    expectSuccess: true,
    validateOutput: res => res.baseSalary === 0
  },
  {
    id: 'UPDSTF-04',
    category: 'Update Staff Schema',
    description: 'Transforms empty email string "" to null in update',
    schema: updateStaffSchema,
    input: {
      email: ''
    },
    expectSuccess: true,
    validateOutput: res => res.email === null
  },

  // =========================================================================
  // CATEGORY 7: UPDATE STAFF PERMISSIONS & RESET PASSWORD SCHEMAS
  // =========================================================================
  {
    id: 'PERMSCH-01',
    category: 'Staff Permissions Update',
    description: 'Accepts valid non-empty permissions array',
    schema: updateStaffPermissionsSchema,
    input: {
      permissions: [
        { moduleKey: 'students', accessLevel: 'editable' },
        { moduleKey: 'attendance', accessLevel: 'view_only' }
      ]
    },
    expectSuccess: true,
    validateOutput: res => res.permissions.length === 2
  },
  {
    id: 'PERMSCH-02',
    category: 'Staff Permissions Update',
    description: 'Rejects empty permissions array',
    schema: updateStaffPermissionsSchema,
    input: {
      permissions: []
    },
    expectSuccess: false,
    expectedErrorMessage: /At least one module permission must be provided/
  },
  {
    id: 'RESETPW-01',
    category: 'Reset Staff Password Schema',
    description: 'Accepts valid staffId and temporary password',
    schema: resetStaffPasswordSchema,
    input: {
      staffId: 'FAC-2026-042',
      temporaryPassword: 'TempPassword123'
    },
    expectSuccess: true,
    validateOutput: res => res.staffId === 'FAC-2026-042' && res.temporaryPassword === 'TempPassword123'
  },
  {
    id: 'RESETPW-02',
    category: 'Reset Staff Password Schema',
    description: 'Rejects invalid staffId format (lowercase prefix)',
    schema: resetStaffPasswordSchema,
    input: {
      staffId: 'fac-2026-042'
    },
    expectSuccess: false
  },
  {
    id: 'RESETPW-03',
    category: 'Reset Staff Password Schema',
    description: 'Rejects temporaryPassword shorter than 6 chars',
    schema: resetStaffPasswordSchema,
    input: {
      temporaryPassword: '12345'
    },
    expectSuccess: false
  },

  // =========================================================================
  // CATEGORY 8: ATTENDANCE SCHEMAS (check-in, check-out, bulk)
  // =========================================================================
  {
    id: 'ATT-01',
    category: 'Attendance Schemas',
    description: 'staffCheckInSchema defaults date and checkInTime if omitted',
    schema: staffCheckInSchema,
    input: {
      staffMemberId: 'staff-uuid-1'
    },
    expectSuccess: true,
    validateOutput: res => Boolean(res.date) && Boolean(res.checkInTime) && res.status === 'present'
  },
  {
    id: 'ATT-02',
    category: 'Attendance Schemas',
    description: 'staffCheckInSchema accepts snake_case staff_member_id and check_in_time',
    schema: staffCheckInSchema,
    input: {
      staff_member_id: 'staff-uuid-2',
      date: '2026-08-21',
      check_in_time: '08:30:00',
      status: 'late',
      notes: 'Traffic delay'
    },
    expectSuccess: true,
    validateOutput: res => res.staffMemberId === 'staff-uuid-2' && res.status === 'late' && res.checkInTime === '08:30:00'
  },
  {
    id: 'ATT-03',
    category: 'Attendance Schemas',
    description: 'staffCheckOutSchema accepts custom checkOutTime',
    schema: staffCheckOutSchema,
    input: {
      staffMemberId: 'staff-uuid-1',
      date: '2026-08-21',
      checkOutTime: '17:00:00'
    },
    expectSuccess: true,
    validateOutput: res => res.checkOutTime === '17:00:00'
  },
  {
    id: 'ATT-04',
    category: 'Attendance Schemas',
    description: 'staffBulkAttendanceSchema accepts valid batch attendance payload',
    schema: staffBulkAttendanceSchema,
    input: {
      date: '2026-08-21',
      records: [
        { staffMemberId: 'stf-1', status: 'present', checkInTime: '08:00' },
        { staffMemberId: 'stf-2', status: 'absent', notes: 'Uninformed' },
        { staffMemberId: 'stf-3', status: 'half_day', checkInTime: '08:00', checkOutTime: '12:00' }
      ]
    },
    expectSuccess: true,
    validateOutput: res => res.records.length === 3
  },
  {
    id: 'ATT-05',
    category: 'Attendance Schemas',
    description: 'staffBulkAttendanceSchema rejects empty records array',
    schema: staffBulkAttendanceSchema,
    input: {
      date: '2026-08-21',
      records: []
    },
    expectSuccess: false,
    expectedErrorMessage: /Records array cannot be empty/
  },
  {
    id: 'ATT-06',
    category: 'Attendance Schemas',
    description: 'staffBulkAttendanceSchema rejects invalid date format',
    schema: staffBulkAttendanceSchema,
    input: {
      date: '21/08/2026',
      records: [{ staffMemberId: 'stf-1', status: 'present' }]
    },
    expectSuccess: false,
    expectedErrorMessage: /Date must be YYYY-MM-DD/
  },

  // =========================================================================
  // CATEGORY 9: LEAVE REQUEST & DECISION SCHEMAS
  // =========================================================================
  {
    id: 'LEAVE-01',
    category: 'Leave Request Schema',
    description: 'staffLeaveCreateSchema accepts camelCase payload',
    schema: staffLeaveCreateSchema,
    input: {
      staffMemberId: 'stf-uuid-1',
      leaveType: 'sick',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      reason: 'Viral flu and doctor prescribed bed rest'
    },
    expectSuccess: true,
    validateOutput: res => res.leaveType === 'sick' && res.startDate === '2026-09-01' && res.endDate === '2026-09-03'
  },
  {
    id: 'LEAVE-02',
    category: 'Leave Request Schema',
    description: 'staffLeaveCreateSchema accepts snake_case payload',
    schema: staffLeaveCreateSchema,
    input: {
      staff_member_id: 'stf-uuid-2',
      leave_type: 'casual',
      start_date: '2026-09-10',
      end_date: '2026-09-10',
      reason: 'Attending family wedding ceremony'
    },
    expectSuccess: true,
    validateOutput: res => res.staffMemberId === 'stf-uuid-2' && res.leaveType === 'casual' && res.startDate === '2026-09-10'
  },
  {
    id: 'LEAVE-03',
    category: 'Leave Request Schema',
    description: 'staffLeaveCreateSchema rejects reason shorter than 3 chars',
    schema: staffLeaveCreateSchema,
    input: {
      leaveType: 'casual',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      reason: 'No'
    },
    expectSuccess: false,
    expectedErrorMessage: /Reason must be at least 3 characters/
  },
  {
    id: 'LEAVE-04',
    category: 'Leave Request Schema',
    description: 'staffLeaveCreateSchema rejects missing leaveType',
    schema: staffLeaveCreateSchema,
    input: {
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      reason: 'Family emergency'
    },
    expectSuccess: false,
    expectedErrorMessage: /Leave type is required/
  },
  {
    id: 'LEAVE-05',
    category: 'Leave Request Decision Schema',
    description: 'staffLeaveDecisionSchema accepts approval with substitute teacher',
    schema: staffLeaveDecisionSchema,
    input: {
      decision: 'approved',
      reviewerRemarks: 'Approved by Principal',
      substituteTeacherId: 'teacher-sub-007'
    },
    expectSuccess: true,
    validateOutput: res => res.decision === 'approved' && res.substituteTeacherId === 'teacher-sub-007'
  },
  {
    id: 'LEAVE-06',
    category: 'Leave Request Decision Schema',
    description: 'staffLeaveDecisionSchema accepts rejection with rejectionReason & snake_case',
    schema: staffLeaveDecisionSchema,
    input: {
      status: 'rejected',
      rejectionReason: 'Exams scheduled on requested dates',
      substitute_teacher_id: null
    },
    expectSuccess: true,
    validateOutput: res => res.decision === 'rejected' && res.reviewerRemarks === 'Exams scheduled on requested dates'
  },
  {
    id: 'LEAVE-07',
    category: 'Leave Request Decision Schema',
    description: 'staffLeaveDecisionSchema rejects missing decision and status',
    schema: staffLeaveDecisionSchema,
    input: {
      remarks: 'Looks good'
    },
    expectSuccess: false,
    expectedErrorMessage: /Decision \('approved' or 'rejected'\) is required/
  },

  // =========================================================================
  // CATEGORY 10: DOCUMENT VAULT & SALARY PAYMENT SCHEMAS
  // =========================================================================
  {
    id: 'DOC-01',
    category: 'Staff Document Schema',
    description: 'staffDocumentCreateSchema accepts valid document payload with expiry',
    schema: staffDocumentCreateSchema,
    input: {
      title: 'CNIC Card Copy',
      documentType: 'cnic',
      fileUrl: 'https://storage.academy.edu/docs/cnic-123.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      expiryDate: '2030-12-31'
    },
    expectSuccess: true,
    validateOutput: res => res.title === 'CNIC Card Copy' && res.documentType === 'cnic' && res.expiryDate === '2030-12-31'
  },
  {
    id: 'DOC-02',
    category: 'Staff Document Schema',
    description: 'staffDocumentCreateSchema accepts snake_case document payload',
    schema: staffDocumentCreateSchema,
    input: {
      title: 'Teaching Degree M.Sc.',
      document_type: 'degree',
      file_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      file_size: 50000,
      mime_type: 'image/png'
    },
    expectSuccess: true,
    validateOutput: res => res.documentType === 'degree' && Boolean(res.fileUrl)
  },
  {
    id: 'DOC-03',
    category: 'Staff Document Schema',
    description: 'staffDocumentCreateSchema rejects title shorter than 2 chars',
    schema: staffDocumentCreateSchema,
    input: {
      title: 'A',
      documentType: 'contract',
      fileUrl: 'https://example.com/doc.pdf'
    },
    expectSuccess: false,
    expectedErrorMessage: /Document title must be at least 2 characters/
  },
  {
    id: 'DOC-04',
    category: 'Staff Document Schema',
    description: 'staffDocumentCreateSchema rejects missing fileUrl',
    schema: staffDocumentCreateSchema,
    input: {
      title: 'Employment Contract',
      documentType: 'contract'
    },
    expectSuccess: false,
    expectedErrorMessage: /File URL is required/
  },
  {
    id: 'SAL-01',
    category: 'Staff Salary Payment Schema',
    description: 'staffSalaryPaymentCreateSchema computes net amount automatically',
    schema: staffSalaryPaymentCreateSchema,
    input: {
      monthPeriod: '2026-08',
      basePay: 80000,
      allowances: 5000,
      deductions: 2000,
      paymentMethod: 'bank_transfer',
      referenceNo: 'TXN-99887766'
    },
    expectSuccess: true,
    validateOutput: res => (
      res.monthPeriod === '2026-08' &&
      res.basePay === 80000 &&
      res.allowances === 5000 &&
      res.deductions === 2000 &&
      res.amount === 83000 && // 80000 + 5000 - 2000
      res.netPayable === 83000 &&
      res.referenceNo === 'TXN-99887766'
    )
  },
  {
    id: 'SAL-02',
    category: 'Staff Salary Payment Schema',
    description: 'staffSalaryPaymentCreateSchema accepts snake_case payload and transaction_ref',
    schema: staffSalaryPaymentCreateSchema,
    input: {
      month_period: '2026-07',
      amount: 65000,
      payment_method: 'cheque',
      transaction_ref: 'CHQ-100234',
      remarks: 'July salary clearance'
    },
    expectSuccess: true,
    validateOutput: res => (
      res.monthPeriod === '2026-07' &&
      res.amount === 65000 &&
      res.transactionRef === 'CHQ-100234' &&
      res.remarks === 'July salary clearance'
    )
  },
  {
    id: 'SAL-03',
    category: 'Staff Salary Payment Schema',
    description: 'staffSalaryPaymentCreateSchema rejects invalid month format (2026-8-01)',
    schema: staffSalaryPaymentCreateSchema,
    input: {
      monthPeriod: '2026-8-01',
      basePay: 50000
    },
    expectSuccess: false,
    expectedErrorMessage: /Month period must be YYYY-MM/
  },
  {
    id: 'SAL-04',
    category: 'Staff Salary Payment Schema',
    description: 'staffSalaryPaymentCreateSchema rejects missing basePay/amount',
    schema: staffSalaryPaymentCreateSchema,
    input: {
      monthPeriod: '2026-08'
    },
    expectSuccess: false,
    expectedErrorMessage: /Base pay or amount is required/
  },

  // =========================================================================
  // CATEGORY 11: ERROR ENVELOPE SANITIZATION & ATTACK RESILIENCE
  // =========================================================================
  {
    id: 'SAN-01',
    category: 'Error Sanitization',
    description: 'Sanitizes Prisma foreign key constraint code P2003',
    fn: () => sanitizeErrorMessage('Foreign key constraint violated on the fields: (`staff_type_id`) P2003'),
    expectSuccess: true,
    validateOutput: res => res.includes('Cannot delete or modify this item because other active records depend on it.')
  },
  {
    id: 'SAN-02',
    category: 'Error Sanitization',
    description: 'Sanitizes Prisma unique constraint code P2002',
    fn: () => sanitizeErrorMessage('Unique constraint failed on the fields: (`staff_id`) P2002'),
    expectSuccess: true,
    validateOutput: res => res.includes('A record with this identifier, code, email, or phone number already exists.')
  },
  {
    id: 'SAN-03',
    category: 'Error Sanitization',
    description: 'Sanitizes Prisma record not found code P2025',
    fn: () => sanitizeErrorMessage('Record to update not found. P2025'),
    expectSuccess: true,
    validateOutput: res => res.includes('The requested record could not be found or has already been removed.')
  },
  {
    id: 'SAN-04',
    category: 'Error Sanitization',
    description: 'Sanitizes raw Prisma stack trace / node_modules leak',
    fn: () => sanitizeErrorMessage('Invalid `prisma.staffMember.create()` invocation:\n at D:\\academy\\node_modules\\@prisma\\client\\...'),
    expectSuccess: true,
    validateOutput: res => res.includes('The database operation could not be completed due to conflicting records.')
  },
  {
    id: 'SAN-05',
    category: 'Error Sanitization',
    description: 'Passes through user-friendly validation error messages unmodified',
    fn: () => sanitizeErrorMessage('Full name must be at least 2 characters'),
    expectSuccess: true,
    validateOutput: res => res === 'Full name must be at least 2 characters'
  },
  {
    id: 'SAN-06',
    category: 'Error Sanitization',
    description: 'Gracefully handles null / undefined / empty error inputs',
    fn: () => sanitizeErrorMessage(null),
    expectSuccess: true,
    validateOutput: res => res === 'An unexpected error occurred. Please try again.'
  }
];

export async function runStressTests() {
  console.log('='.repeat(80));
  console.log('🔬 M1 CHALLENGER 2: EMPIRICAL ZOD VALIDATION & BOUNDARY STRESS HARNESS');
  console.log('='.repeat(80));
  console.log(`Total Test Cases in Suite: ${testCases.length}\n`);

  let passed = 0;
  let failed = 0;
  const results: Array<{
    id: string;
    category: string;
    description: string;
    status: 'PASS' | 'FAIL';
    details: string;
  }> = [];

  for (const tc of testCases) {
    try {
      if (tc.fn) {
        const output = tc.fn();
        let pass = tc.expectSuccess;
        let details = `Function output: ${JSON.stringify(output)}`;

        if (tc.validateOutput) {
          const valid = tc.validateOutput(output);
          if (valid !== true) {
            pass = false;
            details += ` | Validation failed: ${valid}`;
          }
        }

        if (pass) {
          passed++;
          results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'PASS', details });
          console.log(`[PASS] ${tc.id}: ${tc.description}`);
        } else {
          failed++;
          results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
          console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
        }
      } else if (tc.schema) {
        const parseResult = tc.schema.safeParse(tc.input);

        if (tc.expectSuccess) {
          if (parseResult.success) {
            let pass = true;
            let details = `Parsed: ${JSON.stringify(parseResult.data)}`;
            if (tc.validateOutput) {
              const valid = tc.validateOutput(parseResult.data);
              if (valid !== true) {
                pass = false;
                details += ` | Custom validator failed: ${valid}`;
              }
            }

            if (pass) {
              passed++;
              results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'PASS', details });
              console.log(`[PASS] ${tc.id}: ${tc.description}`);
            } else {
              failed++;
              results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
              console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
            }
          } else {
            failed++;
            const errMsg = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            const details = `Expected success but got ZodError: ${errMsg}`;
            results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
            console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
          }
        } else {
          // Expected failure
          if (!parseResult.success) {
            let pass = true;
            const fullErrMsg = parseResult.error.errors.map(e => e.message).join('; ');
            let details = `Correctly rejected with error: ${fullErrMsg}`;

            if (tc.expectedErrorMessage) {
              const matches = typeof tc.expectedErrorMessage === 'string'
                ? fullErrMsg.includes(tc.expectedErrorMessage)
                : tc.expectedErrorMessage.test(fullErrMsg);
              if (!matches) {
                pass = false;
                details += ` | Expected error matching: ${tc.expectedErrorMessage}`;
              }
            }

            if (pass) {
              passed++;
              results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'PASS', details });
              console.log(`[PASS] ${tc.id}: ${tc.description} (Error caught: "${fullErrMsg}")`);
            } else {
              failed++;
              results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
              console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
            }
          } else {
            failed++;
            const details = `Expected schema validation failure, but input was unexpectedly accepted: ${JSON.stringify(parseResult.data)}`;
            results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
            console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
          }
        }
      }
    } catch (err: any) {
      failed++;
      const details = `Exception thrown during test execution: ${err.message}`;
      results.push({ id: tc.id, category: tc.category, description: tc.description, status: 'FAIL', details });
      console.log(`❌ [FAIL] ${tc.id}: ${tc.description} -> ${details}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED | ${testCases.length} TOTAL`);
  console.log(`Pass Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  return { passed, failed, total: testCases.length, results };
}

// Auto-run when executed directly via tsx
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.includes('stress_m1_validation')) {
  runStressTests().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    }
  });
}
