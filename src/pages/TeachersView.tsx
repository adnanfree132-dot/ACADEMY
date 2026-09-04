import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, Batch, Student } from '../types';
import {
  Users,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  Download,
  Settings,
  MoreVertical,
  Layers,
  MessageSquare,
  Search,
  Filter,
  Check,
  Printer,
  UserCheck,
  UserX
} from 'lucide-react';
import { RegisterStaffModal } from '../components/RegisterStaffModal';
import { StaffCredentialSlipModal, StaffCredentialData } from '../components/StaffCredentialSlipModal';
import { StaffTypeManagerModal, StaffTypeItem } from '../components/StaffTypeManagerModal';
import { StaffPermissionsModal } from '../components/StaffPermissionsModal';
import { StaffStatusModal } from '../components/StaffStatusModal';
import { DeleteStaffModal } from '../components/DeleteStaffModal';
import { StaffDetailDrawer } from '../components/StaffDetailDrawer';
import { api } from '../api/apiClient';
import { showToast } from '../lib/toast';
import { removeIdsFromCaches } from '../lib/resourceCache';

interface TeachersViewProps {
  teachers: Teacher[];
  staff?: any[];
  onUpdateStaffList?: (list: any[]) => void;
  batches?: Batch[];
  students?: Student[];
  onOpenCreateModal?: () => void;
  onAddTeacher?: (teacherData: any) => void;
  onDeleteTeacher?: (id: string) => void;
  onEditTeacher?: (teacher: Teacher) => void;
}

const DEFAULT_STAFF_TYPES: StaffTypeItem[] = [
  { id: 'st_faculty', name: 'Faculty', code: 'FAC', description: 'Teaching Faculty & Lecturers', is_system: true, is_active: true },
  { id: 'st_admin', name: 'Admin', code: 'ADM', description: 'Administrative & Front Desk Officers', is_system: true, is_active: true },
  { id: 'st_domestic', name: 'Domestic Staff', code: 'DOM', description: 'Campus Maintenance & Security', is_system: true, is_active: true }
];

// Module-level in-memory cache to guarantee 0ms instant render across tab switches with ZERO numbering jumps
let cachedStaffList: any[] = [];
let cachedStaffTypes: StaffTypeItem[] = DEFAULT_STAFF_TYPES;

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  staff,
  onUpdateStaffList,
  batches = [],
  students = [],
  onOpenCreateModal,
  onAddTeacher,
  onDeleteTeacher,
  onEditTeacher
}) => {
  // Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCredentialSlipOpen, setIsCredentialSlipOpen] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);

  // Active records for modals
  const [activeCredentials, setActiveCredentials] = useState<StaffCredentialData | null>(null);
  const [activeStaffForPermissions, setActiveStaffForPermissions] = useState<any | null>(null);
  const [activeStaffForStatus, setActiveStaffForStatus] = useState<any | null>(null);
  const [selectedStaffForDrawer, setSelectedStaffForDrawer] = useState<any | null>(null);
  const [activeDropdownStaffId, setActiveDropdownStaffId] = useState<string | null>(null);
  const [activeContactStaffId, setActiveContactStaffId] = useState<string | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // Filters & State (Active staff by default)
  const [staffTypes, setStaffTypesState] = useState<StaffTypeItem[]>(cachedStaffTypes);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Instant 0ms initialized staff list from cache / props (no loading effect)
  const [staffList, setStaffListState] = useState<any[]>(() => {
    if (staff && Array.isArray(staff) && staff.length > 0) {
      cachedStaffList = staff;
      return staff;
    }
    if (cachedStaffList.length > 0) {
      return cachedStaffList;
    }
    if (teachers && teachers.length > 0) {
      const initial = teachers.map((t, idx) => ({
        id: t.id,
        staffId: `FAC-2026-${String(idx + 1).padStart(3, '0')}`,
        fullName: t.name,
        name: t.name,
        email: t.email,
        phone: t.phone,
        designation: t.qualification || t.assignedSubjects?.[0] || 'Senior Faculty Lecturer',
        qualification: t.qualification || 'Master of Science',
        role: 'Faculty',
        staffTypeId: 'st_faculty',
        status: 'active',
        assignedBatches: t.assignedBatches || [],
        assignedSubjects: t.assignedSubjects || [],
        baseSalary: 65000,
        paymentMethod: 'Bank Transfer'
      }));
      cachedStaffList = initial;
      return initial;
    }
    return [];
  });

  const setStaffList = (updater: any[] | ((prev: any[]) => any[])) => {
    setStaffListState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cachedStaffList = next;
      if (onUpdateStaffList) onUpdateStaffList(next);
      return next;
    });
  };

  const setStaffTypes = (updater: StaffTypeItem[] | ((prev: StaffTypeItem[]) => StaffTypeItem[])) => {
    setStaffTypesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cachedStaffTypes = next;
      return next;
    });
  };

  // Sync with prop if updated from App parent
  useEffect(() => {
    if (staff && Array.isArray(staff) && staff.length > 0) {
      cachedStaffList = staff;
      setStaffListState(staff);
    }
  }, [staff]);

  // Silent background API synchronization (never resets or flashes the UI)
  useEffect(() => {
    api.getStaffList().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        cachedStaffList = res;
        setStaffListState(res);
        if (onUpdateStaffList) onUpdateStaffList(res);
      }
    }).catch(() => {});

    api.getStaffTypes().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        cachedStaffTypes = res;
        setStaffTypesState(res);
      }
    }).catch(() => {});
  }, []);

  // Close dropdown menu or tools menu when clicking anywhere on the side / outside
  useEffect(() => {
    if (!activeDropdownStaffId && !isToolsMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.staff-card-dropdown-menu') &&
        !target.closest('.table-icon-btn') &&
        !target.closest('.tools-menu-container') &&
        !target.closest('.tools-menu-btn')
      ) {
        setActiveDropdownStaffId(null);
        setIsToolsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeDropdownStaffId, isToolsMenuOpen]);

  // Handle status update (0ms instant optimistic UI reflection)
  const handleStatusUpdated = (updatedStaff: any) => {
    setStaffList(prev => prev.map(s => s.id === updatedStaff.id ? { ...s, ...updatedStaff } : s));
    if (selectedStaffForDrawer && selectedStaffForDrawer.id === updatedStaff.id) {
      setSelectedStaffForDrawer((prev: any) => ({ ...prev, ...updatedStaff }));
    }

    // Silent background API sync
    api.updateStaff(updatedStaff.id, {
      status: updatedStaff.status,
      statusRemarks: updatedStaff.statusRemarks || updatedStaff.status_remarks
    }).catch(err => console.error('Error updating staff status in background:', err));
  };

  // Handle successful registration (0ms instant optimistic & instantly visible)
  const handleRegistrationSuccess = (newStaff: any, credentials: StaffCredentialData) => {
    const formattedStaff = {
      ...newStaff,
      id: newStaff.id || `staff_${Date.now()}`,
      fullName: newStaff.fullName || newStaff.full_name || newStaff.name,
      name: newStaff.fullName || newStaff.full_name || newStaff.name,
      staffId: newStaff.staffId || newStaff.staff_id || credentials.staffId,
      status: (newStaff.status || 'active').toLowerCase(),
      role: newStaff.role || newStaff.staffType?.name || credentials.role || 'Faculty',
      designation: newStaff.designation || 'Staff Member',
      phone: newStaff.phone || credentials.phone,
      email: newStaff.email || credentials.email
    };

    setStaffList(prev => [formattedStaff, ...prev.filter(s => s.id !== formattedStaff.id && s.staffId !== formattedStaff.staffId)]);
    setSelectedStatusFilter('active');
    setSelectedTypeFilter('all');
    setSearchQuery('');
    setActiveCredentials(credentials);
    setIsCredentialSlipOpen(true);
  };

  const handleConfirmDeleteStaff = async (id: string, mode: 'soft' | 'hard') => {
    const target = staffList.find(s => s.id === id);
    const snapshot = staffList;
    const relatedIds = [id, target?.teacher_id, target?.teacherId, target?.user_id, target?.userId].filter(Boolean);

    if (mode === 'hard') {
      removeIdsFromCaches(relatedIds);
      setStaffList(prev => prev.filter(s => s.id !== id && s.teacher_id !== id && s.teacherId !== id));
    } else {
      setStaffList(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, status: 'resigned', statusRemarks: 'Soft Archived via staff directory' }
            : s
        )
      );
    }

    if (selectedStaffForDrawer && selectedStaffForDrawer.id === id) {
      if (mode === 'hard') {
        setSelectedStaffForDrawer(null);
      } else {
        setSelectedStaffForDrawer((prev: any) => ({
          ...prev,
          status: 'resigned',
          statusRemarks: 'Soft Archived via staff directory'
        }));
      }
    }

    try {
      await api.deleteStaff(id, mode);
      showToast(mode === 'hard' ? 'Staff member deleted.' : 'Staff member archived.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not delete this staff member. They were restored.', 'error');
      setStaffList(snapshot);
    }
  };

  // Handle password reset
  const handleResetPassword = async (staff: any) => {
    const tempPassword = `Acad#${Math.floor(1000 + Math.random() * 9000)}`;
    const credData: StaffCredentialData = {
      staffId: staff.staffId || 'STF-001',
      fullName: staff.fullName || staff.name,
      phone: staff.phone,
      email: staff.email,
      role: staff.role || 'Staff',
      designation: staff.designation || 'Staff Member',
      temporaryPassword: tempPassword,
      issuedAt: new Date().toISOString()
    };

    setActiveCredentials(credData);
    setIsCredentialSlipOpen(true);
    setActiveDropdownStaffId(null);

    try {
      await api.resetStaffPassword(staff.id, tempPassword);
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  // Helper to format status badges cleanly
  const getStatusBadge = (statusStr?: string) => {
    const st = (statusStr || 'active').toLowerCase();
    if (st === 'active') return { label: 'Active', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
    if (st === 'probation') return { label: 'Probation', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
    if (st === 'on_leave') return { label: 'On Leave', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' };
    if (st === 'suspended') return { label: 'Suspended', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3' };
    if (st === 'terminated') return { label: 'Terminated', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    if (st === 'inactive' || st === 'resigned') return { label: 'Inactive / Resigned', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    return { label: st, bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
  };

  // Filter staff list with search, role/type, and lifecycle status
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.staffId || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.designation || '').toLowerCase().includes(q) ||
        (s.statusRemarks || s.status_remarks || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 1. Staff Type Filter
      const matchesType = selectedTypeFilter === 'all'
        ? true
        : (s.role || '').toLowerCase() === selectedTypeFilter.toLowerCase() ||
          (s.staffType?.name || '').toLowerCase() === selectedTypeFilter.toLowerCase() ||
          (s.staffTypeId || '') === selectedTypeFilter;

      if (!matchesType) return false;

      // 2. Lifecycle Status Filter (Default active)
      const staffStatus = (s.status || 'active').toLowerCase();
      if (selectedStatusFilter === 'all') return true;
      if (selectedStatusFilter === 'inactive') return staffStatus === 'inactive' || staffStatus === 'resigned';
      return staffStatus === selectedStatusFilter;
    });
  }, [staffList, searchQuery, selectedTypeFilter, selectedStatusFilter]);

  // Deterministic stable sorting (never rearranges or jumps)
  const sortedFilteredStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      if (a.id?.startsWith('temp_') || a.id?.startsWith('staff_')) return -1;
      if (b.id?.startsWith('temp_') || b.id?.startsWith('staff_')) return 1;
      const idA = a.staffId || a.staff_id || a.id || '';
      const idB = b.staffId || b.staff_id || b.id || '';
      return idA.localeCompare(idB);
    });
  }, [filteredStaff]);

  // Stable category pill ordering
  const sortedStaffTypes = useMemo(() => {
    return [...staffTypes].sort((a: any, b: any) => {
      const order: Record<string, number> = { faculty: 1, fac: 1, admin: 2, adm: 2, domestic: 3, dom: 3, 'domestic staff': 3, 'domestic-staff': 3 };
      const slugA = (a.slug || a.code || a.name || '').toLowerCase();
      const slugB = (b.slug || b.code || b.name || '').toLowerCase();
      const orderA = order[slugA] || 99;
      const orderB = order[slugB] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [staffTypes]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Staff ID', 'Full Name', 'Role / Type', 'Designation', 'Phone', 'Email', 'Status'];
    const rows = filteredStaff.map((s: any) => [
      `"${s.staffId || ''}"`,
      `"${s.fullName || s.name || ''}"`,
      `"${s.role || 'Staff'}"`,
      `"${s.designation || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.status || 'active'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Directory Header */}
      <div className="directory-header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Staff & Faculty Directory
            </h2>
            <span
              style={{
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 9999,
                border: '1px solid #E2E8F0'
              }}
            >
              {staffList.length} Members
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Faculty rosters, administrative officers, custom roles, and security permissions
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCsv}
            style={{
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <Download size={14} /> Export CSV
          </button>

          {/* Consolidated Tools Menu */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              style={{
                height: 38,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700
              }}
            >
              <Settings size={14} /> Tools ▾
            </button>

            {isToolsMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 210,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15)',
                  padding: 6,
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeManagerOpen(true);
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: '#0F172A',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Layers size={14} color="#2563EB" /> Manage Staff Types
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsRegisterModalOpen(true)}
            style={{
              height: 38,
              borderRadius: 10,
              background: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <Plus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Row 1: Lifecycle Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Statuses' },
            { key: 'active', label: 'Active' },
            { key: 'probation', label: 'Probation' },
            { key: 'on_leave', label: 'On Leave' },
            { key: 'suspended', label: 'Suspended' },
            { key: 'terminated', label: 'Terminated' },
            { key: 'inactive', label: 'Inactive / Resigned' }
          ].map(tab => {
            const isSelected = selectedStatusFilter === tab.key;
            const count = staffList.filter(s => {
              const st = (s.status || 'active').toLowerCase();
              if (tab.key === 'all') return true;
              if (tab.key === 'inactive') return st === 'inactive' || st === 'resigned';
              return st === tab.key;
            }).length;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.key)}
                style={{
                  borderRadius: 9999,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  border: isSelected ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
                  background: isSelected ? '#0F172A' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 9999,
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontWeight: 500
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Role Category Pills & Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              style={{
                borderRadius: 9999,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: selectedTypeFilter === 'all' ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                background: selectedTypeFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
                color: selectedTypeFilter === 'all' ? '#1D4ED8' : '#64748B',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
              }}
            >
              All Types ({staffList.length})
            </button>

            {sortedStaffTypes.map((t: any) => {
              const count = staffList.filter((s: any) => (s.role || '').toLowerCase() === t.name.toLowerCase() || s.staffTypeId === t.id).length;
              const isSelected = selectedTypeFilter.toLowerCase() === t.name.toLowerCase() || selectedTypeFilter === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(t.name)}
                  style={{
                    borderRadius: 9999,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    border: isSelected ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    color: isSelected ? '#1D4ED8' : '#64748B',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
                  }}
                >
                  {t.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="Search name, ID, remarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                borderRadius: 10,
                border: '1.5px solid #E2E8F0',
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 12,
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Staff Grid Cards */}
      <div className="card-grid-3" style={{ width: '100%', minWidth: 0 }}>
        {sortedFilteredStaff.map((staff: any) => {
          const sName = staff.fullName || staff.name || 'Staff Member';
          const sRole = staff.role || staff.staffType?.name || 'Staff';
          const sDesignation = staff.designation || 'Staff Member';
          const isDropdownOpen = activeDropdownStaffId === staff.id;
          const statusBadge = getStatusBadge(staff.status);

          return (
            <div
              key={staff.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                borderRadius: 14,
                padding: 14,
                minWidth: 0,
                width: '100%',
                overflow: 'hidden'
              }}
              onClick={() => setSelectedStaffForDrawer(staff)}
            >
              {/* Card Header: Avatar + Name (left) and Staff ID + Menu (right) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: 15,
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
                    }}
                  >
                    {sName.charAt(0)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2
                      }}
                      title={sName}
                    >
                      {sName}
                    </div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        className="badge badge-blue"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 7px',
                          display: 'inline-block',
                          maxWidth: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={sDesignation}
                      >
                        {sDesignation}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          border: `1px solid ${statusBadge.border}`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Badges: Staff ID Code + Action Menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <span
                    style={{
                      background: '#F1F5F9',
                      color: '#334155',
                      fontSize: 10.5,
                      fontWeight: 500,
                      padding: '2px 6px',
                      borderRadius: 6,
                      fontFamily: 'monospace',
                      border: '1px solid #E2E8F0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {staff.staffId || 'STF-001'}
                  </span>

                  <div className="table-action-group" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="table-icon-btn"
                      title="Staff Actions"
                      onClick={() => setActiveDropdownStaffId(isDropdownOpen ? null : staff.id)}
                      style={{ border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', width: 28, height: 28 }}
                    >
                      <MoreVertical size={14} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1190,
                            background: 'transparent',
                            cursor: 'default'
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            setActiveDropdownStaffId(null);
                          }}
                        />
                        <div
                          className="staff-card-dropdown-menu"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            right: 0,
                            width: 210,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
                            padding: 6,
                            zIndex: 1200,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaffForDrawer(staff);
                              setActiveDropdownStaffId(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '7px 10px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              color: '#0F172A',
                              fontSize: 11.5,
                              fontWeight: 500,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <ChevronRight size={13} color="#2563EB" /> Profile
                          </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveStaffForStatus(staff);
                            setIsStatusModalOpen(true);
                            setActiveDropdownStaffId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#0F172A',
                            fontSize: 11.5,
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <UserCheck size={13} color="#2563EB" /> Change Status / Archive
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const tempPassword = `Acad#${Math.floor(1000 + Math.random() * 9000)}`;
                            api.resetStaffPassword(staff.id, tempPassword).catch(() => {});
                            const credData: StaffCredentialData = {
                              staffId: staff.staffId || 'FAC-2026-001',
                              fullName: sName,
                              phone: staff.phone,
                              email: staff.email,
                              role: sRole,
                              designation: sDesignation,
                              temporaryPassword: tempPassword,
                              issuedAt: new Date().toISOString()
                            };
                            setActiveCredentials(credData);
                            setIsCredentialSlipOpen(true);
                            setActiveDropdownStaffId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#0F172A',
                            fontSize: 11.5,
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <KeyRound size={13} color="#059669" /> Print Credential Slip
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveStaffForPermissions(staff);
                            setIsPermissionsModalOpen(true);
                            setActiveDropdownStaffId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#0F172A',
                            fontSize: 11.5,
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <ShieldCheck size={13} color="#2563EB" /> Configure RBAC
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetPassword(staff)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#0F172A',
                            fontSize: 11.5,
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <KeyRound size={13} color="#D97706" /> Reset Password
                        </button>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              </div>

              {/* Status Remarks if present */}
              {(staff.statusRemarks || staff.status_remarks) && (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    padding: '6px 10px',
                    fontSize: 11.5,
                    color: '#475569',
                    lineHeight: 1.35
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>Remarks:</span> {staff.statusRemarks || staff.status_remarks}
                </div>
              )}

              {/* Contact Info Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #F1F5F9',
                  padding: '7px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 11.5,
                  color: '#475569',
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <Mail size={12} color="#64748B" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {staff.email || 'No email registered'}
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <Phone size={12} color="#64748B" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                      {staff.phone || 'No phone registered'}
                    </span>
                  </div>
                  {staff.phone && (
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveContactStaffId(activeContactStaffId === staff.id ? null : staff.id);
                        }}
                        title="Call / WhatsApp Contact Options"
                        style={{
                          background: activeContactStaffId === staff.id ? '#EFF6FF' : '#F8FAFC',
                          border: activeContactStaffId === staff.id ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                          borderRadius: 6,
                          padding: '2px 7px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: '#2563EB',
                          flexShrink: 0
                        }}
                      >
                        <Phone size={10} color="#2563EB" /> Contact
                      </button>

                      {activeContactStaffId === staff.id && (
                        <>
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 1210, background: 'transparent' }}
                            onClick={e => {
                              e.stopPropagation();
                              setActiveContactStaffId(null);
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 'calc(100% + 6px)',
                              right: 0,
                              width: 170,
                              background: '#FFFFFF',
                              borderRadius: 10,
                              border: '1px solid #E2E8F0',
                              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
                              padding: 5,
                              zIndex: 1220,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = (staff.phone || '').replace(/\D/g, '');
                                window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}`, '_blank');
                                setActiveContactStaffId(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                color: '#16A34A',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <MessageSquare size={14} color="#16A34A" /> WhatsApp Chat
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = (staff.phone || '').replace(/\D/g, '');
                                window.location.href = `tel:${cleanPhone}`;
                                setActiveContactStaffId(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                color: '#2563EB',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Phone size={14} color="#2563EB" /> Mobile Call
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Batches (if Faculty) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Assigned Batches
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
                  {staff.assignedBatches && staff.assignedBatches.length > 0 ? (
                    staff.assignedBatches.map((b: string) => (
                      <span key={b} className="badge badge-gray" style={{ fontSize: 10, padding: '2px 7px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No active batches assigned</span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 8, marginTop: 'auto' }}>
                <span style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronRight size={13} /> View Profile
                </span>
                <span 
                  style={{ 
                    fontSize: 10.5, 
                    fontWeight: 500, 
                    padding: '2px 7px', 
                    borderRadius: 4, 
                    background: statusBadge.bg, 
                    color: statusBadge.color,
                    border: `1px solid ${statusBadge.border}`,
                    textTransform: 'capitalize' 
                  }}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals & Drawers */}
      <StaffDetailDrawer
        isOpen={!!selectedStaffForDrawer}
        onClose={() => setSelectedStaffForDrawer(null)}
        staff={selectedStaffForDrawer}
        onOpenStatusModal={staff => {
          setActiveStaffForStatus(staff);
          setIsStatusModalOpen(true);
        }}
        onDeleteStaff={staff => {
          setStaffToDelete(staff);
        }}
        onOpenPermissions={staff => {
          setActiveStaffForPermissions(staff);
          setIsPermissionsModalOpen(true);
        }}
        onOpenCredentials={staff => {
          const tempPassword = `Acad#${Math.floor(1000 + Math.random() * 9000)}`;
          api.resetStaffPassword(staff.id, tempPassword).catch(() => {});
          const credData: StaffCredentialData = {
            staffId: staff.staffId || 'FAC-2026-001',
            fullName: staff.fullName || staff.name,
            phone: staff.phone,
            email: staff.email,
            role: staff.role || 'Staff',
            designation: staff.designation || 'Staff Member',
            temporaryPassword: tempPassword,
            issuedAt: new Date().toISOString()
          };
          setActiveCredentials(credData);
          setIsCredentialSlipOpen(true);
        }}
        onResetPassword={handleResetPassword}
      />

      <StaffStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setActiveStaffForStatus(null);
        }}
        staff={activeStaffForStatus}
        onStatusUpdated={handleStatusUpdated}
      />

      <DeleteStaffModal
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        staff={staffToDelete}
        onConfirmDelete={handleConfirmDeleteStaff}
      />

      <RegisterStaffModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        staffTypes={staffTypes}
        onSuccess={handleRegistrationSuccess}
      />

      <StaffCredentialSlipModal
        isOpen={isCredentialSlipOpen}
        onClose={() => setIsCredentialSlipOpen(false)}
        data={activeCredentials}
      />

      <StaffTypeManagerModal
        isOpen={isTypeManagerOpen}
        onClose={() => setIsTypeManagerOpen(false)}
        staffTypes={staffTypes}
        onStaffTypesChange={setStaffTypes}
      />

      <StaffPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        staffMember={activeStaffForPermissions}
      />
    </div>
  );
};
export default TeachersView;
