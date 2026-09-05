import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Award,
  Filter
} from 'lucide-react';
import { api } from '../api/apiClient';
import { TabType } from '../types';

interface StudentAttendanceViewProps {
  student?: any;
  onNavigate?: (tab: TabType) => void;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({ student }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const data = await api.getAttendance();
        if (isMounted && Array.isArray(data)) {
          setRecords(data);
        }
      } catch (err) {
        console.error('Failed to load student attendance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAttendance();
    return () => { isMounted = false; };
  }, []);

  const months = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.date) {
        const m = String(r.date).slice(0, 7);
        set.add(m);
      }
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  const filteredRecords = React.useMemo(() => {
    if (filterMonth === 'all') return records;
    return records.filter(r => String(r.date).startsWith(filterMonth));
  }, [records, filterMonth]);

  const totalSessions = records.length;
  const presentCount = records.filter(r => (r.status || '').toLowerCase() === 'present').length;
  const absentCount = records.filter(r => (r.status || '').toLowerCase() === 'absent').length;
  const lateCount = records.filter(r => (r.status || '').toLowerCase() === 'late').length;
  const leaveCount = records.filter(r => {
    const st = (r.status || '').toLowerCase();
    return st === 'leave' || st === 'excused';
  }).length;

  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalSessions) * 100) : 100;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Card */}
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
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
              My Attendance Portal
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Student: <strong style={{ color: '#E2E8F0' }}>{student?.name || 'Student'}</strong> &bull; Admission: <strong style={{ color: '#E2E8F0' }}>{student?.admission_no || student?.admissionNo || student?.regNo || 'Enrolled'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Overall Attendance: </span>
            <strong style={{ fontSize: 14, color: attendanceRate >= 80 ? '#10B981' : attendanceRate >= 65 ? '#F59E0B' : '#EF4444', marginLeft: 6 }}>
              {attendanceRate}%
            </strong>
          </div>
        </div>
      </div>

      {/* 4 Metric Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Total Sessions</span>
            <Calendar size={16} color="#64748B" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{totalSessions}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>Recorded class dates</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#059669' }}>Present Days</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{presentCount}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>Full attendances</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#DC2626' }}>Absent Days</span>
            <XCircle size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626' }}>{absentCount}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>Unexcused missed classes</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#D97706' }}>Late / On Leave</span>
            <Clock size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{lateCount + leaveCount}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>{lateCount} late &bull; {leaveCount} excused</div>
        </div>
      </div>

      {/* Attendance History Table Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Daily Attendance Log</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>Verified attendance entries by faculty</p>
          </div>

          {months.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} color="#64748B" />
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: 13,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Months</option>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Calendar size={36} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No attendance records found</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Your attendance entries will appear here once marked by your teachers.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Class / Batch</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const st = (rec.status || 'present').toLowerCase();
                  let statusBg = '#ECFDF5';
                  let statusColor = '#059669';
                  let statusBorder = '#A7F3D0';
                  let statusLabel = 'Present';
                  let StatusIcon = CheckCircle2;

                  if (st === 'absent') {
                    statusBg = '#FEF2F2';
                    statusColor = '#DC2626';
                    statusBorder = '#FECACA';
                    statusLabel = 'Absent';
                    StatusIcon = XCircle;
                  } else if (st === 'late') {
                    statusBg = '#FFFBEB';
                    statusColor = '#D97706';
                    statusBorder = '#FDE68A';
                    statusLabel = 'Late';
                    StatusIcon = Clock;
                  } else if (st === 'leave' || st === 'excused') {
                    statusBg = '#EFF6FF';
                    statusColor = '#2563EB';
                    statusBorder = '#BFDBFE';
                    statusLabel = 'On Leave';
                    StatusIcon = Calendar;
                  }

                  const batchName = rec.batch?.name || student?.gradeBatch || 'Main Class';

                  return (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {rec.date ? new Date(rec.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#334155' }}>
                        {batchName}
                      </td>
                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 9999,
                            backgroundColor: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusBorder}`,
                            fontSize: 12,
                            fontWeight: 700
                          }}
                        >
                          <StatusIcon size={12} />
                          <span>{statusLabel}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748B', fontSize: 13 }}>
                        {rec.remarks || rec.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
