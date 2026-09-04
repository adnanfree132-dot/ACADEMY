import React, { useEffect, useState } from 'react';
import { X, Save, Award } from 'lucide-react';
import { api, peekApiCache } from '../api/apiClient';
import { showToast } from '../lib/toast';

interface MarksheetEntryModalProps {
  test: any | null;
  students?: any[];
  onClose: () => void;
  onSaved: () => void;
}

export const MarksheetEntryModal: React.FC<MarksheetEntryModalProps> = ({
  test,
  onClose,
  onSaved
}) => {
  if (!test) return null;
  const cachedRoster = peekApiCache<any>(`/tests/${test.id}/roster`);
  const [roster, setRoster] = useState<any[]>(() => (cachedRoster?.roster || []).map((row: any) => ({
    studentId: row.studentId,
    name: row.student?.full_name || row.name || '',
    marks: row.marks === null || row.marks === undefined ? '' : String(row.marks),
    remark: row.remark || '',
    status: row.status || ''
  })));
  const [loading, setLoading] = useState(roster.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const published = !!test.is_published;
  const max = Number(test.max_marks) || 100;
  const pass = Number(test.pass_marks) || 40;

  useEffect(() => {
    api.getTestRoster(test.id).then(data => {
      setRoster((data.roster || []).map((row: any) => ({
        studentId: row.studentId,
        name: row.student?.full_name || '',
        marks: row.marks === null || row.marks === undefined ? '' : String(row.marks),
        remark: row.remark || '',
        status: row.status || ''
      })));
      setLoading(false);
    }).catch(err => {
      showToast(err.message || 'Could not load batch roster.', 'error');
      setLoading(false);
    });
  }, [test.id]);

  const gradeOf = (score: number) => {
    if (score < pass) return 'F';
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    return 'F';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (published) {
      showToast('Unpublish this test before editing marks.', 'error');
      return;
    }
    const payload = roster
      .filter(r => r.status === 'absent' || r.status === 'exempt' || String(r.marks).trim() !== '')
      .map(r => ({
        studentId: r.studentId,
        marks: r.status === 'absent' || r.status === 'exempt' ? 0 : Number(r.marks),
        remark: r.remark,
        status: r.status || 'scored'
      }));
    if (payload.some(p => p.status === 'scored' && (Number.isNaN(p.marks) || p.marks < 0 || p.marks > max))) {
      showToast(`Marks must be 0–${max}.`, 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.saveTestMarks(test.id, payload);
      showToast('Marksheet saved.', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Could not save marks.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="floating-island-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div className="floating-island-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div style={{ background: '#0F172A', color: '#FFF', padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0 }}>{test.title} marksheet</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              {test.batch?.name} · max {max} · pass {pass}{published ? ' · published (locked)' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#FFF' }}><X /></button>
        </div>
        <form onSubmit={handleSave} style={{ background: '#FFF', borderRadius: 16, padding: 16, marginTop: 10, maxHeight: '70vh', overflow: 'auto' }}>
          {loading ? <p>Loading enrolled students…</p> : roster.length === 0 ? (
            <p>No enrolled students in this batch.</p>
          ) : roster.map((row, idx) => (
            <div key={row.studentId} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 120px 1.4fr 50px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontWeight: 700 }}>{row.name}</span>
              <input
                className="form-input"
                inputMode="decimal"
                disabled={published || row.status === 'absent' || row.status === 'exempt'}
                value={row.marks}
                onChange={e => setRoster(prev => prev.map(r => r.studentId === row.studentId ? { ...r, marks: e.target.value, status: 'scored' } : r))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const next = document.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]')[idx + 1];
                    next?.focus();
                  }
                }}
              />
              <select
                className="form-input"
                disabled={published}
                value={row.status || 'scored'}
                onChange={e => setRoster(prev => prev.map(r => r.studentId === row.studentId ? { ...r, status: e.target.value } : r))}
              >
                <option value="scored">Scored</option>
                <option value="absent">Absent</option>
                <option value="exempt">Exempt</option>
              </select>
              <input className="form-input" disabled={published} placeholder="Remark" value={row.remark} onChange={e => setRoster(prev => prev.map(r => r.studentId === row.studentId ? { ...r, remark: e.target.value } : r))} />
              <span style={{ fontWeight: 800 }}>{row.status === 'scored' && row.marks !== '' ? gradeOf(Number(row.marks)) : '—'}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" disabled={published || isSubmitting}><Save size={14} /> Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
