import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  LogIn, 
  LogOut, 
  User, 
  Activity, 
  RefreshCw,
  Edit3,
  Calendar,
  Save,
  FileText
} from 'lucide-react';
import { api } from '../api/apiClient';
import { StaffMember, StaffAttendanceRecord, CampusGeofenceConfig } from '../types';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';

interface StaffAttendanceGatewayProps {
  staffList?: StaffMember[];
  onAttendanceUpdated?: (record: StaffAttendanceRecord) => void;
}

export const StaffAttendanceGateway: React.FC<StaffAttendanceGatewayProps> = ({
  staffList = [],
  onAttendanceUpdated
}) => {
  // Filter out terminated / inactive staff members
  const activeStaffList = staffList.filter(s => {
    const st = (s.status || '').toLowerCase();
    return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
  });

  // Tab Mode: 'live' or 'manual'
  const [activeMode, setActiveMode] = useState<'live' | 'manual'>('live');

  // Staff Selection State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(activeStaffList[0]?.id || '');
  const [notes, setNotes] = useState<string>('');

  // Manual Entry Form State
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualCheckInTime, setManualCheckInTime] = useState<string>('08:30');
  const [manualCheckOutTime, setManualCheckOutTime] = useState<string>('16:30');
  const [manualStatus, setManualStatus] = useState<string>('present');
  const [manualReason, setManualReason] = useState<string>('Standard daily shift');

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

  // Update selected staff default when activeStaffList changes
  useEffect(() => {
    if (!selectedStaffId && activeStaffList.length > 0) {
      setSelectedStaffId(activeStaffList[0].id);
    }
  }, [activeStaffList, selectedStaffId]);

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
        console.warn('Error loading geofence config:', err);
      }
    };
    loadGeofence();
    return () => { isMounted = false; };
  }, []);

  // Straight-line distance calculation helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Fetch attendance record for selected staff and date
  const loadStaffAttendanceRecord = async (staffId: string, dateToLoad: string) => {
    if (!staffId) return;
    try {
      const res = await api.getStaffAttendanceRoster({ date: dateToLoad, staff_member_id: staffId });
      const records = Array.isArray(res) ? res : (res?.data || []);
      const matched = records.find((r: any) => (r.staff_member_id === staffId || r.staffMemberId === staffId) && r.status !== 'unmarked');
      setTodayRecord(matched || null);

      // Populate manual form if record exists
      if (matched) {
        if (matched.check_in_time || matched.checkInTime) {
          setManualCheckInTime((matched.check_in_time || matched.checkInTime).slice(0, 5));
        }
        if (matched.check_out_time || matched.checkOutTime) {
          setManualCheckOutTime((matched.check_out_time || matched.checkOutTime).slice(0, 5));
        }
        if (matched.status) {
          setManualStatus(matched.status);
        }
        if (matched.override_reason || matched.notes) {
          setManualReason(matched.override_reason || matched.notes || '');
        }
      }
    } catch {
      // Keep optimistic state if network fails
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffAttendanceRecord(selectedStaffId, activeMode === 'manual' ? manualDate : new Date().toISOString().split('T')[0]);
    }
  }, [selectedStaffId, manualDate, activeMode]);

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

        const campusLat = geofenceConfig.latitude || 31.520370;
        const campusLng = geofenceConfig.longitude || 74.358747;
        const distance = calculateDistance(lat, lng, campusLat, campusLng);
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

  // Staff Check-In Handler
  const handleCheckIn = async () => {
    if (!selectedStaffId) {
      setActionErrorMsg('Please select a staff member first.');
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Shift Arrival Classification
    const shiftStart = geofenceConfig.shift_start_time || '08:00';
    const graceMins = geofenceConfig.grace_period_minutes || 15;
    const [startH, startM] = shiftStart.split(':').map(Number);
    const scheduledStartMins = startH * 60 + startM;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let status: 'present' | 'late' = 'present';
    const lateMinutes = currentMins - (scheduledStartMins + graceMins);
    if (lateMinutes > 0) {
      status = 'late';
    }

    // 1. Optimistic Local State Update (0ms)
    const optimisticRecord: StaffAttendanceRecord = {
      id: `att-${Date.now()}`,
      staff_member_id: selectedStaffId,
      staffMemberId: selectedStaffId,
      staff_name: activeStaffList.find(s => s.id === selectedStaffId)?.full_name || 'Staff Member',
      date: today,
      check_in_time: timeStr,
      checkInTime: timeStr,
      status,
      shift_status: status,
      location_verified: currentGps ? currentGps.isInside : true,
      distance_meters: currentGps ? currentGps.distance : 0,
      gps_tag: currentGps?.isInside ? 'Verified On-Site' : 'On-Site',
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
      ? `Check-In recorded at ${timeStr}. Marked Present (On-Time).`
      : `Check-In recorded at ${timeStr}. Marked Late (${lateMinutes} mins after grace period).`;

    setActionSuccessMsg(successMessage);
    setTimeout(() => setActionSuccessMsg(''), 5000);

    // 2. Silent Background API Sync
    try {
      await api.checkInStaffWithGps({
        staff_id: selectedStaffId,
        staffMemberId: selectedStaffId,
        latitude: currentGps ? currentGps.latitude : geofenceConfig.latitude,
        longitude: currentGps ? currentGps.longitude : geofenceConfig.longitude,
        distance: currentGps ? currentGps.distance : 0,
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
    if (!selectedStaffId) {
      setActionErrorMsg('Please select a staff member first.');
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
    if (todayRecord?.check_in_time || todayRecord?.checkInTime) {
      const inTime = (todayRecord.check_in_time || todayRecord.checkInTime)!.split(':');
      const inMins = Number(inTime[0]) * 60 + Number(inTime[1]);
      const outMins = now.getHours() * 60 + now.getMinutes();
      let diff = outMins - inMins;
      if (diff < 0) diff += 24 * 60;
      totalWorkingHours = Math.round((diff / 60) * 100) / 100;
    }

    // 1. Optimistic Local State Update (0ms)
    const updatedRecord: StaffAttendanceRecord = {
      ...(todayRecord || {
        id: `att-${Date.now()}`,
        staff_member_id: selectedStaffId,
        date: today,
        status: 'present'
      }),
      check_out_time: timeStr,
      checkOutTime: timeStr,
      total_hours: totalWorkingHours,
      totalWorkingHours: totalWorkingHours
    };

    setTodayRecord(updatedRecord);
    if (onAttendanceUpdated) onAttendanceUpdated(updatedRecord);

    const hours = Math.floor(totalWorkingHours);
    const mins = Math.round((totalWorkingHours - hours) * 60);
    setActionSuccessMsg(`Check-Out recorded at ${timeStr}. Total duration: ${hours}h ${mins}m (${totalWorkingHours} hrs).`);
    setTimeout(() => setActionSuccessMsg(''), 5000);

    // 2. Silent Background API Sync
    try {
      await api.checkOutStaffWithGps({
        staff_id: selectedStaffId,
        staffMemberId: selectedStaffId,
        latitude: currentGps ? currentGps.latitude : geofenceConfig.latitude,
        longitude: currentGps ? currentGps.longitude : geofenceConfig.longitude,
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

  // Manual Attendance Entry / Edit Handler
  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setActionErrorMsg('Please select a staff member.');
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    // Calculate total hours
    let hoursWorked = 8.0;
    if (manualCheckInTime && manualCheckOutTime && manualStatus !== 'absent') {
      const [inH, inM] = manualCheckInTime.split(':').map(Number);
      const [outH, outM] = manualCheckOutTime.split(':').map(Number);
      let diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff < 0) diff += 24 * 60;
      hoursWorked = Math.round((diff / 60) * 10) / 10;
    } else if (manualStatus === 'absent') {
      hoursWorked = 0;
    } else if (manualStatus === 'half_day') {
      hoursWorked = 4.0;
    }

    // 1. Optimistic Local State Update (0ms)
    const record: StaffAttendanceRecord = {
      id: todayRecord?.id || `att-manual-${Date.now()}`,
      staff_member_id: selectedStaffId,
      staffMemberId: selectedStaffId,
      staff_name: activeStaffList.find(s => s.id === selectedStaffId)?.full_name || 'Staff Member',
      date: manualDate,
      check_in_time: manualStatus === 'absent' ? null : `${manualCheckInTime}:00`,
      checkInTime: manualStatus === 'absent' ? null : `${manualCheckInTime}:00`,
      check_out_time: manualStatus === 'absent' ? null : `${manualCheckOutTime}:00`,
      checkOutTime: manualStatus === 'absent' ? null : `${manualCheckOutTime}:00`,
      status: manualStatus as any,
      shift_status: manualStatus as any,
      location_verified: true,
      distance_meters: 0,
      gps_tag: 'Admin Override',
      total_hours: hoursWorked,
      totalWorkingHours: hoursWorked,
      isOverridden: true,
      admin_override: true,
      override_reason: manualReason,
      notes: manualReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTodayRecord(record);
    if (onAttendanceUpdated) onAttendanceUpdated(record);

    setActionSuccessMsg(`Attendance for ${record.staff_name} on ${manualDate} updated successfully as ${manualStatus.toUpperCase()} (${hoursWorked} hrs).`);
    setTimeout(() => setActionSuccessMsg(''), 5000);

    // 2. Silent Background API Sync
    try {
      await api.overrideStaffAttendance({
        staff_member_id: selectedStaffId,
        date: manualDate,
        status: manualStatus,
        check_in_time: manualStatus === 'absent' ? undefined : `${manualCheckInTime}:00`,
        check_out_time: manualStatus === 'absent' ? undefined : `${manualCheckOutTime}:00`,
        override_reason: manualReason,
        notes: manualReason
      });
    } catch (err: any) {
      console.error('Error in overrideStaffAttendance API:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedStaff = activeStaffList.find(s => s.id === selectedStaffId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Shift Clock & Status Header */}
      <div
        style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: '18px 22px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Staff Check-In & Check-Out
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
              Record employee check-in/out or manually log and edit staff attendance
            </p>
          </div>
        </div>

        {/* Live Digital Clock Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '6px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Clock size={16} color="#10B981" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF', letterSpacing: 0.5 }}>
              {currentTimeStr}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              Shift: {geofenceConfig.shift_start_time || '08:00'} - {geofenceConfig.shift_end_time || '16:00'} (Grace: {geofenceConfig.grace_period_minutes || 15}m)
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 8, 
          background: '#FFFFFF', 
          padding: '6px 8px', 
          borderRadius: 12, 
          border: '1.5px solid #E2E8F0',
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('live')}
          style={{
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            border: 'none',
            background: activeMode === 'live' ? '#0F172A' : 'transparent',
            color: activeMode === 'live' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease'
          }}
        >
          <LogIn size={14} />
          Live Check-In / Check-Out
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          style={{
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            border: 'none',
            background: activeMode === 'manual' ? '#0F172A' : 'transparent',
            color: activeMode === 'manual' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease'
          }}
        >
          <Edit3 size={14} />
          Manual Entry & Edit (Admin)
        </button>
      </div>

      {/* Feedback Toast */}
      {actionSuccessMsg && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#065F46',
            fontSize: 12.5,
            fontWeight: 600
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
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#991B1B',
            fontSize: 12.5,
            fontWeight: 600
          }}
        >
          <AlertTriangle size={16} color="#EF4444" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Mode 1: Live Check-In / Out Portal */}
      {activeMode === 'live' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>

          
          {/* Card 1: Staff Identification & Quick Action */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
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
                <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Staff Member Selection
                </h3>
                <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0 0' }}>
                  Select active staff member for on-site arrival / departure
                </p>
              </div>
            </div>

            {/* Staff Selector (Terminated excluded) */}
            {activeStaffList.length > 0 ? (
              <ModernSelect
                label="Active Staff Member"
                required
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={activeStaffList.map(s => ({
                  value: s.id,
                  label: `${s.full_name || s.fullName} (${s.staff_id || s.staffId}) - ${s.designation || 'Staff'}`,
                  badge: s.status
                }))}
                zIndex={1000}
              />
            ) : (
              <div style={{ fontSize: 12, color: '#64748B', padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                No active staff members found.
              </div>
            )}

            {/* Selected Staff Profile Card */}
            {selectedStaff && (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  border: '1.5px solid #E2E8F0',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13
                    }}
                  >
                    {(selectedStaff.full_name || selectedStaff.fullName || 'S').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {selectedStaff.full_name || selectedStaff.fullName}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
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

            {/* Optional Remarks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Duty Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Regular on-site duty"
                style={{
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>

            {/* Action Buttons: Check-In & Check-Out */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isProcessing || !selectedStaffId}
                style={{
                  borderRadius: 8,
                  height: 38,
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <LogIn size={15} />
                {isProcessing ? 'Saving...' : 'Mark Check-In'}
              </button>

              <button
                type="button"
                onClick={handleCheckOut}
                disabled={isProcessing || !selectedStaffId}
                style={{
                  borderRadius: 8,
                  height: 38,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease'
                }}
              >
                <LogOut size={15} />
                {isProcessing ? 'Saving...' : 'Mark Check-Out'}
              </button>
            </div>
          </div>

          {/* Card 2: Today's Recorded Status & On-Site Location */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid #E2E8F0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
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
                  <Activity size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Today's Roster Status
                  </h3>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0 0' }}>
                    Real-time arrival, departure, and verified working duration
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={isAcquiringGps}
                style={{
                  borderRadius: 8,
                  height: 30,
                  padding: '0 10px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: 11.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: isAcquiringGps ? 'wait' : 'pointer'
                }}
              >
                <Navigation size={12} className={isAcquiringGps ? 'animate-spin' : ''} />
                {isAcquiringGps ? 'Checking GPS...' : 'Check Location'}
              </button>
            </div>

            {/* Current Today Record Card */}
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Current Status
                </span>
                <span
                  style={{
                    textTransform: 'uppercase', 
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    background: todayRecord?.status === 'present' ? '#DCFCE7' : (todayRecord?.status === 'late' ? '#FEF3C7' : '#E2E8F0'),
                    color: todayRecord?.status === 'present' ? '#166534' : (todayRecord?.status === 'late' ? '#92400E' : '#334155')
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 8, fontSize: 12 }}>
                <span style={{ color: '#64748B' }}>Total Duration:</span>
                <strong style={{ color: '#0F172A' }}>
                  {todayRecord?.total_hours ? `${todayRecord.total_hours} hrs` : '--'}
                </strong>
              </div>
            </div>

            {/* GPS Location Status Feedback */}
            {currentGps ? (
              <div
                style={{
                  background: currentGps.isInside ? '#F0FDF4' : '#FFFBEB',
                  border: `1.5px solid ${currentGps.isInside ? '#BBF7D0' : '#FDE68A'}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} color={currentGps.isInside ? '#16A34A' : '#D97706'} />
                  <span style={{ fontWeight: 600, color: currentGps.isInside ? '#166534' : '#92400E' }}>
                    {currentGps.isInside ? 'Location Verified On-Site' : 'Off-Site Location'}
                  </span>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                  {currentGps.distance.toFixed(1)}m away
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', padding: '6px 0' }}>
                On-site verification configured ({geofenceConfig.radius_meters}m campus boundary)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Manual Attendance Entry & Edit (Admin / Manager Mode) */}
      {activeMode === 'manual' && (
        <form onSubmit={handleSaveManualAttendance}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1.5px solid #E2E8F0',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Manual Attendance Entry & Override
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                    Log or edit staff attendance date, timings, and category
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {/* Staff Member */}
              <div>
                <ModernSelect
                  label="Staff Member"
                  required
                  value={selectedStaffId}
                  onChange={setSelectedStaffId}
                  options={activeStaffList.map(s => ({
                    value: s.id,
                    label: `${s.full_name || s.fullName} (${s.staff_id || s.staffId})`,
                    badge: s.status
                  }))}
                  zIndex={1000}
                />
              </div>

              {/* Attendance Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Attendance Date <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <ModernDatePicker
                  value={manualDate}
                  onChange={setManualDate}
                />
              </div>

              {/* Status Selector */}
              <div>
                <ModernSelect
                  label="Attendance Status"
                  required
                  value={manualStatus}
                  onChange={setManualStatus}
                  options={[
                    { value: 'present', label: 'Present (On-Time)' },
                    { value: 'late', label: 'Late Arrival' },
                    { value: 'half_day', label: 'Half-Day' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused / Approved Leave' },
                    { value: 'on_duty', label: 'On Duty / Official Assignment' }
                  ]}
                  zIndex={900}
                />
              </div>
            </div>

            {/* Timings Row (Disabled if Absent) */}
            {manualStatus !== 'absent' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color="#64748B" /> Arrival Time <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={manualCheckInTime}
                    onChange={e => setManualCheckInTime(e.target.value)}
                    required
                    style={{
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      padding: '8px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color="#64748B" /> Departure Time <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={manualCheckOutTime}
                    onChange={e => setManualCheckOutTime(e.target.value)}
                    required
                    style={{
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      padding: '8px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Override Reason / Remarks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Audit Reason / Remarks <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={manualReason}
                onChange={e => setManualReason(e.target.value)}
                required
                placeholder="e.g. Approved official field duty / Manual correction"
                style={{
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>

            {/* Submit Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  borderRadius: 8,
                  height: 38,
                  padding: '0 22px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Save size={14} />
                {isProcessing ? 'Saving...' : 'Save Attendance Record'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default StaffAttendanceGateway;
