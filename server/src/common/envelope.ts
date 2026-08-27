import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
}

export function sendSuccess<T>(res: Response, data: T, meta?: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
}

export function sanitizeErrorMessage(rawError: any): string {
  if (!rawError) return 'An unexpected error occurred. Please try again.';
  const str = typeof rawError === 'string' ? rawError : (rawError.message || String(rawError));

  // 1. Foreign Key Reference Violations
  if (str.includes('Foreign key constraint violated') || str.includes('P2003') || str.includes('foreign key constraint')) {
    return 'Cannot delete or modify this item because other active records depend on it. Please remove or reassign linked items first.';
  }

  // 2. Unique Constraint Duplications
  if (str.includes('Unique constraint failed') || str.includes('P2002') || str.includes('duplicate key')) {
    return 'A record with this identifier, code, email, or phone number already exists.';
  }

  // 3. Record Not Found / Already Removed
  if (str.includes('Record to delete does not exist') || str.includes('Record to update not found') || str.includes('P2025')) {
    return 'The requested record could not be found or has already been removed.';
  }

  // 4. Raw Prisma / Server stack traces
  if (str.includes('Invalid `prisma.') || str.includes('node_modules')) {
    return 'The database operation could not be completed due to conflicting records. Please verify dependencies.';
  }

  return str;
}

export function sendError(res: Response, error: any, statusCode = 400) {
  const cleanMessage = sanitizeErrorMessage(error);
  if (statusCode >= 500) {
    console.error('⚠️ [Server Error Log]:', error);
  }
  return res.status(statusCode).json({
    success: false,
    error: cleanMessage
  });
}
