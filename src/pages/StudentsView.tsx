import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { Search, Plus, Filter, AlertCircle, CheckCircle2, Download, Edit, Trash2, DollarSign, MessageCircle, Phone, PhoneCall, Clock, PieChart, ChevronRight, ChevronDown, MoreVertical, UploadCloud, ShieldCheck, Award, Users, Wallet, TrendingUp, Key, UserCheck, FileCheck2, RefreshCw, X } from 'lucide-react';

import { exportToCSV } from '../utils/csvExporter';
import { StudentProfileDrawer } from '../components/StudentProfileDrawer';
import { EditStudentModal } from '../components/EditStudentModal';
import { QuickPaymentModal } from '../components/QuickPaymentModal';
import { StudentLedgerModal } from '../components/StudentLedgerModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { StudentIDCardModal } from '../components/StudentIDCardModal';
import { BulkIDCardModal } from '../components/BulkIDCardModal';
import { WhatsAppBulkModal } from '../components/WhatsAppBulkModal';
import { CustomSelect } from '../components/CustomSelect';
import { CredentialSlipModal, CredentialData } from '../components/CredentialSlipModal';
import { RegisterStudentModal } from '../components/RegisterStudentModal';
import { ClassPromotionModal } from '../components/ClassPromotionModal';
import { StudentLeaveModal } from '../components/StudentLeaveModal';
import { ResetParentPasswordModal } from '../components/ResetParentPasswordModal';
import { ChangeStudentStatusModal } from '../components/ChangeStudentStatusModal';
import { LeavingCertificateModal } from '../components/LeavingCertificateModal';
import { ModernSelect } from '../components/ModernSelect';
import { EnrollStudentBatchModal } from '../components/EnrollStudentBatchModal';
import { api } from '../api/apiClient';

import { getUnitHeader, getFilterLabel } from '../utils/academyModeHelper';
import { Batch, FeeTransaction } from '../types';

interface StudentsViewProps {
  students: Student[];
  batches: Batch[];
  onOpenCreateModal: () => void;
  onAddStudent?: (studentData: any) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string, mode?: 'soft' | 'hard') => void;
  onAddPayment: (paymentData: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
  onBulkImport?: (studentList: any[]) => Promise<void>;
  onBulkDelete?: (studentIds: string[], mode?: 'soft' | 'hard') => Promise<void>;
  onBulkTransfer?: (studentIds: string[], targetBatch: string) => Promise<void>;
  onRefreshStudents?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ 
  students, 
  batches,
  onOpenCreateModal,
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent,
  onAddPayment,
  onBulkImport,
  onBulkDelete,
  onBulkTransfer,
  onRefreshStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Pending' | 'Defaulters'>('All');
  const [lifecycleFilter, setLifecycleFilter] = useState<'All' | 'Active' | 'On Leave' | 'Suspended' | 'Alumni' | 'Left'>('Active');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [studentToPay, setStudentToPay] = useState<Student | null>(null);
  const [ledgerStudent, setLedgerStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
  const [activeContactStudentId, setActiveContactStudentId] = useState<string | null>(null);
  const [studentToChangeStatus, setStudentToChangeStatus] = useState<Student | null>(null);
  const [studentToLeavingCert, setStudentToLeavingCert] = useState<Student | null>(null);
  const [studentToEnrollBatch, setStudentToEnrollBatch] = useState<Student | null>(null);
  
  // Bulk Selection & Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [isBulkIDCardModalOpen, setIsBulkIDCardModalOpen] = useState(false);
  const [bulkIDCardStudents, setBulkIDCardStudents] = useState<Student[]>([]);
  const [isWhatsAppBulkModalOpen, setIsWhatsAppBulkModalOpen] = useState(false);
  const [whatsAppBulkStudents, setWhatsAppBulkStudents] = useState<Student[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [targetTransferBatch, setTargetTransferBatch] = useState<string>('Grade 10');
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);
  const [passwordResetStudent, setPasswordResetStudent] = useState<Student | null>(null);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-menu-dropdown') && !target.closest('.table-icon-btn') && !target.closest('.btn-secondary')) {
        setActiveRowActionId(null);
        setActiveContactStudentId(null);
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const availableBatches: string[] = Array.from(new Set(
    [...batches.map(b => b.name || b.classLevel), ...students.map(s => s.gradeBatch)].filter((b): b is string => Boolean(b))
  )).sort();

  const handleExportCSV = () => {
    exportToCSV('Students_Directory', filteredStudents.map(s => ({
      RegNo: s.regNo,
      Name: s.name,
      ParentName: s.parentName,
      Phone: s.phone,
      Batch: s.gradeBatch,
      TotalFee: s.totalFee,
      PaidFee: s.paidFee,
      DueBalance: s.dueBalance,
      Status: s.status
    })));
  };

  // Lifecycle Categorization Helpers
  const isStudentLeave = (s: Student) => {
    const st = (s.status || '').toLowerCase();
    return st.includes('leave') || st === 'inactive';
  };
  const isStudentGraduated = (s: Student) => {
    const st = (s.status || '').toLowerCase();
    return st.includes('graduat') || st === 'alumni';
  };
  const isStudentSuspended = (s: Student) => {
    const st = (s.status || '').toLowerCase();
    return st.includes('suspend');
  };
  const isStudentLeft = (s: Student) => {
    const st = (s.status || '').toLowerCase();
    return st.includes('left') || st.includes('withdraw') || st.includes('remov');
  };
  const isStudentActive = (s: Student) => {
    return !isStudentLeave(s) && !isStudentGraduated(s) && !isStudentSuspended(s) && !isStudentLeft(s);
  };

  const activeCount = students.filter(isStudentActive).length;
  const leaveCount = students.filter(isStudentLeave).length;
  const suspendedCount = students.filter(isStudentSuspended).length;
  const graduatedCount = students.filter(isStudentGraduated).length;
  const leftCount = students.filter(isStudentLeft).length;

  const filteredStudents = students.filter(s => {
    // 1. Lifecycle Status Filter
    if (lifecycleFilter === 'Active' && !isStudentActive(s)) return false;
    if (lifecycleFilter === 'On Leave' && !isStudentLeave(s)) return false;
    if (lifecycleFilter === 'Suspended' && !isStudentSuspended(s)) return false;
    if (lifecycleFilter === 'Alumni' && !isStudentGraduated(s)) return false;
    if (lifecycleFilter === 'Left' && !isStudentLeft(s)) return false;

    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.regNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.parentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBatch = batchFilter === 'All' || s.gradeBatch === batchFilter;

    const due = s.dueBalance || 0;
    const paid = s.paidFee || 0;
    const monthlyFee = s.totalFee || 10000;

    if (!matchesSearch || !matchesBatch) return false;

    if (statusFilter === 'Paid') return due <= 0;
    if (statusFilter === 'Partially Paid') return due > 0 && paid > 0;
    if (statusFilter === 'Pending') return due > 0 && paid === 0 && due <= monthlyFee;
    if (statusFilter === 'Defaulters') return due > monthlyFee && paid === 0;
    return true;
  });

  const getLifecycleStatusBadge = (student: Student) => {
    const s = (student.status || 'Active').toLowerCase();
    let bg = '#DCFCE7';
    let text = '#166534';
    let border = '#BBF7D0';
    let label: string = student.status || 'Active';

    if (s.includes('leave') || s === 'inactive') {
      bg = '#FEF3C7';
      text = '#92400E';
      border = '#FDE68A';
      label = student.statusReason ? `On Leave (${student.statusReason})` : 'On Leave';
    } else if (s.includes('graduat') || s === 'alumni') {
      bg = '#F3E8FF';
      text = '#6B21A8';
      border = '#E9D5FF';
      label = 'Graduated';
    } else if (s.includes('suspend')) {
      bg = '#FEE2E2';
      text = '#991B1B';
      border = '#FECACA';
      label = 'Suspended';
    } else if (s.includes('left') || s.includes('withdraw') || s.includes('remov')) {
      bg = '#F1F5F9';
      text = '#475569';
      border = '#CBD5E1';
      label = 'Left';
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setStudentToChangeStatus(student);
        }}
        title="Click to Change Student Status"
        style={{
          background: bg,
          color: text,
          border: `1px solid ${border}`,
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: 11.5,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <span>{label}</span>
      </button>
    );
  };

  const getFeeStatusBadge = (student: Student) => {
    const due = student.dueBalance || 0;
    const paid = student.paidFee || 0;
    const monthlyFee = student.totalFee || 10000;

    let badgeClass = '';
    let text = '';
    let icon = null;

    if (due <= 0) {
      badgeClass = 'badge-green';
      text = 'Paid';
      icon = <CheckCircle2 size={11} />;
    } else if (paid > 0) {
      badgeClass = 'badge-blue';
      text = 'Partial';
      icon = <PieChart size={11} />;
    } else if (due > monthlyFee) {
      badgeClass = 'badge-red';
      text = 'Defaulter';
      icon = <AlertCircle size={11} />;
    } else {
      badgeClass = 'badge-amber';
      text = 'Pending';
      icon = <Clock size={11} />;
    }

    return (
      <button 
        type="button"
        className={`badge ${badgeClass}`} 
        onClick={() => setStudentToPay(student)}
        title="Click to Record Fee Payment"
        style={{ cursor: 'pointer', border: '1px solid transparent', whiteSpace: 'nowrap' }}
      >
        {icon}
        <span>{text}</span>
        <ChevronRight size={10} style={{ opacity: 0.6, marginLeft: 2 }} />
      </button>
    );
  };

  return (
    <div className="students-view-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Clean Minimal Header Bar */}
      <div className="directory-header-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Students Directory
          </h2>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
            {students.length} Total
          </span>
        </div>

        <div className="header-action-bar">
          <button className="btn-secondary" onClick={handleExportCSV} title="Export CSV Directory">
            <Download size={14} /> Export CSV
          </button>

          {/* Tools & Utilities Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              title="More Management Tools"
            >
              <span>Tools</span>
              <ChevronDown size={14} />
            </button>

            {isToolsDropdownOpen && (
              <div className="header-menu-dropdown" onClick={() => setIsToolsDropdownOpen(false)}>
                <button type="button" className="header-menu-item" onClick={() => setIsLeaveModalOpen(true)}>
                  <Clock size={14} color="#475569" /> Manage Leaves
                </button>
                <button type="button" className="header-menu-item" onClick={() => setIsPromotionModalOpen(true)}>
                  <ShieldCheck size={14} color="#475569" /> Promote Class
                </button>
                <button 
                  type="button"
                  className="header-menu-item" 
                  onClick={() => {
                    setBulkIDCardStudents(filteredStudents);
                    setIsBulkIDCardModalOpen(true);
                  }}
                >
                  <Award size={14} color="#475569" /> Bulk Print Cards ({filteredStudents.length})
                </button>
                <button type="button" className="header-menu-item" onClick={() => setIsBulkImportOpen(true)}>
                  <UploadCloud size={14} color="#475569" /> Import CSV
                </button>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={() => setIsRegisterModalOpen(true)}>
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Segmented Lifecycle Status Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '6px 10px',
        borderRadius: 10,
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        gap: 6
      }}>
        {[
          { key: 'Active', label: 'Enrolled Active', count: activeCount, color: '#16A34A', bg: '#DCFCE7' },
          { key: 'On Leave', label: 'On Leave', count: leaveCount, color: '#D97706', bg: '#FEF3C7' },
          { key: 'Suspended', label: 'Suspended', count: suspendedCount, color: '#DC2626', bg: '#FEE2E2' },
          { key: 'Alumni', label: 'Graduated / Alumni', count: graduatedCount, color: '#9333EA', bg: '#F3E8FF' },
          { key: 'Left', label: 'Archived / Left', count: leftCount, color: '#475569', bg: '#F1F5F9' },
          { key: 'All', label: 'All Records', count: students.length, color: '#0F172A', bg: '#E2E8F0' }
        ].map(tab => {
          const isSelected = lifecycleFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setLifecycleFilter(tab.key as any)}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 8,
                border: isSelected ? `1px solid ${tab.color}` : '1px solid transparent',
                background: isSelected ? tab.bg : 'transparent',
                color: isSelected ? tab.color : '#64748B',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9999,
                background: isSelected ? 'rgba(255,255,255,0.7)' : '#F1F5F9',
                color: isSelected ? tab.color : '#64748B',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clean Minimal Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 12, background: '#FFFFFF', padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(15,23,42,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: '0 12px', borderRadius: 6, border: '1px solid #E2E8F0', flex: 1, minWidth: 240, height: 34 }}>
          <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
          <input
            type="text"
            placeholder="Search students by name, roll no, or parent..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: 0, fontSize: 13, color: '#0F172A' }}
          />
        </div>

        {/* Grade / Batch Filter Dropdown */}
        <CustomSelect
          value={batchFilter}
          onChange={setBatchFilter}
          options={[
            { value: 'All', label: getFilterLabel() },
            ...availableBatches.map(b => ({ value: b, label: b }))
          ]}
        />

        {/* Minimal Segmented Tabs */}
        <div className="mobile-filter-scroll-bar" style={{ display: 'flex', background: '#F1F5F9', padding: 2, borderRadius: 6, border: '1px solid #E2E8F0', gap: 2, maxWidth: '100%' }}>
          {[
            { key: 'All', label: 'All', count: students.length },
            { key: 'Paid', label: 'Paid', count: students.filter(s => (s.dueBalance || 0) <= 0).length },
            { key: 'Partially Paid', label: 'Partially Paid', count: students.filter(s => (s.dueBalance || 0) > 0 && (s.paidFee || 0) > 0).length },
            { key: 'Pending', label: 'Pending', count: students.filter(s => (s.dueBalance || 0) > 0 && (s.paidFee || 0) === 0 && (s.dueBalance || 0) <= (s.totalFee || 10000)).length },
            { key: 'Defaulters', label: 'Defaulters', count: students.filter(s => (s.dueBalance || 0) > (s.totalFee || 10000) && (s.paidFee || 0) === 0).length }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              style={{
                height: 28,
                padding: '0 9px',
                borderRadius: 5,
                border: 'none',
                background: statusFilter === tab.key ? '#FFFFFF' : 'transparent',
                color: statusFilter === tab.key ? '#0F172A' : '#64748B',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: statusFilter === tab.key ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: 11, color: statusFilter === tab.key ? '#0F172A' : '#94A3B8', fontWeight: 600 }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="data-table-container desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '36px', paddingLeft: '14px' }}>
                <input 
                  type="checkbox" 
                  checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredStudents.map(s => s.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  style={{ cursor: 'pointer', width: 15, height: 15 }}
                />
              </th>
              <th>Student</th>
              <th>Contact</th>
              <th>{getUnitHeader()}</th>
              <th style={{ width: '95px', whiteSpace: 'nowrap' }}>Fee Status</th>
              <th style={{ width: '135px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '14px', width: '125px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const isRowActive = activeRowActionId === student.id || activeContactStudentId === student.id;
                return (
                  <tr 
                    key={student.id} 
                    style={{ 
                      background: selectedIds.includes(student.id) ? 'rgba(59, 130, 246, 0.04)' : undefined,
                      position: 'relative',
                      zIndex: isRowActive ? 100 : 1
                    }}
                  >
                    <td style={{ paddingLeft: '14px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(student.id)}
                        onChange={() => {
                          if (selectedIds.includes(student.id)) {
                            setSelectedIds(selectedIds.filter(id => id !== student.id));
                          } else {
                            setSelectedIds([...selectedIds, student.id]);
                          }
                        }}
                        style={{ cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5 }}>{student.name}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{student.regNo}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: '#334155', fontSize: 13 }}>{student.parentName}</span>
                        <a 
                          href={`tel:${student.phone.replace(/\D/g, '')}`} 
                          style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none' }}
                          title="Click to dial"
                        >
                          {student.phone}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{student.gradeBatch}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {getFeeStatusBadge(student)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="badge-group">
                        {getLifecycleStatusBadge(student)}
                        <span className="badge badge-green">{(student as any).attendancePercentage || 94}% Att.</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: '14px', position: 'relative', zIndex: isRowActive ? 100 : 1 }}>
                      <div className="table-action-group" style={{ position: 'relative', zIndex: isRowActive ? 100 : 1 }}>
                        {/* View 360 Profile */}
                        <button 
                          className="btn-secondary btn-sm" 
                          onClick={() => setSelectedStudent(student)} 
                          title="View 360° Profile"
                        >
                          View
                        </button>
                        
                        {/* Contact / Phone Options (WhatsApp & Call) */}
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: activeContactStudentId === student.id ? 105 : 1 }}>
                          <button 
                            type="button"
                            className="table-icon-btn" 
                            onClick={() => {
                              setActiveContactStudentId(activeContactStudentId === student.id ? null : student.id);
                              setActiveRowActionId(null);
                            }}
                            title="Call / WhatsApp Contact Options"
                            style={{
                              background: activeContactStudentId === student.id ? '#EFF6FF' : '#FFFFFF',
                              borderColor: activeContactStudentId === student.id ? '#BFDBFE' : '#E2E8F0'
                            }}
                          >
                            <Phone size={13} color="#2563EB" />
                          </button>

                          {activeContactStudentId === student.id && (
                            <div className="header-menu-dropdown" onClick={() => setActiveContactStudentId(null)} style={{ minWidth: 160 }}>
                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => {
                                  const cleanPhone = student.phone.replace(/\D/g, '');
                                  window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}`, '_blank');
                                }}
                              >
                                <MessageCircle size={14} color="#16A34A" /> WhatsApp Chat
                              </button>

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => {
                                  const cleanPhone = student.phone.replace(/\D/g, '');
                                  window.location.href = `tel:${cleanPhone}`;
                                }}
                              >
                                <PhoneCall size={14} color="#2563EB" /> Mobile Call
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Row More Actions Popover */}
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: activeRowActionId === student.id ? 105 : 1 }}>
                          <button 
                            type="button"
                            className="table-icon-btn" 
                            onClick={() => {
                              setActiveRowActionId(activeRowActionId === student.id ? null : student.id);
                              setActiveContactStudentId(null);
                            }}
                            title="More student actions"
                            style={{
                              background: activeRowActionId === student.id ? '#F1F5F9' : '#FFFFFF'
                            }}
                          >
                            <MoreVertical size={13} />
                          </button>

                          {activeRowActionId === student.id && (                            <div className="header-menu-dropdown" onClick={() => setActiveRowActionId(null)}>
                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setStudentToChangeStatus(student)}
                              >
                                <UserCheck size={14} color="#475569" /> Change Status
                              </button>

                              {(student.status === 'Graduated' || student.status === 'Left' || (student.status as string).toLowerCase().includes('leave')) && (
                                <button
                                  type="button"
                                  className="header-menu-item"
                                  onClick={() => setStudentToLeavingCert(student)}
                                >
                                  <FileCheck2 size={14} color="#475569" /> Leaving Certificate
                                </button>
                              )}

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setIdCardStudent(student)}
                              >
                                <Award size={14} color="#475569" /> Print ID Card
                              </button>

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setCredentialData({
                                  admissionNo: student.regNo,
                                  studentName: student.name,
                                  parentName: student.parentName,
                                  parentPhone: student.phone,
                                  parentUsername: student.phone,
                                  parentPassword: '123456'
                                })}
                              >
                                <ShieldCheck size={14} color="#475569" /> Parent Login Slip
                              </button>

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setPasswordResetStudent(student)}
                              >
                                <Key size={14} color="#475569" /> Reset Parent Password
                              </button>

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setStudentToEnrollBatch(student)}
                              >
                                <Users size={14} color="#475569" /> Course Batch Enrollment
                              </button>

                              <button
                                type="button"
                                className="header-menu-item"
                                onClick={() => setStudentToEdit(student)}
                              >
                                <Edit size={14} color="#475569" /> Edit Profile
                              </button>

                              <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                              <button
                                type="button"
                                className="header-menu-item danger"
                                onClick={() => {
                                  setDeleteMode('soft');
                                  setStudentToDelete(student);
                                }}
                              >
                                <Trash2 size={14} color="#DC2626" /> Delete / Archive Student
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  No student records match your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Native Mobile Touch Card Roster (< 768px) */}
      <div className="mobile-card-roster mobile-only">
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => {
            const isCardActive = activeRowActionId === student.id || activeContactStudentId === student.id;
            return (
              <div 
                key={student.id} 
                className="mobile-entity-card"
                style={{
                  position: 'relative',
                  zIndex: isCardActive ? 100 : 1
                }}
              >
                {/* Card Header: Avatar Initials + Name + Reg No + Batch Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{student.name}</h3>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{student.regNo}</span>
                    </div>
                  </div>

                  <span className="badge badge-gray">{student.gradeBatch}</span>
                </div>

                {/* Card Body: Parent Details & Contact */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', background: '#F8FAFC', padding: '8px 10px', borderRadius: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.parentName}</span>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>{student.phone}</div>
                  </div>

                  {/* Single-line Badges */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
                    {getFeeStatusBadge(student)}
                    {getLifecycleStatusBadge(student)}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setSelectedStudent(student)}
                    style={{ flex: 1, marginRight: 8, height: 32, justifyContent: 'center' }}
                  >
                    View Profile
                  </button>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Phone / Contact Button */}
                    <div style={{ position: 'relative', display: 'inline-block', zIndex: activeContactStudentId === student.id ? 105 : 1 }}>
                      <button
                        type="button"
                        className="table-icon-btn"
                        onClick={() => {
                          setActiveContactStudentId(activeContactStudentId === student.id ? null : student.id);
                          setActiveRowActionId(null);
                        }}
                        title="Contact"
                        style={{
                          width: 32,
                          height: 32,
                          background: activeContactStudentId === student.id ? '#EFF6FF' : '#FFFFFF',
                          borderColor: activeContactStudentId === student.id ? '#BFDBFE' : '#E2E8F0'
                        }}
                      >
                        <Phone size={14} color="#2563EB" />
                      </button>

                      {activeContactStudentId === student.id && (
                        <div className="header-menu-dropdown" onClick={() => setActiveContactStudentId(null)} style={{ minWidth: 160, right: 0 }}>
                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => {
                              const cleanPhone = student.phone.replace(/\D/g, '');
                              window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}`, '_blank');
                            }}
                          >
                            <MessageCircle size={14} color="#16A34A" /> WhatsApp Chat
                          </button>
                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => {
                              const cleanPhone = student.phone.replace(/\D/g, '');
                              window.location.href = `tel:${cleanPhone}`;
                            }}
                          >
                            <PhoneCall size={14} color="#2563EB" /> Mobile Call
                          </button>
                        </div>
                      )}
                    </div>

                    {/* More Actions Button */}
                    <div style={{ position: 'relative', display: 'inline-block', zIndex: activeRowActionId === student.id ? 105 : 1 }}>
                      <button
                        type="button"
                        className="table-icon-btn"
                        onClick={() => {
                          setActiveRowActionId(activeRowActionId === student.id ? null : student.id);
                          setActiveContactStudentId(null);
                        }}
                        title="More"
                        style={{
                          width: 32,
                          height: 32,
                          background: activeRowActionId === student.id ? '#F1F5F9' : '#FFFFFF'
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeRowActionId === student.id && (
                        <div className="header-menu-dropdown" onClick={() => setActiveRowActionId(null)} style={{ minWidth: 160, right: 0 }}>
                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => setStudentToChangeStatus(student)}
                          >
                            <UserCheck size={14} color="#475569" /> Change Status
                          </button>

                          {(student.status === 'Graduated' || student.status === 'Left' || (student.status as string).toLowerCase().includes('leave')) && (
                            <button
                              type="button"
                              className="header-menu-item"
                              onClick={() => setStudentToLeavingCert(student)}
                            >
                              <FileCheck2 size={14} color="#475569" /> Leaving Certificate
                            </button>
                          )}

                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => setIdCardStudent(student)}
                          >
                            <Award size={14} color="#475569" /> Print ID Card
                          </button>

                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => setCredentialData({
                              admissionNo: student.regNo,
                              studentName: student.name,
                              parentName: student.parentName,
                              parentPhone: student.phone,
                              parentUsername: student.phone,
                              parentPassword: '123456'
                            })}
                          >
                            <ShieldCheck size={14} color="#475569" /> Parent Login Slip
                          </button>

                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => setPasswordResetStudent(student)}
                          >
                            <Key size={14} color="#475569" /> Reset Parent Password
                          </button>

                          <button
                            type="button"
                            className="header-menu-item"
                            onClick={() => setStudentToEdit(student)}
                          >
                            <Edit size={14} color="#475569" /> Edit Profile
                          </button>

                          <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                          <button
                            type="button"
                            className="header-menu-item danger"
                            onClick={() => {
                              setDeleteMode('soft');
                              setStudentToDelete(student);
                            }}
                          >
                            <Trash2 size={14} color="#DC2626" /> Delete / Archive Student
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: 28, color: '#94A3B8', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            No student records match your query.
          </div>
        )}
      </div>

      {/* 360° Student Profile Drawer */}
      <StudentProfileDrawer 
        student={selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        onStudentUpdated={onRefreshStudents}
      />

      {/* Official Student ID Card Generator Modal (Feature 9) */}
      <StudentIDCardModal
        student={idCardStudent}
        onClose={() => setIdCardStudent(null)}
      />

      {/* Student/Parent App Credentials Slip Modal (Feature 19) */}
      <CredentialSlipModal
        data={credentialData}
        onClose={() => setCredentialData(null)}
      />

      {/* Reset Parent Password Modal */}
      {passwordResetStudent && (
        <ResetParentPasswordModal
          student={{
            id: passwordResetStudent.id,
            name: passwordResetStudent.name,
            regNo: passwordResetStudent.regNo,
            parentName: passwordResetStudent.parentName,
            phone: passwordResetStudent.phone
          }}
          onClose={() => setPasswordResetStudent(null)}
        />
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={!!studentToEdit}
        student={studentToEdit}
        batches={batches}
        onClose={() => setStudentToEdit(null)}
        onSave={(updated) => {
          onEditStudent(updated);
          setStudentToEdit(null);
        }}
      />

      {/* Quick Payment Modal */}
      <QuickPaymentModal
        isOpen={!!studentToPay}
        student={studentToPay}
        onClose={() => setStudentToPay(null)}
        onSave={(paymentData) => {
          onAddPayment(paymentData);
          setStudentToPay(null);
        }}
      />

      {/* Interactive Fee Ledger & Details Modal */}
      <StudentLedgerModal
        isOpen={!!ledgerStudent}
        student={ledgerStudent}
        onClose={() => setLedgerStudent(null)}
        onOpenPayModal={(s) => setStudentToPay(s)}
      />

      {/* Dual Option Delete / Archive Student Modal (Floating Island Architecture) */}
      {studentToDelete && (
        <div className="floating-island-overlay" onClick={() => setStudentToDelete(null)} style={{ zIndex: 1300 }}>
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 490 }}
          >
            {/* Island 1: Dark Navy Header Card */}
            <div style={{
              background: '#0F172A',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: 10, 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}>
                  <Trash2 size={18} color="#F87171" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Remove Student Record
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {studentToDelete.name} • <span style={{ fontFamily: 'monospace' }}>{studentToDelete.regNo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Floating Choice Selector Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Select Removal Method
              </div>

              {/* Option 1: Soft Archive (Recommended) */}
              <div
                onClick={() => setDeleteMode('soft')}
                style={{
                  border: deleteMode === 'soft' ? '2px solid #10B981' : '1px solid #E2E8F0',
                  background: deleteMode === 'soft' ? '#F0FDF4' : '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: deleteMode === 'soft' ? '6px solid #10B981' : '2px solid #CBD5E1',
                  background: '#FFFFFF',
                  marginTop: 2,
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      Soft Archive / Deactivate
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid #BBF7D0'
                    }}>
                      Recommended • Safe
                    </span>
                  </div>
                  <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                    Marks student as <strong>Left / Archived</strong> and removes from active rosters. <strong>Preserves all fee receipts, financial ledgers, attendance records, and exam marks.</strong> Can be restored at any time.
                  </p>
                </div>
              </div>

              {/* Option 2: Permanent / Hard Delete (Destructive) */}
              <div
                onClick={() => setDeleteMode('hard')}
                style={{
                  border: deleteMode === 'hard' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                  background: deleteMode === 'hard' ? '#FEF2F2' : '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: deleteMode === 'hard' ? '6px solid #EF4444' : '2px solid #CBD5E1',
                  background: '#FFFFFF',
                  marginTop: 2,
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#991B1B' }}>
                      Permanent / Hard Delete
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#991B1B',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid #FECACA'
                    }}>
                      Destructive • Irreversible
                    </span>
                  </div>
                  <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                    Permanently purges student profile, parent login credentials, invoices, attendance, and exam entries from the database. <strong>This action cannot be undone.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Island 3: Floating Action Pill Row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '11px 18px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = studentToDelete;
                  const mode = deleteMode;
                  setStudentToDelete(null);
                  if (target && onDeleteStudent) {
                    onDeleteStudent(target.id, mode);
                  }
                }}
                style={{
                  flex: 1.4,
                  background: deleteMode === 'hard' ? '#DC2626' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: deleteMode === 'hard' ? '0 4px 14px rgba(220,38,38,0.35)' : '0 4px 14px rgba(15,23,42,0.3)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {deleteMode === 'hard' ? (
                  <>
                    <Trash2 size={14} color="#FFFFFF" /> Permanently Delete
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#10B981" /> Archive Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dual Option Bulk Delete Modal (Floating Island Architecture) */}
      {isBulkDeleteModalOpen && selectedIds.length > 0 && (
        <div className="floating-island-overlay" onClick={() => setIsBulkDeleteModalOpen(false)} style={{ zIndex: 1300 }}>
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 490 }}
          >
            {/* Island 1: Dark Navy Header Card */}
            <div style={{
              background: '#0F172A',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: 10, 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}>
                  <Trash2 size={18} color="#F87171" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Bulk Remove {selectedIds.length} Students
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    Apply action across all selected student profiles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Floating Choice Selector Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Select Removal Method for {selectedIds.length} Records
              </div>

              {/* Option 1: Bulk Soft Archive */}
              <div
                onClick={() => setBulkDeleteMode('soft')}
                style={{
                  border: bulkDeleteMode === 'soft' ? '2px solid #10B981' : '1px solid #E2E8F0',
                  background: bulkDeleteMode === 'soft' ? '#F0FDF4' : '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: bulkDeleteMode === 'soft' ? '6px solid #10B981' : '2px solid #CBD5E1',
                  background: '#FFFFFF',
                  marginTop: 2,
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      Bulk Soft Archive ({selectedIds.length})
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid #BBF7D0'
                    }}>
                      Recommended • Safe
                    </span>
                  </div>
                  <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                    Marks selected students as <strong>Left / Archived</strong>. Preserves all past financial ledgers, fee slips, and attendance history.
                  </p>
                </div>
              </div>

              {/* Option 2: Bulk Permanent Delete */}
              <div
                onClick={() => setBulkDeleteMode('hard')}
                style={{
                  border: bulkDeleteMode === 'hard' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                  background: bulkDeleteMode === 'hard' ? '#FEF2F2' : '#FFFFFF',
                  borderRadius: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: bulkDeleteMode === 'hard' ? '6px solid #EF4444' : '2px solid #CBD5E1',
                  background: '#FFFFFF',
                  marginTop: 2,
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#991B1B' }}>
                      Bulk Permanent Delete ({selectedIds.length})
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#991B1B',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      border: '1px solid #FECACA'
                    }}>
                      Destructive • Irreversible
                    </span>
                  </div>
                  <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                    Permanently purges all {selectedIds.length} student records, credentials, invoices, and attendance logs. <strong>Cannot be undone.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Island 3: Floating Action Pill Row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '11px 18px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ids = [...selectedIds];
                  const mode = bulkDeleteMode;
                  setIsBulkDeleteModalOpen(false);
                  setSelectedIds([]);
                  if (onBulkDelete) {
                    try {
                      await onBulkDelete(ids, mode);
                    } catch (err) {
                      console.error('Bulk delete error:', err);
                    }
                  }
                }}
                style={{
                  flex: 1.4,
                  background: bulkDeleteMode === 'hard' ? '#DC2626' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: bulkDeleteMode === 'hard' ? '0 4px 14px rgba(220,38,38,0.35)' : '0 4px 14px rgba(15,23,42,0.3)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {bulkDeleteMode === 'hard' ? (
                  <>
                    <Trash2 size={14} color="#FFFFFF" /> Permanently Delete ({selectedIds.length})
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#10B981" /> Archive ({selectedIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Light Glassmorphic Command Dock */}
      {selectedIds.length > 0 && (
        <div 
          className="floating-bulk-bar" 
          style={{
            position: 'fixed',
            bottom: 24,
            left: 'calc(255px + (100% - 255px) / 2)',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #E2E8F0',
            borderRadius: 9999,
            padding: '8px 12px 8px 16px',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 1050,
            maxWidth: 'calc(100vw - 280px)',
            overflowX: 'auto',
            animation: 'floatingBarSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Selected Count Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid #E2E8F0', paddingRight: 12, flexShrink: 0 }}>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 9999, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedIds.length} Selected
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {/* WhatsApp Reminders */}
            <button 
              type="button"
              onClick={() => {
                const selectedStudents = students.filter(s => selectedIds.includes(s.id));
                setWhatsAppBulkStudents(selectedStudents);
                setIsWhatsAppBulkModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#F0FDF4',
                color: '#15803D',
                border: '1px solid #BBF7D0',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DCFCE7'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F0FDF4'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={12} color="#FFFFFF" />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>WhatsApp Reminders ({selectedIds.length})</span>
            </button>

            {/* Batch Transfer */}
            <button 
              type="button"
              onClick={() => setIsBulkTransferOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Filter size={12} color="#FFFFFF" />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Batch Transfer</span>
            </button>

            {/* Print ID Cards */}
            <button 
              type="button"
              onClick={() => {
                const selected = students.filter(s => selectedIds.includes(s.id));
                setBulkIDCardStudents(selected);
                setIsBulkIDCardModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFF7ED',
                color: '#C2410C',
                border: '1px solid #FFEDD5',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFEDD5'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFF7ED'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={12} color="#FFFFFF" />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Print ID Cards ({selectedIds.length})</span>
            </button>

            {/* Export CSV */}
            <button 
              type="button"
              onClick={() => {
                const selectedStudents = students.filter(s => selectedIds.includes(s.id));
                exportToCSV('Selected_Students', selectedStudents.map(s => ({
                  RegNo: s.regNo,
                  Name: s.name,
                  ParentName: s.parentName,
                  Phone: s.phone,
                  Batch: s.gradeBatch,
                  TotalFee: s.totalFee,
                  PaidFee: s.paidFee,
                  DueBalance: s.dueBalance,
                  Status: s.status
                })));
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#F8FAFC',
                color: '#334155',
                border: '1px solid #E2E8F0',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Download size={12} color="#FFFFFF" />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Export CSV</span>
            </button>

            {/* Remove / Archive Selected */}
            <button 
              type="button"
              onClick={() => {
                setBulkDeleteMode('soft');
                setIsBulkDeleteModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FEF2F2',
                color: '#B91C1C',
                border: '1px solid #FECACA',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={12} color="#FFFFFF" />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>Remove Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={async (parsedStudents) => {
          if (onBulkImport) {
            await onBulkImport(parsedStudents);
          }
        }}
      />

      {/* Bulk Batch Transfer Modal (Floating Island Architecture) */}
      {isBulkTransferOpen && (
        <div className="floating-island-overlay" onClick={() => setIsBulkTransferOpen(false)} style={{ zIndex: 1300 }}>
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 440 }}
          >
            {/* Island 1: Dark Navy Header Card */}
            <div style={{
              background: '#0F172A',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: 10, 
                  background: 'rgba(37, 99, 235, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid rgba(37, 99, 235, 0.35)'
                }}>
                  <Filter size={18} color="#60A5FA" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Batch Transfer
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    Reassign {selectedIds.length} selected students
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkTransferOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Floating Choice Selector Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Select Target Batch / Grade
              </label>

              <div>
                <ModernSelect
                  value={targetTransferBatch}
                  onChange={setTargetTransferBatch}
                  options={availableBatches.map(b => ({ value: b, label: b }))}
                  zIndex={1400}
                />
              </div>

              <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                All selected students will be moved into this batch and enrollments will be reassigned immediately.
              </p>
            </div>

            {/* Island 3: Floating Action Pill Row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsBulkTransferOpen(false)}
                style={{
                  flex: 1,
                  background: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  padding: '11px 18px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const ids = [...selectedIds];
                  const batch = targetTransferBatch;
                  setIsBulkTransferOpen(false);
                  setSelectedIds([]);
                  if (onBulkTransfer) {
                    try {
                      await onBulkTransfer(ids, batch);
                    } catch (err) {
                      console.error('Bulk transfer error:', err);
                    }
                  }
                }}
                style={{
                  flex: 1.4,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15,23,42,0.3)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <CheckCircle2 size={14} color="#10B981" /> Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk ID Card Printing Modal */}
      <BulkIDCardModal
        isOpen={isBulkIDCardModalOpen}
        students={bulkIDCardStudents}
        onClose={() => setIsBulkIDCardModalOpen(false)}
      />

      {/* Bulk WhatsApp Message Dispatcher Modal */}
      <WhatsAppBulkModal
        isOpen={isWhatsAppBulkModalOpen}
        students={whatsAppBulkStudents}
        onClose={() => setIsWhatsAppBulkModalOpen(false)}
      />

      {/* Standalone Section-Specific Student Registration Modal */}
      <RegisterStudentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onAddStudent={onAddStudent || (() => {})}
        batches={batches}
      />

      {/* Class Promotion Modal */}
      {isPromotionModalOpen && (
        <ClassPromotionModal
          batches={batches}
          students={students}
          onClose={() => setIsPromotionModalOpen(false)}
        />
      )}

      {/* Student Leave Request Modal */}
      {isLeaveModalOpen && (
        <StudentLeaveModal
          students={students}
          onClose={() => setIsLeaveModalOpen(false)}
        />
      )}

      {/* Change Student Status Modal */}
      {studentToChangeStatus && (
        <ChangeStudentStatusModal
          student={studentToChangeStatus}
          onClose={() => setStudentToChangeStatus(null)}
          onSuccess={() => {
            if (onRefreshStudents) onRefreshStudents();
          }}
        />
      )}

      {/* Leaving Certificate Modal */}
      {studentToLeavingCert && (
        <LeavingCertificateModal
          student={studentToLeavingCert}
          onClose={() => setStudentToLeavingCert(null)}
        />
      )}

      {/* Enroll Student into Course Batch Modal */}
      {studentToEnrollBatch && (
        <EnrollStudentBatchModal
          isOpen={Boolean(studentToEnrollBatch)}
          student={studentToEnrollBatch}
          batches={batches}
          onClose={() => setStudentToEnrollBatch(null)}
          onEnroll={async (payload) => {
            if (!payload.batchId) return;
            try {
              await api.enrollStudentInBatch(payload.batchId, payload);
              setStudentToEnrollBatch(null);
              if (onRefreshStudents) onRefreshStudents();
            } catch (err: any) {
              alert(err.message || 'Error enrolling student in course batch');
            }
          }}
        />
      )}
    </div>
  );
};

