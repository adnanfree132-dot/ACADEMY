import React from 'react';
import { LayoutDashboard, Users, Layers, Receipt, Menu, CheckSquare, BookOpen, Building2 } from 'lucide-react';
import { canAccessModule } from '../utils/rbac';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenMore: () => void;
  isMoreOpen?: boolean;
  userRole?: string;
  currentUser?: any;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  isMoreOpen = false,
  userRole = 'admin',
  currentUser
}) => {
  const effectiveUser = currentUser || { role: userRole };
  const role = (effectiveUser.role || userRole || 'admin').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isStudent = role === 'student';

  let tabs: Array<{ id: string; label: string; icon: any }>;

  if (isSuperAdmin) {
    tabs = [
      { id: 'dashboard', label: 'Platform', icon: LayoutDashboard },
      { id: 'academies', label: 'Academies', icon: Building2 }
    ];
  } else if (isStudent) {
    tabs = [
      { id: 'dashboard', label: 'Portal', icon: LayoutDashboard },
      { id: 'attendance', label: 'Attendance', icon: CheckSquare },
      { id: 'homework', label: 'Homework', icon: BookOpen },
      { id: 'fees', label: 'My Fees', icon: Receipt }
    ];
  } else {
    const candidateTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: Users },
      { id: 'batches', label: 'Classes', icon: Layers },
      { id: 'attendance', label: 'Attendance', icon: CheckSquare },
      { id: 'fees', label: 'Fees', icon: Receipt },
      { id: 'homework', label: 'Homework', icon: BookOpen }
    ];
    tabs = candidateTabs.filter(t => t.id === 'dashboard' || canAccessModule(effectiveUser, t.id)).slice(0, 4);
  }

  return (
    <nav className="mobile-bottom-nav mobile-only" aria-label="Mobile Navigation">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id && !isMoreOpen;

        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <div className="mobile-tab-icon-wrap">
              <Icon size={17} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span className="mobile-tab-label">{tab.label}</span>
          </button>
        );
      })}

      {/* More / All Modules Tab */}
      <button
        type="button"
        className={`mobile-tab-item ${isMoreOpen ? 'active' : ''}`}
        onClick={onOpenMore}
      >
        <div className="mobile-tab-icon-wrap">
          <Menu size={17} strokeWidth={isMoreOpen ? 2.4 : 1.8} />
        </div>
        <span className="mobile-tab-label">More</span>
      </button>
    </nav>
  );
};
