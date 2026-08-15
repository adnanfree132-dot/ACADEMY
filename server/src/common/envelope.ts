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

export function sendError(res: Response, error: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error
  });
}
