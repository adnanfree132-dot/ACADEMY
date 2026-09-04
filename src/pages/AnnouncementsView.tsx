import React, { useState } from 'react';
import { Announcement } from '../types';
import { Bell, Plus, AlertCircle, X, Megaphone, Users, GraduationCap, UserCheck, Pin, Pencil, Trash2 } from 'lucide-react';
import { ModernSelect } from '../components/ModernSelect';
import { showToast } from '../lib/toast';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (data: Omit<Announcement, 'id' | 'date'>) => void;
  onUpdateAnnouncement?: (id: string, data: Partial<Announcement>) => void;
  onDeleteAnnouncement?: (id: string) => void;
}

const emptyForm = {
  title: '',
  content: '',
  targetAudience: 'all',
  urgent: false,
  pinned: false,
  scheduledFor: ''
};

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (notice: Announcement) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      targetAudience: (notice.targetAudience || 'all').toLowerCase(),
      urgent: Boolean(notice.urgent),
      pinned: Boolean(notice.pinned),
      scheduledFor: notice.scheduledFor ? String(notice.scheduledFor).slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      targetAudience: form.targetAudience,
      urgent: form.urgent,
      pinned: form.pinned,
      scheduledFor: form.scheduledFor || null
    };
    if (editingId && onUpdateAnnouncement) {
      onUpdateAnnouncement(editingId, payload);
      showToast('Announcement updated', 'success');
    } else {
      onAddAnnouncement(payload);
      showToast('Announcement published', 'success');
    }
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleDelete = (notice: Announcement) => {
    if (!onDeleteAnnouncement) return;
    if (!window.confirm(`Delete “${notice.title}”? This cannot be undone.`)) return;
    onDeleteAnnouncement(notice.id);
    showToast('Announcement deleted', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="directory-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Notice Board</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Pin, schedule, and notify staff when a notice goes live</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Post announcement
          </button>
        </div>
      </div>

      {announcements.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: '#64748B' }}>
          No notices yet. Publish one for students, parents, or staff.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {announcements.map(notice => (
          <div key={notice.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, border: notice.pinned ? '1px solid #FDBA74' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {notice.pinned && <span className="badge badge-amber"><Pin size={12} /> Pinned</span>}
                {notice.urgent && <span className="badge badge-red"><AlertCircle size={12} /> Urgent</span>}
                <span className="badge badge-blue">Audience: {notice.targetAudience}</span>
                {notice.scheduledFor && new Date(notice.scheduledFor).getTime() > Date.now() && (
                  <span className="badge badge-gray">Scheduled {String(notice.scheduledFor).replace('T', ' ').slice(0, 16)}</span>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Posted {notice.date}</span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{notice.title}</h3>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{notice.content}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8, gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Author: <strong>{notice.author || 'Administration'}</strong></span>
              <div style={{ display: 'flex', gap: 8 }}>
                {onUpdateAnnouncement && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => onUpdateAnnouncement(notice.id, { pinned: !notice.pinned })}>
                    <Pin size={12} /> {notice.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {onUpdateAnnouncement && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(notice)}>
                    <Pencil size={12} /> Edit
                  </button>
                )}
                {onDeleteAnnouncement && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => handleDelete(notice)} style={{ color: '#DC2626' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 20px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-emerald">Notice</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{editingId ? 'Edit announcement' : 'Post announcement'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Notice title *</label>
                  <input className="form-input" required placeholder="e.g. Campus closed Friday" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Content *</label>
                  <textarea className="form-input" required rows={4} placeholder="Type the notice…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Audience</label>
                  <ModernSelect
                    value={form.targetAudience}
                    onChange={val => setForm({ ...form, targetAudience: val })}
                    options={[
                      { value: 'all', label: 'Everyone', icon: <Megaphone size={14} color="#475569" /> },
                      { value: 'teachers', label: 'Teachers', icon: <Users size={14} color="#475569" /> },
                      { value: 'students', label: 'Students', icon: <GraduationCap size={14} color="#475569" /> },
                      { value: 'parents', label: 'Parents', icon: <UserCheck size={14} color="#475569" /> }
                    ]}
                    zIndex={1200}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Schedule (optional)</label>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={form.scheduledFor}
                    onChange={e => setForm({ ...form, scheduledFor: e.target.value })}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.urgent} onChange={e => setForm({ ...form, urgent: e.target.checked })} />
                  Mark urgent
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
                  Pin to top
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 9999 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ borderRadius: 9999 }}>
                    {editingId ? 'Save changes' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
