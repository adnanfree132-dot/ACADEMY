import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Student, Batch } from '../types';
import { compressAndResizeImage } from '../utils/imageResizer';

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
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
  const [totalFee, setTotalFee] = useState('');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left'>('Active');
  const [photoUrl, setPhotoUrl] = useState('');
  const [feeWarning, setFeeWarning] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setParentName(student.parentName);
      setPhone(student.phone);
      setEmail(student.email || '');
      setGender(student.gender);
      setBatchSelect(student.gradeBatch);
      setTotalFee(student.totalFee.toString());
      setStatus(student.status);
      setPhotoUrl(student.photoUrl || '');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Compress and resize photo down to 300x300 1:1 ratio max ~20KB
      const compressedUrl = await compressAndResizeImage(file, 300, 300, 0.85);
      setPhotoUrl(compressedUrl);
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBatch = e.target.value;
    setBatchSelect(newBatch);
    const targetBatch = batches.find(b => b.name === newBatch);
    if (targetBatch && targetBatch.capacity && targetBatch.studentsCount >= targetBatch.capacity) {
      setCapacityWarning(true);
    } else {
      setCapacityWarning(false);
    }
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalFee(e.target.value);
    if (Number(e.target.value) !== student.totalFee) {
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
      parentName,
      phone,
      email,
      gender,
      gradeBatch: batchSelect,
      status,
      totalFee: Number(totalFee) || student.totalFee,
      photoUrl
    });
    
    // reset warnings
    setFeeWarning(false);
    setCapacityWarning(false);
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
          maxWidth: 560, 
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
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Edit Student Profile</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.regNo} • Modify enrollment, profile & status</p>
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
            
            {/* Card 1: Student Profile */}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={15} className="input-icon" />
                    <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gender</label>
                  <select className="form-select" value={gender} onChange={e => setGender(e.target.value as any)}>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Parent / Guardian Details */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em' }}>PARENT / GUARDIAN CONTACT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

            {/* Card 3: Academic, Fee & Status */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>ACADEMIC & STATUS</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Assigned Batch Section</label>
                  <select className="form-select" value={batchSelect} onChange={handleBatchChange}>
                    {batches.length > 0 ? (
                      batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)
                    ) : (
                      <option value={batchSelect}>{batchSelect}</option>
                    )}
                  </select>
                  {capacityWarning && (
                    <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Target batch is at full capacity!
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Profile Status</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Left">Left (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Monthly Tuition Fee ($)</label>
                <div className="input-with-icon">
                  <DollarSign size={15} className="input-icon" />
                  <input className="form-input" type="number" value={totalFee} onChange={handleFeeChange} />
                </div>
                {feeWarning && (
                  <div style={{ fontSize: 11, color: '#D97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> Fee change will apply to next month's invoice. Current unpaid invoices remain unchanged.
                  </div>
                )}
              </div>
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
            <CheckCircle2 size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
