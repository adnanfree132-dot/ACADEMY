import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  TrendingDown, 
  Sliders,
  Sparkles,
  Zap,
  Award,
  DollarSign,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ModernSelect } from './ModernSelect';
import { api } from '../api/apiClient';

export interface PayrollDeductionPolicy {
  policyName?: string;
  summary?: string;
  workingDaysMode: 'fixed_26' | 'fixed_30' | 'calendar';
  customWorkingDays?: number;
  lateDeductionMode: 'ratio_3_to_1' | 'ratio_3_to_half' | 'fixed_amount' | 'none';
  lateGraceCount: number;
  latePenaltyAmount: number;
  halfDayDeductionRatio: number;
  unexcusedAbsenceRatio: number;
  paidLeaveAllowance?: number;
  specialAllowances?: Array<{
    label: string;
    type: 'percentage' | 'fixed';
    value: number;
    applies_to: string;
  }>;
  attendanceBonus?: {
    enabled: boolean;
    amount: number;
    condition: string;
  };
  rawPolicyText?: string;
}

export const DEFAULT_PAYROLL_POLICY: PayrollDeductionPolicy = {
  policyName: 'Standard Academic Policy',
  summary: '26 standard working days baseline with 3:1 late-to-day ratio and 2 monthly paid leaves.',
  workingDaysMode: 'fixed_26',
  customWorkingDays: 26,
  lateDeductionMode: 'ratio_3_to_1',
  lateGraceCount: 2,
  latePenaltyAmount: 500,
  halfDayDeductionRatio: 0.5,
  unexcusedAbsenceRatio: 1.0,
  paidLeaveAllowance: 2,
  attendanceBonus: {
    enabled: true,
    amount: 2000,
    condition: 'zero_absences'
  },
  specialAllowances: []
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
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [policy, setPolicy] = useState<PayrollDeductionPolicy>({
    ...DEFAULT_PAYROLL_POLICY,
    ...currentPolicy
  });

  const [policyInputText, setPolicyInputText] = useState<string>(
    currentPolicy?.rawPolicyText ||
    'Teachers and staff work 26 standard days per month. Each employee is granted 2 paid casual leaves per month. 3 late arrivals result in 1 full day salary deduction. Science and laboratory teachers receive a 15% special allowance. Staff with 100% monthly attendance receive a 2,500 PKR attendance bonus.'
  );

  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string>('');
  const [aiErrorMsg, setAiErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleApplyPreset = (text: string) => {
    setPolicyInputText(text);
    setAiSuccessMsg('');
    setAiErrorMsg('');
  };

  const handleRunAiParser = async () => {
    if (!policyInputText.trim()) {
      setAiErrorMsg('Please paste or enter your institute payroll policy description.');
      return;
    }

    setIsAiProcessing(true);
    setAiSuccessMsg('');
    setAiErrorMsg('');

    try {
      const response = await api.aiParsePayrollPolicy(policyInputText);
      const parsed = response?.data || response;

      if (parsed) {
        setPolicy(prev => ({
          ...prev,
          policyName: parsed.policy_name || parsed.policyName || 'AI Extracted Policy',
          summary: parsed.summary || 'Policy extracted via Cloudflare Workers AI.',
          workingDaysMode: parsed.workingDaysMode || 'fixed_26',
          customWorkingDays: parsed.customWorkingDays || (parsed.workingDaysMode === 'fixed_30' ? 30 : 26),
          lateDeductionMode: parsed.lateDeductionMode || 'ratio_3_to_1',
          lateGraceCount: parsed.lateGraceCount !== undefined ? parsed.lateGraceCount : 2,
          latePenaltyAmount: parsed.latePenaltyAmount || 500,
          halfDayDeductionRatio: parsed.halfDayDeductionRatio !== undefined ? parsed.halfDayDeductionRatio : 0.5,
          unexcusedAbsenceRatio: parsed.unexcusedAbsenceRatio !== undefined ? parsed.unexcusedAbsenceRatio : 1.0,
          paidLeaveAllowance: parsed.paidLeaveAllowance !== undefined ? parsed.paidLeaveAllowance : 2,
          attendanceBonus: parsed.attendanceBonus || { enabled: false, amount: 0, condition: 'none' },
          specialAllowances: parsed.specialAllowances || [],
          rawPolicyText: policyInputText
        }));

        setAiSuccessMsg('Cloudflare Workers AI parsed your policy into structured calculation rules.');
      }
    } catch (err: any) {
      setAiErrorMsg(err.message || 'Unable to parse policy via AI. You can fine-tune rules in manual mode.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePolicy({
      ...policy,
      rawPolicyText: policyInputText
    });
    onClose();
  };

  return (
    <div className="floating-island-overlay" style={{ zIndex: 9999 }}>
      <div className="floating-island-container" style={{ maxWidth: 680 }}>
        
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
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  AI Payroll Policy & Rule Engine
                </h3>
                <span
                  style={{
                    background: 'rgba(37, 99, 235, 0.25)',
                    color: '#60A5FA',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid rgba(96, 165, 250, 0.3)'
                  }}
                >
                  Cloudflare Workers AI
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Converts natural language institutional policies into automated payroll calculation rules
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

        {/* Island 2: Mode Selector Pill Island */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            padding: '4px',
            display: 'inline-flex',
            gap: 4,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            alignSelf: 'flex-start'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            style={{
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'ai' ? '#0F172A' : 'transparent',
              color: activeTab === 'ai' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            <Sparkles size={13} color={activeTab === 'ai' ? '#FFFFFF' : '#64748B'} />
            AI Policy Document Parser
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'manual' ? '#0F172A' : 'transparent',
              color: activeTab === 'manual' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            <Sliders size={13} color={activeTab === 'manual' ? '#FFFFFF' : '#64748B'} />
            Fine-Tune Calculation Rules
          </button>
        </div>

        {/* Island 3: Form & Rules Configuration Card */}
        <div
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
          {/* TAB 1: AI Policy Parser */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Quick Template Chips */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Quick Policy Templates
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Standard school schedule: 26 working days. Teachers receive 2 paid leaves per month. 3 late arrivals equal 1 half-day deduction. Science teachers get 10% lab allowance. 2000 PKR bonus for 100% attendance.')}
                    style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '5px 12px', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    School / College Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Strict private academy policy: 30 days divisor. 1 paid leave per month. 3 lates equal 1 full day salary deduction. Unexcused absences deduct 150% daily wage. 3000 PKR attendance bonus.')}
                    style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '5px 12px', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    Strict Academy Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Higher education & coaching center: Calendar days basis. 4 monthly leaves. Late arrivals have 500 PKR fixed penalty after 2 grace lates. Transport allowance is 3,000 PKR.')}
                    style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 9999, padding: '5px 12px', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                  >
                    Coaching & Higher Ed
                  </button>
                </div>
              </div>

              {/* Policy Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                  Paste or Describe Your Institute's Salary & Attendance Policy:
                </label>
                <textarea
                  rows={4}
                  value={policyInputText}
                  onChange={e => setPolicyInputText(e.target.value)}
                  placeholder="Describe your working days, late arrival penalties, leave allowances, bonuses, and special allowances in plain English or Urdu..."
                  style={{
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0F172A',
                    outline: 'none',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                  }}
                />
              </div>

              {/* AI Trigger Button */}
              <button
                type="button"
                disabled={isAiProcessing}
                onClick={handleRunAiParser}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: 'none',
                  background: isAiProcessing ? '#64748B' : '#2563EB',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: isAiProcessing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Parsing Policy via Cloudflare Workers AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Analyze & Generate Payroll Rules</span>
                  </>
                )}
              </button>

              {/* AI Feedback Alerts */}
              {aiSuccessMsg && (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 12, padding: '10px 14px', color: '#065F46', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>{aiSuccessMsg}</span>
                </div>
              )}
              {aiErrorMsg && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '10px 14px', color: '#991B1B', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#EF4444" />
                  <span>{aiErrorMsg}</span>
                </div>
              )}

              {/* Generated Rules Visual Inspection Cards */}
              <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      {policy.policyName || 'Active Extracted Rule Set'}
                    </span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10.5, fontWeight: 700 }}>
                    Ready to Calculate
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 4 }}>
                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Daily Rate Basis</span>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                      {policy.workingDaysMode === 'fixed_26' ? '26 Days' : policy.workingDaysMode === 'fixed_30' ? '30 Days' : 'Calendar Days'}
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Late Penalties</span>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
                      {policy.lateDeductionMode === 'ratio_3_to_1' ? '3 Lates = 1 Day' : policy.lateDeductionMode === 'ratio_3_to_half' ? '3 Lates = 0.5 Day' : policy.lateDeductionMode === 'fixed_amount' ? `PKR ${policy.latePenaltyAmount} / late` : 'No deduction'}
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Paid Leaves Quota</span>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                      {policy.paidLeaveAllowance || 2} Leaves / month
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attendance Bonus</span>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                      {policy.attendanceBonus?.enabled ? `PKR ${policy.attendanceBonus.amount || 2000}` : 'None'}
                    </div>
                  </div>
                </div>

                {policy.specialAllowances && policy.specialAllowances.length > 0 && (
                  <div style={{ marginTop: 6, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '8px 12px' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Special Allowances</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {policy.specialAllowances.map((a, i) => (
                        <span key={i} className="badge badge-indigo" style={{ fontSize: 11, fontWeight: 600 }}>
                          {a.label}: {a.value}{a.type === 'percentage' ? '%' : ' PKR'} ({a.applies_to})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Fine-Tune / Manual Adjustments */}
          {activeTab === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
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

              {/* Section 4: Paid Leaves Allowance & Bonus */}
              <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={13} /> 4. Leave Allowance & Attendance Bonus
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11.5 }}>Monthly Paid Leaves Quota</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={policy.paidLeaveAllowance ?? 2}
                      onChange={e => setPolicy(prev => ({ ...prev, paidLeaveAllowance: Number(e.target.value) || 0 }))}
                      style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11.5 }}>100% Attendance Bonus (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={policy.attendanceBonus?.amount ?? 2000}
                      onChange={e => setPolicy(prev => ({
                        ...prev,
                        attendanceBonus: {
                          enabled: Number(e.target.value) > 0,
                          amount: Number(e.target.value) || 0,
                          condition: 'zero_absences'
                        }
                      }))}
                      style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
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
              padding: '0 20px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
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
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Check size={16} /> Save & Apply to Academy Payroll
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollRulesModal;
