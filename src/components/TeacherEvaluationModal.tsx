import React, { useState } from 'react';
import { X, Star, Award, Sparkles } from 'lucide-react';
import { Teacher } from '../types';
import { api } from '../api/apiClient';

interface TeacherEvaluationModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onSaved?: () => void;
}

export const TeacherEvaluationModal: React.FC<TeacherEvaluationModalProps> = ({
  teacher,
  onClose,
  onSaved
}) => {
  const [punctuality, setPunctuality] = useState(5);
  const [teachingQuality, setTeachingQuality] = useState(5);
  const [studentFeedback, setStudentFeedback] = useState(5);
  const [syllabusCompletion, setSyllabusCompletion] = useState(4);
  const [remarks, setRemarks] = useState('');
  const [evaluator, setEvaluator] = useState('Principal Office');

  if (!teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const overallScore = Number(((punctuality + teachingQuality + studentFeedback + syllabusCompletion) / 4).toFixed(1));

    const evalRecord = {
      date: new Date().toISOString().split('T')[0],
      evaluator,
      punctuality,
      teachingQuality,
      studentFeedback,
      syllabusCompletion,
      overallScore,
      remarks: remarks.trim() || 'Demonstrates strong teaching performance and positive classroom engagement.'
    };

    try {
      const key = `evaluations_teacher_${teacher.id}`;
      const settings: any = await api.getSettings().catch(() => ({}));
      const existing = settings && settings[key] ? (typeof settings[key] === 'string' ? JSON.parse(settings[key]) : settings[key]) : [];

      const updatedList = Array.isArray(existing) ? [evalRecord, ...existing] : [evalRecord];

      await api.saveSetting(key, updatedList);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving evaluation');
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
              <Star size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Faculty Performance Evaluation</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{teacher.name} • Institutional Review & Scoring</p>
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
          <form id="teacher-eval-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Card 1: Evaluator */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>EVALUATION CONTEXT</div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Evaluator Name / Authority Role *</label>
                <input className="form-input" value={evaluator} onChange={e => setEvaluator(e.target.value)} required />
              </div>
            </div>

            {/* Card 2: Performance Categories */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>PERFORMANCE DIMENSIONS</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Punctuality & Attendance</span>
                <select className="form-select" style={{ width: 95 }} value={punctuality} onChange={e => setPunctuality(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Teaching Quality & Delivery</span>
                <select className="form-select" style={{ width: 95 }} value={teachingQuality} onChange={e => setTeachingQuality(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Student Feedback</span>
                <select className="form-select" style={{ width: 95 }} value={studentFeedback} onChange={e => setStudentFeedback(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Syllabus Completion</span>
                <select className="form-select" style={{ width: 95 }} value={syllabusCompletion} onChange={e => setSyllabusCompletion(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>
            </div>

            {/* Card 3: Notes */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em' }}>OBSERVATION REMARKS</div>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter detailed evaluation remarks and growth feedback..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
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
            form="teacher-eval-form"
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
            ✓ Save Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};
