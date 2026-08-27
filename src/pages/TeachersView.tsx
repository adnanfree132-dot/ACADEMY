import React, { useState, useEffect } from 'react';
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
  Printer
} from 'lucide-react';
import { RegisterStaffModal } from '../components/RegisterStaffModal';
import { StaffCredentialSlipModal, StaffCredentialData } from '../components/StaffCredentialSlipModal';
import { StaffTypeManagerModal, StaffTypeItem } from '../components/StaffTypeManagerModal';
import { StaffPermissionsModal } from '../components/StaffPermissionsModal';
import { StaffDetailDrawer } from '../components/StaffDetailDrawer';
import { api } from '../api/apiClient';

interface TeachersViewProps {
  teachers: Teacher[];
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

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
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

  // Active records for modals
  const [activeCredentials, setActiveCredentials] = useState<StaffCredentialData | null>(null);
  const [activeStaffForPermissions, setActiveStaffForPermissions] = useState<any | null>(null);
  const [selectedStaffForDrawer, setSelectedStaffForDrawer] = useState<any | null>(null);
  const [activeDropdownStaffId, setActiveDropdownStaffId] = useState<string | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // Filters & State
  const [staffTypes, setStaffTypes] = useState<StaffTypeItem[]>(DEFAULT_STAFF_TYPES);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);

  // Initialize staff list from props & backend
  useEffect(() => {
    // Map teachers prop to full staff objects
    const initialStaff = teachers.map((t, idx) => ({
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

    setStaffList(initialStaff);

    // Fetch custom staff types if available
    api.getStaffTypes().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        setStaffTypes(res);
      }
    }).catch(() => {});
  }, [teachers]);

  // Handle successful registration (0ms instant optimistic)
  const handleRegistrationSuccess = (newStaff: any, credentials: StaffCredentialData) => {
    setStaffList(prev => [newStaff, ...prev]);
    setActiveCredentials(credentials);
    setIsCredentialSlipOpen(true);

    if (onAddTeacher && (newStaff.role === 'Faculty' || newStaff.staffType?.name === 'Faculty')) {
      onAddTeacher({
        name: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        qualification: newStaff.qualification || newStaff.designation
      });
    }
  };

  // Handle staff deletion (0ms instant optimistic)
  const handleDeleteStaff = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from active staff?`)) return;

    setStaffList(prev => prev.filter(s => s.id !== id));
    if (onDeleteTeacher) onDeleteTeacher(id);

    api.deleteStaff(id).catch(err => console.error('Delete error:', err));
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

  // Filter staff list
  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      (s.fullName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery) ||
      (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedTypeFilter === 'all') return true;

    return (
      (s.role || '').toLowerCase() === selectedTypeFilter.toLowerCase() ||
      (s.staffTypeId || '') === selectedTypeFilter
    );
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Staff ID', 'Full Name', 'Role / Type', 'Designation', 'Phone', 'Email', 'Status'];
    const rows = filteredStaff.map(s => [
      `"${s.staffId || ''}"`,
      `"${s.fullName || s.name || ''}"`,
      `"${s.role || 'Staff'}"`,
      `"${s.designation || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.status || 'active'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            style={{
              borderRadius: 9999,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              border: selectedTypeFilter === 'all' ? '1.5px solid #0F172A' : '1.5px solid #E2E8F0',
              background: selectedTypeFilter === 'all' ? '#0F172A' : '#FFFFFF',
              color: selectedTypeFilter === 'all' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
            }}
          >
            All Staff ({staffList.length})
          </button>

          {staffTypes.map(t => {
            const count = staffList.filter(s => (s.role || '').toLowerCase() === t.name.toLowerCase() || s.staffTypeId === t.id).length;
            const isSelected = selectedTypeFilter.toLowerCase() === t.name.toLowerCase() || selectedTypeFilter === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTypeFilter(t.name)}
                style={{
                  borderRadius: 9999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
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
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              borderRadius: 10,
              border: '1.5px solid #E2E8F0',
              paddingLeft: 38,
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

      {/* 3. Staff Grid Cards */}
      <div className="card-grid-3" style={{ width: '100%', minWidth: 0 }}>
        {filteredStaff.map(staff => {
          const sName = staff.fullName || staff.name || 'Staff Member';
          const sRole = staff.role || staff.staffType?.name || 'Staff';
          const sDesignation = staff.designation || 'Staff Member';
          const isDropdownOpen = activeDropdownStaffId === staff.id;

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
                      fontWeight: 800,
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
                        fontWeight: 800,
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
                    <div style={{ marginTop: 3 }}>
                      <span
                        className="badge badge-blue"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
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
                      fontWeight: 700,
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
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          right: 0,
                          width: 200,
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
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <ChevronRight size={13} color="#2563EB" /> 360° Profile
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
                            fontWeight: 700,
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
                            fontWeight: 700,
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
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <KeyRound size={13} color="#D97706" /> Reset Password
                        </button>

                        <div style={{ borderTop: '1px solid #F1F5F9', margin: '4px 0' }} />

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id, sName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#DC2626',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Trash2 size={13} /> Remove Staff Member
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <Phone size={12} color="#64748B" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {staff.phone || 'No phone registered'}
                  </span>
                </div>
              </div>

              {/* Assigned Batches (if Faculty) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
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
                <span style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronRight size={13} /> View 360° Profile
                </span>
                <span className="badge badge-emerald" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'capitalize' }}>
                  {staff.status || 'Active'}
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
