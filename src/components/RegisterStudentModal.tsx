import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, DollarSign, Calendar, Sparkles, UploadCloud, GraduationCap, Camera } from 'lucide-react';
import { Student, Batch } from '../types';
import { getUnitSingular, getUnitPlural } from '../utils/academyModeHelper';
import { CustomSelect } from './CustomSelect';
import { CredentialSlipModal, CredentialData } from './CredentialSlipModal';
import { resizeImage } from '../utils/imageResizer';
import { api } from '../api/apiClient';

export interface CustomFieldDef {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'time';
  options?: string[];
  required?: boolean;
}

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'regNo' | 'paidFee' | 'dueBalance' | 'isDefaulter'>) => void;
  batches: Batch[];
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  batches
}) => {
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [batchSelect, setBatchSelect] = useState(batches[0]?.name || 'Grade 10 - Sec A');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [totalFee, setTotalFee] = useState('12000');
  const [dueDate, setDueDate] = useState('2026-09-05');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Dynamic Custom Fields State
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [credentialSlipData, setCredentialSlipData] = useState<CredentialData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const localDefs = localStorage.getItem('customStudentFields');
      if (localDefs) {
        try {
          const parsed = JSON.parse(localDefs);
          if (Array.isArray(parsed) && parsed.length > 0) setCustomFieldDefs(parsed);
        } catch (e) {}
      }

      api.getSettings().then(settings => {
        if (settings?.customStudentFields) {
          try {
            const defs = typeof settings.customStudentFields === 'string' 
              ? JSON.parse(settings.customStudentFields) 
              : settings.customStudentFields;
            if (Array.isArray(defs) && defs.length > 0) {
              setCustomFieldDefs(defs);
            }
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 300, 300, 0.85);
        setPhotoUrl(resized);
      } catch (err) {
        console.error('Image resize failed:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phone) return;

    const admissionNo = `ACAD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const studentData: any = {
      name: studentName,
      parentName: parentName || 'Parent / Guardian',
      phone,
      email: email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@academy.com`,
      gender,
      gradeBatch: batchSelect,
      totalFee: Number(totalFee),
      dueDate,
      photoUrl,
      custom_fields: customValues,
      batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined
    };

    onAddStudent(studentData);

    setCredentialSlipData({
      admissionNo,
      studentName,
      studentUsername: phone,
      studentPassword: `Pass@${admissionNo.slice(-3)}`,
      parentName,
      parentPhone: phone,
      parentUsername: `p_${phone}`,
      parentPassword: `Parent@${admissionNo.slice(-3)}`
    });

    // Reset Form
    setStudentName('');
    setParentName('');
    setPhone('');
    setEmail('');
    setPhotoUrl(null);
    setCustomValues({});
  };

  if (credentialSlipData) {
    return (
      <CredentialSlipModal
        onClose={() => {
          setCredentialSlipData(null);
          onClose();
        }}
        data={credentialSlipData}
      />
    );
  }

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
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Register New Student</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Admission profile, academic batch assignment, and fee plan</p>
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

        {/* Scrollable Form Island */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: 22, 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          <form id="register-student-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Card 1: Student Profile Information */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>STUDENT PROFILE INFORMATION</div>
              
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #3B82F6' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={30} color="#94A3B8" />
                    )}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: 11, padding: '4px 10px', borderRadius: 9999 }}>
                      <Camera size={13} style={{ marginRight: 4 }} /> Choose Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Or paste image link:</span>
                  </div>
                  <input
                    className="form-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={photoUrl || ''}
                    onChange={e => setPhotoUrl(e.target.value)}
                    style={{ fontSize: 11, padding: '5px 10px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Student Full Name *</label>
                  <div className="input-with-icon">
                    <User size={15} className="input-icon" />
                    <input className="form-input" required placeholder="e.g. Zayan Ahmed" value={studentName} onChange={e => setStudentName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gender *</label>
                  <select className="form-select" value={gender} onChange={e => setGender(e.target.value as any)}>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Parent / Guardian Contact Details */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em' }}>PARENT / GUARDIAN CONTACT</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent / Guardian Name *</label>
                  <div className="input-with-icon">
                    <User size={15} className="input-icon" />
                    <input className="form-input" required placeholder="e.g. Tariq Ahmed" value={parentName} onChange={e => setParentName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent WhatsApp / Phone *</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="input-icon" />
                    <input className="form-input" required placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Student Email Address</label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-icon" />
                  <input className="form-input" type="email" placeholder="student@academy.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Card 3: Academic Batch & Fee Configuration */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>ACADEMIC & FEE CONFIGURATION</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Assign Batch Section *</label>
                  <select className="form-select" value={batchSelect} onChange={e => setBatchSelect(e.target.value)} required>
                    {batches.length > 0 ? (
                      batches.map(b => (
                        <option key={b.id} value={b.name}>{b.name} ({b.timing || 'Standard'})</option>
                      ))
                    ) : (
                      <>
                        <option value="Matric Part 1 - Morning">Matric Part 1 - Morning</option>
                        <option value="Matric Part 2 - Evening">Matric Part 2 - Evening</option>
                        <option value="FSc Pre-Medical - Group A">FSc Pre-Medical - Group A</option>
                        <option value="ICS Computer Science - Batch 1">ICS Computer Science - Batch 1</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Monthly Tuition Fee ($) *</label>
                  <div className="input-with-icon">
                    <DollarSign size={15} className="input-icon" />
                    <input className="form-input" type="number" required placeholder="5000" value={totalFee} onChange={e => setTotalFee(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Custom Fields */}
            {customFieldDefs.length > 0 && (
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', letterSpacing: '0.05em' }}>ADDITIONAL ATTRIBUTES</div>
                <div style={{ display: 'grid', gridTemplateColumns: customFieldDefs.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {customFieldDefs.map(field => (
                    <div key={field.id} className="form-group">
                      <label className="form-label" style={{ fontSize: 12 }}>{field.label} {field.required && '*'}</label>
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
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons (Directly on Canvas) */}
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
            form="register-student-form"
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
            ✓ Complete Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudentModal;
