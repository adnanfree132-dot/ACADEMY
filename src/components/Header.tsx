import React, { useState } from 'react';
import { Plus, Search, Bell, X, User, Settings, LogOut } from 'lucide-react';
import { Student } from '../types';

interface HeaderProps {
  userName?: string;
  onOpenCreateModal?: () => void;
  onOpenAction?: (type: 'student' | 'fee' | 'teacher' | 'batch') => void;
  onSearch: (query: string) => void;
  onLogout?: () => void;
  students?: Student[];
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Dilan',
  onOpenCreateModal,
  onOpenAction,
  onSearch,
  onLogout,
  students = []
}) => {
  const [query, setQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
    setShowSearchDropdown(val.length > 0);
  };

  const filteredSearch = students.filter(s =>
    (s.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.regNo || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const triggerAction = (type: 'student' | 'fee' | 'teacher' | 'batch') => {
    setShowCreateDropdown(false);
    if (onOpenAction) {
      onOpenAction(type);
    } else if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  return (
    <header className="top-header desktop-only">
      <div className="header-left">
        <h1 className="title-greeting">Hi, {userName}!</h1>
      </div>

      <div className="header-right">
        {/* Enhanced Search Bar with Auto-Dismiss Dropdown */}
        <div style={{ position: 'relative' }}>
          <div className="header-search-input-box">
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Quick search students, fees, batches..."
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            />
            {query ? (
              <button 
                onClick={() => { setQuery(''); setShowSearchDropdown(false); onSearch(''); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} color="#94A3B8" />
              </button>
            ) : (
              <span className="shortcut-badge">⌘K</span>
            )}
          </div>

          {/* Quick Search Suggestions Dropdown */}
          {showSearchDropdown && (
            <div className="search-dropdown-menu" onMouseDown={(e) => e.preventDefault()}>
              <div className="dropdown-section-title">DYNAMIC MATCHES</div>
              {filteredSearch.length > 0 ? (
                filteredSearch.map(s => (
                  <div key={s.id} className="dropdown-item" onClick={() => { setQuery(s.name); onSearch(s.name); setShowSearchDropdown(false); }}>
                    <span className="dropdown-item-title">{s.name}</span>
                    <span className={`badge ${s.isDefaulter ? 'badge-red' : 'badge-green'}`}>
                      {s.regNo} • {s.gradeBatch}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, fontSize: 12, color: '#94A3B8' }}>No records found for "{query}"</div>
              )}
            </div>
          )}
        </div>

        {/* + Create Action Dropdown Popover */}
        <div style={{ position: 'relative' }}>
          <button className="btn-primary" onClick={() => setShowCreateDropdown(!showCreateDropdown)}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Create</span>
          </button>

          {showCreateDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.16)',
                padding: 6,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
              onMouseLeave={() => setShowCreateDropdown(false)}
            >
              <button 
                onClick={() => triggerAction('student')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>🎓</span>
                Register Student
              </button>

              <button 
                onClick={() => triggerAction('fee')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>💳</span>
                Record Fee Deposit
              </button>

              <button 
                onClick={() => triggerAction('teacher')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>👨‍🏫</span>

                Add Teacher / Staff
              </button>

              <button 
                onClick={() => triggerAction('batch')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>📚</span>
                Create Class / Batch
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button className="btn-icon bell-btn" title="Notifications" onClick={() => alert('No new notifications')}>
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div style={{ position: 'relative' }}>
          <div className="user-avatar" onClick={() => setShowProfileMenu(!showProfileMenu)} title="User Profile">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
              alt="User Avatar" 
            />
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown-menu" onMouseLeave={() => setShowProfileMenu(false)}>
              <div className="profile-menu-header">
                <strong>Dilan S.</strong>
                <span style={{ fontSize: 11, color: '#64748B' }}>Academy Administrator</span>
              </div>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><User size={15} /> My Profile</button>
              <button className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><Settings size={15} /> Account Settings</button>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item text-red" onClick={() => { setShowProfileMenu(false); if (onLogout) onLogout(); }}><LogOut size={15} /> Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
