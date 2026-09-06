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

  // 5. Database connectivity / Wasm runtime traps / connection drops
  if (
    str.includes('unreachable') ||
    str.includes("Can't reach database") ||
    str.includes('Connection terminated') ||
    str.includes('connection closed') ||
    str.includes('pool timeout') ||
    str.includes('fetch failed') ||
    str.includes('DatabaseConnectionError') ||
    str.includes('socket hang up') ||
    str.includes('ECONNRESET') ||
    str.includes('EPIPE') ||
    str.includes('Cannot use a pool')
  ) {
    return 'The database connection is temporarily unavailable or busy. Please retry in a few moments.';
  }

  return str;
}

export function sendError(res: Response, error: any, statusCode = 400) {
  const cleanMessage = sanitizeErrorMessage(error);
  let finalStatus = statusCode;
  if (error && typeof error === 'object' && typeof error.status === 'number') {
    finalStatus = error.status;
  } else if (
    (error?.name === 'DatabaseConnectionError' ||
      cleanMessage === 'The database connection is temporarily unavailable or busy. Please retry in a few moments.') &&
    finalStatus >= 500
  ) {
    finalStatus = 503;
  }

  if (finalStatus >= 500) {
    console.error('⚠️ [Server Error Log]:', error);
  }
  return res.status(finalStatus).json({
    success: false,
    error: cleanMessage
  });
}
