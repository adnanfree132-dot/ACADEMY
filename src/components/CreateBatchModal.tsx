import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  Sliders,
  Calendar,
  DollarSign,
  Layers,
  Clock,
  Award,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Batch } from '../types';
import { getUnitSingular } from '../utils/academyModeHelper';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { api } from '../api/apiClient';
import { formatCurrency } from '../utils/feeCalculator';

interface CustomFieldDef {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'time';
  options?: string[];
  required?: boolean;
}

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (batch: any) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onAddBatch
}) => {
  const [classNameVal, setClassNameVal] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [courseType, setCourseType] = useState<'recurring_monthly' | 'fixed_course'>('recurring_monthly');
  const [totalCourseFee, setTotalCourseFee] = useState('15000');
  const [defaultInstallments, setDefaultInstallments] = useState('3');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [capacity, setCapacity] = useState('30');
  const [timing, setTiming] = useState('14:00 - 16:00');

  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setClassNameVal('');
      setSectionName('');
      setCourseType('recurring_monthly');
      setTotalCourseFee('15000');
      setDefaultInstallments('3');
      setCustomValues({});
      const local = localStorage.getItem('customClassFields');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) setCustomFieldDefs(parsed);
        } catch (e) {}
      }

      api.getSettings().then(settings => {
        if (settings?.customClassFields) {
          try {
            const defs = typeof settings.customClassFields === 'string' 
              ? JSON.parse(settings.customClassFields) 
              : settings.customClassFields;
            if (Array.isArray(defs) && defs.length > 0) {
              setCustomFieldDefs(defs);
            }
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Installment Preview Calculation
  const installmentPreview = useMemo(() => {
    if (courseType !== 'fixed_course') return [];
    const total = Number(totalCourseFee) || 0;
    const n = Math.max(1, Number(defaultInstallments) || 3);
    const base = Math.floor(total / n);
    const remainder = total - (base * n);

    const items = [];
    for (let i = 1; i <= n; i++) {
      const amt = (i === 1) ? base + remainder : base;
      items.push({
        installmentNumber: i,
        amount: amt
      });
    }
    return items;
  }, [courseType, totalCourseFee, defaultInstallments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = classNameVal.trim() || Object.values(customValues).filter(Boolean).join(' - ') || `${getUnitSingular()} ${Math.floor(100 + Math.random() * 900)}`;

    onAddBatch({
      name: finalName,
      classLevel: finalName,
      section_name: sectionName || undefined,
      course_type: courseType,
      total_fee: courseType === 'fixed_course' ? Number(totalCourseFee) : undefined,
      start_date: courseType === 'fixed_course' ? startDate : undefined,
      end_date: courseType === 'fixed_course' ? endDate : undefined,
      default_installments: courseType === 'fixed_course' ? Number(defaultInstallments) : undefined,
      capacity: Number(capacity) || 30,
      timing,
      custom_fields: customValues
    });

    setClassNameVal('');
    setCustomValues({});
    onClose();
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      style={{ 
        zIndex: 1300, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: 620, 
          width: '100%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {/* Island 1: Floating Dark Navy Header */}
        <div style={{ 
          background: '#0F172A', 
          color: '#FFFFFF', 
          padding: '16px 20px', 
          borderRadius: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
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
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Create {getUnitSingular()}</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Academic batch definition, course fee type & installment setup
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFFFFF', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          <form id="create-batch-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Section 1: Academic Batch Information */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>ACADEMIC SECTION DETAILS</div>
              
              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Batch / Class Name *
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. MDCAT Prep, Python Bootcamp" 
                    value={classNameVal} 
                    onChange={e => setClassNameVal(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Section Identifier (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Morning Section A" 
                    value={sectionName} 
                    onChange={e => setSectionName(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Class Timing</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="14:00 - 16:00" 
                    value={timing} 
                    onChange={e => setTiming(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Student Capacity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="30" 
                    value={capacity} 
                    onChange={e => setCapacity(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Fee Structure & Course Installment Terms */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} color="#2563EB" /> BILLING TYPE & INSTALLMENT CONFIGURATION
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Billing Model</label>
                <ModernSelect
                  value={courseType}
                  onChange={v => setCourseType(v as any)}
                  options={[
                    { value: 'recurring_monthly', label: 'Recurring Monthly Tuition (Standard Academic Stream)' },
                    { value: 'fixed_course', label: 'Fixed Course Fee with Installments (Crash Course / Bootcamp)' }
                  ]}
                  zIndex={1200}
                />
              </div>

              {courseType === 'fixed_course' && (
                <>
                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>Total Course Fee (PKR) *</label>
                      <div className="input-with-icon">
                        <DollarSign size={15} className="input-icon" />
                        <input 
                          type="number" 
                          className="form-input" 
                          required
                          min="1000"
                          step="500"
                          placeholder="15000" 
                          value={totalCourseFee} 
                          onChange={e => setTotalCourseFee(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>Default Installments Count *</label>
                      <ModernSelect
                        value={defaultInstallments}
                        onChange={setDefaultInstallments}
                        options={[
                          { value: '1', label: '1 Full Payment' },
                          { value: '2', label: '2 Equal Installments' },
                          { value: '3', label: '3 Equal Installments' },
                          { value: '4', label: '4 Equal Installments' },
                          { value: '6', label: '6 Monthly Installments' }
                        ]}
                        zIndex={1150}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>Course Start Date *</label>
                      <ModernDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        zIndex={1100}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>Course End Date *</label>
                      <ModernDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        zIndex={1100}
                      />
                    </div>
                  </div>

                  {/* Live Installment Breakdown Preview */}
                  <div
                    style={{
                      background: '#0F172A',
                      color: '#FFFFFF',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                        PROJECTED INSTALLMENT SCHEDULE ({installmentPreview.length} TRANCHES)
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>
                        Total: PKR {formatCurrency(Number(totalCourseFee) || 0)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {installmentPreview.map(inst => (
                        <div
                          key={inst.installmentNumber}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 8,
                            padding: '6px 10px',
                            fontSize: 11
                          }}
                        >
                          <span style={{ color: '#94A3B8' }}>Inst {inst.installmentNumber}: </span>
                          <strong style={{ color: '#FFFFFF' }}>PKR {formatCurrency(inst.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Section 3: Dynamic Custom Fields */}
            {customFieldDefs.length > 0 && (
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', letterSpacing: '0.05em' }}>ADDITIONAL ATTRIBUTES</div>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: customFieldDefs.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {customFieldDefs.map(field => (
                    <div key={field.id} className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>{field.label}</label>
                      {field.type === 'select' ? (
                        <ModernSelect
                          value={customValues[field.id] || (field.options && field.options[0]) || ''}
                          onChange={val => setCustomValues(prev => ({ ...prev, [field.id]: val }))}
                          options={(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map(opt => ({ value: opt, label: opt }))}
                          zIndex={1050}
                        />
                      ) : (
                        <input 
                          type={field.type === 'time' ? 'time' : field.type === 'date' ? 'date' : 'text'}
                          className="form-input"
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={customValues[field.id] || ''}
                          onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              padding: '10px 20px', 
              borderRadius: 9999, 
              border: '1px solid #CBD5E1', 
              background: '#FFFFFF', 
              color: '#334155', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-batch-form"
            style={{ 
              padding: '10px 24px', 
              borderRadius: 9999, 
              border: 'none', 
              background: '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            <CheckCircle2 size={16} color="#10B981" /> Create {getUnitSingular()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBatchModal;
