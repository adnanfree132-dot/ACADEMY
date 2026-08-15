import React from 'react';
import { 
  X, 
  UserSquare2, 
  CheckSquare, 
  Award, 
  BookOpen, 
  Calendar, 
  UserPlus, 
  Megaphone, 
  Settings, 
  LogOut,
  ChevronRight,
  MessageCircle
} from 'lucide-react';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  activeView: string;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  activeView,
  onClose,
  onNavigate,
  onLogout,
  userName = 'Dilan',
  userRole = 'Administrator'
}) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'teachers', label: 'Teachers & Staff', icon: UserSquare2, color: '#3B82F6' },
        { id: 'attendance', label: 'Attendance Portal', icon: CheckSquare, color: '#10B981' },
      ]
    },
    {
      title: 'ACADEMICS',
      items: [
        { id: 'exams', label: 'Exams & Results', icon: Award, color: '#F59E0B' },
        { id: 'homework', label: 'Homework & Study', icon: BookOpen, color: '#8B5CF6' },
        { id: 'timetable', label: 'Timetable Schedules', icon: Calendar, color: '#EC4899' },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'crm', label: 'Inquiries & CRM', icon: UserPlus, color: '#06B6D4' },
        { id: 'announcements', label: 'Announcements & SMS', icon: Megaphone, color: '#14B8A6' },
        { id: 'whatsapp', label: 'WhatsApp Center', icon: MessageCircle, color: '#22C55E' },
        { id: 'settings', label: 'Academy Settings', icon: Settings, color: '#64748B' },
      ]
    }
  ];

  return (
    <>
      {/* Dimmed Blurred Backdrop */}
      <div className="mobile-drawer-backdrop" onClick={onClose} />

      {/* Slide-in Sheet */}
      <div className="mobile-drawer-sheet">
        {/* Drawer Header */}
        <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
              {userName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{userName}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>{userRole}</div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: '#FFFFFF', 
              width: 30, 
              height: 30, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer' 
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 6 }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: isActive ? '#F1F5F9' : 'transparent',
                        color: isActive ? '#0F172A' : '#334155',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={15} color="#94A3B8" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer with Logout */}
        {onLogout && (
          <div style={{ padding: 12, borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
};
