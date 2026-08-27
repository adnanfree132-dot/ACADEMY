import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Clock,
  Slash,
  GraduationCap,
  LogOut,
  Award,
  Percent,
  Calculator
} from 'lucide-react';
import { Student, Batch, ScholarshipType, ScholarshipReason } from '../types';
import { compressAndResizeImage } from '../utils/imageResizer';
import { ModernSelect } from './ModernSelect';
import { ModernDayOfMonthPicker } from './ModernDayOfMonthPicker';
import {
  calculateLiveFeeBreakdown,
  formatCurrency
} from '../utils/feeCalculator';

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  batches,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [batchSelect, setBatchSelect] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left'>('Active');
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Fee Terms & Scholarship State
  const [baseMonthlyFee, setBaseMonthlyFee] = useState('5000');
  const [scholarshipType, setScholarshipType] = useState<ScholarshipType>('none');
  const [scholarshipValue, setScholarshipValue] = useState('0');
  const [scholarshipReason, setScholarshipReason] = useState<ScholarshipReason>('merit');
  const [anchorDay, setAnchorDay] = useState('1');

  const [feeWarning, setFeeWarning] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setParentName(student.parentName || '');
      setPhone(student.phone || '');
      setEmail(student.email || '');
      setGender(student.gender || 'Male');
      setBatchSelect(student.gradeBatch || '');
      setStatus(student.status || 'Active');
      setPhotoUrl(student.photoUrl || '');
      
      const initialFee = student.baseMonthlyFee || student.totalFee || 5000;
      setBaseMonthlyFee(String(initialFee));
      setScholarshipType(student.scholarshipType || 'none');
      setScholarshipValue(String(student.scholarshipValue || 0));
      setScholarshipReason(student.scholarshipReason || 'merit');
      setAnchorDay(String(student.billingAnchorDay || 1));
    }
  }, [student]);

  // Live Reactive Breakdown
  const feeBreakdown = useMemo(() => {
    const gross = Number(baseMonthlyFee) || 0;
    const sVal = scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0;
    return calculateLiveFeeBreakdown(gross, scholarshipType, sVal);
  }, [baseMonthlyFee, scholarshipType, scholarshipValue]);

  if (!isOpen || !student) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressAndResizeImage(file, 300, 300, 0.85);
      setPhotoUrl(compressedUrl);
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseMonthlyFee(e.target.value);
    const origFee = student.baseMonthlyFee || student.totalFee || 0;
    if (Number(e.target.value) !== origFee) {
      setFeeWarning(true);
    } else {
      setFeeWarning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parentName || !phone) return;

    onSave({
      ...student,
      name,
      fullName: name,
      parentName,
      phone,
      email,
      gender,
      gradeBatch: batchSelect,
      status,
      baseMonthlyFee: Number(baseMonthlyFee) || 0,
      totalFee: Number(baseMonthlyFee) || 0,
      scholarshipType,
      scholarship_type: scholarshipType,
      scholarshipValue: scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0,
      scholarship_value: scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0,
      scholarshipReason: scholarshipType === 'none' ? undefined : scholarshipReason,
      scholarship_reason: scholarshipType === 'none' ? undefined : scholarshipReason,
      billingAnchorDay: Number(anchorDay) || 1,
      billing_anchor_day: Number(anchorDay) || 1,
      photoUrl
    });
    
    setFeeWarning(false);
    setCapacityWarning(false);
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
          maxWidth: 640, 
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
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Edit Student Profile</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                {student.regNo || student.admission_no || 'STU'} • Modify profile, scholarship terms & status
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

        {/* Island 3: Floating White Scrollable Form Card */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: 22, 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          <form id="edit-student-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Section 1: Student Profile */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>STUDENT PROFILE</div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #3B82F6', flexShrink: 0 }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={26} color="#94A3B8" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: 11, marginBottom: 4 }} />
                  <input className="form-input" placeholder="Or paste Photo Image URL..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} style={{ fontSize: 11, padding: '4px 8px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Student Full Name *</label>
                <div className="input-with-icon">
                  <User size={15} className="input-icon" />
                  <input className="form-input" required value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={15} className="input-icon" />
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gender</label>
                  <ModernSelect
                    value={gender}
                    onChange={v => setGender(v as any)}
                    options={[
                      { value: 'Male', label: 'Male', icon: <User size={14} color="#475569" /> },
                      { value: 'Female', label: 'Female', icon: <User size={14} color="#475569" /> }
                    ]}
                    zIndex={1250}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Parent / Guardian Details */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em' }}>PARENT / GUARDIAN CONTACT</div>
              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent Name *</label>
                  <div className="input-with-icon">
                    <User size={15} className="input-icon" />
                    <input className="form-input" required value={parentName} onChange={e => setParentName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent Phone *</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="input-icon" />
                    <input className="form-input" required value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Academic & Status */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>ACADEMIC BATCH & STATUS</div>
              
              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Assigned Batch Section</label>
                  <ModernSelect
                    value={batchSelect}
                    onChange={v => {
                      setBatchSelect(v);
                      const target = batches.find(b => b.name === v);
                      if (target && target.studentsCount && target.capacity && target.studentsCount >= target.capacity) {
                        setCapacityWarning(true);
                      } else {
                        setCapacityWarning(false);
                      }
                    }}
                    options={batches.length > 0 ? (
                      batches.map(b => ({ value: b.name, label: b.name }))
                    ) : (
                      [{ value: batchSelect, label: batchSelect }]
                    )}
                    zIndex={1200}
                  />
                  {capacityWarning && (
                    <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Target batch is at full capacity!
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Profile Status</label>
                  <ModernSelect
                    value={status}
                    onChange={v => setStatus(v as any)}
                    options={[
                      { value: 'Active', label: 'Active', icon: <UserCheck size={14} color="#475569" /> },
                      { value: 'On Leave', label: 'On Leave', icon: <Clock size={14} color="#475569" /> },
                      { value: 'Suspended', label: 'Suspended', icon: <Slash size={14} color="#475569" /> },
                      { value: 'Graduated', label: 'Graduated', icon: <GraduationCap size={14} color="#475569" /> },
                      { value: 'Left', label: 'Left (Archived)', icon: <LogOut size={14} color="#475569" /> }
                    ]}
                    zIndex={1200}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Scholarship Terms & Base Fee */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={15} color="#2563EB" /> SCHOLARSHIP & FEE TERMS
                </span>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  Anchor Day: {anchorDay}th of each month
                </span>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Base Monthly Tuition Fee (PKR)</label>
                  <div className="input-with-icon">
                    <DollarSign size={15} className="input-icon" />
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="100"
                      value={baseMonthlyFee}
                      onChange={handleFeeChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Billing Anchor Day (1–31)</label>
                  <ModernDayOfMonthPicker
                    value={anchorDay}
                    onChange={setAnchorDay}
                    defaultDay={student?.billingAnchorDay || 1}
                    compact={true}
                    zIndex={1200}
                    openAbove={false}
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Scholarship Type</label>
                  <ModernSelect
                    value={scholarshipType}
                    onChange={v => setScholarshipType(v as ScholarshipType)}
                    options={[
                      { value: 'none', label: 'Standard Rate (No Scholarship)' },
                      { value: 'percentage', label: 'Percentage Discount (%)' },
                      { value: 'fixed', label: 'Fixed Amount Concession (PKR)' }
                    ]}
                    zIndex={1150}
                  />
                </div>

                {scholarshipType !== 'none' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>
                      {scholarshipType === 'percentage' ? 'Discount Percentage (%)' : 'Fixed Concession (PKR)'}
                    </label>
                    <div className="input-with-icon">
                      {scholarshipType === 'percentage' ? (
                        <Percent size={15} className="input-icon" />
                      ) : (
                        <DollarSign size={15} className="input-icon" />
                      )}
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max={scholarshipType === 'percentage' ? 100 : Number(baseMonthlyFee) || 100000}
                        value={scholarshipValue}
                        onChange={e => setScholarshipValue(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {scholarshipType !== 'none' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Scholarship Category / Reason</label>
                  <ModernSelect
                    value={scholarshipReason}
                    onChange={v => setScholarshipReason(v as ScholarshipReason)}
                    options={[
                      { value: 'merit', label: 'Academic Merit' },
                      { value: 'need_based', label: 'Need-Based Financial Aid' },
                      { value: 'sibling', label: 'Sibling Concession' },
                      { value: 'staff_child', label: 'Staff Child Benefit' },
                      { value: 'special_grant', label: 'Special Management Grant' },
                      { value: 'other', label: 'Other Concession' }
                    ]}
                    zIndex={1100}
                  />
                </div>
              )}

              {/* Live Fee Breakdown */}
              <div
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Gross Base Fee</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>PKR {formatCurrency(feeBreakdown.grossMonthlyFee)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Discount</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: feeBreakdown.discountAmount > 0 ? '#34D399' : '#94A3B8' }}>
                    {feeBreakdown.discountAmount > 0 ? `-PKR ${formatCurrency(feeBreakdown.discountAmount)}` : 'PKR 0'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Net Monthly Fee</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>PKR {formatCurrency(feeBreakdown.netMonthlyFee)}</div>
                </div>
              </div>

              {feeWarning && (
                <div style={{ fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> Fee changes will update the student's recurring plan for subsequent billing cycles.
                </div>
              )}
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
            form="edit-student-form"
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
            <CheckCircle2 size={16} color="#10B981" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;
