import React from 'react';
import { Bell, Plus, Sparkles } from 'lucide-react';

interface MobileTopBarProps {
  academyName?: string;
  activeViewTitle: string;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenQuickCreate?: () => void;
  userName?: string;
  userRole?: string;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  academyName = 'AcademiaPro',
  activeViewTitle,
  notificationCount = 0,
  onOpenNotifications,
  onOpenQuickCreate,
  userName = 'Admin',
  userRole = 'Admin'
}) => {
  return (
    <header className="mobile-top-bar mobile-only">
      {/* Brand & Active View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div 
          style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: '#0F172A', 
            color: '#10B981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(15,23,42,0.15)'
          }}
        >
          <Sparkles size={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{academyName}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#10B981', letterSpacing: '0.02em' }}>{activeViewTitle}</span>
        </div>
      </div>

      {/* Quick Action, Notifications & User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenQuickCreate && (
          <button
            type="button"
            onClick={onOpenQuickCreate}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Quick Create"
          >
            <Plus size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            cursor: 'pointer'
          }}
          title="Notifications"
        >
          <Bell size={15} />
          {notificationCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF'
              }}
            >
              {notificationCount}
            </span>
          )}
        </button>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#2563EB',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
          }}
          title={`${userName} (${userRole})`}
        >
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  );
};
