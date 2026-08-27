import { z } from 'zod';

// Date format regex: YYYY-MM-DD
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// Time format regex: HH:mm or HH:mm:ss
export const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
// Month period format: YYYY-MM
export const MONTH_PERIOD_REGEX = /^\d{4}-\d{2}$/;
// Staff ID format regex: e.g. FAC-2026-001, ADM-2026-002, DOM-2026-003, STF-2026-004
export const STAFF_ID_REGEX = /^[A-Z]{2,6}-\d{4}-\d{3,6}$/;

export const moduleKeyEnum = z.enum([
  'students',
  'teachers',
  'teachers_staff',
  'batches',
  'subjects',
  'attendance',
  'fees',
  'exams',
  'homework',
  'timetable',
  'crm',
  'crm_inquiries',
  'announcements',
  'whatsapp',
  'settings',
  'dashboard',
  'staff_portal',
  'staff_types',
  'analytics',
  'reports'
]);

export const accessLevelEnum = z.union([
  z.enum(['hidden', 'view_only', 'editable']),
  z.literal(0).transform(() => 'hidden' as const),
  z.literal(1).transform(() => 'view_only' as const),
  z.literal(2).transform(() => 'editable' as const)
]);

export const staffLifecycleStatusEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['active', 'probation', 'on_leave', 'suspended', 'resigned', 'terminated'])
);

export const staffGenderEnum = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val;
    const clean = val.trim().toLowerCase();
    if (clean === 'male' || clean === 'm') return 'Male';
    if (clean === 'female' || clean === 'f') return 'Female';
    return 'Other';
  },
  z.enum(['Male', 'Female', 'Other'])
);

export const staffPaymentMethodEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['bank_transfer', 'cash', 'cheque'])
);

export const staffSalaryTypeEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['monthly', 'hourly', 'fixed'])
);

export const staffLeaveTypeEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['casual', 'sick', 'maternity', 'emergency', 'annual', 'unpaid', 'other'])
);

export const staffAttendanceStatusEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['present', 'late', 'half_day', 'absent', 'on_duty', 'excused', 'on_leave'])
);

export const staffDocumentTypeEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['cnic', 'degree', 'certificate', 'contract', 'resume', 'id_proof', 'police_clearance', 'other'])
);

export const staffSalaryPaymentStatusEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(['pending', 'paid', 'partial', 'cancelled'])
);
