import React, { useState, useMemo } from 'react';
import { 
  Tags, 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { PayrollComponentTag } from '../types';
import { PayrollTagModal } from './PayrollTagModal';
import { api } from '../api/apiClient';

interface PayrollTagsManagerProps {
  tags: PayrollComponentTag[];
  onTagsUpdated: (updatedTags: PayrollComponentTag[]) => void;
  onOpenRulesModal?: () => void;
}

export const PayrollTagsManager: React.FC<PayrollTagsManagerProps> = ({
  tags,
  onTagsUpdated,
  onOpenRulesModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'deduction' | 'earning'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<PayrollComponentTag | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      if (!tag.is_active) return false;
      const matchesCategory = categoryFilter === 'all' || tag.type === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        tag.tag_code.toLowerCase().includes(q) ||
        tag.display_label.toLowerCase().includes(q) ||
        (tag.reason_template || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tags, categoryFilter, searchQuery]);

  const handleCreateNewTag = () => {
    setTagToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTag = (tag: PayrollComponentTag) => {
    setTagToEdit(tag);
    setIsModalOpen(true);
  };

  const handleSaveTag = async (savedTag: PayrollComponentTag) => {
    // 0ms Optimistic local state update
    if (tagToEdit) {
      const updated = tags.map(t => t.id === savedTag.id ? savedTag : t);
      onTagsUpdated(updated);
      setActionSuccessMsg(`Tag {{${savedTag.tag_code}}} successfully updated.`);
      api.updatePayrollTag(savedTag.id, savedTag).catch(err => {
        console.error('Failed to update tag backend:', err);
      });
    } else {
      const updated = [...tags, savedTag];
      onTagsUpdated(updated);
      setActionSuccessMsg(`New Tag {{${savedTag.tag_code}}} successfully created.`);
      api.createPayrollTag({
        tag_code: savedTag.tag_code,
        display_label: savedTag.display_label,
        type: savedTag.type,
        calculation_type: savedTag.calculation_type,
        default_value: savedTag.default_value,
        reason_template: savedTag.reason_template || undefined
      }).catch(err => {
        console.error('Failed to create tag backend:', err);
      });
    }
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleDeleteTag = async (id: string, code: string) => {
    // 0ms Optimistic UI
    const updated = tags.filter(t => t.id !== id);
    onTagsUpdated(updated);
    setActionSuccessMsg(`Tag {{${code}}} deactivated.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
    api.deletePayrollTag(id).catch(err => {
      console.error('Failed to delete tag backend:', err);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Bar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: 12,
          background: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F172A'
              }}
            >
              <Tags size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Payroll Component & Tag Registry
            </h2>
            <span 
              style={{ 
                background: '#F1F5F9', 
                color: '#475569', 
                fontSize: 12, 
                fontWeight: 800, 
                padding: '2px 8px', 
                borderRadius: 6 
              }}
            >
              {filteredTags.length} Active
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0' }}>
            Universal WhatsApp-style variables for automated salary deductions, allowances, and itemized payslips
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenRulesModal && (
            <button
              type="button"
              onClick={onOpenRulesModal}
              style={{
                height: 38,
                padding: '0 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Sparkles size={14} color="#2563EB" />
              <span>AI Policy Generator</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCreateNewTag}
            style={{
              height: 38,
              padding: '0 18px',
              borderRadius: 10,
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
            }}
          >
            <Plus size={15} color="#FFFFFF" />
            <span>Add Custom Tag</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div 
          style={{ 
            background: '#F0FDF4', 
            border: '1.5px solid #BBF7D0', 
            borderRadius: 12, 
            padding: '10px 16px', 
            color: '#166534', 
            fontSize: 13, 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}
        >
          <CheckCircle2 size={16} color="#16A34A" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: 12 
        }}
      >
        {/* Category Filter Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            background: '#F1F5F9', 
            padding: 3, 
            borderRadius: 10 
          }}
        >
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            style={{
              borderRadius: 8,
              padding: '6px 14px',
              border: 'none',
              background: categoryFilter === 'all' ? '#0F172A' : 'transparent',
              color: categoryFilter === 'all' ? '#FFFFFF' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Components ({tags.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('deduction')}
            style={{
              borderRadius: 8,
              padding: '6px 14px',
              border: 'none',
              background: categoryFilter === 'deduction' ? '#0F172A' : 'transparent',
              color: categoryFilter === 'deduction' ? '#FFFFFF' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingDown size={13} color={categoryFilter === 'deduction' ? '#F87171' : '#64748B'} />
            <span>Deductions ({tags.filter(t => t.type === 'deduction').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('earning')}
            style={{
              borderRadius: 8,
              padding: '6px 14px',
              border: 'none',
              background: categoryFilter === 'earning' ? '#0F172A' : 'transparent',
              color: categoryFilter === 'earning' ? '#FFFFFF' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={13} color={categoryFilter === 'earning' ? '#4ADE80' : '#64748B'} />
            <span>Earnings ({tags.filter(t => t.type === 'earning').length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search 
            size={15} 
            color="#64748B" 
            style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} 
          />
          <input
            type="text"
            placeholder="Search tags or labels..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              padding: '8px 12px 8px 34px',
              fontSize: 13,
              fontWeight: 500,
              color: '#0F172A',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Tags Data Grid */}
      <div 
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          borderRadius: 14, 
          border: '1.5px solid #E2E8F0', 
          background: '#FFFFFF', 
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)' 
        }}
      >
        <table className="data-table" style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>Tag Variable</th>
              <th style={{ whiteSpace: 'nowrap' }}>Payslip Display Title</th>
              <th style={{ whiteSpace: 'nowrap' }}>Classification</th>
              <th style={{ whiteSpace: 'nowrap' }}>Calculation Formula</th>
              <th style={{ whiteSpace: 'nowrap' }}>Default Value</th>
              <th style={{ whiteSpace: 'nowrap' }}>Reason / Audit Note</th>
              <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => {
                const isDeduction = tag.type === 'deduction';
                return (
                  <tr key={tag.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: 12,
                          background: '#F1F5F9',
                          color: '#0F172A',
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid #E2E8F0',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {`{{${tag.tag_code}}}`}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0F172A', fontSize: 13 }}>
                        {tag.display_label}
                      </strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          background: isDeduction ? '#FEE2E2' : '#DCFCE7',
                          color: isDeduction ? '#991B1B' : '#166534',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {isDeduction ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {isDeduction ? 'Deduction' : 'Earning'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                        {tag.calculation_type === 'percentage_of_base' 
                          ? '% of Base Pay' 
                          : tag.calculation_type === 'fixed_amount' 
                          ? 'Fixed Amount' 
                          : 'Per Day'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: 13, color: isDeduction ? '#DC2626' : '#16A34A' }}>
                        {tag.calculation_type === 'percentage_of_base' 
                          ? `${tag.default_value}%` 
                          : `PKR ${tag.default_value.toLocaleString()}`}
                      </strong>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {tag.reason_template || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="table-icon-btn"
                          onClick={() => handleEditTag(tag)}
                          title="Edit Tag"
                          style={{ width: 30, height: 30 }}
                        >
                          <Edit size={13} color="#475569" />
                        </button>
                        <button
                          type="button"
                          className="table-icon-btn danger"
                          onClick={() => handleDeleteTag(tag.id, tag.tag_code)}
                          title="Deactivate Tag"
                          style={{ width: 30, height: 30 }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                  <Tags size={28} color="#CBD5E1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>No Payroll Tags Found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {searchQuery ? 'No tags match your search filter.' : 'Click "Add Custom Tag" to configure your first institutional salary component.'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      <PayrollTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTag}
        tagToEdit={tagToEdit}
      />
    </div>
  );
};

export default PayrollTagsManager;
