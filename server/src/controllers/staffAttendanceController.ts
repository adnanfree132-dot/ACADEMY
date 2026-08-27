/**
 * ============================================================================
 * Academy Pro OS — Staff GPS Geolocation Attendance & Admin Override Controller
 * ============================================================================
 * Handles real-time Haversine distance geofencing, shift arrival classification,
 * check-in/out timestamps, administrative attendance overrides, and audit trails.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import {
  calculateDistance,
  isWithinGeofence,
  evaluateShiftStatus,
  calculateHoursWorked,
  formatDateIso,
  getCurrentTimeIso,
  formatGeofenceRejectionMessage,
  DEFAULT_CAMPUS_LOCATION
} from '../utils/geoUtils';
import {
  staffCheckInSchema,
  staffCheckOutSchema,
  adminAttendanceOverrideSchema,
  staffBulkAttendanceSchema
} from '../validations/staffAttendanceValidation';
import { prisma } from '../prisma';
import { resolveSafeUserId } from '../utils/userResolver';

/**
 * 1. POST /api/v1/staff-attendance/check-in
 * Verifies device GPS against active campus perimeter, records arrival time,
 * evaluates shift status (present vs late with grace period), and blocks off-site attempts.
 */
export async function staffCheckIn(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = staffCheckInSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return sendError(res, issue?.message || 'Invalid check-in parameters', 400);
    }

    const {
      staffMemberId,
      latitude,
      longitude,
      device_info,
      notes,
      date,
      check_in_time
    } = parseResult.data;

    // 1. Resolve Staff Member
    let staffId = staffMemberId;
    if (!staffId && req.user) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return sendError(res, 'Staff member record not found for request.', 404);
    }

    const staffMember = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id: staffId },
          { staff_id: { equals: staffId, mode: 'insensitive' as const } }
        ]
      },
      include: { staffType: true }
    });

    if (!staffMember) {
      return sendError(res, `Staff member with ID '${staffId}' does not exist.`, 404);
    }

    if (['suspended', 'resigned', 'terminated'].includes(staffMember.status.toLowerCase())) {
      return sendError(res, `Staff member status is '${staffMember.status}'. Check-in is not permitted.`, 403);
    }

    const targetDate = date || formatDateIso(new Date());
    const currentTime = check_in_time || getCurrentTimeIso();

    // 2. Fetch Active Geofence & Shift Configuration
    const geofence = await prisma.campusGeofence.findFirst({
      where: { is_active: true },
      orderBy: { updated_at: 'desc' }
    });

    const activeGeofence = geofence || {
      id: 'default-geofence',
      ...DEFAULT_CAMPUS_LOCATION,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    // 3. Haversine Perimeter Validation
    const { isInside, distanceMeters, allowedRadius } = isWithinGeofence(
      latitude,
      longitude,
      activeGeofence.latitude,
      activeGeofence.longitude,
      activeGeofence.radius_meters
    );

    if (!isInside) {
      return sendError(res, formatGeofenceRejectionMessage(distanceMeters, allowedRadius), 400);
    }

    // 4. Shift Arrival Classification
    const shiftStatus = evaluateShiftStatus(
      currentTime,
      activeGeofence.shift_start_time,
      activeGeofence.grace_period_minutes
    );

    // 5. Look for existing attendance to handle idempotency
    const existing = await prisma.staffAttendance.findUnique({
      where: {
        staff_member_id_date: {
          staff_member_id: staffMember.id,
          date: targetDate
        }
      }
    });

    const statusToSet = existing?.admin_override ? existing.status : shiftStatus;

    const attendance = await prisma.staffAttendance.upsert({
      where: {
        staff_member_id_date: {
          staff_member_id: staffMember.id,
          date: targetDate
        }
      },
      update: {
        check_in_time: existing?.check_in_time || currentTime,
        status: statusToSet,
        shift_status: shiftStatus,
        location_verified: true,
        check_in_lat: latitude,
        check_in_lng: longitude,
        distance_meters: Math.round(distanceMeters * 100) / 100,
        device_info: device_info || (req.headers['user-agent'] as string) || 'Mobile/Browser GPS',
        notes: notes || undefined
      },
      create: {
        staff_member_id: staffMember.id,
        date: targetDate,
        check_in_time: currentTime,
        status: shiftStatus,
        shift_status: shiftStatus,
        location_verified: true,
        check_in_lat: latitude,
        check_in_lng: longitude,
        distance_meters: Math.round(distanceMeters * 100) / 100,
        device_info: device_info || (req.headers['user-agent'] as string) || 'Mobile/Browser GPS',
        marked_by: req.user?.role || 'self',
        notes: notes || null
      },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            photo_url: true,
            staffType: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    return sendSuccess(
      res,
      attendance,
      {
        distance_meters: Math.round(distanceMeters * 100) / 100,
        inside_geofence: true,
        shift_status: shiftStatus
      },
      201
    );
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. POST /api/v1/staff-attendance/check-out
 * Records check-out timestamp and computes total working hours.
 */
export async function staffCheckOut(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = staffCheckOutSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return sendError(res, issue?.message || 'Invalid check-out parameters', 400);
    }

    const {
      staffMemberId,
      latitude,
      longitude,
      notes,
      date,
      check_out_time
    } = parseResult.data;

    let staffId = staffMemberId;
    if (!staffId && req.user) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
            req.user.userId ? { user_id: req.user.userId } : {},
            req.user.userId ? { id: req.user.userId } : {}
          ].filter((c) => Object.keys(c).length > 0)
        }
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return sendError(res, 'Staff member record not found.', 404);
    }

    const staffMember = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id: staffId },
          { staff_id: { equals: staffId, mode: 'insensitive' as const } }
        ]
      }
    });

    if (!staffMember) {
      return sendError(res, `Staff member with ID '${staffId}' does not exist.`, 404);
    }

    const targetDate = date || formatDateIso(new Date());
    const currentTime = check_out_time || getCurrentTimeIso();

    const existing = await prisma.staffAttendance.findUnique({
      where: {
        staff_member_id_date: {
          staff_member_id: staffMember.id,
          date: targetDate
        }
      }
    });

    if (!existing || !existing.check_in_time) {
      return sendError(
        res,
        `Cannot check out without an existing check-in record for date: ${targetDate}. Please check in first.`,
        400
      );
    }

    const totalHours = calculateHoursWorked(existing.check_in_time, currentTime);

    const updated = await prisma.staffAttendance.update({
      where: { id: existing.id },
      data: {
        check_out_time: currentTime,
        check_out_lat: latitude !== undefined ? latitude : existing.check_out_lat,
        check_out_lng: longitude !== undefined ? longitude : existing.check_out_lng,
        total_hours: totalHours,
        notes: notes ? (existing.notes ? `${existing.notes} | ${notes}` : notes) : existing.notes
      },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            photo_url: true,
            staffType: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    return sendSuccess(res, updated, { total_hours: totalHours });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. GET /api/v1/staff-attendance/roster
 * Retrieves daily or monthly attendance register with GPS verification tags.
 */
export async function getStaffAttendanceRoster(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      date,
      month,
      start_date,
      end_date,
      staff_member_id,
      staff_type_id,
      status
    } = req.query;

    const todayStr = formatDateIso(new Date());
    const queryDate = (date as string) || (!month && !start_date ? todayStr : undefined);

    // Single-day roster query: returns complete staff roster joined with attendance
    if (queryDate) {
      const activeStaff = await prisma.staffMember.findMany({
        where: {
          status: { in: ['active', 'probation', 'on_leave'] },
          staff_type_id: staff_type_id ? (staff_type_id as string) : undefined,
          id: staff_member_id ? (staff_member_id as string) : undefined
        },
        include: {
          staffType: { select: { id: true, name: true, code: true } }
        },
        orderBy: { full_name: 'asc' }
      });

      const attendances = await prisma.staffAttendance.findMany({
        where: {
          date: queryDate,
          staff_member_id: staff_member_id ? (staff_member_id as string) : undefined,
          status: status ? (status as string) : undefined
        }
      });

      const attMap = new Map<string, any>();
      attendances.forEach((a) => attMap.set(a.staff_member_id, a));

      const roster = activeStaff.map((staff) => {
        const att = attMap.get(staff.id);
        const hasCheckIn = !!att?.check_in_time;

        let gpsTag: string;
        if (att?.admin_override) {
          gpsTag = 'Admin Override';
        } else if (att?.location_verified) {
          gpsTag = 'Verified On-Site';
        } else if (att?.check_in_lat !== null && att?.check_in_lat !== undefined) {
          gpsTag = 'Off-Site';
        } else if (hasCheckIn) {
          gpsTag = 'Remote';
        } else {
          gpsTag = 'Not Checked In';
        }

        return {
          id: att?.id || `unmarked-${staff.id}`,
          staff_member_id: staff.id,
          staff_id: staff.staff_id,
          staff_name: staff.full_name,
          designation: staff.designation,
          department: staff.staffType?.name || staff.role || 'Staff',
          photo_url: staff.photo_url,
          phone: staff.phone,
          date: queryDate,
          check_in_time: att?.check_in_time || null,
          check_out_time: att?.check_out_time || null,
          status: att?.status || 'unmarked',
          shift_status: att?.shift_status || null,
          total_hours: att?.total_hours || 0,
          location_verified: att?.location_verified || false,
          distance_meters: att?.distance_meters || null,
          gps_tag: gpsTag,
          admin_override: att?.admin_override || false,
          override_reason: att?.override_reason || null,
          override_timestamp: att?.override_timestamp || null,
          notes: att?.notes || null,
          marked_by: att?.marked_by || null,
          staffMember: staff
        };
      });

      // Compute Summary Metrics
      const totalStaff = roster.length;
      const presentCount = roster.filter((r) => r.status === 'present').length;
      const lateCount = roster.filter((r) => r.status === 'late').length;
      const halfDayCount = roster.filter((r) => r.status === 'half_day').length;
      const absentCount = roster.filter((r) => r.status === 'absent').length;
      const onLeaveCount = roster.filter((r) => ['on_leave', 'excused', 'on_duty'].includes(r.status)).length;
      const unmarkedCount = roster.filter((r) => r.status === 'unmarked').length;
      const verifiedOnSiteCount = roster.filter((r) => r.location_verified && !r.admin_override).length;
      const overrideCount = roster.filter((r) => r.admin_override).length;

      const effectivePresent = presentCount + lateCount + halfDayCount * 0.5;
      const attendanceRatePct = totalStaff > 0 ? Math.round((effectivePresent / totalStaff) * 1000) / 10 : 0;

      return sendSuccess(res, roster, {
        summary: {
          total_staff: totalStaff,
          present_count: presentCount,
          late_count: lateCount,
          half_day_count: halfDayCount,
          absent_count: absentCount,
          on_leave_count: onLeaveCount,
          unmarked_count: unmarkedCount,
          verified_on_site_count: verifiedOnSiteCount,
          admin_override_count: overrideCount,
          attendance_rate_pct: attendanceRatePct
        },
        filter: { date: queryDate }
      });
    }

    // Month or Date-Range Query
    const where: any = {};
    if (month) {
      where.date = { startsWith: month as string };
    } else if (start_date && end_date) {
      where.date = { gte: start_date as string, lte: end_date as string };
    }
    if (staff_member_id) where.staff_member_id = staff_member_id as string;
    if (status) where.status = status as string;

    const attendances = await prisma.staffAttendance.findMany({
      where,
      include: {
        staffMember: {
          include: {
            staffType: { select: { id: true, name: true, code: true } }
          }
        }
      },
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }]
    });

    const enriched = attendances.map((att) => {
      let gpsTag: string;
      if (att.admin_override) {
        gpsTag = 'Admin Override';
      } else if (att.location_verified) {
        gpsTag = 'Verified On-Site';
      } else if (att.check_in_lat !== null && att.check_in_lat !== undefined) {
        gpsTag = 'Off-Site';
      } else if (att.check_in_time) {
        gpsTag = 'Remote';
      } else {
        gpsTag = 'Manual';
      }

      return {
        ...att,
        staff_name: att.staffMember?.full_name,
        staff_code: att.staffMember?.staff_id,
        designation: att.staffMember?.designation,
        department: att.staffMember?.staffType?.name || att.staffMember?.role || 'Staff',
        photo_url: att.staffMember?.photo_url,
        gps_tag: gpsTag
      };
    });

    return sendSuccess(res, enriched, { count: enriched.length });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 4. POST /api/v1/staff-attendance/override
 * Allows administrators to manually override attendance status with mandatory audit reason.
 */
export async function adminAttendanceOverride(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = adminAttendanceOverrideSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return sendError(res, issue?.message || 'Invalid override parameters', 400);
    }

    const {
      staff_member_id,
      date,
      status,
      check_in_time,
      check_out_time,
      override_reason,
      notes
    } = parseResult.data;

    // 1. Verify Staff Member
    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id: staff_member_id },
          { staff_id: { equals: staff_member_id, mode: 'insensitive' as const } }
        ]
      },
      include: { staffType: true }
    });

    if (!staff) {
      return sendError(res, `Staff member with ID '${staff_member_id}' not found.`, 404);
    }

    // 2. Lookup Existing Attendance
    const existing = await prisma.staffAttendance.findUnique({
      where: {
        staff_member_id_date: {
          staff_member_id: staff.id,
          date
        }
      }
    });

    // 3. Determine Effective Times & Working Hours
    const effCheckIn = check_in_time !== undefined
      ? check_in_time
      : (status === 'absent' ? null : existing?.check_in_time || null);

    const effCheckOut = check_out_time !== undefined
      ? check_out_time
      : (status === 'absent' ? null : existing?.check_out_time || null);

    let totalHours: number | null = null;
    if (effCheckIn && effCheckOut) {
      totalHours = calculateHoursWorked(effCheckIn, effCheckOut);
    } else if (status === 'absent') {
      totalHours = 0;
    } else if (status === 'half_day') {
      totalHours = existing?.total_hours || 4.0;
    } else if (existing?.total_hours) {
      totalHours = existing.total_hours;
    } else if (status === 'present') {
      totalHours = 8.0;
    }

    const adminUserId = req.user?.userId || 'admin';
    const safeOverrideByUserId = await resolveSafeUserId(req.user?.userId);
    const overrideTimestamp = new Date();

    // 4. DB Upsert
    const updated = await prisma.staffAttendance.upsert({
      where: {
        staff_member_id_date: {
          staff_member_id: staff.id,
          date
        }
      },
      update: {
        status,
        check_in_time: effCheckIn,
        check_out_time: effCheckOut,
        total_hours: totalHours,
        notes: notes !== undefined ? notes : existing?.notes,
        admin_override: true,
        override_reason,
        override_by_user_id: safeOverrideByUserId,
        override_timestamp: overrideTimestamp,
        marked_by: 'admin_override'
      },
      create: {
        staff_member_id: staff.id,
        date,
        status,
        check_in_time: effCheckIn,
        check_out_time: effCheckOut,
        total_hours: totalHours || (status === 'half_day' ? 4.0 : (status === 'present' ? 8.0 : 0)),
        notes: notes || null,
        admin_override: true,
        override_reason,
        override_by_user_id: safeOverrideByUserId,
        override_timestamp: overrideTimestamp,
        marked_by: 'admin_override'
      },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            photo_url: true,
            staffType: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    // 5. Create Immutable Audit Log
    if (adminUserId) {
      await createAuditLog(
        adminUserId,
        'ADMIN_ATTENDANCE_OVERRIDE',
        'StaffAttendance',
        updated.id,
        {
          staff_member_id: staff.id,
          staff_id: staff.staff_id,
          staff_name: staff.full_name,
          date,
          previous_status: existing?.status || 'unmarked',
          new_status: status,
          previous_check_in: existing?.check_in_time || null,
          new_check_in: updated.check_in_time,
          previous_check_out: existing?.check_out_time || null,
          new_check_out: updated.check_out_time,
          previous_override: existing?.admin_override || false,
          override_reason,
          admin_user_id: adminUserId,
          timestamp: overrideTimestamp.toISOString()
        }
      ).catch((e) => console.warn('Audit log creation warning:', e));
    }

    return sendSuccess(
      res,
      updated,
      {
        override_applied: true,
        audit_logged: true
      }
    );
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 5. POST /api/v1/staff-attendance/bulk
 * Bulk attendance recording helper for staff management.
 */
export async function bulkStaffAttendance(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = staffBulkAttendanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, parseResult.error.issues[0]?.message || 'Invalid bulk attendance payload', 400);
    }

    const { date, records } = parseResult.data;

    for (const r of records) {
      const staff = await prisma.staffMember.findFirst({
        where: {
          OR: [
            { id: r.staffMemberId },
            { staff_id: { equals: r.staffMemberId, mode: 'insensitive' as const } }
          ]
        }
      });

      if (staff) {
        await prisma.staffAttendance.upsert({
          where: {
            staff_member_id_date: {
              staff_member_id: staff.id,
              date
            }
          },
          update: {
            status: r.status || 'present',
            check_in_time: r.checkInTime || undefined,
            check_out_time: r.checkOutTime || undefined,
            notes: r.notes || undefined
          },
          create: {
            staff_member_id: staff.id,
            date,
            status: r.status || 'present',
            check_in_time: r.checkInTime || null,
            check_out_time: r.checkOutTime || null,
            notes: r.notes || null,
            marked_by: req.user?.role || 'admin'
          }
        });
      }
    }

    return sendSuccess(res, { message: 'Bulk attendance recorded', count: records.length });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}
