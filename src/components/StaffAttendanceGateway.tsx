import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  LogIn, 
  LogOut, 
  User, 
  Activity, 
  RefreshCw,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { api } from '../api/apiClient';
import { StaffMember, StaffAttendanceRecord, CampusGeofenceConfig } from '../types';
import { ModernSelect } from './ModernSelect';

interface StaffAttendanceGatewayProps {
  staffList?: StaffMember[];
  onAttendanceUpdated?: (record: StaffAttendanceRecord) => void;
}

export const StaffAttendanceGateway: React.FC<StaffAttendanceGatewayProps> = ({
  staffList = [],
  onAttendanceUpdated
}) => {
  // Staff Selection State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [notes, setNotes] = useState<string>('');

  // Geofence Config State
  const [geofenceConfig, setGeofenceConfig] = useState<CampusGeofenceConfig>({
    latitude: 31.520370,
    longitude: 74.358747,
    radius_meters: 150,
    shift_start_time: '08:00',
    shift_end_time: '16:00',
    grace_period_minutes: 15,
    is_active: true
  });

  // Current Geolocation State
  const [currentGps, setCurrentGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    distance: number;
    isInside: boolean;
    acquiredAt: Date;
  } | null>(null);

  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');

  // Action State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [actionErrorMsg, setActionErrorMsg] = useState<string>('');
  const [todayRecord, setTodayRecord] = useState<StaffAttendanceRecord | null>(null);

  // Time & Clock state for real-time live clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selected staff default when staffList changes
  useEffect(() => {
    if (!selectedStaffId && staffList.length > 0) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  // Load geofence settings on mount
  useEffect(() => {
    let isMounted = true;
    const loadGeofence = async () => {
      try {
        const config = await api.getGeofenceConfig();
        if (config && isMounted) {
          setGeofenceConfig({
            latitude: Number(config.latitude || 31.520370),
            longitude: Number(config.longitude || 74.358747),
            radius_meters: Number(config.radius_meters || config.radius || 150),
            shift_start_time: config.shift_start_time || config.shiftStartTime || '08:00',
            shift_end_time: config.shift_end_time || config.shiftEndTime || '16:00',
            grace_period_minutes: Number(config.grace_period_minutes ?? config.gracePeriodMinutes ?? 15),
            is_active: config.is_active !== undefined ? config.is_active : true
          });
        }
      } catch (err) {
        console.warn('Error loading geofence config for gateway:', err);
      }
    };
    loadGeofence();
    return () => { isMounted = false; };
  }, []);

  // Haversine calculation helper
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Fetch today's attendance for selected staff member
  const loadStaffTodayRecord = async (staffId: string) => {
    if (!staffId) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await api.getStaffAttendanceRoster({ date: today, staff_member_id: staffId });
      const records = Array.isArray(res) ? res : (res?.data || []);
      const matched = records.find((r: any) => (r.staff_member_id === staffId || r.staffMemberId === staffId) && r.status !== 'unmarked');
      setTodayRecord(matched || null);
    } catch {
      // Keep optimistic state if network fails
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffTodayRecord(selectedStaffId);
    }
  }, [selectedStaffId]);

  // Acquire Live GPS
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsAcquiringGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        const distance = calculateHaversine(lat, lng, geofenceConfig.latitude, geofenceConfig.longitude);
        const radius = geofenceConfig.radius_meters || 150;
        const isInside = distance <= radius;

        setCurrentGps({
          latitude: lat,
          longitude: lng,
          accuracy,
          distance,
          isInside,
          acquiredAt: new Date()
        });
        setIsAcquiringGps(false);
      },
      (err) => {
        setIsAcquiringGps(false);
        setGpsError(`GPS Error: ${err.message || 'Permission denied or timed out'}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Evaluate shift status (Present vs Late)
  const evaluateArrivalStatus = (): { status: 'present' | 'late'; lateMinutes: number } => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (geofenceConfig.shift_start_time || '08:00').split(':').map(Number);
    const shiftStartMins = startH * 60 + startM;
    const graceMins = geofenceConfig.grace_period_minutes ?? 15;
    const thresholdMins = shiftStartMins + graceMins;

    if (currentMins <= thresholdMins) {
      return { status: 'present', lateMinutes: 0 };
    } else {
      return { status: 'late', lateMinutes: currentMins - thresholdMins };
    }
  };

  // Staff Check-In Handler
  const handleCheckIn = async () => {
    if (!selectedStaffId) {
      setActionErrorMsg('Please select a staff member.');
      return;
    }

    if (!currentGps) {
      setActionErrorMsg('Please acquire device GPS location before checking in.');
      return;
    }

    if (geofenceConfig.is_active && !currentGps.isInside) {
      setActionErrorMsg(`Off-site check-in blocked: You are ${currentGps.distance.toFixed(1)}m away from campus perimeter (${geofenceConfig.radius_meters}m limit).`);
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const { status, lateMinutes } = evaluateArrivalStatus();

    const selectedStaff = staffList.find(s => s.id === selectedStaffId);

    // 1. Optimistic Local State Update (0ms)
    const optimisticRecord: StaffAttendanceRecord = {
      id: todayRecord?.id || `att-${Date.now()}`,
      staff_member_id: selectedStaffId,
      staffMemberId: selectedStaffId,
      staff_id: selectedStaff?.staff_id,
      staff_name: selectedStaff?.full_name,
      staffMember: selectedStaff,
      designation: selectedStaff?.designation,
      date: today,
      check_in_time: timeStr,
      checkInTime: timeStr,
      check_out_time: null,
      checkOutTime: null,
      status: status,
      shift_status: status,
      location_verified: currentGps.isInside,
      locationVerified: currentGps.isInside,
      distance_meters: currentGps.distance,
      checkInDistanceMeters: currentGps.distance,
      checkInLatitude: currentGps.latitude,
      checkInLongitude: currentGps.longitude,
      verificationMode: 'verified_gps',
      gps_tag: currentGps.isInside ? 'Verified On-Site' : 'Off-Site',
      total_hours: 0,
      totalWorkingHours: 0,
      isOverridden: false,
      admin_override: false,
      notes: notes.trim() || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    setTodayRecord(optimisticRecord);
    if (onAttendanceUpdated) onAttendanceUpdated(optimisticRecord);

    const successMessage = status === 'present'
      ? `Check-In successful at ${timeStr}. Marked Present (On-Time within perimeter).`
      : `Check-In successful at ${timeStr}. Marked Late (${lateMinutes} mins after grace threshold).`;

    setActionSuccessMsg(successMessage);
    setTimeout(() => setActionSuccessMsg(''), 5000);

    // 2. Silent Background API Sync
    try {
      await api.checkInStaffWithGps({
        staff_id: selectedStaffId,
        staffMemberId: selectedStaffId,
        latitude: currentGps.latitude,
        longitude: currentGps.longitude,
        distance: currentGps.distance,
        notes: notes.trim() || undefined,
        date: today,
        check_in_time: timeStr
      });
    } catch (err: any) {
      console.error('Error in background check-in API:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Staff Check-Out Handler
  const handleCheckOut = async () => {
    if (!selectedStaffId || !todayRecord) {
      setActionErrorMsg('No check-in record found for today. Please check in first.');
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Calculate duration
    let totalWorkingHours = 8.0;
    if (todayRecord.check_in_time || todayRecord.checkInTime) {
      const inTime = (todayRecord.check_in_time || todayRecord.checkInTime)!.split(':');
      const inMins = Number(inTime[0]) * 60 + Number(inTime[1]);
      const outMins = now.getHours() * 60 + now.getMinutes();
      let diff = outMins - inMins;
      if (diff < 0) diff += 24 * 60;
      totalWorkingHours = Math.round((diff / 60) * 100) / 100;
    }

    // 1. Optimistic Local State Update (0ms)
    const updatedRecord: StaffAttendanceRecord = {
      ...todayRecord,
      check_out_time: timeStr,
      checkOutTime: timeStr,
      total_hours: totalWorkingHours,
      totalWorkingHours: totalWorkingHours
    };

    setTodayRecord(updatedRecord);
    if (onAttendanceUpdated) onAttendanceUpdated(updatedRecord);

    const hours = Math.floor(totalWorkingHours);
    const mins = Math.round((totalWorkingHours - hours) * 60);
    setActionSuccessMsg(`Check-Out recorded at ${timeStr}. Total working duration: ${hours}h ${mins}m (${totalWorkingHours} hrs).`);
    setTimeout(() => setActionSuccessMsg(''), 5000);

    // 2. Silent Background API Sync
    try {
      await api.checkOutStaffWithGps({
        staff_id: selectedStaffId,
        staffMemberId: selectedStaffId,
        latitude: currentGps ? currentGps.latitude : undefined,
        longitude: currentGps ? currentGps.longitude : undefined,
        notes: notes.trim() || undefined,
        date: today,
        check_out_time: timeStr
      });
    } catch (err: any) {
      console.error('Error in background check-out API:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Live Digital Shift Clock & Status Header */}
      <div
        style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: '20px 24px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}
          >
            <Activity size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Staff Geolocation Attendance Gateway
            </h2>
            <p style={{ fontSize: 12.5, color: '#94A3B8', margin: '4px 0 0 0' }}>
              Live GPS perimeter capture & shift arrival classification
            </p>
          </div>
        </div>

        {/* Live Digital Clock Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <Clock size={18} color="#10B981" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF', letterSpacing: 1 }}>
              {currentTimeStr}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
              Shift: {geofenceConfig.shift_start_time || '08:00'} - {geofenceConfig.shift_end_time || '16:00'} (Grace: {geofenceConfig.grace_period_minutes || 15}m)
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#065F46',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={16} color="#10B981" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#991B1B',
            fontSize: 13,
            fontWeight: 700
          }}
        >
          <AlertTriangle size={16} color="#EF4444" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        
        {/* Left Column: Staff Identification & Check-In Action Console */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}
            >
              <User size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Staff Member Console
              </h3>
              <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                Select staff identity and capture departure / arrival
              </p>
            </div>
          </div>

          {/* Staff Member Selector */}
          {staffList.length > 0 && (
            <ModernSelect
              label="Staff Member / Employee"
              required
              value={selectedStaffId}
              onChange={setSelectedStaffId}
              options={staffList.map(s => ({
                value: s.id,
                label: `${s.full_name || s.fullName} (${s.staff_id || s.staffId}) - ${s.designation || 'Staff'}`,
                badge: s.status
              }))}
              zIndex={1000}
            />
          )}

          {/* Selected Staff Profile Card */}
          {selectedStaff && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1.5px solid #E2E8F0',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {(selectedStaff.full_name || selectedStaff.fullName || 'S').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                    {selectedStaff.full_name || selectedStaff.fullName}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    {selectedStaff.designation || 'Faculty'} &bull; {selectedStaff.phone}
                  </div>
                </div>
              </div>

              <span
                style={{
                  background: '#E2E8F0',
                  color: '#334155',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
              >
                {selectedStaff.staff_id || selectedStaff.staffId}
              </span>
            </div>
          )}

          {/* Today's Status Overview Pill */}
          <div
            style={{
              background: todayRecord?.check_in_time || todayRecord?.checkInTime ? '#F0FDF4' : '#FFFBEB',
              border: `1.5px solid ${todayRecord?.check_in_time || todayRecord?.checkInTime ? '#BBF7D0' : '#FDE68A'}`,
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Today's Roster Record
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: todayRecord?.status === 'present' ? '#DCFCE7' : (todayRecord?.status === 'late' ? '#FEF3C7' : '#E2E8F0'),
                  color: todayRecord?.status === 'present' ? '#166534' : (todayRecord?.status === 'late' ? '#92400E' : '#334155'),
                  textTransform: 'uppercase'
                }}
              >
                {todayRecord ? (todayRecord.status || 'Marked') : 'Not Checked In'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Arrival Time</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                  {todayRecord?.check_in_time || todayRecord?.checkInTime || '--:--'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Departure Time</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                  {todayRecord?.check_out_time || todayRecord?.checkOutTime || '--:--'}
                </strong>
              </div>
            </div>

            {todayRecord?.total_hours ? (
              <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 700, borderTop: '1px dashed #BBF7D0', paddingTop: 6 }}>
                Duration Recorded: {todayRecord.total_hours} hrs
              </div>
            ) : null}
          </div>

          {/* Optional Remarks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Check-In Notes / Duty Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Morning assembly duty"
              style={{
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none'
              }}
            />
          </div>

          {/* Action Buttons: Check-In & Check-Out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4 }}>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={isProcessing || !currentGps || (geofenceConfig.is_active && !currentGps?.isInside)}
              style={{
                borderRadius: 12,
                height: 44,
                border: 'none',
                background: (!currentGps || (geofenceConfig.is_active && !currentGps?.isInside)) ? '#94A3B8' : '#10B981',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: (!currentGps || (geofenceConfig.is_active && !currentGps?.isInside)) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
            >
              <LogIn size={16} />
              {isProcessing ? 'Processing...' : 'Mark Check-In'}
            </button>

            <button
              type="button"
              onClick={handleCheckOut}
              disabled={isProcessing || !todayRecord?.check_in_time}
              style={{
                borderRadius: 12,
                height: 44,
                border: '1.5px solid #CBD5E1',
                background: todayRecord?.check_in_time ? '#0F172A' : '#F1F5F9',
                color: todayRecord?.check_in_time ? '#FFFFFF' : '#94A3B8',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: todayRecord?.check_in_time ? 'pointer' : 'not-allowed',
                boxShadow: todayRecord?.check_in_time ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none',
                transition: 'background-color 0.15s ease'
              }}
            >
              <LogOut size={16} />
              {isProcessing ? 'Processing...' : 'Mark Check-Out'}
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time GPS Radar & Perimeter Distance Verification */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}
              >
                <Compass size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Live Geolocation Haversine Radar
                </h3>
                <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                  Distance computation vs campus coordinates
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcquireGps}
              disabled={isAcquiringGps}
              style={{
                borderRadius: 9999,
                height: 34,
                padding: '0 14px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#2563EB',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: isAcquiringGps ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={12} className={isAcquiringGps ? 'animate-spin' : ''} />
              {isAcquiringGps ? 'Acquiring...' : 'Refresh GPS'}
            </button>
          </div>

          {/* GPS Error Callout */}
          {gpsError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#991B1B',
                fontSize: 12
              }}
            >
              <AlertTriangle size={15} color="#EF4444" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Current GPS State Display */}
          {currentGps ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Status Pill Card */}
              <div
                style={{
                  background: currentGps.isInside ? '#ECFDF5' : '#FEF2F2',
                  border: `1.5px solid ${currentGps.isInside ? '#10B981' : '#EF4444'}`,
                  borderRadius: 14,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {currentGps.isInside ? (
                      <CheckCircle2 size={20} color="#10B981" />
                    ) : (
                      <AlertTriangle size={20} color="#EF4444" />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: currentGps.isInside ? '#065F46' : '#991B1B'
                      }}
                    >
                      {currentGps.isInside ? 'Within Campus Perimeter' : 'Outside Campus Perimeter'}
                    </span>
                  </div>

                  <span
                    style={{
                      background: currentGps.isInside ? '#D1FAE5' : '#FEE2E2',
                      color: currentGps.isInside ? '#065F46' : '#991B1B',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}
                  >
                    {currentGps.distance.toFixed(1)}m away
                  </span>
                </div>

                <p style={{ fontSize: 12, color: currentGps.isInside ? '#047857' : '#B91C1C', margin: 0 }}>
                  {currentGps.isInside
                    ? `Device is within the allowable ${geofenceConfig.radius_meters}m boundary. Check-in is fully authorized.`
                    : `You are ${(currentGps.distance - (geofenceConfig.radius_meters || 150)).toFixed(1)}m beyond the allowable ${geofenceConfig.radius_meters}m perimeter. Move closer to the campus center to check in.`}
                </p>
              </div>

              {/* Coordinates Grid */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 14,
                  border: '1.5px solid #E2E8F0',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  fontSize: 12
                }}
              >
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Captured Latitude</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                    {currentGps.latitude.toFixed(6)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Captured Longitude</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                    {currentGps.longitude.toFixed(6)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>GPS Accuracy</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                    ±{Math.round(currentGps.accuracy || 0)}m
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Campus Target</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                    {geofenceConfig.latitude.toFixed(4)}, {geofenceConfig.longitude.toFixed(4)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1.5px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <Navigation size={32} color="#94A3B8" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  GPS Location Not Yet Captured
                </div>
                <p style={{ fontSize: 11.5, color: '#64748B', margin: '4px 0 0 0' }}>
                  Click below to acquire real-time device coordinates and calculate distance to campus.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={isAcquiringGps}
                style={{
                  borderRadius: 9999,
                  height: 38,
                  padding: '0 18px',
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isAcquiringGps ? 'wait' : 'pointer'
                }}
              >
                <Navigation size={13} />
                {isAcquiringGps ? 'Acquiring GPS...' : 'Acquire Device Location'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendanceGateway;
