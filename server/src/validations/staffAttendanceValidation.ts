import { z } from 'zod';
import { DATE_REGEX, TIME_REGEX, MONTH_PERIOD_REGEX, staffAttendanceStatusEnum } from './commonValidation';

export const staffCheckInSchema = z.object({
  staffMemberId: z.string().trim().optional(),
  staff_member_id: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  device_info: z.string().trim().max(255).optional(),
  date: z.string().regex(DATE_REGEX, 'Date must be YYYY-MM-DD').optional(),
  check_in_time: z.string().regex(TIME_REGEX, 'Time must be HH:mm or HH:mm:ss').optional(),
  checkInTime: z.string().regex(TIME_REGEX).optional(),
  notes: z.string().trim().max(500).optional().nullable()
}).transform((data) => ({
  staffMemberId: data.staffMemberId || data.staff_member_id,
  staff_member_id: data.staff_member_id || data.staffMemberId,
  latitude: data.latitude,
  longitude: data.longitude,
  device_info: data.device_info,
  date: data.date,
  check_in_time: data.check_in_time || data.checkInTime,
  notes: data.notes || null
}));

export const staffCheckOutSchema = z.object({
  staffMemberId: z.string().trim().optional(),
  staff_member_id: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  device_info: z.string().trim().max(255).optional(),
  date: z.string().regex(DATE_REGEX, 'Date must be YYYY-MM-DD').optional(),
  check_out_time: z.string().regex(TIME_REGEX, 'Time must be HH:mm or HH:mm:ss').optional(),
  checkOutTime: z.string().regex(TIME_REGEX).optional(),
  notes: z.string().trim().max(500).optional().nullable()
}).transform((data) => ({
  staffMemberId: data.staffMemberId || data.staff_member_id,
  staff_member_id: data.staff_member_id || data.staffMemberId,
  latitude: data.latitude,
  longitude: data.longitude,
  device_info: data.device_info,
  date: data.date,
  check_out_time: data.check_out_time || data.checkOutTime,
  notes: data.notes || null
}));

export const adminAttendanceOverrideSchema = z.object({
  staff_member_id: z.string({ required_error: 'staff_member_id is required' }).trim().min(1, 'Staff member ID is required'),
  staffMemberId: z.string().trim().optional(),
  date: z.string({ required_error: 'Date is required' }).regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format'),
  status: staffAttendanceStatusEnum,
  check_in_time: z.string().regex(TIME_REGEX, 'Check-in time must be in HH:mm or HH:mm:ss format').optional().nullable(),
  checkInTime: z.string().regex(TIME_REGEX).optional().nullable(),
  check_out_time: z.string().regex(TIME_REGEX, 'Check-out time must be in HH:mm or HH:mm:ss format').optional().nullable(),
  checkOutTime: z.string().regex(TIME_REGEX).optional().nullable(),
  override_reason: z.string({ required_error: 'override_reason is mandatory' }).trim().min(3, 'Override reason is mandatory and must be at least 3 characters'),
  notes: z.string().trim().max(500).optional().nullable()
}).transform((data) => ({
  staff_member_id: data.staff_member_id || data.staffMemberId!,
  date: data.date,
  status: data.status,
  check_in_time: data.check_in_time !== undefined ? data.check_in_time : (data.checkInTime !== undefined ? data.checkInTime : undefined),
  check_out_time: data.check_out_time !== undefined ? data.check_out_time : (data.checkOutTime !== undefined ? data.checkOutTime : undefined),
  override_reason: data.override_reason,
  notes: data.notes || null
}));

export const staffAttendanceRosterQuerySchema = z.object({
  date: z.string().regex(DATE_REGEX).optional(),
  month: z.string().regex(MONTH_PERIOD_REGEX).optional(),
  start_date: z.string().regex(DATE_REGEX).optional(),
  end_date: z.string().regex(DATE_REGEX).optional(),
  staff_member_id: z.string().trim().optional(),
  staff_type_id: z.string().trim().optional(),
  status: z.string().trim().optional()
});

export const staffBulkAttendanceItemSchema = z.object({
  staffMemberId: z.string().trim().min(1, 'Staff Member ID is required'),
  status: staffAttendanceStatusEnum.default('present'),
  checkInTime: z.string().regex(TIME_REGEX).optional().nullable(),
  checkOutTime: z.string().regex(TIME_REGEX).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable()
});

export const staffBulkAttendanceSchema = z.object({
  date: z.string().regex(DATE_REGEX, 'Date must be YYYY-MM-DD'),
  records: z.array(staffBulkAttendanceItemSchema).min(1, 'Records array cannot be empty')
});
