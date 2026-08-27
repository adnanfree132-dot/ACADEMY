import { z } from 'zod';
import { moduleKeyEnum, accessLevelEnum } from './commonValidation';

export const staffPermissionItemSchema = z.object({
  moduleKey: moduleKeyEnum.optional(),
  module_key: moduleKeyEnum.optional(),
  accessLevel: accessLevelEnum.optional(),
  access_level: accessLevelEnum.optional(),
  isGlobalScope: z.boolean().optional(),
  is_global_scope: z.boolean().optional()
}).refine(data => data.moduleKey || data.module_key, {
  message: "moduleKey or module_key is required"
}).refine(data => data.accessLevel !== undefined || data.access_level !== undefined, {
  message: "accessLevel or access_level is required"
}).transform(data => ({
  moduleKey: (data.moduleKey || data.module_key)!,
  accessLevel: (data.accessLevel !== undefined ? data.accessLevel : data.access_level)!,
  isGlobalScope: data.isGlobalScope ?? data.is_global_scope ?? false
}));

export const createStaffTypeSchema = z.object({
  name: z.string().trim().min(2, "Staff type name must be at least 2 characters").max(50, "Name too long"),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(10, "Code cannot exceed 10 characters").toUpperCase().optional(),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  iconName: z.string().trim().optional(),
  icon_name: z.string().trim().optional(),
  baseTemplate: z.enum(['Faculty', 'Admin', 'Domestic Staff', 'Blank']).optional(),
  baseTemplateId: z.string().optional(),
  defaultPermissions: z.union([
    z.array(staffPermissionItemSchema),
    z.record(z.string(), accessLevelEnum)
  ]).optional(),
  permissions: z.array(staffPermissionItemSchema).optional()
}).transform(data => ({
  name: data.name,
  code: data.code || data.name.substring(0, 3).toUpperCase(),
  slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  description: data.description || null,
  iconName: data.iconName || data.icon_name || "UserCheck",
  baseTemplate: data.baseTemplate,
  baseTemplateId: data.baseTemplateId,
  defaultPermissions: data.defaultPermissions || data.permissions
}));

export const updateStaffTypeSchema = z.object({
  name: z.string().trim().min(2, "Staff type name must be at least 2 characters").max(50).optional(),
  code: z.string().trim().min(2).max(10).toUpperCase().optional(),
  slug: z.string().trim().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  iconName: z.string().trim().optional(),
  icon_name: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  defaultPermissions: z.union([
    z.array(staffPermissionItemSchema),
    z.record(z.string(), accessLevelEnum)
  ]).optional(),
  permissions: z.array(staffPermissionItemSchema).optional()
}).transform(data => ({
  name: data.name,
  code: data.code,
  slug: data.slug,
  description: data.description,
  iconName: data.iconName || data.icon_name,
  isActive: data.isActive !== undefined ? data.isActive : data.is_active,
  defaultPermissions: data.defaultPermissions || data.permissions
}));
