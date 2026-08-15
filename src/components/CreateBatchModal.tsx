import React, { useState, useEffect } from 'react';
import { X, Building2, Sliders } from 'lucide-react';
import { Batch } from '../types';
import { getUnitSingular } from '../utils/academyModeHelper';
import { CustomSelect } from './CustomSelect';
import { api } from '../api/apiClient';

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
  onAddBatch: (batch: Omit<Batch, 'id' | 'studentsCount'>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onAddBatch
}) => {
  const [classNameVal, setClassNameVal] = useState('');
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setClassNameVal('');
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = classNameVal.trim() || Object.values(customValues).filter(Boolean).join(' - ') || `${getUnitSingular()} ${Math.floor(100 + Math.random() * 900)}`;

    onAddBatch({
      name: finalName,
      custom_fields: customValues
    } as any);

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
          maxWidth: 540, 
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
              width: 36,
              height: 36,
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
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Academic section scheduling, capacity, and custom fields</p>
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
            
            {/* Card 1: Batch Name */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>ACADEMIC SECTION DETAILS</div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>
                  Class / Section Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Grade 10, Class 9th, Science Batch A" 
                  value={classNameVal} 
                  onChange={e => setClassNameVal(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Dynamic Custom Fields if present */}
            {customFieldDefs.length > 0 && (
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', letterSpacing: '0.05em' }}>ADDITIONAL ATTRIBUTES</div>
                <div style={{ display: 'grid', gridTemplateColumns: customFieldDefs.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {customFieldDefs.map(field => (
                    <div key={field.id} className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>{field.label}</label>
                      {field.type === 'select' ? (
                        <CustomSelect
                          value={customValues[field.id] || (field.options && field.options[0]) || ''}
                          onChange={val => setCustomValues(prev => ({ ...prev, [field.id]: val }))}
                          options={(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map(opt => ({ value: opt, label: opt }))}
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

            {/* Helper Footer Note */}
            <div style={{ 
              marginTop: 4, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 11, 
              color: '#64748B' 
            }}>
              <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, padding: '2px 5px', display: 'flex', alignItems: 'center' }}>
                <Sliders size={12} color="#475569" />
              </div>
              <span>For extra fields, customize in <strong style={{ color: '#0F172A', fontWeight: 700 }}>Settings &gt; Form Customizer</strong></span>
            </div>
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
            ✓ Create {getUnitSingular()}
          </button>
        </div>
      </div>
    </div>
  );
};
