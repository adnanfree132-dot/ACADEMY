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
import { ModernTimePicker } from './ModernTimePicker';
import { StaffAttendanceRecord, AdminAttendanceOverridePayload } from '../types';
import { api } from '../api/apiClient';

interface AdminAttendanceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StaffAttendanceRecord | null;
  onSaveOverride: (updatedRecord: StaffAttendanceRecord) => void;
}

// Inline Time Field Component (eliminates z-index, layer stacking and clipping issues)
const InlineTimeField: React.FC<{
  label: string;
  value: string; // "HH:mm" or ""
  onChange: (val: string) => void;
  allowClear?: boolean;
}> = ({ label, value, onChange, allowClear = true }) => {
  const parseVal = (val: string) => {
    if (!val) return { hour: '', minute: '', period: 'AM' as const };
    const [rawH, rawM] = val.split(':').map(Number);
    if (isNaN(rawH) || isNaN(rawM)) return { hour: '', minute: '', period: 'AM' as const };
    const period = rawH >= 12 ? 'PM' : 'AM';
    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    const mStr = rawM < 10 ? `0${rawM}` : `${rawM}`;
    return { hour: hStr, minute: mStr, period };
  };

  const { hour, minute, period } = parseVal(value);

  const updateTime = (newH: string, newM: string, newP: 'AM' | 'PM') => {
    const hNum = parseInt(newH || '08', 10);
    const mNum = parseInt(newM || '00', 10);
    let h24 = hNum;
    if (newP === 'PM' && h24 < 12) h24 += 12;
    if (newP === 'AM' && h24 === 12) h24 = 0;
    const h24Str = h24 < 10 ? `0${h24}` : `${h24}`;
    const mStr = mNum < 10 ? `0${mNum}` : `${mNum}`;
    onChange(`${h24Str}:${mStr}`);
  };

  const handleSetNow = () => {
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const h24Str = h24 < 10 ? `0${h24}` : `${h24}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    onChange(`${h24Str}:${mStr}`);
  };

  const handleClear = () => {
    onChange('');
  };

  const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleSetNow}
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 6,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Now
          </button>
          {allowClear && value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Styled Theme-Matching Inline Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: 10,
          padding: '4px 8px',
          height: 38,
          boxSizing: 'border-box',
          width: '100%',
          minWidth: 0
        }}
      >
        <Clock size={14} color={value ? '#2563EB' : '#94A3B8'} style={{ flexShrink: 0 }} />

        {/* Hour Select */}
        <select
          value={hour || ''}
          onChange={e => {
            if (!e.target.value) {
              onChange('');
            } else {
              updateTime(e.target.value, minute || '00', (period || 'AM') as 'AM' | 'PM');
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: 12.5,
            fontWeight: 700,
            color: hour ? '#0F172A' : '#94A3B8',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <option value="">--</option>
          {hours.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span style={{ fontWeight: 800, color: '#94A3B8', fontSize: 13, flexShrink: 0 }}>:</span>

        {/* Minute Select */}
        <select
          value={minute || ''}
          onChange={e => {
            if (!e.target.value) {
              onChange('');
            } else {
              updateTime(hour || '08', e.target.value, (period || 'AM') as 'AM' | 'PM');
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            fontSize: 12.5,
            fontWeight: 700,
            color: minute ? '#0F172A' : '#94A3B8',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <option value="">--</option>
          {minutes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM / PM Segmented Toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: 6,
            background: '#F1F5F9',
            padding: 2,
            gap: 2,
            flexShrink: 0
          }}
        >
          {(['AM', 'PM'] as const).map(p => {
            const isSelected = period === p && !!value;
            return (
              <button
                key={p}
                type="button"
                onClick={() => updateTime(hour || '08', minute || '00', p)}
                style={{
                  padding: '2px 6px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  borderRadius: 4,
                  border: 'none',
                  background: isSelected ? '#0F172A' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AdminAttendanceOverrideModal: React.FC<AdminAttendanceOverrideModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaveOverride
}) => {
  if (!isOpen || !record) return null;

  // Form State initialized from target attendance record
  const [status, setStatus] = useState<string>(record.status || 'present');
  const [overrideDate, setOverrideDate] = useState<string>(record.date || new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState<string>(
    record.check_in_time ? record.check_in_time.slice(0, 5) : (record.checkInTime ? record.checkInTime.slice(0, 5) : '08:30')
  );
  // Check-Out defaults to empty string so user can check-in immediately without forcing check-out
  const [checkOutTime, setCheckOutTime] = useState<string>(
    record.check_out_time ? record.check_out_time.slice(0, 5) : (record.checkOutTime ? record.checkOutTime.slice(0, 5) : '')
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    record.override_reason || record.overrideReason || record.notes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Status Options aligned with Dashboard KPI cards
  const statusOptions: ModernSelectOption[] = [
    { value: 'present', label: 'Present', icon: <CheckCircle2 size={14} color="#10B981" /> },
    { value: 'late', label: 'Late Arrival', icon: <Clock size={14} color="#F59E0B" /> },
    { value: 'absent', label: 'Absence / Absent', icon: <AlertTriangle size={14} color="#EF4444" /> },
    { value: 'excused', label: 'Excused / Leave', icon: <FileText size={14} color="#64748B" /> },
    { value: 'half_day', label: 'Half Day', icon: <Clock size={14} color="#3B82F6" /> },
    { value: 'unmarked', label: 'Unmarked', icon: <Clock size={14} color="#94A3B8" /> }
  ];

  // Calculate working hours duration helper (gracefully handles check-in only)
  const calculateDuration = (inTime: string, outTime: string): string => {
    if (!inTime && !outTime) return '--';
    if (inTime && !outTime) return 'In Progress (Checked In)';
    if (!inTime && outTime) return '--';
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return '--';
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins < 0) totalMins += 24 * 60;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hours}h ${mins}m (${(totalMins / 60).toFixed(2)} hrs)`;
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    setIsSubmitting(true);

    const staffId = record.staff_member_id || record.staffMemberId || record.id;
    const effCheckIn = status === 'absent' || status === 'excused' ? null : (checkInTime ? `${checkInTime}:00` : null);
    const effCheckOut = status === 'absent' || status === 'excused' ? null : (checkOutTime ? `${checkOutTime}:00` : null);

    let computedTotalHours = 0;
    if (effCheckIn && effCheckOut) {
      const [inH, inM] = checkInTime.split(':').map(Number);
      const [outH, outM] = checkOutTime.split(':').map(Number);
      let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMins < 0) totalMins += 24 * 60;
      computedTotalHours = Math.round((totalMins / 60) * 100) / 100;
    } else if (status === 'half_day') {
      computedTotalHours = 4.0;
    } else if (status === 'present') {
      computedTotalHours = 8.0;
    }

    const finalReason = overrideReason.trim() || 'Admin manual update';

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
      override_reason: finalReason,
      overrideReason: finalReason,
      verificationMode: 'admin_override',
      gps_tag: 'Admin Entry',
      notes: overrideReason.trim() || null
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
        verification_mode: 'admin_override',
        override_reason: finalReason,
        notes: overrideReason.trim() || undefined
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
          maxWidth: 660,
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
                Mark / Edit Staff Attendance
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Set attendance status, timing, and optional administrative remarks
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
                {designation} &bull; Date: <strong>{overrideDate}</strong>
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
            padding: '20px 24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '74vh',
            overflowY: 'auto',
            overflowX: 'hidden',
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

          {/* Section 1: Status Selection */}
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
            <ModernSelect
              label="Attendance Status"
              required
              value={status}
              onChange={setStatus}
              options={statusOptions}
              zIndex={1100}
            />
          </div>

          {/* Section 2: Timestamp Adjustments */}
          {status !== 'absent' && status !== 'excused' && (
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
                <InlineTimeField
                  label="Check-In Time (Arrival)"
                  value={checkInTime}
                  onChange={setCheckInTime}
                />
                <InlineTimeField
                  label="Check-Out Time (Departure)"
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                />
              </div>
            </div>
          )}

          {/* Section 3: Remarks / Reason */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Remarks / Reason (Optional)
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved leave, field duty, or late arrival explanation"
              style={{
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none'
              }}
            />
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
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCircle2 size={14} color="#10B981" />
            <span>{isSubmitting ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceOverrideModal;
