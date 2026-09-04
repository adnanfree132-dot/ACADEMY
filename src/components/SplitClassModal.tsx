import React, { useState } from 'react';
import { X, GitBranch, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Batch } from '../types';
import { api } from '../api/apiClient';

interface SplitClassModalProps {
  batch: Batch;
  onClose: () => void;
  onSaved?: () => void;
}

export const SplitClassModal: React.FC<SplitClassModalProps> = ({
  batch,
  onClose,
  onSaved
}) => {
  const [newBatchName, setNewBatchName] = useState(`${batch.name} - Sec B`);
  const [newRoom, setNewRoom] = useState(batch.room ? `${batch.room} B` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    if (onSaved) onSaved();
    onClose();

    api.splitBatch(batch.id, {
      newBatchName: newBatchName.trim(),
      newRoom: newRoom.trim()
    }).catch(err => console.error('Error splitting class in background:', err));
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
          maxWidth: 500, 
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
              <GitBranch size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Split Class Section</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{batch.name} • Capacity balancing</p>
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

        {/* Island 2: Floating Info Notice */}
        <div style={{ 
          background: '#F0FDF4', 
          padding: 14, 
          borderRadius: 14, 
          border: '1px solid #BBF7D0', 
          fontSize: 12, 
          color: '#166534', 
          lineHeight: 1.5,
          boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Sparkles size={16} color="#166534" style={{ flexShrink: 0 }} />
          <span><strong>Auto-Redistribution:</strong> 50% of students currently in {batch.name} ({Math.floor((batch.studentsCount || 0) / 2)} students) will be automatically moved to the new section.</span>
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
          <form id="split-class-form" onSubmit={handleSplit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Config Card */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em' }}>NEW SECTION PARAMETERS</div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>New Section / Batch Name *</label>
                <input className="form-input" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>New Room Allocation *</label>
                <input className="form-input" value={newRoom} onChange={e => setNewRoom(e.target.value)} required />
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
            form="split-class-form"
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
            ✓ Execute Class Split
          </button>
        </div>
      </div>
    </div>
  );
};
