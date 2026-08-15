import React, { useState } from 'react';
import { Teacher, Batch, Student } from '../types';
import { UserSquare2, Plus, Mail, Phone, BookOpen, Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import { AddTeacherModal } from '../components/AddTeacherModal';
import { TeacherProfileDrawer } from '../components/TeacherProfileDrawer';

interface TeachersViewProps {
  teachers: Teacher[];
  batches?: Batch[];
  students?: Student[];
  onOpenCreateModal?: () => void;
  onAddTeacher?: (teacherData: any) => void;
  onDeleteTeacher?: (id: string) => void;
  onEditTeacher?: (teacher: Teacher) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ teachers, batches = [], students = [], onOpenCreateModal, onAddTeacher, onDeleteTeacher, onEditTeacher }) => {
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherForDrawer, setSelectedTeacherForDrawer] = useState<Teacher | null>(null);


  // Edit Teacher Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editQual, setEditQual] = useState('');

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name || '');
    setEditEmail(teacher.email || '');
    setEditPhone(teacher.phone || '');
    setEditQual(teacher.qualification || teacher.assignedSubjects?.[0] || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const updated: Teacher = {
      ...editingTeacher,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      qualification: editQual.trim(),
      assignedSubjects: [editQual.trim()]
    };

    if (onEditTeacher) {
      onEditTeacher(updated);
    }
    setEditingTeacher(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Teachers & Faculty Members</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Faculty directory, assigned subjects, and teaching schedules</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={() => setIsAddTeacherModalOpen(true)}>
            <Plus size={16} /> Add Faculty Member
          </button>
        </div>
      </div>

      <div className="card-grid-3">
        {teachers.map(teacher => (
          <div
            key={teacher.id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
            onClick={() => setSelectedTeacherForDrawer(teacher)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
                  {teacher.name.charAt(0)}
                </div>

                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{teacher.name}</h3>
                  <span className="badge badge-blue" style={{ marginTop: 2 }}>
                    {teacher.assignedSubjects?.[0] || teacher.qualification || 'Faculty Member'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="table-action-group" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Edit Teacher"
                  onClick={() => openEditModal(teacher)}
                  style={{
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#475569'
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Delete Teacher"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                      if (onDeleteTeacher) onDeleteTeacher(teacher.id);
                    }
                  }}
                  style={{
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> {teacher.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {teacher.phone}</div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Assigned Batches</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {(teacher.assignedBatches && teacher.assignedBatches.length > 0) ? (
                  teacher.assignedBatches.map(b => (
                    <span key={b} className="badge badge-gray">{b}</span>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No batches assigned</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
              <ChevronRight size={12} /> View 360° Faculty Profile
            </div>
          </div>
        ))}
      </div>

      {/* Teacher 360° Profile Drawer */}
      {selectedTeacherForDrawer && (
        <TeacherProfileDrawer
          teacher={selectedTeacherForDrawer}
          batches={batches}
          students={students}
          onClose={() => setSelectedTeacherForDrawer(null)}
        />
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="modal-backdrop" onClick={() => setEditingTeacher(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Edit Faculty Member</h3>
              <button className="modal-close-btn" onClick={() => setEditingTeacher(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Full Name</label>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Qualification / Subject</label>
                <input className="form-input" placeholder="e.g. Subject Specialist / Qualification" value={editQual} onChange={e => setEditQual(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Email Address</label>
                  <input className="form-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Phone Number</label>
                  <input className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingTeacher(null)}>Cancel</button>
                <button type="submit" className="btn-primary">✓ Save Changes</button>

              </div>
            </form>
          </div>
        </div>
      )}

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        onAddTeacher={onAddTeacher || (() => {})}
      />
    </div>
  );
};


