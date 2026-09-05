import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest, generateToken, resolveStaffPermissions } from '../auth';

/**
 * Ensures the default primary academy exists and all orphaned users/data link to it.
 * Also ensures the super_admin account is seeded.
 */
export async function ensureDefaultAcademy() {
  try {
    let defaultAcademy = await prisma.academy.findFirst({
      where: {
        OR: [
          { id: 'default-academy-id' },
          { slug: 'apex-academy' }
        ]
      }
    });

    if (!defaultAcademy) {
      defaultAcademy = await prisma.academy.create({
        data: {
          id: 'default-academy-id',
          name: 'Apex International Academy',
          slug: 'apex-academy',
          phone: '+92 300 1234567',
          email: 'admin@apexacademy.edu',
          address: 'Main Campus, Sector F-8, Islamabad',
          subscription_status: 'active',
          trial_started_at: new Date(),
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          is_active: true
        }
      });
      console.log('Created default academy:', defaultAcademy.name);
    }

    // Link unassigned non-super_admin users to the default academy
    await prisma.user.updateMany({
      where: {
        academy_id: null,
        role: { not: 'super_admin' }
      },
      data: {
        academy_id: defaultAcademy.id
      }
    });

    // Ensure Super Admin user exists
    const superAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'super_admin' },
          { username: 'superadmin' },
          { email: 'superadmin@academiapro.io' }
        ]
      }
    });

    if (!superAdmin) {
      const superHash = await bcrypt.hash('superadmin123', 10);
      await prisma.user.create({
        data: {
          role: 'super_admin',
          full_name: 'Platform Super Admin',
          username: 'superadmin',
          email: 'superadmin@academiapro.io',
          phone: '+923009999999',
          password_hash: superHash,
          must_change_password: false,
          is_active: true,
          academy_id: null
        }
      });
      console.log('Created Platform Super Admin account (superadmin / superadmin123)');
    }
  } catch (err) {
    console.error('Error in ensureDefaultAcademy:', err);
  }
}

/**
 * Helper to slugify an academy name safely
 */
function slugifyAcademy(name: string): string {
  const base = (name || 'academy')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return base || 'academy';
}

/**
 * Calculate trial days remaining
 */
function getDaysRemaining(trialEndsAt: Date): number {
  const now = new Date();
  const diffMs = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 1. POST /api/v1/auth/register-academy
 * Self-serve academy registration:
 * - Provisions 30-day free trial (trial_ends_at = now() + 30 days)
 * - Creates Academy record
 * - Creates linked Administrator User
 * - Generates session token and returns complete authenticated vertical slice
 */
export async function registerAcademy(req: Request, res: Response) {
  try {
    const { academyName, adminName, fullName, email, password, phone, address } = req.body;

    const cleanAcademyName = (academyName || '').trim();
    const cleanAdminName = (adminName || fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanAddress = (address || '').trim();

    if (!cleanAcademyName) {
      return sendError(res, 'Academy name is required', 400);
    }
    if (!cleanAdminName) {
      return sendError(res, 'Administrator name is required', 400);
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return sendError(res, 'A valid email address is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    // Check if user email is already registered
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists. Please sign in.', 400);
    }

    // Generate unique slug
    let baseSlug = slugifyAcademy(cleanAcademyName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.academy.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day trial

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Academy
      const academy = await tx.academy.create({
        data: {
          name: cleanAcademyName,
          slug: finalSlug,
          phone: cleanPhone || null,
          email: cleanEmail,
          address: cleanAddress || null,
          subscription_status: 'trial',
          trial_started_at: now,
          trial_ends_at: trialEndsAt,
          is_active: true
        }
      });

      // 2. Create Admin User
      const user = await tx.user.create({
        data: {
          academy_id: academy.id,
          role: 'admin',
          full_name: cleanAdminName,
          email: cleanEmail,
          phone: cleanPhone || null,
          password_hash: passwordHash,
          must_change_password: false,
          is_active: true
        }
      });

      // 3. Set Academy owner
      await tx.academy.update({
        where: { id: academy.id },
        data: { owner_id: user.id }
      });

      return { academy, user };
    });

    const daysLeft = getDaysRemaining(result.academy.trial_ends_at);
    const resolvedPermissions = resolveStaffPermissions('admin', 'ADM');

    const tokenPayload = {
      userId: result.user.id,
      academyId: result.academy.id,
      role: 'admin',
      fullName: result.user.full_name,
      name: result.user.full_name,
      email: result.user.email,
      phone: result.user.phone,
      isPasswordChanged: true,
      permissions: resolvedPermissions
    };

    const token = generateToken(tokenPayload as any);

    const academyData = {
      id: result.academy.id,
      name: result.academy.name,
      slug: result.academy.slug,
      subscriptionStatus: result.academy.subscription_status,
      subscription_status: result.academy.subscription_status,
      trialEndsAt: result.academy.trial_ends_at,
      trial_ends_at: result.academy.trial_ends_at,
      daysLeft,
      daysRemaining: daysLeft,
      isActive: result.academy.is_active
    };

    return sendSuccess(res, {
      token,
      academy: academyData,
      user: {
        id: result.user.id,
        fullName: result.user.full_name,
        name: result.user.full_name,
        email: result.user.email,
        phone: result.user.phone,
        role: 'admin',
        academyId: result.academy.id,
        academy: academyData,
        isPasswordChanged: true,
        is_password_changed: true,
        permissions: resolvedPermissions
      }
    });
  } catch (err: any) {
    console.error('Error registering academy:', err);
    return sendError(res, err.message || 'Academy registration failed', 500);
  }
}

/**
 * 2. GET /api/v1/super-admin/stats
 * Platform overview KPIs for Super Admin:
 * - Total Academies
 * - Active Trials
 * - Expired Trials
 * - Revoked Academies
 * - Total Platform Users & Students
 */
export async function getSuperAdminStats(req: AuthenticatedRequest, res: Response) {
  try {
    const now = new Date();

    const [
      totalAcademies,
      activeTrials,
      expiredTrials,
      revokedAcademies,
      activeSubscriptions,
      totalUsers,
      totalStudents
    ] = await Promise.all([
      prisma.academy.count(),
      prisma.academy.count({
        where: {
          subscription_status: 'trial',
          trial_ends_at: { gte: now },
          is_active: true
        }
      }),
      prisma.academy.count({
        where: {
          OR: [
            { subscription_status: 'expired' },
            {
              subscription_status: 'trial',
              trial_ends_at: { lt: now }
            }
          ]
        }
      }),
      prisma.academy.count({
        where: {
          OR: [
            { subscription_status: 'revoked' },
            { is_active: false }
          ]
        }
      }),
      prisma.academy.count({
        where: {
          subscription_status: 'active',
          is_active: true
        }
      }),
      prisma.user.count(),
      prisma.student.count()
    ]);

    return sendSuccess(res, {
      totalAcademies,
      activeTrials,
      expiredTrials,
      revokedAcademies,
      activeSubscriptions,
      totalUsers,
      totalStudents
    });
  } catch (err: any) {
    console.error('Error fetching super admin stats:', err);
    return sendError(res, err.message || 'Failed to fetch platform stats', 500);
  }
}

/**
 * 3. GET /api/v1/super-admin/academies
 * Comprehensive academy directory for Super Admin:
 * Lists all academies with owner contact, trial status, days remaining, staff & student counts.
 */
export async function getSuperAdminAcademies(req: AuthenticatedRequest, res: Response) {
  try {
    const academies = await prisma.academy.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          where: { role: 'admin' },
          select: { id: true, full_name: true, email: true, phone: true }
        }
      }
    });

    const now = new Date();

    const formatted = academies.map((ac) => {
      const daysRemaining = getDaysRemaining(ac.trial_ends_at);
      const isTrialOver = ac.subscription_status === 'trial' && new Date(ac.trial_ends_at) < now;
      const effectiveStatus = ac.subscription_status === 'revoked' || !ac.is_active
        ? 'revoked'
        : isTrialOver
        ? 'expired'
        : ac.subscription_status;

      const adminUser = ac.users[0] || null;

      return {
        id: ac.id,
        name: ac.name,
        slug: ac.slug,
        logoUrl: ac.logo_url,
        phone: ac.phone,
        email: ac.email,
        address: ac.address,
        subscriptionStatus: effectiveStatus,
        subscription_status: effectiveStatus,
        trialStartedAt: ac.trial_started_at,
        trial_started_at: ac.trial_started_at,
        trialEndsAt: ac.trial_ends_at,
        trial_ends_at: ac.trial_ends_at,
        daysRemaining: effectiveStatus === 'active' ? 999 : daysRemaining,
        isActive: ac.is_active,
        createdAt: ac.created_at,
        created_at: ac.created_at,
        adminUser: adminUser ? {
          id: adminUser.id,
          fullName: adminUser.full_name,
          email: adminUser.email,
          phone: adminUser.phone
        } : null
      };
    });

    return sendSuccess(res, formatted);
  } catch (err: any) {
    console.error('Error fetching academies for super admin:', err);
    return sendError(res, err.message || 'Failed to fetch academies directory', 500);
  }
}

/**
 * 4. POST /api/v1/super-admin/academies/:id/extend-trial
 * Direct Super Admin action: Extend trial period by N days or set custom end date.
 */
export async function extendAcademyTrial(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { days, newEndDate } = req.body;

    const academy = await prisma.academy.findUnique({
      where: { id }
    });

    if (!academy) {
      return sendError(res, 'Academy not found', 404);
    }

    let updatedEndDate: Date;

    if (newEndDate) {
      updatedEndDate = new Date(newEndDate);
      if (isNaN(updatedEndDate.getTime())) {
        return sendError(res, 'Invalid end date format', 400);
      }
    } else {
      const extensionDays = parseInt(days as any, 10) || 30;
      const now = new Date();
      // If current trial is in future, add to it; otherwise add from now
      const baseDate = new Date(academy.trial_ends_at) > now ? new Date(academy.trial_ends_at) : now;
      updatedEndDate = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.academy.update({
      where: { id },
      data: {
        trial_ends_at: updatedEndDate,
        subscription_status: 'trial',
        is_active: true
      }
    });

    const daysRemaining = getDaysRemaining(updated.trial_ends_at);

    return sendSuccess(res, {
      id: updated.id,
      name: updated.name,
      subscriptionStatus: updated.subscription_status,
      subscription_status: updated.subscription_status,
      trialEndsAt: updated.trial_ends_at,
      trial_ends_at: updated.trial_ends_at,
      daysRemaining,
      isActive: updated.is_active,
      message: `Trial successfully extended until ${updated.trial_ends_at.toISOString().split('T')[0]}`
    });
  } catch (err: any) {
    console.error('Error extending trial:', err);
    return sendError(res, err.message || 'Failed to extend trial', 500);
  }
}

/**
 * 5. POST /api/v1/super-admin/academies/:id/revoke
 * Direct Super Admin action: Revoke access or restore revoked academy.
 */
export async function revokeAcademyAccess(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { revoke } = req.body;

    const academy = await prisma.academy.findUnique({
      where: { id }
    });

    if (!academy) {
      return sendError(res, 'Academy not found', 404);
    }

    const shouldRevoke = revoke !== undefined ? Boolean(revoke) : academy.subscription_status !== 'revoked';

    let newStatus = 'trial';
    let newIsActive = true;

    if (shouldRevoke) {
      newStatus = 'revoked';
      newIsActive = false;
    } else {
      // Restoring: check if trial expired or still valid
      const now = new Date();
      if (new Date(academy.trial_ends_at) < now) {
        // give 7 days grace on restoration if already expired
        await prisma.academy.update({
          where: { id },
          data: {
            trial_ends_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      }
      newStatus = 'trial';
      newIsActive = true;
    }

    const updated = await prisma.academy.update({
      where: { id },
      data: {
        subscription_status: newStatus,
        is_active: newIsActive
      }
    });

    const daysRemaining = getDaysRemaining(updated.trial_ends_at);

    return sendSuccess(res, {
      id: updated.id,
      name: updated.name,
      subscriptionStatus: updated.subscription_status,
      subscription_status: updated.subscription_status,
      daysRemaining,
      isActive: updated.is_active,
      message: shouldRevoke ? 'Academy access has been revoked.' : 'Academy access has been restored.'
    });
  } catch (err: any) {
    console.error('Error modifying academy access:', err);
    return sendError(res, err.message || 'Failed to update academy access', 500);
  }
}
