import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { createAuditLog } from '../common/audit';
import { AuthenticatedRequest } from '../auth';
import { formatDateIso } from '../utils/billingUtils';
import { resolveSafeUserId } from '../utils/userResolver';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_WA_TEMPLATES = [
  { code: 'WA_WELCOME', name: 'Admission Welcome', body: 'Dear {parent_name}, {student_name} is admitted to {academy_name}. Admission No: {admission_no}.' },
  { code: 'WA_FEE_REMINDER', name: 'Monthly Fee Due Reminder', body: 'Dear {parent_name}, {student_name} fee for {month} = {currency} {amount}, due {due_date}. Please pay on time. – {academy_name}' },
  { code: 'WA_DEFAULTER', name: 'Overdue Fee Alert', body: 'Dear {parent_name}, {student_name} fee is {days_overdue} days overdue. Outstanding {currency} {balance}. Please clear immediately. – {academy_name}' },
  { code: 'WA_RECEIPT', name: 'Payment Receipt', body: 'Payment received: {currency} {amount} ({method}) for {student_name}. Receipt No: {receipt_no}. Remaining: {currency} {balance}. – {academy_name}' },
  { code: 'WA_ABSENT', name: 'Student Absence', body: '{student_name} was marked ABSENT on {date} ({batch_name}). – {academy_name}' },
  { code: 'WA_HOMEWORK', name: 'Homework Assigned', body: 'New homework for {batch_name}: {homework_title}, due {due_date}. – {academy_name}' }
];

function isCountablePayment(p: { voided_at?: Date | null; cleared_status?: string | null }) {
  return !p.voided_at && (p.cleared_status || 'cleared') === 'cleared';
}

function fillTemplate(body: string, vars: Record<string, string | number>) {
  let result = body || '';
  Object.keys(vars).forEach(key => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(vars[key] ?? ''));
  });
  return result;
}

function parseSettingValue(raw: string) {
  try { return JSON.parse(raw); } catch { return raw; }
}

async function readSettingsMap(): Promise<Record<string, any>> {
  const rows = await prisma.appSetting.findMany();
  const map: Record<string, any> = {};
  rows.forEach(s => { map[s.key] = parseSettingValue(s.value); });
  return map;
}

function monthBounds(isoDate: string) {
  const period = isoDate.slice(0, 7);
  const [y, m] = period.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { period, start, end };
}

function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(`${fromIso}T00:00:00.000Z`).getTime();
  const b = new Date(`${toIso}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

function parentFromStudent(student: any) {
  const link = student?.parentStudents?.[0];
  const parent = link?.parent;
  const custom = (student?.custom_fields || {}) as any;
  return {
    parentName: parent?.full_name || custom.parentName || '',
    phone: parent?.phone || student?.phone || ''
  };
}

export async function getDashboard(_req: AuthenticatedRequest, res: Response) {
  try {
    const todayStr = formatDateIso(new Date());
    const weekday = WEEKDAYS[new Date().getDay()];
    const { period, start: monthStart, end: monthEnd } = monthBounds(todayStr);

    // 1. Student Portal Dashboard Scoping
    if (_req.user?.role === 'student') {
      const studentId = _req.user.studentId;
      const userId = _req.user.userId;
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            studentId ? { id: studentId } : {},
            userId ? { user_id: userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        },
        include: {
          class: true,
          enrollments: {
            where: { status: 'active' },
            include: { batch: true }
          },
          feeInvoices: {
            include: { feePayments: true }
          }
        }
      });

      const sId = student?.id;
      const enrolledBatchIds = student?.enrollments.map((e) => e.batch_id) || [];

      // Personal attendance
      const attendanceRecords = sId
        ? await prisma.attendance.findMany({
            where: { student_id: sId },
            select: { status: true, date: true }
          })
        : [];

      const totalAttendance = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

      // Pending homework
      const pendingHomework = enrolledBatchIds.length > 0
        ? await prisma.homework.count({
            where: {
              batch_id: { in: enrolledBatchIds },
              due_date: { gte: todayStr }
            }
          })
        : 0;

      // Upcoming tests
      const tests = enrolledBatchIds.length > 0
        ? await prisma.test.findMany({
            where: {
              batch_id: { in: enrolledBatchIds },
              exam_date: { gte: todayStr }
            },
            include: { subject: true, batch: true },
            orderBy: { exam_date: 'asc' },
            take: 5
          })
        : [];

      // Student fees summary
      const totalInvoiced = (student?.feeInvoices || []).reduce((sum, inv) => sum + inv.net_amount, 0);
      const totalPaid = (student?.feeInvoices || []).reduce((sum, inv) => {
        return sum + inv.feePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);
      const pendingFee = Math.max(0, totalInvoiced - totalPaid);

      // Student today schedule
      const todaySchedule = enrolledBatchIds.length > 0
        ? await prisma.timetableSlot.findMany({
            where: {
              day: weekday,
              batch_id: { in: enrolledBatchIds }
            },
            include: { batch: true, subject: true, teacher: { include: { user: true } } },
            orderBy: { start_time: 'asc' }
          })
        : [];

      // Announcements
      const announcements = await prisma.announcement.findMany({
        where: { audience: { in: ['all', 'students'] } },
        orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }],
        take: 5
      });

      return sendSuccess(res, {
        role: 'student',
        overview: {
          attendanceRate,
          totalAttendance,
          presentCount,
          pendingHomework,
          upcomingTestsCount: tests.length,
          totalInvoiced,
          totalPaid,
          pendingFee,
          totalStudents: 1,
          totalTeachers: 0,
          totalBatches: enrolledBatchIds.length,
          todayAttendancePct: attendanceRate,
          totalCollected: totalPaid,
          totalPending: pendingFee,
          defaultersCount: 0
        },
        student: {
          id: student?.id,
          fullName: student?.full_name || _req.user.fullName,
          admissionNo: student?.admission_no,
          className: student?.class?.name,
          batches: student?.enrollments.map((e) => e.batch?.name).filter(Boolean)
        },
        todaySchedule: todaySchedule.map((s) => ({
          id: s.id,
          startTime: s.start_time,
          endTime: s.end_time,
          room: s.room,
          topic: s.topic,
          batchName: s.batch?.name || '',
          subjectName: s.subject?.name || '',
          teacherName: s.teacher?.user?.full_name || 'Instructor'
        })),
        upcomingTests: tests.map((t) => ({
          id: t.id,
          title: t.title,
          examDate: t.exam_date,
          batchName: t.batch?.name || '',
          subjectName: t.subject?.name || '',
          maxMarks: t.max_marks,
          passMarks: t.pass_marks
        })),
        recentAnnouncements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          pinned: a.pinned,
          createdAt: a.created_at
        }))
      });
    }

    // 2. Faculty / Teacher Dashboard Scoping
    if (_req.user?.role === 'teacher' || _req.user?.role === 'faculty') {
      let teacherId = _req.user.teacherId;
      if (!teacherId && _req.user.userId) {
        const t = await prisma.teacher.findUnique({ where: { user_id: _req.user.userId } });
        teacherId = t?.id;
      }

      const batches = teacherId
        ? await prisma.batch.findMany({
            where: {
              is_active: true,
              OR: [
                { teacher_id: teacherId },
                { batchSubjects: { some: { teacher_id: teacherId } } }
              ]
            },
            include: { class: true, _count: { select: { enrollments: true } } }
          })
        : [];

      const batchIds = batches.map((b) => b.id);
      const totalStudents = batches.reduce((sum, b) => sum + (b._count?.enrollments || 0), 0);

      const todayAttendance = batchIds.length > 0
        ? await prisma.attendance.findMany({
            where: { batch_id: { in: batchIds }, date: todayStr }
          })
        : [];

      const markedBatchIds = new Set(todayAttendance.map((a) => a.batch_id));
      const pendingAttendanceBatches = batches.filter((b) => !markedBatchIds.has(b.id));

      const todaySlots = teacherId
        ? await prisma.timetableSlot.findMany({
            where: {
              day: weekday,
              OR: [
                { teacher_id: teacherId },
                { batch_id: { in: batchIds } }
              ]
            },
            include: { batch: true, subject: true, teacher: { include: { user: true } } },
            orderBy: { start_time: 'asc' }
          })
        : [];

      const upcomingTests = batchIds.length > 0
        ? await prisma.test.findMany({
            where: { batch_id: { in: batchIds }, exam_date: { gte: todayStr } },
            include: {
              batch: { select: { name: true, _count: { select: { enrollments: true } } } },
              subject: { select: { name: true } },
              testMarks: { where: { status: 'scored' }, select: { student_id: true } }
            },
            orderBy: { exam_date: 'asc' },
            take: 10
          })
        : [];

      const announcements = await prisma.announcement.findMany({
        where: { audience: { in: ['all', 'teachers', 'staff'] } },
        orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }],
        take: 5
      });

      return sendSuccess(res, {
        role: 'teacher',
        overview: {
          totalBatches: batches.length,
          totalStudents,
          totalTeachers: 1,
          todayClasses: todaySlots.length,
          pendingAttendanceCount: pendingAttendanceBatches.length,
          upcomingTestsCount: upcomingTests.length,
          todayAttendancePct: batches.length > 0 ? Math.round((markedBatchIds.size / batches.length) * 100) : 100,
          totalCollected: 0,
          totalPending: 0,
          defaultersCount: 0
        },
        teacher: {
          id: teacherId,
          fullName: _req.user.fullName
        },
        batches: batches.map((b) => ({ id: b.id, name: b.name, studentsCount: b._count?.enrollments || 0 })),
        todaySchedule: todaySlots.map((s) => ({
          id: s.id,
          startTime: s.start_time,
          endTime: s.end_time,
          room: s.room,
          topic: s.topic,
          batchName: s.batch?.name || '',
          subjectName: s.subject?.name || '',
          teacherName: s.teacher?.user?.full_name || _req.user?.fullName || 'Teacher'
        })),
        unmarkedAttendance: pendingAttendanceBatches.map((b) => ({
          batchId: b.id,
          batchName: b.name,
          enrolled: b._count?.enrollments || 0
        })),
        testsWithoutMarks: upcomingTests.map((t) => ({
          id: t.id,
          title: t.title,
          examDate: t.exam_date,
          batchName: t.batch?.name || '',
          subjectName: t.subject?.name || '',
          roster: t.batch?._count?.enrollments || 0,
          scored: t.testMarks.length
        })),
        recentAnnouncements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          pinned: a.pinned,
          createdAt: a.created_at
        }))
      });
    }

    // 3. Admin Full Institutional Dashboard
    const settings = await readSettingsMap();

    const [
      totalStudents,
      totalTeachers,
      totalBatches,
      collectedAgg,
      monthCollectedAgg,
      invoiceNetAgg,
      todayAttendance,
      overdueInvoices,
      slots,
      followUps,
      activeBatches,
      upcomingTests,
      monthExpensesAgg,
      recentAnnouncements,
      recentInquiries
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'active' } }),
      prisma.teacher.count(),
      prisma.batch.count({ where: { is_active: true } }),
      prisma.feePayment.aggregate({
        where: { voided_at: null, cleared_status: 'cleared' },
        _sum: { amount: true }
      }),
      prisma.feePayment.aggregate({
        where: {
          voided_at: null,
          cleared_status: 'cleared',
          paid_at: { gte: monthStart, lt: monthEnd }
        },
        _sum: { amount: true }
      }),
      prisma.feeInvoice.aggregate({ _sum: { net_amount: true } }),
      prisma.attendance.findMany({ where: { date: todayStr }, select: { batch_id: true, status: true } }),
      prisma.feeInvoice.findMany({
        where: {
          status: { in: ['unpaid', 'partial', 'overdue'] },
          due_date: { lt: todayStr }
        },
        distinct: ['student_id'],
        select: { student_id: true }
      }),
      prisma.timetableSlot.findMany({
        where: { day: weekday },
        include: {
          batch: { select: { id: true, name: true } },
          subject: { select: { name: true } },
          teacher: { include: { user: { select: { full_name: true } } } },
          exceptions: { where: { date: todayStr }, select: { type: true } }
        }
      }),
      prisma.inquiry.findMany({
        where: {
          status: { notIn: ['converted', 'lost'] },
          AND: [
            { follow_up_on: { not: null } },
            { follow_up_on: { not: '' } },
            { follow_up_on: { lte: todayStr } }
          ]
        },
        orderBy: { follow_up_on: 'asc' },
        take: 12
      }),
      prisma.batch.findMany({
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          _count: { select: { enrollments: true } }
        }
      }),
      prisma.test.findMany({
        where: { exam_date: { gte: todayStr } },
        include: {
          batch: { select: { name: true, _count: { select: { enrollments: true } } } },
          subject: { select: { name: true } },
          testMarks: { where: { status: 'scored' }, select: { student_id: true } }
        },
        orderBy: { exam_date: 'asc' },
        take: 20
      }),
      prisma.expense.aggregate({
        where: { month_period: period },
        _sum: { amount: true }
      }),
      prisma.announcement.findMany({
        orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }],
        take: 4
      }),
      prisma.inquiry.findMany({
        where: { status: { notIn: ['converted', 'lost'] } },
        orderBy: { created_at: 'desc' },
        take: 8
      })
    ]);

    const totalCollected = collectedAgg._sum.amount || 0;
    const monthCollected = monthCollectedAgg._sum.amount || 0;
    const monthExpenses = monthExpensesAgg._sum.amount || 0;
    const totalPending = Math.max(0, (invoiceNetAgg._sum.net_amount || 0) - totalCollected);

    const presentish = todayAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
    const todayAttendancePct = todayAttendance.length > 0
      ? Math.round((presentish / todayAttendance.length) * 100)
      : 0;

    const todaySchedule = slots
      .filter(s => !s.exceptions.some(e => e.type === 'cancelled'))
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      .map(s => ({
        id: s.id,
        startTime: s.start_time,
        endTime: s.end_time,
        room: s.room,
        topic: s.topic,
        batchId: s.batch_id,
        batchName: s.batch?.name || '',
        subjectName: s.subject?.name || '',
        teacherName: s.teacher?.user?.full_name || 'Unassigned',
        substituted: s.exceptions.some(e => e.type === 'substituted')
      }));

    const markedBatchIds = new Set(todayAttendance.map(a => a.batch_id));
    const liveSlotBatchIds = new Set(todaySchedule.map(s => s.batchId));
    const candidateBatches = liveSlotBatchIds.size > 0
      ? activeBatches.filter(b => liveSlotBatchIds.has(b.id))
      : activeBatches;
    const unmarkedAttendance = candidateBatches
      .filter(b => b._count.enrollments > 0 && !markedBatchIds.has(b.id))
      .map(b => ({
        batchId: b.id,
        batchName: b.name,
        enrolled: b._count.enrollments
      }));

    const testsWithoutMarks = upcomingTests
      .map(t => {
        const roster = t.batch?._count?.enrollments || 0;
        const scored = t.testMarks.length;
        return {
          id: t.id,
          title: t.title,
          examDate: t.exam_date,
          batchName: t.batch?.name || '',
          subjectName: t.subject?.name || '',
          roster,
          scored,
          published: t.is_published
        };
      })
      .filter(t => t.roster > 0 && t.scored < t.roster)
      .slice(0, 8);

    const monthLabel = new Date(`${period}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return sendSuccess(res, {
      overview: {
        totalStudents,
        totalTeachers,
        totalBatches,
        todayAttendancePct,
        todayMarked: todayAttendance.length,
        todayPresent: presentish,
        totalCollected,
        totalPending,
        defaultersCount: overdueInvoices.length,
        monthCollected,
        monthExpenses,
        monthPnL: monthCollected - monthExpenses,
        monthPeriod: period,
        monthLabel,
        sessionLabel: settings.academicSession || '',
        academyName: settings.academyName || '',
        currencySymbol: settings.currencySymbol || 'Rs'
      },
      todaySchedule,
      followUpsDue: followUps.map(i => ({
        id: i.id,
        name: i.name,
        phone: i.phone,
        classInterest: i.class_interest,
        status: i.status,
        followUpOn: i.follow_up_on,
        parentName: i.parent_name
      })),
      unmarkedAttendance,
      testsWithoutMarks,
      recentAnnouncements: recentAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        audience: a.audience,
        pinned: a.pinned,
        urgent: a.urgent,
        createdAt: a.created_at
      })),
      recentInquiries: recentInquiries.map(i => ({
        id: i.id,
        name: i.name,
        classInterest: i.class_interest,
        status: i.status,
        phone: i.phone
      })),
      actionItems: {
        unmarkedCount: unmarkedAttendance.length,
        followUpsDue: followUps.length,
        testsWithoutMarks: testsWithoutMarks.length,
        defaulters: overdueInvoices.length
      }
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

function mapAnnouncement(row: any) {
  return {
    ...row,
    content: row.body,
    targetAudience: row.audience,
    urgent: row.urgent,
    pinned: row.pinned,
    scheduledFor: row.scheduled_for
  };
}

export async function listAnnouncements(_req: AuthenticatedRequest, res: Response) {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }]
    });
    return sendSuccess(res, list.map(mapAnnouncement));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

async function notifyAdmins(title: string, body: string, refId: string) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'super_admin'] }, is_active: true },
    select: { id: true }
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map(u => ({
      user_id: u.id,
      type: 'announcement',
      title,
      body: (body || '').slice(0, 280),
      ref_type: 'Announcement',
      ref_id: refId
    }))
  });
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.content || req.body.body || '').trim();
    if (!title || !body) return sendError(res, 'Title and content are required.', 400);

    const audience = String(req.body.targetAudience || req.body.audience || 'all').toLowerCase();
    const scheduledRaw = req.body.scheduledFor || req.body.scheduled_for;
    const scheduledFor = scheduledRaw ? new Date(scheduledRaw) : null;
    const createdBy = (await resolveSafeUserId(req.user?.userId)) || 'admin';

    const ann = await prisma.announcement.create({
      data: {
        title,
        body,
        audience,
        batch_id: req.body.batchId || req.body.batch_id || null,
        pinned: Boolean(req.body.pinned),
        urgent: Boolean(req.body.urgent),
        scheduled_for: scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor : null,
        created_by: createdBy
      }
    });

    const isFuture = ann.scheduled_for && ann.scheduled_for.getTime() > Date.now();
    if (!isFuture) {
      await notifyAdmins(ann.urgent ? `Urgent: ${ann.title}` : ann.title, ann.body, ann.id);
    }
    if (req.user) await createAuditLog(req.user.userId, 'CREATE_ANNOUNCEMENT', 'Announcement', ann.id, { title, audience });
    return sendSuccess(res, mapAnnouncement(ann), null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Announcement not found.', 404);

    const scheduledRaw = req.body.scheduledFor !== undefined ? req.body.scheduledFor : req.body.scheduled_for;
    let scheduledFor = undefined as Date | null | undefined;
    if (scheduledRaw === null || scheduledRaw === '') scheduledFor = null;
    else if (scheduledRaw) {
      const d = new Date(scheduledRaw);
      scheduledFor = Number.isNaN(d.getTime()) ? undefined : d;
    }

    const ann = await prisma.announcement.update({
      where: { id: existing.id },
      data: {
        ...(req.body.title !== undefined && { title: String(req.body.title).trim() }),
        ...((req.body.content !== undefined || req.body.body !== undefined) && {
          body: String(req.body.content || req.body.body || '').trim()
        }),
        ...((req.body.targetAudience !== undefined || req.body.audience !== undefined) && {
          audience: String(req.body.targetAudience || req.body.audience || existing.audience).toLowerCase()
        }),
        ...(req.body.pinned !== undefined && { pinned: Boolean(req.body.pinned) }),
        ...(req.body.urgent !== undefined && { urgent: Boolean(req.body.urgent) }),
        ...(scheduledFor !== undefined && { scheduled_for: scheduledFor }),
        ...(req.body.batchId !== undefined && { batch_id: req.body.batchId || null })
      }
    });
    if (req.user) await createAuditLog(req.user.userId, 'UPDATE_ANNOUNCEMENT', 'Announcement', ann.id, req.body);
    return sendSuccess(res, mapAnnouncement(ann));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Announcement not found.', 404);
    await prisma.announcement.delete({ where: { id: existing.id } });
    if (req.user) await createAuditLog(req.user.userId, 'DELETE_ANNOUNCEMENT', 'Announcement', existing.id, { title: existing.title });
    return sendSuccess(res, { deleted: true, id: existing.id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function listWhatsAppTemplates(_req: AuthenticatedRequest, res: Response) {
  try {
    let templates = await prisma.whatsAppTemplate.findMany({ orderBy: { updated_at: 'desc' } });
    const existing = new Set(templates.map(t => t.code));
    const missing = DEFAULT_WA_TEMPLATES.filter(t => !existing.has(t.code));
    if (missing.length > 0) {
      await prisma.whatsAppTemplate.createMany({ data: missing });
      templates = await prisma.whatsAppTemplate.findMany({ orderBy: { updated_at: 'desc' } });
    }
    return sendSuccess(res, templates);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function upsertWhatsAppTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const { code } = req.params;
    const { body, name, is_enabled, is_active } = req.body;
    const activeVal = is_enabled !== undefined ? Boolean(is_enabled) : (is_active !== undefined ? Boolean(is_active) : true);
    const updated = await prisma.whatsAppTemplate.upsert({
      where: { code },
      update: {
        ...(body && { body }),
        ...(name && { name }),
        is_enabled: activeVal
      },
      create: {
        code,
        name: name || code,
        body: body || '',
        is_enabled: activeVal
      }
    });
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function listWhatsAppLogs(_req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await prisma.whatsAppLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 100
    });
    const studentIds = Array.from(new Set(logs.map(l => l.student_id).filter(Boolean))) as string[];
    const students = studentIds.length
      ? await prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, full_name: true } })
      : [];
    const byId = new Map(students.map(s => [s.id, s.full_name]));
    return sendSuccess(res, logs.map(l => ({
      ...l,
      studentName: (l.student_id && byId.get(l.student_id)) || null,
      template_name: l.template_code,
      message: l.body_snapshot,
      body: l.body_snapshot
    })));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function sendWhatsApp(req: AuthenticatedRequest, res: Response) {
  try {
    const phone = String(req.body.phone || '').trim();
    const body = String(req.body.body || req.body.message || '').trim();
    if (!phone) return sendError(res, 'A phone number is required to open WhatsApp.', 400);
    if (!body) return sendError(res, 'Message body is required.', 400);

    const log = await prisma.whatsAppLog.create({
      data: {
        phone,
        body_snapshot: body,
        status: 'manual_opened',
        template_code: req.body.templateCode || req.body.template_code || 'MANUAL',
        student_id: req.body.studentId || req.body.student_id || null
      }
    });
    return sendSuccess(res, log, 'Logged. Open the wa.me link to send from your WhatsApp.');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

async function academyVars() {
  const settings = await readSettingsMap();
  return {
    academy_name: settings.academyName || 'Academy',
    currency: settings.currencySymbol || 'Rs'
  };
}

async function varsForStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parentStudents: { include: { parent: true } },
      enrollments: { where: { status: 'active' }, include: { batch: true } },
      feeInvoices: { include: { feePayments: true } },
      feePlan: true
    }
  });
  if (!student) return null;
  const todayStr = formatDateIso(new Date());
  const { parentName, phone } = parentFromStudent(student);
  const openInvoices = student.feeInvoices.filter(i => ['unpaid', 'partial', 'overdue'].includes(i.status));
  const nextDue = openInvoices.map(i => i.due_date).filter(Boolean).sort()[0] || '';
  const balance = openInvoices.reduce((sum, inv) => {
    const paid = (inv.feePayments || []).filter(isCountablePayment).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, inv.net_amount - paid);
  }, 0);
  const daysOverdue = nextDue && nextDue < todayStr ? daysBetween(nextDue, todayStr) : 0;
  const batch = student.enrollments[0]?.batch;
  const academy = await academyVars();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return {
    student,
    phone,
    vars: {
      ...academy,
      parent_name: parentName || 'Parent / Guardian',
      student_name: student.full_name,
      admission_no: student.admission_no,
      phone,
      month: monthLabel,
      amount: Math.round(balance).toLocaleString('en-US'),
      balance: Math.round(balance).toLocaleString('en-US'),
      due_date: nextDue || '—',
      days_overdue: String(daysOverdue),
      batch_name: batch?.name || '',
      class_name: batch?.name || '',
      date: todayStr
    }
  };
}

export async function previewWhatsApp(req: AuthenticatedRequest, res: Response) {
  try {
    const templateCode = String(req.query.templateCode || req.body.templateCode || 'WA_FEE_REMINDER');
    const studentId = String(req.query.studentId || req.body.studentId || '');
    const inquiryId = String(req.query.inquiryId || req.body.inquiryId || '');
    const tmpl = await prisma.whatsAppTemplate.findUnique({ where: { code: templateCode } })
      || DEFAULT_WA_TEMPLATES.find(t => t.code === templateCode);
    if (!tmpl) return sendError(res, 'Unknown template.', 404);

    if (studentId) {
      const filled = await varsForStudent(studentId);
      if (!filled) return sendError(res, 'Student not found.', 404);
      return sendSuccess(res, {
        templateCode,
        phone: filled.phone,
        studentName: filled.student.full_name,
        body: fillTemplate(tmpl.body, filled.vars),
        vars: filled.vars
      });
    }

    if (inquiryId) {
      const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
      if (!inquiry) return sendError(res, 'Inquiry not found.', 404);
      const academy = await academyVars();
      const vars = {
        ...academy,
        parent_name: inquiry.parent_name || 'Parent / Guardian',
        student_name: inquiry.name,
        phone: inquiry.phone,
        class_name: inquiry.class_interest || '',
        batch_name: inquiry.class_interest || '',
        date: formatDateIso(new Date())
      };
      return sendSuccess(res, {
        templateCode,
        phone: inquiry.phone,
        studentName: inquiry.name,
        body: fillTemplate(tmpl.body, vars),
        vars
      });
    }

    return sendError(res, 'Pick a student or an inquiry to fill the template.', 400);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function dispatchAbsenceAlerts(req: AuthenticatedRequest, res: Response) {
  try {
    const todayStr = formatDateIso(new Date());
    const tmpl = await prisma.whatsAppTemplate.findUnique({ where: { code: 'WA_ABSENT' } });
    const bodyTpl = tmpl?.body || DEFAULT_WA_TEMPLATES.find(t => t.code === 'WA_ABSENT')!.body;
    const academy = await academyVars();

    const absences = await prisma.attendance.findMany({
      where: { date: todayStr, status: 'absent' },
      include: {
        student: { include: { parentStudents: { include: { parent: true } } } },
        batch: true
      }
    });

    const dispatched = [];
    for (const att of absences) {
      const { parentName, phone } = parentFromStudent(att.student);
      const vars = {
        ...academy,
        parent_name: parentName || 'Parent / Guardian',
        student_name: att.student.full_name,
        date: todayStr,
        batch_name: att.batch?.name || 'Class'
      };
      const messageBody = fillTemplate(bodyTpl, vars);
      const log = await prisma.whatsAppLog.create({
        data: {
          phone,
          body_snapshot: messageBody,
          status: phone ? 'queued' : 'failed',
          template_code: 'WA_ABSENT',
          student_id: att.student.id
        }
      });
      dispatched.push({
        studentId: att.student.id,
        studentName: att.student.full_name,
        phone,
        parentName,
        messageBody,
        logId: log.id,
        waLink: phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(messageBody)}` : null
      });
    }

    return sendSuccess(res, {
      totalAbsences: absences.length,
      dispatchedCount: dispatched.length,
      alerts: dispatched
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function dispatchFeeReminders(_req: AuthenticatedRequest, res: Response) {
  try {
    const todayStr = formatDateIso(new Date());
    const reminderTpl = (await prisma.whatsAppTemplate.findUnique({ where: { code: 'WA_FEE_REMINDER' } }))?.body
      || DEFAULT_WA_TEMPLATES.find(t => t.code === 'WA_FEE_REMINDER')!.body;
    const defaulterTpl = (await prisma.whatsAppTemplate.findUnique({ where: { code: 'WA_DEFAULTER' } }))?.body
      || DEFAULT_WA_TEMPLATES.find(t => t.code === 'WA_DEFAULTER')!.body;
    const academy = await academyVars();
    const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const invoices = await prisma.feeInvoice.findMany({
      where: { status: { in: ['unpaid', 'partial', 'overdue'] } },
      include: {
        student: { include: { parentStudents: { include: { parent: true } } } },
        feePayments: true
      }
    });

    const byStudent = new Map<string, { student: any; balance: number; dueDate: string }>();
    for (const inv of invoices) {
      const paid = (inv.feePayments || []).filter(isCountablePayment).reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, inv.net_amount - paid);
      if (remaining <= 0) continue;
      const prev = byStudent.get(inv.student_id);
      if (!prev) {
        byStudent.set(inv.student_id, { student: inv.student, balance: remaining, dueDate: inv.due_date });
      } else {
        prev.balance += remaining;
        if (inv.due_date && (!prev.dueDate || inv.due_date < prev.dueDate)) prev.dueDate = inv.due_date;
      }
    }

    const alerts = [];
    for (const { student, balance, dueDate } of byStudent.values()) {
      const { parentName, phone } = parentFromStudent(student);
      const daysOverdue = dueDate && dueDate < todayStr ? daysBetween(dueDate, todayStr) : 0;
      const vars = {
        ...academy,
        parent_name: parentName || 'Parent / Guardian',
        student_name: student.full_name,
        month: monthLabel,
        amount: Math.round(balance).toLocaleString('en-US'),
        balance: Math.round(balance).toLocaleString('en-US'),
        due_date: dueDate || '—',
        days_overdue: String(daysOverdue)
      };
      const templateCode = daysOverdue > 0 ? 'WA_DEFAULTER' : 'WA_FEE_REMINDER';
      const messageBody = fillTemplate(templateCode === 'WA_DEFAULTER' ? defaulterTpl : reminderTpl, vars);
      const log = await prisma.whatsAppLog.create({
        data: {
          phone,
          body_snapshot: messageBody,
          status: phone ? 'queued' : 'failed',
          template_code: templateCode,
          student_id: student.id
        }
      });
      alerts.push({
        studentId: student.id,
        studentName: student.full_name,
        phone,
        parentName,
        balance,
        dueDate,
        daysOverdue,
        templateCode,
        messageBody,
        logId: log.id,
        waLink: phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(messageBody)}` : null
      });
    }

    alerts.sort((a, b) => b.daysOverdue - a.daysOverdue || b.balance - a.balance);
    return sendSuccess(res, {
      defaulterCount: alerts.filter(a => a.daysOverdue > 0).length,
      dueCount: alerts.length,
      alerts
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
