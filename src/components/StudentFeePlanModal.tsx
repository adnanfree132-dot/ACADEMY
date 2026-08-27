import React, { useState, useEffect } from 'react';
import { X, DollarSign, Award, Percent, Calendar } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';
import { ModernSelect } from './ModernSelect';

interface StudentFeePlanModalProps {
  student: Student;
  onClose: () => void;
  onSaved?: () => void;
}

export const StudentFeePlanModal: React.FC<StudentFeePlanModalProps> = ({
  student,
  onClose,
  onSaved
}) => {
  const [monthlyAmount, setMonthlyAmount] = useState(String(student.totalFee || 10000));
  const [discount, setDiscount] = useState('0');
  const [dueDay, setDueDay] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getStudentFeePlan(student.id).then(plan => {
      if (plan) {
        if (plan.monthly_amount) setMonthlyAmount(String(plan.monthly_amount));
        if (plan.discount !== undefined) setDiscount(String(plan.discount));
        if (plan.due_day) setDueDay(String(plan.due_day));
        if (plan.notes) setNotes(plan.notes);
      }
    }).catch(() => {});
  }, [student]);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaved) onSaved();
    onClose();

    api.saveStudentFeePlan(student.id, {
      monthlyAmount: Number(monthlyAmount),
      discount: Number(discount),
      dueDay: Number(dueDay),
      notes: notes.trim()
    }).catch(err => console.error('Error saving fee plan in background:', err));
  };

  const finalFee = Math.max(0, Number(monthlyAmount) - (Number(monthlyAmount) * (Number(discount) / 100)));

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
          maxWidth: 480, 
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
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Scholarship & Fee Plan</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.name} • Custom fee & discount</p>
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

        {/* Island 3: Floating White Form Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          <form id="fee-plan-form" onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Standard Fee ($)</label>
                <input type="number" className="form-input" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Scholarship (%)</label>
                <input type="number" min="0" max="100" className="form-input" value={discount} onChange={e => setDiscount(e.target.value)} required />
              </div>
            </div>

            {/* Final Calculated Fee Card */}
            <div style={{ background: '#F0FDF4', padding: 14, borderRadius: 12, border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Net Monthly Tuition Fee:</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#15803D' }}>
                  ${finalFee.toLocaleString()} / mo
                </div>
              </div>
              {Number(discount) > 0 && (
                <span className="badge badge-green" style={{ fontWeight: 800 }}>
                  {discount}% SCHOLARSHIP
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Monthly Due Date</label>
              <ModernSelect
                value={dueDay}
                onChange={setDueDay}
                options={[
                  { value: '1', label: '1st of every month', icon: <Calendar size={14} color="#475569" /> },
                  { value: '5', label: '5th of every month', icon: <Calendar size={14} color="#475569" /> },
                  { value: '10', label: '10th of every month', icon: <Calendar size={14} color="#475569" /> },
                  { value: '15', label: '15th of every month', icon: <Calendar size={14} color="#475569" /> }
                ]}
                zIndex={1200}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Scholarship Remarks / Notes</label>
              <textarea className="form-input" rows={2} placeholder="e.g. 25% Merit scholarship awarded by Principal..." value={notes} onChange={e => setNotes(e.target.value)} />
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
            form="fee-plan-form"
            disabled={isSubmitting}
            style={{ 
              padding: '10px 24px', 
              borderRadius: 9999, 
              border: 'none', 
              background: isSubmitting ? '#94A3B8' : '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            ✓ Save Custom Fee Plan
          </button>
        </div>
      </div>
    </div>
  );
};
