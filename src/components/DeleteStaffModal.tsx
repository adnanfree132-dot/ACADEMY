import React, { useState } from 'react';
import { Trash2, X, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

export interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  onConfirmDelete: (staffId: string, mode: 'soft' | 'hard') => void;
}

export const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
  onConfirmDelete
}) => {
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');

  if (!isOpen || !staff) return null;

  const staffName = staff.fullName || staff.name || 'Staff Member';
  const staffIdCode = staff.staffId || staff.staff_id || staff.id;

  const handleConfirm = () => {
    onConfirmDelete(staff.id, deleteMode);
    onClose();
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 1450,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="floating-island-container"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 500
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Island 1: Deep Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <Trash2 size={18} color="#F87171" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                Delete Staff Member
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                {staffName} • <span style={{ fontFamily: 'monospace' }}>{staffIdCode}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              width: 32,
              height: 32,
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#94A3B8';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Floating Choice Selector Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: 18,
            boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Select Deletion Method
          </div>

          {/* Option 1: Soft Archive (Recommended) */}
          <div
            onClick={() => setDeleteMode('soft')}
            style={{
              border: deleteMode === 'soft' ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
              background: deleteMode === 'soft' ? '#F0FDF4' : '#FFFFFF',
              borderRadius: 12,
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: deleteMode === 'soft' ? '5px solid #10B981' : '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                marginTop: 2,
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  Soft Archive / Deactivate
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid #BBF7D0'
                  }}
                >
                  Recommended • Safe
                </span>
              </div>
              <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                Marks staff as <strong>Inactive / Resigned</strong> and removes them from active check-in rosters and future payroll batches. <strong>All past attendance records, check-in history, and prior payslips remain safely preserved.</strong>
              </p>
            </div>
          </div>

          {/* Option 2: Permanent / Hard Delete (Destructive) */}
          <div
            onClick={() => setDeleteMode('hard')}
            style={{
              border: deleteMode === 'hard' ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
              background: deleteMode === 'hard' ? '#FEF2F2' : '#FFFFFF',
              borderRadius: 12,
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start'
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: deleteMode === 'hard' ? '5px solid #EF4444' : '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                marginTop: 2,
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                  Permanent / Hard Delete
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    background: '#FEE2E2',
                    color: '#991B1B',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid #FECACA'
                  }}
                >
                  Destructive • Irreversible
                </span>
              </div>
              <p style={{ margin: 0, marginTop: 4, fontSize: 12, color: '#64748B', lineHeight: 1.45 }}>
                Permanently purges staff member profile, user login, permissions, and attendance logs from the database. <strong>This action cannot be undone and removes all history.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Island 3: Floating Action Pill Row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '10px 18px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1.4,
              background: deleteMode === 'hard' ? '#DC2626' : '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: deleteMode === 'hard' ? '0 4px 14px rgba(220,38,38,0.35)' : '0 4px 14px rgba(15,23,42,0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            {deleteMode === 'hard' ? (
              <>
                <Trash2 size={14} color="#FFFFFF" /> Permanently Delete
              </>
            ) : (
              <>
                <Check size={14} color="#FFFFFF" /> Soft Archive & Deactivate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
