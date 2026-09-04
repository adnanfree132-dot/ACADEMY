import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { createAuditLog } from '../common/audit';
import { AuthenticatedRequest } from '../auth';
import { timeRangesOverlap } from '../utils/timeOverlap';

export async function getSubjectCatalog(req: AuthenticatedRequest, res: Response) {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            batchSubjects: true,
            homeworks: true,
            tests: true,
            timetableSlots: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    return sendSuccess(res, subjects);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteSubjectSafe(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const [batchCount, hwCount, testCount, slotCount] = await Promise.all([
      prisma.batchSubject.count({ where: { subject_id: id } }),
      prisma.homework.count({ where: { subject_id: id } }),
      prisma.test.count({ where: { subject_id: id } }),
      prisma.timetableSlot.count({ where: { subject_id: id } })
    ]);
    const blockers = [
      batchCount && `${batchCount} batch assignment(s)`,
      hwCount && `${hwCount} homework item(s)`,
      testCount && `${testCount} test(s)`,
      slotCount && `${slotCount} timetable slot(s)`
    ].filter(Boolean);
    if (blockers.length) {
      return sendError(res, `Cannot delete subject: still used by ${blockers.join(', ')}.`, 409);
    }
    await prisma.subject.delete({ where: { id } });
    if (req.user) await createAuditLog(req.user.userId, 'DELETE_SUBJECT', 'Subject', id, {});
    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    if (err.code === 'P2025') return sendError(res, 'Subject not found.', 404);
    return sendError(res, err.message, 500);
  }
}

export async function archiveBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const batch = await prisma.batch.update({
      where: { id: req.params.id },
      data: { is_active: false }
    });
    if (req.user) await createAuditLog(req.user.userId, 'ARCHIVE_BATCH', 'Batch', batch.id, {});
    return sendSuccess(res, batch);
  } catch (err: any) {
    if (err.code === 'P2025') return sendError(res, 'Batch not found.', 404);
    return sendError(res, err.message, 500);
  }
}

export async function getBatchWaitlist(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await prisma.batchWaitlist.findMany({
      where: { batch_id: req.params.id },
      include: { student: true },
      orderBy: { position: 'asc' }
    });
    return sendSuccess(res, rows);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function addBatchWaitlist(req: AuthenticatedRequest, res: Response) {
  try {
    const batchId = req.params.id;
    const { studentId, reason } = req.body;
    if (!studentId) return sendError(res, 'studentId is required.', 400);

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return sendError(res, 'Student not found.', 404);
    if ((student.status || '').toLowerCase() === 'left') {
      return sendError(res, 'A student marked Left cannot be enrolled. Waitlist is allowed only for active/on-leave students.', 409);
    }

    const existingEnroll = await prisma.enrollment.findUnique({
      where: { student_id_batch_id: { student_id: studentId, batch_id: batchId } }
    });
    if (existingEnroll?.status === 'active') {
      return sendError(res, 'Student is already enrolled in this batch.', 409);
    }

    const last = await prisma.batchWaitlist.findFirst({
      where: { batch_id: batchId },
      orderBy: { position: 'desc' }
    });
    const row = await prisma.batchWaitlist.upsert({
      where: { batch_id_student_id: { batch_id: batchId, student_id: studentId } },
      update: { reason: reason || undefined },
      create: {
        batch_id: batchId,
        student_id: studentId,
        position: (last?.position || 0) + 1,
        reason: reason || null
      },
      include: { student: true }
    });
    if (req.user) await createAuditLog(req.user.userId, 'WAITLIST_ADD', 'Batch', batchId, { studentId });
    return sendSuccess(res, row, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function promoteWaitlist(req: AuthenticatedRequest, res: Response) {
  try {
    const batchId = req.params.id;
    const { studentId } = req.body;
    const entry = await prisma.batchWaitlist.findUnique({
      where: { batch_id_student_id: { batch_id: batchId, student_id: studentId } }
    });
    if (!entry) return sendError(res, 'Student is not on the waitlist.', 404);

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return sendError(res, 'Batch not found.', 404);
    const activeCount = await prisma.enrollment.count({ where: { batch_id: batchId, status: 'active' } });
    if (activeCount >= batch.capacity) {
      return sendError(res, `Still at capacity (${activeCount}/${batch.capacity}). Free a seat first.`, 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.enrollment.upsert({
        where: { student_id_batch_id: { student_id: studentId, batch_id: batchId } },
        update: { status: 'active' },
        create: { student_id: studentId, batch_id: batchId, status: 'active' }
      });
      await tx.batchWaitlist.delete({ where: { id: entry.id } });
    });
    if (req.user) await createAuditLog(req.user.userId, 'WAITLIST_PROMOTE', 'Batch', batchId, { studentId });
    return sendSuccess(res, { promoted: true, studentId });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function removeWaitlist(req: AuthenticatedRequest, res: Response) {
  try {
    await prisma.batchWaitlist.delete({
      where: { batch_id_student_id: { batch_id: req.params.id, student_id: req.params.studentId } }
    });
    return sendSuccess(res, { deleted: true });
  } catch (err: any) {
    if (err.code === 'P2025') return sendError(res, 'Waitlist entry not found.', 404);
    return sendError(res, err.message, 500);
  }
}

export async function listSubstitutes(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await prisma.batchSubstitute.findMany({
      where: { batch_id: req.params.id },
      include: {
        substituteTeacher: { include: { user: true } },
        originalTeacher: { include: { user: true } }
      },
      orderBy: { from_date: 'desc' }
    });
    return sendSuccess(res, rows);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createSubstitute(req: AuthenticatedRequest, res: Response) {
  try {
    const batchId = req.params.id;
    const { substituteTeacherId, fromDate, toDate, date, reason } = req.body;
    const start = fromDate || date;
    if (!substituteTeacherId || !start) {
      return sendError(res, 'Substitute teacher and from-date are required.', 400);
    }
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return sendError(res, 'Batch not found.', 404);
    const row = await prisma.batchSubstitute.create({
      data: {
        batch_id: batchId,
        original_teacher_id: batch.teacher_id,
        substitute_teacher_id: substituteTeacherId,
        from_date: start,
        to_date: toDate || start,
        reason: reason || null
      },
      include: { substituteTeacher: { include: { user: true } } }
    });
    if (req.user) await createAuditLog(req.user.userId, 'ASSIGN_SUBSTITUTE_TEACHER', 'Batch', batchId, { substituteTeacherId, fromDate: start, toDate: toDate || start });
    return sendSuccess(res, row, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function copyTimetableDay(req: AuthenticatedRequest, res: Response) {
  try {
    const { fromDay, toDays } = req.body as { fromDay?: string; toDays?: string[] };
    if (!fromDay || !Array.isArray(toDays) || toDays.length === 0) {
      return sendError(res, 'fromDay and toDays[] are required.', 400);
    }
    const source = await prisma.timetableSlot.findMany({
      where: { day: fromDay },
      include: { batch: true }
    });
    if (source.length === 0) {
      return sendError(res, `No slots on ${fromDay} to copy.`, 400);
    }

    const created: any[] = [];
    const skipped: string[] = [];
    for (const targetDay of toDays) {
      if (targetDay === fromDay) continue;
      const existing = await prisma.timetableSlot.findMany({ where: { day: targetDay } });
      for (const slot of source) {
        const clash = existing.find(ex => {
          const teacherClash = slot.teacher_id && ex.teacher_id === slot.teacher_id &&
            timeRangesOverlap(slot.start_time, slot.end_time, ex.start_time, ex.end_time);
          const roomClash = slot.room && ex.room &&
            slot.room.toLowerCase() === ex.room.toLowerCase() &&
            timeRangesOverlap(slot.start_time, slot.end_time, ex.start_time, ex.end_time);
          return Boolean(teacherClash || roomClash);
        });
        if (clash) {
          skipped.push(`${targetDay} ${slot.start_time} ${slot.batch?.name || ''}`.trim());
          continue;
        }
        const row = await prisma.timetableSlot.create({
          data: {
            day: targetDay,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room: slot.room,
            batch_id: slot.batch_id,
            subject_id: slot.subject_id,
            teacher_id: slot.teacher_id,
            topic: slot.topic
          }
        });
        created.push(row);
        existing.push(row as any);
      }
    }
    return sendSuccess(res, { createdCount: created.length, skippedCount: skipped.length, skipped });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
