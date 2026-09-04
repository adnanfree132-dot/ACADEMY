import React from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  Bell,
  ChevronRight,
  CreditCard,
  MessageSquare,
  BookOpen,
  UserCheck,
  ClipboardList,
  Pin
} from 'lucide-react';
import { Student, Teacher, Batch, FeeTransaction, CRMLead, TabType } from '../types';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  batches: Batch[];
  transactions: FeeTransaction[];
  leads: CRMLead[];
  onNavigate: (tab: TabType) => void;
  dashboardStats?: {
    totalStudents: number;
    totalTeachers: number;
    totalBatches: number;
    todayAttendancePct: number;
    totalCollected: number;
    totalPending: number;
    defaultersCount: number;
    monthCollected?: number;
    monthExpenses?: number;
    monthPnL?: number;
    monthLabel?: string;
    sessionLabel?: string;
    academyName?: string;
    todayMarked?: number;
    todayPresent?: number;
  };
  dashboardLive?: {
    todaySchedule?: Array<{
      id: string;
      startTime: string;
      endTime: string;
      room?: string;
      batchName: string;
      subjectName?: string;
      teacherName: string;
      substituted?: boolean;
    }>;
    followUpsDue?: Array<{
      id: string;
      name: string;
      phone: string;
      classInterest?: string;
      status: string;
      followUpOn?: string;
    }>;
    unmarkedAttendance?: Array<{ batchId: string; batchName: string; enrolled: number }>;
    testsWithoutMarks?: Array<{
      id: string;
      title: string;
      examDate: string;
      batchName: string;
      subjectName?: string;
      roster: number;
      scored: number;
    }>;
    recentAnnouncements?: Array<{
      id: string;
      title: string;
      body: string;
      pinned?: boolean;
      urgent?: boolean;
      createdAt?: string;
    }>;
    actionItems?: {
      unmarkedCount: number;
      followUpsDue: number;
      testsWithoutMarks: number;
      defaulters: number;
    };
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  batches,
  transactions,
  leads,
  onNavigate,
  dashboardStats,
  dashboardLive
}) => {
  const totalStudents = dashboardStats?.totalStudents ?? students.length;
  const totalTeachers = dashboardStats?.totalTeachers ?? teachers.length;
  const totalBatches = dashboardStats?.totalBatches ?? batches.length;
  const todayAttendancePct = dashboardStats?.todayAttendancePct ?? 0;
  const totalCollected = dashboardStats?.totalCollected
    ?? transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPending = dashboardStats?.totalPending
    ?? students.reduce((sum, s) => sum + (s.dueBalance || 0), 0);
  const defaultersCount = dashboardStats?.defaultersCount
    ?? students.filter(s => s.isDefaulter || (s.dueBalance || 0) > 0).length;
  const monthCollected = dashboardStats?.monthCollected ?? 0;
  const monthExpenses = dashboardStats?.monthExpenses ?? 0;
  const monthPnL = dashboardStats?.monthPnL ?? (monthCollected - monthExpenses);
  const monthLabel = dashboardStats?.monthLabel || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const sessionLabel = dashboardStats?.sessionLabel || '';
  const totalTarget = totalCollected + totalPending;
  const collectionPct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const schedule = dashboardLive?.todaySchedule || [];
  const followUps = dashboardLive?.followUpsDue || [];
  const unmarked = dashboardLive?.unmarkedAttendance || [];
  const tests = dashboardLive?.testsWithoutMarks || [];
  const notices = dashboardLive?.recentAnnouncements || [];
  const actions = dashboardLive?.actionItems || {
    unmarkedCount: unmarked.length,
    followUpsDue: followUps.length,
    testsWithoutMarks: tests.length,
    defaulters: defaultersCount
  };
  const latestNotice = notices[0];

  return (
    <div className="dashboard-page">
      <div className="dashboard-quick-actions">
        <button type="button" className="btn-primary" onClick={() => onNavigate('fees')}>
          <CreditCard size={15} /> Collect fee
        </button>
        <button type="button" className="btn-secondary" onClick={() => onNavigate('crm')}>
          <UserCheck size={15} /> New inquiry
        </button>
        <button type="button" className="btn-secondary" onClick={() => onNavigate('homework')}>
          <BookOpen size={15} /> Homework
        </button>
        <button type="button" className="btn-secondary" onClick={() => onNavigate('announcements')}>
          <Bell size={15} /> Announce
        </button>
      </div>

      <div className="dashboard-grid-top">
        <div className="card-dark overview-card">
          <div className="overview-header">
            <div className="overview-title-group">
              <h2>Academy Overview</h2>
              {sessionLabel ? <span className="pill-spring">{sessionLabel}</span> : null}
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

          <div className="overview-subcards">
            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}><Calendar size={16} color="#475569" /></div>
              <div className="subcard-val">{todayAttendancePct}%</div>
              <div className="subcard-lbl">
                Today Attendance{dashboardStats?.todayMarked ? ` · ${dashboardStats.todayMarked} marked` : ''}
              </div>
            </div>
            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}><GraduationCap size={16} color="#475569" /></div>
              <div className="subcard-val">{totalBatches}</div>
              <div className="subcard-lbl">Active Batches</div>
            </div>
            <div className="subcard-item">
              <div style={{ marginBottom: 4 }}><AlertTriangle size={16} color="#475569" /></div>
              <div className="subcard-val">{formatCurrencyPKR(totalPending)}</div>
              <div className="subcard-lbl">Pending Dues</div>
            </div>
          </div>
        </div>

        <div className="card trend-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Needs attention</h3>
              <p className="card-subtitle">Live queues, not a demo chart</p>
            </div>
            <div className="dollar-badge-icon">
              <ClipboardList size={18} color="#475569" />
            </div>
          </div>
          <div className="dashboard-attention-list">
            <button type="button" className="dashboard-attention-row" onClick={() => onNavigate('attendance')}>
              <span>Unmarked attendance</span>
              <strong>{actions.unmarkedCount} batches</strong>
            </button>
            <button type="button" className="dashboard-attention-row" onClick={() => onNavigate('crm')}>
              <span>CRM follow-ups due</span>
              <strong>{actions.followUpsDue}</strong>
            </button>
            <button type="button" className="dashboard-attention-row" onClick={() => onNavigate('exams')}>
              <span>Tests without marks</span>
              <strong>{actions.testsWithoutMarks}</strong>
            </button>
            <button type="button" className="dashboard-attention-row" onClick={() => onNavigate('fees')}>
              <span>Fee defaulters</span>
              <strong>{actions.defaulters}</strong>
            </button>
          </div>
          {unmarked.length > 0 && (
            <p className="card-subtitle" style={{ marginTop: 10 }}>
              Waiting on: {unmarked.slice(0, 3).map(b => b.batchName).join(', ')}
              {unmarked.length > 3 ? ` +${unmarked.length - 3}` : ''}
            </p>
          )}
        </div>

        <div className="card collections-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">This month P&L</h3>
              <p className="card-subtitle">{monthLabel} · collections vs expenses</p>
            </div>
            <div className="dollar-badge-icon">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="collections-main-stat">
            <span className="big-amount">{formatCurrencyPKR(monthPnL)}</span>
          </div>

          <div className="target-progress-group">
            <div className="target-flex">
              <span>All-time collection ({formatCurrencyPKR(totalTarget)} billed)</span>
              <span>{collectionPct}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, collectionPct)}%` }} />
            </div>
          </div>

          <div className="financial-columns">
            <div className="fin-col">
              <span className="fin-lbl">Collected</span>
              <span className="fin-val text-black">{formatCurrencyPKR(monthCollected)}</span>
            </div>
            <div className="fin-col">
              <span className="fin-lbl">Expenses</span>
              <span className="fin-val text-amber">{formatCurrencyPKR(monthExpenses)}</span>
            </div>
            <div className="fin-col">
              <span className="fin-lbl">Defaulters</span>
              <span className="fin-val text-red">{defaultersCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-mid">
        <div className="card crm-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div className="dollar-badge-icon">
              <UserCheck size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Follow-ups due</h3>
              <p className="card-subtitle">Open inquiries past their follow-up date</p>
            </div>
            <div className="badge badge-gray">{followUps.length} due</div>
          </div>

          {followUps.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 500 }}>{lead.name}</td>
                      <td>{lead.classInterest || '—'}</td>
                      <td>{lead.followUpOn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">
                {leads.length > 0 ? 'No follow-ups overdue.' : 'No open inquiries.'}
              </p>
            </div>
          )}

          <button className="btn-primary w-full" onClick={() => onNavigate('crm')} style={{ marginTop: 16, justifyContent: 'center' }}>
            <span>Open CRM</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="card schedule-card">
          <div className="card-header-flex">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#475569" />
              <h3 className="card-title">Today's timetable</h3>
            </div>
            <span className="badge badge-green">{schedule.length} periods</span>
          </div>

          {schedule.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: 220, overflowY: 'auto', marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Batch</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(slot => (
                    <tr key={slot.id}>
                      <td style={{ fontWeight: 500 }}>{slot.startTime}–{slot.endTime}</td>
                      <td>{slot.batchName}{slot.room ? ` · ${slot.room}` : ''}</td>
                      <td>{slot.subjectName || '—'}</td>
                      <td>{slot.teacherName}{slot.substituted ? ' (sub)' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-container">
              <p className="empty-state-text">No timetable periods for today.</p>
            </div>
          )}

          {tests.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <p className="card-subtitle" style={{ marginBottom: 6 }}>Upcoming tests missing marks</p>
              {tests.slice(0, 3).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>
                  {t.examDate} · {t.batchName} · {t.title} ({t.scored}/{t.roster})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="notice-banner-card">
        <div className="notice-left">
          <div className="notice-icon-circle">
            {latestNotice?.pinned ? <Pin size={18} color="#FFFFFF" /> : <Bell size={18} color="#FFFFFF" />}
          </div>
          <div>
            <h4 className="notice-title">{latestNotice ? latestNotice.title : 'Notice board'}</h4>
            <p className="notice-sub">
              {latestNotice
                ? latestNotice.body.slice(0, 140)
                : 'No announcements yet. Post one for staff and families.'}
            </p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('announcements')}>
          <MessageSquare size={14} /> View announcements
        </button>
      </div>
    </div>
  );
};
