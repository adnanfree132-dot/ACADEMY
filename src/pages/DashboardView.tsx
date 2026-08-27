import React from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Share2, 
  MoreVertical, 
  UserCheck, 
  Clock, 
  Bell, 
  ChevronRight 
} from 'lucide-react';
import { Student, Teacher, Batch, FeeTransaction, CRMLead } from '../types';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  batches: Batch[];
  transactions: FeeTransaction[];
  leads: CRMLead[];
  onNavigate: (tab: any) => void;
  dashboardStats?: {
    totalStudents: number;
    totalTeachers: number;
    totalBatches: number;
    todayAttendancePct: number;
    totalCollected: number;
    totalPending: number;
    defaultersCount: number;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  students, teachers, batches, transactions, leads, onNavigate, dashboardStats 
}) => {
  // Pure reactive state computations (0ms instant optimistic UI updates on add/edit/delete)
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalBatches = batches.length;
  const todayAttendancePct = dashboardStats?.todayAttendancePct ?? 0;
  
  const totalCollected = transactions.length > 0 
    ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    : (dashboardStats?.totalCollected ?? 0);
    
  const totalPending = students.reduce((sum, s) => sum + (s.dueBalance || 0), 0);
    
  const defaultersCount = students.filter(s => s.isDefaulter || (s.dueBalance || 0) > 0).length;
    
  const totalTarget = totalCollected + totalPending;
  const collectionPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  return (
    <div className="dashboard-page">
      {/* Top Row (3 Cards) */}
      <div className="dashboard-grid-top">
        {/* Card 1: Academy Overview (Dark Hero Card) */}
        <div className="card-dark overview-card">
          <div className="overview-header">
            <div className="overview-title-group">
              <h2>Academy Overview</h2>
              <span className="pill-spring">Spring 2026</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="dark-icon-btn"><Share2 size={14} /></button>
              <button className="dark-icon-btn"><MoreVertical size={14} /></button>
            </div>
          </div>

          <div className="overview-primary-stats">
            <div className="primary-stat-item">
              <div className="stat-icon-wrapper">
                <GraduationCap size={22} />
              </div>
              <div>
                <span className="stat-number">{totalStudents}</span>
                <span className="stat-label">Enrolled Students</span>
              </div>
            </div>

            <div className="primary-stat-item">
              <div className="stat-icon-wrapper">
                <Users size={22} />
              </div>
              <div>
                <span className="stat-number">{totalTeachers}</span>
                <span className="stat-label">Faculty Members</span>
              </div>
            </div>
          </div>

          {/* 3 Inner Sub-Cards */}
          <div className="overview-subcards">
            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}>
                <Calendar size={16} color="#475569" />
              </div>
              <div className="subcard-val">{todayAttendancePct}%</div>
              <div className="subcard-lbl">Today Attendance</div>
            </div>

            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}>
                <GraduationCap size={16} color="#475569" />
              </div>
              <div className="subcard-val">{totalBatches}</div>
              <div className="subcard-lbl">Active Batches / Sections</div>
            </div>

            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}>
                <AlertTriangle size={16} color="#475569" />
              </div>
              <div className="subcard-val">${totalPending.toLocaleString()}</div>
              <div className="subcard-lbl">Pending Dues</div>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Attendance Trend */}
        <div className="card trend-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Weekly Attendance Trend</h3>
              <p className="card-subtitle">Grade 9–12 Average</p>
            </div>
            <div className="dollar-badge-icon">
              <TrendingUp size={18} color="#475569" />
            </div>
          </div>

          <div className="trend-legend">
            <span className="legend-item"><span className="dot dot-dark"></span> Grade 10 & 12</span>
            <span className="legend-item"><span className="dot dot-gray"></span> Grade 9 & 11</span>
          </div>

          <div className="empty-state-container" style={{ height: 180 }}>
            <p className="empty-state-text">Attendance data chart will populate here.</p>
          </div>
        </div>

        {/* Card 3: Fee Collections */}
        <div className="card collections-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Fee Collections</h3>
              <p className="card-subtitle">August 2026 Session</p>
            </div>
            <div className="dollar-badge-icon">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="collections-main-stat">
            <span className="big-amount">${totalCollected.toLocaleString()}</span>
          </div>

          <div className="target-progress-group">
            <div className="target-flex">
              <span>Collection Target (${totalTarget.toLocaleString()})</span>
              <span>{collectionPct}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${collectionPct}%` }}></div>
            </div>
          </div>

          <div className="financial-columns">
            <div className="fin-col">
              <span className="fin-lbl">Collected</span>
              <span className="fin-val text-black">${(totalCollected / 1000).toFixed(1)}k</span>
            </div>
            <div className="fin-col">
              <span className="fin-lbl">Pending</span>
              <span className="fin-val text-amber">${(totalPending / 1000).toFixed(1)}k</span>
            </div>
            <div className="fin-col">
              <span className="fin-lbl">Defaulters</span>
              <span className="fin-val text-red">{defaultersCount} Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row Grid (2 Cards) */}
      <div className="dashboard-grid-mid">
        {/* Card 4: Recent Admissions CRM */}
        <div className="card crm-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div className="dollar-badge-icon">
              <UserCheck size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Recent Admissions CRM</h3>
              <p className="card-subtitle">Student Intake Funnel</p>
            </div>
            <div className="badge badge-gray">{leads.length} Active Leads</div>
          </div>

          {leads.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Grade Interest</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 500 }}>{lead.studentName}</td>
                      <td>{lead.gradeInterest}</td>
                      <td>
                        <span className={`status-badge ${lead.status === 'New' ? 'badge-amber' : lead.status === 'Converted' ? 'badge-green' : 'badge-gray'}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">No recent admissions.</p>
            </div>
          )}

          <button className="btn-primary w-full" onClick={() => onNavigate('crm')} style={{ marginTop: 16, justifyContent: 'center' }}>
            <span>Open Admissions CRM</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Card 5: Today's Class Schedule */}
        <div className="card schedule-card">
          <div className="card-header-flex">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#475569" />
              <h3 className="card-title">Today's Class Schedule</h3>
            </div>
            <span className="badge badge-green">Live</span>
          </div>

          {batches.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: 200, overflowY: 'auto', marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Batch</th>
                    <th>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.slice(0, 5).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.timing}</td>
                      <td>{b.name}</td>
                      <td>{b.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">No classes scheduled for today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Notice / Announcement Banner */}
      <div className="notice-banner-card">
        <div className="notice-left">
          <div className="notice-icon-circle">
            <Bell size={18} color="#FFFFFF" />
          </div>
          <div>
            <h4 className="notice-title">Stay Updated</h4>
            <p className="notice-sub">Check out the latest academy announcements.</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('announcements')}>
          View Announcements
        </button>
      </div>
    </div>
  );
};
