import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckSquare, Square, Plus, Sparkles, FileText, Calendar } from 'lucide-react';
import { Batch } from '../types';
import { api } from '../api/apiClient';

interface SyllabusTrackerModalProps {
  batch: Batch;
  onClose: () => void;
}

export const SyllabusTrackerModal: React.FC<SyllabusTrackerModalProps> = ({
  batch,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'diary'>('syllabus');
  const [topics, setTopics] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newChapter, setNewChapter] = useState('Chapter 1');

  // Diary form state
  const [topicTaught, setTopicTaught] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');

  const loadData = async () => {
    try {
      const [syllabusRes, diaryRes] = await Promise.all([
        api.getBatchSyllabus(batch.id).catch(() => []),
        api.getBatchDiaries(batch.id).catch(() => [])
      ]);
      setTopics(Array.isArray(syllabusRes) ? syllabusRes : []);
      setDiaries(Array.isArray(diaryRes) ? diaryRes : []);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, [batch]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      await api.createSyllabusTopic(batch.id, { topicName: newTopicName.trim(), chapter: newChapter.trim() });
      setNewTopicName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error adding topic');
    }
  };

  const handleToggleTopic = async (topicId: string, currentStatus: boolean) => {
    try {
      await api.toggleSyllabusTopic(batch.id, topicId, !currentStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error updating topic status');
    }
  };

  const handleAddDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTaught.trim()) return;

    try {
      await api.createDailyDiary(batch.id, {
        topicTaught: topicTaught.trim(),
        homeworkAssigned: homeworkAssigned.trim() || 'None',
        teacherName: batch.instructor || batch.teacherName || 'Faculty'
      });
      setTopicTaught('');
      setHomeworkAssigned('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating daily diary');
    }
  };

  const coveredCount = topics.filter(t => t.isCovered).length;
  const progressPct = topics.length > 0 ? Math.round((coveredCount / topics.length) * 100) : 0;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      style={{ 
        zIndex: 1300, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 580, 
          width: '100%', 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none', 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}
      >
        {/* Island 1: Floating Dark Navy Header */}
        <div style={{ 
          background: '#0F172A', 
          color: '#FFFFFF', 
          padding: '16px 20px', 
          borderRadius: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Syllabus & Daily Class Diary</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{batch.name} • Curriculum & homework tracker</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFFFFF', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          
          {/* Tab Pill Bar */}
          <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 4, borderRadius: 9999 }}>
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 9999,
                border: 'none',
                background: activeTab === 'syllabus' ? '#0F172A' : 'transparent',
                color: activeTab === 'syllabus' ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📚 Syllabus Topics ({progressPct}%)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diary')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 9999,
                border: 'none',
                background: activeTab === 'diary' ? '#0F172A' : 'transparent',
                color: activeTab === 'diary' ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📖 Class Diary ({diaries.length})
            </button>
          </div>

          {/* TAB 1: SYLLABUS TRACKER */}
          {activeTab === 'syllabus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Progress Card */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  <span>Overall Curriculum Progress:</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>{coveredCount} of {topics.length} topics covered ({progressPct}%)</span>
                </div>
                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: '#10B981', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Add Topic Card */}
              <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <input className="form-input" placeholder="Chapter..." value={newChapter} onChange={e => setNewChapter(e.target.value)} style={{ width: 110, fontSize: 12 }} />
                <input className="form-input" placeholder="Topic name (e.g. Quadratic Equations)..." value={newTopicName} onChange={e => setNewTopicName(e.target.value)} required style={{ flex: 1, fontSize: 12 }} />
                <button 
                  type="submit" 
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              {/* Topic Checklist */}
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topics.length > 0 ? (
                  topics.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTopic(t.id, t.isCovered)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        background: t.isCovered ? '#F0FDF4' : '#F8FAFC',
                        border: t.isCovered ? '1px solid #BBF7D0' : '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.isCovered ? <CheckSquare size={16} color="#15803D" /> : <Square size={16} color="#94A3B8" />}
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: t.isCovered ? '#15803D' : '#0F172A', textDecoration: t.isCovered ? 'line-through' : 'none' }}>
                            {t.topicName}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>({t.chapter})</span>
                        </div>
                      </div>
                      {t.isCovered && <span className="badge badge-green" style={{ fontSize: 10 }}>Covered</span>}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 12 }}>
                    No syllabus topics added yet. Use the form above to add course topics.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY CLASS DIARY */}
          {activeTab === 'diary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Add Diary Entry Form */}
              <form onSubmit={handleAddDiary} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <input className="form-input" placeholder="Topic taught today..." value={topicTaught} onChange={e => setTopicTaught(e.target.value)} required style={{ fontSize: 12 }} />
                <input className="form-input" placeholder="Homework assigned (optional)..." value={homeworkAssigned} onChange={e => setHomeworkAssigned(e.target.value)} style={{ fontSize: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    style={{
                      padding: '7px 18px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Save Diary Entry
                  </button>
                </div>
              </form>

              {/* Diary Logs */}
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {diaries.length > 0 ? (
                  diaries.map(d => (
                    <div key={d.id} style={{ background: '#FFFFFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>
                        <span>🗓️ {d.date} — {d.teacherName}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>📖 Taught: {d.topicTaught}</div>
                      {d.homeworkAssigned && d.homeworkAssigned !== 'None' && (
                        <div style={{ color: '#2563EB', marginTop: 2, fontWeight: 600 }}>📝 Homework: {d.homeworkAssigned}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontSize: 12 }}>
                    No daily diary entries logged yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Island 4: Floating Right-Aligned Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            ✓ Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
