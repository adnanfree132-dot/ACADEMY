import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle,
  Globe
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { getGlobalCurrencySymbol } from '../utils/payrollUiUtils';
import { LiveStaffPayrollRow, SalaryHead } from '../types';

interface PayrollItemEntry {
  id: string;
  headId: string;
  isCustom: boolean;
  title: string;
  amount: number;
}

interface ProcessStaffPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffRow: LiveStaffPayrollRow | null;
  salaryHeads?: SalaryHead[];
  onProcess: (payload: {
    staff_member_id: string;
    month_period: string;
    base_pay: number;
    earnings: Array<{ title: string; amount: number }>;
    deductions: Array<{ title: string; amount: number }>;
    net_payable: number;
    payment_status: 'paid' | 'pending';
    payment_method: string;
    reference_no: string;
    notes: string;
    is_published: boolean;
    attendance: any;
  }) => Promise<void>;
}

export const ProcessStaffPayrollModal: React.FC<ProcessStaffPayrollModalProps> = ({
  isOpen,
  onClose,
  staffRow,
  salaryHeads = [],
  onProcess
}) => {
  const currencySymbol = getGlobalCurrencySymbol();

  const [basePay, setBasePay] = useState<number>(0);
  const [earnings, setEarnings] = useState<PayrollItemEntry[]>([]);
  const [deductions, setDeductions] = useState<PayrollItemEntry[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Safe heads filtering
  const earningHeads = Array.isArray(salaryHeads) 
    ? salaryHeads.filter(h => h && h.type === 'earning' && h.is_active !== false)
    : [];

  const deductionHeads = Array.isArray(salaryHeads)
    ? salaryHeads.filter(h => h && h.type === 'deduction' && h.is_active !== false)
    : [];

  const earningSelectOptions: ModernSelectOption[] = [
    ...earningHeads.map(h => ({
      value: h.id,
      label: h.title || 'Allowance'
    })),
    { value: 'custom', label: '+ Custom Allowance / Bonus' }
  ];

  const deductionSelectOptions: ModernSelectOption[] = [
    ...deductionHeads.map(h => ({
      value: h.id,
      label: h.title || 'Deduction'
    })),
    { value: 'custom', label: '+ Custom Deduction / Cut' }
  ];

  // Populate data when modal opens
  useEffect(() => {
    if (!staffRow || !isOpen) return;

    try {
      setBasePay(Number(staffRow.base_salary) || 0);

      // 1. Resolve Allowances / Earnings
      const initialEarnings: PayrollItemEntry[] = [];
      if (Array.isArray(staffRow.custom_earnings) && staffRow.custom_earnings.length > 0) {
        staffRow.custom_earnings.forEach((e: any, idx: number) => {
          if (!e) return;
          const title = String(e.title || e.name || '').trim();
          const matchedHead = earningHeads.find(h => h && h.title && h.title.toLowerCase() === title.toLowerCase());
          initialEarnings.push({
            id: `earn-init-${idx}-${Date.now()}`,
            headId: matchedHead ? matchedHead.id : 'custom',
            isCustom: !matchedHead,
            title: title || 'Allowance',
            amount: Number(e.amount) || 0
          });
        });
      } else if (Array.isArray(staffRow.adjustments) && staffRow.adjustments.length > 0) {
        staffRow.adjustments
          .filter((a: any) => a && a.type === 'earning')
          .forEach((a: any, idx: number) => {
            const title = String(a.title || a.name || '').trim();
            const matchedHead = earningHeads.find(h => h && h.title && h.title.toLowerCase() === title.toLowerCase());
            initialEarnings.push({
              id: `earn-adj-${idx}-${Date.now()}`,
              headId: matchedHead ? matchedHead.id : 'custom',
              isCustom: !matchedHead,
              title: title || 'Allowance',
              amount: Number(a.amount) || 0
            });
          });
      }
      setEarnings(initialEarnings);

      // 2. Resolve Deductions
      const initialDeductions: PayrollItemEntry[] = [];
      if (Array.isArray(staffRow.custom_deductions) && staffRow.custom_deductions.length > 0) {
        staffRow.custom_deductions.forEach((d: any, idx: number) => {
          if (!d) return;
          const title = String(d.title || d.name || '').trim();
          const matchedHead = deductionHeads.find(h => h && h.title && h.title.toLowerCase() === title.toLowerCase());
          initialDeductions.push({
            id: `ded-init-${idx}-${Date.now()}`,
            headId: matchedHead ? matchedHead.id : 'custom',
            isCustom: !matchedHead,
            title: title || 'Deduction',
            amount: Number(d.amount) || 0
          });
        });
      } else if (Array.isArray(staffRow.adjustments) && staffRow.adjustments.length > 0) {
        staffRow.adjustments
          .filter((a: any) => a && a.type === 'deduction')
          .forEach((a: any, idx: number) => {
            const title = String(a.title || a.name || '').trim();
            const matchedHead = deductionHeads.find(h => h && h.title && h.title.toLowerCase() === title.toLowerCase());
            initialDeductions.push({
              id: `ded-adj-${idx}-${Date.now()}`,
              headId: matchedHead ? matchedHead.id : 'custom',
              isCustom: !matchedHead,
              title: title || 'Deduction',
              amount: Number(a.amount) || 0
            });
          });
      }
      setDeductions(initialDeductions);

      setPaymentStatus(staffRow.payment_status === 'Paid' ? 'paid' : staffRow.payment_status === 'Pending' ? 'pending' : 'paid');
      setPaymentMethod(staffRow.payment_method || 'cash');
      setReferenceNo(staffRow.reference_no || '');
      setNotes(staffRow.notes || '');
      setIsPublished(staffRow.is_published ?? true);
      setError(null);
    } catch (err) {
      console.error('Error initializing payroll modal:', err);
    }
  }, [staffRow, isOpen]);

  if (!isOpen || !staffRow) return null;

  const totalEarnings = earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalDeductions = deductions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netPayable = Math.max(0, basePay + totalEarnings - totalDeductions);

  const paymentMethodOptions: ModernSelectOption[] = [
    { value: 'cash', label: 'Cash Payment' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' }
  ];

  // Earning Handlers
  const handleAddEarning = () => {
    const defaultHead = earningHeads[0];
    setEarnings(prev => [
      ...prev,
      {
        id: `earn-${Date.now()}`,
        headId: defaultHead ? defaultHead.id : 'custom',
        isCustom: !defaultHead,
        title: defaultHead ? (defaultHead.title || 'Allowance') : '',
        amount: 0
      }
    ]);
  };

  const handleSelectEarningHead = (itemId: string, selectedValue: string) => {
    if (selectedValue === 'custom') {
      setEarnings(prev => prev.map(e => e.id === itemId ? { ...e, headId: 'custom', isCustom: true, title: '', amount: 0 } : e));
    } else {
      const head = earningHeads.find(h => h.id === selectedValue);
      if (head) {
        setEarnings(prev => prev.map(e => e.id === itemId ? {
          ...e,
          headId: head.id,
          isCustom: false,
          title: head.title || 'Allowance',
          amount: e.amount || 0
        } : e));
      }
    }
  };

  const handleUpdateEarningTitle = (itemId: string, title: string) => {
    setEarnings(prev => prev.map(e => e.id === itemId ? { ...e, title } : e));
  };

  const handleUpdateEarningAmount = (itemId: string, val: string) => {
    setEarnings(prev => prev.map(e => e.id === itemId ? { ...e, amount: Math.max(0, Number(val) || 0) } : e));
  };

  const handleRemoveEarning = (id: string) => {
    setEarnings(prev => prev.filter(e => e.id !== id));
  };

  // Deduction Handlers
  const handleAddDeduction = () => {
    const defaultHead = deductionHeads[0];
    setDeductions(prev => [
      ...prev,
      {
        id: `ded-${Date.now()}`,
        headId: defaultHead ? defaultHead.id : 'custom',
        isCustom: !defaultHead,
        title: defaultHead ? (defaultHead.title || 'Deduction') : '',
        amount: 0
      }
    ]);
  };

  const handleSelectDeductionHead = (itemId: string, selectedValue: string) => {
    if (selectedValue === 'custom') {
      setDeductions(prev => prev.map(d => d.id === itemId ? { ...d, headId: 'custom', isCustom: true, title: '', amount: 0 } : d));
    } else {
      const head = deductionHeads.find(h => h.id === selectedValue);
      if (head) {
        setDeductions(prev => prev.map(d => d.id === itemId ? {
          ...d,
          headId: head.id,
          isCustom: false,
          title: head.title || 'Deduction',
          amount: d.amount || 0
        } : d));
      }
    }
  };

  const handleUpdateDeductionTitle = (itemId: string, title: string) => {
    setDeductions(prev => prev.map(d => d.id === itemId ? { ...d, title } : d));
  };

  const handleUpdateDeductionAmount = (itemId: string, val: string) => {
    setDeductions(prev => prev.map(d => d.id === itemId ? { ...d, amount: Math.max(0, Number(val) || 0) } : d));
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onProcess({
        staff_member_id: staffRow.staff_member_id,
        month_period: staffRow.month_period,
        base_pay: Number(basePay),
        earnings: earnings.filter(e => e.title.trim() && e.amount > 0).map(e => ({ title: e.title.trim(), amount: Number(e.amount) })),
        deductions: deductions.filter(d => d.title.trim() && d.amount > 0).map(d => ({ title: d.title.trim(), amount: Number(d.amount) })),
        net_payable: netPayable,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        reference_no: referenceNo.trim(),
        notes: notes.trim(),
        is_published: isPublished,
        attendance: staffRow.attendance
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process staff payroll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="floating-island-overlay" onClick={onClose}>
      <div 
        className="floating-island-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Island 1: Header Card */}
        <div className="island-header-card">
          <div className="island-header-left">
            <span className="island-header-badge">
              <CreditCard size={12} /> {staffRow.is_processed ? 'Edit Processed Payroll' : 'Process Staff Payroll'}
            </span>
            <h3 className="island-header-title">
              {staffRow.full_name} ({staffRow.staff_id})
            </h3>
            <p className="island-header-sub">
              {staffRow.designation || staffRow.staff_type} • Period: {staffRow.month_period}
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

        {/* Island 3: Form Card with Base Salary, Allowances, Deductions, Net Payable, Payment Option */}
        <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '68vh', overflowY: 'auto' }}>
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
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Contracted Base Salary */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Contracted Base Salary ({currencySymbol}) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="form-input"
              value={basePay || ''}
              onChange={(e) => setBasePay(Math.max(0, Number(e.target.value) || 0))}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                border: '1px solid #CBD5E1',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Salary Allowances & Bonuses Section */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                  Salary Allowances & Bonuses (+{currencySymbol} {totalEarnings.toLocaleString()})
                </span>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0, marginTop: 1 }}>
                  Select from configured allowance heads or add custom bonus
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEarning}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Add Allowance
              </button>
            </div>

            {earnings.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                No extra allowances or bonuses added for this month.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {earnings.map((e) => (
                  <div 
                    key={e.id} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: e.isCustom ? '1fr 1fr 130px 32px' : '1fr 130px 32px', 
                      gap: 8, 
                      alignItems: 'center' 
                    }}
                  >
                    <div>
                      <ModernSelect
                        options={earningSelectOptions}
                        value={e.isCustom ? 'custom' : (e.headId || '')}
                        onChange={(val) => handleSelectEarningHead(e.id, val)}
                        placeholder="Select allowance head..."
                      />
                    </div>

                    {e.isCustom && (
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Allowance Title"
                          value={e.title}
                          onChange={(ev) => handleUpdateEarningTitle(e.id, ev.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
                        />
                      </div>
                    )}

                    <div style={{ width: 130 }}>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        value={e.amount === 0 ? '' : e.amount}
                        onChange={(ev) => handleUpdateEarningAmount(e.id, ev.target.value)}
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 10,
                          padding: '0 12px',
                          fontSize: 13,
                          fontWeight: 700,
                          border: '1px solid #CBD5E1',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveEarning(e.id)}
                      style={{
                        width: 32,
                        height: 38,
                        borderRadius: 8,
                        border: '1px solid #FEE2E2',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deductions & Penalties Section */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Deductions & Penalties (-{currencySymbol} {totalDeductions.toLocaleString()})
                </span>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0, marginTop: 1 }}>
                  Select from configured deduction heads or add custom cut
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDeduction}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Add Deduction
              </button>
            </div>

            {deductions.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                No deductions or penalties added for this month.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {deductions.map((d) => (
                  <div 
                    key={d.id} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: d.isCustom ? '1fr 1fr 130px 32px' : '1fr 130px 32px', 
                      gap: 8, 
                      alignItems: 'center' 
                    }}
                  >
                    <div>
                      <ModernSelect
                        options={deductionSelectOptions}
                        value={d.isCustom ? 'custom' : (d.headId || '')}
                        onChange={(val) => handleSelectDeductionHead(d.id, val)}
                        placeholder="Select deduction head..."
                      />
                    </div>

                    {d.isCustom && (
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Deduction Title"
                          value={d.title}
                          onChange={(ev) => handleUpdateDeductionTitle(d.id, ev.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
                        />
                      </div>
                    )}

                    <div style={{ width: 130 }}>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="0"
                        value={d.amount === 0 ? '' : d.amount}
                        onChange={(ev) => handleUpdateDeductionAmount(d.id, ev.target.value)}
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 10,
                          padding: '0 12px',
                          fontSize: 13,
                          fontWeight: 700,
                          border: '1px solid #CBD5E1',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDeduction(d.id)}
                      style={{
                        width: 32,
                        height: 38,
                        borderRadius: 8,
                        border: '1px solid #FEE2E2',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Computed Net Payable Display Banner */}
          <div 
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                Final Net Payable Salary
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                Base {currencySymbol} {basePay.toLocaleString()} + Allowances {currencySymbol} {totalEarnings.toLocaleString()} - Deductions {currencySymbol} {totalDeductions.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>
              {currencySymbol} {netPayable.toLocaleString()}
            </div>
          </div>

          {/* Payment Status & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', margin: 0 }}>
              Payment Disbursement Option <span style={{ color: '#EF4444' }}>*</span>
            </label>

            {/* Paid vs Pending Selector Pills */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: paymentStatus === 'paid' ? '1.5px solid #059669' : '1px solid #E2E8F0',
                  background: paymentStatus === 'paid' ? '#ECFDF5' : '#FFFFFF',
                  color: paymentStatus === 'paid' ? '#059669' : '#64748B'
                }}
              >
                <Check size={15} />
                <span>Mark as Paid Now ({currencySymbol} {netPayable.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: paymentStatus === 'pending' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                  background: paymentStatus === 'pending' ? '#FFFBEB' : '#FFFFFF',
                  color: paymentStatus === 'pending' ? '#D97706' : '#64748B'
                }}
              >
                <span>Save as Pending (Pay Later)</span>
              </button>
            </div>

            {paymentStatus === 'paid' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                    Payment Method
                  </label>
                  <ModernSelect
                    options={paymentMethodOptions}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                    Voucher / Reference # (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. CASH-0881, CHQ-4491"
                    style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Payroll Remarks / Memo
              </label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional remarks regarding this salary processing"
                style={{ width: '100%', height: 36, borderRadius: 10, fontSize: 13 }}
              />
            </div>

            {/* Portal Visibility Checkbox */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '10px 14px',
                marginTop: 4
              }}
            >
              <input
                type="checkbox"
                id="publish_portal_checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="publish_portal_checkbox" style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', cursor: 'pointer', margin: 0 }}>
                Publish details to Staff Portal (Staff member can see and download payslip)
              </label>
            </div>
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
            disabled={isSubmitting || netPayable < 0}
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
            <span>
              {isSubmitting 
                ? 'Processing...' 
                : staffRow.is_processed 
                  ? 'Save Changes' 
                  : `Process & Save Payroll (${currencySymbol} ${netPayable.toLocaleString()})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
