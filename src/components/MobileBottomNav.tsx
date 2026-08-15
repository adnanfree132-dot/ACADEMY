import React from 'react';
import { LayoutDashboard, Users, Layers, Receipt, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  isMoreOpen = false
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'batches', label: 'Classes', icon: Layers },
    { id: 'fees', label: 'Fees', icon: Receipt }
  ];

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
