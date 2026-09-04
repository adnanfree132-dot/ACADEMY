import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  TrendingDown, 
  TrendingUp, 
  Calculator, 
  User, 
  Calendar, 
  Tag, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { StaffMember, StaffSalaryAdjustment, SalaryHead } from '../types';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

interface StaffAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  initialStaffId?: string;
  initialPeriod?: string;
  availableHeads?: SalaryHead[];
  adjustmentToEdit?: StaffSalaryAdjustment | null;
  onSave: (adjustmentData: {
    id?: string;
    staff_member_id: string;
    month_period: string;
    type: 'deduction' | 'earning';
    category: string;
    unit_amount: number;
    quantity: number;
    reason?: string;
  }) => void;
}

export const StaffAdjustmentModal: React.FC<StaffAdjustmentModalProps> = ({
  isOpen,
  onClose,
  staffList,
  initialStaffId,
  initialPeriod,
  availableHeads = [],
  adjustmentToEdit,
  onSave
}) => {
  const currentDate = new Date();
  const defaultPeriod = initialPeriod || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [staffMemberId, setStaffMemberId] = useState<string>(initialStaffId || '');
  const [monthPeriod, setMonthPeriod] = useState<string>(defaultPeriod);
  const [type, setType] = useState<'deduction' | 'earning'>('deduction');
  const [selectedCategory, setSelectedCategory] = useState<string>('Late Arrival');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('2000');
  const [count, setCount] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Combine default heads with user-defined enabled heads from database
  const activeHeadsList = React.useMemo(() => {
    const list: string[] = [];
    // User defined active heads from database
    const filteredDbHeads = availableHeads.filter(h => h.type === type && h.is_active !== false);
    for (const h of filteredDbHeads) {
      if (!list.some(title => title.toLowerCase() === h.title.toLowerCase())) {
        list.push(h.title);
      }
    }
    // Default starter heads if not in DB
    const starters = type === 'deduction' ? ['Late Arrival', 'Advance Salary'] : ['Overtime', 'Bonus'];
    for (const title of starters) {
      if (!list.some(t => t.toLowerCase() === title.toLowerCase())) {
        list.push(title);
      }
    }
    list.push('Other / Custom');
    return list;
  }, [type, availableHeads]);

  useEffect(() => {
    if (adjustmentToEdit) {
      setStaffMemberId(adjustmentToEdit.staff_member_id);
      setMonthPeriod(adjustmentToEdit.month_period || defaultPeriod);
      setType(adjustmentToEdit.type);
      const isKnown = activeHeadsList.some(title => title.toLowerCase() === adjustmentToEdit.category.toLowerCase());
      if (isKnown) {
        setSelectedCategory(adjustmentToEdit.category);
        setCustomCategory('');
      } else {
        setSelectedCategory('Other / Custom');
        setCustomCategory(adjustmentToEdit.category);
      }
      setAmount(String(adjustmentToEdit.unit_amount || 0));
      setCount(String(adjustmentToEdit.quantity || 1));
      setReason(adjustmentToEdit.reason || '');
    } else {
      if (initialStaffId) setStaffMemberId(initialStaffId);
      if (initialPeriod) setMonthPeriod(initialPeriod);
      setType('deduction');
      setSelectedCategory('Late Arrival');
      setCustomCategory('');
      setAmount('2000');
      setCount('1');
      setReason('');
    }
    setErrorMsg('');
  }, [adjustmentToEdit, initialStaffId, initialPeriod, isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const numCount = parseFloat(count) || 0;
  const totalAmount = Math.max(0, Math.round(numAmount * numCount));

  const staffOptions: ModernSelectOption[] = staffList.map(s => ({
    value: s.id,
    label: `${s.full_name} (${s.staff_id}) - ${s.designation || 'Staff'}`
  }));

  const periodOptions: ModernSelectOption[] = [
    { value: '2026-10', label: 'October 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026 (Active)' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' }
  ];

  const headOptions: ModernSelectOption[] = activeHeadsList.map(title => ({
    value: title,
    label: title
  }));

  const handleTypeChange = (newType: 'deduction' | 'earning') => {
    setType(newType);
    const firstHead = newType === 'deduction' ? 'Late Arrival' : 'Overtime';
    setSelectedCategory(firstHead);
    setCustomCategory('');
  };

  const handleHeadSelect = (headTitle: string) => {
    setSelectedCategory(headTitle);
    if (!headTitle.includes('Other / Custom')) {
      setCustomCategory('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMemberId) {
      setErrorMsg('Please select a staff member.');
      return;
    }
    const finalTitle = selectedCategory.includes('Other / Custom')
      ? customCategory.trim()
      : selectedCategory;

    if (!finalTitle) {
      setErrorMsg('Please enter or select a head title.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }
    if (numCount <= 0) {
      setErrorMsg('Please enter a valid count of at least 1.');
      return;
    }

    onSave({
      ...(adjustmentToEdit?.id && { id: adjustmentToEdit.id }),
      staff_member_id: staffMemberId,
      month_period: monthPeriod,
      type,
      category: finalTitle,
      unit_amount: numAmount,
      quantity: numCount,
      reason: reason.trim() || undefined
    });
    onClose();
  };

  const isDeduction = type === 'deduction';

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          maxWidth: 560
        }}
      >
        {/* Island 1: Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isDeduction ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                border: isDeduction ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isDeduction ? (
                <TrendingDown size={20} color="#EF4444" />
              ) : (
                <TrendingUp size={20} color="#10B981" />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                {adjustmentToEdit ? 'Edit Salary Adjustment' : isDeduction ? 'Add Staff Deduction' : 'Add Staff Earning'}
              </h2>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Amount × Count calculation applied directly to monthly salary
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              width: 32,
              height: 32,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94A3B8'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Type Switcher Island */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6
          }}
        >
          <button
            type="button"
            onClick={() => handleTypeChange('deduction')}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: isDeduction ? '#DC2626' : 'transparent',
              color: isDeduction ? '#FFFFFF' : '#94A3B8',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            <TrendingDown size={14} />
            <span>Salary Deduction</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('earning')}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: !isDeduction ? '#16A34A' : 'transparent',
              color: !isDeduction ? '#FFFFFF' : '#94A3B8',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            <TrendingUp size={14} />
            <span>Salary Earning</span>
          </button>
        </div>

        {/* Island 3: Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '74vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '8px 12px', color: '#991B1B', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={15} color="#EF4444" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Field 1: Staff Member Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} color="#2563EB" />
              Select Staff Member <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <ModernSelect
              options={staffOptions}
              value={staffMemberId}
              onChange={setStaffMemberId}
              placeholder="Search or select staff member..."
            />
          </div>

          {/* Field 2: Period & Head Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#2563EB" />
                Payroll Month <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <ModernSelect
                options={periodOptions}
                value={monthPeriod}
                onChange={setMonthPeriod}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={14} color="#2563EB" />
                {isDeduction ? 'Deduction Head' : 'Earning Head'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <ModernSelect
                options={headOptions}
                value={selectedCategory}
                onChange={handleHeadSelect}
              />
            </div>
          </div>

          {/* Custom Category Input (if chosen) */}
          {selectedCategory.includes('Other / Custom') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                Enter Custom Head Title <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="e.g. Uniform deduction, Advance adjustment, Guest lecture..."
                style={{
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              />
            </div>
          )}

          {/* Field 3: Amount & Count */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={13} />
              Amount × Count Calculation
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                  Amount (PKR) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                  Count <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  placeholder="e.g. 5"
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Live Computed Total Callout Card */}
            <div
              style={{
                background: isDeduction ? '#FEF2F2' : '#F0FDF4',
                border: isDeduction ? '1.5px solid #FECACA' : '1.5px solid #BBF7D0',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                  Breakdown:
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {formatCurrencyPKR(numAmount)} × {numCount}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isDeduction ? '#991B1B' : '#166534' }}>
                  {isDeduction ? 'Total Deduction' : 'Total Earning'}
                </span>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: isDeduction ? '#DC2626' : '#16A34A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {isDeduction ? '-' : '+'}{formatCurrencyPKR(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Field 4: Reason / Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#2563EB" />
              Reason / Explanation (Printed on Payslip)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. 5 days late arrival, approved advance recovery, 5 hours overtime..."
              style={{
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}
            />
          </div>
        </form>

        {/* Island 4: Floating Action Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            borderRadius: 9999
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
              transition: 'background-color 0.15s ease'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '9px 24px',
              borderRadius: 9999,
              border: 'none',
              background: isDeduction ? '#DC2626' : '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'background-color 0.15s ease, transform 0.15s ease'
            }}
          >
            <Check size={15} />
            <span>{adjustmentToEdit ? 'Update' : 'Save & Apply to Salary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
