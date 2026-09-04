import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { formatDateIso } from '../utils/billingUtils';

function mapLog(l: any) {
  return {
    id: l.id,
    studentId: l.student_id,
    studentName: l.student?.full_name || '',
    admissionNo: l.student?.admission_no || '',
    batchId: l.batch_id,
    batchName: l.batch?.name || '',
    authorId: l.author_id,
    authorName: l.author_name,
    authorRole: l.author_role,
    category: l.category,
    severity: l.severity,
    title: l.title,
    remark: l.remark,
    isConfidential: l.is_confidential,
    createdAt: l.created_at,
    updatedAt: l.updated_at
  };
}

export async function listConductDesk(req: AuthenticatedRequest, res: Response) {
  try {
    const { q, category, severity, studentId } = req.query as Record<string, string | undefined>;
    const isRestricted = req.user?.role === 'student' || req.user?.role === 'parent';
    const where: any = { is_deleted: false };
    if (isRestricted) where.is_confidential = false;
    if (category && category !== 'all') where.category = category;
    if (severity && severity !== 'all') where.severity = severity;
    if (studentId) where.student_id = studentId;
    if (q && q.trim()) {
      where.OR = [
        { remark: { contains: q.trim(), mode: 'insensitive' } },
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { student: { full_name: { contains: q.trim(), mode: 'insensitive' } } },
        { student: { admission_no: { contains: q.trim(), mode: 'insensitive' } } }
      ];
    }

    const monthStart = formatDateIso(new Date()).slice(0, 7) + '-01';
    const [logs, monthLogs] = await Promise.all([
      prisma.conductLog.findMany({
        where,
        include: {
          student: { select: { id: true, full_name: true, admission_no: true } },
          batch: { select: { id: true, name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 200
      }),
      prisma.conductLog.findMany({
        where: { is_deleted: false, created_at: { gte: new Date(`${monthStart}T00:00:00.000Z`) } },
        select: { category: true, severity: true }
      })
    ]);

    const summary = {
      thisMonth: monthLogs.length,
      commendations: monthLogs.filter(l => l.category === 'commendation').length,
      infractions: monthLogs.filter(l => l.category === 'infraction').length,
      critical: monthLogs.filter(l => l.severity === 'critical').length
    };

    return sendSuccess(res, { logs: logs.map(mapLog), summary });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
