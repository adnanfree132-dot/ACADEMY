import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  X, 
  Check, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Percent,
  DollarSign,
  Calendar
} from 'lucide-react';
import { PayrollComponentTag } from '../types';
import { ModernSelect, ModernSelectOption } from './ModernSelect';

interface PayrollTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: PayrollComponentTag) => Promise<void> | void;
  tagToEdit?: PayrollComponentTag | null;
}

export const PayrollTagModal: React.FC<PayrollTagModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tagToEdit
}) => {
  const [tagCode, setTagCode] = useState('');
  const [displayLabel, setDisplayLabel] = useState('');
  const [type, setType] = useState<'earning' | 'deduction'>('deduction');
  const [calculationType, setCalculationType] = useState<'percentage_of_base' | 'fixed_amount' | 'per_day'>('percentage_of_base');
  const [defaultValue, setDefaultValue] = useState<number>(50);
  const [reasonTemplate, setReasonTemplate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tagToEdit) {
      setTagCode(tagToEdit.tag_code);
      setDisplayLabel(tagToEdit.display_label);
      setType(tagToEdit.type);
      setCalculationType(tagToEdit.calculation_type);
      setDefaultValue(tagToEdit.default_value);
      setReasonTemplate(tagToEdit.reason_template || '');
    } else {
      setTagCode('');
      setDisplayLabel('');
      setType('deduction');
      setCalculationType('percentage_of_base');
      setDefaultValue(50);
      setReasonTemplate('');
    }
    setErrorMsg('');
  }, [tagToEdit, isOpen]);

  if (!isOpen) return null;

  const handleTagCodeChange = (val: string) => {
    const sanitized = val.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setTagCode(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagCode.trim()) {
      setErrorMsg('Please enter a unique Tag Code (e.g. ADVANCE_SALARY).');
      return;
    }
    if (!displayLabel.trim()) {
      setErrorMsg('Please enter an official Display Label for the payslip.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const payload: PayrollComponentTag = {
        id: tagToEdit?.id || `tag-${Date.now()}`,
        tag_code: tagCode.trim().toUpperCase(),
        display_label: displayLabel.trim(),
        type,
        calculation_type: calculationType,
        default_value: Number(defaultValue) || 0,
        reason_template: reasonTemplate.trim() || undefined,
        is_active: true
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save payroll component tag.');
    } finally {
      setIsSaving(false);
    }
  };

  const typeOptions: ModernSelectOption[] = [
    { value: 'deduction', label: 'Deduction (Salary Reduction)' },
    { value: 'earning', label: 'Earning (Allowance / Bonus)' }
  ];

  const calcOptions: ModernSelectOption[] = [
    { value: 'percentage_of_base', label: 'Percentage of Base Salary (%)' },
    { value: 'fixed_amount', label: 'Fixed Amount (PKR)' },
    { value: 'per_day', label: 'Per-Day Calculation Rate' }
  ];

  return (
    <div
      className="floating-island-overlay"
      style={{
        zIndex: 9999,
        padding: '24px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto'
      }}
    >
      <div
        className="floating-island-container"
        style={{
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
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
              <Tags size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {tagToEdit ? 'Edit Payroll Component Tag' : 'Configure New Payroll Tag'}
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Universal Macro Variable for Institutional Salary Generation
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

        {/* Island 2: Live Macro Syntax Preview Island */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} color="#2563EB" />
            <span style={{ color: '#64748B', fontWeight: 600 }}>Tag Macro Syntax:</span>
            <span
              style={{
                fontFamily: 'monospace',
                background: '#EEF2F6',
                color: '#0F172A',
                padding: '2px 8px',
                borderRadius: 6,
                fontWeight: 700
              }}
            >
              {`{{${tagCode || 'TAG_CODE'}}}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {type === 'deduction' ? (
              <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={12} /> Deduction
              </span>
            ) : (
              <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} /> Earning
              </span>
            )}
          </div>
        </div>

        {/* Island 3: Scrollable White Form Card */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px 22px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            {errorMsg && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#991B1B',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <AlertCircle size={16} color="#EF4444" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field 1: Tag Code & Display Label */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Tag Code <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADVANCE_SALARY"
                  value={tagCode}
                  onChange={e => handleTagCodeChange(e.target.value)}
                  disabled={Boolean(tagToEdit)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: tagToEdit ? '#F1F5F9' : '#FFFFFF',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Payslip Display Label <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salary Advance Recovery"
                  value={displayLabel}
                  onChange={e => setDisplayLabel(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Field 2: Component Type & Calculation Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Component Classification
                </label>
                <ModernSelect
                  options={typeOptions}
                  value={type}
                  onChange={val => setType(val as any)}
                  placeholder="Select type"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Calculation Formula
                </label>
                <ModernSelect
                  options={calcOptions}
                  value={calculationType}
                  onChange={val => setCalculationType(val as any)}
                  placeholder="Select calculation"
                />
              </div>
            </div>

            {/* Field 3: Default Value */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Default Numerical Value {calculationType === 'percentage_of_base' ? '(%)' : '(PKR)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={defaultValue}
                  onChange={e => setDefaultValue(Number(e.target.value))}
                  placeholder="e.g. 50 or 5000"
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: '#64748B', fontWeight: 700, pointerEvents: 'none' }}>
                  {calculationType === 'percentage_of_base' ? '%' : 'PKR'}
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0 0' }}>
                {calculationType === 'percentage_of_base' 
                  ? 'Applied as a percentage of the staff member’s base pay (e.g. 50 for half salary).' 
                  : 'Applied as a fixed rupee deduction or bonus (can be overridden in prompt via {{TAG: amount}}).'}
              </p>
            </div>

            {/* Field 4: Official Reason Template */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Default Reason / Audit Note Template
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Monthly installment deduction for approved salary advance per institutional memo"
                value={reasonTemplate}
                onChange={e => setReasonTemplate(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: '#0F172A',
                  outline: 'none',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
              <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0 0' }}>
                This text will be printed verbatim as the explanation beneath this item on the payslip.
              </p>
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
                height: 42,
                padding: '0 24px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                transition: 'background-color 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                borderRadius: 9999,
                height: 42,
                padding: '0 24px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Check size={15} color="#10B981" />
              <span>{isSaving ? 'Saving Tag...' : tagToEdit ? 'Update Tag' : 'Save & Register Tag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollTagModal;
