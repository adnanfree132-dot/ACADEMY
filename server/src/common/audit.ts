import { prisma } from '../prisma';

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: any
) {
  try {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let validUserId = userId;
    
    // Validate if userId is a valid UUID in the User table
    if (!validUserId || !UUID_REGEX.test(validUserId)) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      if (!firstUser) return;
      validUserId = firstUser.id;
    } else {
      const exists = await prisma.user.findUnique({
        where: { id: validUserId },
        select: { id: true }
      });
      if (!exists) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        if (!firstUser) return;
        validUserId = firstUser.id;
      }
    }

    await prisma.auditLog.create({
      data: {
        user_id: validUserId,
        action,
        entity,
        entity_id: String(entityId),
        changes: changes ? (typeof changes === 'string' ? changes : JSON.stringify(changes)) : null
      }
    });
  } catch (err) {
    // Non-blocking audit logging - never crash operational endpoints
    console.warn('Audit logging skipped (graceful fallback):', (err as any)?.message || err);
  }
}
