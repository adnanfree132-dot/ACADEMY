import React, { useMemo, useState } from 'react';
import { CRMLead } from '../types';
import { Plus, Phone, X, MessageSquare, Calendar, UserPlus } from 'lucide-react';
import { api } from '../api/apiClient';
import { showToast } from '../lib/toast';
import { openWhatsAppLink } from '../utils/whatsappHelper';

const COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'new', label: 'New', statuses: ['new', 'New', 'New Inquiry'] },
  { key: 'contacted', label: 'Contacted', statuses: ['contacted', 'Contacted', 'Follow Up'] },
  { key: 'trial', label: 'Trial', statuses: ['trial', 'Trial Class', 'interested', 'demo'] },
  { key: 'converted', label: 'Converted', statuses: ['converted', 'Converted', 'Enrolled', 'admitted'] },
  { key: 'lost', label: 'Lost', statuses: ['lost', 'Closed', 'not_interested'] }
];

interface CrmViewProps {
  leads: CRMLead[];
  onAddLead: (data: any) => void;
  onConvertLead?: (lead: CRMLead) => void;
  onLeadsChanged?: () => void;
}

export const CrmView: React.FC<CrmViewProps> = ({ leads, onAddLead, onConvertLead, onLeadsChanged }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [source, setSource] = useState('Walk-in');
  const [followUpDate, setFollowUpDate] = useState('');
  const [dupWarning, setDupWarning] = useState('');
  const [followNote, setFollowNote] = useState('');
  const [activeLead, setActiveLead] = useState<CRMLead | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, CRMLead[]> = {};
    COLUMNS.forEach(c => { map[c.key] = []; });
    leads.forEach(lead => {
      const col = COLUMNS.find(c => c.statuses.includes(lead.status) || c.statuses.includes((lead.status || '').toLowerCase()));
      map[col?.key || 'new'].push(lead);
    });
    return map;
  }, [leads]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({ studentName, parentName, phone, targetClass, source, followUpDate });
    setStudentName('');
    setParentName('');
    setPhone('');
    setTargetClass('');
    setIsModalOpen(false);
  };

  const moveLead = async (lead: CRMLead, status: string) => {
    if (status === 'converted') {
      onConvertLead?.(lead);
      return;
    }
    let lostReason: string | undefined;
    if (status === 'lost') {
      lostReason = window.prompt('Lost reason (price, distance, admitted elsewhere, silent)') || '';
      if (!lostReason) return;
    }
    try {
      await api.updateInquiry(lead.id, { status, lostReason });
      showToast('Inquiry updated.', 'success');
      onLeadsChanged?.();
    } catch (err: any) {
      showToast(err.message || 'Could not update inquiry.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Inquiries & admissions</h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Walk-in to enrolled. Convert opens the real student form.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Add inquiry</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, overflowX: 'auto' }}>
        {COLUMNS.map(col => (
          <div key={col.key} className="card" style={{ padding: 12, minHeight: 280, background: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>{col.label}</strong>
              <span className="badge badge-gray">{grouped[col.key].length}</span>
            </div>
            {grouped[col.key].map(lead => (
              <div key={lead.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{lead.studentName}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{lead.parentName || '—'} · {lead.phone}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{lead.targetClass || lead.gradeInterest || '—'}</div>
                {lead.followUpDate && <div style={{ fontSize: 11, color: '#B45309', marginTop: 4 }}><Calendar size={11} /> Follow-up {lead.followUpDate}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button className="btn-secondary btn-sm" onClick={() => window.open(`tel:${lead.phone}`)}><Phone size={12} /></button>
                  <button className="btn-secondary btn-sm" onClick={() => openWhatsAppLink(lead.phone, `Assalam o Alaikum, this is regarding ${lead.studentName}'s admission inquiry.`)}><MessageSquare size={12} /></button>
                  {col.key !== 'converted' && col.key !== 'lost' && (
                    <button className="btn-primary btn-sm" onClick={() => moveLead(lead, 'converted')}><UserPlus size={12} /> Convert</button>
                  )}
                </div>
                {col.key !== 'converted' && col.key !== 'lost' && (
                  <select
                    className="form-input"
                    style={{ marginTop: 8, fontSize: 12 }}
                    value=""
                    onChange={e => { if (e.target.value) moveLead(lead, e.target.value); }}
                  >
                    <option value="">Move to…</option>
                    <option value="contacted">Contacted</option>
                    <option value="trial">Trial</option>
                    <option value="lost">Lost</option>
                  </select>
                )}
                <button className="btn-secondary btn-sm" style={{ marginTop: 6, width: '100%' }} onClick={() => setActiveLead(lead)}>Follow-up note</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>New inquiry</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <input className="form-input" required placeholder="Student name" value={studentName} onChange={e => setStudentName(e.target.value)} />
              <input className="form-input" placeholder="Parent name" value={parentName} onChange={e => setParentName(e.target.value)} />
              <input
                className="form-input"
                required
                placeholder="Phone"
                value={phone}
                onChange={async e => {
                  setPhone(e.target.value);
                  if (e.target.value.replace(/\D/g, '').length >= 10) {
                    try {
                      const d = await api.findInquiryDuplicates(e.target.value);
                      const hits = [...(d.students || []), ...(d.inquiries || [])];
                      setDupWarning(hits.length ? `This phone already appears on ${hits.length} record(s). Siblings can share a number.` : '');
                    } catch { setDupWarning(''); }
                  }
                }}
              />
              {dupWarning && <div style={{ fontSize: 12, color: '#B45309' }}>{dupWarning}</div>}
              <input className="form-input" required placeholder="Class / course interest" value={targetClass} onChange={e => setTargetClass(e.target.value)} />
              <select className="form-input" value={source} onChange={e => setSource(e.target.value)}>
                <option>Walk-in</option>
                <option>Referral</option>
                <option>Facebook</option>
                <option>WhatsApp</option>
                <option>Board</option>
              </select>
              <input className="form-input" type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              <button className="btn-primary" type="submit">Save inquiry</button>
            </form>
          </div>
        </div>
      )}

      {activeLead && (
        <div className="modal-backdrop" onClick={() => setActiveLead(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>Follow-up · {activeLead.studentName}</h3>
            <textarea className="form-input" rows={3} value={followNote} onChange={e => setFollowNote(e.target.value)} placeholder="What happened on the call?" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button className="btn-secondary" onClick={() => setActiveLead(null)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                if (!followNote.trim()) return;
                try {
                  await api.addInquiryFollowUp(activeLead.id, { note: followNote.trim() });
                  await api.updateInquiry(activeLead.id, { status: 'contacted' });
                  showToast('Follow-up saved.', 'success');
                  setFollowNote('');
                  setActiveLead(null);
                  onLeadsChanged?.();
                } catch (err: any) {
                  showToast(err.message || 'Could not save follow-up.', 'error');
                }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
