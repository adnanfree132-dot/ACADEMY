import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, AlertTriangle, Plus, FileText } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface StudentLeaveModalProps {
  students: Student[];
  onClose: () => void;
  onRefresh?: () => void;
}

export const StudentLeaveModal: React.FC<StudentLeaveModalProps> = ({
  students,
  onClose,
  onRefresh
}) => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const fetchLeaves = () => {
    api.getLeaves().then(res => {
      if (Array.isArray(res)) setLeaves(res);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !fromDate || !toDate || !reason.trim()) return;

    try {
      await api.createLeaveRequest({
        studentId: selectedStudentId,
        fromDate,
        toDate,
        reason: reason.trim()
      });
      setIsAddMode(false);
      setReason('');
      fetchLeaves();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating leave request');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateLeaveStatus(id, status);
      fetchLeaves();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating leave status');
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
          maxWidth: 580, 
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
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Student Leave Portal</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Manage applications, medical notes & approvals</p>
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

        {/* Island 2: Mode Toggle Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(255, 255, 255, 0.9)', 
          backdropFilter: 'blur(8px)',
          padding: '8px 14px', 
          borderRadius: 14, 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {isAddMode ? 'New Application Form' : `Active Applications (${leaves.length})`}
          </h4>
          <button
            type="button"
            onClick={() => setIsAddMode(!isAddMode)}
            style={{ 
              fontSize: 12, 
              padding: '6px 14px',
              borderRadius: 9999,
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={14} /> {isAddMode ? 'View List' : 'New Request'}
          </button>
        </div>

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
          {/* Form Mode */}
          {isAddMode ? (
            <form id="leave-form" onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Select Student</label>
                <select className="form-select" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.regNo} - {s.gradeBatch})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>From Date</label>
                  <input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>To Date</label>
                  <input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Reason for Leave</label>
                <textarea className="form-input" rows={3} placeholder="e.g. Medical emergency / Family event..." value={reason} onChange={e => setReason(e.target.value)} required />
              </div>
            </form>
          ) : (
            /* List Mode */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaves.length > 0 ? (
                leaves.map(l => (
                  <div key={l.id} style={{ background: '#F8FAFC', borderRadius: 12, padding: 14, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>{l.student?.full_name || l.student?.name || 'Student'}</strong>
                        <span className={`badge ${l.status === 'approved' ? 'badge-green' : l.status === 'rejected' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                          {l.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        🗓️ {l.from_date} to {l.to_date} • <em>"{l.reason}"</em>
                      </div>
                    </div>

                    {l.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(l.id, 'approved')}
                          style={{ padding: '6px 12px', borderRadius: 9999, background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(l.id, 'rejected')}
                          style={{ padding: '6px 12px', borderRadius: 9999, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  <FileText size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No leave applications recorded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Island 4: Floating Right-Aligned Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          {isAddMode ? (
            <>
              <button 
                type="button" 
                onClick={() => setIsAddMode(false)}
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
                form="leave-form"
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
                ✓ Submit Leave Request
              </button>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
