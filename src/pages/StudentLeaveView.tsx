import React, { useEffect, useState } from 'react';
import { api, peekApiCache } from '../api/apiClient';
import { useApiCacheSync } from '../lib/useApiCacheSync';
import { showToast } from '../lib/toast';

export const StudentLeaveView: React.FC<{ students?: { id: string; name: string }[] }> = ({ students = [] }) => {
  const [leaves, setLeaves] = useState<any[]>(() => peekApiCache<any[]>('/leaves') || []);
  const [studentId, setStudentId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const load = async () => {
    const rows = await api.getLeaves().catch(() => []);
    setLeaves(Array.isArray(rows) ? rows : []);
  };
  useEffect(() => { load(); }, []);
  useApiCacheSync<any[]>('/leaves', rows => { if (Array.isArray(rows)) setLeaves(rows); });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Student leave</h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>Approve writes attendance as leave for those dates. Attendance marking UI is unchanged.</p>
      </div>

      <form
        className="card"
        style={{ padding: 16, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: 8 }}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.createLeaveRequest({ studentId, fromDate, toDate, reason });
            showToast('Leave request filed.', 'success');
            setReason('');
            load();
          } catch (err: any) {
            showToast(err.message || 'Could not create leave.', 'error');
          }
        }}
      >
        <select className="form-input" required value={studentId} onChange={e => setStudentId(e.target.value)}>
          <option value="">Student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="form-input" type="date" required value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input className="form-input" type="date" required value={toDate} onChange={e => setToDate(e.target.value)} />
        <input className="form-input" required placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} />
        <button className="btn-primary" type="submit">Request</button>
      </form>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leaves.map(row => (
              <tr key={row.id}>
                <td>{row.student?.full_name}</td>
                <td>{row.from_date}</td>
                <td>{row.to_date}</td>
                <td>{row.reason}</td>
                <td><span className="badge badge-gray">{row.status}</span></td>
                <td>
                  {row.status === 'pending' && (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-primary btn-sm" onClick={async () => {
                        try {
                          await api.updateLeaveStatus(row.id, 'approved');
                          showToast('Approved. Attendance marked leave.', 'success');
                          load();
                        } catch (err: any) {
                          showToast(err.message || 'Could not approve.', 'error');
                        }
                      }}>Approve</button>
                      <button className="btn-secondary btn-sm" onClick={async () => {
                        await api.updateLeaveStatus(row.id, 'rejected');
                        load();
                      }}>Reject</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
