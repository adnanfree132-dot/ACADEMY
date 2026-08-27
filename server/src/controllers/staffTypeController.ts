import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import {
  createStaffTypeSchema,
  updateStaffTypeSchema
} from '../validations/staffTypeValidation';
import {
  CANONICAL_MODULE_KEYS,
  CanonicalModuleKey,
  normalizeAccessLevel,
  AccessLevelString
} from '../types/staff';
import { prisma } from '../prisma';

/**
 * 1. GET /api/v1/staff-types
 * Retrieves all staff types (built-in system defaults and custom categories)
 */
export async function getStaffTypes(req: Request, res: Response) {
  try {
    const staffTypes = await prisma.staffType.findMany({
      include: {
        defaultPermissions: true,
        _count: {
          select: {
            staffMembers: {
              where: { status: { in: ['active', 'probation', 'on_leave'] } }
            }
          }
        }
      },
      orderBy: [
        { is_system: 'desc' },
        { is_system_default: 'desc' },
        { name: 'asc' }
      ]
    });

    const enriched = staffTypes.map((st) => ({
      id: st.id,
      name: st.name,
      code: st.code,
      slug: st.slug,
      description: st.description,
      iconName: st.icon_name,
      icon_name: st.icon_name,
      isSystem: st.is_system,
      is_system: st.is_system,
      isSystemDefault: st.is_system_default,
      is_system_default: st.is_system_default,
      isActive: st.is_active,
      is_active: st.is_active,
      basePermissions: st.base_permissions,
      base_permissions: st.base_permissions,
      defaultPermissions: st.defaultPermissions,
      activeStaffCount: st._count.staffMembers,
      staffCount: st._count.staffMembers,
      createdAt: st.created_at,
      updatedAt: st.updated_at
    }));

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. GET /api/v1/staff-types/:id
 * Retrieves a single staff type by ID, code, or slug
 */
export async function getStaffTypeById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const staffType = await prisma.staffType.findFirst({
      where: {
        OR: [
          { id },
          { code: { equals: id, mode: 'insensitive' } },
          { slug: { equals: id, mode: 'insensitive' } },
          { name: { equals: id, mode: 'insensitive' } }
        ]
      },
      include: {
        defaultPermissions: true,
        _count: {
          select: { staffMembers: true }
        }
      }
    });

    if (!staffType) {
      return sendError(res, 'Staff type not found', 404);
    }

    return sendSuccess(res, {
      id: staffType.id,
      name: staffType.name,
      code: staffType.code,
      slug: staffType.slug,
      description: staffType.description,
      iconName: staffType.icon_name,
      icon_name: staffType.icon_name,
      isSystem: staffType.is_system,
      is_system: staffType.is_system,
      isSystemDefault: staffType.is_system_default,
      is_system_default: staffType.is_system_default,
      isActive: staffType.is_active,
      is_active: staffType.is_active,
      basePermissions: staffType.base_permissions,
      base_permissions: staffType.base_permissions,
      defaultPermissions: staffType.defaultPermissions,
      staffCount: staffType._count.staffMembers,
      createdAt: staffType.created_at,
      updatedAt: staffType.updated_at
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. POST /api/v1/staff-types
 * Creates a new custom staff type with template permissions
 */
export async function createStaffType(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = createStaffTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Invalid input data', 400);
    }

    const { name, code, slug, description, iconName, defaultPermissions, baseTemplate, baseTemplateId } = parsed.data;

    // Check for duplicate name or code
    const existing = await prisma.staffType.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: code, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      if (existing.name.toLowerCase() === name.toLowerCase()) {
        return sendError(res, `A staff type named "${name}" already exists.`, 409);
      }
      return sendError(res, `A staff type with code "${code}" already exists.`, 409);
    }

    // Resolve template permissions
    const templatePerms: Record<string, { accessLevel: AccessLevelString; isGlobalScope: boolean }> = {};

    // Initialize all canonical modules to hidden
    for (const mod of CANONICAL_MODULE_KEYS) {
      templatePerms[mod] = { accessLevel: 'hidden', isGlobalScope: false };
    }

    // If base template specified, clone from existing StaffType
    if (baseTemplate || baseTemplateId) {
      const base: any = await prisma.staffType.findFirst({
        where: {
          OR: [
            baseTemplateId ? { id: baseTemplateId } : {},
            baseTemplate ? { name: { equals: baseTemplate, mode: 'insensitive' as const } } : {},
            baseTemplate ? { slug: { equals: baseTemplate.toLowerCase(), mode: 'insensitive' as const } } : {}
          ].filter((c) => Object.keys(c).length > 0)
        },
        include: { defaultPermissions: true }
      });

      if (base && base.defaultPermissions) {
        for (const p of base.defaultPermissions) {
          templatePerms[p.module_key] = {
            accessLevel: normalizeAccessLevel(p.access_level as any),
            isGlobalScope: p.is_global_scope
          };
        }
      }
    }

    // Apply explicit defaultPermissions payload
    if (defaultPermissions) {
      if (Array.isArray(defaultPermissions)) {
        for (const p of defaultPermissions) {
          const mod = (p.moduleKey || (p as any).module_key);
          const lvl = p.accessLevel !== undefined ? p.accessLevel : (p as any).access_level;
          if (mod) {
            templatePerms[mod] = {
              accessLevel: normalizeAccessLevel(lvl as any),
              isGlobalScope: p.isGlobalScope ?? (p as any).is_global_scope ?? false
            };
          }
        }
      } else if (typeof defaultPermissions === 'object') {
        for (const [mod, lvl] of Object.entries(defaultPermissions)) {
          templatePerms[mod] = {
            accessLevel: normalizeAccessLevel(lvl as any),
            isGlobalScope: false
          };
        }
      }
    }

    // Database transaction: Create StaffType + Template StaffPermission rows
    const createdType = await prisma.$transaction(async (tx) => {
      const st = await tx.staffType.create({
        data: {
          name,
          code,
          slug,
          description,
          icon_name: iconName,
          is_system: false,
          is_system_default: false,
          is_active: true,
          base_permissions: templatePerms as any
        }
      });

      const permRows = Object.entries(templatePerms).map(([moduleKey, cfg]) => ({
        staff_type_id: st.id,
        module_key: moduleKey,
        access_level: cfg.accessLevel,
        is_global_scope: cfg.isGlobalScope
      }));

      await tx.staffPermission.createMany({
        data: permRows,
        skipDuplicates: true
      });

      return st;
    });

    const fullType = await prisma.staffType.findUnique({
      where: { id: createdType.id },
      include: { defaultPermissions: true }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'CREATE_STAFF_TYPE', 'StaffType', createdType.id, { name, code });
    }

    const responsePayload = {
      ...fullType,
      id: createdType.id,
      name: createdType.name,
      code: createdType.code,
      iconName: createdType.icon_name,
      icon_name: createdType.icon_name,
      isSystem: createdType.is_system,
      is_system: createdType.is_system,
      isActive: createdType.is_active,
      is_active: createdType.is_active,
      basePermissions: createdType.base_permissions,
      base_permissions: createdType.base_permissions,
      defaultPermissions: fullType?.defaultPermissions || []
    };

    return sendSuccess(res, responsePayload, null, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 4. PUT /api/v1/staff-types/:id
 * Updates an existing staff type and its default permissions
 */
export async function updateStaffType(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parsed = updateStaffTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.issues[0]?.message || 'Invalid input data', 400);
    }

    const existing = await prisma.staffType.findFirst({
      where: {
        OR: [
          { id },
          { code: { equals: id, mode: 'insensitive' } },
          { slug: { equals: id, mode: 'insensitive' } }
        ]
      }
    });

    if (!existing) {
      return sendError(res, 'Staff type not found', 404);
    }

    const { name, code, slug, description, iconName, isActive, defaultPermissions } = parsed.data;

    // Check collision if updating name or code
    if (name || code) {
      const collision = await prisma.staffType.findFirst({
        where: {
          id: { not: existing.id },
          OR: [
            name ? { name: { equals: name, mode: 'insensitive' as const } } : {},
            code ? { code: { equals: code, mode: 'insensitive' as const } } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      if (collision) {
        return sendError(res, 'Another staff type already uses this name or code.', 409);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const st = await tx.staffType.update({
        where: { id: existing.id },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(iconName && { icon_name: iconName }),
          ...(isActive !== undefined && { is_active: isActive })
        }
      });

      if (defaultPermissions) {
        if (Array.isArray(defaultPermissions)) {
          for (const p of defaultPermissions) {
            const mod = p.moduleKey || (p as any).module_key;
            const lvl = p.accessLevel !== undefined ? p.accessLevel : (p as any).access_level;
            if (mod) {
              await tx.staffPermission.upsert({
                where: {
                  staff_type_id_module_key: {
                    staff_type_id: existing.id,
                    module_key: mod
                  }
                },
                update: {
                  access_level: normalizeAccessLevel(lvl as any),
                  is_global_scope: p.isGlobalScope ?? (p as any).is_global_scope ?? false
                },
                create: {
                  staff_type_id: existing.id,
                  module_key: mod,
                  access_level: normalizeAccessLevel(lvl as any),
                  is_global_scope: p.isGlobalScope ?? (p as any).is_global_scope ?? false
                }
              });
            }
          }
        } else if (typeof defaultPermissions === 'object') {
          for (const [moduleKey, lvl] of Object.entries(defaultPermissions)) {
            await tx.staffPermission.upsert({
              where: {
                staff_type_id_module_key: {
                  staff_type_id: existing.id,
                  module_key: moduleKey
                }
              },
              update: {
                access_level: normalizeAccessLevel(lvl as any)
              },
              create: {
                staff_type_id: existing.id,
                module_key: moduleKey,
                access_level: normalizeAccessLevel(lvl as any),
                is_global_scope: false
              }
            });
          }
        }
      }

      return st;
    });

    const fullType = await prisma.staffType.findUnique({
      where: { id: updated.id },
      include: { defaultPermissions: true }
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'UPDATE_STAFF_TYPE', 'StaffType', existing.id, parsed.data);
    }

    return sendSuccess(res, {
      ...fullType,
      iconName: fullType?.icon_name,
      icon_name: fullType?.icon_name,
      isSystem: fullType?.is_system,
      is_system: fullType?.is_system,
      isActive: fullType?.is_active,
      is_active: fullType?.is_active
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 5. DELETE /api/v1/staff-types/:id
 * Deletes or archives a staff type with strict dependency checks
 */
export async function deleteStaffType(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const staffType = await prisma.staffType.findFirst({
      where: {
        OR: [
          { id },
          { code: { equals: id, mode: 'insensitive' } },
          { slug: { equals: id, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            staffMembers: {
              where: { status: { in: ['active', 'probation', 'on_leave'] } }
            }
          }
        }
      }
    });

    if (!staffType) {
      return sendError(res, 'Staff type not found', 404);
    }

    // Guard 1: Cannot delete system built-in types
    if (staffType.is_system || staffType.is_system_default) {
      return sendError(res, 'Cannot delete built-in system staff type (Faculty, Admin, Domestic Staff).', 403);
    }

    // Guard 2: Cannot delete if active staff members assigned
    if (staffType._count.staffMembers > 0) {
      return sendError(
        res,
        `Cannot delete staff type because ${staffType._count.staffMembers} active staff member(s) are currently assigned to it. Please reassign staff members first.`,
        400
      );
    }

    // Safe deletion / archive
    await prisma.$transaction(async (tx) => {
      await tx.staffPermission.deleteMany({ where: { staff_type_id: staffType.id } });
      await tx.staffType.delete({ where: { id: staffType.id } });
    });

    if (req.user && req.user.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'DELETE_STAFF_TYPE', 'StaffType', staffType.id, { name: staffType.name });
    }

    return sendSuccess(res, { message: 'Staff type deleted successfully', id: staffType.id });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}
