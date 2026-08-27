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
  GraduationCap, 
  Navigation,
  Compass
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
  const [selectedDate, setSelectedDate] = useState('2026-08-25');
  const [saveMessage, setSaveMessage] = useState('');
  
  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  const batchStudents = students;

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({
    s1: 'Present',
    s2: 'Present',
    s3: 'Present',
    s4: 'Absent',
    s5: 'Present'
  });

  const toggleStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    const entries = batchStudents.map(s => ({
      studentId: s.id,
      status: (attendanceState[s.id] || 'Present').toLowerCase()
    }));

    setSaveMessage(`Attendance saved successfully for ${currentBatch?.name || 'Selected Batch'} on ${selectedDate}.`);
    setTimeout(() => setSaveMessage(''), 3000);

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
            fontWeight: portalTab === 'students' ? 800 : 600,
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
            fontWeight: portalTab === 'staff' ? 800 : 600,
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
          <Navigation size={15} color={portalTab === 'staff' ? '#FFFFFF' : '#64748B'} />
          Staff Geolocation Attendance
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
          <div style={{ display: 'flex', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1.5px solid #E2E8F0', flexWrap: 'wrap' }}>
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
                {batchStudents.map(s => {
                  const currentStatus = attendanceState[s.id] || 'Present';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.regNo}</div>
                      </td>
                      <td><span className="badge badge-gray">{s.gradeBatch}</span></td>
                      <td>
                        {currentStatus === 'Present' && <span className="badge badge-green"><Check size={12} /> Present</span>}
                        {currentStatus === 'Absent' && <span className="badge badge-red"><X size={12} /> Absent</span>}
                        {currentStatus === 'Late' && <span className="badge badge-amber"><Clock size={12} /> Late</span>}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Attendance Touch Cards (< 768px) */}
          <div className="mobile-card-roster mobile-only">
            {batchStudents.map(s => {
              const currentStatus = attendanceState[s.id] || 'Present';
              return (
                <div key={s.id} className="mobile-entity-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{s.name}</h3>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.regNo}</span>
                    </div>
                    <span className="badge badge-gray">{s.gradeBatch}</span>
                  </div>

                  {/* Status Segmented Touch Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, paddingTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'Present')}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: currentStatus === 'Present' ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                        background: currentStatus === 'Present' ? '#ECFDF5' : '#FFFFFF',
                        color: currentStatus === 'Present' ? '#065F46' : '#64748B',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Check size={14} /> Present
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
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <X size={14} /> Absent
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
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Clock size={14} /> Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
