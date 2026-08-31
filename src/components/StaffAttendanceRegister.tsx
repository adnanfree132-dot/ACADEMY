import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  MapPin, 
  ShieldAlert, 
  Globe, 
  User, 
  Calendar as CalendarIcon, 
  SlidersHorizontal,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';
import { StaffMember, StaffAttendanceRecord, StaffType } from '../types';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { AdminAttendanceOverrideModal } from './AdminAttendanceOverrideModal';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';

interface StaffAttendanceRegisterProps {
  staffList?: StaffMember[];
  staffTypes?: StaffType[];
  onRefreshData?: () => void;
}

export const StaffAttendanceRegister: React.FC<StaffAttendanceRegisterProps> = ({
  staffList = [],
  staffTypes = [],
  onRefreshData
}) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffTypeId, setSelectedStaffTypeId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Attendance Records State
  const [rosterRecords, setRosterRecords] = useState<StaffAttendanceRecord[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<StaffAttendanceRecord | null>(null);

  // Load Daily Roster from backend
  const fetchDailyRoster = async (dateStr: string) => {
    try {
      setIsLoading(true);
      const res = await api.getStaffAttendanceRoster({
        date: dateStr,
        staff_type_id: selectedStaffTypeId !== 'all' ? selectedStaffTypeId : undefined
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setRosterRecords(data);
    } catch (err) {
      console.warn('Could not load daily roster, synthesizing from staff list:', err);
      // Synthesize fallback from active staff list (exclude terminated)
      const activeStaffList = staffList.filter(s => {
        const st = (s.status || '').toLowerCase();
        return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
      });
      const fallback: StaffAttendanceRecord[] = activeStaffList.map(staff => ({
        id: `att-${staff.id}-${dateStr}`,
        staff_member_id: staff.id,
        staffMemberId: staff.id,
        staff_id: staff.staff_id,
        staff_name: staff.full_name,
        staffMember: staff,
        designation: staff.designation,
        department: staff.staffType?.name || 'Staff',
        date: dateStr,
        status: 'unmarked',
        location_verified: false,
        gps_tag: 'Not Checked In',
        total_hours: 0,
        totalWorkingHours: 0,
        isOverridden: false,
        admin_override: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setRosterRecords(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Monthly Matrix Records from backend
  const fetchMonthlyMatrix = async (monthStr: string) => {
    try {
      setIsLoading(true);
      const res = await api.getStaffAttendanceRoster({
        month: monthStr,
        staff_type_id: selectedStaffTypeId !== 'all' ? selectedStaffTypeId : undefined
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setMonthlyRecords(data);
    } catch (err) {
      console.warn('Could not load monthly matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyRoster(selectedDate);
    } else {
      fetchMonthlyMatrix(selectedMonth);
    }
  }, [viewMode, selectedDate, selectedMonth, selectedStaffTypeId]);

  // Handle Optimistic Override Save
  const handleSaveOverride = (updatedRecord: StaffAttendanceRecord) => {
    // 0ms instant optimistic reflection in local daily roster
    setRosterRecords(prev =>
      prev.map(r => (r.staff_member_id === updatedRecord.staff_member_id ? updatedRecord : r))
    );

    // 0ms instant reflection in monthly matrix
    setMonthlyRecords(prev => {
      const idx = prev.findIndex(
        r => r.staff_member_id === updatedRecord.staff_member_id && r.date === updatedRecord.date
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedRecord;
        return next;
      }
      return [...prev, updatedRecord];
    });

    if (onRefreshData) onRefreshData();
  };

  // Filter staff records by search query, department & status
  const filteredDailyRoster = rosterRecords.filter(item => {
    const staffName = item.staff_name || item.staffMember?.full_name || '';
    const staffCode = item.staff_id || item.staffMember?.staff_id || '';
    const designation = item.designation || item.staffMember?.designation || '';

    const matchesSearch =
      !searchQuery ||
      staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      item.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Daily KPI Metrics
  const totalStaffCount = rosterRecords.length;
  const presentCount = rosterRecords.filter(r => r.status === 'present').length;
  const lateCount = rosterRecords.filter(r => r.status === 'late').length;
  const halfDayCount = rosterRecords.filter(r => r.status === 'half_day').length;
  const absentCount = rosterRecords.filter(r => r.status === 'absent').length;
  const onDutyCount = rosterRecords.filter(r => ['on_duty', 'excused', 'on_leave'].includes(r.status)).length;
  const verifiedOnSiteCount = rosterRecords.filter(r => r.location_verified && !r.admin_override).length;
  const overrideCount = rosterRecords.filter(r => r.admin_override).length;

  // Export Daily Roster to CSV
  const handleExportCSV = () => {
    const filename = viewMode === 'daily'
      ? `Staff_Attendance_${selectedDate}`
      : `Staff_Attendance_Matrix_${selectedMonth}`;

    if (viewMode === 'daily') {
      const exportData = filteredDailyRoster.map(r => ({
        StaffID: r.staff_id || r.staffMember?.staff_id || '',
        FullName: r.staff_name || r.staffMember?.full_name || '',
        Designation: r.designation || r.staffMember?.designation || '',
        Department: r.department || '',
        Date: r.date,
        CheckIn: r.check_in_time || r.checkInTime || 'N/A',
        CheckOut: r.check_out_time || r.checkOutTime || 'N/A',
        WorkingHours: r.total_hours || r.totalWorkingHours || 0,
        Status: r.status,
        GpsVerification: r.gps_tag || (r.location_verified ? 'Verified On-Site' : 'Off-Site'),
        AdminOverride: r.admin_override ? 'Yes' : 'No',
        OverrideReason: r.override_reason || ''
      }));
      exportToCSV(filename, exportData);
    } else {
      exportToCSV(filename, monthlyRecords);
    }
  };

  // Helper for rendering verification tags
  const renderVerificationBadge = (record: StaffAttendanceRecord) => {
    if (record.admin_override) {
      return (
        <span
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
          title={record.override_reason || 'Admin Override'}
        >
          <ShieldAlert size={12} color="#D97706" /> Admin Override
        </span>
      );
    }

    if (record.location_verified) {
      const dist = record.distance_meters !== undefined && record.distance_meters !== null
        ? `${Math.round(record.distance_meters)}m`
        : '';
      return (
        <span
          style={{
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <MapPin size={12} color="#10B981" /> Verified On-Site {dist && `(${dist})`}
        </span>
      );
    }

    if (record.check_in_lat !== null && record.check_in_lat !== undefined) {
      return (
        <span
          style={{
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <AlertTriangle size={12} color="#EF4444" /> Off-Site Check-In
        </span>
      );
    }

    if (record.check_in_time || record.checkInTime) {
      return (
        <span
          style={{
            background: '#F5F3FF',
            color: '#6D28D9',
            border: '1px solid #DDD6FE',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Globe size={12} color="#8B5CF6" /> Remote Check-In
        </span>
      );
    }

    return (
      <span
        style={{
          background: '#F1F5F9',
          color: '#64748B',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600
        }}
      >
        Not Checked In
      </span>
    );
  };

  // Helper for rendering status pill
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} color="#10B981" /> Present
          </span>
        );
      case 'late':
        return (
          <span style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#F59E0B" /> Late
          </span>
        );
      case 'half_day':
        return (
          <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#3B82F6" /> Half-Day
          </span>
        );
      case 'absent':
        return (
          <span style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} color="#EF4444" /> Absent
          </span>
        );
      case 'on_duty':
        return (
          <span style={{ background: '#FDF4FF', color: '#7E22CE', border: '1px solid #F0ABFC', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Globe size={12} color="#A855F7" /> On Duty
          </span>
        );
      case 'excused':
      case 'on_leave':
        return (
          <span style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FileText size={12} color="#64748B" /> Excused
          </span>
        );
      default:
        return (
          <span style={{ background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', padding: '3px 9px', borderRadius: 9999, fontSize: 11.5, fontWeight: 600 }}>
            Unmarked
          </span>
        );
    }
  };

  // Generate days in month for Monthly Matrix Grid
  const [matrixYear, matrixMonthNum] = selectedMonth.split('-').map(Number);
  const daysInMonthCount = new Date(matrixYear, matrixMonthNum, 0).getDate();
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  // Group monthly records by staff
  const staffMonthlyMap = new Map<string, Record<number, StaffAttendanceRecord>>();
  monthlyRecords.forEach(rec => {
    const staffId = rec.staff_member_id || rec.staffMemberId;
    if (!staffId) return;
    const day = parseInt(rec.date.split('-')[2], 10);
    if (!staffMonthlyMap.has(staffId)) {
      staffMonthlyMap.set(staffId, {});
    }
    staffMonthlyMap.get(staffId)![day] = rec;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* KPI Overview Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Staff</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{totalStaffCount}</div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Active roster members</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Present Today</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>{presentCount}</div>
          <span style={{ fontSize: 11, color: '#059669' }}>{verifiedOnSiteCount} Verified On-Site</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Late Arrivals</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{lateCount}</div>
          <span style={{ fontSize: 11, color: '#B45309' }}>Beyond grace period</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Absences</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444' }}>{absentCount}</div>
          <span style={{ fontSize: 11, color: '#DC2626' }}>Unexcused absences</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4338CA', textTransform: 'uppercase' }}>Admin Overrides</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6366F1' }}>{overrideCount}</div>
          <span style={{ fontSize: 11, color: '#4F46E5' }}>Audited corrections</span>
        </div>
      </div>

      {/* Control Bar: View Switcher, Date/Month Picker, Filters & CSV Export */}
      <div 
        style={{ 
          background: '#FFFFFF', 
          borderRadius: 14, 
          border: '1.5px solid #E2E8F0', 
          padding: '14px 16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Active Navy Solid Pill Tabs for Register Mode */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 10, gap: 4 }}>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              style={{
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'daily' ? '#0F172A' : 'transparent',
                color: viewMode === 'daily' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color 0.15s ease, color 0.15s ease'
              }}
            >
              <FileText size={13} color={viewMode === 'daily' ? '#FFFFFF' : '#64748B'} />
              Daily Roster
            </button>

            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              style={{
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'monthly' ? '#0F172A' : 'transparent',
                color: viewMode === 'monthly' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background-color 0.15s ease, color 0.15s ease'
              }}
            >
              <CalendarIcon size={13} color={viewMode === 'monthly' ? '#FFFFFF' : '#64748B'} />
              Monthly Matrix
            </button>
          </div>

          {/* Date / Month Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {viewMode === 'daily' ? (
              <div style={{ minWidth: 200 }}>
                <ModernDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  compact
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '6px 12px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                borderRadius: 9999,
                height: 36,
                padding: '0 14px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Bar: Live Search & ModernSelect Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff name or ID..."
              style={{
                width: '100%',
                height: 36,
                borderRadius: 10,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 12,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Department Filter */}
          <ModernSelect
            placeholder="All Departments"
            value={selectedStaffTypeId}
            onChange={setSelectedStaffTypeId}
            options={[
              { value: 'all', label: 'All Departments / Types' },
              ...staffTypes.map(t => ({ value: t.id, label: t.name }))
            ]}
            compact
            zIndex={500}
          />

          {/* Status Filter */}
          <ModernSelect
            placeholder="All Statuses"
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'present', label: 'Present' },
              { value: 'late', label: 'Late' },
              { value: 'half_day', label: 'Half-Day' },
              { value: 'absent', label: 'Absent' },
              { value: 'on_duty', label: 'On Duty' },
              { value: 'excused', label: 'Excused' }
            ]}
            compact
            zIndex={500}
          />
        </div>
      </div>

      {/* View 1: Daily Roster Table */}
      {viewMode === 'daily' && (
        <div className="data-table-container" style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Staff Member</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Department / Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Check-In</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Check-Out</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Working Duration</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Classification</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDailyRoster.length > 0 ? (
                filteredDailyRoster.map(item => {
                  const staffName = item.staff_name || item.staffMember?.full_name || 'Staff Member';
                  const staffCode = item.staff_id || item.staffMember?.staff_id || 'STAFF';
                  const designation = item.designation || item.staffMember?.designation || 'Staff';
                  const dept = item.department || item.staffMember?.staffType?.name || 'Academic';

                  return (
                    <tr 
                      key={item.id || item.staff_member_id}
                      style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }}
                    >
                      {/* Staff Member */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: '#0F172A',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 12
                            }}
                          >
                            {staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{staffName}</div>
                            <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{staffCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department / Designation */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{designation}</div>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{dept}</span>
                      </td>

                      {/* Check-In & Verification */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500, color: item.check_in_time ? '#0F172A' : '#94A3B8' }}>
                            {item.check_in_time || item.checkInTime || '--:--'}
                          </span>
                          <div>{renderVerificationBadge(item)}</div>
                        </div>
                      </td>

                      {/* Check-Out */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 500, color: item.check_out_time ? '#0F172A' : '#94A3B8' }}>
                          {item.check_out_time || item.checkOutTime || '--:--'}
                        </span>
                      </td>

                      {/* Working Duration */}
                      <td style={{ padding: '12px 16px' }}>
                        <span 
                          style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 500,
                            color: (item.total_hours || 0) >= 8 ? '#059669' : ((item.total_hours || 0) > 0 ? '#D97706' : '#94A3B8')
                          }}
                        >
                          {(item.total_hours || item.totalWorkingHours || 0) > 0 
                            ? `${item.total_hours || item.totalWorkingHours} hrs`
                            : '--'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        {renderStatusPill(item.status)}
                      </td>

                      {/* Row Action */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordForOverride(item);
                            setOverrideModalOpen(true);
                          }}
                          style={{
                            borderRadius: 8,
                            height: 32,
                            padding: '0 10px',
                            border: '1.5px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontSize: 11.5,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                        >
                          <Settings size={12} /> Override
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    <FileText size={32} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <strong>No staff attendance records matching active filters for {selectedDate}.</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Monthly Attendance Register Matrix Grid */}
      {viewMode === 'monthly' && (
        <div 
          className="monthly-matrix-container"
          style={{ 
            background: '#FFFFFF', 
            borderRadius: 14, 
            border: '1.5px solid #E2E8F0', 
            overflowX: 'auto',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                <th 
                  style={{ 
                    padding: '10px 14px', 
                    fontWeight: 600, 
                    color: '#475569', 
                    position: 'sticky', 
                    left: 0, 
                    background: '#F8FAFC', 
                    zIndex: 10,
                    textAlign: 'left',
                    minWidth: 160
                  }}
                >
                  Staff Member
                </th>
                {daysArray.map(day => (
                  <th 
                    key={day} 
                    style={{ 
                      padding: '8px 4px', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      color: '#475569', 
                      minWidth: 26
                    }}
                  >
                    {day}
                  </th>
                ))}
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#065F46' }}>P</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#92400E' }}>L</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#991B1B' }}>A</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#0F172A' }}>Hrs</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => {
                const dayMap = staffMonthlyMap.get(staff.id) || {};
                let p = 0, l = 0, a = 0, totalH = 0;

                daysArray.forEach(d => {
                  const rec = dayMap[d];
                  if (rec) {
                    if (rec.status === 'present') p++;
                    else if (rec.status === 'late') l++;
                    else if (rec.status === 'absent') a++;
                    if (rec.total_hours) totalH += rec.total_hours;
                  }
                });

                return (
                  <tr key={staff.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {/* Sticky Employee Name Column */}
                    <td 
                      style={{ 
                        padding: '10px 14px', 
                        position: 'sticky', 
                        left: 0, 
                        background: '#FFFFFF', 
                        zIndex: 5,
                        boxShadow: '2px 0 5px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{staff.full_name}</div>
                      <span style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace' }}>{staff.staff_id}</span>
                    </td>

                    {/* Day Matrix Cells (1 to 31) */}
                    {daysArray.map(day => {
                      const rec = dayMap[day];
                      let cellColor = '#94A3B8';
                      let cellBg = '#F8FAFC';
                      let cellText = '-';

                      if (rec) {
                        if (rec.status === 'present') {
                          cellColor = '#065F46';
                          cellBg = '#DCFCE7';
                          cellText = 'P';
                        } else if (rec.status === 'late') {
                          cellColor = '#92400E';
                          cellBg = '#FEF3C7';
                          cellText = 'L';
                        } else if (rec.status === 'half_day') {
                          cellColor = '#1E40AF';
                          cellBg = '#DBEAFE';
                          cellText = 'HD';
                        } else if (rec.status === 'absent') {
                          cellColor = '#991B1B';
                          cellBg = '#FEE2E2';
                          cellText = 'A';
                        } else if (rec.status === 'on_duty') {
                          cellColor = '#7E22CE';
                          cellBg = '#F3E8FF';
                          cellText = 'OD';
                        } else if (rec.status === 'excused' || rec.status === 'on_leave') {
                          cellColor = '#475569';
                          cellBg = '#E2E8F0';
                          cellText = 'E';
                        }
                      }

                      return (
                        <td 
                          key={day}
                          onClick={() => {
                            const targetDate = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                            setSelectedRecordForOverride(
                              rec || {
                                id: `unmarked-${staff.id}-${targetDate}`,
                                staff_member_id: staff.id,
                                staffMemberId: staff.id,
                                staff_id: staff.staff_id,
                                staff_name: staff.full_name,
                                staffMember: staff,
                                date: targetDate,
                                status: 'unmarked',
                                location_verified: false,
                                isOverridden: false,
                                admin_override: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              }
                            );
                            setOverrideModalOpen(true);
                          }}
                          style={{
                            padding: '6px 2px',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                          title={rec ? `${staff.full_name} (${rec.date}): ${rec.status} ${rec.check_in_time ? `@ ${rec.check_in_time}` : ''}` : `Click to record/override attendance for Day ${day}`}
                        >
                          <span 
                            style={{ 
                              display: 'inline-block',
                              width: 22,
                              height: 22,
                              lineHeight: '22px',
                              borderRadius: 4,
                              background: cellBg,
                              color: cellColor,
                              fontWeight: 600,
                              fontSize: 10
                            }}
                          >
                            {cellText}
                          </span>
                        </td>
                      );
                    })}

                    {/* Monthly Aggregated Totals */}
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#065F46' }}>{p}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#92400E' }}>{l}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#991B1B' }}>{a}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                      {Math.round(totalH * 10) / 10}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Attendance Override Modal */}
      {overrideModalOpen && (
        <AdminAttendanceOverrideModal
          isOpen={overrideModalOpen}
          onClose={() => {
            setOverrideModalOpen(false);
            setSelectedRecordForOverride(null);
          }}
          record={selectedRecordForOverride}
          onSaveOverride={handleSaveOverride}
        />
      )}
    </div>
  );
};

export default StaffAttendanceRegister;
