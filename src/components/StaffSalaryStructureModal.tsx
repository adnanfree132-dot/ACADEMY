import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  X, 
  Check, 
  Building, 
  CreditCard, 
  User, 
  AlertTriangle,
  Briefcase,
  Layers,
  Banknote,
  Receipt,
  Plus,
  Trash2,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { StaffMember, StaffSalaryStructure } from '../types';
import { api } from '../api/apiClient';
import { roundCurrency, formatCurrencyPKR } from '../utils/payrollUiUtils';

export interface DynamicSalaryItem {
  id: string;
  name: string;
  amount: number;
}

interface StaffSalaryStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: StaffMember | null;
  initialStructure?: StaffSalaryStructure | null;
  onSaved: (savedStructure: StaffSalaryStructure) => void;
}

export const StaffSalaryStructureModal: React.FC<StaffSalaryStructureModalProps> = ({
  isOpen,
  onClose,
  staffMember,
  initialStructure,
  onSaved
}) => {
  if (!isOpen || !staffMember) return null;

  const [baseSalary, setBaseSalary] = useState<number>(
    initialStructure?.base_salary ?? initialStructure?.baseSalary ?? staffMember.base_salary ?? staffMember.baseSalary ?? 50000
  );

  // Dynamic Custom Earnings / Allowances
  const [earnings, setEarnings] = useState<DynamicSalaryItem[]>(() => {
    if (initialStructure?.custom_earnings && Array.isArray(initialStructure.custom_earnings) && initialStructure.custom_earnings.length > 0) {
      return initialStructure.custom_earnings;
    }
    const initialList: DynamicSalaryItem[] = [];
    const med = initialStructure?.medical_allowance ?? initialStructure?.medicalAllowance ?? 0;
    const conv = initialStructure?.conveyance_allowance ?? initialStructure?.conveyanceAllowance ?? 0;
    const spec = initialStructure?.special_allowance ?? initialStructure?.specialAllowance ?? 0;
    if (med > 0) initialList.push({ id: 'med-1', name: 'Medical Allowance', amount: med });
    if (conv > 0) initialList.push({ id: 'conv-1', name: 'Conveyance / Travel', amount: conv });
    if (spec > 0) initialList.push({ id: 'spec-1', name: 'Special Allowance', amount: spec });
    return initialList;
  });

  // Dynamic Custom Deductions
  const [deductions, setDeductions] = useState<DynamicSalaryItem[]>(() => {
    if (initialStructure?.custom_deductions && Array.isArray(initialStructure.custom_deductions) && initialStructure.custom_deductions.length > 0) {
      return initialStructure.custom_deductions;
    }
    const initialList: DynamicSalaryItem[] = [];
    const tax = initialStructure?.income_tax ?? initialStructure?.incomeTax ?? 0;
    const pf = initialStructure?.provident_fund ?? initialStructure?.providentFund ?? 0;
    const other = initialStructure?.other_deductions ?? initialStructure?.otherDeductions ?? 0;
    if (tax > 0) initialList.push({ id: 'tax-1', name: 'Income Tax', amount: tax });
    if (pf > 0) initialList.push({ id: 'pf-1', name: 'Provident Fund / EOBI', amount: pf });
    if (other > 0) initialList.push({ id: 'oth-1', name: 'Other Fixed Deduction', amount: other });
    return initialList;
  });

  // Disbursement & Banking Channel State
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialStructure?.payment_method || initialStructure?.paymentMethod || staffMember.payment_method || staffMember.paymentMethod || 'bank_transfer'
  );
  const [paymentFrequency, setPaymentFrequency] = useState<string>(
    initialStructure?.salary_type || initialStructure?.salaryType || 'monthly'
  );
  const [bankName, setBankName] = useState<string>(
    initialStructure?.bank_name || initialStructure?.bankName || staffMember.bank_name || staffMember.bankName || ''
  );
  const [accountTitle, setAccountTitle] = useState<string>(
    initialStructure?.account_title || initialStructure?.accountTitle || staffMember.account_title || staffMember.accountTitle || staffMember.full_name || staffMember.fullName || ''
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    initialStructure?.account_number || initialStructure?.accountNumber || staffMember.account_number || staffMember.accountNumber || ''
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Live Calculations
  const numBase = Math.max(0, Number(baseSalary) || 0);
  const totalCustomEarnings = earnings.reduce((sum, item) => sum + (Math.max(0, Number(item.amount)) || 0), 0);
  const computedGross = roundCurrency(numBase + totalCustomEarnings);

  const totalCustomDeductions = deductions.reduce((sum, item) => sum + (Math.max(0, Number(item.amount)) || 0), 0);
  const computedNet = Math.max(0, roundCurrency(computedGross - totalCustomDeductions));

  // Quick Preset Add Handlers
  const addEarningPreset = (name: string, defaultAmount: number = 0) => {
    const newItem: DynamicSalaryItem = {
      id: `earn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      amount: defaultAmount
    };
    setEarnings(prev => [...prev, newItem]);
  };

  const addDeductionPreset = (name: string, defaultAmount: number = 0) => {
    const newItem: DynamicSalaryItem = {
      id: `ded-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      amount: defaultAmount
    };
    setDeductions(prev => [...prev, newItem]);
  };

  const updateEarning = (id: string, field: 'name' | 'amount', val: any) => {
    setEarnings(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const removeEarning = (id: string) => {
    setEarnings(prev => prev.filter(item => item.id !== id));
  };

  const updateDeduction = (id: string, field: 'name' | 'amount', val: any) => {
    setDeductions(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const removeDeduction = (id: string) => {
    setDeductions(prev => prev.filter(item => item.id !== id));
  };

  const paymentMethodOptions: ModernSelectOption[] = [
    { value: 'bank_transfer', label: 'Bank Transfer (Direct Deposit)', icon: <Building size={14} color="#2563EB" /> },
    { value: 'cash', label: 'Cash Payment at Counter', icon: <Banknote size={14} color="#10B981" /> },
    { value: 'cheque', label: 'Institutional Crossed Cheque', icon: <Receipt size={14} color="#8B5CF6" /> }
  ];

  const frequencyOptions: ModernSelectOption[] = [
    { value: 'monthly', label: 'Monthly Recurring (Standard)', icon: <Layers size={14} color="#0F172A" /> },
    { value: 'bi_weekly', label: 'Bi-Weekly Disbursement', icon: <Layers size={14} color="#64748B" /> },
    { value: 'weekly', label: 'Weekly Disbursement', icon: <Layers size={14} color="#64748B" /> }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numBase <= 0) {
      setErrorMsg('Please specify a valid base monthly salary greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      staff_member_id: staffMember.id,
      base_salary: numBase,
      house_rent_allowance: 0,
      medical_allowance: earnings.find(e => e.name.toLowerCase().includes('med'))?.amount || 0,
      conveyance_allowance: earnings.find(e => e.name.toLowerCase().includes('conv') || e.name.toLowerCase().includes('travel'))?.amount || 0,
      special_allowance: totalCustomEarnings,
      custom_earnings: earnings,
      income_tax: deductions.find(d => d.name.toLowerCase().includes('tax'))?.amount || 0,
      provident_fund: deductions.find(d => d.name.toLowerCase().includes('pf') || d.name.toLowerCase().includes('eobi'))?.amount || 0,
      other_deductions: totalCustomDeductions,
      custom_deductions: deductions,
      gross_salary: computedGross,
      total_deductions: totalCustomDeductions,
      net_standard_salary: computedNet,
      salary_type: paymentFrequency,
      payment_method: paymentMethod,
      bank_name: paymentMethod === 'bank_transfer' ? bankName : null,
      account_title: paymentMethod === 'bank_transfer' ? accountTitle : null,
      account_number: paymentMethod === 'bank_transfer' ? accountNumber : null
    };

    try {
      const saved = await api.saveStaffSalaryStructure(staffMember.id, payload);
      onSaved(saved || payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save salary structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="floating-island-overlay" style={{ zIndex: 9999 }}>
      <div className="floating-island-container" style={{ maxWidth: 640 }}>
        
        {/* Island 1: Header Card */}
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
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <DollarSign size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Staff Compensation Package
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Customized remuneration & allowances for {staffMember.full_name || staffMember.fullName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Staff Identity Summary Bar */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '12px 18px',
            boxShadow: '0 4px 12px -2px rgba(15,23,42,0.06)',
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
                borderRadius: '50%',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}
            >
              {(staffMember.full_name || staffMember.fullName || 'S').charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                  {staffMember.full_name || staffMember.fullName}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                  {staffMember.staff_id || staffMember.staffId}
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>
                {staffMember.designation || 'Faculty'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated Net Pay
            </span>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#10B981' }}>
              {formatCurrencyPKR(computedNet)}
            </div>
          </div>
        </div>

        {/* Island 3: Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
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
                color: '#991B1B',
                border: '1px solid #FECACA',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <AlertTriangle size={15} color="#EF4444" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Base Salary & Dynamic Earnings */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Earnings & Allowances
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                Gross: {formatCurrencyPKR(computedGross)}
              </span>
            </div>

            {/* Mandatory Base Salary */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                Base Salary (PKR) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={baseSalary}
                onChange={e => setBaseSalary(Number(e.target.value))}
                placeholder="65000"
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  padding: '0 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            {/* Preset Suggestions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Add Allowance:</span>
              <button
                type="button"
                onClick={() => addEarningPreset('Medical Allowance', 5000)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Medical
              </button>
              <button
                type="button"
                onClick={() => addEarningPreset('Conveyance / Travel', 4000)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Travel
              </button>
              <button
                type="button"
                onClick={() => addEarningPreset('Special / Responsibility Allowance', 6000)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Responsibility
              </button>
              <button
                type="button"
                onClick={() => addEarningPreset('Custom Allowance', 0)}
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <Plus size={11} /> Custom Earning
              </button>
            </div>

            {/* Dynamic Custom Earnings Rows */}
            {earnings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {earnings.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateEarning(item.id, 'name', e.target.value)}
                      placeholder="Allowance Title"
                      style={{
                        flex: 2,
                        height: 35,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        padding: '0 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#0F172A',
                        background: '#FFFFFF'
                      }}
                    />
                    <div style={{ position: 'relative', flex: 1.2 }}>
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={e => updateEarning(item.id, 'amount', Number(e.target.value))}
                        placeholder="PKR Amount"
                        style={{
                          width: '100%',
                          height: 35,
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          padding: '0 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#16A34A',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEarning(item.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove Allowance"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Dynamic Deductions */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Statutory & Custom Deductions
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: totalCustomDeductions > 0 ? '#DC2626' : '#64748B' }}>
                Total: -{formatCurrencyPKR(totalCustomDeductions)}
              </span>
            </div>

            {/* Preset Suggestions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Add Deduction:</span>
              <button
                type="button"
                onClick={() => addDeductionPreset('Income Tax', 2500)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Income Tax
              </button>
              <button
                type="button"
                onClick={() => addDeductionPreset('Provident Fund / EOBI', 1500)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + EOBI / PF
              </button>
              <button
                type="button"
                onClick={() => addDeductionPreset('Advance Salary Repayment', 5000)}
                style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Advance Loan
              </button>
              <button
                type="button"
                onClick={() => addDeductionPreset('Custom Deduction', 0)}
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9999, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <Plus size={11} /> Custom Deduction
              </button>
            </div>

            {/* Dynamic Deductions Rows */}
            {deductions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {deductions.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateDeduction(item.id, 'name', e.target.value)}
                      placeholder="Deduction Label"
                      style={{
                        flex: 2,
                        height: 35,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        padding: '0 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#0F172A',
                        background: '#FFFFFF'
                      }}
                    />
                    <div style={{ position: 'relative', flex: 1.2 }}>
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={e => updateDeduction(item.id, 'amount', Number(e.target.value))}
                        placeholder="PKR Amount"
                        style={{
                          width: '100%',
                          height: 35,
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          padding: '0 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#DC2626',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDeduction(item.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove Deduction"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Payment Disbursement Channel & Banking Info (with openUpward={true}) */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Channel & Banking Information
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <div>
                <ModernSelect
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentMethodOptions}
                  openUpward={true}
                  required
                />
              </div>

              <div>
                <ModernSelect
                  label="Disbursement Frequency"
                  value={paymentFrequency}
                  onChange={setPaymentFrequency}
                  options={frequencyOptions}
                  openUpward={true}
                  required
                />
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. Habib Bank Limited / Meezan Bank"
                    style={{
                      width: '100%',
                      height: 36,
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: 12.5,
                      color: '#0F172A',
                      background: '#FFFFFF'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={accountTitle}
                      onChange={e => setAccountTitle(e.target.value)}
                      placeholder="Account Title"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        padding: '0 10px',
                        fontSize: 12.5,
                        color: '#0F172A',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                      Account / IBAN Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="PK00..."
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        padding: '0 10px',
                        fontSize: 12.5,
                        color: '#0F172A',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Island 4: Floating Action Pill Row */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
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
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '9px 22px',
              borderRadius: 9999,
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(15,23,42,0.25)'
            }}
          >
            <Check size={14} />
            {isSubmitting ? 'Saving...' : 'Save Compensation Package'}
          </button>
        </div>

      </div>
    </div>
  );
};
export default StaffSalaryStructureModal;
