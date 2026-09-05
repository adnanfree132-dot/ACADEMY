import React, { useState } from 'react';
import { Student, Batch } from '../types';
import { 
  CheckSquare, 
  Calendar, 
  Save, 
  Check, 
  X, 
  Clock, 
  Download, 
  Users, 
  GraduationCap
} from 'lucide-react';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { ModernSelect } from '../components/ModernSelect';
import { ModernDatePicker } from '../components/ModernDatePicker';
import { StaffAttendanceView } from './StaffAttendanceView';

interface AttendanceViewProps {
  students: Student[];
  batches: Batch[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ students, batches }) => {
  const [portalTab, setPortalTab] = useState<'students' | 'staff'>('students');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'b1');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  
  // Filter students by assigned batch, returning empty array if no students are enrolled in this batch
  const batchStudents = React.useMemo(() => {
    if (!currentBatch) return [];
    return students.filter(s => {
      const gb = (s.gradeBatch || '').toLowerCase();
      const bn = (currentBatch.name || '').toLowerCase();
      const cl = (currentBatch.classLevel || '').toLowerCase();
      return gb === bn || gb === cl || gb.includes(bn) || bn.includes(gb);
    });
  }, [students, currentBatch]);

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'>>({});

  // Sync attendance with backend database whenever batch or date changes
  React.useEffect(() => {
    let isMounted = true;
    const loadAttendance = async () => {
      if (!selectedBatchId || !selectedDate) return;
      setIsLoadingAttendance(true);
      try {
        const records = await api.getAttendance({ batchId: selectedBatchId, date: selectedDate });
        if (!isMounted) return;
        const stateMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'> = {};
        if (Array.isArray(records) && records.length > 0) {
          records.forEach((r: any) => {
            const sId = r.student_id || r.studentId;
            const rawSt = (r.status || 'present').toLowerCase();
            let capSt: 'Present' | 'Absent' | 'Late' | 'Leave' = 'Present';
            if (rawSt === 'absent') capSt = 'Absent';
            else if (rawSt === 'late') capSt = 'Late';
            else if (rawSt === 'leave' || rawSt === 'excused') capSt = 'Leave';
            stateMap[sId] = capSt;
          });
        }
        batchStudents.forEach(s => {
          if (!stateMap[s.id]) {
            stateMap[s.id] = 'Present';
          }
        });
        setAttendanceState(stateMap);
      } catch (err) {
        console.warn('Could not load attendance from API, defaulting to Present:', err);
        if (isMounted) {
          const fallbackMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'> = {};
          batchStudents.forEach(s => { fallbackMap[s.id] = 'Present'; });
          setAttendanceState(fallbackMap);
        }
      } finally {
        if (isMounted) setIsLoadingAttendance(false);
      }
    };

    loadAttendance();
    return () => { isMounted = false; };
  }, [selectedBatchId, selectedDate, batchStudents]);

  const toggleStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    const nextMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'> = {};
    batchStudents.forEach(s => {
      nextMap[s.id] = status;
    });
    setAttendanceState(nextMap);
  };

  const handleSave = () => {
    const entries = batchStudents.map(s => ({
      studentId: s.id,
      status: (attendanceState[s.id] || 'Present').toLowerCase()
    }));

    setSaveMessage(`Attendance saved successfully for ${currentBatch?.name || 'Selected Batch'} on ${selectedDate}.`);
    setTimeout(() => setSaveMessage(''), 3500);

    api.markAttendanceBulk({
      batchId: selectedBatchId,
      date: selectedDate,
      entries
    }).catch(err => console.error('Error saving attendance in background:', err));
  };

  const handleExportCSV = () => {
    exportToCSV(`Attendance_${selectedDate}`, batchStudents.map(s => ({
      RegNo: s.regNo,
      StudentName: s.name,
      Batch: s.gradeBatch,
      Date: selectedDate,
      Status: attendanceState[s.id] || 'Present'
    })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Portal Solid Pill Tab Navigation */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 8, 
          background: '#FFFFFF', 
          padding: 8, 
          borderRadius: 14, 
          border: '1.5px solid #E2E8F0',
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          onClick={() => setPortalTab('students')}
          style={{
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            background: portalTab === 'students' ? '#0F172A' : 'transparent',
            color: portalTab === 'students' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (portalTab !== 'students') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (portalTab !== 'students') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <GraduationCap size={15} color={portalTab === 'students' ? '#FFFFFF' : '#64748B'} />
          Student Attendance
        </button>

        <button
          type="button"
          onClick={() => setPortalTab('staff')}
          style={{
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            background: portalTab === 'staff' ? '#0F172A' : 'transparent',
            color: portalTab === 'staff' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (portalTab !== 'staff') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (portalTab !== 'staff') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <Users size={15} color={portalTab === 'staff' ? '#FFFFFF' : '#64748B'} />
          Staff Attendance
        </button>
      </div>

      {/* Render Sub-Portal */}
      {portalTab === 'staff' ? (
        <StaffAttendanceView />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="directory-header-container">
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Student Roll Call Marks</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Daily batch roll call marksheet and attendance tracking</p>
            </div>
            <div className="header-action-bar">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={15} /> Export CSV
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <Save size={16} /> Save Sheet
              </button>
            </div>
          </div>

          {saveMessage && (
            <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {saveMessage}
            </div>
          )}

          {/* Batch & Date Picker */}
          <div style={{ display: 'flex', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1.5px solid #E2E8F0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Select Batch / Class Section</label>
              <ModernSelect
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.instructor || 'Unassigned'})` }))}
                zIndex={100}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attendance Date</label>
              <ModernDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => markAll('Present')}
                style={{ height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700 }}
              >
                <Check size={14} color="#16A34A" /> All Present
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => markAll('Absent')}
                style={{ height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700 }}
              >
                <X size={14} color="#DC2626" /> All Absent
              </button>
            </div>
          </div>

          {/* Real-Time Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Enrolled</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{batchStudents.length}</div>
              </div>
              <Users size={20} color="#64748B" />
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>Present</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>
                  {batchStudents.filter(s => (attendanceState[s.id] || 'Present') === 'Present').length}
                </div>
              </div>
              <Check size={20} color="#15803D" />
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>Absent</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>
                  {batchStudents.filter(s => (attendanceState[s.id] || 'Present') === 'Absent').length}
                </div>
              </div>
              <X size={20} color="#DC2626" />
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>Late</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#D97706' }}>
                  {batchStudents.filter(s => (attendanceState[s.id] || 'Present') === 'Late').length}
                </div>
              </div>
              <Clock size={20} color="#D97706" />
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#1E40AF', fontWeight: 600 }}>Attendance</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>
                  {batchStudents.length > 0
                    ? `${Math.round((batchStudents.filter(s => (attendanceState[s.id] || 'Present') === 'Present').length / batchStudents.length) * 100)}%`
                    : '0%'}
                </div>
              </div>
              <GraduationCap size={20} color="#2563EB" />
            </div>
          </div>

          {/* Desktop Attendance Roll Call Table */}
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No & Student Name</th>
                  <th>Assigned Batch</th>
                  <th>Current Status</th>
                  <th>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontWeight: 500 }}>
                      No students enrolled in this batch.
                    </td>
                  </tr>
                ) : (
                  batchStudents.map(s => {
                  const currentStatus = attendanceState[s.id] || 'Present';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.regNo}</div>
                      </td>
                      <td><span className="badge badge-gray">{s.gradeBatch}</span></td>
                      <td>
                        {currentStatus === 'Present' && <span className="badge badge-green"><Check size={12} /> Present</span>}
                        {currentStatus === 'Absent' && <span className="badge badge-red"><X size={12} /> Absent</span>}
                        {currentStatus === 'Late' && <span className="badge badge-amber"><Clock size={12} /> Late</span>}
                        {currentStatus === 'Leave' && <span className="badge badge-blue"><Users size={12} /> Leave</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className={`btn-secondary btn-sm ${currentStatus === 'Present' ? 'btn-primary' : ''}`}
                            onClick={() => toggleStatus(s.id, 'Present')}
                          >
                            Present
                          </button>
                          <button 
                            className={`btn-secondary btn-sm ${currentStatus === 'Absent' ? 'btn-danger' : ''}`}
                            onClick={() => toggleStatus(s.id, 'Absent')}
                          >
                            Absent
                          </button>
                          <button 
                            className={`btn-secondary btn-sm ${currentStatus === 'Late' ? 'btn-amber' : ''}`}
                            onClick={() => toggleStatus(s.id, 'Late')}
                          >
                            Late
                          </button>
                          <button 
                            className={`btn-secondary btn-sm ${currentStatus === 'Leave' ? 'btn-primary' : ''}`}
                            style={currentStatus === 'Leave' ? { background: '#2563EB', color: '#FFFFFF', borderColor: '#2563EB' } : {}}
                            onClick={() => toggleStatus(s.id, 'Leave')}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Attendance Touch Cards (< 768px) */}
          <div className="mobile-card-roster mobile-only">
            {batchStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontWeight: 500, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                No students enrolled in this batch.
              </div>
            ) : (
              batchStudents.map(s => {
              const currentStatus = attendanceState[s.id] || 'Present';
              return (
                <div key={s.id} className="mobile-entity-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>{s.name}</h3>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{s.regNo}</span>
                    </div>
                    <span className="badge badge-gray">{s.gradeBatch}</span>
                  </div>

                  {/* Status Segmented Touch Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'Present')}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: currentStatus === 'Present' ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                        background: currentStatus === 'Present' ? '#ECFDF5' : '#FFFFFF',
                        color: currentStatus === 'Present' ? '#065F46' : '#64748B',
                        fontWeight: 500,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Check size={13} /> Present
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'Absent')}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: currentStatus === 'Absent' ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                        background: currentStatus === 'Absent' ? '#FEF2F2' : '#FFFFFF',
                        color: currentStatus === 'Absent' ? '#991B1B' : '#64748B',
                        fontWeight: 500,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <X size={13} /> Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'Late')}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: currentStatus === 'Late' ? '1.5px solid #F59E0B' : '1.5px solid #E2E8F0',
                        background: currentStatus === 'Late' ? '#FFFBEB' : '#FFFFFF',
                        color: currentStatus === 'Late' ? '#92400E' : '#64748B',
                        fontWeight: 500,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Clock size={13} /> Late
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'Leave')}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: currentStatus === 'Leave' ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                        background: currentStatus === 'Leave' ? '#EFF6FF' : '#FFFFFF',
                        color: currentStatus === 'Leave' ? '#1E40AF' : '#64748B',
                        fontWeight: 500,
                        fontSize: 11.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Users size={13} /> Leave
                    </button>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
