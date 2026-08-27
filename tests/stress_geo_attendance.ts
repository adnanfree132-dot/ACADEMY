/**
 * ============================================================================
 * ACADEMY PRO OS — GEOLOCATION & ATTENDANCE ADVERSARIAL STRESS TEST HARNESS
 * ============================================================================
 * Challenger 1: Empirical verification of geoUtils, geofenceController,
 * and staffAttendanceController.
 */

import http from 'http';
import {
  calculateDistance,
  haversineDistance,
  isWithinGeofence,
  validateCoordinates,
  formatDistance,
  formatGeofenceRejectionMessage,
  parseTimeToMinutes,
  evaluateShiftStatus,
  calculateHoursWorked,
  EARTH_RADIUS_METERS,
  DEFAULT_CAMPUS_LOCATION
} from '../server/src/utils/geoUtils';
import {
  adminAttendanceOverrideSchema,
  staffCheckInSchema,
  staffCheckOutSchema
} from '../server/src/validations/staffAttendanceValidation';
import { staffAttendanceStatusEnum } from '../server/src/validations/commonValidation';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string, details?: any) {
  if (!condition) {
    const err = new Error(`Assertion failed: ${msg}`);
    (err as any).details = details;
    throw err;
  }
}

async function runTest(category: string, name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      await res;
    }
    results.push({ category, name, passed: true });
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } catch (err: any) {
    results.push({
      category,
      name,
      passed: false,
      error: err.message || String(err),
      details: err.details
    });
    console.error(`  ✗ [FAIL] [${category}] ${name}: ${err.message}`);
  }
}

// HTTP request helper for live API testing
function apiRequest(path: string, options: { method?: string; body?: any; token?: string } = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const body = JSON.parse(raw);
            resolve({ status: res.statusCode || 200, body });
          } catch {
            resolve({ status: res.statusCode || 200, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('\n========================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL GEOLOCATION & ATTENDANCE STRESS SUITE');
  console.log('========================================================================\n');

  // =========================================================================
  // SECTION 1: FLOATING POINT BOUNDARIES & GEODESIC MATH
  // =========================================================================
  console.log('--- [1. Floating Point Boundary & Geodesic Math Stress Tests] ---');

  // 1.1 0m Distance on identical points
  await runTest('GeoMath', '0m distance on exact coordinate identity (Main Campus)', () => {
    const dist = calculateDistance(31.5204, 74.3587, 31.5204, 74.3587);
    assert(dist === 0.0, `Expected exactly 0.0m, got ${dist}`);
  });

  await runTest('GeoMath', '0m distance on exact origin (0, 0)', () => {
    const dist = calculateDistance(0, 0, 0, 0);
    assert(dist === 0.0, `Expected exactly 0.0m, got ${dist}`);
  });

  await runTest('GeoMath', '0m distance on North Pole (90, 0)', () => {
    const dist = calculateDistance(90, 0, 90, 0);
    assert(dist === 0.0, `Expected exactly 0.0m, got ${dist}`);
  });

  await runTest('GeoMath', '0m distance on South Pole (-90, 0)', () => {
    const dist = calculateDistance(-90, 0, -90, 0);
    assert(dist === 0.0, `Expected exactly 0.0m, got ${dist}`);
  });

  // 1.2 Antipodal Points Stress Tests
  await runTest('GeoMath', 'Antipodal points: North Pole (90, 0) to South Pole (-90, 0)', () => {
    const dist = calculateDistance(90, 0, -90, 0);
    const expectedHalfCircumference = Math.round(Math.PI * EARTH_RADIUS_METERS * 100) / 100;
    // Difference should be < 0.05m
    assert(
      Math.abs(dist - expectedHalfCircumference) <= 0.05,
      `Expected ${expectedHalfCircumference}m (~20015086.80m), got ${dist}m`
    );
  });

  await runTest('GeoMath', 'Antipodal points: Equator (0, 0) to Equator opposite (0, 180)', () => {
    const dist = calculateDistance(0, 0, 0, 180);
    const expectedHalfCircumference = Math.round(Math.PI * EARTH_RADIUS_METERS * 100) / 100;
    assert(
      Math.abs(dist - expectedHalfCircumference) <= 0.05,
      `Expected ${expectedHalfCircumference}m, got ${dist}m`
    );
  });

  await runTest('GeoMath', 'Antipodal points: Equator (0, 0) to Equator opposite (0, -180)', () => {
    const dist = calculateDistance(0, 0, 0, -180);
    const expectedHalfCircumference = Math.round(Math.PI * EARTH_RADIUS_METERS * 100) / 100;
    assert(
      Math.abs(dist - expectedHalfCircumference) <= 0.05,
      `Expected ${expectedHalfCircumference}m, got ${dist}m`
    );
  });

  await runTest('GeoMath', 'Antimeridian identity: (0, -180) to (0, 180) is same physical meridian', () => {
    const dist = calculateDistance(0, -180, 0, 180);
    // Delta longitude is 360 deg = 2*PI rad -> sin(PI) = 0 -> distance is 0.0
    assert(dist === 0.0, `Expected 0.0m on antimeridian identity, got ${dist}m`);
  });

  await runTest('GeoMath', 'Arbitrary antipodes: (45, 90) to (-45, -90)', () => {
    const dist = calculateDistance(45, 90, -45, -90);
    const expectedHalfCircumference = Math.round(Math.PI * EARTH_RADIUS_METERS * 100) / 100;
    assert(
      Math.abs(dist - expectedHalfCircumference) <= 0.05,
      `Expected ${expectedHalfCircumference}m, got ${dist}m`
    );
  });

  // 1.3 Coordinate Boundary Validation
  await runTest('GeoMath', 'Coordinate boundary: exact lat 90 and -90 are valid', () => {
    const v1 = validateCoordinates(90, 0);
    const v2 = validateCoordinates(-90, 0);
    assert(v1.isValid === true && v2.isValid === true, 'Latitude ±90 must be valid');
  });

  await runTest('GeoMath', 'Coordinate boundary: exact lng 180 and -180 are valid', () => {
    const v1 = validateCoordinates(0, 180);
    const v2 = validateCoordinates(0, -180);
    assert(v1.isValid === true && v2.isValid === true, 'Longitude ±180 must be valid');
  });

  await runTest('GeoMath', 'Coordinate boundary: lat 90.000001 is rejected', () => {
    const v = validateCoordinates(90.000001, 0);
    assert(v.isValid === false, 'Latitude > 90 must be rejected');
  });

  await runTest('GeoMath', 'Coordinate boundary: lat -90.000001 is rejected', () => {
    const v = validateCoordinates(-90.000001, 0);
    assert(v.isValid === false, 'Latitude < -90 must be rejected');
  });

  await runTest('GeoMath', 'Coordinate boundary: lng 180.000001 is rejected', () => {
    const v = validateCoordinates(0, 180.000001);
    assert(v.isValid === false, 'Longitude > 180 must be rejected');
  });

  await runTest('GeoMath', 'Coordinate boundary: lng -180.000001 is rejected', () => {
    const v = validateCoordinates(0, -180.000001);
    assert(v.isValid === false, 'Longitude < -180 must be rejected');
  });

  await runTest('GeoMath', 'Coordinate boundary: string numbers "31.5204" & "74.3587" are correctly coerced', () => {
    const v = validateCoordinates('31.5204' as any, '74.3587' as any);
    assert(v.isValid === true && v.latitude === 31.5204 && v.longitude === 74.3587, 'String numbers must be parsed');
  });

  await runTest('GeoMath', 'Coordinate boundary: NaN / invalid strings are rejected', () => {
    const v1 = validateCoordinates('abc', 74.3587);
    const v2 = validateCoordinates(31.5204, 'def');
    const v3 = validateCoordinates(NaN, 74.3587);
    assert(v1.isValid === false && v2.isValid === false && v3.isValid === false, 'Non-numeric coords must be rejected');
  });

  // 1.4 Radius Border Edge Cases
  await runTest('GeoMath', 'Radius border: point exactly on 150m boundary isInside === true', () => {
    const deltaLat = 150 / (Math.PI * EARTH_RADIUS_METERS / 180);
    const targetLat = 31.5204 + deltaLat;
    const res = isWithinGeofence(targetLat, 74.3587, 31.5204, 74.3587, 150);
    assert(res.isInside === true, `Expected isInside to be true on exact border, got ${res.isInside} (dist: ${res.distanceMeters})`);
    assert(res.excessMeters === 0, `Expected excessMeters to be 0 on border, got ${res.excessMeters}`);
  });

  await runTest('GeoMath', 'Radius border: point at 150.008m (within epsilon 0.01m) isInside === true', () => {
    const deltaLat = 150.008 / (Math.PI * EARTH_RADIUS_METERS / 180);
    const targetLat = 31.5204 + deltaLat;
    const res = isWithinGeofence(targetLat, 74.3587, 31.5204, 74.3587, 150);
    assert(res.isInside === true, `Expected isInside to be true with 0.01m epsilon, got ${res.isInside}`);
  });

  await runTest('GeoMath', 'Radius border: point at 150.05m is rejected isInside === false', () => {
    const deltaLat = 150.05 / (Math.PI * EARTH_RADIUS_METERS / 180);
    const targetLat = 31.5204 + deltaLat;
    const res = isWithinGeofence(targetLat, 74.3587, 31.5204, 74.3587, 150);
    assert(res.isInside === false, `Expected isInside to be false at 150.05m, got ${res.isInside}`);
    assert(res.excessMeters > 0, `Expected excessMeters > 0, got ${res.excessMeters}`);
  });

  await runTest('GeoMath', 'Radius minimum clamp: radius <= 0 is safely clamped to >= 1m', () => {
    const res1 = isWithinGeofence(31.5204, 74.3587, 31.5204, 74.3587, 0);
    const res2 = isWithinGeofence(31.5204, 74.3587, 31.5204, 74.3587, -50);
    assert(res1.allowedRadius === 1, `Expected allowedRadius clamped to 1, got ${res1.allowedRadius}`);
    assert(res2.allowedRadius === 1, `Expected allowedRadius clamped to 1, got ${res2.allowedRadius}`);
  });

  // =========================================================================
  // SECTION 2: TIME, SHIFTS, AND GRACE PERIOD CORNER CASES
  // =========================================================================
  console.log('\n--- [2. Time & Shift Corner Cases Stress Tests] ---');

  await runTest('ShiftLogic', 'Exact second of shift start (08:00:00 vs shift 08:00) -> present', () => {
    const status = evaluateShiftStatus('08:00:00', '08:00', 15);
    assert(status === 'present', `Expected 'present', got '${status}'`);
  });

  await runTest('ShiftLogic', '1 second before shift start (07:59:59 vs shift 08:00) -> present', () => {
    const status = evaluateShiftStatus('07:59:59', '08:00', 15);
    assert(status === 'present', `Expected 'present', got '${status}'`);
  });

  await runTest('ShiftLogic', 'Mid-grace arrival (08:07:30 vs shift 08:00, grace 15) -> present', () => {
    const status = evaluateShiftStatus('08:07:30', '08:00', 15);
    assert(status === 'present', `Expected 'present', got '${status}'`);
  });

  await runTest('ShiftLogic', 'Exact second of grace expiry (08:15:00 vs shift 08:00, grace 15) -> present', () => {
    const status = evaluateShiftStatus('08:15:00', '08:00', 15);
    assert(status === 'present', `Expected 'present' at exact grace boundary 08:15:00, got '${status}'`);
  });

  await runTest('ShiftLogic', '1 second past grace (08:15:01 vs shift 08:00, grace 15) -> evaluate resolution behavior', () => {
    const status = evaluateShiftStatus('08:15:01', '08:00', 15);
    assert(typeof status === 'string', 'Should return status string');
    console.log(`    [Observation] 08:15:01 evaluates to '${status}' under minute-level cutoff.`);
  });

  await runTest('ShiftLogic', '1 minute past grace (08:16:00 vs shift 08:00, grace 15) -> late', () => {
    const status = evaluateShiftStatus('08:16:00', '08:00', 15);
    assert(status === 'late', `Expected 'late' at 08:16:00, got '${status}'`);
  });

  await runTest('ShiftLogic', 'Zero grace period (grace = 0): 08:00:00 -> present, 08:01:00 -> late', () => {
    const onTime = evaluateShiftStatus('08:00:00', '08:00', 0);
    const late = evaluateShiftStatus('08:01:00', '08:00', 0);
    assert(onTime === 'present', `Expected 'present' at 08:00:00 with 0 grace, got '${onTime}'`);
    assert(late === 'late', `Expected 'late' at 08:01:00 with 0 grace, got '${late}'`);
  });

  await runTest('ShiftLogic', '12-hour AM/PM formats parsing in evaluateShiftStatus', () => {
    const morningPresent = evaluateShiftStatus('08:10 AM', '08:00 AM', 15);
    const morningLate = evaluateShiftStatus('08:20 AM', '08:00 AM', 15);
    const afternoonShift = evaluateShiftStatus('02:05 PM', '02:00 PM', 15);
    assert(morningPresent === 'present', `Expected 'present' for 08:10 AM, got '${morningPresent}'`);
    assert(morningLate === 'late', `Expected 'late' for 08:20 AM, got '${morningLate}'`);
    assert(afternoonShift === 'present', `Expected 'present' for 02:05 PM, got '${afternoonShift}'`);
  });

  await runTest('ShiftLogic', 'ISO 8601 timestamp string parsing in evaluateShiftStatus', () => {
    const status = evaluateShiftStatus('2026-08-25T08:14:30.000Z', '08:00', 15);
    assert(status === 'present', `Expected 'present' for ISO timestamp, got '${status}'`);
  });

  await runTest('ShiftLogic', 'Hours worked: Standard 8-hour shift (08:00 to 16:00) -> 8.00 hours', () => {
    const hours = calculateHoursWorked('08:00', '16:00');
    assert(hours === 8.0, `Expected 8.00 hours, got ${hours}`);
  });

  await runTest('ShiftLogic', 'Hours worked: Overnight shift crossing midnight (22:00 to 06:00) -> 8.00 hours', () => {
    const hours = calculateHoursWorked('22:00', '06:00');
    assert(hours === 8.0, `Expected 8.00 hours for overnight shift, got ${hours}`);
  });

  await runTest('ShiftLogic', 'Hours worked: Overnight shift crossing midnight with fractional minutes (23:30 to 07:45) -> 8.25 hours', () => {
    const hours = calculateHoursWorked('23:30', '07:45');
    assert(hours === 8.25, `Expected 8.25 hours, got ${hours}`);
  });

  await runTest('ShiftLogic', 'Hours worked: Identical check-in and check-out (08:00 to 08:00) -> 0.00 hours', () => {
    const hours = calculateHoursWorked('08:00', '08:00');
    assert(hours === 0.0, `Expected 0.00 hours, got ${hours}`);
  });

  // =========================================================================
  // SECTION 3: ADMIN OVERRIDE FUZZING & INJECTION TESTING
  // =========================================================================
  console.log('\n--- [3. Admin Attendance Override Fuzzing & Injection Tests] ---');

  await runTest('OverrideFuzz', 'Rejects empty reason string: override_reason: ""', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: ''
    });
    assert(res.success === false, 'Empty override_reason must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects whitespace-only reason string: override_reason: "   "', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: '   '
    });
    assert(res.success === false, 'Whitespace-only override_reason must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects short reason string (< 3 chars): override_reason: "ok"', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: 'ok'
    });
    assert(res.success === false, 'Override reason < 3 chars must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects null/undefined override_reason', () => {
    const res1 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present'
    });
    const res2 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: null
    });
    assert(res1.success === false && res2.success === false, 'Null/missing reason must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects invalid status enum: "invalid_status"', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'invalid_status' as any,
      override_reason: 'Medical certificate provided'
    });
    assert(res.success === false, 'Invalid status enum must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects invalid status enum: "PRESNT_TYPO"', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'PRESNT_TYPO' as any,
      override_reason: 'Medical certificate provided'
    });
    assert(res.success === false, 'Typo in status enum must be rejected');
  });

  await runTest('OverrideFuzz', 'Accepts all valid status enums (present, late, half_day, absent, on_duty, excused, on_leave)', () => {
    const validStatuses = ['present', 'late', 'half_day', 'absent', 'on_duty', 'excused', 'on_leave'];
    for (const st of validStatuses) {
      const res = adminAttendanceOverrideSchema.safeParse({
        staff_member_id: 'FAC-2026-001',
        date: '2026-08-25',
        status: st as any,
        override_reason: `Valid status override for ${st}`
      });
      assert(res.success === true, `Status '${st}' must be accepted`);
    }
  });

  await runTest('OverrideFuzz', 'Handles case-insensitivity in status enum ("PRESENT" -> "present")', () => {
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'PRESENT' as any,
      override_reason: 'Case sensitivity check'
    });
    assert(res.success === true && res.data.status === 'present', 'Uppercase status must normalize to lowercase');
  });

  await runTest('OverrideFuzz', 'Rejects invalid date formats (slash or DD-MM-YYYY)', () => {
    const res1 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026/08/25',
      status: 'present',
      override_reason: 'Date format test'
    });
    const res2 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '25-08-2026',
      status: 'present',
      override_reason: 'Date format test'
    });
    assert(res1.success === false && res2.success === false, 'Non YYYY-MM-DD dates must be rejected');
  });

  await runTest('OverrideFuzz', 'Rejects invalid time format in check_in_time ("25:00", "8:00")', () => {
    const res1 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      check_in_time: '25:00',
      override_reason: 'Invalid time test'
    });
    const res2 = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      check_in_time: '8:00', // needs leading zero 08:00
      override_reason: 'Invalid time test'
    });
    assert(res1.success === false && res2.success === false, 'Invalid time formats must be rejected');
  });

  await runTest('OverrideFuzz', 'SQL Injection payload in override_reason is treated as plain string without failure', () => {
    const sqlInjectionPayload = "'; DROP TABLE \"StaffAttendance\"; SELECT * FROM \"Users\" WHERE '1'='1";
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: sqlInjectionPayload
    });
    assert(res.success === true && res.data.override_reason === sqlInjectionPayload, 'SQL injection payload safely parsed as string');
  });

  await runTest('OverrideFuzz', 'XSS payload in override_reason is treated as plain string without failure', () => {
    const xssPayload = "<script>alert('XSS_AUDIT_LOG_ATTACK')</script><img src=x onerror=alert(1)>";
    const res = adminAttendanceOverrideSchema.safeParse({
      staff_member_id: 'FAC-2026-001',
      date: '2026-08-25',
      status: 'present',
      override_reason: xssPayload
    });
    assert(res.success === true && res.data.override_reason === xssPayload, 'XSS payload safely parsed as string');
  });

  // 3.2 Live HTTP API Override Fuzzing
  await runTest('OverrideLiveAPI', 'Live API POST /api/v1/staff-attendance/override rejects missing reason with 400', async () => {
    const res = await apiRequest('/staff-attendance/override', {
      method: 'POST',
      body: {
        staff_member_id: 'FAC-2026-001',
        date: '2026-08-25',
        status: 'present',
        override_reason: ''
      }
    });
    assert(res.status === 400, `Expected 400 status, got ${res.status}`);
    assert(res.body.success === false, 'Expected success: false in envelope');
  });

  await runTest('OverrideLiveAPI', 'Live API POST /api/v1/staff-attendance/override rejects invalid status enum with 400', async () => {
    const res = await apiRequest('/staff-attendance/override', {
      method: 'POST',
      body: {
        staff_member_id: 'FAC-2026-001',
        date: '2026-08-25',
        status: 'NON_EXISTENT_STATUS',
        override_reason: 'Valid audit reason'
      }
    });
    assert(res.status === 400, `Expected 400 status, got ${res.status}`);
    assert(res.body.success === false, 'Expected success: false in envelope');
  });

  // =========================================================================
  // SECTION 4: PERFORMANCE BENCHMARK — 1,000 HAVERSINE CALCULATIONS
  // =========================================================================
  console.log('\n--- [4. Performance Benchmark: 1,000 Haversine Calculations] ---');

  await runTest('PerfBenchmark', 'Benchmark 1,000 Haversine calculations', () => {
    const ITERATIONS = 1000;
    const latBase = 31.5204;
    const lngBase = 74.3587;

    // Generate 1,000 pseudo-random test coordinates
    const testPoints: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < ITERATIONS; i++) {
      // Offset by up to ±0.1 deg (~11 km)
      const latOffset = ((i % 200) - 100) * 0.001;
      const lngOffset = (((i * 7) % 200) - 100) * 0.001;
      testPoints.push({ lat: latBase + latOffset, lng: lngBase + lngOffset });
    }

    // Warm-up JIT
    for (let i = 0; i < 50; i++) {
      calculateDistance(latBase, lngBase, testPoints[i].lat, testPoints[i].lng);
    }

    const startHr = process.hrtime.bigint();
    const durations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = process.hrtime.bigint();
      const d = calculateDistance(latBase, lngBase, testPoints[i].lat, testPoints[i].lng);
      const t1 = process.hrtime.bigint();
      durations.push(Number(t1 - t0));
    }

    const endHr = process.hrtime.bigint();
    const totalNs = Number(endHr - startHr);
    const totalMs = totalNs / 1_000_000;
    const avgNs = totalNs / ITERATIONS;
    const avgMicroSeconds = avgNs / 1000;

    durations.sort((a, b) => a - b);
    const p50Ns = durations[Math.floor(ITERATIONS * 0.5)];
    const p95Ns = durations[Math.floor(ITERATIONS * 0.95)];
    const p99Ns = durations[Math.floor(ITERATIONS * 0.99)];
    const opsPerSec = Math.round((ITERATIONS / totalMs) * 1000);

    console.log(`    Total Iterations   : ${ITERATIONS.toLocaleString()}`);
    console.log(`    Total Time         : ${totalMs.toFixed(3)} ms`);
    console.log(`    Average Latency    : ${avgMicroSeconds.toFixed(3)} µs / calc (${(avgMicroSeconds / 1000).toFixed(6)} ms)`);
    console.log(`    p50 Latency        : ${(p50Ns / 1000).toFixed(3)} µs`);
    console.log(`    p95 Latency        : ${(p95Ns / 1000).toFixed(3)} µs`);
    console.log(`    p99 Latency        : ${(p99Ns / 1000).toFixed(3)} µs`);
    console.log(`    Throughput         : ${opsPerSec.toLocaleString()} ops / sec`);

    // Requirement: < 1s for distance computation (actually < 1ms requirement)
    assert(totalMs < 1000, `Total 1,000 calcs must take < 1,000ms, took ${totalMs}ms`);
    assert(avgMicroSeconds < 500, `Average calc must take < 500µs (0.5ms), took ${avgMicroSeconds}µs`);
    assert(opsPerSec > 10000, `Throughput must exceed 10,000 ops/sec, got ${opsPerSec}`);
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n========================================================================');
  console.log('  CHALLENGER 1: STRESS TEST RESULTS SUMMARY');
  console.log('========================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

  console.log(`  Total Stress Tests : ${total}`);
  console.log(`  Passed             : ${passed}`);
  console.log(`  Failed             : ${failed}`);
  console.log(`  Pass Rate          : ${passRate}%`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error(`  ${failed} STRESS TESTS FAILED:`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(`  - [${r.category}] ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('  ALL STRESS TESTS PASSED EMPIRICALLY WITH 100% SUCCESS.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled fatal error during stress test execution:', err);
  process.exit(1);
});
