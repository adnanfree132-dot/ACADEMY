import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  Bookmark, 
  Save 
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

  // Template Editing / Adding State
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

  // Main Action: Analyze and Apply in One Click
  const handleAnalyzeAndApply = async () => {
    if (!policyInputText.trim()) {
      setAiErrorMsg('Please enter or select an institutional policy description.');
      return;
    }

    setIsAiProcessing(true);
    setAiSuccessMsg('');
    setAiErrorMsg('');

    try {
      const response = await api.aiParsePayrollPolicy(policyInputText);
      const parsed = response?.data || response;

      let newPolicy: PayrollDeductionPolicy;
      if (parsed) {
        newPolicy = {
          ...policy,
          policyName: parsed.policy_name || parsed.policyName || 'Custom Academy Policy',
          summary: parsed.summary || 'Institutional attendance and salary deduction policy.',
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
        };
      } else {
        newPolicy = {
          ...policy,
          rawPolicyText: policyInputText
        };
      }

      setPolicy(newPolicy);
      onSavePolicy(newPolicy);
      onClose();
    } catch (err: any) {
      setAiErrorMsg(err.message || 'Unable to process policy. Please try again.');
      setIsAiProcessing(false);
    }
  };

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
          maxWidth: 640,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          margin: 'auto'
        }}
      >
        
        {/* Island 1: Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '18px 22px',
            color: '#FFFFFF',
            boxShadow: '0 12px 28px -4px rgba(15,23,42,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
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
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                flexShrink: 0
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  AI Payroll Policy Engine
                </h3>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  AI Rule Generator
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
              transition: 'background-color 0.15s ease',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Main Configuration Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '22px 24px',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Section 1: Saved Policy Templates */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bookmark size={13} color="#2563EB" /> Saved Policy Templates
              </span>
              <button
                type="button"
                onClick={handleOpenAddTemplate}
                style={{
                  background: '#0F172A',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.15)'
                }}
              >
                <Plus size={13} /> Add Template
              </button>
            </div>

            {/* Template Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
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
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isSelected ? '0 3px 8px rgba(15,23,42,0.2)' : '0 1px 2px rgba(15,23,42,0.04)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tmpl.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditTemplate(tmpl, e)}
                        title="Edit Template Name & Text"
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                          border: 'none',
                          borderRadius: 4,
                          color: isSelected ? '#FFFFFF' : '#64748B',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <Edit2 size={12} color={isSelected ? '#FFFFFF' : '#64748B'} />
                      </button>

                      {/* Delete Button (White on dark, clean slate on white) */}
                      {templates.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                          title="Delete Template"
                          style={{
                            background: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: 4,
                            color: isSelected ? '#FFFFFF' : '#64748B',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <Trash2 size={12} color={isSelected ? '#FFFFFF' : '#64748B'} />
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
            <div style={{ background: '#F1F5F9', borderRadius: 14, border: '1.5px solid #CBD5E1', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  {editingTemplateId ? 'Edit Policy Template' : 'Create New Policy Template'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTemplate(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Faculty Special, Strict Exam Month"
                  value={templateFormName}
                  onChange={e => setTemplateFormName(e.target.value)}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Policy Content / Rules Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe working days, paid leaves quota, late arrival penalties, and allowances..."
                  value={templateFormText}
                  onChange={e => setTemplateFormText(e.target.value)}
                  style={{
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '10px 12px',
                    fontSize: 12.5,
                    color: '#0F172A',
                    outline: 'none',
                    lineHeight: 1.5,
                    resize: 'vertical'
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
                    padding: '6px 14px',
                    fontSize: 12,
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
                    background: '#0F172A',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Save size={13} /> Save Template
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Policy Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#2563EB" />
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
                padding: '12px 14px',
                fontSize: 13.5,
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                lineHeight: 1.6,
                minHeight: 110,
                resize: 'vertical',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
              }}
            />
          </div>

          {/* Section 3: Prominent Bold High-Impact Action Button */}
          <button
            type="button"
            disabled={isAiProcessing}
            onClick={handleAnalyzeAndApply}
            style={{
              height: 56,
              borderRadius: 14,
              border: 'none',
              background: isAiProcessing 
                ? '#475569' 
                : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: isAiProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.35)',
              transition: 'all 0.15s ease',
              marginTop: 4
            }}
          >
            {isAiProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" color="#10B981" />
                <span>Analyzing Policy & Generating Rules...</span>
              </>
            ) : (
              <>
                <div 
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={16} color="#10B981" />
                </div>
                <span>Analyze & Apply Policy to Payroll</span>
              </>
            )}
          </button>

          {/* Feedback Messages */}
          {aiErrorMsg && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '11px 16px', color: '#991B1B', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9 }}>
              <AlertCircle size={17} color="#EF4444" />
              <span>{aiErrorMsg}</span>
            </div>
          )}
        </div>

        {/* Island 3: Cancel Action Button */}
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
        </div>
      </div>
    </div>
  );
};

export default PayrollRulesModal;
