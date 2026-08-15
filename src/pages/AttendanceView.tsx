import React, { useState } from 'react';
import { Student, Batch } from '../types';
import { CheckSquare, Calendar, Save, Check, X, Clock, Download } from 'lucide-react';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { CustomSelect } from '../components/CustomSelect';

interface AttendanceViewProps {
  students: Student[];
  batches: Batch[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ students, batches }) => {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'b1');
  const [selectedDate, setSelectedDate] = useState('2026-08-12');
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

  const handleSave = async () => {
    const entries = batchStudents.map(s => ({
      studentId: s.id,
      status: (attendanceState[s.id] || 'Present').toLowerCase()
    }));

    try {
      await api.markAttendanceBulk({
        batchId: selectedBatchId,
        date: selectedDate,
        entries
      });
      setSaveMessage(`✓ Attendance saved successfully for ${currentBatch?.name || 'Selected Batch'} on ${selectedDate}.`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      alert(`Error saving attendance: ${err.message}`);
    }
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
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Attendance Portal</h2>
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
      <div style={{ display: 'flex', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Select Batch / Class Section</label>
          <CustomSelect
            value={selectedBatchId}
            onChange={setSelectedBatchId}
            options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.instructor})` }))}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attendance Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
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
                    border: currentStatus === 'Present' ? '2px solid #10B981' : '1px solid #E2E8F0',
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
                    border: currentStatus === 'Absent' ? '2px solid #EF4444' : '1px solid #E2E8F0',
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
                    border: currentStatus === 'Late' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
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
  );
};
