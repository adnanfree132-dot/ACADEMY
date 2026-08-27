/**
 * ============================================================================
 * Academy Pro OS — Campus Geofence Configuration & Location Testing Controller
 * ============================================================================
 * Handles administrative configuration and real-time GPS perimeter testing.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import {
  calculateDistance,
  isWithinGeofence,
  validateCoordinates,
  formatDistance,
  DEFAULT_CAMPUS_LOCATION
} from '../utils/geoUtils';
import { prisma } from '../prisma';

const DEFAULT_ATTENDANCE_POLICY = {
  half_day_late_cutoff_minutes: 90,
  half_day_min_hours: 4.0,
  absent_min_hours: 2.0
};

async function getStoredAttendancePolicy() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'attendance_policy' }
    });
    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      return { ...DEFAULT_ATTENDANCE_POLICY, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_ATTENDANCE_POLICY;
}

function formatGeofenceResponse(config: any, policy?: any) {
  if (!config) return null;
  const radius = config.radius_meters ?? config.radius ?? 150;
  const activePolicy = policy || DEFAULT_ATTENDANCE_POLICY;
  return {
    ...config,
    radius,
    radius_meters: radius,
    half_day_late_cutoff_minutes: activePolicy.half_day_late_cutoff_minutes ?? 90,
    half_day_min_hours: activePolicy.half_day_min_hours ?? 4.0,
    absent_min_hours: activePolicy.absent_min_hours ?? 2.0
  };
}

/**
 * 1. GET /api/v1/settings/geofence
 * Returns active campus geofence configuration with coordinates, radius, shift timings and policy thresholds.
 * Idempotently seeds default campus coordinates if no record exists yet.
 */
export async function getGeofenceConfig(req: Request, res: Response) {
  try {
    let config = await prisma.campusGeofence.findFirst({
      where: { is_active: true },
      orderBy: { updated_at: 'desc' }
    });

    if (!config) {
      // Seed default record into database for persistence
      try {
        config = await prisma.campusGeofence.create({
          data: {
            campus_name: DEFAULT_CAMPUS_LOCATION.campus_name,
            latitude: DEFAULT_CAMPUS_LOCATION.latitude,
            longitude: DEFAULT_CAMPUS_LOCATION.longitude,
            radius_meters: DEFAULT_CAMPUS_LOCATION.radius_meters,
            shift_start_time: DEFAULT_CAMPUS_LOCATION.shift_start_time,
            shift_end_time: DEFAULT_CAMPUS_LOCATION.shift_end_time,
            grace_period_minutes: DEFAULT_CAMPUS_LOCATION.grace_period_minutes,
            is_active: true
          }
        });
      } catch (e) {
        config = {
          id: 'default-campus',
          ...DEFAULT_CAMPUS_LOCATION,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        } as any;
      }
    }

    const policy = await getStoredAttendancePolicy();
    return sendSuccess(res, formatGeofenceResponse(config, policy));
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. PUT /api/v1/settings/geofence
 * Updates administrative campus geofence coordinates, radius, shift timings, grace period and policy thresholds.
 * Requires administrator role / settings editable access.
 */
export async function updateGeofenceConfig(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      campus_name,
      latitude,
      longitude,
      radius,
      radius_meters,
      shift_start_time,
      shift_end_time,
      grace_period_minutes,
      half_day_late_cutoff_minutes,
      half_day_min_hours,
      absent_min_hours,
      is_active
    } = req.body;

    // Fetch existing active record to allow partial updates
    const existing = await prisma.campusGeofence.findFirst({
      where: { is_active: true },
      orderBy: { updated_at: 'desc' }
    });

    const targetLat = latitude !== undefined ? latitude : (existing ? existing.latitude : DEFAULT_CAMPUS_LOCATION.latitude);
    const targetLng = longitude !== undefined ? longitude : (existing ? existing.longitude : DEFAULT_CAMPUS_LOCATION.longitude);

    // Validate coordinates
    const coordValidation = validateCoordinates(targetLat, targetLng);
    if (!coordValidation.isValid) {
      return sendError(res, coordValidation.error || 'Invalid GPS coordinates provided.', 400);
    }

    // Validate radius
    const rawRadius = radius_meters !== undefined ? radius_meters : (radius !== undefined ? radius : (existing ? existing.radius_meters : 150));
    const parsedRadius = Number(rawRadius);
    if (isNaN(parsedRadius) || parsedRadius < 10 || parsedRadius > 50000) {
      return sendError(res, 'Allowable radius must be a positive number between 10 meters and 50,000 meters.', 400);
    }

    // Validate shift times (HH:mm or HH:mm:ss format)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    const targetStartTime = shift_start_time !== undefined ? shift_start_time : (existing ? existing.shift_start_time : '08:00');
    const targetEndTime = shift_end_time !== undefined ? shift_end_time : (existing ? existing.shift_end_time : '16:00');

    if (targetStartTime && !timeRegex.test(String(targetStartTime).trim())) {
      return sendError(res, 'Shift start time must be in valid HH:mm or HH:mm:ss format (e.g. 08:00).', 400);
    }
    if (targetEndTime && !timeRegex.test(String(targetEndTime).trim())) {
      return sendError(res, 'Shift end time must be in valid HH:mm or HH:mm:ss format (e.g. 16:00).', 400);
    }

    const rawGrace = grace_period_minutes !== undefined ? grace_period_minutes : (existing ? existing.grace_period_minutes : 15);
    const graceMins = parseInt(String(rawGrace), 10);
    if (isNaN(graceMins) || graceMins < 0 || graceMins > 180) {
      return sendError(res, 'Grace period must be an integer between 0 and 180 minutes.', 400);
    }

    // Process Attendance Policy thresholds
    const updatedPolicy = {
      half_day_late_cutoff_minutes: half_day_late_cutoff_minutes !== undefined ? Number(half_day_late_cutoff_minutes) : 90,
      half_day_min_hours: half_day_min_hours !== undefined ? Number(half_day_min_hours) : 4.0,
      absent_min_hours: absent_min_hours !== undefined ? Number(absent_min_hours) : 2.0
    };

    try {
      await prisma.appSetting.upsert({
        where: { key: 'attendance_policy' },
        create: {
          key: 'attendance_policy',
          value: JSON.stringify(updatedPolicy)
        },
        update: {
          value: JSON.stringify(updatedPolicy)
        }
      });
    } catch (e) {
      // non-blocking
    }

    const campusNameClean = (campus_name !== undefined ? campus_name : (existing ? existing.campus_name : 'Main Campus')).trim();
    const activeState = is_active !== undefined ? Boolean(is_active) : (existing ? existing.is_active : true);

    let updatedRecord: any = null;

    if (existing) {
      updatedRecord = await prisma.campusGeofence.update({
        where: { id: existing.id },
        data: {
          campus_name: campusNameClean,
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          radius_meters: parsedRadius,
          shift_start_time: targetStartTime.trim(),
          shift_end_time: targetEndTime.trim(),
          grace_period_minutes: graceMins,
          is_active: activeState
        }
      });
    } else {
      updatedRecord = await prisma.campusGeofence.create({
        data: {
          campus_name: campusNameClean,
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          radius_meters: parsedRadius,
          shift_start_time: targetStartTime.trim(),
          shift_end_time: targetEndTime.trim(),
          grace_period_minutes: graceMins,
          is_active: activeState
        }
      });
    }

    // Audit Logging
    if (req.user?.userId && req.user.userId !== 'admin-id') {
      await createAuditLog(
        req.user.userId,
        'UPDATE_GEOFENCE_CONFIG',
        'CampusGeofence',
        updatedRecord.id,
        {
          campus_name: campusNameClean,
          latitude: coordValidation.latitude,
          longitude: coordValidation.longitude,
          radius_meters: parsedRadius,
          shift_start_time: targetStartTime,
          shift_end_time: targetEndTime,
          grace_period_minutes: graceMins,
          attendance_policy: updatedPolicy
        }
      );
    }

    return sendSuccess(res, formatGeofenceResponse(updatedRecord, updatedPolicy));
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. POST /api/v1/settings/geofence/test
 * Interactive testing endpoint: Accepts test coordinates and checks distance against campus perimeter.
 *
 * Payload: { latitude: number, longitude: number, campus_lat?: number, campus_lng?: number, radius_meters?: number, radius?: number }
 * Response: { inside: boolean, distance_meters: number, allowable_radius: number, formatted_distance: string, message: string }
 */
export async function testGeofenceLocation(req: Request, res: Response) {
  try {
    const { latitude, longitude, campus_lat, campus_lng, radius, radius_meters } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return sendError(res, 'Test coordinates (latitude and longitude) are required.', 400);
    }

    const coordCheck = validateCoordinates(Number(latitude), Number(longitude));
    if (!coordCheck.isValid) {
      return sendError(res, coordCheck.error || 'Invalid test coordinates.', 400);
    }

    // Determine target campus center
    let centerLat: number;
    let centerLng: number;
    let allowableRadius: number;

    if (campus_lat !== undefined && campus_lng !== undefined) {
      centerLat = Number(campus_lat);
      centerLng = Number(campus_lng);
      allowableRadius = Number(radius_meters !== undefined ? radius_meters : (radius !== undefined ? radius : 150));
    } else {
      const activeConfig = await prisma.campusGeofence.findFirst({
        where: { is_active: true },
        orderBy: { updated_at: 'desc' }
      });
      centerLat = activeConfig ? activeConfig.latitude : DEFAULT_CAMPUS_LOCATION.latitude;
      centerLng = activeConfig ? activeConfig.longitude : DEFAULT_CAMPUS_LOCATION.longitude;
      allowableRadius = activeConfig ? activeConfig.radius_meters : DEFAULT_CAMPUS_LOCATION.radius_meters;
    }

    const distance = calculateDistance(
      coordCheck.latitude,
      coordCheck.longitude,
      centerLat,
      centerLng
    );

    const inside = distance <= allowableRadius;
    const formattedDistance = formatDistance(distance);

    return sendSuccess(res, {
      inside,
      distance_meters: distance,
      allowable_radius: allowableRadius,
      formatted_distance: formattedDistance,
      message: inside
        ? `Location is inside allowable campus perimeter (${formattedDistance} <= ${allowableRadius}m). Check-in permitted.`
        : `Location is outside campus perimeter by ${(distance - allowableRadius).toFixed(1)}m (${formattedDistance} > ${allowableRadius}m). Check-in blocked.`
    });
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}
