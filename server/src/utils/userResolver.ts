import { prisma } from '../prisma';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates and resolves a user ID against the User table in PostgreSQL.
 * If the input is missing, not a valid UUID format, synthetic (e.g. 'admin-id'),
 * or does not correspond to an existing record in the User table, returns null.
 * This prevents Prisma P2003 foreign key constraint violations.
 */
export async function resolveSafeUserId(userId?: string | null): Promise<string | null> {
  if (!userId || typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  if (!trimmed || !UUID_REGEX.test(trimmed)) {
    return null;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: trimmed },
      select: { id: true }
    });
    return user ? user.id : null;
  } catch {
    return null;
  }
}
