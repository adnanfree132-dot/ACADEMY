import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Tag, 
  Check, 
  X, 
  AlertCircle
} from 'lucide-react';
import { SalaryHead } from '../types';

interface StaffAdjustmentsManagerProps {
  salaryHeads: SalaryHead[];
  onAddHead: (head: { title: string; type: 'deduction' | 'earning'; is_active?: boolean }) => void;
  onUpdateHead: (head: { id: string; title: string; type: 'deduction' | 'earning'; is_active?: boolean }) => void;
  onToggleHeadStatus: (id: string, is_active: boolean) => void;
  onDeleteHead: (id: string) => void;
}

export const StaffAdjustmentsManager: React.FC<StaffAdjustmentsManagerProps> = ({
  salaryHeads,
  onAddHead,
  onUpdateHead,
  onToggleHeadStatus,
  onDeleteHead
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'deduction' | 'earning'>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHead, setEditingHead] = useState<SalaryHead | null>(null);

  // Modal Form State (Simple Title and Type only)
  const [modalType, setModalType] = useState<'deduction' | 'earning'>('deduction');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const filteredHeads = useMemo(() => {
    return salaryHeads.filter(h => {
      if (filterType !== 'all' && h.type !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return h.title.toLowerCase().includes(q);
    });
  }, [salaryHeads, filterType, searchQuery]);

  const handleOpenAdd = () => {
    setEditingHead(null);
    setModalType('deduction');
    setModalTitle('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (head: SalaryHead) => {
    setEditingHead(head);
    setModalType(head.type);
    setModalTitle(head.title);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setErrorMsg('Please enter a head title.');
      return;
    }

    if (editingHead?.id) {
      onUpdateHead({
        id: editingHead.id,
        title: modalTitle.trim(),
        type: modalType,
        is_active: editingHead.is_active !== false
      });
    } else {
      onAddHead({
        title: modalTitle.trim(),
        type: modalType,
        is_active: true
      });
    }
    setIsModalOpen(false);
  };

  const isDeduction = modalType === 'deduction';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '18px 20px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Tag size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Deductions & Earnings Heads
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>
              Simple deduction and earning heads with enable/disable control. Amount and count are added in Monthly Payroll.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            height: 38,
            padding: '0 16px',
            borderRadius: 10,
            border: 'none',
            background: '#0F172A',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Plus size={15} />
          <span>Add Head</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '12px 16px',
          border: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: filterType === 'all' ? '#0F172A' : '#F1F5F9',
              color: filterType === 'all' ? '#FFFFFF' : '#475569',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            All ({salaryHeads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deduction')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: filterType === 'deduction' ? '#DC2626' : '#F1F5F9',
              color: filterType === 'deduction' ? '#FFFFFF' : '#475569',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Deductions ({salaryHeads.filter(h => h.type === 'deduction').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('earning')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: filterType === 'earning' ? '#16A34A' : '#F1F5F9',
              color: filterType === 'earning' ? '#FFFFFF' : '#475569',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Earnings ({salaryHeads.filter(h => h.type === 'earning').length})
          </button>
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search heads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              padding: '6px 12px 6px 30px',
              fontSize: 12,
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Salary Heads Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Head Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHeads.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Tag size={28} color="#94A3B8" />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        No salary heads configured
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', maxWidth: 360 }}>
                        Click "Add Head" to create a deduction or earning head (e.g. Late Arrival, Advance Salary, Overtime, Bonus).
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHeads.map(head => {
                  const isDed = head.type === 'deduction';
                  const isActive = head.is_active !== false;

                  return (
                    <tr
                      key={head.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease',
                        opacity: isActive ? 1 : 0.65
                      }}
                    >
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                          {head.title}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            background: isDed ? '#FEF2F2' : '#F0FDF4',
                            color: isDed ? '#DC2626' : '#16A34A',
                            border: isDed ? '1px solid #FECACA' : '1px solid #BBF7D0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {isDed ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          <span>{isDed ? 'Deduction' : 'Earning'}</span>
                        </span>
                      </td>

                      {/* Enable / Disable Toggle Switch */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          onClick={() => onToggleHeadStatus(head.id, !isActive)}
                          style={{
                            position: 'relative',
                            width: 38,
                            height: 20,
                            borderRadius: 9999,
                            background: isActive ? '#10B981' : '#CBD5E1',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            padding: 0,
                            outline: 'none',
                            display: 'inline-block'
                          }}
                          title={isActive ? 'Enabled - Click to disable' : 'Disabled - Click to enable'}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: isActive ? 20 : 2,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)',
                              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        </button>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(head)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              transition: 'all 0.15s ease'
                            }}
                            title="Edit this head"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove head "${head.title}"?`)) {
                                onDeleteHead(head.id);
                              }
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11.5,
                              fontWeight: 700,
                              transition: 'all 0.15s ease'
                            }}
                            title="Delete this head"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Head Modal (4-Island Floating Architecture) */}
      {isModalOpen && (
        <div
          className="floating-island-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
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
              maxWidth: 480
            }}
          >
            {/* Island 1: Header */}
            <div
              style={{
                background: '#0F172A',
                borderRadius: 16,
                padding: '16px 20px',
                color: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isDeduction ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                    border: isDeduction ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isDeduction ? (
                    <TrendingDown size={20} color="#EF4444" />
                  ) : (
                    <TrendingUp size={20} color="#10B981" />
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    {editingHead ? 'Edit Salary Head' : isDeduction ? 'Add Deduction Head' : 'Add Earning Head'}
                  </h2>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Configure head title and category
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  width: 32,
                  height: 32,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Type Switcher */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6
              }}
            >
              <button
                type="button"
                onClick={() => setModalType('deduction')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isDeduction ? '#DC2626' : 'transparent',
                  color: isDeduction ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <TrendingDown size={14} />
                <span>Deduction Head</span>
              </button>

              <button
                type="button"
                onClick={() => setModalType('earning')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: !isDeduction ? '#16A34A' : 'transparent',
                  color: !isDeduction ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <TrendingUp size={14} />
                <span>Earning Head</span>
              </button>
            </div>

            {/* Island 3: Form Card (Clean title input and status toggle only) */}
            <form
              onSubmit={handleSaveModal}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '20px 22px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {errorMsg && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '8px 12px', color: '#991B1B', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={15} color="#EF4444" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  Head Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  placeholder={isDeduction ? 'e.g. Late Arrival, Advance Salary, Damage...' : 'e.g. Overtime, Bonus, Special Duty...'}
                  autoFocus
                  style={{
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '9px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>
            </form>

            {/* Island 4: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 9999,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                style={{
                  padding: '9px 24px',
                  borderRadius: 9999,
                  border: 'none',
                  background: isDeduction ? '#DC2626' : '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Check size={15} />
                <span>{editingHead ? 'Update Head' : 'Save Head'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
