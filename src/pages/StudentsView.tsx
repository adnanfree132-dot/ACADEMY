import React, { useState } from 'react';
import { Student } from '../types';
import { Search, Plus, Filter, AlertCircle, CheckCircle2, Download, Edit, Trash2, DollarSign, MessageCircle, Phone, PhoneCall, Clock, PieChart, ChevronRight, ChevronDown, MoreVertical, UploadCloud, ShieldCheck, Award, Users, Wallet, TrendingUp } from 'lucide-react';

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

import { getUnitHeader, getFilterLabel } from '../utils/academyModeHelper';
import { Batch, FeeTransaction } from '../types';

interface StudentsViewProps {
  students: Student[];
  batches: Batch[];
  onOpenCreateModal: () => void;
  onAddStudent?: (studentData: any) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddPayment: (paymentData: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
  onBulkImport?: (studentList: any[]) => Promise<void>;
  onBulkDelete?: (studentIds: string[]) => Promise<void>;
  onBulkTransfer?: (studentIds: string[], targetBatch: string) => Promise<void>;
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
  onBulkTransfer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Pending' | 'Defaulters'>('All');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToPay, setStudentToPay] = useState<Student | null>(null);
  const [ledgerStudent, setLedgerStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [credentialData, setCredentialData] = useState<CredentialData | null>(null);
  const [activeContactStudentId, setActiveContactStudentId] = useState<string | null>(null);
  
  // Bulk Selection & Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [isBulkIDCardModalOpen, setIsBulkIDCardModalOpen] = useState(false);
  const [bulkIDCardStudents, setBulkIDCardStudents] = useState<Student[]>([]);
  const [isWhatsAppBulkModalOpen, setIsWhatsAppBulkModalOpen] = useState(false);
  const [whatsAppBulkStudents, setWhatsAppBulkStudents] = useState<Student[]>([]);
  const [targetTransferBatch, setTargetTransferBatch] = useState<string>('Grade 10');
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

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

  const filteredStudents = students.filter(s => {
    // Hide soft-deleted/archived students from the default view
    if (s.status === 'Left' || s.status === 'Suspended') return false;

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
                  <Clock size={14} color="#2563EB" /> Manage Leaves
                </button>
                <button type="button" className="header-menu-item" onClick={() => setIsPromotionModalOpen(true)}>
                  <ShieldCheck size={14} color="#2563EB" /> Promote Class
                </button>
                <button 
                  type="button"
                  className="header-menu-item" 
                  onClick={() => {
                    setBulkIDCardStudents(filteredStudents);
                    setIsBulkIDCardModalOpen(true);
                  }}
                >
                  <Award size={14} color="#EA580C" /> Bulk Print Cards ({filteredStudents.length})
                </button>
                <button type="button" className="header-menu-item" onClick={() => setIsBulkImportOpen(true)}>
                  <UploadCloud size={14} color="#059669" /> Import CSV
                </button>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={() => setIsRegisterModalOpen(true)}>
            <Plus size={15} /> Add Student
          </button>
        </div>
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
              filteredStudents.map(student => (
                <tr key={student.id} style={{ background: selectedIds.includes(student.id) ? 'rgba(59, 130, 246, 0.04)' : undefined }}>
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
                      <span className="badge badge-blue">{student.status}</span>
                      <span className="badge badge-green">{(student as any).attendancePercentage || 94}% Att.</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                    <div className="table-action-group">
                      {/* View 360 Profile */}
                      <button 
                        className="btn-secondary btn-sm" 
                        onClick={() => setSelectedStudent(student)} 
                        title="View 360° Profile"
                      >
                        View
                      </button>
                      
                      {/* Contact / Phone Options (WhatsApp & Call) */}
                      <div style={{ position: 'relative', display: 'inline-block' }}>
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
                      <div style={{ position: 'relative', display: 'inline-block' }}>
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

                        {activeRowActionId === student.id && (
                          <div className="header-menu-dropdown" onClick={() => setActiveRowActionId(null)}>
                            <button
                              type="button"
                              className="header-menu-item"
                              onClick={() => setIdCardStudent(student)}
                            >
                              <Award size={14} color="#0284C7" /> Print ID Card
                            </button>

                            <button
                              type="button"
                              className="header-menu-item"
                              onClick={() => setCredentialData({
                                admissionNo: student.regNo,
                                studentName: student.name,
                                studentUsername: `std_${student.regNo.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                                studentPassword: `Pass#${Math.floor(1000 + Math.random()*9000)}`,
                                parentName: student.parentName,
                                parentPhone: student.phone,
                                parentUsername: `prt_${student.phone.replace(/\D/g, '').slice(-6)}`,
                                parentPassword: `Par#${Math.floor(1000 + Math.random()*9000)}`
                              })}
                            >
                              <ShieldCheck size={14} color="#059669" /> App Login Slip
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
                              className="header-menu-item"
                              style={{ color: '#DC2626' }}
                              onClick={() => setStudentToDelete(student)}
                            >
                              <Trash2 size={14} color="#DC2626" /> Archive Student
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
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
          filteredStudents.map(student => (
            <div key={student.id} className="mobile-entity-card">
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
                  <span className="badge badge-blue">{student.status}</span>
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
                  <div style={{ position: 'relative', display: 'inline-block' }}>
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
                  <div style={{ position: 'relative', display: 'inline-block' }}>
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
                          onClick={() => setIdCardStudent(student)}
                        >
                          <Award size={14} color="#0284C7" /> Print ID Card
                        </button>

                        <button
                          type="button"
                          className="header-menu-item"
                          onClick={() => setCredentialData({
                            admissionNo: student.regNo,
                            studentName: student.name,
                            studentUsername: `std_${student.regNo.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                            studentPassword: `Pass#${Math.floor(1000 + Math.random()*9000)}`,
                            parentName: student.parentName,
                            parentPhone: student.phone,
                            parentUsername: `prt_${student.phone.replace(/\D/g, '').slice(-6)}`,
                            parentPassword: `Par#${Math.floor(1000 + Math.random()*9000)}`
                          })}
                        >
                          <ShieldCheck size={14} color="#059669" /> App Login Slip
                        </button>

                        <button
                          type="button"
                          className="header-menu-item"
                          onClick={() => setStudentToEdit(student)}
                        >
                          <Edit size={14} color="#475569" /> Edit Profile
                        </button>

                        <button
                          type="button"
                          className="header-menu-item"
                          style={{ color: '#DC2626' }}
                          onClick={() => setStudentToDelete(student)}
                        >
                          <Trash2 size={14} color="#DC2626" /> Archive Student
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
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

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="modal-overlay" onClick={() => setStudentToDelete(null)} style={{ zIndex: 1200 }}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ background: '#FEE2E2', padding: 16, borderRadius: '50%' }}>
                <AlertCircle size={32} color="#DC2626" />
              </div>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Archive / Delete Student?
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{studentToDelete.name}</strong> ({studentToDelete.regNo})? 
              <br /><br />
              If this student has past fee records, they will be <strong>soft-archived</strong> rather than hard-deleted to preserve financial integrity.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary flex-1" onClick={() => setStudentToDelete(null)}>
                Cancel
              </button>
              <button 
                className="btn-danger flex-1" 
                onClick={() => {
                  onDeleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }}
              >
                Yes, Remove
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

            {/* Archive Selected */}
            <button 
              type="button"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to archive ${selectedIds.length} selected students?`)) {
                  try {
                    if (onBulkDelete) {
                      await onBulkDelete(selectedIds);
                    }
                    setSelectedIds([]);
                  } catch (err) {
                    console.error('Bulk delete error:', err);
                  }
                }
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
              <span style={{ whiteSpace: 'nowrap' }}>Archive Selected</span>
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

      {/* Bulk Batch Transfer Modal */}
      {isBulkTransferOpen && (
        <div className="modal-overlay" onClick={() => setIsBulkTransferOpen(false)} style={{ zIndex: 1200 }}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
              Batch Transfer ({selectedIds.length} Students)
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Select target batch/grade to reassign selected students:
            </p>

            <select
              value={targetTransferBatch}
              onChange={e => setTargetTransferBatch(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, marginBottom: 20 }}
            >
              {availableBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsBulkTransferOpen(false)}>Cancel</button>
              <button 
                className="btn-primary"
                onClick={async () => {
                  if (onBulkTransfer) {
                    await onBulkTransfer(selectedIds, targetTransferBatch);
                  }
                  setIsBulkTransferOpen(false);
                  setSelectedIds([]);
                }}
              >
                Confirm Transfer
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
    </div>
  );
};

