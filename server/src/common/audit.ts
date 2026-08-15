import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        entity,
        entity_id: entityId,
        changes: changes ? JSON.stringify(changes) : null
      }
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
