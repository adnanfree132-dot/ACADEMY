import { z } from 'zod';

export const createConductLogSchema = z.object({
  student_id: z.string().uuid("Invalid student ID").optional(),
  batch_id: z.string().uuid("Invalid batch ID").optional().nullable(),
  category: z.enum(["commendation", "infraction", "academic", "attendance", "general"]).default("general"),
  severity: z.enum(["positive", "neutral", "warning", "critical"]).default("neutral"),
  title: z.string().max(120, "Title cannot exceed 120 characters").optional().nullable(),
  remark: z.string().min(3, "Remark must be at least 3 characters").max(2000, "Remark too long"),
  is_confidential: z.boolean().default(false)
});

export const updateConductLogSchema = z.object({
  category: z.enum(["commendation", "infraction", "academic", "attendance", "general"]).optional(),
  severity: z.enum(["positive", "neutral", "warning", "critical"]).optional(),
  title: z.string().max(120, "Title cannot exceed 120 characters").optional().nullable(),
  remark: z.string().min(3, "Remark must be at least 3 characters").max(2000, "Remark too long").optional(),
  is_confidential: z.boolean().optional()
});
