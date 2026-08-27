import { z } from 'zod';
import { DATE_REGEX, staffDocumentTypeEnum } from './commonValidation';

export const staffDocumentCreateSchema = z.object({
  title: z.string().trim().min(2, "Document title must be at least 2 characters").max(150),
  documentType: staffDocumentTypeEnum.optional(),
  document_type: staffDocumentTypeEnum.optional(),
  fileUrl: z.string().trim().min(1, "File URL or attachment data is required").optional(),
  file_url: z.string().trim().min(1).optional(),
  fileSize: z.number().min(0).optional().nullable(),
  file_size: z.number().min(0).optional().nullable(),
  mimeType: z.string().trim().max(100).optional().nullable(),
  mime_type: z.string().trim().max(100).optional().nullable(),
  expiryDate: z.string().regex(DATE_REGEX, "Expiry date must be YYYY-MM-DD").optional().nullable(),
  expiry_date: z.string().regex(DATE_REGEX).optional().nullable()
}).refine(data => data.documentType || data.document_type, {
  message: "Document type is required",
  path: ["documentType"]
}).refine(data => data.fileUrl || data.file_url, {
  message: "File URL is required",
  path: ["fileUrl"]
}).transform(data => ({
  title: data.title,
  documentType: (data.documentType || data.document_type)!,
  fileUrl: (data.fileUrl || data.file_url)!,
  fileSize: data.fileSize || data.file_size || null,
  mimeType: data.mimeType || data.mime_type || null,
  expiryDate: data.expiryDate || data.expiry_date || null
}));
