import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Info,
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/apiClient';
import { CampusGeofenceConfig } from '../types';

interface CampusGeofenceSettingsProps {
  onConfigSaved?: (config: CampusGeofenceConfig) => void;
}

export const CampusGeofenceSettings: React.FC<CampusGeofenceSettingsProps> = ({ onConfigSaved }) => {
  // Geofence & Center Coordinates State
  const [campusName, setCampusName] = useState<string>('Main Academic Campus');
  const [latitude, setLatitude] = useState<number>(31.520370);
  const [longitude, setLongitude] = useState<number>(74.358747);
  const [radiusMeters, setRadiusMeters] = useState<number>(150);
  
  // Shift Timing & 5-State Policy Thresholds State
  const [shiftStartTime, setShiftStartTime] = useState<string>('08:00');
  const [shiftEndTime, setShiftEndTime] = useState<string>('16:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(15);
  const [halfDayLateCutoffMins, setHalfDayLateCutoffMins] = useState<number>(90);
  const [halfDayMinHours, setHalfDayMinHours] = useState<number>(4.0);
  const [absentMinHours, setAbsentMinHours] = useState<number>(2.0);
  const [enforceGeofence, setEnforceGeofence] = useState<boolean>(true);

  // Status & Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>('');
  const [showInfoExplainer, setShowInfoExplainer] = useState<boolean>(false);

  // Live GPS Distance Test Simulator State
  const [testLat, setTestLat] = useState<string>('31.520500');
  const [testLng, setTestLng] = useState<string>('74.358900');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    inside: boolean;
    distance_meters: number;
    allowable_radius: number;
    formatted_distance: string;
    message: string;
  } | null>(null);

  // Load existing geofence settings on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const data = await api.getGeofenceConfig();
        if (data && isMounted) {
          if (data.campus_name || data.campusName) setCampusName(data.campus_name || data.campusName || 'Main Campus');
          if (data.latitude !== undefined) setLatitude(Number(data.latitude));
          if (data.longitude !== undefined) setLongitude(Number(data.longitude));
          const rad = data.radius_meters !== undefined ? data.radius_meters : (data.radius !== undefined ? data.radius : 150);
          setRadiusMeters(Number(rad));
          if (data.shift_start_time || data.shiftStartTime) setShiftStartTime(data.shift_start_time || data.shiftStartTime || '08:00');
          if (data.shift_end_time || data.shiftEndTime) setShiftEndTime(data.shift_end_time || data.shiftEndTime || '16:00');
          if (data.grace_period_minutes !== undefined || data.gracePeriodMinutes !== undefined) {
            setGracePeriodMinutes(Number(data.grace_period_minutes ?? data.gracePeriodMinutes ?? 15));
          }
          if (data.half_day_late_cutoff_minutes !== undefined) {
            setHalfDayLateCutoffMins(Number(data.half_day_late_cutoff_minutes));
          }
          if (data.half_day_min_hours !== undefined) {
            setHalfDayMinHours(Number(data.half_day_min_hours));
          }
          if (data.absent_min_hours !== undefined) {
            setAbsentMinHours(Number(data.absent_min_hours));
          }
          if (data.is_active !== undefined) setEnforceGeofence(Boolean(data.is_active));
        }
      } catch (err: any) {
        console.warn('Could not load geofence settings, using defaults:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  // Frontend Haversine calculation helper
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Run live test simulation
  const handleRunTest = async (testL?: number, testG?: number) => {
    const targetTestLat = testL !== undefined ? testL : parseFloat(testLat);
    const targetTestLng = testG !== undefined ? testG : parseFloat(testLng);

    if (isNaN(targetTestLat) || isNaN(targetTestLng)) {
      setTestResult({
        inside: false,
        distance_meters: 0,
        allowable_radius: radiusMeters,
        formatted_distance: '0m',
        message: 'Please provide valid latitude and longitude decimal numbers.'
      });
      return;
    }

    const dist = calculateHaversine(targetTestLat, targetTestLng, latitude, longitude);
    const isInside = dist <= radiusMeters;
    const formatted = dist < 1000 ? `${dist.toFixed(1)}m` : `${(dist / 1000).toFixed(2)}km`;

    const localResult = {
      inside: isInside,
      distance_meters: dist,
      allowable_radius: radiusMeters,
      formatted_distance: formatted,
      message: isInside
        ? `Location is within allowable campus perimeter (${formatted} <= ${radiusMeters}m). Check-in permitted.`
        : `Location is outside campus perimeter by ${(dist - radiusMeters).toFixed(1)}m (${formatted} > ${radiusMeters}m). Check-in blocked.`
    };
    setTestResult(localResult);

    try {
      await api.testGeofenceLocation({
        latitude: targetTestLat,
        longitude: targetTestLng,
        campus_lat: latitude,
        campus_lng: longitude,
        radius_meters: radiusMeters
      });
    } catch {
      // local calculation is authoritative
    }
  };

  // Detect Device GPS via browser Geolocation API
  const handleDetectDeviceGps = (applyAsCampusCoords: boolean = false) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const detectedLat = Number(position.coords.latitude.toFixed(6));
        const detectedLng = Number(position.coords.longitude.toFixed(6));

        if (applyAsCampusCoords) {
          setLatitude(detectedLat);
          setLongitude(detectedLng);
          setSaveSuccessMsg(`Acquired GPS coordinates: ${detectedLat}, ${detectedLng}. Remember to save configuration.`);
          setTimeout(() => setSaveSuccessMsg(''), 6000);
        } else {
          setTestLat(detectedLat.toString());
          setTestLng(detectedLng.toString());
          handleRunTest(detectedLat, detectedLng);
        }
        setIsDetectingGps(false);
      },
      error => {
        setIsDetectingGps(false);
        setSaveErrorMsg(`GPS Acquisition error (${error.code}): ${error.message}`);
        setTimeout(() => setSaveErrorMsg(''), 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Form Submit Handler
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    const payload = {
      campus_name: campusName,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      shift_start_time: shiftStartTime,
      shift_end_time: shiftEndTime,
      grace_period_minutes: gracePeriodMinutes,
      half_day_late_cutoff_minutes: halfDayLateCutoffMins,
      half_day_min_hours: halfDayMinHours,
      absent_min_hours: absentMinHours,
      is_active: enforceGeofence
    };

    try {
      const updated = await api.saveGeofenceConfig(payload);
      setSaveSuccessMsg('Campus geofence and multi-status attendance policy saved successfully.');
      if (onConfigSaved && updated) {
        onConfigSaved(updated);
      }
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save geofence configuration.');
      setTimeout(() => setSaveErrorMsg(''), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  const radiusPresets = [50, 100, 150, 250];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Top Banner Header */}
      <div 
        style={{ 
          background: '#0F172A', 
          borderRadius: 16, 
          padding: '20px 24px', 
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#10B981'
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Campus Geofence & Multi-Status Attendance Policy
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0 0' }}>
              Configure physical boundaries, shift hours, and rules for Present, Late, Half-Day, Absent, and Leave.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => handleDetectDeviceGps(true)}
            disabled={isDetectingGps}
            style={{
              borderRadius: 9999,
              height: 38,
              padding: '0 16px',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isDetectingGps ? 'wait' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Navigation size={14} color="#10B981" />
            {isDetectingGps ? 'Acquiring GPS...' : 'Detect Device GPS'}
          </button>
        </div>
      </div>

      {/* Toast Feedback Alerts */}
      {saveSuccessMsg && (
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
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
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
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          
          {/* Card 1: Physical Campus Coordinates & Radius */}
          <div 
            style={{ 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1.5px solid #E2E8F0', 
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
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
                <MapPin size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Campus Coordinates & Perimeter
                </h3>
                <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                  Target center point for geofenced employee check-in verification
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Campus Name / Branch Label <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={campusName}
                onChange={e => setCampusName(e.target.value)}
                required
                placeholder="e.g. Main Academic Campus"
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Latitude (Dec Deg) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
                  required
                  placeholder="31.520370"
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0F172A',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Longitude (Dec Deg) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
                  required
                  placeholder="74.358747"
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0F172A',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Radius Selector & Preset Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Geofence Radius: <span style={{ color: '#0F172A', fontWeight: 800 }}>{radiusMeters} meters</span>
                </label>
              </div>

              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={radiusMeters}
                onChange={e => setRadiusMeters(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#0F172A', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                {radiusPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRadiusMeters(preset)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      background: radiusMeters === preset ? '#0F172A' : '#F8FAFC',
                      color: radiusMeters === preset ? '#FFFFFF' : '#475569',
                      border: '1.5px solid',
                      borderColor: radiusMeters === preset ? '#0F172A' : '#E2E8F0',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            {/* Geofence Enforcement Mode Toggle */}
            <div 
              style={{ 
                background: '#F8FAFC', 
                borderRadius: 12, 
                border: '1.5px solid #E2E8F0', 
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} color={enforceGeofence ? '#10B981' : '#94A3B8'} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                    Strict Geofence Enforcement
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    {enforceGeofence ? 'Strictly block off-site check-ins outside perimeter' : 'Allow off-site check-in with Remote tag'}
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={enforceGeofence}
                onChange={e => setEnforceGeofence(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: '#10B981',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Card 2: Shift Timings & Multi-State Policy Engine */}
          <div 
            style={{ 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1.5px solid #E2E8F0', 
              padding: '20px 22px',
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
                  <Clock size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Shift Timings & Attendance Rules
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                    Configurable thresholds for on-time, late, half-day, and absence calculations
                  </p>
                </div>
              </div>
            </div>

            {/* Shift Window Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Shift Start Time <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={e => setShiftStartTime(e.target.value)}
                  required
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Shift End Time <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={e => setShiftEndTime(e.target.value)}
                  required
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Clean Minimalist Policy Rule Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
              {/* Rule 1: Present */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-green" style={{ fontWeight: 700 }}>
                      Present
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>On-Time Arrival Grace</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Arrivals within grace window from shift start ({shiftStartTime || '08:00'})
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={gracePeriodMinutes}
                    onChange={e => setGracePeriodMinutes(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 76, height: 32, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 8px', fontSize: 13, fontWeight: 600, textAlign: 'center', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', minWidth: 32 }}>mins</span>
                </div>
              </div>

              {/* Rule 2: Late Arrival */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-amber" style={{ fontWeight: 700 }}>
                      Late
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Grace to Late Cutoff</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    From {gracePeriodMinutes}m up to maximum late threshold
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <input
                    type="number"
                    min="20"
                    max="240"
                    value={halfDayLateCutoffMins}
                    onChange={e => setHalfDayLateCutoffMins(parseInt(e.target.value, 10) || 90)}
                    style={{ width: 76, height: 32, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 8px', fontSize: 13, fontWeight: 600, textAlign: 'center', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', minWidth: 32 }}>mins</span>
                </div>
              </div>

              {/* Rule 3: Half-Day */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                      Half-Day
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Arrival &gt; {halfDayLateCutoffMins}m / Min Hours</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Calculates 0.5 unexcused absence deduction unit
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={halfDayMinHours}
                    onChange={e => setHalfDayMinHours(parseFloat(e.target.value) || 4.0)}
                    style={{ width: 76, height: 32, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 8px', fontSize: 13, fontWeight: 600, textAlign: 'center', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', minWidth: 32 }}>hrs</span>
                </div>
              </div>

              {/* Rule 4: Absent */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-red" style={{ fontWeight: 700 }}>
                      Absent
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>No Check-In / Below Min Hours</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Calculates 1.0 unexcused absence deduction unit
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="6"
                    value={absentMinHours}
                    onChange={e => setAbsentMinHours(parseFloat(e.target.value) || 2.0)}
                    style={{ width: 76, height: 32, borderRadius: 8, border: '1.5px solid #CBD5E1', padding: '0 8px', fontSize: 13, fontWeight: 600, textAlign: 'center', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', minWidth: 32 }}>hrs</span>
                </div>
              </div>

              {/* Rule 5: Approved Leave */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-gray" style={{ fontWeight: 700 }}>
                      Excused Leave
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Official Approved Leave</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Exempted from payroll pro-rata absence deductions (0 deduction)
                  </div>
                </div>
                <span className="badge badge-green" style={{ fontWeight: 700 }}>
                  0 Deduction
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Card 3: Interactive Perimeter Tester & GPS Distance Calculation */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            borderRadius: 16, 
            border: '1.5px solid #E2E8F0', 
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
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
                <MapPin size={16} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    GPS Distance & Perimeter Verification
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                    Verify test coordinates against configured campus boundary
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoExplainer(prev => !prev)}
                  title="How does GPS Perimeter Verification work?"
                  style={{
                    border: 'none',
                    background: showInfoExplainer ? '#0F172A' : '#F1F5F9',
                    color: showInfoExplainer ? '#FFFFFF' : '#475569',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <Info size={13} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDetectDeviceGps(false)}
              disabled={isDetectingGps}
              style={{
                borderRadius: 8,
                height: 34,
                padding: '0 14px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
            >
              <Navigation size={13} color="#2563EB" />
              Test Live Device Location
            </button>
          </div>

          {/* Info Explainer Banner */}
          {showInfoExplainer && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#334155',
                fontSize: 12.5,
                lineHeight: 1.5
              }}
            >
              <Info size={16} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: 2 }}>How GPS Perimeter Verification Works:</strong>
                The system computes the exact straight-line distance (in meters) between the staff member's mobile GPS device and the institution's center coordinates. If the distance is within the allowed radius (e.g. {radiusMeters}m), attendance is marked as <strong style={{ color: '#166534' }}>Verified On-Site</strong>. Attempts outside the perimeter are flagged or blocked.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Test Coordinate: Latitude
              </label>
              <input
                type="number"
                step="any"
                value={testLat}
                onChange={e => setTestLat(e.target.value)}
                placeholder="31.520500"
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Test Coordinate: Longitude
              </label>
              <input
                type="number"
                step="any"
                value={testLng}
                onChange={e => setTestLng(e.target.value)}
                placeholder="74.358900"
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleRunTest()}
              style={{
                height: 38,
                borderRadius: 8,
                border: '1.5px solid #0F172A',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Activity size={14} /> Calculate Distance
            </button>
          </div>

          {/* Test Result Visual Status Pill */}
          {testResult && (
            <div 
              style={{ 
                background: testResult.inside ? '#ECFDF5' : '#FEF2F2', 
                border: `1.5px solid ${testResult.inside ? '#10B981' : '#EF4444'}`, 
                borderRadius: 12, 
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {testResult.inside ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <AlertTriangle size={20} color="#EF4444" />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: testResult.inside ? '#065F46' : '#991B1B' }}>
                    {testResult.inside ? 'Within Perimeter - Check-In Permitted' : 'Outside Perimeter - Check-In Blocked'}
                  </div>
                  <div style={{ fontSize: 11.5, color: testResult.inside ? '#047857' : '#B91C1C' }}>
                    {testResult.message}
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  background: testResult.inside ? '#D1FAE5' : '#FEE2E2', 
                  color: testResult.inside ? '#065F46' : '#991B1B', 
                  borderRadius: 8, 
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}
              >
                Distance: {testResult.formatted_distance} / {radiusMeters}m
              </div>
            </div>
          )}
        </div>

        {/* Form Submission Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              borderRadius: 8,
              height: 38,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Save size={15} />
            {isSaving ? 'Saving...' : 'Save Geofence Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampusGeofenceSettings;
