import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  X, 
  Check, 
  ShieldAlert, 
  FileText, 
  Calendar,
  Info
} from 'lucide-react';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';

export interface StaffStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  onStatusUpdated: (updatedStaff: any) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (Operational & Full Access)' },
  { value: 'probation', label: 'Probation (Evaluation Period)' },
  { value: 'on_leave', label: 'On Leave (Temporary Authorized Absence)' },
  { value: 'suspended', label: 'Suspended (Temporarily Inactive / Under Review)' },
  { value: 'terminated', label: 'Terminated (Contract Ended / Discharged)' },
  { value: 'inactive', label: 'Inactive / Resigned (Departed / Soft Archived)' }
];

export const StaffStatusModal: React.FC<StaffStatusModalProps> = ({
  isOpen,
  onClose,
  staff,
  onStatusUpdated
}) => {
  const [status, setStatus] = useState<string>('active');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (staff && isOpen) {
      setStatus(staff.status || 'active');
      setRemarks(staff.statusRemarks || staff.status_remarks || '');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setErrorMessage('');
    }
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  const staffName = staff.fullName || staff.name || 'Staff Member';
  const staffIdCode = staff.staffId || staff.staff_id || staff.id;
  const isDestructive = status === 'terminated' || status === 'suspended' || status === 'inactive';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      setErrorMessage('Please select a valid lifecycle status.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Prepare updated staff object
    const updatedStaff = {
      ...staff,
      status,
      statusRemarks: remarks.trim() || undefined,
      status_remarks: remarks.trim() || undefined
    };

    // 0ms Optimistic UI callback
    onStatusUpdated(updatedStaff);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div 
      className="floating-island-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 1400,
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
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 520
        }}
      >
        {/* Island 1: Deep Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isDestructive ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                color: isDestructive ? '#EF4444' : '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isDestructive ? <UserX size={20} /> : <UserCheck size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Staff Member Lifecycle & Status
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                {staffName} ({staffIdCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              width: 32,
              height: 32,
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Soft Archive & Policy Information Card */}
        <div
          style={{
            background: isDestructive ? '#FEF2F2' : '#F0FDF4',
            borderRadius: 14,
            border: isDestructive ? '1px solid #FECACA' : '1px solid #BBF7D0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 12,
            color: isDestructive ? '#991B1B' : '#166534',
            boxShadow: '0 4px 12px rgba(15,23,42,0.03)'
          }}
        >
          {isDestructive ? (
            <ShieldAlert size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <Info size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <div style={{ lineHeight: 1.45 }}>
            <span style={{ fontWeight: 600 }}>
              {isDestructive ? 'Soft Archival & Access Revocation:' : 'Operational Status Notice:'}
            </span>{' '}
            {isDestructive
              ? 'Marking as Terminated or Inactive removes this staff member from active daily check-ins and future payroll cycles. All past attendance logs and disbursed payslips remain fully preserved.'
              : 'Active staff members are eligible for daily GPS check-ins, monthly attendance registers, and automated batch payroll computation.'}
          </div>
        </div>

        {/* Island 3: Scrollable Form Card */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px 22px',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            {/* Field 1: New Lifecycle Status */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Target Lifecycle Status
              </label>
              <ModernSelect
                options={STATUS_OPTIONS}
                value={status}
                onChange={setStatus}
                placeholder="Select Status"
              />
            </div>

            {/* Field 2: Effective Date */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Effective Date
              </label>
              <ModernDatePicker
                value={effectiveDate}
                onChange={setEffectiveDate}
                placeholder="Select Effective Date"
              />
            </div>

            {/* Field 3: Status Remarks / Administrative Reason */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Administrative Remarks / Reason
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Contract completed on mutually agreed terms, Resigned due to personal relocation, Suspended pending review..."
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              />
              <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>
                These remarks are securely logged with the profile for audit and administrative reference.
              </span>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#DC2626',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {errorMessage}
              </div>
            )}
          </div>

          {/* Island 4: Floating Action Pill Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 12
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                borderRadius: 9999,
                padding: '9px 20px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                borderRadius: 9999,
                padding: '9px 22px',
                border: 'none',
                background: isDestructive ? '#DC2626' : '#0F172A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isDestructive 
                  ? '0 4px 12px rgba(220, 38, 38, 0.25)' 
                  : '0 4px 12px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Check size={14} />
              {isDestructive ? 'Apply Status & Soft Archive' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
