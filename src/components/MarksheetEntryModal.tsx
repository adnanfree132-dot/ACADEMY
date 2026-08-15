import React, { useState } from 'react';
import { Student } from '../types';
import { X, Save, CheckCircle2, Award, AlertCircle } from 'lucide-react';
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
      // Find existing mark if available
      const existing = test.testMarks?.find((m: any) => m.student_id === s.id);
      initial[s.id] = {
        marks: existing ? String(existing.marks) : '85',
        remark: existing?.remark || 'Good work'
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

  const handleSaveMarksheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = students.map(s => ({
      studentId: s.id,
      marks: Number(marksState[s.id]?.marks) || 0,
      remark: marksState[s.id]?.remark || ''
    }));

    try {
      await api.saveTestMarks(test.id, payload);
      setSaveMessage('✓ Assessment marksheet saved & published to student records!');
      setTimeout(() => {
        setSaveMessage('');
        onSaved();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error saving marksheet: ${err.message}`);
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
          maxWidth: 680, 
          width: '95%', 
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{test.title} — Marksheet Entry</h3>
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{test.batch?.name || 'All Batches'} • Max: {test.max_marks} • Pass: {test.pass_marks}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#FFFFFF', 
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

        {saveMessage && (
          <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 14, fontSize: 13, fontWeight: 700, border: '1px solid #86EFAC' }}>
            {saveMessage}
          </div>
        )}

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '65vh', 
          overflowY: 'auto' 
        }}>
          <form id="marksheet-form" onSubmit={handleSaveMarksheet}>
            <div className="data-table-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Obtained (Max: {test.max_marks})</th>
                    <th>Auto Result</th>
                    <th>Teacher Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const currentMark = Number(marksState[s.id]?.marks) || 0;
                    const isPassed = currentMark >= (test.pass_marks || 40);

                    return (
                      <tr key={s.id}>
                        <td>
                          <strong style={{ color: '#0F172A' }}>{s.name}</strong>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.regNo}</div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: 100, padding: '6px 10px' }}
                            value={marksState[s.id]?.marks || ''}
                            onChange={e => handleScoreChange(s.id, e.target.value)}
                            max={test.max_marks}
                            min={0}
                            required
                          />
                        </td>
                        <td>
                          {isPassed ? (
                            <span className="badge badge-green"><CheckCircle2 size={12} /> PASS</span>
                          ) : (
                            <span className="badge badge-red"><AlertCircle size={12} /> FAIL</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Feedback..."
                            style={{ fontSize: 12, padding: '6px 10px' }}
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

        {/* Island 4: Floating Right-Aligned Action Buttons */}
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
            form="marksheet-form"
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
            <Save size={15} /> {isSubmitting ? 'Saving Marksheet...' : 'Save & Publish Marksheet'}
          </button>
        </div>
      </div>
    </div>
  );
};
