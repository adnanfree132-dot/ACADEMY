import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Edit3,
  EyeOff,
  X,
  Check,
  Globe,
  Lock,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Clock,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Settings
} from 'lucide-react';
import { api } from '../api/apiClient';

interface StaffPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: {
    id: string;
    staffId: string;
    fullName?: string;
    name?: string;
    role?: string;
    designation?: string;
  } | null;
  initialPermissions?: Record<string, { level: 'hidden' | 'view_only' | 'editable'; isGlobal?: boolean }>;
  onSave?: (staffId: string, updatedPermissions: any) => void;
}

const MODULES_CONFIG = [
  { key: 'students', label: 'Students Directory', icon: GraduationCap, defaultLevel: 'view_only' },
  { key: 'teachers', label: 'Staff & Faculty Members', icon: Users, defaultLevel: 'hidden' },
  { key: 'batches', label: 'Academic Batches & Classes', icon: BookOpen, defaultLevel: 'view_only' },
  { key: 'subjects', label: 'Course Curriculum & Subjects', icon: FileSpreadsheet, defaultLevel: 'view_only' },
  { key: 'attendance', label: 'Daily Attendance Register', icon: Calendar, defaultLevel: 'editable' },
  { key: 'fees', label: 'Fee Management & Invoices', icon: CreditCard, defaultLevel: 'hidden' },
  { key: 'exams', label: 'Exams, Tests & Marksheets', icon: FileText, defaultLevel: 'editable' },
  { key: 'homework', label: 'Homework & Study Materials', icon: BookOpen, defaultLevel: 'editable' },
  { key: 'timetable', label: 'Timetable & Class Schedules', icon: Clock, defaultLevel: 'view_only' },
  { key: 'crm', label: 'CRM & Admission Inquiries', icon: HelpCircle, defaultLevel: 'hidden' },
  { key: 'announcements', label: 'Campus Announcements', icon: Megaphone, defaultLevel: 'view_only' },
  { key: 'whatsapp', label: 'WhatsApp Messaging Center', icon: MessageSquare, defaultLevel: 'hidden' },
  { key: 'settings', label: 'Institutional Settings', icon: Settings, defaultLevel: 'hidden' }
];

export const StaffPermissionsModal: React.FC<StaffPermissionsModalProps> = ({
  isOpen,
  onClose,
  staffMember,
  initialPermissions,
  onSave
}) => {
  const [permissions, setPermissions] = useState<Record<string, { level: 'hidden' | 'view_only' | 'editable'; isGlobal?: boolean }>>(() => {
    const map: Record<string, { level: 'hidden' | 'view_only' | 'editable'; isGlobal?: boolean }> = {};
    MODULES_CONFIG.forEach(m => {
      map[m.key] = initialPermissions?.[m.key] || {
        level: (m.defaultLevel as any) || 'hidden',
        isGlobal: false
      };
    });
    return map;
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !staffMember) return null;

  const staffName = staffMember.fullName || staffMember.name || 'Staff Member';

  const setModuleLevel = (moduleKey: string, level: 'hidden' | 'view_only' | 'editable') => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        level
      }
    }));
  };

  const toggleGlobalScope = (moduleKey: string) => {
    setPermissions(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        isGlobal: !prev[moduleKey]?.isGlobal
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = Object.entries(permissions).map(([module_key, config]) => ({
      module_key,
      access_level: config.level,
      is_global_scope: config.isGlobal || false
    }));

    if (onSave) {
      onSave(staffMember.id, permissions);
    }
    onClose();

    try {
      await api.updateStaffPermissions(staffMember.id, payload);
    } catch (err: any) {
      console.error('Failed to update permissions on backend:', err);
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
          maxWidth: 680,
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
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Granular Permissions Matrix
                </h3>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#E2E8F0',
                    fontFamily: 'monospace'
                  }}
                >
                  {staffMember.staffId}
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Configure module-level access for {staffName} ({staffMember.designation || staffMember.role || 'Staff'})
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

        {/* Island 2: Notice Card */}
        <div
          style={{
            background: '#EFF6FF',
            borderRadius: 12,
            border: '1px solid #BFDBFE',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#1E40AF',
            fontSize: 12
          }}
        >
          <Lock size={15} color="#2563EB" />
          <span>
            Faculty data queries are strictly scoped to their assigned batches. Enable <strong>Global Scope</strong> only if this staff member requires institution-wide visibility.
          </span>
        </div>

        {/* Island 3: Scrollable Permissions Matrix Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '18px 20px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '65vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {MODULES_CONFIG.map(mod => {
            const Icon = mod.icon;
            const current = permissions[mod.key] || { level: 'hidden', isGlobal: false };

            return (
              <div
                key={mod.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: current.level === 'hidden' ? '#FAFAFA' : '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: current.level === 'hidden' ? '#F1F5F9' : '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: current.level === 'hidden' ? '#94A3B8' : '#2563EB'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: current.level === 'hidden' ? '#64748B' : '#0F172A' }}>
                      {mod.label}
                    </div>
                  </div>
                </div>

                {/* 3-Tier Segmented Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      background: '#F1F5F9',
                      padding: 3,
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      gap: 2
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setModuleLevel(mod.key, 'hidden')}
                      style={{
                        borderRadius: 6,
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: current.level === 'hidden' ? '#64748B' : 'transparent',
                        color: current.level === 'hidden' ? '#FFFFFF' : '#64748B',
                        boxShadow: current.level === 'hidden' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <EyeOff size={12} /> Hidden
                    </button>

                    <button
                      type="button"
                      onClick={() => setModuleLevel(mod.key, 'view_only')}
                      style={{
                        borderRadius: 6,
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: current.level === 'view_only' ? '#2563EB' : 'transparent',
                        color: current.level === 'view_only' ? '#FFFFFF' : '#64748B',
                        boxShadow: current.level === 'view_only' ? '0 1px 3px rgba(37,99,235,0.2)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Eye size={12} /> View Only
                    </button>

                    <button
                      type="button"
                      onClick={() => setModuleLevel(mod.key, 'editable')}
                      style={{
                        borderRadius: 6,
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: current.level === 'editable' ? '#059669' : 'transparent',
                        color: current.level === 'editable' ? '#FFFFFF' : '#64748B',
                        boxShadow: current.level === 'editable' ? '0 1px 3px rgba(5,150,105,0.2)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Edit3 size={12} /> Editable
                    </button>
                  </div>

                  {/* Scoping Toggle */}
                  {current.level !== 'hidden' && (
                    <button
                      type="button"
                      onClick={() => toggleGlobalScope(mod.key)}
                      title={current.isGlobal ? 'Global Institutional Scope Active' : 'Assigned Class Scope Active'}
                      style={{
                        borderRadius: 8,
                        border: current.isGlobal ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                        background: current.isGlobal ? '#EFF6FF' : '#F8FAFC',
                        color: current.isGlobal ? '#1D4ED8' : '#94A3B8',
                        padding: '5px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                    >
                      <Globe size={12} /> {current.isGlobal ? 'Global Scope' : 'Class Scope'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Island 4: Floating Action Pill Row */}
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
              padding: '0 20px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
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
            <Check size={15} /> Save Permissions Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
export default StaffPermissionsModal;
