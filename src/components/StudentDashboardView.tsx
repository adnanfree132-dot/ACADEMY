import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  BookOpen, 
  Award, 
  Receipt, 
  Bell, 
  ChevronRight, 
  GraduationCap, 
  CheckSquare
} from 'lucide-react';
import { TabType } from '../types';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

interface StudentDashboardViewProps {
  student?: any;
  dashboardLive?: any;
  onNavigate: (tab: TabType) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  student,
  dashboardLive,
  onNavigate
}) => {
  const overview = dashboardLive?.overview || {};
  const studentInfo = dashboardLive?.student || student || {};
  const todaySchedule = dashboardLive?.todaySchedule || [];
  const upcomingTests = dashboardLive?.upcomingTests || [];
  const announcements = dashboardLive?.recentAnnouncements || [];

  const attendanceRate = overview.attendanceRate !== undefined ? overview.attendanceRate : 100;
  const pendingFee = overview.pendingFee !== undefined ? overview.pendingFee : (student?.dueBalance || 0);
  const pendingHw = overview.pendingHomework || 0;
  const testsCount = overview.upcomingTestsCount !== undefined ? overview.upcomingTestsCount : upcomingTests.length;

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
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}
          >
            <GraduationCap size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                Welcome back, {studentInfo.fullName || student?.name || 'Student'}
              </h1>
              <span 
                style={{
                  backgroundColor: 'rgba(16,185,129,0.2)',
                  color: '#34D399',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: 11.5,
                  fontWeight: 700
                }}
              >
                Student Portal
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Admission No: <strong style={{ color: '#E2E8F0' }}>{studentInfo.admissionNo || student?.admission_no || student?.rollNumber || 'ADM-2026'}</strong>
              {studentInfo.className && <> &bull; Class: <strong style={{ color: '#E2E8F0' }}>{studentInfo.className}</strong></>}
              {studentInfo.batches && studentInfo.batches.length > 0 && <> &bull; Batch: <strong style={{ color: '#E2E8F0' }}>{studentInfo.batches.join(', ')}</strong></>}
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
            <CheckSquare size={15} />
            <span>My Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('homework')}
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
            <BookOpen size={15} />
            <span>Homework</span>
          </button>
        </div>
      </div>

      {/* 4 Essential Student KPI Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: 16, 
          marginBottom: 24 
        }}
      >
        {/* Attendance Rate */}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Attendance Rate</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckSquare size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {attendanceRate}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: attendanceRate >= 80 ? '#059669' : '#DC2626' }}>
              {attendanceRate >= 80 ? 'Good Standing' : 'Low Attendance'}
            </span>
          </div>
          <div style={{ marginTop: 10, height: 6, backgroundColor: '#F1F5F9', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, attendanceRate)}%`, height: '100%', backgroundColor: attendanceRate >= 80 ? '#10B981' : '#EF4444', borderRadius: 9999 }} />
          </div>
        </div>

        {/* Pending Homework */}
        <div 
          onClick={() => onNavigate('homework')}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Pending Homework</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <BookOpen size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {pendingHw}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Assignments Due
            </span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#3B82F6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Open Homework & Study</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Upcoming Exams */}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Upcoming Exams</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Award size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {testsCount}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
              Scheduled Tests
            </span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>View Marks & Schedules</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Fee Status */}
        <div 
          onClick={() => onNavigate('fees')}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Fee Dues</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: pendingFee > 0 ? '#FEE2E2' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pendingFee > 0 ? '#DC2626' : '#059669' }}>
              <Receipt size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: pendingFee > 0 ? '#DC2626' : '#059669', letterSpacing: '-0.02em' }}>
              {pendingFee > 0 ? formatCurrencyPKR(pendingFee) : 'Cleared'}
            </span>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{pendingFee > 0 ? 'View Outstanding Slip' : 'All Invoices Paid'}</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Schedule & Upcoming Exams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Today's Classes */}
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
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Today's Class Schedule</h2>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              style={{ background: 'transparent', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>Full Timetable</span>
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
                      {slot.subjectName || slot.batchName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Instructor: {slot.teacherName} {slot.room && `• Room: ${slot.room}`}
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
              No classes scheduled for today. Check your full timetable for other days.
            </div>
          )}
        </div>

        {/* Upcoming Tests & Exams */}
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
              <Award size={18} color="#D97706" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Upcoming Tests & Exams</h2>
            </div>
            <button
              onClick={() => onNavigate('exams')}
              style={{ background: 'transparent', border: 'none', color: '#D97706', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {upcomingTests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingTests.map((test: any) => (
                <div 
                  key={test.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: '#FFFBEB',
                    borderRadius: 10,
                    border: '1px solid #FEF3C7'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                      {test.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                      {test.subjectName || test.batchName} &bull; Max: {test.maxMarks} &bull; Pass: {test.passMarks}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />
                      {test.examDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: 13 }}>
              <CheckCircle2 size={32} color="#A7F3D0" style={{ margin: '0 auto 8px', display: 'block' }} />
              No upcoming exams scheduled. You are all caught up!
            </div>
          )}
        </div>
      </div>

      {/* Academy Notices & Announcements */}
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
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Academy Announcements</h2>
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
