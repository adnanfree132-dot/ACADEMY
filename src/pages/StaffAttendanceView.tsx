import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw, 
  Download, 
  MoreVertical, 
  Edit3, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  Globe, 
  Lock, 
  UserCheck,
  MapPin,
  Compass,
  ListFilter
} from 'lucide-react';
import { StaffMember, StaffAttendanceRecord, StaffType } from '../types';
import { api } from '../api/apiClient';
import { ModernSelect } from '../components/ModernSelect';
import { ModernDatePicker } from '../components/ModernDatePicker';
import { AdminAttendanceOverrideModal } from '../components/AdminAttendanceOverrideModal';
import { CampusGeofenceSettings } from '../components/CampusGeofenceSettings';
import { exportToCSV } from '../utils/csvExporter';

export const StaffAttendanceView: React.FC = () => {
  // Active Navigation Sub-Tab State: Attendance Roster and Campus Geofence Settings
  const [activeTab, setActiveTab] = useState<'roster' | 'geofence'>('roster');

  // Calendar Date State (defaults to current local date YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [rosterRecords, setRosterRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffTypeId, setSelectedStaffTypeId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // 3-Dot Action Popover State
  const [openMenuStaffId, setOpenMenuStaffId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<StaffAttendanceRecord | null>(null);

  // Toast Feedback State
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Time Format Setting (Default: 12-Hour format)
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(() => {
    try {
      return (localStorage.getItem('attendance_time_format') as '12h' | '24h') || '12h';
    } catch {
      return '12h';
    }
  });

  // Format timestamp in 12h (08:30 AM) or 24h (08:30) format
  const formatRosterTime = (timeStr: string | null | undefined, format: '12h' | '24h' = '12h') => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const rawH = parseInt(parts[0], 10);
    const rawM = parseInt(parts[1], 10);
    if (isNaN(rawH) || isNaN(rawM)) return timeStr;

    const minStr = rawM < 10 ? `0${rawM}` : `${rawM}`;

    if (format === '24h') {
      const h24Str = rawH < 10 ? `0${rawH}` : `${rawH}`;
      return `${h24Str}:${minStr}`;
    }

    // 12-hour format with AM / PM
    const period = rawH >= 12 ? 'PM' : 'AM';
    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;
    const h12Str = h12 < 10 ? `0${h12}` : `${h12}`;
    return `${h12Str}:${minStr} ${period}`;
  };

  // Read Current User for RBAC Check
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : { id: 'admin-id', role: 'admin', fullName: 'Academy Admin' };
    } catch {
      return { id: 'admin-id', role: 'admin', fullName: 'Academy Admin' };
    }
  }, []);

  // Check if current user has permission to edit / mark staff attendance
  const hasAttendanceAccess = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    // Admin, Principal, Manager, HR roles have full attendance management rights
    if (role === 'admin' || role === 'superadmin' || role === 'principal' || role === 'hr') {
      return true;
    }
    // Granular permissions check if present
    if (currentUser.permissions) {
      if (Array.isArray(currentUser.permissions)) {
        const p = currentUser.permissions.find(
          (perm: any) => perm.module_key === 'staff_attendance' || perm.module === 'attendance'
        );
        if (p && (p.access_level === 'manage' || p.access_level === 'write' || p.access_level === 'edit' || p.access_level === 'editable')) {
          return true;
        }
      } else if (typeof currentUser.permissions === 'object') {
        const lvl = currentUser.permissions.attendance || currentUser.permissions.staff_attendance;
        if (lvl === 'editable' || lvl === 'manage' || lvl === 'write') {
          return true;
        }
      }
    }
    return false;
  }, [currentUser]);

  // Dismiss 3-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuStaffId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load Staff Types & Staff List
  const fetchStaffAndTypes = async () => {
    try {
      const [staffData, typesData] = await Promise.all([
        api.getStaffList().catch(() => []),
        api.getStaffTypes().catch(() => [])
      ]);
      if (Array.isArray(staffData) && staffData.length > 0) setStaffList(staffData);
      if (Array.isArray(typesData) && typesData.length > 0) setStaffTypes(typesData);
      return { staffData: Array.isArray(staffData) ? staffData : [], typesData: Array.isArray(typesData) ? typesData : [] };
    } catch (err) {
      console.warn('Error loading staff metadata:', err);
      return { staffData: [], typesData: [] };
    }
  };

  // Load Attendance Roster for Selected Date
  const fetchDailyRoster = async (dateStr: string) => {
    try {
      setIsLoading(true);
      const res = await api.getStaffAttendanceRoster({
        date: dateStr,
        staff_type_id: selectedStaffTypeId !== 'all' ? selectedStaffTypeId : undefined
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      if (data && data.length > 0) {
        setRosterRecords(data);
        return;
      }
      // If API returned empty array (e.g. initial load or network retry), fallback to active staff list:
      let currentList = staffList;
      if (!currentList || currentList.length === 0) {
        const fetched = await api.getStaffList().catch(() => []);
        if (Array.isArray(fetched) && fetched.length > 0) {
          currentList = fetched;
          setStaffList(fetched);
        }
      }
      const activeList = (currentList || []).filter(s => {
        const st = (s.status || '').toLowerCase();
        return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
      });
      if (activeList.length > 0) {
        const fallback: StaffAttendanceRecord[] = activeList.map(staff => ({
          id: `att-${staff.id}-${dateStr}`,
          staff_member_id: staff.id,
          staffMemberId: staff.id,
          staff_id: staff.staff_id,
          staff_name: staff.full_name,
          designation: staff.designation,
          department: staff.staffType?.name || 'Staff',
          phone: staff.phone,
          date: dateStr,
          status: 'unmarked',
          status_tag: 'Not Checked In',
          total_hours: 0,
          totalWorkingHours: 0,
          isOverridden: false,
          admin_override: false,
          staffMember: staff,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        setRosterRecords(fallback);
      } else {
        setRosterRecords([]);
      }
    } catch (err) {
      console.warn('Could not load daily roster from API, synthesizing from staff list:', err);
      // Fallback synthesis from active staff list
      let currentList = staffList;
      if (!currentList || currentList.length === 0) {
        const fetched = await api.getStaffList().catch(() => []);
        if (Array.isArray(fetched) && fetched.length > 0) {
          currentList = fetched;
          setStaffList(fetched);
        }
      }
      const activeList = (currentList || []).filter(s => {
        const st = (s.status || '').toLowerCase();
        return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
      });
      const fallback: StaffAttendanceRecord[] = activeList.map(staff => ({
        id: `att-${staff.id}-${dateStr}`,
        staff_member_id: staff.id,
        staffMemberId: staff.id,
        staff_id: staff.staff_id,
        staff_name: staff.full_name,
        designation: staff.designation,
        department: staff.staffType?.name || 'Staff',
        phone: staff.phone,
        date: dateStr,
        status: 'unmarked',
        status_tag: 'Not Checked In',
        total_hours: 0,
        totalWorkingHours: 0,
        isOverridden: false,
        admin_override: false,
        staffMember: staff,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setRosterRecords(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStaffAndTypes();
  }, []);

  // Fetch roster whenever selected date or department changes
  useEffect(() => {
    fetchDailyRoster(selectedDate);
  }, [selectedDate, selectedStaffTypeId]);

  // Instant 0ms Optimistic State Update on Override Modal Save
  const handleSaveOverride = (updatedRecord: StaffAttendanceRecord) => {
    setRosterRecords(prev =>
      prev.map(r => {
        const targetId = updatedRecord.staff_member_id || updatedRecord.staffMemberId;
        const currentId = r.staff_member_id || r.staffMemberId || r.id;
        if (currentId === targetId || r.id === updatedRecord.id) {
          return { ...r, ...updatedRecord };
        }
        return r;
      })
    );

    setFeedbackMsg({
      text: `Attendance for ${updatedRecord.staff_name || 'Staff Member'} saved successfully.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Instant 0ms Quick Check-In
  const handleQuickCheckIn = async (record: StaffAttendanceRecord) => {
    setOpenMenuStaffId(null);
    const staffId = record.staff_member_id || record.staffMemberId || record.id;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const updatedRecord: StaffAttendanceRecord = {
      ...record,
      check_in_time: timeStr,
      checkInTime: timeStr,
      status: 'present',
      status_tag: 'Checked In',
      isOverridden: true,
      admin_override: true
    };

    // 1. Instant 0ms local state reflection
    setRosterRecords(prev =>
      prev.map(r => {
        const currentId = r.staff_member_id || r.staffMemberId || r.id;
        return currentId === staffId ? updatedRecord : r;
      })
    );

    setFeedbackMsg({
      text: `Quick Check-In recorded for ${record.staff_name || 'Staff Member'} at ${timeStr.slice(0, 5)}.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMsg(null), 4000);

    // 2. Silent Background API Sync
    try {
      await api.overrideStaffAttendance({
        staff_member_id: staffId,
        date: selectedDate,
        status: 'present',
        check_in_time: timeStr,
        check_out_time: record.check_out_time || undefined,
        verification_mode: 'admin_override',
        override_reason: 'Quick Check-In by Admin'
      });
    } catch (err) {
      console.warn('Background check-in sync error:', err);
    }
  };

  // Instant 0ms Quick Check-Out
  const handleQuickCheckOut = async (record: StaffAttendanceRecord) => {
    setOpenMenuStaffId(null);
    const staffId = record.staff_member_id || record.staffMemberId || record.id;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Calculate working hours
    let hoursWorked = 8.0;
    if (record.check_in_time || record.checkInTime) {
      const inTime = (record.check_in_time || record.checkInTime)!.split(':');
      const inMins = Number(inTime[0]) * 60 + Number(inTime[1]);
      const outMins = now.getHours() * 60 + now.getMinutes();
      let diff = outMins - inMins;
      if (diff < 0) diff += 24 * 60;
      hoursWorked = Math.round((diff / 60) * 10) / 10;
    }

    const updatedRecord: StaffAttendanceRecord = {
      ...record,
      check_out_time: timeStr,
      checkOutTime: timeStr,
      total_hours: hoursWorked,
      totalWorkingHours: hoursWorked,
      isOverridden: true,
      admin_override: true
    };

    // 1. Instant 0ms local state reflection
    setRosterRecords(prev =>
      prev.map(r => {
        const currentId = r.staff_member_id || r.staffMemberId || r.id;
        return currentId === staffId ? updatedRecord : r;
      })
    );

    setFeedbackMsg({
      text: `Quick Check-Out recorded for ${record.staff_name || 'Staff Member'} at ${timeStr.slice(0, 5)} (${hoursWorked} hrs).`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMsg(null), 4000);

    // 2. Silent Background API Sync
    try {
      await api.overrideStaffAttendance({
        staff_member_id: staffId,
        date: selectedDate,
        status: record.status !== 'unmarked' ? record.status : 'present',
        check_in_time: record.check_in_time || undefined,
        check_out_time: timeStr,
        verification_mode: 'admin_override',
        override_reason: 'Quick Check-Out by Admin'
      });
    } catch (err) {
      console.warn('Background check-out sync error:', err);
    }
  };

  // Open Override Modal for Target Record
  const handleOpenOverrideModal = (record: StaffAttendanceRecord) => {
    setOpenMenuStaffId(null);
    setSelectedRecordForOverride(record);
    setOverrideModalOpen(true);
  };

  // Filtered Roster by Search Query and Status
  const filteredRoster = useMemo(() => {
    return rosterRecords.filter(item => {
      const staffName = item.staff_name || item.staffMember?.full_name || '';
      const staffCode = item.staff_id || item.staffMember?.staff_id || '';
      const designation = item.designation || item.staffMember?.designation || '';
      const phone = item.phone || item.staffMember?.phone || '';
      const dept = item.department || item.staffMember?.staffType?.name || '';

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        staffName.toLowerCase().includes(query) ||
        staffCode.toLowerCase().includes(query) ||
        designation.toLowerCase().includes(query) ||
        dept.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        item.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rosterRecords, searchQuery, selectedStatusFilter]);

  // Dynamic KPI Metrics directly computed from current roster
  const totalStaffCount = rosterRecords.length;
  const presentCount = rosterRecords.filter(r => r.status === 'present').length;
  const lateCount = rosterRecords.filter(r => r.status === 'late').length;
  const halfDayCount = rosterRecords.filter(r => r.status === 'half_day').length;
  const absentCount = rosterRecords.filter(r => r.status === 'absent').length;
  const excusedCount = rosterRecords.filter(r => ['excused', 'on_leave', 'on_duty'].includes(r.status)).length;
  const unmarkedCount = rosterRecords.filter(r => r.status === 'unmarked' || !r.status).length;
  const checkedInCount = rosterRecords.filter(r => !!(r.check_in_time || r.checkInTime)).length;
  const verifiedOnSiteCount = rosterRecords.filter(r => r.location_verified && !r.admin_override).length;

  // Export Roster to CSV
  const handleExportCSV = () => {
    const filename = `Staff_Attendance_${selectedDate}`;
    const exportData = filteredRoster.map(r => ({
      StaffID: r.staff_id || r.staffMember?.staff_id || '',
      FullName: r.staff_name || r.staffMember?.full_name || '',
      Designation: r.designation || r.staffMember?.designation || '',
      Department: r.department || r.staffMember?.staffType?.name || '',
      Phone: r.phone || r.staffMember?.phone || '',
      Date: r.date || selectedDate,
      CheckIn: formatRosterTime(r.check_in_time || r.checkInTime, timeFormat),
      CheckOut: formatRosterTime(r.check_out_time || r.checkOutTime, timeFormat),
      WorkingHours: r.total_hours || r.totalWorkingHours || 0,
      Status: (r.status || 'unmarked').toUpperCase(),
      Verification: r.gps_tag || (r.location_verified ? 'Verified On-Site' : 'Off-Site'),
      AdminOverride: r.admin_override ? 'Yes' : 'No',
      OverrideReason: r.override_reason || ''
    }));
    exportToCSV(filename, exportData);
  };

  // Semantic Status Pill Helper
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span
            style={{
              background: '#ECFDF5',
              color: '#065F46',
              border: '1.5px solid #A7F3D0',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <CheckCircle2 size={13} color="#10B981" /> Present
          </span>
        );
      case 'late':
        return (
          <span
            style={{
              background: '#FFFBEB',
              color: '#92400E',
              border: '1.5px solid #FDE68A',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={13} color="#F59E0B" /> Late
          </span>
        );
      case 'half_day':
        return (
          <span
            style={{
              background: '#EFF6FF',
              color: '#1E40AF',
              border: '1.5px solid #BFDBFE',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={13} color="#3B82F6" /> Half-Day
          </span>
        );
      case 'absent':
        return (
          <span
            style={{
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1.5px solid #FECACA',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <AlertTriangle size={13} color="#EF4444" /> Absent
          </span>
        );
      case 'on_duty':
        return (
          <span
            style={{
              background: '#FDF4FF',
              color: '#7E22CE',
              border: '1.5px solid #F0ABFC',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={13} color="#A855F7" /> On Duty
          </span>
        );
      case 'excused':
      case 'on_leave':
        return (
          <span
            style={{
              background: '#F8FAFC',
              color: '#475569',
              border: '1.5px solid #CBD5E1',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={13} color="#64748B" /> Excused
          </span>
        );
      default:
        return (
          <span
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              border: '1.5px solid #E2E8F0',
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Unmarked
          </span>
        );
    }
  };

  // Verification Badge Helper
  const renderVerificationBadge = (record: StaffAttendanceRecord) => {
    if (record.admin_override) {
      return (
        <span
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A',
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap'
          }}
          title={record.override_reason || 'Admin Override'}
        >
          <ShieldAlert size={11} color="#D97706" /> Admin Override
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
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap'
          }}
        >
          <MapPin size={11} color="#10B981" /> Verified On-Site {dist && `(${dist})`}
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
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap'
          }}
        >
          <AlertTriangle size={11} color="#EF4444" /> Off-Site Check-In
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
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap'
          }}
        >
          <Globe size={11} color="#8B5CF6" /> Remote Check-In
        </span>
      );
    }

    return (
      <span
        style={{
          background: '#F8FAFC',
          color: '#94A3B8',
          padding: '2px 7px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}
      >
        Not Checked In
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Staff Attendance Sub-Navigation Pill Bar */}
      <div
        className="sub-nav-pill-container"
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          padding: '4px',
          display: 'inline-flex',
          gap: 4,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          style={{
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'roster' ? '#0F172A' : 'transparent',
            color: activeTab === 'roster' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'roster') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'roster') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <UserCheck size={14} color={activeTab === 'roster' ? '#FFFFFF' : '#64748B'} />
          Staff Attendance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('geofence')}
          style={{
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            background: activeTab === 'geofence' ? '#0F172A' : 'transparent',
            color: activeTab === 'geofence' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'geofence') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'geofence') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <Compass size={14} color={activeTab === 'geofence' ? '#FFFFFF' : '#64748B'} />
          Campus Geofence Settings
        </button>
      </div>

      {/* Render Subviews */}
      {activeTab === 'geofence' && (
        <CampusGeofenceSettings
          onConfigSaved={() => {
            setFeedbackMsg({ text: 'Campus geofence perimeter and shift configuration updated.', type: 'success' });
          }}
        />
      )}

      {activeTab === 'roster' && (
        <>
          {/* Directory Main Title Header */}
          <div className="directory-header-container">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  Staff Attendance
                </h2>
                <span
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 9999
                  }}
                >
                  {totalStaffCount} Active Staff
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, margin: 0 }}>
                Daily staff attendance, real-time arrival timestamps, GPS location verification and admin records
              </p>
            </div>
          </div>

      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          style={{
            background: feedbackMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1.5px solid ${feedbackMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            borderRadius: 12,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            color: feedbackMsg.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: 13,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 size={16} color="#10B981" />
          ) : (
            <AlertTriangle size={16} color="#EF4444" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* KPI Overview Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Active Staff</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{totalStaffCount}</div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Active Staff Members</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>Present</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{presentCount}</div>
          <span style={{ fontSize: 11, color: '#059669' }}>{verifiedOnSiteCount} On-Site Verified</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>Late Arrivals</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{lateCount}</div>
          <span style={{ fontSize: 11, color: '#B45309' }}>Beyond grace shift</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Absences</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>{absentCount}</div>
          <span style={{ fontSize: 11, color: '#DC2626' }}>Unexcused absences</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Excused / Leave</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#64748B' }}>{excusedCount}</div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Leaves & field duty</span>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Unmarked</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#94A3B8' }}>{unmarkedCount}</div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Pending entry</span>
        </div>
      </div>

      {/* Roster Controls: Calendar Date Picker, Live Search, Department & Status Dropdowns, CSV Export */}
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
          
          {/* Calendar Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Attendance Date:
            </span>
            <div style={{ minWidth: 220 }}>
              <ModernDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                compact
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Time Format Switcher (12-Hour Default / 24-Hour) */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: 2, borderRadius: 8, border: '1.5px solid #CBD5E1' }}>
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('12h');
                  localStorage.setItem('attendance_time_format', '12h');
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontWeight: timeFormat === '12h' ? 800 : 600,
                  borderRadius: 6,
                  border: 'none',
                  background: timeFormat === '12h' ? '#0F172A' : 'transparent',
                  color: timeFormat === '12h' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
              >
                <Clock size={12} color={timeFormat === '12h' ? '#FFFFFF' : '#64748B'} />
                <span>12-Hour (AM/PM)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFormat('24h');
                  localStorage.setItem('attendance_time_format', '24h');
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontWeight: timeFormat === '24h' ? 800 : 600,
                  borderRadius: 6,
                  border: 'none',
                  background: timeFormat === '24h' ? '#0F172A' : 'transparent',
                  color: timeFormat === '24h' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>24-Hour</span>
              </button>
            </div>

            {/* Export CSV Pill Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                borderRadius: 9999,
                height: 36,
                padding: '0 16px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Search Bar + Department Select + Status Select */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 2fr) minmax(180px, 1fr) minmax(180px, 1fr)', gap: 10, alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={15} 
              color="#64748B" 
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, ID, designation, phone..."
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                paddingLeft: 34,
                paddingRight: 12,
                fontSize: 12.5,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.boxShadow = '0 0 0 3.5px rgba(59, 130, 246, 0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#CBD5E1';
                e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
              }}
            />
          </div>

          {/* Department / Staff Type Filter */}
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
              { value: 'excused', label: 'Excused / Leave' },
              { value: 'unmarked', label: 'Unmarked' }
            ]}
            compact
            zIndex={500}
          />
        </div>
      </div>

      {/* Staff Attendance Roster Table */}
      <div 
        className="data-table-container" 
        style={{ 
          background: '#FFFFFF', 
          borderRadius: 14, 
          border: '1.5px solid #E2E8F0', 
          overflow: 'visible',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
        }}
      >
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Staff Member</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Department & Role</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Check-In & Verification</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Check-Out</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Duration</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoster.length > 0 ? (
              filteredRoster.map(item => {
                const staffId = item.staff_member_id || item.staffMemberId || item.id;
                const staffName = item.staff_name || item.staffMember?.full_name || 'Staff Member';
                const staffCode = item.staff_id || item.staffMember?.staff_id || 'STAFF';
                const designation = item.designation || item.staffMember?.designation || 'Staff';
                const dept = item.department || item.staffMember?.staffType?.name || 'Academic';
                const phone = item.phone || item.staffMember?.phone || '';
                const isMenuOpen = openMenuStaffId === staffId;

                return (
                  <tr 
                    key={staffId}
                    style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }}
                  >
                    {/* Staff Member Details */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#0F172A',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12.5,
                            flexShrink: 0
                          }}
                        >
                          {staffName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{staffName}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span 
                              style={{ 
                                fontSize: 11, 
                                color: '#475569', 
                                fontFamily: 'monospace', 
                                background: '#F1F5F9',
                                padding: '1px 5px',
                                borderRadius: 4,
                                fontWeight: 700
                              }}
                            >
                              {staffCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department / Designation */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{designation}</div>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{dept}</span>
                    </td>

                    {/* Check-In & Verification */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span 
                          style={{ 
                            fontFamily: 'monospace', 
                            fontWeight: 700, 
                            color: item.check_in_time || item.checkInTime ? '#0F172A' : '#94A3B8',
                            fontSize: 12.5
                          }}
                        >
                          {formatRosterTime(item.check_in_time || item.checkInTime, timeFormat)}
                        </span>
                        <div>{renderVerificationBadge(item)}</div>
                      </div>
                    </td>

                    {/* Check-Out */}
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          color: item.check_out_time || item.checkOutTime ? '#0F172A' : '#94A3B8',
                          fontSize: 12.5
                        }}
                      >
                        {formatRosterTime(item.check_out_time || item.checkOutTime, timeFormat)}
                      </span>
                    </td>

                    {/* Working Duration */}
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700,
                          color: (item.total_hours || 0) >= 8 ? '#059669' : ((item.total_hours || 0) > 0 ? '#D97706' : '#94A3B8')
                        }}
                      >
                        {(item.total_hours || item.totalWorkingHours || 0) > 0 
                          ? `${item.total_hours || item.totalWorkingHours} hrs`
                          : '--'}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td style={{ padding: '12px 16px' }}>
                      {renderStatusPill(item.status || 'unmarked')}
                    </td>

                    {/* 3-Dot Action Button & Popover */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'inline-block', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuStaffId(isMenuOpen ? null : staffId)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: '1.5px solid #E2E8F0',
                            background: isMenuOpen ? '#0F172A' : '#FFFFFF',
                            color: isMenuOpen ? '#FFFFFF' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            if (!isMenuOpen) {
                              e.currentTarget.style.backgroundColor = '#F8FAFC';
                              e.currentTarget.style.color = '#0F172A';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isMenuOpen) {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = '#E2E8F0';
                            }
                          }}
                          title="Attendance Options"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Glassmorphic 3-Dot Popover Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 36,
                              width: 220,
                              background: '#FFFFFF',
                              borderRadius: 12,
                              border: '1.5px solid #E2E8F0',
                              boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18)',
                              zIndex: 1000,
                              padding: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              textAlign: 'left',
                              animation: 'fadeIn 0.12s ease'
                            }}
                          >
                            {/* RBAC Verification: If authorized show action buttons, otherwise restricted label */}
                            {hasAttendanceAccess ? (
                              <>
                                <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #F1F5F9' }}>
                                  Attendance Actions
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenOverrideModal(item)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <Edit3 size={14} color="#0F172A" />
                                  <span>Mark / Edit Attendance</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickCheckIn(item)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: '#065F46',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ECFDF5'; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <LogIn size={14} color="#10B981" />
                                  <span>Quick Check-In (Now)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickCheckOut(item)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: '#92400E',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFFBEB'; }}
                                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <LogOut size={14} color="#F59E0B" />
                                  <span>Quick Check-Out (Now)</span>
                                </button>
                              </>
                            ) : (
                              <div
                                style={{
                                  padding: '10px',
                                  fontSize: 12,
                                  color: '#64748B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Lock size={14} color="#94A3B8" />
                                <span>Restricted to Admin / Manager</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  <UserCheck size={36} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontWeight: 700, color: '#64748B', fontSize: 14 }}>No staff records matching filter criteria.</div>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Try adjusting your search query, department or status filters.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* 4-Island Floating Modal for Attendance Override & Marking */}
      <AdminAttendanceOverrideModal
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setSelectedRecordForOverride(null);
        }}
        record={selectedRecordForOverride}
        onSaveOverride={handleSaveOverride}
      />
    </div>
  );
};

export default StaffAttendanceView;
