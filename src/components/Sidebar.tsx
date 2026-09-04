import React from 'react';
import { TabType } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BookOpen, 
  CheckSquare, 
  CreditCard, 
  Award, 
  FileText, 
  Calendar, 
  UserPlus, 
  Bell, 
  MessageSquare,
  Settings, 
  LogOut,
  Sparkles,
  ChevronRight,
  DollarSign,
  UserCheck,
  Receipt
} from 'lucide-react';
import { getUnitCombinedLabel } from '../utils/academyModeHelper';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLogout }) => {
  const isTabActive = (tab: TabType) => currentTab === tab;

  const getNavItemClass = (tab: TabType) => {
    if (isTabActive(tab)) {
      return 'sidebar-item sidebar-item-active';
    }
    return 'sidebar-item';
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Sparkles size={18} color="#FFFFFF" />
        </div>
        <div className="brand-text">
          <span className="brand-title">AcademiaPro</span>
          <span className="brand-subtitle">Management OS</span>
        </div>
      </div>

      <div className="sidebar-nav-scroll">
        {/* CORE OPERATIONS */}
        <div className="sidebar-group">
          <div className="section-heading-prominent core-heading">
            <span className="heading-accent-bar core-bar"></span>
            <span>CORE OPERATIONS</span>
          </div>
          <div className="nav-list">
            <button 
              className={getNavItemClass('dashboard')} 
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="nav-left">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
              {isTabActive('dashboard') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('students')} 
              onClick={() => onSelectTab('students')}
            >
              <div className="nav-left">
                <Users size={18} />
                <span>Students</span>
              </div>
              {isTabActive('students') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('teachers')} 
              onClick={() => onSelectTab('teachers')}
            >
              <div className="nav-left">
                <UserSquare2 size={18} />
                <span>Teachers & Staff</span>
              </div>
              {isTabActive('teachers') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('batches')} 
              onClick={() => onSelectTab('batches')}
            >
              <div className="nav-left">
                <BookOpen size={18} />
                <span>{getUnitCombinedLabel()}</span>
              </div>
              {isTabActive('batches') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('subjects')} 
              onClick={() => onSelectTab('subjects')}
            >
              <div className="nav-left">
                <BookOpen size={18} />
                <span>Subjects</span>
              </div>
              {isTabActive('subjects') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('attendance')} 
              onClick={() => onSelectTab('attendance')}
            >
              <div className="nav-left">
                <CheckSquare size={18} />
                <span>Attendance Portal</span>
              </div>
              {isTabActive('attendance') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('staff_attendance')} 
              onClick={() => onSelectTab('staff_attendance')}
            >
              <div className="nav-left">
                <UserCheck size={18} />
                <span>Staff Attendance</span>
              </div>
              {isTabActive('staff_attendance') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('staff_payroll')} 
              onClick={() => onSelectTab('staff_payroll')}
            >
              <div className="nav-left">
                <DollarSign size={18} />
                <span>Staff Payroll</span>
              </div>
              {isTabActive('staff_payroll') && <ChevronRight size={16} className="chevron" />}
            </button>
          </div>
        </div>

        {/* ACADEMICS */}
        <div className="sidebar-group">
          <div className="section-heading-prominent academics-heading">
            <span className="heading-accent-bar academics-bar"></span>
            <span>ACADEMICS</span>
          </div>
          <div className="nav-list">
            <button 
              className={getNavItemClass('fees')} 
              onClick={() => onSelectTab('fees')}
            >
              <div className="nav-left">
                <CreditCard size={18} />
                <span>Fee Management</span>
              </div>
              {isTabActive('fees') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('expenses')} 
              onClick={() => onSelectTab('expenses')}
            >
              <div className="nav-left">
                <Receipt size={18} />
                <span>Expenses</span>
              </div>
              {isTabActive('expenses') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('exams')} 
              onClick={() => onSelectTab('exams')}
            >
              <div className="nav-left">
                <Award size={18} />
                <span>Exams & Results</span>
              </div>
              {isTabActive('exams') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('homework')} 
              onClick={() => onSelectTab('homework')}
            >
              <div className="nav-left">
                <FileText size={18} />
                <span>Homework & Study</span>
              </div>
              {isTabActive('homework') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('leaves')} 
              onClick={() => onSelectTab('leaves')}
            >
              <div className="nav-left">
                <Calendar size={18} />
                <span>Student Leave</span>
              </div>
              {isTabActive('leaves') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('conduct')} 
              onClick={() => onSelectTab('conduct')}
            >
              <div className="nav-left">
                <UserCheck size={18} />
                <span>Conduct</span>
              </div>
              {isTabActive('conduct') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('timetable')} 
              onClick={() => onSelectTab('timetable')}
            >
              <div className="nav-left">
                <Calendar size={18} />
                <span>Timetable</span>
              </div>
              {isTabActive('timetable') && <ChevronRight size={16} className="chevron" />}
            </button>
          </div>
        </div>

        {/* ADMINISTRATION */}
        <div className="sidebar-group">
          <div className="section-heading-prominent admin-heading">
            <span className="heading-accent-bar admin-bar"></span>
            <span>ADMINISTRATION</span>
          </div>
          <div className="nav-list">
            <button 
              className={getNavItemClass('crm')} 
              onClick={() => onSelectTab('crm')}
            >
              <div className="nav-left">
                <UserPlus size={18} />
                <span>Inquiries & CRM</span>
              </div>
              {isTabActive('crm') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('announcements')} 
              onClick={() => onSelectTab('announcements')}
            >
              <div className="nav-left">
                <Bell size={18} />
                <span>Announcements</span>
              </div>
              {isTabActive('announcements') && <ChevronRight size={16} className="chevron" />}
            </button>

            <button 
              className={getNavItemClass('whatsapp')} 
              onClick={() => onSelectTab('whatsapp')}
            >
              <div className="nav-left">
                <MessageSquare size={18} color="#22C55E" />
                <span style={{ fontWeight: 700 }}>WhatsApp Center</span>
              </div>
              {isTabActive('whatsapp') && <ChevronRight size={16} className="chevron" />}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button 
            className={getNavItemClass('settings')} 
            onClick={() => onSelectTab('settings')}
          >
            <div className="nav-left">
              <Settings size={18} />
              <span>Academy Settings</span>
            </div>
          </button>

          <button className="sidebar-item btn-signout" onClick={onLogout}>
            <div className="nav-left">
              <LogOut size={18} />
              <span>Sign Out</span>
            </div>
          </button>

          {/* Floating Badge */}
          <div className="academia-badge">
            <span className="diamond-symbol">◆</span> AcademiaPro OS
          </div>
        </div>
      </div>
    </aside>
  );
};
