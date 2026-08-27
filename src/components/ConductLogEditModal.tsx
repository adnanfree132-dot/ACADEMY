import React, { useState } from 'react';
import { X, MessageSquare, Award, AlertTriangle, ShieldAlert, CheckCircle2, Lock, ChevronDown, Check, GraduationCap, Clock, FileText } from 'lucide-react';
import { ConductLog, ConductCategory, ConductSeverity, UpdateConductLogPayload } from '../types';

interface ConductLogEditModalProps {
  log: ConductLog;
  onClose: () => void;
  onSave: (id: string, payload: UpdateConductLogPayload) => void | Promise<void>;
}

const CATEGORY_OPTIONS: { value: ConductCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'commendation', label: 'Commendation & Praise', icon: <Award size={14} color="#475569" /> },
  { value: 'academic', label: 'Academic Assessment', icon: <GraduationCap size={14} color="#475569" /> },
  { value: 'attendance', label: 'Attendance & Punctuality', icon: <Clock size={14} color="#475569" /> },
  { value: 'infraction', label: 'Behavioral Infraction', icon: <AlertTriangle size={14} color="#475569" /> },
  { value: 'general', label: 'General Observation', icon: <FileText size={14} color="#475569" /> }
];

const SEVERITY_OPTIONS: { value: ConductSeverity; label: string; dotColor: string }[] = [
  { value: 'positive', label: 'Positive / Exemplary', dotColor: '#10B981' },
  { value: 'neutral', label: 'Neutral / Informational', dotColor: '#94A3B8' },
  { value: 'warning', label: 'Warning / Advisory', dotColor: '#F59E0B' },
  { value: 'critical', label: 'Critical / Escalated', dotColor: '#EF4444' }
];

export const ConductLogEditModal: React.FC<ConductLogEditModalProps> = ({ log, onClose, onSave }) => {
  const [category, setCategory] = useState<ConductCategory>(log.category);
  const [severity, setSeverity] = useState<ConductSeverity>(log.severity);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSeverityOpen, setIsSeverityOpen] = useState(false);
  const [title, setTitle] = useState(log.title || '');
  const [remark, setRemark] = useState(log.remark);
  const [isConfidential, setIsConfidential] = useState(log.isConfidential);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim() || remark.trim().length < 3) {
      setError('Remark must be at least 3 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(log.id, {
        category,
        severity,
        title: title.trim() || undefined,
        remark: remark.trim(),
        is_confidential: isConfidential
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update conduct log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200, backdropFilter: 'blur(12px)' }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 540,
          width: '100%',
          animation: 'scaleUp 0.2s ease-out'
        }}
      >
        {/* Island 1: Floating Dark Navy Header Card */}
        <div style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Edit Conduct & Behavior Log</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Authored by {log.authorName} ({log.authorRole})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#94A3B8',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Island 2: Error alert if any */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        {/* Island 3: Floating White Form Card */}
        <form onSubmit={handleSubmit} style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Category & Severity Row with Custom Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Log Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsSeverityOpen(false);
                }}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '9px 12px',
                  background: '#FFFFFF',
                  border: isCategoryOpen ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: isCategoryOpen ? '0 0 0 2px rgba(15,23,42,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                  <span>{CATEGORY_OPTIONS.find(o => o.value === category)?.icon}</span>
                  <span>{CATEGORY_OPTIONS.find(o => o.value === category)?.label}</span>
                </span>
                <ChevronDown 
                  size={14} 
                  color="#64748B" 
                  style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} 
                />
              </button>

              {isCategoryOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 12px 28px -4px rgba(15,23,42,0.15)',
                    padding: 6,
                    zIndex: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {CATEGORY_OPTIONS.map(opt => {
                    const isSelected = opt.value === category;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setCategory(opt.value);
                          setIsCategoryOpen(false);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#1D4ED8' : '#334155',
                          background: isSelected ? '#EFF6FF' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.1s ease'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </span>
                        {isSelected && <Check size={14} color="#2563EB" strokeWidth={2.5} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Severity / Tone
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSeverityOpen(!isSeverityOpen);
                  setIsCategoryOpen(false);
                }}
                style={{
                  width: '100%',
                  fontSize: 13,
                  padding: '9px 12px',
                  background: '#FFFFFF',
                  border: isSeverityOpen ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: isSeverityOpen ? '0 0 0 2px rgba(15,23,42,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0F172A' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_OPTIONS.find(o => o.value === severity)?.dotColor, display: 'inline-block' }} />
                  <span>{SEVERITY_OPTIONS.find(o => o.value === severity)?.label}</span>
                </span>
                <ChevronDown 
                  size={14} 
                  color="#64748B" 
                  style={{ transform: isSeverityOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} 
                />
              </button>

              {isSeverityOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 12px 28px -4px rgba(15,23,42,0.15)',
                    padding: 6,
                    zIndex: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {SEVERITY_OPTIONS.map(opt => {
                    const isSelected = opt.value === severity;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setSeverity(opt.value);
                          setIsSeverityOpen(false);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#1D4ED8' : '#334155',
                          background: isSelected ? '#EFF6FF' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.1s ease'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dotColor, display: 'inline-block' }} />
                          <span>{opt.label}</span>
                        </span>
                        {isSelected && <Check size={14} color="#2563EB" strokeWidth={2.5} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          {/* Title input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Title / Subject (Optional)
            </label>
            <input
              className="form-input"
              placeholder="e.g. Chapter 3 Assessment Leadership"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>

          {/* Remark Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Detailed Observation Note <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Enter detailed behavior or academic conduct notes..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
              style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
              required
            />
          </div>

          {/* Confidentiality Toggle */}
          <div style={{
            background: isConfidential ? '#FFFBEB' : '#F8FAFC',
            border: isConfidential ? '1px solid #FDE68A' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setIsConfidential(!isConfidential)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isConfidential ? '#FEF3C7' : '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isConfidential ? '#D97706' : '#64748B'
              }}>
                <Lock size={16} />
              </div>
              <div>
                <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>
                  Confidential Staff-Only Note
                </strong>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {isConfidential 
                    ? 'Hidden from Student and Parent portals. Visible only to Teachers and Admins.'
                    : 'Visible to Student and linked Parents.'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={e => setIsConfidential(e.target.checked)}
              onClick={e => e.stopPropagation()}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {/* Island 4: Floating Action Pills Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#475569',
                borderRadius: 9999,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: '#0F172A',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: 9999,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
              }}
            >
              <CheckCircle2 size={16} /> {isSubmitting ? 'Updating...' : '✓ Update Remark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
