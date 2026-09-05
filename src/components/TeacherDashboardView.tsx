import React from 'react';
import { 
  Users, 
  Layers, 
  Clock, 
  CheckSquare, 
  Award, 
  Bell, 
  ChevronRight, 
  UserCheck, 
  AlertTriangle,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { TabType } from '../types';

interface TeacherDashboardViewProps {
  teacher?: any;
  dashboardLive?: any;
  onNavigate: (tab: TabType) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  dashboardLive,
  onNavigate
}) => {
  const overview = dashboardLive?.overview || {};
  const teacherInfo = dashboardLive?.teacher || teacher || {};
  const todaySchedule = dashboardLive?.todaySchedule || [];
  const unmarkedAttendance = dashboardLive?.unmarkedAttendance || [];
  const testsWithoutMarks = dashboardLive?.testsWithoutMarks || [];
  const announcements = dashboardLive?.recentAnnouncements || [];

  const totalBatches = overview.totalBatches !== undefined ? overview.totalBatches : 0;
  const totalStudents = overview.totalStudents !== undefined ? overview.totalStudents : 0;
  const todayClasses = overview.todayClasses !== undefined ? overview.todayClasses : todaySchedule.length;
  const pendingAttendanceCount = overview.pendingAttendanceCount !== undefined ? overview.pendingAttendanceCount : unmarkedAttendance.length;
  const upcomingTestsCount = overview.upcomingTestsCount !== undefined ? overview.upcomingTestsCount : testsWithoutMarks.length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Welcome Banner Card */}
      <div 
        style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div 
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            <UserCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Welcome back, {teacherInfo.fullName || teacher?.name || 'Faculty Member'}
              </h1>
              <span 
                style={{
                  backgroundColor: 'rgba(37,99,235,0.2)',
                  color: '#93C5FD',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: 11.5,
                  fontWeight: 700
                }}
              >
                Faculty Portal
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              {teacher?.qualification || 'Academic Faculty'} &bull; Assigned Classes: <strong style={{ color: '#E2E8F0' }}>{totalBatches}</strong> &bull; Total Students: <strong style={{ color: '#E2E8F0' }}>{totalStudents}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('attendance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <CheckSquare size={15} />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('homework')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Assign Homework</span>
          </button>
        </div>
      </div>

      {/* 5 Faculty KPI Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}
      >
        {/* Active Batches */}
        <div 
          onClick={() => onNavigate('batches')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>My Batches</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Layers size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {totalBatches}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Classes Assigned
            </span>
          </div>
        </div>

        {/* Total Students */}
        <div 
          onClick={() => onNavigate('students')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>My Students</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <Users size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {totalStudents}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Enrolled in Classes
            </span>
          </div>
        </div>

        {/* Today's Classes */}
        <div 
          onClick={() => onNavigate('timetable')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Today's Classes</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA' }}>
              <Clock size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {todayClasses}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Timetable Slots
            </span>
          </div>
        </div>

        {/* Pending Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Attendance Due</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: pendingAttendanceCount > 0 ? '#FEF2F2' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pendingAttendanceCount > 0 ? '#DC2626' : '#059669' }}>
              <CheckSquare size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: pendingAttendanceCount > 0 ? '#DC2626' : '#059669', letterSpacing: '-0.02em' }}>
              {pendingAttendanceCount}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: pendingAttendanceCount > 0 ? '#DC2626' : '#059669' }}>
              {pendingAttendanceCount > 0 ? 'Batches Unmarked' : 'All Marked'}
            </span>
          </div>
        </div>

        {/* Upcoming Tests */}
        <div 
          onClick={() => onNavigate('exams')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 18,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Upcoming Tests</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Award size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {upcomingTestsCount}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Awaiting Grading
            </span>
          </div>
        </div>
      </div>

      {/* Dual Grid: Today's Schedule & Attendance Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Today's Teaching Schedule */}
        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 2px 4px rgba(15,23,42,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#2563EB" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Today's Teaching Schedule</h2>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>Full Schedule</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {todaySchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaySchedule.map((slot: any) => (
                <div 
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {slot.batchName} &bull; {slot.subjectName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {slot.room ? `Room: ${slot.room}` : 'Classroom Session'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '4px 8px', borderRadius: 6 }}>
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: 13 }}>
              <Clock size={32} color="#CBD5E1" style={{ margin: '0 auto 8px', display: 'block' }} />
              No teaching sessions scheduled for today.
            </div>
          )}
        </div>

        {/* Action Center: Unmarked Attendance */}
        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 2px 4px rgba(15,23,42,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#D97706" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Today's Attendance Status</h2>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>Go to Attendance</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {unmarkedAttendance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unmarkedAttendance.map((b: any) => (
                <div 
                  key={b.batchId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: 10,
                    border: '1px solid #FEE2E2'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>
                      {b.batchName}
                    </div>
                    <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                      {b.enrolled} Students Enrolled &bull; Attendance not marked for today
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('attendance')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Take Roll
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#059669', fontSize: 13 }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px', display: 'block' }} />
              All assigned batches have attendance marked for today!
            </div>
          )}
        </div>
      </div>

      {/* Faculty Announcements */}
      {announcements.length > 0 && (
        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Bell size={18} color="#0EA5E9" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Faculty & Academy Announcements</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map((ann: any) => (
              <div 
                key={ann.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{ann.title}</div>
                  {ann.createdAt && (
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>{ann.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
