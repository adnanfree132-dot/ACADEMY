import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  Check, 
  Clock, 
  User, 
  Calendar as CalendarIcon, 
  FileText, 
  AlertTriangle,
  MapPin,
  Globe,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { StaffAttendanceRecord, AdminAttendanceOverridePayload, AttendanceVerificationMode } from '../types';
import { api } from '../api/apiClient';

interface AdminAttendanceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StaffAttendanceRecord | null;
  onSaveOverride: (updatedRecord: StaffAttendanceRecord) => void;
}

export const AdminAttendanceOverrideModal: React.FC<AdminAttendanceOverrideModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveOverride
}) => {
  if (!isOpen || !record) return null;

  // Form State initialized from target attendance record
  const [status, setStatus] = useState<string>(record.status || 'present');
  const [verificationMode, setVerificationMode] = useState<AttendanceVerificationMode>(
    record.verificationMode || 'admin_override'
  );
  const [overrideDate, setOverrideDate] = useState<string>(record.date || new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState<string>(
    record.check_in_time ? record.check_in_time.slice(0, 5) : (record.checkInTime ? record.checkInTime.slice(0, 5) : '08:30')
  );
  const [checkOutTime, setCheckOutTime] = useState<string>(
    record.check_out_time ? record.check_out_time.slice(0, 5) : (record.checkOutTime ? record.checkOutTime.slice(0, 5) : '16:30')
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    record.override_reason || record.overrideReason || ''
  );
  const [notes, setNotes] = useState<string>(record.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Status Dropdown Options
  const statusOptions: ModernSelectOption[] = [
    { value: 'present', label: 'Present (Full Day)', icon: <CheckCircle2 size={14} color="#10B981" /> },
    { value: 'late', label: 'Late Arrival', icon: <Clock size={14} color="#F59E0B" /> },
    { value: 'half_day', label: 'Half-Day Duty', icon: <Clock size={14} color="#3B82F6" /> },
    { value: 'on_duty', label: 'On Duty / Field Work', icon: <Globe size={14} color="#8B5CF6" /> },
    { value: 'excused', label: 'Excused Leave', icon: <FileText size={14} color="#64748B" /> },
    { value: 'absent', label: 'Absent (Unexcused)', icon: <AlertTriangle size={14} color="#EF4444" /> }
  ];

  // Verification Mode Options
  const verificationOptions: ModernSelectOption[] = [
    { value: 'admin_override', label: 'Admin Manual Override', icon: <ShieldAlert size={14} color="#F59E0B" /> },
    { value: 'verified_gps', label: 'Verified GPS Coordinates', icon: <MapPin size={14} color="#10B981" /> },
    { value: 'remote_duty', label: 'Remote / Field Assignment', icon: <Globe size={14} color="#8B5CF6" /> },
    { value: 'biometric_sync', label: 'Biometric System Sync', icon: <Radio size={14} color="#3B82F6" /> }
  ];

  // Calculate working hours duration helper
  const calculateDuration = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return '0h 0m';
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return '0h 0m';
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins < 0) totalMins += 24 * 60;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours}h ${mins}m (${(totalMins / 60).toFixed(2)} hrs)`;
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!overrideReason.trim()) {
      setValidationError('Mandatory audit justification is required for attendance override.');
      return;
    }

    setIsSubmitting(true);

    const staffId = record.staff_member_id || record.staffMemberId || record.id;
    const effCheckIn = status === 'absent' ? null : (checkInTime ? `${checkInTime}:00` : null);
    const effCheckOut = status === 'absent' ? null : (checkOutTime ? `${checkOutTime}:00` : null);

    let computedTotalHours = 0;
    if (effCheckIn && effCheckOut) {
      const [inH, inM] = checkInTime.split(':').map(Number);
      const [outH, outM] = checkOutTime.split(':').map(Number);
      let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMins < 0) totalMins += 24 * 60;
      computedTotalHours = Math.round((totalMins / 60) * 100) / 100;
    } else if (status === 'half_day') {
      computedTotalHours = 4.0;
    } else if (status === 'present' || status === 'on_duty') {
      computedTotalHours = 8.0;
    }

    // 1. Optimistic Local State Reflection (0ms instant update)
    const updatedLocalRecord: StaffAttendanceRecord = {
      ...record,
      status: status as any,
      date: overrideDate,
      check_in_time: effCheckIn,
      checkInTime: effCheckIn,
      check_out_time: effCheckOut,
      checkOutTime: effCheckOut,
      total_hours: computedTotalHours,
      totalWorkingHours: computedTotalHours,
      admin_override: true,
      isOverridden: true,
      override_reason: overrideReason.trim(),
      overrideReason: overrideReason.trim(),
      verificationMode,
      gps_tag: 'Admin Override',
      notes: notes ? notes.trim() : null
    };

    onSaveOverride(updatedLocalRecord);
    onClose();

    // 2. Silent Background API Sync
    try {
      const payload: AdminAttendanceOverridePayload = {
        staff_member_id: staffId,
        date: overrideDate,
        status: status as any,
        check_in_time: effCheckIn || undefined,
        check_out_time: effCheckOut || undefined,
        verification_mode: verificationMode,
        override_reason: overrideReason.trim(),
        notes: notes ? notes.trim() : undefined
      };
      await api.overrideStaffAttendance(payload);
    } catch (err: any) {
      console.error('Error applying attendance override on backend:', err);
    }
  };

  const staffName = record.staff_name || record.staffMember?.full_name || record.staffMember?.fullName || 'Staff Member';
  const staffCode = record.staff_id || record.staffMember?.staff_id || record.staffMember?.staffId || 'STAFF';
  const designation = record.designation || record.staffMember?.designation || 'Faculty';

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="floating-island-container"
        style={{
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card (#0F172A) */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Admin Attendance Override
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Manually adjust timestamps, classification status & log audit justification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Context / Employee Summary Card */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}
            >
              <User size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{staffName}</span>
                <span
                  style={{
                    background: '#E2E8F0',
                    color: '#334155',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                >
                  {staffCode}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                {designation} &bull; Target Date: <strong>{overrideDate}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Current:</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: record.status === 'present' ? '#ECFDF5' : (record.status === 'late' ? '#FEF3C7' : '#FEF2F2'),
                color: record.status === 'present' ? '#065F46' : (record.status === 'late' ? '#92400E' : '#991B1B'),
                textTransform: 'uppercase'
              }}
            >
              {record.status || 'Unmarked'}
            </span>
          </div>
        </div>

        {/* Island 3: Scrollable Form Card (#FFFFFF) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '68vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {validationError && (
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
                fontWeight: 700
              }}
            >
              <AlertTriangle size={15} color="#EF4444" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Classification & Mode */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Attendance Classification & Verification Mode
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ModernSelect
                label="Override Status"
                required
                value={status}
                onChange={setStatus}
                options={statusOptions}
                zIndex={1100}
              />

              <ModernSelect
                label="Verification Mode"
                required
                value={verificationMode}
                onChange={val => setVerificationMode(val as AttendanceVerificationMode)}
                options={verificationOptions}
                zIndex={1100}
              />
            </div>
          </div>

          {/* Section 2: Timestamp Adjustments */}
          {status !== 'absent' && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 14,
                border: '1.5px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Arrival & Departure Timestamps
                </div>
                <div style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 700 }}>
                  Duration: {calculateDuration(checkInTime, checkOutTime)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Check-In Time (Arrival)
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Check-Out Time (Departure)
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
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
            </div>
          )}

          {/* Section 3: Mandatory Audit Trail Logging */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Mandatory Audit Trail Logging <span style={{ color: '#EF4444' }}>*</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Audit Justification / Reason <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Device GPS failure during field seminar. Verified on campus by principal."
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '10px 14px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Additional Administrative Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional internal remarks"
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
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 20px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyOverride}
            disabled={isSubmitting}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: isSubmitting ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Check size={15} /> Apply Override
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceOverrideModal;
