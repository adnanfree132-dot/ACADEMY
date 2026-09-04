import React, { useEffect, useState } from 'react';
import { FileText, Plus, X, Download, Check } from 'lucide-react';
import { api, peekApiCache } from '../api/apiClient';
import { useApiCacheSync } from '../lib/useApiCacheSync';
import { showToast } from '../lib/toast';
import { exportToCSV } from '../utils/csvExporter';

export const HomeworkView: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<any[]>(() => peekApiCache<any[]>('/homework') || []);
  const [materialsList, setMaterialsList] = useState<any[]>(() => peekApiCache<any[]>('/study-materials') || []);
  const [batches, setBatches] = useState<any[]>(() => peekApiCache<any[]>('/batches') || []);
  const [subjects, setSubjects] = useState<any[]>(() => peekApiCache<any[]>('/subjects') || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [batchId, setBatchId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialBatch, setMaterialBatch] = useState('');
  const [materialSubject, setMaterialSubject] = useState('');
  const [rosterHw, setRosterHw] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [libraryTab, setLibraryTab] = useState<'homework' | 'notes'>('homework');

  const fetchData = async () => {
    const [hw, sm, b, s] = await Promise.all([
      api.getHomework().catch(() => []),
      api.getStudyMaterials().catch(() => []),
      api.getBatches().catch(() => []),
      api.getSubjects().catch(() => [])
    ]);
    if (Array.isArray(hw)) setHomeworkList(hw);
    if (Array.isArray(sm)) setMaterialsList(sm);
    if (Array.isArray(b)) setBatches(b);
    if (Array.isArray(s)) setSubjects(s);
  };

  useEffect(() => { fetchData(); }, []);
  useApiCacheSync<any[]>('/homework', rows => { if (Array.isArray(rows)) setHomeworkList(rows); });
  useApiCacheSync<any[]>('/study-materials', rows => { if (Array.isArray(rows)) setMaterialsList(rows); });

  const openRoster = async (hw: any) => {
    try {
      const data = await api.getHomeworkSubmissions(hw.id);
      setRosterHw(hw);
      setRoster(data.roster || []);
    } catch (err: any) {
      showToast(err.message || 'Could not load roster.', 'error');
    }
  };

  const saveRoster = async () => {
    if (!rosterHw) return;
    try {
      await api.saveHomeworkSubmissions(rosterHw.id, roster.map(r => ({
        studentId: r.studentId,
        status: r.status,
        note: r.note
      })));
      showToast('Submissions saved.', 'success');
      setRosterHw(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Could not save.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Homework & study materials</h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Counts are real. Empty means nobody has been marked yet.</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-secondary" onClick={() => exportToCSV('Homework', homeworkList.map(h => ({ Title: h.title, Batch: h.batch?.name, Due: h.due_date, Done: `${h.doneCount || 0}/${h.totalSubmissions || 0}` })))}>
            <Download size={16} /> Export
          </button>
          <button className="btn-secondary" onClick={() => { setLibraryTab('notes'); setIsMaterialOpen(true); }}>Add notes</button>
          <button className="btn-primary" onClick={() => { setLibraryTab('homework'); setIsModalOpen(true); }}><Plus size={16} /> Assignment</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', padding: 6, borderRadius: 12, border: '1px solid #E2E8F0', width: 'fit-content' }}>
        <button type="button" className={libraryTab === 'homework' ? 'btn-primary' : 'btn-secondary'} onClick={() => setLibraryTab('homework')}>Assignments ({homeworkList.length})</button>
        <button type="button" className={libraryTab === 'notes' ? 'btn-primary' : 'btn-secondary'} onClick={() => setLibraryTab('notes')}>Notes library ({materialsList.length})</button>
      </div>

      {libraryTab === 'homework' && (homeworkList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <FileText size={44} color="#94A3B8" />
          <h3>No homework yet</h3>
          <p style={{ color: '#64748B' }}>Create an assignment with a batch, subject, and due date.</p>
        </div>
      ) : (
        <div className="card-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {homeworkList.map(item => (
            <div key={item.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="badge badge-primary">{item.batch?.name || '—'}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>Due {item.due_date}</span>
              </div>
              <h3 style={{ margin: '8px 0 4px' }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B' }}>{item.description}</p>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                {item.doneCount || 0}/{item.totalSubmissions || 0} done
                {item.isOverdue ? ' · overdue' : ''}
              </div>
              <button className="btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => openRoster(item)}>Track submissions</button>
            </div>
          ))}
        </div>
      ))}

      {libraryTab === 'notes' && (materialsList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <h3>No study notes yet</h3>
          <p style={{ color: '#64748B' }}>Upload a Drive/PDF link attached to a batch and subject. Teacher is taken from the batch.</p>
        </div>
      ) : (
        <div className="card-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {materialsList.map(m => (
            <div key={m.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span className="badge badge-gray">{m.batch?.name || '—'}</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</span>
              </div>
              <h3 style={{ margin: 0 }}>{m.title}</h3>
              <div style={{ fontSize: 12, color: '#64748B' }}>{m.subject?.name || '—'} · {m.teacher?.user?.full_name || 'Unassigned'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <a className="btn-secondary btn-sm" href={m.file_url} target="_blank" rel="noreferrer">Open notes</a>
                <button className="btn-secondary btn-sm" style={{ color: '#DC2626' }} onClick={async () => {
                  if (!window.confirm('Delete these notes?')) return;
                  setMaterialsList(prev => prev.filter(row => row.id !== m.id));
                  try {
                    await api.deleteStudyMaterial(m.id);
                    showToast('Notes deleted.', 'success');
                  } catch (err: any) {
                    showToast(err.message || 'Could not delete.', 'error');
                    fetchData();
                  }
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>New assignment</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createHomework({ title, description, batchId, subjectId, dueDate });
                  showToast('Assignment posted.', 'success');
                  setIsModalOpen(false);
                  setTitle(''); setDescription('');
                  fetchData();
                } catch (err: any) {
                  showToast(err.message || 'Could not create homework.', 'error');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}
            >
              <input className="form-input" required placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
              <select className="form-input" required value={batchId} onChange={e => setBatchId(e.target.value)}>
                <option value="">Batch</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="form-input" required value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">Subject</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="form-input" required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              <textarea className="form-input" rows={3} placeholder="Instructions" value={description} onChange={e => setDescription(e.target.value)} />
              <button className="btn-primary" type="submit">Post</button>
            </form>
          </div>
        </div>
      )}

      {isMaterialOpen && (
        <div className="modal-backdrop" onClick={() => setIsMaterialOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3>Study notes</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createStudyMaterial({ title: materialTitle, fileUrl: materialUrl, batchId: materialBatch, subjectId: materialSubject });
                  showToast('Notes saved.', 'success');
                  setIsMaterialOpen(false);
                  fetchData();
                } catch (err: any) {
                  showToast(err.message || 'Need batch, subject, and a real file URL.', 'error');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <input className="form-input" required placeholder="Title" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} />
              <input className="form-input" required placeholder="https://… file or drive link" value={materialUrl} onChange={e => setMaterialUrl(e.target.value)} />
              <select className="form-input" required value={materialBatch} onChange={e => setMaterialBatch(e.target.value)}>
                <option value="">Batch</option>
                {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="form-input" required value={materialSubject} onChange={e => setMaterialSubject(e.target.value)}>
                <option value="">Subject</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="btn-primary" type="submit">Save</button>
            </form>
          </div>
        </div>
      )}

      {rosterHw && (
        <div className="modal-backdrop" onClick={() => setRosterHw(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '80vh', overflow: 'auto' }}>
            <h3>{rosterHw.title}</h3>
            <p style={{ color: '#64748B' }}>{roster.filter(r => r.status === 'done' || r.status === 'submitted').length}/{roster.length} done</p>
            <button className="btn-secondary btn-sm" onClick={() => setRoster(prev => prev.map(r => ({ ...r, status: 'done' })))}>
              <Check size={14} /> Mark all done
            </button>
            {roster.map(row => (
              <div key={row.studentId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span>{row.student?.full_name}</span>
                <select className="form-input" style={{ width: 140 }} value={row.status} onChange={e => setRoster(prev => prev.map(r => r.studentId === row.studentId ? { ...r, status: e.target.value } : r))}>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                  <option value="late">Late</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setRosterHw(null)}>Close</button>
              <button className="btn-primary" onClick={saveRoster}>Save roster</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
