import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  Building, 
  Banknote, 
  Receipt, 
  Calendar as CalendarIcon, 
  User, 
  AlertTriangle,
  FileText,
  Clock
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { MonthlyPayrollItem } from '../types';
import { api } from '../api/apiClient';
import { formatCurrencyPKR, roundCurrency } from '../utils/payrollUiUtils';

interface SalaryDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: MonthlyPayrollItem | null;
  onDisbursed: (updatedPayslip: MonthlyPayrollItem) => void;
}

export const SalaryDisbursementModal: React.FC<SalaryDisbursementModalProps> = ({
  isOpen,
  onClose,
  payslip,
  onDisbursed
}) => {
  if (!isOpen || !payslip) return null;

  const staffName = payslip.staffMember?.full_name || payslip.staffMember?.fullName || (payslip as any).staff_name || (payslip as any).fullName || 'Staff Member';
  const staffCode = payslip.staffMember?.staff_id || payslip.staffMember?.staffId || (payslip as any).staff_id || (payslip as any).staffCode || 'STAFF';
  const designation = payslip.staffMember?.designation || (payslip as any).designation || 'Faculty';
  const slipNumber = payslip.payslip_number || (payslip as any).payslipNumber || `SLIP-${payslip.id.slice(0, 8)}`;
  const period = payslip.month_period || (payslip as any).monthPeriod || (payslip as any).period || 'Current Month';

  const defaultMethod = (payslip.payment_method || (payslip as any).paymentMethod || 'bank_transfer').toLowerCase();
  const [paymentMethod, setPaymentMethod] = useState<string>(
    defaultMethod.includes('cash') ? 'cash' : (defaultMethod.includes('cheque') ? 'cheque' : 'bank_transfer')
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [transactionRef, setTransactionRef] = useState<string>(
    (payslip as any).transaction_ref || (payslip as any).transactionRef || (payslip as any).reference_no || ''
  );
  const [notes, setNotes] = useState<string>(
    (payslip as any).notes || (payslip as any).remarks || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const paymentMethodOptions: ModernSelectOption[] = [
    { value: 'bank_transfer', label: 'Bank Transfer (Direct Deposit)', icon: <Building size={14} color="#2563EB" /> },
    { value: 'cash', label: 'Cash Payment at Counter', icon: <Banknote size={14} color="#10B981" /> },
    { value: 'cheque', label: 'Institutional Crossed Cheque', icon: <Receipt size={14} color="#8B5CF6" /> }
  ];

  const netPayable = payslip.net_payable ?? payslip.netPayable ?? (payslip as any).amount ?? 0;
  const grossSalary = payslip.gross_salary ?? payslip.grossSalary ?? ((payslip.base_salary || payslip.baseSalary || 0) + (payslip.total_allowances || payslip.totalAllowances || 0));
  const totalDeductions = payslip.total_deductions ?? payslip.totalDeductions ?? ((payslip.attendance_deduction || payslip.attendanceDeduction || 0) + (payslip.tax_deduction || payslip.taxDeduction || 0) + (payslip.provident_fund_deduction || payslip.providentFundDeduction || 0));

  const bankName = (payslip as any).bank_name || (payslip as any).bankName || payslip.staffMember?.bank_name || payslip.staffMember?.bankName || '';
  const accountNo = (payslip as any).account_number || (payslip as any).accountNumber || payslip.staffMember?.account_number || payslip.staffMember?.accountNumber || '';
  const accountTitle = (payslip as any).account_title || (payslip as any).accountTitle || payslip.staffMember?.account_title || payslip.staffMember?.accountTitle || staffName;

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    setIsSubmitting(true);

    const formattedMethod = paymentMethod === 'bank_transfer' ? 'Bank Transfer' : (paymentMethod === 'cheque' ? 'Cheque' : 'Cash');
    const effRef = transactionRef.trim() || (paymentMethod === 'bank_transfer' ? `TRX-${Date.now().toString().slice(-6)}` : null);

    // 1. Optimistic Instant 0ms UI Update
    const updatedRecord: MonthlyPayrollItem = {
      ...payslip,
      status: 'paid',
      payment_method: formattedMethod as any,
      paymentMethod: formattedMethod as any,
      transaction_reference: effRef,
      transactionReference: effRef,
      disbursed_at: new Date().toISOString(),
      disbursedAt: new Date().toISOString(),
      remarks: notes.trim() || undefined
    };

    onDisbursed(updatedRecord);
    onClose();

    // 2. Silent Background API Sync
    try {
      await api.disbursePayslip(payslip.id, {
        payment_method: formattedMethod,
        transaction_reference: effRef || undefined,
        transaction_ref: effRef || undefined,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
        remarks: notes.trim() || undefined
      });
    } catch (err: any) {
      console.error('Error disbursing payslip on backend:', err);
    }
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1500,
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
          width: '100%',
          maxWidth: 540,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card (#0F172A) */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Record Salary Disbursement
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Disburse compensation voucher {slipNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Context / Payee Details */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}
            >
              <User size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{staffName}</span>
                <span
                  style={{
                    background: '#E2E8F0',
                    color: '#334155',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                >
                  {staffCode}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                {designation} &bull; Payroll Cycle: <strong>{period}</strong>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Net Payable Amount
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>
              {formatCurrencyPKR(netPayable)}
            </div>
          </div>
        </div>

        {/* Island 3: Scrollable Form Card (#FFFFFF) */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '68vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#991B1B',
                fontSize: 12.5,
                fontWeight: 700
              }}
            >
              <AlertTriangle size={15} color="#EF4444" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Payment Method Selection */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Disbursement Channel & Method
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <ModernSelect
                label="Payment Method"
                required
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={paymentMethodOptions}
                zIndex={1100}
                openUpward={true}
              />
            </div>

            {paymentMethod === 'bank_transfer' && bankName && (
              <div
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#1E40AF'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>Bank: {bankName}</div>
                  <div style={{ fontSize: 11, color: '#3B82F6' }}>Title: {accountTitle}</div>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {accountNo ? `A/C: ${accountNo}` : 'Direct Account Deposit'}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Date & Reference */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Transaction Reference & Date
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ModernDatePicker
                label="Payment Date"
                required
                value={paymentDate}
                onChange={setPaymentDate}
                zIndex={1100}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  {paymentMethod === 'cheque' ? 'Cheque No / Slip #' : 'Transaction Reference'}
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder={paymentMethod === 'cheque' ? 'e.g. CHQ-99401' : 'e.g. TRX-MEZN-88319'}
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Disbursement Notes / Audit Remarks (Optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes e.g. Batch online transfer processed via corporate portal."
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 20px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDisbursement}
            disabled={isSubmitting}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 24px',
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: isSubmitting ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#10B981'; }}
          >
            <Check size={15} /> Confirm & Mark Paid
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalaryDisbursementModal;
