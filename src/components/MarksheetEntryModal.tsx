import React, { useState } from 'react';
import { Student } from '../types';
import { X, Save, CheckCircle2, Award, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/apiClient';

interface MarksheetEntryModalProps {
  test: any | null;
  students: Student[];
  onClose: () => void;
  onSaved: () => void;
}

export const MarksheetEntryModal: React.FC<MarksheetEntryModalProps> = ({
  test,
  students,
  onClose,
  onSaved
}) => {
  if (!test) return null;

  const [marksState, setMarksState] = useState<Record<string, { marks: string; remark: string }>>(() => {
    const initial: Record<string, { marks: string; remark: string }> = {};
    students.forEach(s => {
      const existing = test.testMarks?.find((m: any) => m.student_id === s.id);
      initial[s.id] = {
        marks: existing ? String(existing.marks) : '85',
        remark: existing?.remark || 'Good analytical performance'
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleScoreChange = (studentId: string, val: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: val }
    }));
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark: val }
    }));
  };

  const getScoreGrade = (score: number, max: number, pass: number) => {
    if (score < pass) return { grade: 'F', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', pass: false };
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 90) return { grade: 'A+', bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', pass: true };
    if (pct >= 80) return { grade: 'A', bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', pass: true };
    if (pct >= 70) return { grade: 'B+', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', pass: true };
    if (pct >= 60) return { grade: 'B', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', pass: true };
    if (pct >= 50) return { grade: 'C', bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', pass: true };
    return { grade: 'F', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', pass: false };
  };

  const handleSaveMarksheet = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = students.map(s => ({
      studentId: s.id,
      marks: Number(marksState[s.id]?.marks) || 0,
      remark: marksState[s.id]?.remark || ''
    }));

    onSaved();
    onClose();

    api.saveTestMarks(test.id, payload).catch(err => console.error('Error saving marksheet in background:', err));
  };

  return (
    <div 
      className="floating-island-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1300 }}
    >
      <div 
        className="floating-island-container" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 720 }}
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
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Award size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                {test.title} — Marksheet Entry
              </h3>
              <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0 0' }}>
                {test.batch?.name || 'All Cohorts'} &bull; Max Marks: {test.max_marks} &bull; Passing Threshold: {test.pass_marks}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
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
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Scrollable Marksheet Table Card */}
        <div style={{ 
          padding: 18, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '68vh', 
          overflowY: 'auto' 
        }}>
          <form id="marksheet-form" onSubmit={handleSaveMarksheet}>
            <div className="data-table-container">
              <table className="data-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Student Dossier</th>
                    <th style={{ textAlign: 'center', padding: '10px 12px', width: 130 }}>Score (/{test.max_marks})</th>
                    <th style={{ textAlign: 'center', padding: '10px 12px', width: 100 }}>Auto Grade</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Pedagogical Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const currentMark = Number(marksState[s.id]?.marks) || 0;
                    const gradeInfo = getScoreGrade(currentMark, Number(test.max_marks) || 100, Number(test.pass_marks) || 40);

                    return (
                      <tr key={s.id}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{s.regNo}</div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            style={{
                              width: 84,
                              height: 34,
                              borderRadius: 8,
                              border: '1.5px solid #CBD5E1',
                              padding: '0 8px',
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: 'center',
                              color: '#0F172A',
                              background: '#FFFFFF',
                              outline: 'none'
                            }}
                            value={marksState[s.id]?.marks || ''}
                            onChange={e => handleScoreChange(s.id, e.target.value)}
                            max={test.max_marks}
                            min={0}
                            required
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            background: gradeInfo.bg,
                            color: gradeInfo.color,
                            border: `1px solid ${gradeInfo.border}`
                          }}>
                            {gradeInfo.grade} {gradeInfo.pass ? '✓' : '✗'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            placeholder="Teacher feedback note..."
                            style={{
                              width: '100%',
                              height: 34,
                              borderRadius: 8,
                              border: '1px solid #CBD5E1',
                              padding: '0 10px',
                              fontSize: 12,
                              color: '#0F172A',
                              background: '#FFFFFF',
                              outline: 'none'
                            }}
                            value={marksState[s.id]?.remark || ''}
                            onChange={e => handleRemarkChange(s.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </form>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '9px 20px', 
              borderRadius: 9999, 
              border: '1px solid #CBD5E1', 
              background: '#FFFFFF', 
              color: '#334155', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="marksheet-form"
            disabled={isSubmitting}
            style={{ 
              padding: '9px 24px', 
              borderRadius: 9999, 
              border: 'none', 
              background: '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
            }}
          >
            <Save size={14} /> {isSubmitting ? 'Saving Marksheet...' : 'Save & Publish Marksheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default MarksheetEntryModal;
