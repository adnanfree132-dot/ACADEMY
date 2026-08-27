import React, { useState } from 'react';
import { Announcement } from '../types';
import { Bell, Plus, Calendar, AlertCircle, X, Megaphone, Users, GraduationCap, UserCheck } from 'lucide-react';
import { ModernSelect } from '../components/ModernSelect';

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
      {/* Header */}
      <div className="directory-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Notice Board & Announcements</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Publish notices to students, parents, and teaching staff</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Post Announcement
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {announcements.map(notice => (
          <div key={notice.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notice.urgent && <span className="badge badge-red"><AlertCircle size={12} /> Urgent Notice</span>}
                <span className="badge badge-blue">Audience: {notice.targetAudience}</span>
              </div>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Posted on {notice.date}</span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{notice.title}</h3>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{notice.content}</p>

            <div style={{ fontSize: 12, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
              Author: <strong>{notice.author || 'Administration'}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Island Announcement Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            {/* Island 1: Floating Header */}
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 20px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-emerald">Notice</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Post Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Form Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Notice Title *</label>
                  <input className="form-input" required placeholder="e.g. Academy Winter Break Schedule" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Content Details *</label>
                  <textarea className="form-input" required rows={4} placeholder="Type announcement message..." value={content} onChange={e => setContent(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Target Audience</label>
                  <ModernSelect
                    value={targetAudience}
                    onChange={setTargetAudience}
                    options={[
                      { value: 'All', label: 'All (Everyone)', icon: <Megaphone size={14} color="#475569" /> },
                      { value: 'Teachers', label: 'Teachers Only', icon: <Users size={14} color="#475569" /> },
                      { value: 'Students', label: 'Students Only', icon: <GraduationCap size={14} color="#475569" /> },
                      { value: 'Parents', label: 'Parents Only', icon: <UserCheck size={14} color="#475569" /> }
                    ]}
                    zIndex={1200}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 9999 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ borderRadius: 9999 }}>
                    ✓ Publish Announcement
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
