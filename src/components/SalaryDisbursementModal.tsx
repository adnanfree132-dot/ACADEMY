import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  DollarSign, 
  FileText, 
  Calendar, 
  Hash, 
  Info,
  Building,
  Wallet
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';
import { api } from '../api/apiClient';

interface SalaryDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string;
  staffId?: string;
  staffMemberId?: string;
  monthPeriod?: string;
  netPayable?: number;
  alreadyPaid?: number;
  remainingPending?: number;
  onConfirm?: (data: {
    staff_member_id: string;
    month_period: string;
    amount: number;
    payment_method: string;
    reference_number: string;
    notes: string;
  }) => Promise<void>;
  payslip?: any;
  onDisbursed?: () => void;
}

export const SalaryDisbursementModal: React.FC<SalaryDisbursementModalProps> = ({
  isOpen,
  onClose,
  staffName: directStaffName,
  staffId: directStaffId,
  staffMemberId: directStaffMemberId,
  monthPeriod: directMonthPeriod,
  netPayable: directNetPayable,
  alreadyPaid: directAlreadyPaid,
  remainingPending: directRemainingPending,
  onConfirm,
  payslip,
  onDisbursed
}) => {
  const staffName = directStaffName || payslip?.staff_name || 'Staff Member';
  const staffId = directStaffId || payslip?.staff_id || '';
  const staffMemberId = directStaffMemberId || payslip?.staff_member_id || '';
  const monthPeriod = directMonthPeriod || payslip?.period || '';
  const netPayable = directNetPayable ?? payslip?.net_amount ?? 0;
  const alreadyPaid = directAlreadyPaid ?? payslip?.disbursed_amount ?? 0;
  const remainingPending = directRemainingPending ?? Math.max(0, netPayable - alreadyPaid);

  const [disbursementAmount, setDisbursementAmount] = useState<number>(remainingPending > 0 ? remainingPending : netPayable);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentMethodOptions: ModernSelectOption[] = [
    { value: 'cash', label: 'Cash Payment' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disbursementAmount <= 0) {
      setError('Disbursement amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        staff_member_id: staffMemberId,
        month_period: monthPeriod,
        amount: Number(disbursementAmount),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim(),
        notes: notes.trim()
      };

      if (onConfirm) {
        await onConfirm(payload);
      } else {
        await api.createSalaryDisbursement(payload);
      }

      if (onDisbursed) {
        onDisbursed();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record salary disbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (amount: number) => {
    setDisbursementAmount(amount);
  };

  return (
    <div className="floating-island-overlay" onClick={onClose}>
      <div 
        className="floating-island-container"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Island 1: Header Card */}
        <div className="island-header-card">
          <div className="island-header-left">
            <span className="island-header-badge">
              <CreditCard size={12} /> Payroll Disbursement
            </span>
            <h3 className="island-header-title">Disburse Salary Installment</h3>
            <p className="island-header-sub">
              {staffName} ({staffId}) • Period: {monthPeriod}
            </p>
          </div>
          <button
            type="button"
            className="island-close-btn"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Financial Summary Island */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '12px 18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Net Payable</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{formatCurrencyPKR(netPayable)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Already Paid</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#059669', marginTop: 2 }}>{formatCurrencyPKR(alreadyPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Remaining Due</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', marginTop: 2 }}>{formatCurrencyPKR(remainingPending)}</div>
          </div>
        </div>

        {/* Island 3: Form Card */}
        <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div 
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Info size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input with Quick Preset Chips */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                Installment Amount (PKR) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {remainingPending > 0 && remainingPending !== netPayable && (
                  <button
                    type="button"
                    onClick={() => handleQuickFill(remainingPending)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Remaining ({formatCurrencyPKR(remainingPending)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleQuickFill(Math.round(remainingPending / 2))}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Half (50%)
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                value={disbursementAmount || ''}
                onChange={(e) => setDisbursementAmount(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 25000"
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  paddingLeft: 42,
                  fontSize: 14,
                  fontWeight: 700
                }}
                required
              />
              <span style={{ position: 'absolute', left: 12, top: 11, color: '#94A3B8', fontWeight: 700, fontSize: 12 }}>
                PKR
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 4, margin: 0 }}>
              Note: This payment automatically registers under &quot;Salaries&quot; in the Institutional Expenses module.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Payment Method <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <ModernSelect
              options={paymentMethodOptions}
              value={paymentMethod}
              onChange={setPaymentMethod}
              placeholder="Select payment method"
            />
          </div>

          {/* Reference / Cheque Number */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Reference / Receipt / Voucher #
            </label>
            <input
              type="text"
              className="form-input"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. CASH-VOUCHER-081, CHQ-55219, HBL-TRX-9921"
              style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Disbursement Memo / Notes
            </label>
            <textarea
              rows={2}
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks regarding this installment payment"
              style={{ width: '100%', borderRadius: 10, fontSize: 13, resize: 'none', padding: '8px 12px' }}
            />
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div className="island-pill-row" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ borderRadius: 9999, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || disbursementAmount <= 0}
            style={{
              borderRadius: 9999,
              padding: '9px 24px',
              fontSize: 13,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Check size={15} />
            <span>{isSubmitting ? 'Recording...' : `Confirm & Disburse ${formatCurrencyPKR(disbursementAmount)}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
