import React, { useState } from 'react';
import { X, GraduationCap, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Batch, Student } from '../types';
import { api } from '../api/apiClient';
import { ModernSelect } from './ModernSelect';

interface ClassPromotionModalProps {
  batches: Batch[];
  students: Student[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClassPromotionModal: React.FC<ClassPromotionModalProps> = ({
  batches,
  students,
  onClose,
  onSuccess
}) => {
  const [sourceBatchId, setSourceBatchId] = useState(batches[0]?.id || '');
  const [targetBatchId, setTargetBatchId] = useState(batches[1]?.id || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students in source batch
  const sourceBatch = batches.find(b => b.id === sourceBatchId);
  const eligibleStudents = students.filter(s => s.gradeBatch === sourceBatch?.name || s.gradeBatch === sourceBatch?.classLevel);

  const handleSelectAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map(s => s.id));
    }
  };

  const handlePromote = () => {
    if (!sourceBatchId || !targetBatchId || selectedStudentIds.length === 0) return;
    if (sourceBatchId === targetBatchId) {
      alert('Source and Target classes must be different');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();

    api.promoteStudents({
      sourceBatchId,
      targetBatchId,
      studentIds: selectedStudentIds
    }).catch(err => console.error('Error promoting students in background:', err));
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
          maxWidth: 580, 
          width: '92%', 
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
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Class & Batch Promotion</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Bulk advance enrolled students to the next academic level</p>
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

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16, 
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          
          {/* Class Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>From (Current Class)</label>
              <ModernSelect
                value={sourceBatchId}
                onChange={setSourceBatchId}
                options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.classLevel || 'Class'})` }))}
                zIndex={1200}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16 }}>
              <ArrowRight size={20} color="#475569" />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>To (Target Class)</label>
              <ModernSelect
                value={targetBatchId}
                onChange={setTargetBatchId}
                options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.classLevel || 'Class'})` }))}
                zIndex={1200}
              />
            </div>
          </div>

          {/* Student Roster Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                Select Students to Promote ({selectedStudentIds.length} / {eligibleStudents.length})
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ fontSize: 12, color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                {selectedStudentIds.length === eligibleStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {eligibleStudents.length > 0 ? (
                eligibleStudents.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentIds(prev =>
                          isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        border: isSelected ? '1px solid #BFDBFE' : '1px solid #F1F5F9'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>{s.name}</strong>
                        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>{s.regNo}</span>
                      </div>
                      <input type="checkbox" checked={isSelected} readOnly style={{ width: 16, height: 16 }} />
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 12 }}>
                  No active students found in current class.
                </div>
              )}
            </div>
          </div>
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
            type="button"
            onClick={handlePromote}
            disabled={isSubmitting || selectedStudentIds.length === 0}
            style={{ 
              padding: '10px 24px',
              borderRadius: 9999,
              border: 'none',
              background: (isSubmitting || selectedStudentIds.length === 0) ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: (isSubmitting || selectedStudentIds.length === 0) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            <GraduationCap size={15} color="#FFFFFF" /> Execute Promotion ({selectedStudentIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
