import React, { useState } from 'react';
import { X, UserCheck, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { Batch, Teacher } from '../types';
import { api } from '../api/apiClient';

interface SubstituteTeacherModalProps {
  batch: Batch;
  teachers: Teacher[];
  onClose: () => void;
  onSaved?: () => void;
}

export const SubstituteTeacherModal: React.FC<SubstituteTeacherModalProps> = ({
  batch,
  teachers,
  onClose,
  onSaved
}) => {
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [substituteDate, setSubstituteDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Primary instructor on medical leave');
  const [coTeacherId, setCoTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssignSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacher = teachers.find(t => t.id === substituteTeacherId);
    if (!selectedTeacher) return;

    setIsSubmitting(true);
    try {
      await api.assignSubstitute(batch.id, {
        substituteTeacherId: selectedTeacher.id,
        substituteName: selectedTeacher.name,
        date: substituteDate,
        reason
      });
      alert(`Substitute teacher ${selectedTeacher.name} assigned for ${substituteDate}!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error assigning substitute teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignCoTeacher = async () => {
    const selectedTeacher = teachers.find(t => t.id === coTeacherId);
    if (!selectedTeacher) return;

    setIsSubmitting(true);
    try {
      await api.assignCoTeacher(batch.id, {
        coTeacherId: selectedTeacher.id,
        coTeacherName: selectedTeacher.name
      });
      alert(`Co-Teacher ${selectedTeacher.name} assigned to ${batch.name}!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error assigning co-teacher');
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: 520, 
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
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Faculty Cover & Co-Teacher</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{batch.name} • Schedule substitute cover</p>
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
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          
          {/* Card 1: Emergency Substitute Cover */}
          <form onSubmit={handleAssignSubstitute} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#FEF2F2', padding: 16, borderRadius: 14, border: '1px solid #FECACA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991B1B', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>
              <ShieldAlert size={16} /> TEMPORARY SUBSTITUTE COVER
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Select Substitute Faculty *</label>
              <select className="form-select" value={substituteTeacherId} onChange={e => setSubstituteTeacherId(e.target.value)} required>
                <option value="">— Select Available Teacher —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.qualification || 'Faculty'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Coverage Date *</label>
                <input type="date" className="form-input" value={substituteDate} onChange={e => setSubstituteDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Reason for Cover *</label>
                <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button 
                type="submit" 
                disabled={isSubmitting || !substituteTeacherId}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: isSubmitting || !substituteTeacherId ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                ✓ Assign Substitute Teacher
              </button>
            </div>
          </form>

          {/* Card 2: Permanent Co-Teacher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>
              <UserPlus size={16} /> ASSISTANT / CO-TEACHER ASSIGNMENT
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Co-Teacher / Teaching Assistant</label>
              <select className="form-select" value={coTeacherId} onChange={e => setCoTeacherId(e.target.value)}>
                <option value="">— Select Co-Teacher —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.qualification || 'Faculty'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button 
                type="button" 
                onClick={handleAssignCoTeacher} 
                disabled={isSubmitting || !coTeacherId}
                style={{
                  padding: '8px 18px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: isSubmitting || !coTeacherId ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                ✓ Assign Co-Teacher
              </button>
            </div>
          </div>
        </div>

        {/* Island 4: Floating Right-Aligned Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            ✓ Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
