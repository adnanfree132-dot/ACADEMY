import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { BookOpen, Plus, Pencil, Trash2, X, Search, Code2, Tag } from 'lucide-react';
import { api } from '../api/apiClient';

interface SubjectsViewProps {
  subjects: Subject[];
  onRefresh?: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ subjects, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setFormName('');
    setFormCode('');
    setIsAddModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    try {
      await api.createSubject({ name: formName.trim(), code: formCode.trim().toUpperCase() });
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error creating subject');
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !formName.trim() || !formCode.trim()) return;

    try {
      await api.updateSubject(editingSubject.id, { name: formName.trim(), code: formCode.trim().toUpperCase() });
      setEditingSubject(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating subject');
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm(`Are you sure you want to delete "${subject.name}" (${subject.code})?`)) return;
    try {
      await api.deleteSubject(subject.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting subject');
    }
  };

  // Color palette for subject cards
  const colors = [
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#3B82F6' },
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '#22C55E' },
    { bg: '#FDF4FF', border: '#E9D5FF', text: '#7E22CE', icon: '#A855F7' },
    { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', icon: '#F97316' },
    { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#EF4444' },
    { bg: '#F0F9FF', border: '#A5F3FC', text: '#155E75', icon: '#06B6D4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Subject Catalog</h2>
          <p style={{ fontSize: 13, color: '#64748B' }}>Manage academic subjects, assign them to classes, and link to teachers</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          className="form-input"
          placeholder="Search subjects by name or code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{subjects.length}</div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Subjects</div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {filteredSubjects.map((subject, index) => {
            const color = colors[index % colors.length];
            return (
              <div
                key={subject.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderLeft: `4px solid ${color.border}`,
                  background: '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: color.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <BookOpen size={18} color={color.icon} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{subject.name}</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: color.text,
                        background: color.bg, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 2
                      }}>
                        {subject.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => openEdit(subject)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1',
                      background: '#F8FAFC', color: '#334155', fontWeight: 700, fontSize: 11,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Pencil size={11} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(subject)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA',
                      background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <BookOpen size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No Subjects Created Yet</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Click "Add Subject" to create your first academic subject (e.g., Mathematics, Physics, English).
          </p>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Add New Subject</h3>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Name</label>
                <input className="form-input" placeholder="e.g. Mathematics" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Code</label>
                <input
                  className="form-input"
                  placeholder="e.g. MATH-101"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Unique identifier code for the subject</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">✓ Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="modal-backdrop" onClick={() => setEditingSubject(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Edit Subject</h3>
              <button className="modal-close-btn" onClick={() => setEditingSubject(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubject} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Name</label>
                <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Code</label>
                <input
                  className="form-input"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingSubject(null)}>Cancel</button>
                <button type="submit" className="btn-primary">✓ Save Changes</button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
