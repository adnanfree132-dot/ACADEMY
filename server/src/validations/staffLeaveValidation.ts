import { z } from 'zod';
import { DATE_REGEX, staffLeaveTypeEnum } from './commonValidation';

export const staffLeaveCreateSchema = z.object({
  staffMemberId: z.string().trim().optional(),
  staff_member_id: z.string().trim().optional(),
  leaveType: staffLeaveTypeEnum.optional(),
  leave_type: staffLeaveTypeEnum.optional(),
  startDate: z.string().regex(DATE_REGEX, "Start date must be YYYY-MM-DD").optional(),
  start_date: z.string().regex(DATE_REGEX).optional(),
  endDate: z.string().regex(DATE_REGEX, "End date must be YYYY-MM-DD").optional(),
  end_date: z.string().regex(DATE_REGEX).optional(),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(1000, "Reason too long")
}).refine(data => data.leaveType || data.leave_type, {
  message: "Leave type is required",
  path: ["leaveType"]
}).refine(data => data.startDate || data.start_date, {
  message: "Start date is required",
  path: ["startDate"]
}).refine(data => data.endDate || data.end_date, {
  message: "End date is required",
  path: ["endDate"]
}).transform(data => {
  const startDate = (data.startDate || data.start_date)!;
  const endDate = (data.endDate || data.end_date)!;
  return {
    staffMemberId: data.staffMemberId || data.staff_member_id,
    leaveType: (data.leaveType || data.leave_type)!,
    startDate,
    endDate,
    reason: data.reason
  };
});

export const staffLeaveDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']).optional(),
  status: z.enum(['approved', 'rejected']).optional(),
  reviewerRemarks: z.string().trim().max(1000).optional().nullable(),
  remarks: z.string().trim().max(1000).optional().nullable(),
  rejectionReason: z.string().trim().max(1000).optional().nullable(),
  substituteTeacherId: z.string().trim().optional().nullable(),
  substitute_teacher_id: z.string().trim().optional().nullable()
}).refine(data => data.decision || data.status, {
  message: "Decision ('approved' or 'rejected') is required",
  path: ["decision"]
}).transform(data => ({
  decision: (data.decision || data.status)!,
  reviewerRemarks: data.reviewerRemarks || data.remarks || data.rejectionReason || null,
  substituteTeacherId: data.substituteTeacherId || data.substitute_teacher_id || null
}));
