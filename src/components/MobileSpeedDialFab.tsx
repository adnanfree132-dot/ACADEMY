import React, { useState } from 'react';
import { Plus, UserPlus, FolderPlus, Receipt } from 'lucide-react';

interface MobileSpeedDialFabProps {
  onAddStudent: () => void;
  onAddBatch: () => void;
  onRecordPayment: () => void;
}

export const MobileSpeedDialFab: React.FC<MobileSpeedDialFabProps> = ({
  onAddStudent,
  onAddBatch,
  onRecordPayment
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mobile-fab-container mobile-only">
      {/* Backdrop to close when tapping outside */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(3px)' }} 
        />
      )}

      {/* Expanded Quick Action Items */}
      {isOpen && (
        <div className="mobile-fab-menu">
          <button
            type="button"
            className="mobile-fab-item"
            onClick={() => {
              setIsOpen(false);
              onAddStudent();
            }}
          >
            <span>+ Add Student</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={15} />
            </div>
          </button>

          <button
            type="button"
            className="mobile-fab-item"
            onClick={() => {
              setIsOpen(false);
              onAddBatch();
            }}
          >
            <span>+ Create Batch</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderPlus size={15} />
            </div>
          </button>

          <button
            type="button"
            className="mobile-fab-item"
            onClick={() => {
              setIsOpen(false);
              onRecordPayment();
            }}
          >
            <span>💵 Record Fee</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={15} />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Floating Action Button */}
      <button
        type="button"
        className={`mobile-fab-main-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions Menu"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
};
