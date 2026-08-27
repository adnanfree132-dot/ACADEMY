import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  FileText, 
  PauseCircle, 
  PlayCircle, 
  GraduationCap, 
  Ban, 
  LogOut, 
  CheckCircle2,
  HelpCircle,
  Clock,
  HeartPulse,
  DollarSign,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { Student, StatusReasonCategory, StudentLifecycleStatus } from '../types';
import { api } from '../api/apiClient';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';

interface ChangeStudentStatusModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeStudentStatusModal: React.FC<ChangeStudentStatusModalProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  // Normalize current student status to lowercase key
  const getNormalizedStatus = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes('leave') || lower === 'inactive') return 'inactive';
    if (lower.includes('graduat') || lower === 'alumni') return 'graduated';
    if (lower.includes('suspend')) return 'suspended';
    if (lower.includes('left') || lower.includes('withdraw') || lower.includes('remov')) return 'left';
    return 'active';
  };

  const initialStatus = getNormalizedStatus(student.status);
  const [targetStatus, setTargetStatus] = useState<'active' | 'inactive' | 'suspended' | 'graduated' | 'left'>(
    initialStatus === 'active' ? 'inactive' : 'active'
  );
  const [reasonCategory, setReasonCategory] = useState<StatusReasonCategory>('medical');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [feeAction, setFeeAction] = useState<'pause_fees' | 'continue_fees' | 'waive_balance'>('pause_fees');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    {
      id: 'active',
      label: 'Active',
      description: 'Enrolled & attending classes',
      icon: UserCheck,
      color: '#16A34A',
      bg: '#DCFCE7',
      border: '#86EFAC',
      colSpan: 'span 2'
    },
    {
      id: 'inactive',
      label: 'On Leave',
      description: 'Temporary leave or pause',
      icon: Clock,
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
      colSpan: 'span 2'
    },
    {
      id: 'suspended',
      label: 'Suspended',
      description: 'Disciplinary / admin block',
      icon: Ban,
      color: '#DC2626',
      bg: '#FEE2E2',
      border: '#FECACA',
      colSpan: 'span 2'
    },
    {
      id: 'graduated',
      label: 'Graduated',
      description: 'Completed curriculum / alumni',
      icon: GraduationCap,
      color: '#9333EA',
      bg: '#F3E8FF',
      border: '#E9D5FF',
      colSpan: 'span 3'
    },
    {
      id: 'left',
      label: 'Left / Withdrawn',
      description: 'Soft-archived departure',
      icon: LogOut,
      color: '#475569',
      bg: '#F1F5F9',
      border: '#CBD5E1',
      colSpan: 'span 3'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Instant close and UI feedback
    onSuccess();
    onClose();

    // 2. Fire in background
    api.changeStudentStatus(student.id, {
      targetStatus,
      reasonCategory: (targetStatus === 'active' || targetStatus === 'graduated') ? 'other' : reasonCategory,
      remarks: remarks.trim(),
      effectiveDate,
      feeAction: targetStatus === 'inactive' ? feeAction : (targetStatus === 'active' ? 'continue_fees' : 'pause_fees')
    }).catch(err => {
      console.error('Failed to update student status in background:', err);
    });
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 540, 
          width: '100%', 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none', 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12,
          animation: 'scaleUp 0.2s ease-out'
        }}
      >
        {/* Island 1: Floating Dark Navy Header Card */}
        <div style={{ 
          background: '#0F172A', 
          color: '#FFFFFF', 
          padding: '16px 20px', 
          borderRadius: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Change Student Status</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Enrollment Lifecycle & Retention Control</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFFFFF', 
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Floating Student Info Callout */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF',
          boxShadow: '0 8px 20px -4px rgba(15,23,42,0.3)'
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{student.name}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              Reg: <strong style={{ color: '#E2E8F0' }}>{student.regNo}</strong> • {student.gradeBatch || 'Class'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Status</span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#10B981',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '2px 8px',
              borderRadius: 9999,
              display: 'inline-block',
              marginTop: 2
            }}>
              {student.status}
            </span>
          </div>
        </div>

        {/* Island 3: Floating White Form Card */}
        <form onSubmit={handleSubmit}>
          <div style={{ 
            background: '#FFFFFF', 
            borderRadius: 16, 
            padding: '20px 22px', 
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {error && (
              <div style={{ 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                color: '#DC2626', 
                padding: '10px 14px', 
                borderRadius: 10, 
                fontSize: 12, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8 
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Target Status Grid (Fixed 6-column Grid: Row 1 has 3 items, Row 2 has 2 items, with static 2px borders - Zero Jumping) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                Select New Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {statusOptions.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = targetStatus === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setTargetStatus(opt.id as any);
                        if (opt.id === 'suspended') setReasonCategory('disciplinary');
                        else if (opt.id === 'inactive') setReasonCategory('medical');
                        else if (opt.id === 'left') setReasonCategory('relocation');
                      }}
                      style={{
                        gridColumn: opt.colSpan,
                        padding: '10px 12px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        border: `2px solid ${isSelected ? opt.color : '#E2E8F0'}`,
                        background: isSelected ? opt.bg : '#F8FAFC',
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={15} color={opt.color} />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? opt.color : '#1E293B' }}>{opt.label}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={14} color={opt.color} />}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#64748B' }}>{opt.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason & Effective Date Row */}
            {(targetStatus === 'active' || targetStatus === 'graduated') ? (
              <div>
                <ModernDatePicker
                  label={targetStatus === 'graduated' ? 'Effective Graduation Date' : 'Effective Re-activation Date'}
                  required
                  value={effectiveDate}
                  onChange={setEffectiveDate}
                  zIndex={1100}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <ModernSelect
                  label="Reason Category"
                  required
                  value={reasonCategory}
                  onChange={val => setReasonCategory(val as StatusReasonCategory)}
                  zIndex={1100}
                  options={[
                    { value: 'medical', label: 'Medical / Health Leave', icon: <HeartPulse size={14} color="#475569" /> },
                    { value: 'financial', label: 'Financial Circumstances', icon: <DollarSign size={14} color="#475569" /> },
                    { value: 'relocation', label: 'Family Relocation / Transfer', icon: <MapPin size={14} color="#475569" /> },
                    { value: 'disciplinary', label: 'Disciplinary Action', icon: <ShieldAlert size={14} color="#475569" /> },
                    { value: 'personal', label: 'Personal / Family Reasons', icon: <UserCheck size={14} color="#475569" /> },
                    { value: 'other', label: 'Other / Administrative', icon: <FileText size={14} color="#475569" /> }
                  ]}
                />

                <ModernDatePicker
                  label="Effective Date"
                  required
                  value={effectiveDate}
                  onChange={setEffectiveDate}
                  zIndex={1100}
                />
              </div>
            )}

            {/* Fee Billing Impact Policy - ONLY FOR ON LEAVE / INACTIVE */}
            {targetStatus === 'inactive' && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 14px'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                  Fee Invoicing Policy During Leave Period
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label 
                    onClick={() => setFeeAction('pause_fees')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#334155', 
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: feeAction === 'pause_fees' ? '#ECFDF5' : 'transparent',
                      border: feeAction === 'pause_fees' ? '1px solid #A7F3D0' : '1px solid transparent'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="feeAction" 
                      checked={feeAction === 'pause_fees'} 
                      onChange={() => setFeeAction('pause_fees')}
                      style={{ accentColor: '#10B981' }}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <PauseCircle size={14} color="#D97706" /> <strong>Pause monthly fees</strong> (no new fee vouchers generated during leave)
                    </span>
                  </label>

                  <label 
                    onClick={() => setFeeAction('continue_fees')}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: '#334155', 
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: feeAction === 'continue_fees' ? '#EFF6FF' : 'transparent',
                      border: feeAction === 'continue_fees' ? '1px solid #BFDBFE' : '1px solid transparent'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="feeAction" 
                      checked={feeAction === 'continue_fees'} 
                      onChange={() => setFeeAction('continue_fees')}
                      style={{ accentColor: '#3B82F6' }}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <PlayCircle size={14} color="#16A34A" /> <strong>Keep billing active</strong> (charges seat retention / monthly fee as normal)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Remarks / Notes */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Administrative Remarks & Notes
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Leave approved for 2 months due to medical recovery. Student will resume in October."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  color: '#0F172A',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Island 4: Floating Action Pills Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12, 
            marginTop: 12 
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 42,
                padding: '0 20px',
                borderRadius: 9999,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: 42,
                padding: '0 24px',
                borderRadius: 9999,
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(15,23,42,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
