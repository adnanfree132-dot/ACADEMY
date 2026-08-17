import React, { useState, useEffect } from 'react';
import { Batch, Teacher, Student, Subject } from '../types';
import { BookOpen, Plus, Users, Clock, MapPin, Pencil, Trash2, X, ChevronRight, Tag, UserPlus, UserMinus } from 'lucide-react';
import { CreateBatchModal } from '../components/CreateBatchModal';
import { SubstituteTeacherModal } from '../components/SubstituteTeacherModal';
import { SplitClassModal } from '../components/SplitClassModal';
import { SyllabusTrackerModal } from '../components/SyllabusTrackerModal';
import { api } from '../api/apiClient';
import { UserCheck, GitBranch } from 'lucide-react';

interface BatchesViewProps {
  batches: Batch[];
  teachers?: Teacher[];
  subjects?: Subject[];
  students?: Student[];
  onOpenCreateModal?: () => void;
  onAddBatch?: (batchData: any) => void;
  onDeleteBatch?: (id: string) => void;
  onEditBatch?: (batch: Batch) => void;
  onRefresh?: () => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({ batches, teachers = [], subjects = [], students = [], onOpenCreateModal, onAddBatch, onDeleteBatch, onEditBatch, onRefresh }) => {
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [manageSubjectsBatch, setManageSubjectsBatch] = useState<Batch | null>(null);
  const [substituteBatch, setSubstituteBatch] = useState<Batch | null>(null);
  const [splitBatchState, setSplitBatchState] = useState<Batch | null>(null);
  const [syllabusBatchState, setSyllabusBatchState] = useState<Batch | null>(null);




  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [editCapacity, setEditCapacity] = useState('30');
  const [editTeacherId, setEditTeacherId] = useState('');

  // Batch Detail State
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [batchSubjects, setBatchSubjects] = useState<any[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  // Manage Subjects State
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [batchSubjectsForManage, setBatchSubjectsForManage] = useState<any[]>([]);

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setEditName(batch.name || '');
    setEditRoom(batch.room || '');
    setEditTiming(batch.schedule || batch.timing || '');
    setEditCapacity(String(batch.maxCapacity || batch.capacity || 30));
    // Try to find the teacher ID from the teachers list
    const matchedTeacher = teachers.find(t => t.name === batch.teacherName || t.name === batch.instructor);
    setEditTeacherId(matchedTeacher?.id || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const selectedTeacher = teachers.find(t => t.id === editTeacherId);
    const updated: Batch = {
      ...editingBatch,
      name: editName.trim(),
      room: editRoom.trim(),
      schedule: editTiming.trim(),
      timing: editTiming.trim(),
      capacity: Number(editCapacity) || 30,
      maxCapacity: Number(editCapacity) || 30,
      teacherName: selectedTeacher?.name || editingBatch.teacherName || 'Unassigned',
      instructor: selectedTeacher?.name || editingBatch.instructor || 'Unassigned'
    };

    if (onEditBatch) {
      onEditBatch(updated);
    }

    // Also update teacher_id on backend
    if (editTeacherId) {
      api.updateBatch(editingBatch.id, { teacherId: editTeacherId, name: editName.trim(), capacity: Number(editCapacity), timing: editTiming.trim(), room: editRoom.trim() }).catch(() => {});
    }

    setEditingBatch(null);
  };

  // Batch Detail - load enrolled students and subjects
  const openBatchDetail = async (batch: Batch) => {
    setSelectedBatch(batch);
    try {
      const [enrolledStudents, batchSubs] = await Promise.all([
        api.getBatchStudents(batch.id).catch(() => []),
        api.getBatchSubjects(batch.id).catch(() => [])
      ]);
      setBatchStudents(Array.isArray(enrolledStudents) ? enrolledStudents : []);
      setBatchSubjects(Array.isArray(batchSubs) ? batchSubs : []);
    } catch {
      setBatchStudents([]);
      setBatchSubjects([]);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedBatch || !enrollStudentId) return;
    try {
      await api.enrollStudentInBatch(selectedBatch.id, enrollStudentId);
      setEnrollStudentId('');
      openBatchDetail(selectedBatch); // refresh
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error enrolling student');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedBatch) return;
    if (!window.confirm('Remove this student from the batch?')) return;
    try {
      await api.removeStudentFromBatch(selectedBatch.id, studentId);
      openBatchDetail(selectedBatch);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error removing student');
    }
  };

  // Manage Subjects
  const openManageSubjects = async (batch: Batch) => {
    setManageSubjectsBatch(batch);
    setAssignSubjectId('');
    setAssignTeacherId('');
    try {
      const subs = await api.getBatchSubjects(batch.id).catch(() => []);
      setBatchSubjectsForManage(Array.isArray(subs) ? subs : []);
    } catch {
      setBatchSubjectsForManage([]);
    }
  };

  const handleAssignSubject = async () => {
    if (!manageSubjectsBatch || !assignSubjectId || !assignTeacherId) return;
    try {
      await api.assignBatchSubject(manageSubjectsBatch.id, { subjectId: assignSubjectId, teacherId: assignTeacherId });
      setAssignSubjectId('');
      setAssignTeacherId('');
      openManageSubjects(manageSubjectsBatch);
    } catch (err: any) {
      alert(err.message || 'Error assigning subject');
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!manageSubjectsBatch) return;
    try {
      await api.removeBatchSubject(manageSubjectsBatch.id, subjectId);
      openManageSubjects(manageSubjectsBatch);
    } catch (err: any) {
      alert(err.message || 'Error removing subject');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Classes & Batches Management</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Active academic sections, capacity limits, and room allocations</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={() => setIsCreateBatchModalOpen(true)}>
            <Plus size={16} /> Create New Batch
          </button>
        </div>
      </div>

      <div className="card-grid-3">
        {batches.map(batch => (
          <div key={batch.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: 16 }} onClick={() => openBatchDetail(batch)}>
            {/* Card Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-blue">{batch.code || batch.classLevel || 'Class'}</span>
                <span className="badge badge-green">Active</span>
              </div>
              
              {/* Desktop Direct Icons */}
              <div className="table-action-group desktop-only" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Assign Substitute / Schedule Cover"
                  onClick={() => setSubstituteBatch(batch)}
                  style={{ border: '1px solid #FDE68A', background: '#FEF3C7', color: '#D97706' }}
                >
                  <UserCheck size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Split Class Section"
                  onClick={() => setSplitBatchState(batch)}
                  style={{ border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#334155' }}
                >
                  <GitBranch size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Track Syllabus Progress & Class Diary"
                  onClick={() => setSyllabusBatchState(batch)}
                  style={{ border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB' }}
                >
                  <BookOpen size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Manage Subjects"
                  onClick={() => openManageSubjects(batch)}
                  style={{ border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A' }}
                >
                  <Tag size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Edit Class"
                  onClick={() => openEditModal(batch)}
                  style={{ border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Delete Class"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${batch.name}?`)) {
                      if (onDeleteBatch) onDeleteBatch(batch.id);
                    }
                  }}
                  style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Mobile Quick Edit/Delete */}
              <div className="mobile-only" style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="table-icon-btn"
                  onClick={() => openEditModal(batch)}
                  style={{ border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${batch.name}?`)) {
                      if (onDeleteBatch) onDeleteBatch(batch.id);
                    }
                  }}
                  style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>{batch.name}</h3>
              <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                Instructor: {batch.instructor || batch.teacherName || 'Unassigned'}
              </p>
            </div>

            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
              {batch.room ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="#64748B" /> Room: {batch.room}
                </div>
              ) : null}

              {(batch.schedule || batch.timing) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#64748B" /> {batch.schedule || batch.timing}
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} color="#64748B" /> {batch.studentsCount || 0} Enrolled Students
              </div>
            </div>

            {/* Mobile Quick Action Buttons Bar */}
            <div className="mobile-only" style={{ display: 'flex', gap: 6, borderTop: '1px solid #F1F5F9', paddingTop: 10 }} onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => openManageSubjects(batch)}
                style={{ flex: 1, justifyContent: 'center', fontSize: 11.5, padding: '7px 8px' }}
              >
                <Tag size={12} color="#16A34A" /> Subjects
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setSyllabusBatchState(batch)}
                style={{ flex: 1, justifyContent: 'center', fontSize: 11.5, padding: '7px 8px' }}
              >
                <BookOpen size={12} color="#2563EB" /> Syllabus
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setSubstituteBatch(batch)}
                style={{ flex: 1, justifyContent: 'center', fontSize: 11.5, padding: '7px 8px' }}
              >
                <UserCheck size={12} color="#D97706" /> Cover
              </button>
            </div>

            {/* Click hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
              <ChevronRight size={12} /> Click to view enrolled students & details
            </div>
          </div>
        ))}
      </div>

      {/* ==================== Batch Detail Drawer ==================== */}
      {selectedBatch && (
        <div className="modal-backdrop" onClick={() => setSelectedBatch(null)} style={{ zIndex: 1100 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 600,
              background: '#FFFFFF', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              animation: 'slideInRight 0.25s ease-out'
            }}
          >
            {/* Header */}
            <div style={{ background: '#0F172A', color: '#FFF', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: 6 }}>{selectedBatch.code || selectedBatch.classLevel}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginTop: 4 }}>{selectedBatch.name}</h2>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                  Instructor: {selectedBatch.instructor || selectedBatch.teacherName || 'Unassigned'}
                </p>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Subjects Section */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>📚 Assigned Subjects</h4>
              {batchSubjects.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {batchSubjects.map((bs: any) => (
                    <span key={bs.subject?.id} style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                      background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0'
                    }}>
                      {bs.subject?.name} ({bs.subject?.code}) — {bs.teacher?.user?.full_name || 'TBD'}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No subjects assigned yet. Use the "Subjects" button on the card.</p>
              )}
            </div>

            {/* Enrolled Students Section */}
            <div style={{ padding: '16px 24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>👥 Enrolled Students ({batchStudents.length})</h4>
              </div>

              {/* Enroll Student */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <select
                  className="form-input"
                  value={enrollStudentId}
                  onChange={e => setEnrollStudentId(e.target.value)}
                  style={{ flex: 1, fontSize: 13 }}
                >
                  <option value="">— Select a student to enroll —</option>
                  {students
                    .filter(s => !batchStudents.some((bs: any) => bs.student?.id === s.id || bs.student_id === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.regNo})</option>
                    ))
                  }
                </select>
                <button className="btn-primary" onClick={handleEnrollStudent} disabled={!enrollStudentId} style={{ fontSize: 12, padding: '6px 14px' }}>
                  <UserPlus size={14} /> Enroll
                </button>
              </div>

              {/* Students Table */}
              {batchStudents.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Reg No</th>
                        <th>Phone</th>
                        <th>Enrolled On</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchStudents.map((enrollment: any) => {
                        const stu = enrollment.student || {};
                        return (
                          <tr key={enrollment.id || stu.id}>
                            <td><strong style={{ color: '#0F172A' }}>{stu.full_name || 'Unknown'}</strong></td>
                            <td><span style={{ fontSize: 12, color: '#64748B' }}>{stu.admission_no || '—'}</span></td>
                            <td>{stu.phone || '—'}</td>
                            <td><span style={{ fontSize: 12, color: '#64748B' }}>{enrollment.enrolled_on ? String(enrollment.enrolled_on).split('T')[0] : '—'}</span></td>
                            <td>
                              <button
                                onClick={() => handleRemoveStudent(stu.id)}
                                style={{
                                  padding: '3px 8px', borderRadius: 6, border: '1px solid #FECACA',
                                  background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <UserMinus size={11} /> Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  <Users size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>No students enrolled in this batch yet.</p>
                  <p style={{ fontSize: 12 }}>Use the dropdown above to enroll students.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Manage Subjects Modal ==================== */}
      {manageSubjectsBatch && (
        <div className="modal-backdrop" onClick={() => setManageSubjectsBatch(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                📚 Manage Subjects — {manageSubjectsBatch.name}
              </h3>
              <button className="modal-close-btn" onClick={() => setManageSubjectsBatch(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Current Assignments */}
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Currently Assigned</h4>
              {batchSubjectsForManage.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {batchSubjectsForManage.map((bs: any) => (
                    <div key={bs.subject?.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0'
                    }}>
                      <div>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{bs.subject?.name}</span>
                        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>({bs.subject?.code})</span>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Teacher: <strong>{bs.teacher?.user?.full_name || 'Unassigned'}</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSubject(bs.subject?.id)}
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: '1px solid #FECACA',
                          background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No subjects assigned to this batch yet.</p>
              )}
            </div>

            {/* Assign New Subject */}
            <div style={{ marginTop: 20, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Assign New Subject</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Subject</label>
                    <select className="form-input" value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)}>
                      <option value="">— Select Subject —</option>
                      {subjects
                        .filter(s => !batchSubjectsForManage.some((bs: any) => bs.subject?.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Taught By</label>
                    <select className="form-input" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
                      <option value="">— Select Teacher —</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.qualification || 'Faculty'})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleAssignSubject}
                  disabled={!assignSubjectId || !assignTeacherId}
                  style={{ alignSelf: 'flex-end', fontSize: 12, padding: '8px 16px' }}
                >
                  <Plus size={14} /> Assign Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Edit Class Modal ==================== */}
      {editingBatch && (
        <div className="modal-backdrop" onClick={() => setEditingBatch(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Edit Class / Batch</h3>
              <button className="modal-close-btn" onClick={() => setEditingBatch(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Class / Batch Name</label>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Room Allocation</label>
                  <input className="form-input" placeholder="e.g. Room 101" value={editRoom} onChange={e => setEditRoom(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Max Capacity</label>
                  <input className="form-input" type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Class Timing / Schedule</label>
                <input className="form-input" placeholder="e.g. 09:00 AM - 11:00 AM" value={editTiming} onChange={e => setEditTiming(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Assign Teacher / Instructor</label>
                <select className="form-input" value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)}>
                  <option value="">— No Teacher Assigned —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.qualification || 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingBatch(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#0F172A', color: '#FFF' }}>✓ Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateBatchModal
        isOpen={isCreateBatchModalOpen}
        onClose={() => setIsCreateBatchModalOpen(false)}
        onAddBatch={onAddBatch || (() => {})}
      />

      {substituteBatch && (
        <SubstituteTeacherModal
          batch={substituteBatch}
          teachers={teachers}
          onClose={() => setSubstituteBatch(null)}
          onSaved={onRefresh}
        />
      )}

      {splitBatchState && (
        <SplitClassModal
          batch={splitBatchState}
          onClose={() => setSplitBatchState(null)}
          onSaved={onRefresh}
        />
      )}

      {syllabusBatchState && (
        <SyllabusTrackerModal
          batch={syllabusBatchState}
          onClose={() => setSyllabusBatchState(null)}
        />
      )}
    </div>
  );
};



