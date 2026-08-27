import React, { useState, useEffect, useMemo } from 'react';
import { Student, ConductLog, ConductCategory, ConductSeverity, UpdateConductLogPayload, StudentStatusHistoryItem } from '../types';
import { X, Calendar, MessageSquare, Plus, ShieldAlert, Award, Check, Clock, Sparkles, Edit2, Trash2, Lock, GraduationCap, AlertCircle, Info, ChevronDown, Key, ShieldCheck, History, UserCheck, FileCheck2, RefreshCw, FileText, AlertTriangle, PauseCircle, Sliders, Globe, Tag, PlayCircle, Layers, CreditCard } from 'lucide-react';
import { ReportCardModal } from './ReportCardModal';
import { StudentFeePlanModal } from './StudentFeePlanModal';
import { ConductLogEditModal } from './ConductLogEditModal';
import { ResetParentPasswordModal } from './ResetParentPasswordModal';
import { ChangeStudentStatusModal } from './ChangeStudentStatusModal';
import { LeavingCertificateModal } from './LeavingCertificateModal';
import { RecordFeeModal } from './RecordFeeModal';
import { FeeSlipModal, FeeSlipData } from './FeeSlipModal';
import { api } from '../api/apiClient';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';
import { openWhatsAppLink } from '../utils/whatsappHelper';

interface StudentProfileDrawerProps {
  student: Student | null;
  onClose: () => void;
  onStudentUpdated?: () => void;
  onOpenPayModal?: (student: Student) => void;
}

const CATEGORY_OPTIONS: { value: ConductCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'commendation', label: 'Commendation & Praise', icon: <Award size={14} color="#475569" /> },
  { value: 'academic', label: 'Academic Assessment', icon: <GraduationCap size={14} color="#475569" /> },
  { value: 'attendance', label: 'Attendance & Punctuality', icon: <Clock size={14} color="#475569" /> },
  { value: 'infraction', label: 'Behavioral Infraction', icon: <AlertTriangle size={14} color="#475569" /> },
  { value: 'general', label: 'General Observation', icon: <FileText size={14} color="#475569" /> }
];

const SEVERITY_OPTIONS: { value: ConductSeverity; label: string; dotColor: string }[] = [
  { value: 'positive', label: 'Positive / Exemplary', dotColor: '#10B981' },
  { value: 'neutral', label: 'Neutral / Note', dotColor: '#94A3B8' },
  { value: 'warning', label: 'Warning / Advisory', dotColor: '#F59E0B' },
  { value: 'critical', label: 'Critical / Escalated', dotColor: '#EF4444' }
];

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, onClose, onStudentUpdated, onOpenPayModal }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'academics' | 'remarks' | 'installments'>('overview');
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [isFeePlanOpen, setIsFeePlanOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
  const [isLeavingCertOpen, setIsLeavingCertOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ConductLog | null>(null);

  // Fee Recording & Voucher Slip State
  const [isRecordFeeOpen, setIsRecordFeeOpen] = useState(false);
  const [preSelectedInvoiceId, setPreSelectedInvoiceId] = useState<string | undefined>(undefined);
  const [preSelectedAmount, setPreSelectedAmount] = useState<number | undefined>(undefined);
  const [feeSlipData, setFeeSlipData] = useState<FeeSlipData | null>(null);
  const [isFeeSlipOpen, setIsFeeSlipOpen] = useState(false);

  // Status History State
  const [statusHistory, setStatusHistory] = useState<StudentStatusHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Installments Roadmap State
  const [installmentSchedules, setInstallmentSchedules] = useState<any[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);

  // Live Conduct Logs State
  const [conductLogs, setConductLogs] = useState<ConductLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newCategory, setNewCategory] = useState<ConductCategory>('commendation');
  const [newSeverity, setNewSeverity] = useState<ConductSeverity>('positive');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSeverityOpen, setIsSeverityOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [newIsConfidential, setNewIsConfidential] = useState(false);
  const [showConfidentialInfo, setShowConfidentialInfo] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Current Logged-in User
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : { id: 'admin-id', role: 'admin', fullName: 'Academy Admin' };
    } catch {
      return { id: 'admin-id', role: 'admin', fullName: 'Academy Admin' };
    }
  }, []);

  // Fetch Conduct Logs from API
  const fetchConductLogs = async () => {
    if (!student) return;
    try {
      setIsLoadingLogs(true);
      const data = await api.getStudentConductLogs(student.id);
      if (Array.isArray(data)) {
        setConductLogs(data);
      }
    } catch (err: any) {
      console.warn('Could not fetch conduct logs from server, using local fallback:', err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Status Transition History from API
  const fetchStatusHistory = async () => {
    if (!student) return;
    try {
      setIsLoadingHistory(true);
      const data = await api.getStudentStatusHistory(student.id);
      if (Array.isArray(data)) {
        setStatusHistory(data);
      }
    } catch (err: any) {
      console.warn('Could not fetch status history from server:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch Course Installment Schedules from API
  const fetchInstallments = async () => {
    if (!student) return;
    try {
      setIsLoadingInstallments(true);
      const data = await api.getStudentInstallmentSchedule(student.id);
      if (Array.isArray(data)) {
        setInstallmentSchedules(data);
      }
    } catch (err: any) {
      console.warn('Could not fetch installment schedules:', err.message);
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  useEffect(() => {
    if (student) {
      fetchConductLogs();
      fetchStatusHistory();
      fetchInstallments();
    }
  }, [student?.id]);

  if (!student) return null;

  // Check if current user can edit or delete a conduct log
  const canModifyLog = (log: ConductLog) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'teacher' && (currentUser.id === log.authorId || currentUser.userId === log.authorId)) return true;
    return false;
  };

  const handleAddConductLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim() || newRemark.trim().length < 3) return;

    const mockNew: ConductLog = {
      id: 'log-' + Date.now(),
      studentId: student.id,
      authorId: currentUser.id || 'current-user',
      authorName: currentUser.fullName || 'Academy Admin',
      authorRole: currentUser.role || 'admin',
      category: newCategory,
      severity: newSeverity,
      title: newTitle.trim() || undefined,
      remark: newRemark.trim(),
      isConfidential: newIsConfidential,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Instant local update
    setConductLogs(prev => [mockNew, ...prev]);
    setNewRemark('');
    setNewTitle('');
    setNewCategory('commendation');
    setNewSeverity('positive');
    setNewIsConfidential(false);

    // 2. Background sync
    api.createConductLog(student.id, {
      category: newCategory,
      severity: newSeverity,
      title: newTitle.trim() || undefined,
      remark: newRemark.trim(),
      is_confidential: newIsConfidential
    }).then(created => {
      if (created) {
        setConductLogs(prev => prev.map(l => l.id === mockNew.id ? created : l));
      }
    }).catch(err => console.error('Error creating conduct log in background:', err));
  };

  const handleSaveEdit = (id: string, payload: UpdateConductLogPayload) => {
    // 1. Instant local update
    setConductLogs(prev => prev.map(l => l.id === id ? { ...l, ...payload, updatedAt: new Date().toISOString() } : l));
    
    // 2. Background sync
    api.updateConductLog(id, payload).catch(err => console.error('Error updating conduct log in background:', err));
  };

  const handleDeleteLog = (id: string) => {
    if (!window.confirm('Are you sure you want to soft-delete this conduct log? Historical audit logs will be preserved.')) return;
    
    // 1. Instant local removal
    setConductLogs(prev => prev.filter(l => l.id !== id));
    
    // 2. Background sync
    api.deleteConductLog(id).catch(err => console.error('Error deleting conduct log in background:', err));
  };

  const getCategoryBadge = (cat: ConductCategory) => {
    switch (cat) {
      case 'commendation':
        return { label: 'Commendation', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: <Award size={13} /> };
      case 'infraction':
        return { label: 'Infraction', bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', icon: <ShieldAlert size={13} /> };
      case 'academic':
        return { label: 'Academic', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: <GraduationCap size={13} /> };
      case 'attendance':
        return { label: 'Attendance', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: <Clock size={13} /> };
      default:
        return { label: 'General', bg: '#F8FAFC', text: '#334155', border: '#E2E8F0', icon: <MessageSquare size={13} /> };
    }
  };

  const handleOpenReceiveFee = (amount?: number, invoiceId?: string) => {
    if (onOpenPayModal && student && !invoiceId) {
      onOpenPayModal(student);
      return;
    }
    setPreSelectedAmount(amount || (student?.dueBalance && student.dueBalance > 0 ? student.dueBalance : undefined));
    setPreSelectedInvoiceId(invoiceId);
    setIsRecordFeeOpen(true);
  };

  const handleRecordPaymentSubmit = (paymentData: any) => {
    // 1. Instant UI update & show official receipt with zero delay
    if (onStudentUpdated) onStudentUpdated();

    setFeeSlipData({
      invoiceId: paymentData.invoiceId,
      receiptNo: `REC-${Date.now().toString().slice(-6)}`,
      studentName: student?.name || '',
      admissionNo: student?.regNo || '',
      parentName: student?.parentName,
      parentPhone: student?.phone,
      batchName: student?.gradeBatch,
      grossAmount: paymentData.amount,
      discountAmount: 0,
      netAmount: paymentData.amount,
      paidAmount: paymentData.amount,
      balanceAmount: Math.max(0, (student?.dueBalance || 0) - paymentData.amount),
      dueDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: paymentData.method,
      paidAt: new Date().toISOString()
    });
    setIsFeeSlipOpen(true);

    // 2. Background server sync
    api.recordPayment(paymentData).then(() => {
      fetchInstallments();
      if (onStudentUpdated) onStudentUpdated();
    }).catch(err => {
      console.error('Error recording fee payment in background:', err);
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, backdropFilter: 'blur(8px)' }}>
      <div 
        className="profile-drawer-card" 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 620,
          background: '#F8FAFC',
          boxShadow: '-12px 0 32px rgba(15,23,42,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header Island */}
        <div style={{ flexShrink: 0, background: '#0F172A', color: '#FFFFFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1E293B' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 800 }}>
                {student.status}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.02em' }}>{student.regNo}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>{student.name}</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 3, margin: 0 }}>{student.gradeBatch} 360° Profile</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: 'none', 
              color: '#94A3B8', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              transition: 'all 0.15s ease' 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector Bar (5-Column Grid with zero horizontal scrolling) */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '6px 10px', gap: 4, overflow: 'hidden' }}>
          {(['overview', 'attendance', 'academics', 'remarks', 'installments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 4px',
                border: 'none',
                background: activeTab === tab ? '#0F172A' : 'transparent',
                borderRadius: 8,
                color: activeTab === tab ? '#FFFFFF' : '#64748B',
                fontWeight: activeTab === tab ? 800 : 600,
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              {tab === 'overview' && <><FileText size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Overview</span></>}
              {tab === 'attendance' && <><Calendar size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Attendance</span></>}
              {tab === 'academics' && <><GraduationCap size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Academics</span></>}
              {tab === 'remarks' && <><MessageSquare size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Conduct{conductLogs.length > 0 ? ` (${conductLogs.length})` : ''}</span></>}
              {tab === 'installments' && <><Layers size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Installments{installmentSchedules.length > 0 ? ` (${installmentSchedules.length})` : ''}</span></>}
            </button>
          ))}
        </div>

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TAB 1: OVERVIEW & EMERGENCY CONTACT */}
          {activeTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.04em' }}>TUITION STATUS</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: student.dueBalance > 0 ? '#DC2626' : '#16A34A', marginTop: 4 }}>
                      {student.dueBalance > 0 ? `PKR ${formatCurrency(student.dueBalance)} Due` : 'Fully Paid'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {student.dueBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenReceiveFee(student.dueBalance)}
                        style={{
                          fontSize: 11,
                          color: '#FFFFFF',
                          background: '#0F172A',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          boxShadow: '0 2px 6px rgba(15,23,42,0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <CreditCard size={12} color="#10B981" /> Receive Fee
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFeePlanOpen(true)}
                      style={{ fontSize: 11, color: '#0F172A', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, padding: '5px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Sliders size={12} color="#475569" /> Fee Terms
                    </button>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.04em' }}>ATTENDANCE RATE</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>95.2%</div>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Check size={13} /> Highly Consistent
                  </span>
                </div>
              </div>

              {/* Emergency Contact Card */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={16} color="#DC2626" /> Emergency & Parent Contact Card
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#FFF1F2', padding: 14, borderRadius: 12, border: '1px solid #FECDD3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Primary Contact:</span>
                    <strong style={{ color: '#0F172A' }}>{student.parentName} (Parent)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Emergency Phone:</span>
                    <a href={`tel:${student.phone}`} style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>{student.phone}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Registered Email:</span>
                    <span style={{ color: '#0F172A' }}>{student.email || 'None on file'}</span>
                  </div>
                </div>
              </div>

              {/* Parent Portal Access & Security Control Card */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="#475569" /> Parent Portal Access & Security
                  </h3>
                  <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 800 }}>
                    Active
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Parent Login ID</span>
                    <strong style={{ fontSize: 14, color: '#0F172A', fontFamily: 'monospace' }}>{student.phone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResetPasswordOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Key size={13} /> Reset Parent Password
                  </button>
                </div>
              </div>

              {/* Student Status & Lifecycle Control Card */}
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={16} color="#475569" /> Student Enrollment & Status Control
                  </h3>
                  <span style={{ 
                    background: student.status === 'Active' ? '#DCFCE7' : (student.status === 'On Leave' ? '#FEF3C7' : (student.status === 'Graduated' ? '#F3E8FF' : '#FEE2E2')),
                    color: student.status === 'Active' ? '#166534' : (student.status === 'On Leave' ? '#92400E' : (student.status === 'Graduated' ? '#6B21A8' : '#991B1B')),
                    border: `1px solid ${student.status === 'Active' ? '#BBF7D0' : (student.status === 'On Leave' ? '#FDE68A' : (student.status === 'Graduated' ? '#E9D5FF' : '#FECACA'))}`,
                    padding: '2px 10px', 
                    borderRadius: 9999, 
                    fontSize: 11, 
                    fontWeight: 800 
                  }}>
                    {student.status}
                  </span>
                </div>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Lifecycle State</span>
                    <strong style={{ fontSize: 13, color: '#0F172A' }}>
                      {student.status} {student.statusReason ? `(${student.statusReason})` : ''}
                    </strong>
                    {student.isFeePaused && (student.status === 'On Leave' || (student.status as string).toLowerCase() === 'inactive') && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#D97706', marginTop: 2 }}>
                        <PauseCircle size={12} color="#D97706" /> Monthly fee billing paused
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setIsChangeStatusOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <UserCheck size={13} /> Change Status
                    </button>
                    {(student.status === 'Graduated' || student.status === 'Left' || student.status === 'On Leave') && (
                      <button
                        type="button"
                        onClick={() => setIsLeavingCertOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#FFFFFF',
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                          padding: '8px 14px',
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <FileCheck2 size={13} color="#475569" /> Leaving Cert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ATTENDANCE HEATMAP */}
          {activeTab === 'attendance' && (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="#475569" /> Monthly Attendance Summary
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const isAbsent = i === 5 || i === 18;
                  const isLate = i === 12;
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        aspectRatio: '1', 
                        borderRadius: 8, 
                        background: isAbsent ? '#FEE2E2' : isLate ? '#FEF3C7' : '#DCFCE7',
                        color: isAbsent ? '#B91C1C' : isLate ? '#B45309' : '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                      title={`Day ${i + 1}: ${isAbsent ? 'Absent' : isLate ? 'Late' : 'Present'}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#15803D', fontWeight: 600 }}><Check size={13} /> Present (25 Days)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B91C1C', fontWeight: 600 }}><X size={13} /> Absent (2 Days)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B45309', fontWeight: 600 }}><Clock size={13} /> Late (1 Day)</span>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC MARKSHEETS */}
          {activeTab === 'academics' && (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <Award size={16} color="#475569" /> Term Marksheet & Exam Grades
                </h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsReportCardOpen(true)}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 9999 }}
                >
                  <Sparkles size={13} /> Generate Report Card
                </button>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11, color: '#64748B' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Subject</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>Score</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>Mathematics</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>88/100</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>Physics</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>92/100</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>A+</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>Chemistry</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>81/100</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#2563EB' }}>B+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BEHAVIOR & CONDUCT LOGS (TASTE SYSTEM COHESION) */}
          {activeTab === 'remarks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <MessageSquare size={17} color="#0F172A" /> Behavior, Disciplinary & Conduct Logs
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0, marginTop: 3 }}>
                    Official pedagogical observations, commendations, and staff incident notes.
                  </p>
                </div>
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800 }}>
                  {conductLogs.length} Records
                </span>
              </div>

              {/* Elevated Theme-Matching Entry Card */}
              {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                <form 
                  onSubmit={handleAddConductLog} 
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 16,
                    padding: '18px 20px',
                    boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}
                >
                  {/* Form Header with Confidential Toggle & Explanation Mark (!) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Log New Student Observation
                      </span>
                    </div>
                    
                    {/* Confidential Staff Note Checkbox Toggle + Explanation Mark (!) Popover */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                      <label 
                        onClick={() => setNewIsConfidential(!newIsConfidential)}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          fontSize: 11, 
                          fontWeight: 700, 
                          color: newIsConfidential ? '#FFFFFF' : '#475569', 
                          background: newIsConfidential ? '#0F172A' : '#F8FAFC',
                          border: newIsConfidential ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          padding: '5px 12px',
                          borderRadius: 9999,
                          cursor: 'pointer',
                          boxShadow: newIsConfidential ? '0 2px 8px rgba(15,23,42,0.25)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          userSelect: 'none'
                        }}
                      >
                        {/* Custom Checkbox Box with Crisp White Tick */}
                        <div 
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            border: newIsConfidential ? '1.5px solid #FFFFFF' : '1.5px solid #94A3B8',
                            background: newIsConfidential ? '#0F172A' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {newIsConfidential && (
                            <Check size={11} color="#FFFFFF" strokeWidth={3.5} />
                          )}
                        </div>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Lock size={12} color={newIsConfidential ? '#F59E0B' : '#64748B'} />
                          <span>Confidential Staff Note</span>
                        </span>
                      </label>

                      {/* Explanation Mark (!) Interactive Button with Custom Themed Floating Popover */}
                      <div 
                        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                        onMouseEnter={() => setShowConfidentialInfo(true)}
                        onMouseLeave={() => setShowConfidentialInfo(false)}
                      >
                        <button
                          type="button"
                          onClick={() => setShowConfidentialInfo(!showConfidentialInfo)}
                          aria-label="Confidentiality details"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: showConfidentialInfo ? '#0F172A' : '#EFF6FF',
                            color: showConfidentialInfo ? '#FFFFFF' : '#2563EB',
                            border: '1px solid #BFDBFE',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 900,
                            boxShadow: '0 1px 4px rgba(37,99,235,0.12)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          !
                        </button>

                        {/* Custom Theme Popover Tooltip */}
                        {showConfidentialInfo && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 8px)',
                              right: 0,
                              width: 270,
                              background: '#0F172A',
                              color: '#FFFFFF',
                              borderRadius: 12,
                              padding: '12px 14px',
                              boxShadow: '0 12px 30px -4px rgba(15,23,42,0.35)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              zIndex: 100,
                              fontSize: 12,
                              lineHeight: 1.45,
                              animation: 'fadeIn 0.15s ease-out'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#38BDF8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <Lock size={12} color="#F59E0B" /> Note Visibility Rules
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#CBD5E1' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <span style={{ color: '#F59E0B', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Lock size={11} color="#F59E0B" /> Active:</span>
                                <span>Visible <strong>only</strong> to Teachers & Admins. Hidden from Student & Parent portals.</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                                <span style={{ color: '#10B981', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Globe size={11} color="#10B981" /> Inactive:</span>
                                <span>Visible to Student and linked Parents (e.g. commendations, praise).</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category & Severity Grid with Custom Themed Dropdowns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* 1. Custom Category Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryOpen(!isCategoryOpen);
                          setIsSeverityOpen(false);
                        }}
                        style={{
                          width: '100%',
                          fontSize: 13,
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: isCategoryOpen ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: isCategoryOpen ? '0 0 0 2px rgba(15,23,42,0.08)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                          <span>{CATEGORY_OPTIONS.find(o => o.value === newCategory)?.icon}</span>
                          <span>{CATEGORY_OPTIONS.find(o => o.value === newCategory)?.label}</span>
                        </span>
                        <ChevronDown 
                          size={14} 
                          color="#64748B" 
                          style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} 
                        />
                      </button>

                      {/* Floating Category Menu */}
                      {isCategoryOpen && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 12px 28px -4px rgba(15,23,42,0.15)',
                            padding: 6,
                            zIndex: 120,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            animation: 'fadeIn 0.15s ease-out'
                          }}
                        >
                          {CATEGORY_OPTIONS.map(opt => {
                            const isSelected = opt.value === newCategory;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setNewCategory(opt.value);
                                  setIsCategoryOpen(false);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#1D4ED8' : '#334155',
                                  background: isSelected ? '#EFF6FF' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'background 0.1s ease'
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <span>{opt.icon}</span>
                                  <span>{opt.label}</span>
                                </span>
                                {isSelected && <Check size={14} color="#2563EB" strokeWidth={2.5} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. Custom Severity Dropdown */}
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                        Severity / Tone
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSeverityOpen(!isSeverityOpen);
                          setIsCategoryOpen(false);
                        }}
                        style={{
                          width: '100%',
                          fontSize: 13,
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          border: isSeverityOpen ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          boxShadow: isSeverityOpen ? '0 0 0 2px rgba(15,23,42,0.08)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_OPTIONS.find(o => o.value === newSeverity)?.dotColor, display: 'inline-block' }} />
                          <span>{SEVERITY_OPTIONS.find(o => o.value === newSeverity)?.label}</span>
                        </span>
                        <ChevronDown 
                          size={14} 
                          color="#64748B" 
                          style={{ transform: isSeverityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} 
                        />
                      </button>

                      {/* Floating Severity Menu */}
                      {isSeverityOpen && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: '#FFFFFF',
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 12px 28px -4px rgba(15,23,42,0.15)',
                            padding: 6,
                            zIndex: 120,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            animation: 'fadeIn 0.15s ease-out'
                          }}
                        >
                          {SEVERITY_OPTIONS.map(opt => {
                            const isSelected = opt.value === newSeverity;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setNewSeverity(opt.value);
                                  setIsSeverityOpen(false);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#1D4ED8' : '#334155',
                                  background: isSelected ? '#EFF6FF' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'background 0.1s ease'
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dotColor, display: 'inline-block' }} />
                                  <span>{opt.label}</span>
                                </span>
                                {isSelected && <Check size={14} color="#2563EB" strokeWidth={2.5} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title Field */}
                  <div>
                    <input 
                      className="form-input"
                      placeholder="Subject title (e.g. Chapter 3 Math Excellence, Classroom Participation)..."
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      style={{ width: '100%', fontSize: 13, background: '#F8FAFC', borderRadius: 10, padding: '8px 12px' }}
                    />
                  </div>

                  {/* Remark & Submit Pill Button */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <textarea 
                      className="form-input"
                      rows={2}
                      placeholder="Enter detailed pedagogical or behavioral remark..."
                      value={newRemark}
                      onChange={e => setNewRemark(e.target.value)}
                      style={{ flex: 1, fontSize: 13, resize: 'vertical', background: '#F8FAFC', borderRadius: 10, padding: '8px 12px' }}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmittingLog || !newRemark.trim()}
                      style={{ 
                        padding: '10px 18px', 
                        alignSelf: 'stretch', 
                        fontSize: 13, 
                        fontWeight: 800, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 10,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={16} /> {isSubmittingLog ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline of Conduct Records */}
              {isLoadingLogs ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  Loading conduct records...
                </div>
              ) : conductLogs.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', background: '#FFFFFF', borderRadius: 16, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 13 }}>
                  <Award size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>No Conduct Logs Recorded</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
                    Observations entered by teachers and administrators will appear here chronologically.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {conductLogs.map(log => {
                    const badge = getCategoryBadge(log.category);
                    const canModify = canModifyLog(log);
                    const formattedDate = log.createdAt ? new Date(log.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Recent';

                    return (
                      <div 
                        key={log.id} 
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          position: 'relative'
                        }}
                      >
                        {/* Header Badge & Action Icons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span 
                              style={{
                                background: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {badge.icon} {badge.label}
                            </span>

                            {log.isConfidential && (
                              <span 
                                title="Confidential: Visible only to Teachers and Administrators (hidden from Student & Parent portals)"
                                style={{
                                  background: '#FEF3C7',
                                  color: '#B45309',
                                  border: '1px solid #FDE68A',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'help',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Lock size={10} /> Confidential
                              </span>
                            )}

                            {log.title && (
                              <strong style={{ fontSize: 13, color: '#0F172A' }}>
                                {log.title}
                              </strong>
                            )}
                          </div>

                          {/* RBAC Protected Action Controls */}
                          {canModify ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button
                                type="button"
                                title="Edit Conduct Log"
                                onClick={() => setEditingLog(log)}
                                style={{
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#2563EB',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                title="Delete Conduct Log"
                                onClick={() => handleDeleteLog(log.id)}
                                style={{
                                  background: '#FFF1F2',
                                  border: '1px solid #FECDD3',
                                  color: '#DC2626',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                              Read-Only
                            </span>
                          )}
                        </div>

                        {/* Remark Body */}
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
                          {log.remark}
                        </div>

                        {/* Footer Author Attribution & Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8, marginTop: 2 }}>
                          <span>
                            Logged by <strong>{log.authorName}</strong> ({log.authorRole === 'admin' ? 'Super Admin' : 'Teacher'})
                          </span>
                          <span>
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COURSE INSTALLMENT SCHEDULES & ROADMAP */}
          {activeTab === 'installments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={16} color="#2563EB" /> Fixed Course Installment Roadmap
                  </h3>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0, marginTop: 2 }}>
                    Sequential installment breakdown and scheduled billing vouchers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchInstallments}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={isLoadingInstallments ? 'spin' : ''} /> Refresh
                </button>
              </div>

              {isLoadingInstallments ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 13 }}>
                  Loading installment roadmap...
                </div>
              ) : installmentSchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 36, background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    <Layers size={22} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>No Active Course Installments</h4>
                  <p style={{ fontSize: 12, color: '#64748B', maxWidth: 360, margin: 0 }}>
                    This student is enrolled in standard monthly recurring tuition or has not joined a multi-installment course batch.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {installmentSchedules.map((item, idx) => {
                    const isInvoiced = Boolean(item.invoiceId || item.status === 'invoiced');
                    const isPaid = item.invoiceStatus === 'paid' || item.status === 'paid';
                    const isOverdue = item.invoiceStatus === 'overdue';

                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          padding: '16px',
                          boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 6,
                                background: isInvoiced ? '#0F172A' : '#F1F5F9',
                                color: isInvoiced ? '#FFFFFF' : '#475569',
                                letterSpacing: '0.02em'
                              }}
                            >
                              Installment {item.installmentNumber} of {item.totalInstallments}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                              {item.batchName || 'Course Batch'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                              PKR {formatCurrency(item.amount)}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                background: isPaid ? '#DCFCE7' : isInvoiced ? (isOverdue ? '#FEE2E2' : '#FEF3C7') : '#F1F5F9',
                                color: isPaid ? '#166534' : isInvoiced ? (isOverdue ? '#991B1B' : '#92400E') : '#475569',
                                border: `1px solid ${isPaid ? '#BBF7D0' : isInvoiced ? (isOverdue ? '#FECACA' : '#FDE68A') : '#CBD5E1'}`
                              }}
                            >
                              {isPaid ? 'Paid' : isInvoiced ? (isOverdue ? 'Overdue Voucher' : 'Active Voucher') : 'Scheduled'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#F8FAFC', padding: 10, borderRadius: 10, fontSize: 12, border: '1px solid #F1F5F9' }}>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>
                              Coverage Window
                            </span>
                            <strong style={{ color: '#334155' }}>
                              {formatCoveragePeriod(item.feePeriodStart, item.feePeriodEnd)}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>
                              Due Date
                            </span>
                            <strong style={{ color: '#334155' }}>
                              {item.dueDate}
                            </strong>
                          </div>
                        </div>

                        {/* Installment Action Buttons Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 10, marginTop: 4 }}>
                          {item.invoiceId ? (
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              Voucher: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>#{item.invoiceId.slice(0, 10)}</strong>
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              Status: <strong style={{ color: '#64748B' }}>Scheduled for future billing</strong>
                            </span>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenReceiveFee(item.amount, item.invoiceId)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#0F172A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <CreditCard size={13} color="#10B981" /> Receive Fee
                              </button>
                            )}

                            {/* View / Print Slip */}
                            <button
                              type="button"
                              onClick={() => {
                                setFeeSlipData({
                                  invoiceId: item.invoiceId,
                                  studentName: student.name,
                                  admissionNo: student.regNo,
                                  parentName: student.parentName,
                                  parentPhone: student.phone,
                                  batchName: item.batchName || student.gradeBatch,
                                  feePeriodStart: item.feePeriodStart,
                                  feePeriodEnd: item.feePeriodEnd,
                                  installmentNumber: item.installmentNumber,
                                  totalInstallments: item.totalInstallments,
                                  grossAmount: item.amount,
                                  discountAmount: 0,
                                  netAmount: item.amount,
                                  paidAmount: isPaid ? item.amount : (item.paidAmount || 0),
                                  balanceAmount: isPaid ? 0 : (item.amount - (item.paidAmount || 0)),
                                  dueDate: item.dueDate,
                                  status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'unpaid'),
                                  paymentMethod: item.paymentMethod || 'Cash'
                                });
                                setIsFeeSlipOpen(true);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: '#FFFFFF',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '6px 10px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <FileText size={12} color="#475569" /> {isPaid ? 'Paid Receipt' : 'Voucher Slip'}
                            </button>

                            {/* WhatsApp Reminder */}
                            <button
                              type="button"
                              onClick={() => {
                                const msg = isPaid 
                                  ? `Assalam-o-Alaikum ${student.parentName},\n\nPayment confirmation for *${student.name}*:\nInstallment: ${item.installmentNumber}/${item.totalInstallments} (${item.batchName || student.gradeBatch})\nAmount Paid: PKR ${formatCurrency(item.amount)}\nStatus: PAID\n\nThank you! – AcademiaPro`
                                  : `Assalam-o-Alaikum ${student.parentName},\n\nFee Reminder for *${student.name}*:\nInstallment: ${item.installmentNumber}/${item.totalInstallments} (${item.batchName || student.gradeBatch})\nDue Amount: PKR ${formatCurrency(item.amount)}\nDue Date: ${item.dueDate}\n\nPlease clear dues on time. – AcademiaPro`;
                                openWhatsAppLink(student.phone, msg);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#F0FDF4',
                                color: '#15803D',
                                border: '1px solid #BBF7D0',
                                padding: '6px 10px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <MessageSquare size={12} color="#16A34A" /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Direct Record Fee Collection Modal */}
      {isRecordFeeOpen && student && (
        <RecordFeeModal
          isOpen={isRecordFeeOpen}
          onClose={() => {
            setIsRecordFeeOpen(false);
            setPreSelectedInvoiceId(undefined);
            setPreSelectedAmount(undefined);
          }}
          onAddPayment={handleRecordPaymentSubmit}
          students={[student]}
          preSelectedStudentId={student.id}
          preSelectedInvoiceId={preSelectedInvoiceId}
          preSelectedAmount={preSelectedAmount}
        />
      )}

      {/* Official Voucher / Receipt Slip Modal */}
      {isFeeSlipOpen && feeSlipData && (
        <FeeSlipModal
          isOpen={isFeeSlipOpen}
          onClose={() => {
            setIsFeeSlipOpen(false);
            setFeeSlipData(null);
          }}
          data={feeSlipData}
        />
      )}

      {editingLog && (
        <ConductLogEditModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={handleSaveEdit}
        />
      )}

      {isReportCardOpen && (
        <ReportCardModal
          student={student}
          onClose={() => setIsReportCardOpen(false)}
        />
      )}

      {isFeePlanOpen && (
        <StudentFeePlanModal
          student={student}
          onClose={() => setIsFeePlanOpen(false)}
        />
      )}

      {isResetPasswordOpen && student && (
        <ResetParentPasswordModal
          student={{
            id: student.id,
            name: student.name,
            regNo: student.regNo,
            parentName: student.parentName,
            phone: student.phone
          }}
          onClose={() => setIsResetPasswordOpen(false)}
        />
      )}

      {isChangeStatusOpen && student && (
        <ChangeStudentStatusModal
          student={student}
          onClose={() => setIsChangeStatusOpen(false)}
          onSuccess={() => {
            fetchStatusHistory();
            if (onStudentUpdated) onStudentUpdated();
          }}
        />
      )}

      {isLeavingCertOpen && student && (
        <LeavingCertificateModal
          student={student}
          onClose={() => setIsLeavingCertOpen(false)}
        />
      )}
    </div>
  );
};

