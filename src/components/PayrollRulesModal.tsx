import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  TrendingDown, 
  Sliders
} from 'lucide-react';
import { ModernSelect } from './ModernSelect';

export interface PayrollDeductionPolicy {
  workingDaysMode: 'fixed_26' | 'fixed_30' | 'calendar';
  customWorkingDays?: number;
  lateDeductionMode: 'ratio_3_to_1' | 'ratio_3_to_half' | 'fixed_amount' | 'none';
  lateGraceCount: number;
  latePenaltyAmount: number;
  halfDayDeductionRatio: number;
  unexcusedAbsenceRatio: number;
}

export const DEFAULT_PAYROLL_POLICY: PayrollDeductionPolicy = {
  workingDaysMode: 'fixed_26',
  customWorkingDays: 26,
  lateDeductionMode: 'ratio_3_to_1',
  lateGraceCount: 2,
  latePenaltyAmount: 500,
  halfDayDeductionRatio: 0.5,
  unexcusedAbsenceRatio: 1.0
};

interface PayrollRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPolicy?: PayrollDeductionPolicy;
  onSavePolicy: (policy: PayrollDeductionPolicy) => void;
}

export const PayrollRulesModal: React.FC<PayrollRulesModalProps> = ({
  isOpen,
  onClose,
  currentPolicy = DEFAULT_PAYROLL_POLICY,
  onSavePolicy
}) => {
  const [policy, setPolicy] = useState<PayrollDeductionPolicy>({
    ...DEFAULT_PAYROLL_POLICY,
    ...currentPolicy
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePolicy(policy);
    onClose();
  };

  return (
    <div className="floating-island-overlay" style={{ zIndex: 9999 }}>
      <div className="floating-island-container" style={{ maxWidth: 640 }}>
        
        {/* Island 1: Dark Navy Header Card */}
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
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Automated Payroll & Deduction Rules
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Define institutional working day baseline, late arrival fines & absence deduction rates
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

        {/* Island 2: Form & Rules Configuration Card */}
        <form
          onSubmit={handleSave}
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
            gap: 16
          }}
        >
          {/* Section 1: Working Days Basis */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> 1. Monthly Daily Rate Calculation Baseline
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Working Days Divisor</label>
              <ModernSelect
                value={policy.workingDaysMode}
                onChange={val => setPolicy(prev => ({ ...prev, workingDaysMode: val as any }))}
                compact
                options={[
                  { value: 'fixed_26', label: '26 Working Days (Standard Academic / Corporate 6-Day Week)' },
                  { value: 'fixed_30', label: '30 Days Fixed Divisor' },
                  { value: 'calendar', label: 'Actual Calendar Days in Month (28, 29, 30, or 31 Days)' }
                ]}
                zIndex={1200}
              />
              <span style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Daily Wage Rate = Base Salary ÷ Working Days (e.g. PKR 65,000 ÷ 26 = PKR 2,500/day)
              </span>
            </div>
          </div>

          {/* Section 2: Late Arrival Penalty Rules */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} /> 2. Late Arrival Penalty Policy
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Late Coming Rule</label>
              <ModernSelect
                value={policy.lateDeductionMode}
                onChange={val => setPolicy(prev => ({ ...prev, lateDeductionMode: val as any }))}
                compact
                options={[
                  { value: 'ratio_3_to_1', label: '3 Late Arrivals = 1 Full Day Salary Deduction (Standard)' },
                  { value: 'ratio_3_to_half', label: '3 Late Arrivals = 0.5 Day (Half Day) Salary Deduction' },
                  { value: 'fixed_amount', label: 'Fixed Monetary Fine per Late Check-in' },
                  { value: 'none', label: 'No Automatic Financial Deduction for Lates' }
                ]}
                zIndex={1150}
              />
            </div>

            {policy.lateDeductionMode === 'fixed_amount' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Grace Lates Allowed (Free)</label>
                  <input
                    type="number"
                    min={0}
                    value={policy.lateGraceCount}
                    onChange={e => setPolicy(prev => ({ ...prev, lateGraceCount: Number(e.target.value) || 0 }))}
                    style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Fine per Late (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={policy.latePenaltyAmount}
                    onChange={e => setPolicy(prev => ({ ...prev, latePenaltyAmount: Number(e.target.value) || 0 }))}
                    style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Absence & Half-Day Rates */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingDown size={13} /> 3. Absence & Half-Day Deductions
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Unexcused Absence Rate</label>
                <ModernSelect
                  value={String(policy.unexcusedAbsenceRatio)}
                  onChange={val => setPolicy(prev => ({ ...prev, unexcusedAbsenceRatio: Number(val) }))}
                  compact
                  options={[
                    { value: '1', label: '100% of Daily Wage (1 Day Pay)' },
                    { value: '1.5', label: '150% of Daily Wage (Penalty Rate)' },
                    { value: '2', label: '200% of Daily Wage (Double Deduction)' }
                  ]}
                  zIndex={1100}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Half-Day Rate</label>
                <ModernSelect
                  value={String(policy.halfDayDeductionRatio)}
                  onChange={val => setPolicy(prev => ({ ...prev, halfDayDeductionRatio: Number(val) }))}
                  compact
                  options={[
                    { value: '0.5', label: '50% of Daily Wage (Half Day Pay)' },
                    { value: '1', label: '100% of Daily Wage (Full Day Deduction)' },
                    { value: '0', label: '0% (No Half-Day Penalty)' }
                  ]}
                  zIndex={1050}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Island 3: Floating Action Pill Row */}
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
              padding: '0 20px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              borderRadius: 9999,
              height: 42,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            <Check size={16} /> Save & Apply Deduction Rules
          </button>
        </div>
      </div>
    </div>
  );
};
export default PayrollRulesModal;
