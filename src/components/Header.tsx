import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Bell, X, Settings, LogOut, UserPlus, CreditCard, UserSquare2, GraduationCap, Users, BookOpen } from 'lucide-react';
import { Student, Teacher, Batch, TabType } from '../types';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onOpenCreateModal?: () => void;
  onOpenAction?: (type: 'student' | 'fee' | 'teacher' | 'batch') => void;
  onSearch: (query: string) => void;
  onLogout?: () => void;
  students?: Student[];
  teachers?: Teacher[];
  batches?: Batch[];
  onNavigate?: (tab: TabType, query?: string) => void;
  notifications?: Array<{ id: string; title: string; body?: string; is_read?: boolean; created_at?: string; type?: string }>;
  unreadCount?: number;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Admin',
  userRole = 'Admin',
  onOpenCreateModal,
  onOpenAction,
  onSearch,
  onLogout,
  students = [],
  teachers = [],
  batches = [],
  onNavigate,
  notifications = [],
  unreadCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) => {
  const [query, setQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const initials = (userName || 'A').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'A';
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (query) setShowSearchDropdown(true);
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowCreateDropdown(false);
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
    setShowSearchDropdown(val.trim().length > 0);
  };

  const q = query.toLowerCase().trim();

  const matchingStudents = q
    ? students.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.regNo || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.gradeBatch || '').toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchingTeachers = q
    ? teachers.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchingBatches = q
    ? batches.filter(b =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.code || '').toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const totalMatches = matchingStudents.length + matchingTeachers.length + matchingBatches.length;

  const handleSelectStudent = (student: Student) => {
    setQuery(student.name);
    setShowSearchDropdown(false);
    if (onNavigate) {
      onNavigate('students', student.name);
    } else {
      onSearch(student.name);
    }
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setQuery(teacher.name);
    setShowSearchDropdown(false);
    if (onNavigate) {
      onNavigate('teachers', teacher.name);
    } else {
      onSearch(teacher.name);
    }
  };

  const handleSelectBatch = (batch: Batch) => {
    setQuery(batch.name);
    setShowSearchDropdown(false);
    if (onNavigate) {
      onNavigate('batches', batch.name);
    } else {
      onSearch(batch.name);
    }
  };

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
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Quick search students, staff, batches..."
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query.trim().length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
            />
            {query ? (
              <button 
                type="button"
                onClick={() => { setQuery(''); setShowSearchDropdown(false); onSearch(''); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} color="#94A3B8" />
              </button>
            ) : (
              <span className="shortcut-badge" onClick={() => searchInputRef.current?.focus()} style={{ cursor: 'pointer' }}>
                ⌘K
              </span>
            )}
          </div>

          {/* Quick Search Multi-Entity Suggestions Dropdown */}
          {showSearchDropdown && (
            <div 
              className="search-dropdown-menu" 
              onMouseDown={(e) => e.preventDefault()}
              style={{
                width: 320,
                maxHeight: 380,
                overflowY: 'auto',
                boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.2)',
                borderRadius: 14,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '8px'
              }}
            >
              {totalMatches > 0 ? (
                <>
                  {/* Students Section */}
                  {matchingStudents.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="dropdown-section-title" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: '#64748B', padding: '4px 8px' }}>
                        <GraduationCap size={12} color="#2563EB" /> STUDENTS
                      </div>
                      {matchingStudents.map(s => (
                        <div
                          key={s.id}
                          className="dropdown-item"
                          onClick={() => handleSelectStudent(s)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{s.gradeBatch} &bull; {s.phone || 'No Phone'}</div>
                          </div>
                          <span className={`badge ${s.isDefaulter ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 10.5, fontWeight: 700 }}>
                            {s.regNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Teachers / Staff Section */}
                  {matchingTeachers.length > 0 && (
                    <div style={{ marginBottom: 8, borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                      <div className="dropdown-section-title" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: '#64748B', padding: '4px 8px' }}>
                        <Users size={12} color="#10B981" /> FACULTY &amp; STAFF
                      </div>
                      {matchingTeachers.map(t => (
                        <div
                          key={t.id}
                          className="dropdown-item"
                          onClick={() => handleSelectTeacher(t)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{t.subject || 'Faculty'} &bull; {t.phone || ''}</div>
                          </div>
                          <span className="badge badge-blue" style={{ fontSize: 10.5, fontWeight: 700 }}>
                            Faculty
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Batches Section */}
                  {matchingBatches.length > 0 && (
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                      <div className="dropdown-section-title" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: '#64748B', padding: '4px 8px' }}>
                        <BookOpen size={12} color="#F59E0B" /> BATCHES &amp; CLASSES
                      </div>
                      {matchingBatches.map(b => (
                        <div
                          key={b.id}
                          className="dropdown-item"
                          onClick={() => handleSelectBatch(b)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{b.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{b.timing || 'Active Class'}</div>
                          </div>
                          <span className="badge badge-gray" style={{ fontSize: 10.5, fontWeight: 700 }}>
                            {b.code || 'Batch'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px 12px', fontSize: 12.5, color: '#94A3B8', textAlign: 'center' }}>
                  No students, staff, or batches match "{query}"
                </div>
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
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={14} color="#475569" />
                </div>
                <span>Register Student</span>
              </button>

              <button 
                onClick={() => triggerAction('fee')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={14} color="#475569" />
                </div>
                <span>Record Fee Deposit</span>
              </button>

              <button 
                onClick={() => triggerAction('teacher')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserSquare2 size={14} color="#475569" />
                </div>
                <span>Add Teacher / Staff</span>
              </button>

              <button 
                onClick={() => triggerAction('batch')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 600, color: '#0F172A', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={14} color="#475569" />
                </div>
                <span>Create Class / Batch</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button className="btn-icon bell-btn" title="Notifications" onClick={() => { setShowNotifications(v => !v); setShowProfileMenu(false); setShowCreateDropdown(false); }}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>
          {showNotifications && (
            <div className="profile-dropdown-menu" style={{ width: 340, right: 0, padding: 0 }} onMouseLeave={() => setShowNotifications(false)}>
              <div className="profile-menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
                <strong>Inbox</strong>
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <button type="button" className="btn-secondary btn-sm" onClick={onMarkAllNotificationsRead}>Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 13, color: '#64748B' }}>No notifications yet. New announcements land here.</div>
                ) : notifications.slice(0, 20).map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.is_read && onMarkNotificationRead) onMarkNotificationRead(n.id);
                      setShowNotifications(false);
                      if (onNavigate) onNavigate(n.type === 'announcement' ? 'announcements' : 'dashboard');
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: n.is_read ? '#FFFFFF' : '#F8FAFC', cursor: 'pointer', borderTop: '1px solid #F1F5F9' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: n.is_read ? 600 : 800, color: '#0F172A' }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{n.body.slice(0, 110)}</div>}
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="user-avatar" onClick={() => setShowProfileMenu(!showProfileMenu)} title="User Profile" style={{ background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
            {initials}
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown-menu" onMouseLeave={() => setShowProfileMenu(false)}>
              <div className="profile-menu-header">
                <strong>{userName}</strong>
                <span style={{ fontSize: 11, color: '#64748B' }}>{userRole}</span>
              </div>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item" onClick={() => { setShowProfileMenu(false); if (onNavigate) onNavigate('settings'); }}><Settings size={15} /> Academy settings</button>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item text-red" onClick={() => { setShowProfileMenu(false); if (onLogout) onLogout(); }}><LogOut size={15} /> Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
