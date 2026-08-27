/**
 * ============================================================================
 * Academy Pro OS — High-Precision Geolocation & Geofencing Mathematical Utilities
 * ============================================================================
 * Implements WGS-84 spherical Haversine distance calculations, coordinate
 * boundary validation, shift arrival status evaluation, and duration computations.
 */

/** Earth volumetric mean radius in meters (WGS-84 spherical approximation) */
export const EARTH_RADIUS_METERS = 6371000;

/** Standard Default Grace Period in Minutes */
export const DEFAULT_GRACE_PERIOD_MINUTES = 15;

/** Default Campus Coordinates fallback */
export const DEFAULT_CAMPUS_LOCATION = {
  campus_name: 'Main Campus',
  latitude: 31.5204,
  longitude: 74.3587,
  radius_meters: 150,
  shift_start_time: '08:00',
  shift_end_time: '16:00',
  grace_period_minutes: 15
};

export interface GeofenceCheckResult {
  isInside: boolean;
  distanceMeters: number;
  allowedRadius: number;
  excessMeters: number;
  formattedDistance: string;
  message: string;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  error?: string;
  latitude: number;
  longitude: number;
}

/**
 * Validates and normalizes latitude and longitude coordinates.
 * Latitude must be in range [-90, +90]
 * Longitude must be in range [-180, +180]
 */
export function validateCoordinates(lat: any, lng: any): CoordinateValidationResult {
  const latitude = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const longitude = typeof lng === 'number' ? lng : parseFloat(String(lng));

  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      isValid: false,
      error: 'Coordinates must be valid floating-point numbers.',
      latitude: NaN,
      longitude: NaN
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: `Latitude ${latitude} is out of bounds. Must be between -90 and +90 degrees.`,
      latitude,
      longitude
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: `Longitude ${longitude} is out of bounds. Must be between -180 and +180 degrees.`,
      latitude,
      longitude
    };
  }

  return {
    isValid: true,
    latitude,
    longitude
  };
}

/**
 * Computes high-precision Haversine distance between two GPS coordinates.
 * Returns distance in meters (rounded to 2 decimal places).
 *
 * @param lat1 Latitude of Point 1 (decimal degrees)
 * @param lon1 Longitude of Point 1 (decimal degrees)
 * @param lat2 Latitude of Point 2 (decimal degrees)
 * @param lon2 Longitude of Point 2 (decimal degrees)
 * @returns Great-circle distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Validate coordinates
  const p1 = validateCoordinates(lat1, lon1);
  const p2 = validateCoordinates(lat2, lon2);

  if (!p1.isValid || !p2.isValid) {
    throw new Error(p1.error || p2.error || 'Invalid GPS coordinates provided for distance calculation.');
  }

  // Exact point identity shortcut
  if (p1.latitude === p2.latitude && p1.longitude === p2.longitude) {
    return 0.0;
  }

  const toRad = (degrees: number) => (degrees * Math.PI) / 180.0;

  const phi1 = toRad(p1.latitude);
  const phi2 = toRad(p2.latitude);
  const deltaPhi = toRad(p2.latitude - p1.latitude);
  const deltaLambda = toRad(p2.longitude - p1.longitude);

  // Haversine formula: a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
  const sinHalfDeltaPhi = Math.sin(deltaPhi / 2.0);
  const sinHalfDeltaLambda = Math.sin(deltaLambda / 2.0);

  const a =
    sinHalfDeltaPhi * sinHalfDeltaPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinHalfDeltaLambda * sinHalfDeltaLambda;

  // Clamp a to [0, 1] to avoid domain errors with sqrt / atan2
  const clampedA = Math.min(1.0, Math.max(0.0, a));

  // c = 2 * atan2(√a, √(1-a))
  const c = 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1.0 - clampedA));

  // d = R * c
  const distance = EARTH_RADIUS_METERS * c;

  // Round to 2 decimal places for financial & geographic deterministic equality
  return Math.round(distance * 100) / 100;
}

/**
 * Alias for calculateDistance for compatibility
 */
export const haversineDistance = calculateDistance;

/**
 * Verifies whether a user's GPS coordinates are within an allowable campus geofence perimeter.
 *
 * @param userLat User latitude
 * @param userLng User longitude
 * @param campusLat Campus center latitude
 * @param campusLng Campus center longitude
 * @param radiusMeters Allowable geofence radius in meters (default 150m)
 * @returns GeofenceCheckResult
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  campusLat: number,
  campusLng: number,
  radiusMeters: number = 150
): GeofenceCheckResult {
  const allowedRadius = Math.max(1, radiusMeters);
  const distanceMeters = calculateDistance(userLat, userLng, campusLat, campusLng);

  // Allow a tiny floating-point epsilon (0.01m)
  const isInside = distanceMeters <= allowedRadius + 0.01;
  const excessMeters = isInside ? 0 : Math.round((distanceMeters - allowedRadius) * 100) / 100;

  const formattedDistance = formatDistance(distanceMeters);

  let message: string;
  if (isInside) {
    message = `Within campus boundary (${formattedDistance} from center, allowed: ${allowedRadius}m).`;
  } else {
    message = `Off-site check-in rejected. You are ${Math.round(distanceMeters)}m away from the campus boundary (allowed: ${allowedRadius}m).`;
  }

  return {
    isInside,
    distanceMeters,
    allowedRadius,
    excessMeters,
    formattedDistance,
    message
  };
}

/**
 * Formats a distance in meters into human-readable metric units.
 * e.g., 45.2 -> "45.20 m", 1450.5 -> "1.45 km"
 */
export function formatDistance(meters: number): string {
  if (isNaN(meters)) return '0.00 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(2)} m`;
}

/**
 * Rejection error message formatter required for consistent API feedback.
 */
export function formatGeofenceRejectionMessage(distanceMeters: number, allowedRadiusMeters: number): string {
  const roundedDistance = Math.round(distanceMeters);
  const roundedAllowed = Math.round(allowedRadiusMeters);
  return `Off-site check-in rejected. You are ${roundedDistance}m away from the campus boundary (allowed: ${roundedAllowed}m).`;
}

/**
 * Parses time string representations (HH:mm, HH:mm:ss, 12h AM/PM, ISO) into minutes from midnight (0 - 1439).
 *
 * Examples:
 * - "08:00" -> 480
 * - "08:15:30" -> 495
 * - "08:15 AM" -> 495
 * - "04:30 PM" -> 990
 * - "2026-08-25T08:15:00.000Z" -> parsed to time
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error(`Invalid time string: "${timeStr}". Must be a non-empty string.`);
  }

  let cleanStr = timeStr.trim();

  // If ISO 8601 string, extract time component
  if (cleanStr.includes('T')) {
    const parts = cleanStr.split('T');
    cleanStr = parts[1].replace('Z', '').split('.')[0];
  }

  // Handle 12-hour AM/PM format
  const isPM = /pm$/i.test(cleanStr);
  const isAM = /am$/i.test(cleanStr);
  if (isPM || isAM) {
    cleanStr = cleanStr.replace(/am|pm/gi, '').trim();
  }

  const segments = cleanStr.split(':');
  if (segments.length < 2) {
    throw new Error(`Unrecognized time format: "${timeStr}". Expected HH:mm or HH:mm:ss.`);
  }

  let hours = parseInt(segments[0], 10);
  const minutes = parseInt(segments[1], 10);
  const seconds = segments.length > 2 ? parseFloat(segments[2]) : 0;

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Could not parse numerical hours and minutes from: "${timeStr}".`);
  }

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Time values out of valid range (00:00 - 23:59): "${timeStr}".`);
  }

  return hours * 60 + minutes + (seconds ? Math.floor(seconds / 60) : 0);
}

/**
 * Evaluates shift arrival status (Present vs Late).
 *
 * Algorithm:
 * - Computes check-in minutes from midnight: M_checkin
 * - Computes shift start minutes from midnight: M_shift
 * - Cutoff time: M_cutoff = M_shift + gracePeriodMinutes (default 15)
 * - If M_checkin <= M_cutoff -> 'present'
 * - If M_checkin > M_cutoff -> 'late'
 *
 * @param checkInTimeStr e.g. "08:14:00" or "08:14"
 * @param shiftStartTimeStr e.g. "08:00:00" or "08:00"
 * @param gracePeriodMinutes e.g. 15
 * @returns 'present' | 'late'
 */
export function evaluateShiftStatus(
  checkInTimeStr: string,
  shiftStartTimeStr: string = '08:00',
  gracePeriodMinutes: number = DEFAULT_GRACE_PERIOD_MINUTES
): 'present' | 'late' {
  try {
    const checkInMins = parseTimeToMinutes(checkInTimeStr);
    const shiftStartMins = parseTimeToMinutes(shiftStartTimeStr);
    const grace = Math.max(0, gracePeriodMinutes);

    const cutoffMins = shiftStartMins + grace;

    return checkInMins <= cutoffMins ? 'present' : 'late';
  } catch (err) {
    console.warn(`[evaluateShiftStatus] Fallback to 'present' due to time parsing error:`, err);
    return 'present';
  }
}

/**
 * Computes total hours worked between check-in and check-out times.
 * Returns decimal hours rounded to 2 decimal places (e.g., 8.25).
 * Handles normal same-day shifts and overnight crossings cleanly.
 */
export function calculateHoursWorked(
  checkInTimeStr: string,
  checkOutTimeStr: string
): number {
  if (!checkInTimeStr || !checkOutTimeStr) {
    return 0.0;
  }

  try {
    const checkInMins = parseTimeToMinutes(checkInTimeStr);
    const checkOutMins = parseTimeToMinutes(checkOutTimeStr);

    let diffMinutes = checkOutMins - checkInMins;
    // Overnight shift handling: if check-out time is earlier in clock than check-in
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 1440 minutes (1 full day)
    }

    const hours = diffMinutes / 60.0;
    return Math.round(hours * 100) / 100;
  } catch {
    return 0.0;
  }
}

/**
 * Alias for calculateHoursWorked
 */
export const calculateTotalHours = calculateHoursWorked;

/**
 * Returns current time formatted as HH:mm:ss in local/ISO format
 */
export function getCurrentTimeIso(d: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Returns date formatted as YYYY-MM-DD
 */
export function formatDateIso(d: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
