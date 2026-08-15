import React, { useState } from 'react';
import { Announcement } from '../types';
import { Bell, Plus, Calendar, AlertCircle, X } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (data: any) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements, onAddAnnouncement }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAnnouncement({ title, content, targetAudience });
    setTitle('');
    setContent('');
    setIsModalOpen(false);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Notice Board & Announcements</h2>
          <p style={{ fontSize: 13, color: '#64748B' }}>Publish notices to students, parents, and teaching staff</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Post Announcement
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {announcements.map(notice => (
          <div key={notice.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notice.urgent && <span className="badge badge-red"><AlertCircle size={12} /> Urgent Notice</span>}
                <span className="badge badge-blue">Audience: {notice.targetAudience}</span>
              </div>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Posted on {notice.date}</span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{notice.title}</h3>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{notice.content}</p>

            <div style={{ fontSize: 12, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
              Author: <strong>{notice.author}</strong>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Post Announcement</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" required rows={4} value={content} onChange={e => setContent(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Audience</label>
                <CustomSelect
                  value={targetAudience}
                  onChange={setTargetAudience}
                  options={[
                    { value: 'All', label: 'All' },
                    { value: 'Teachers', label: 'Teachers' },
                    { value: 'Students', label: 'Students' },
                    { value: 'Parents', label: 'Parents' }
                  ]}
                />
              </div>
              <button type="submit" className="btn-primary w-full" style={{ marginTop: 16, height: 44, justifyContent: 'center' }}>
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
