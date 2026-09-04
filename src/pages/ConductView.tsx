import React, { useEffect, useState } from 'react';
import { Plus, Shield, X, Trash2, Search } from 'lucide-react';
import { api, peekApiCache } from '../api/apiClient';
import { useApiCacheSync } from '../lib/useApiCacheSync';
import { showToast } from '../lib/toast';

const CATEGORIES = ['commendation', 'infraction', 'academic', 'attendance', 'general'];
const SEVERITIES = ['positive', 'neutral', 'warning', 'critical'];

export const ConductView: React.FC = () => {
  const cachedDesk = peekApiCache<{ logs: any[]; summary: any }>('/conduct-logs');
  const [logs, setLogs] = useState<any[]>(cachedDesk?.logs || []);
  const [summary, setSummary] = useState(cachedDesk?.summary || { thisMonth: 0, commendations: 0, infractions: 0, critical: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', category: 'general', severity: 'neutral', title: '', remark: '', confidential: false });

  const load = async () => {
    try {
      const data = await api.getConductDesk({ q, category, severity });
      setLogs(data.logs || []);
      setSummary(data.summary || summary);
    } catch (err: any) {
      showToast(err.message || 'Could not load conduct logs.', 'error');
    }
  };

  useEffect(() => {
    load();
    api.getStudents().then(rows => setStudents(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [category, severity]);
  useApiCacheSync<any>('/conduct-logs', data => {
    if (data?.logs) setLogs(data.logs);
    if (data?.summary) setSummary(data.summary);
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || form.remark.trim().length < 3) {
      showToast('Pick a student and write a remark (3+ characters).', 'error');
      return;
    }
    try {
      await api.createConductLog(form.studentId, {
        category: form.category,
        severity: form.severity,
        title: form.title || undefined,
        remark: form.remark.trim(),
        is_confidential: form.confidential
      });
      showToast('Conduct note saved.', 'success');
      setOpen(false);
      setForm({ studentId: '', category: 'general', severity: 'neutral', title: '', remark: '', confidential: false });
      load();
    } catch (err: any) {
      showToast(err.message || 'Could not save.', 'error');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this conduct note? It is soft-deleted and stays in the audit trail.')) return;
    setLogs(prev => prev.filter(l => l.id !== id));
    try {
      await api.deleteConductLog(id);
      showToast('Note removed.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not delete.', 'error');
      load();
    }
  };

  const badge = (sev: string) => sev === 'critical' ? 'badge-red' : sev === 'warning' ? 'badge-amber' : sev === 'positive' ? 'badge-green' : 'badge-gray';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Conduct desk</h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Academy-wide notes. Confidential entries are hidden from parents and students.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add note</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div className="card" style={{ padding: 14 }}><div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>THIS MONTH</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summary.thisMonth}</div></div>
        <div className="card" style={{ padding: 14 }}><div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>COMMENDATIONS</div><div style={{ fontSize: 22, fontWeight: 900, color: '#15803D' }}>{summary.commendations}</div></div>
        <div className="card" style={{ padding: 14 }}><div style={{ fontSize: 11, color: '#9A3412', fontWeight: 700 }}>INFRACTIONS</div><div style={{ fontSize: 22, fontWeight: 900, color: '#C2410C' }}>{summary.infractions}</div></div>
        <div className="card" style={{ padding: 14 }}><div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700 }}>CRITICAL</div><div style={{ fontSize: 22, fontWeight: 900, color: '#DC2626' }}>{summary.critical}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8' }} />
          <input className="form-input" style={{ paddingLeft: 30 }} placeholder="Search student or remark" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <select className="form-input" style={{ width: 160 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-input" style={{ width: 150 }} value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="all">All severity</option>
          {SEVERITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-secondary" onClick={load}>Apply</button>
      </div>

      {logs.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>
          <Shield size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
          <div>No conduct notes match these filters.</div>
        </div>
      ) : logs.map(log => (
        <div key={log.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <strong>{log.studentName}</strong>
              <span className="badge badge-gray">{log.admissionNo}</span>
              <span className={`badge ${badge(log.severity)}`}>{log.severity}</span>
              <span className="badge badge-blue">{log.category}</span>
              {log.isConfidential && <span className="badge badge-amber">Confidential</span>}
            </div>
            {log.title && <div style={{ fontWeight: 700, marginTop: 4 }}>{log.title}</div>}
            <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>{log.remark}</p>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
              {log.authorName} · {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}{log.batchName ? ` · ${log.batchName}` : ''}
            </div>
          </div>
          <button className="btn-secondary btn-sm" onClick={() => remove(log.id)} style={{ color: '#DC2626', height: 32 }}><Trash2 size={13} /></button>
        </div>
      ))}

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>New conduct note</h3>
              <button className="modal-close-btn" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <select className="form-input" required value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">Student</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name || s.name} · {s.admission_no || s.regNo}</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="form-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  {SEVERITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input className="form-input" placeholder="Title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="form-input" required rows={4} placeholder="What happened?" value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={form.confidential} onChange={e => setForm({ ...form, confidential: e.target.checked })} />
                Confidential (staff only)
              </label>
              <button className="btn-primary" type="submit">Save note</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
