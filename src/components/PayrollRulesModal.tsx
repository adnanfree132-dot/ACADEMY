import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  TrendingDown, 
  Sparkles,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Bookmark,
  Save,
  RotateCcw
} from 'lucide-react';
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

export interface PolicyTemplate {
  id: string;
  name: string;
  policyText: string;
}

const DEFAULT_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'School / College Standard',
    policyText: 'Standard school schedule: 26 working days. Teachers receive 2 paid leaves per month. 3 late arrivals equal 1 half-day deduction. Science teachers get 10% lab allowance. 2000 PKR bonus for 100% attendance.'
  },
  {
    id: 'tmpl-2',
    name: 'Strict Academy Policy',
    policyText: 'Strict private academy policy: 30 days divisor. 1 paid leave per month. 3 lates equal 1 full day salary deduction. Unexcused absences deduct 150% daily wage. 3000 PKR attendance bonus.'
  },
  {
    id: 'tmpl-3',
    name: 'Coaching & Higher Ed',
    policyText: 'Higher education & coaching center: Calendar days basis. 4 monthly leaves. Late arrivals have 500 PKR fixed penalty after 2 grace lates. Transport allowance is 3,000 PKR.'
  }
];

const TEMPLATES_STORAGE_KEY = 'academy_payroll_policy_templates';

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
  const [policy, setPolicy] = useState<PayrollDeductionPolicy>({
    ...DEFAULT_PAYROLL_POLICY,
    ...currentPolicy
  });

  const [policyInputText, setPolicyInputText] = useState<string>(
    currentPolicy?.rawPolicyText ||
    'Teachers and staff work 26 standard days per month. Each employee is granted 2 paid casual leaves per month. 3 late arrivals result in 1 full day salary deduction. Science and laboratory teachers receive a 15% special allowance. Staff with 100% monthly attendance receive a 2,500 PKR attendance bonus.'
  );

  // Dynamic Editable Templates State
  const [templates, setTemplates] = useState<PolicyTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TEMPLATES;
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>('tmpl-1');

  // Template Editing / Adding Modal State
  const [isEditingTemplate, setIsEditingTemplate] = useState<boolean>(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFormName, setTemplateFormName] = useState<string>('');
  const [templateFormText, setTemplateFormText] = useState<string>('');

  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string>('');
  const [aiErrorMsg, setAiErrorMsg] = useState<string>('');

  // Persist templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  if (!isOpen) return null;

  const handleSelectTemplate = (tmpl: PolicyTemplate) => {
    setActiveTemplateId(tmpl.id);
    setPolicyInputText(tmpl.policyText);
    setAiSuccessMsg('');
    setAiErrorMsg('');
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplateId(null);
    setTemplateFormName('');
    setTemplateFormText(policyInputText || '');
    setIsEditingTemplate(true);
  };

  const handleOpenEditTemplate = (tmpl: PolicyTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(tmpl.id);
    setTemplateFormName(tmpl.name);
    setTemplateFormText(tmpl.policyText);
    setIsEditingTemplate(true);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (templates.length <= 1) {
      alert('You must keep at least one policy template.');
      return;
    }
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    if (activeTemplateId === id) {
      handleSelectTemplate(updated[0]);
    }
  };

  const handleSaveTemplateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormName.trim() || !templateFormText.trim()) return;

    if (editingTemplateId) {
      // Edit existing
      const updated = templates.map(t => 
        t.id === editingTemplateId 
          ? { ...t, name: templateFormName.trim(), policyText: templateFormText.trim() }
          : t
      );
      setTemplates(updated);
      if (activeTemplateId === editingTemplateId) {
        setPolicyInputText(templateFormText.trim());
      }
    } else {
      // Add new
      const newId = `tmpl-${Date.now()}`;
      const newTmpl: PolicyTemplate = {
        id: newId,
        name: templateFormName.trim(),
        policyText: templateFormText.trim()
      };
      setTemplates([...templates, newTmpl]);
      setActiveTemplateId(newId);
      setPolicyInputText(newTmpl.policyText);
    }

    setIsEditingTemplate(false);
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
      setAiErrorMsg(err.message || 'Unable to parse policy via AI. Please check the text description.');
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
                  AI Payroll Policy Engine
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

        {/* Island 2: Form & Rules Configuration Card */}
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
          {/* Dynamic Editable Policy Templates Section */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bookmark size={13} color="#2563EB" /> Saved Policy Templates
              </span>
              <button
                type="button"
                onClick={handleOpenAddTemplate}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 9999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} /> Add Template
              </button>
            </div>

            {/* Template Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {templates.map(tmpl => {
                const isSelected = activeTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    style={{
                      background: isSelected ? '#0F172A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      border: isSelected ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                      borderRadius: 9999,
                      padding: '4px 10px 4px 12px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isSelected ? '0 2px 6px rgba(15,23,42,0.15)' : '0 1px 2px rgba(15,23,42,0.04)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tmpl.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditTemplate(tmpl, e)}
                        title="Edit Template Name & Text"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isSelected ? '#94A3B8' : '#64748B',
                          cursor: 'pointer',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit2 size={11} />
                      </button>
                      {templates.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                          title="Delete Template"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isSelected ? '#F87171' : '#DC2626',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline Template Editor Modal / Card */}
          {isEditingTemplate && (
            <div style={{ background: '#EFF6FF', borderRadius: 14, border: '1.5px solid #BFDBFE', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                  {editingTemplateId ? 'Edit Policy Template' : 'Create New Policy Template'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTemplate(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Faculty Special, Strict Exam Month"
                  value={templateFormName}
                  onChange={e => setTemplateFormName(e.target.value)}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: '1px solid #93C5FD',
                    background: '#FFFFFF',
                    padding: '0 10px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase' }}>
                  Policy Content / Rules
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter policy description..."
                  value={templateFormText}
                  onChange={e => setTemplateFormText(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: '1px solid #93C5FD',
                    background: '#FFFFFF',
                    padding: '8px 10px',
                    fontSize: 12,
                    color: '#0F172A',
                    outline: 'none',
                    lineHeight: 1.4
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingTemplate(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '5px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplateForm}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: 8,
                    padding: '5px 14px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Save size={12} /> Save Template
                </button>
              </div>
            </div>
          )}

          {/* Policy Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
              Institute Salary, Attendance & Penalty Policy Description:
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
                  {policy.workingDaysMode === 'fixed_26' ? '26 Days Divisor' : policy.workingDaysMode === 'fixed_30' ? '30 Days Divisor' : 'Calendar Days'}
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
