import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { createAuditLog } from '../common/audit';
import { AuthenticatedRequest } from '../auth';
import { formatDateIso } from '../utils/billingUtils';

export async function listHomework(_req: AuthenticatedRequest, res: Response) {
  try {
    const list = await prisma.homework.findMany({
      include: {
        batch: true,
        subject: true,
        teacher: { include: { user: true } },
        submissions: true
      },
      orderBy: { created_at: 'desc' }
    });
    const today = formatDateIso(new Date());
    const mapped = list.map(hw => {
      const done = hw.submissions.filter(s => s.status === 'done' || s.status === 'submitted').length;
      return {
        ...hw,
        doneCount: done,
        totalSubmissions: hw.submissions.length,
        isOverdue: hw.due_date < today
      };
    });
    return sendSuccess(res, mapped);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getHomeworkRoster(req: AuthenticatedRequest, res: Response) {
  try {
    const hw = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!hw) return sendError(res, 'Homework not found.', 404);
    const enrollments = await prisma.enrollment.findMany({
      where: { batch_id: hw.batch_id, status: 'active' },
      include: { student: true }
    });
    const existing = await prisma.homeworkSubmission.findMany({ where: { homework_id: hw.id } });
    const byStudent = new Map(existing.map(s => [s.student_id, s]));
    const today = formatDateIso(new Date());
    const roster = enrollments
      .filter(e => (e.student.status || '').toLowerCase() !== 'left')
      .map(e => {
        const row = byStudent.get(e.student_id);
        let status = row?.status || 'pending';
        if (!row && hw.due_date < today) status = 'late';
        if (row?.status === 'pending' && hw.due_date < today) status = 'late';
        return {
          studentId: e.student_id,
          student: e.student,
          status,
          note: row?.note || null,
          submittedAt: row?.submitted_at || null
        };
      });
    return sendSuccess(res, { homework: hw, roster, doneCount: roster.filter(r => r.status === 'done' || r.status === 'submitted').length });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function saveHomeworkRoster(req: AuthenticatedRequest, res: Response) {
  try {
    const homeworkId = req.params.id;
    const hw = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) return sendError(res, 'Homework not found.', 404);
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const results = [];
    for (const entry of entries) {
      const studentId = entry.studentId || entry.student_id;
      if (!studentId) continue;
      const status = entry.status || 'pending';
      const row = await prisma.homeworkSubmission.upsert({
        where: { homework_id_student_id: { homework_id: homeworkId, student_id: studentId } },
        update: {
          status,
          note: entry.note || null,
          submitted_at: ['done', 'submitted', 'late'].includes(status) ? new Date() : null
        },
        create: {
          homework_id: homeworkId,
          student_id: studentId,
          status,
          note: entry.note || null,
          submitted_at: ['done', 'submitted', 'late'].includes(status) ? new Date() : null
        }
      });
      results.push(row);
    }
    return sendSuccess(res, results);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getTestRoster(req: AuthenticatedRequest, res: Response) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { testMarks: true, batch: true, subject: true }
    });
    if (!test) return sendError(res, 'Test not found.', 404);
    const enrollments = await prisma.enrollment.findMany({
      where: { batch_id: test.batch_id, status: 'active' },
      include: { student: true }
    });
    const marksByStudent = new Map(test.testMarks.map(m => [m.student_id, m]));
    const roster = enrollments
      .filter(e => {
        const st = (e.student.status || '').toLowerCase();
        return st !== 'left';
      })
      .map(e => {
        const mark = marksByStudent.get(e.student_id);
        return {
          studentId: e.student_id,
          student: e.student,
          marks: mark?.marks ?? null,
          remark: mark?.remark || '',
          status: mark?.status || (mark ? 'scored' : '')
        };
      });
    return sendSuccess(res, { test, roster });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function saveTestMarksGuarded(req: AuthenticatedRequest, res: Response) {
  try {
    const test = await prisma.test.findUnique({ where: { id: req.params.id } });
    if (!test) return sendError(res, 'Test not found.', 404);
    if (test.is_published) {
      return sendError(res, 'This test is published. Unpublish it before editing marks.', 409);
    }

    // IDOR Faculty Boundary Check (HIGH-01)
    const isTeacherRole = req.user?.role === 'teacher' || req.user?.role === 'faculty';
    const isGlobal = (req as any).modulePermission?.isGlobalScope || req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (isTeacherRole && !isGlobal && req.user) {
      let teacherId = req.user.teacherId;
      if (!teacherId && req.user.userId) {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.userId } });
        teacherId = teacher?.id;
      }
      if (teacherId) {
        const isAssigned =
          (await prisma.batch.findFirst({
            where: { id: test.batch_id, teacher_id: teacherId }
          })) ||
          (await prisma.batchSubject.findFirst({
            where: { batch_id: test.batch_id, teacher_id: teacherId }
          }));
        if (!isAssigned) {
          return sendError(res, 'Faculty cannot modify test marks for batches assigned to other teachers', 403);
        }
      } else {
        return sendError(res, 'Faculty cannot modify test marks for batches assigned to other teachers', 403);
      }
    }
    const marks = Array.isArray(req.body.marks) ? req.body.marks : [];
    const results = [];
    for (const m of marks) {
      const studentId = m.studentId || m.student_id;
      if (!studentId) continue;
      const status = m.status || 'scored';
      const score = status === 'absent' || status === 'exempt' ? 0 : Number(m.marks);
      if (status === 'scored') {
        if (Number.isNaN(score) || score < 0 || score > test.max_marks) {
          return sendError(res, `Marks for a student must be between 0 and ${test.max_marks}.`, 400);
        }
      }
      const entry = await prisma.testMark.upsert({
        where: { test_id_student_id: { test_id: test.id, student_id: studentId } },
        update: { marks: score, remark: m.remark || null, status },
        create: { test_id: test.id, student_id: studentId, marks: score, remark: m.remark || null, status }
      });
      results.push(entry);
    }
    return sendSuccess(res, results);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function decideLeave(req: AuthenticatedRequest, res: Response) {
  try {
    const status = String(req.body.status || '');
    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, 'status must be approved or rejected.', 400);
    }
    const existing = await prisma.leave.findUnique({ where: { id: req.params.id }, include: { student: true } });
    if (!existing) return sendError(res, 'Leave not found.', 404);

    if (status === 'approved') {
      const overlap = await prisma.leave.findFirst({
        where: {
          id: { not: existing.id },
          student_id: existing.student_id,
          status: 'approved',
          from_date: { lte: existing.to_date },
          to_date: { gte: existing.from_date }
        }
      });
      if (overlap) {
        return sendError(res, 'This student already has approved leave overlapping these dates.', 409);
      }
      const enrollments = await prisma.enrollment.findMany({
        where: { student_id: existing.student_id, status: 'active' }
      });
      const dates: string[] = [];
      const start = new Date(existing.from_date);
      const end = new Date(existing.to_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
      for (const enr of enrollments) {
        for (const date of dates) {
          await prisma.attendance.upsert({
            where: {
              batch_id_student_id_date: {
                batch_id: enr.batch_id,
                student_id: existing.student_id,
                date
              }
            },
            update: { status: 'leave', remark: existing.reason },
            create: {
              batch_id: enr.batch_id,
              student_id: existing.student_id,
              date,
              status: 'leave',
              remark: existing.reason,
              marked_by: req.user?.userId || 'admin'
            }
          });
        }
      }
    }

    const leave = await prisma.leave.update({
      where: { id: existing.id },
      data: {
        status,
        decided_by: req.user?.userId || 'admin',
        decided_at: new Date()
      },
      include: { student: true }
    });
    if (req.user) await createAuditLog(req.user.userId, 'UPDATE_LEAVE_STATUS', 'Leave', leave.id, { status });
    return sendSuccess(res, leave);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

function isHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function resolveMaterialTeacher(batchId: string, subjectId?: string, teacherId?: string) {
  if (teacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } });
    if (t) return t.id;
  }
  const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { teacher_id: true } });
  if (batch?.teacher_id) return batch.teacher_id;
  if (subjectId) {
    const assigned = await prisma.batchSubject.findUnique({
      where: { batch_id_subject_id: { batch_id: batchId, subject_id: subjectId } },
      select: { teacher_id: true }
    });
    if (assigned?.teacher_id) return assigned.teacher_id;
  }
  const any = await prisma.batchSubject.findFirst({ where: { batch_id: batchId }, select: { teacher_id: true } });
  return any?.teacher_id || null;
}

export async function createStudyMaterial(req: AuthenticatedRequest, res: Response) {
  try {
    const { batchId, subjectId, teacherId, title, fileUrl } = req.body;
    if (!batchId || !subjectId || !title) {
      return sendError(res, 'Batch, subject, and title are required.', 400);
    }
    const url = String(fileUrl || '').trim();
    if (!url || !isHttpUrl(url)) {
      return sendError(res, 'A real http(s) file or Drive link is required.', 400);
    }
    const resolvedTeacher = await resolveMaterialTeacher(batchId, subjectId, teacherId);
    if (!resolvedTeacher) {
      return sendError(res, 'Assign a teacher to this batch (or the subject) before uploading notes.', 400);
    }
    const sm = await prisma.studyMaterial.create({
      data: {
        batch_id: batchId,
        subject_id: subjectId,
        teacher_id: resolvedTeacher,
        title: String(title).trim(),
        file_url: url
      },
      include: { batch: true, subject: true, teacher: { include: { user: true } } }
    });
    if (req.user) await createAuditLog(req.user.userId, 'CREATE_STUDY_MATERIAL', 'StudyMaterial', sm.id, { title, batchId });
    return sendSuccess(res, sm, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteStudyMaterial(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await prisma.studyMaterial.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Study material not found.', 404);
    await prisma.studyMaterial.delete({ where: { id: existing.id } });
    if (req.user) await createAuditLog(req.user.userId, 'DELETE_STUDY_MATERIAL', 'StudyMaterial', existing.id, { title: existing.title });
    return sendSuccess(res, { deleted: true, id: existing.id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
