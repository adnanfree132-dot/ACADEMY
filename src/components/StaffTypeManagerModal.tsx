import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Shield,
  BookOpen,
  UserCheck,
  Briefcase,
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { ModernSelect } from './ModernSelect';
import { api } from '../api/apiClient';

export interface StaffTypeItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system?: boolean;
  is_system_default?: boolean;
  is_active?: boolean;
}

interface StaffTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffTypes: StaffTypeItem[];
  onStaffTypesChange: (updated: StaffTypeItem[]) => void;
}

export const StaffTypeManagerModal: React.FC<StaffTypeManagerModalProps> = ({
  isOpen,
  onClose,
  staffTypes,
  onStaffTypesChange
}) => {
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [description, setDescription] = useState('');
  const [cloneTemplate, setCloneTemplate] = useState('faculty');
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim() || !typeCode.trim()) {
      setErrorMsg('Please provide both Staff Type Name and 3-Letter Code.');
      return;
    }

    const cleanCode = typeCode.trim().toUpperCase().slice(0, 4);
    const optimisticType: StaffTypeItem = {
      id: `type_${Date.now()}`,
      name: typeName.trim(),
      code: cleanCode,
      description: description.trim(),
      is_system: false,
      is_active: true
    };

    const updatedList = [...staffTypes, optimisticType];
    onStaffTypesChange(updatedList);

    setTypeName('');
    setTypeCode('');
    setDescription('');
    setErrorMsg('');

    try {
      await api.createStaffType({
        name: optimisticType.name,
        code: optimisticType.code,
        description: optimisticType.description,
        slug: optimisticType.name.toLowerCase().replace(/\s+/g, '-'),
        is_system: false
      });
    } catch (err: any) {
      console.error('Failed to create staff type on backend:', err);
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete staff type "${name}"?`)) return;

    const updated = staffTypes.filter(t => t.id !== id);
    onStaffTypesChange(updated);

    try {
      await api.deleteStaffType(id);
    } catch (err: any) {
      console.error('Failed to delete staff type:', err);
    }
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1500,
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
          width: '100%',
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Staff Types & Roles Manager
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Configure department categories, role prefixes, and permission templates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Content & Manager Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '74vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {/* Existing Staff Types List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Active Staff Types ({staffTypes.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {staffTypes.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        background: '#0F172A',
                        color: '#FFF',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontFamily: 'monospace'
                      }}
                    >
                      {t.code}
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: 11.5, color: '#64748B' }}>{t.description}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.is_system || t.is_system_default ? (
                      <span className="badge badge-blue" style={{ fontSize: 10.5, fontWeight: 600 }}>
                        System Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteType(t.id, t.name)}
                        className="table-icon-btn danger"
                        title="Delete custom staff type"
                        style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Custom Staff Type Box */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} color="#2563EB" /> Add Custom Staff Type
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Librarian, IT Officer"
                  value={typeName}
                  onChange={e => setTypeName(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>ID Prefix Code *</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. LIB, ITC"
                  value={typeCode}
                  onChange={e => setTypeCode(e.target.value.toUpperCase())}
                  style={{ height: 38, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className="form-label" style={{ fontSize: 11.5, margin: 0 }}>Base Permission Template</label>
                  <button
                    type="button"
                    onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1px solid #CBD5E1',
                      background: showTemplateInfo ? '#0F172A' : '#FFFFFF',
                      color: showTemplateInfo ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease'
                    }}
                    title="What is Base Permission Template?"
                  >
                    <Info size={10} />
                  </button>
                </div>

                {showTemplateInfo && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: 6,
                      width: 280,
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
                      padding: 12,
                      zIndex: 1350,
                      animation: 'scaleUp 0.15s ease',
                      fontSize: 11.5,
                      color: '#334155',
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Shield size={12} color="#2563EB" /> Permission Templates
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTemplateInfo(false)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p style={{ margin: 0, color: '#64748B' }}>
                      Select a baseline role to clone default access rights (e.g. <strong>Faculty</strong> grants batch teaching & marks entry, <strong>Support Admin</strong> grants front-desk operations, <strong>Domestic</strong> grants zero-trust portal access). You can customize permissions individually per staff member at any time.
                    </p>
                  </div>
                )}

                <ModernSelect
                  value={cloneTemplate}
                  onChange={setCloneTemplate}
                  compact={true}
                  options={[
                    { value: 'faculty', label: 'Clone Faculty (Teaching & Marks)' },
                    { value: 'admin', label: 'Clone Support Admin (Front Desk)' },
                    { value: 'domestic', label: 'Clone Domestic (Zero-Trust)' }
                  ]}
                  zIndex={1200}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Library & Learning Resource Center"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateType}
              style={{
                alignSelf: 'flex-end',
                marginTop: 4,
                borderRadius: 10,
                height: 38,
                padding: '0 18px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
              }}
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>

        {/* Island 3: Floating Action Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            <Check size={15} /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default StaffTypeManagerModal;
