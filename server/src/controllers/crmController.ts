import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { createAuditLog } from '../common/audit';
import { AuthenticatedRequest } from '../auth';

function mapInquiry(row: any) {
  const parentFromNotes = row.parent_name || (row.notes && String(row.notes).startsWith('Parent: ')
    ? String(row.notes).replace(/^Parent:\s*/, '')
    : '');
  return {
    ...row,
    studentName: row.name,
    parentName: parentFromNotes,
    targetClass: row.class_interest,
    gradeInterest: row.class_interest,
    followUpDate: row.follow_up_on
  };
}

export async function listInquiries(_req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await prisma.inquiry.findMany({
      include: { followUps: { orderBy: { created_at: 'desc' } } },
      orderBy: { created_at: 'desc' }
    });
    return sendSuccess(res, rows.map(mapInquiry));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createInquiry(req: AuthenticatedRequest, res: Response) {
  try {
    const { studentName, parentName, phone, targetClass, source, followUpDate, notes } = req.body;
    if (!studentName || !phone) return sendError(res, 'Student name and phone are required.', 400);
    const inq = await prisma.inquiry.create({
      data: {
        name: studentName,
        phone,
        class_interest: targetClass || '',
        source: source || 'Walk-in',
        parent_name: parentName || null,
        notes: notes || (parentName ? `Parent: ${parentName}` : null),
        follow_up_on: followUpDate || null,
        status: 'new'
      },
      include: { followUps: true }
    });
    if (req.user) await createAuditLog(req.user.userId, 'CREATE_INQUIRY', 'Inquiry', inq.id, { phone });
    return sendSuccess(res, mapInquiry(inq), null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateInquiry(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, followUpDate, notes, lostReason, studentId, targetClass, parentName } = req.body;
    const existing = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Inquiry not found.', 404);
    if (['converted', 'lost'].includes(existing.status) && status && status !== existing.status && !req.body.unlose) {
      return sendError(res, `Inquiry is already ${existing.status}.`, 409);
    }
    if (status === 'lost' && !lostReason && !existing.lost_reason) {
      return sendError(res, 'Lost reason is required.', 400);
    }
    if (status === 'converted' && existing.status === 'converted') {
      return sendError(res, 'Already converted.', 409);
    }
    const row = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(followUpDate !== undefined && { follow_up_on: followUpDate }),
        ...(notes !== undefined && { notes }),
        ...(lostReason !== undefined && { lost_reason: lostReason }),
        ...(studentId !== undefined && { student_id: studentId }),
        ...(targetClass !== undefined && { class_interest: targetClass }),
        ...(parentName !== undefined && { parent_name: parentName })
      },
      include: { followUps: { orderBy: { created_at: 'desc' } } }
    });
    if (req.user) await createAuditLog(req.user.userId, 'UPDATE_INQUIRY', 'Inquiry', row.id, { status });
    return sendSuccess(res, mapInquiry(row));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function addInquiryFollowUp(req: AuthenticatedRequest, res: Response) {
  try {
    const note = String(req.body.note || '').trim();
    if (!note) return sendError(res, 'Follow-up note is required.', 400);
    const row = await prisma.inquiryFollowUp.create({
      data: {
        inquiry_id: req.params.id,
        note,
        follow_up_on: req.body.followUpDate || null
      }
    });
    if (req.body.followUpDate) {
      await prisma.inquiry.update({
        where: { id: req.params.id },
        data: { follow_up_on: req.body.followUpDate, status: req.body.status || undefined }
      });
    }
    return sendSuccess(res, row, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function findDuplicatePhones(req: AuthenticatedRequest, res: Response) {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (phone.length < 7) return sendSuccess(res, { inquiries: [], students: [] });
    const inquiries = await prisma.inquiry.findMany({
      where: { phone: { contains: phone.slice(-10) } },
      take: 5
    });
    const students = await prisma.student.findMany({
      where: { phone: { contains: phone.slice(-10) } },
      take: 5,
      select: { id: true, full_name: true, admission_no: true, phone: true }
    });
    return sendSuccess(res, { inquiries: inquiries.map(mapInquiry), students });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
