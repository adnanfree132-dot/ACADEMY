import React, { useState, useEffect } from 'react';
import { Batch, Teacher, Student, Subject } from '../types';
import {
  BookOpen,
  Plus,
  Users,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Tag,
  UserPlus,
  UserMinus,
  Layers,
  Calendar,
  DollarSign,
  UserCheck,
  GitBranch,
  Printer
} from 'lucide-react';
import { showToast } from '../lib/toast';
import { CreateBatchModal } from '../components/CreateBatchModal';
import { EnrollStudentModal } from '../components/EnrollStudentModal';
import { SubstituteTeacherModal } from '../components/SubstituteTeacherModal';
import { SplitClassModal } from '../components/SplitClassModal';
import { SyllabusTrackerModal } from '../components/SyllabusTrackerModal';
import { api } from '../api/apiClient';
import { ModernSelect } from '../components/ModernSelect';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';

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

export const BatchesView: React.FC<BatchesViewProps> = ({
  batches,
  teachers = [],
  subjects = [],
  students = [],
  onOpenCreateModal,
  onAddBatch,
  onDeleteBatch,
  onEditBatch,
  onRefresh
}) => {
  // Exclude terminated / inactive teachers from selectors
  const activeTeachers = teachers.filter(t => {
    const st = ((t as any).status || '').toLowerCase();
    return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
  });

  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [enrollModalBatch, setEnrollModalBatch] = useState<Batch | null>(null);
  const [manageSubjectsBatch, setManageSubjectsBatch] = useState<Batch | null>(null);
  const [substituteBatch, setSubstituteBatch] = useState<Batch | null>(null);
  const [splitBatchState, setSplitBatchState] = useState<Batch | null>(null);
  const [syllabusBatchState, setSyllabusBatchState] = useState<Batch | null>(null);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [editCapacity, setEditCapacity] = useState('30');
  const [editTeacherId, setEditTeacherId] = useState('');

  // Batch Detail State
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [batchSubjects, setBatchSubjects] = useState<any[]>([]);

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
    const matchedTeacher = teachers.find(t => t.name === batch.teacherName || t.name === batch.instructor);
    setEditTeacherId(matchedTeacher?.id || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
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

    try {
      await api.updateBatch(editingBatch.id, {
        teacherId: editTeacherId || undefined,
        name: editName.trim(),
        capacity: Number(editCapacity),
        timing: editTiming.trim(),
        room: editRoom.trim()
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Error updating batch in background:', err);
    }

    setEditingBatch(null);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    const target = batchToDelete;
    setBatchToDelete(null);

    if (onDeleteBatch) {
      onDeleteBatch(target.id);
    }

    try {
      await api.deleteBatch(target.id);
    } catch (err) {
      console.warn('Error deleting batch in background:', err);
      if (onRefresh) onRefresh();
    }
  };

  useEffect(() => {
    api.getClasses().then(rows => { if (Array.isArray(rows)) setClasses(rows); }).catch(() => {});
  }, [batches.length]);

  const openBatchDetail = async (batch: Batch) => {
    setSelectedBatch(batch);
    try {
      const [enrolledStudents, batchSubs, waitRows] = await Promise.all([
        api.getBatchStudents(batch.id).catch(() => []),
        api.getBatchSubjects(batch.id).catch(() => []),
        api.getBatchWaitlist(batch.id).catch(() => [])
      ]);
      setBatchStudents(Array.isArray(enrolledStudents) ? enrolledStudents : []);
      setBatchSubjects(Array.isArray(batchSubs) ? batchSubs : []);
      setWaitlist(Array.isArray(waitRows) ? waitRows : []);
    } catch {
      setBatchStudents([]);
      setBatchSubjects([]);
      setWaitlist([]);
    }
  };

  const handleEnrollStudentSubmission = (payload: any) => {
    if (!enrollModalBatch) return;
    const batchId = enrollModalBatch.id;
    const currBatch = selectedBatch;

    // 1. Instant close and trigger refresh
    setEnrollModalBatch(null);
    if (onRefresh) onRefresh();

    // 2. Background sync
    api.enrollStudentInBatch(batchId, payload).then((res: any) => {
      if (res?.waitlisted) {
        showToast('Batch is full. Student was added to the waitlist.', 'info');
      } else {
        showToast('Student enrolled.', 'success');
      }
      if (currBatch && currBatch.id === batchId) {
        openBatchDetail(currBatch);
      }
      if (onRefresh) onRefresh();
    }).catch(async (err: any) => {
      if (err?.message && String(err.message).toLowerCase().includes('capacity')) {
        try {
          await api.addBatchWaitlist(batchId, { studentId: payload.studentId, reason: 'Capacity full' });
          showToast('Batch is full. Student was added to the waitlist.', 'info');
          if (currBatch && currBatch.id === batchId) openBatchDetail(currBatch);
          return;
        } catch (waitErr: any) {
          showToast(waitErr.message || err.message, 'error');
          return;
        }
      }
      showToast(err.message || 'Could not enroll student.', 'error');
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!selectedBatch) return;
    if (!window.confirm('Remove this student from the batch?')) return;
    
    const batch = selectedBatch;
    // 1. Instant optimistic update
    setBatchStudents(prev => prev.filter(s => s.id !== studentId));
    if (onRefresh) onRefresh();

    // 2. Background sync
    api.removeStudentFromBatch(batch.id, studentId).then(() => {
      openBatchDetail(batch);
      if (onRefresh) onRefresh();
    }).catch(err => console.error('Error removing student in background:', err));
  };

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
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error assigning subject');
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!manageSubjectsBatch) return;
    try {
      await api.removeBatchSubject(manageSubjectsBatch.id, subjectId);
      openManageSubjects(manageSubjectsBatch);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error removing subject');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Batches & Academic Classes</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Manage batch schedules, course fee plans, installments, and student rosters</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={() => setIsCreateBatchModalOpen(true)}>
            <Plus size={16} /> Create New Batch
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ fontSize: 13 }}>Classes</strong>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newClassName.trim()) return;
              try {
                const created = await api.createClass({ name: newClassName.trim() });
                setClasses(prev => [...prev, created]);
                setNewClassName('');
                showToast('Class created.', 'success');
              } catch (err: any) {
                showToast(err.message || 'Could not create class.', 'error');
              }
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input className="form-input" placeholder="New class name" value={newClassName} onChange={e => setNewClassName(e.target.value)} style={{ minWidth: 180 }} />
            <button className="btn-secondary" type="submit">Add class</button>
          </form>
        </div>
        <div className="mobile-filter-scroll-bar">
          <button type="button" className={classFilter === 'ALL' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => setClassFilter('ALL')}>All</button>
          {classes.map((cls: any) => (
            <button
              key={cls.id}
              type="button"
              className={classFilter === cls.name ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => setClassFilter(cls.name)}
            >
              {cls.name}{cls._count?.batches != null ? ` (${cls._count.batches})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="card-grid-3">
        {batches.filter(batch => classFilter === 'ALL' || batch.classLevel === classFilter || (batch as any).class?.name === classFilter).map(batch => (
          <div
            key={batch.id}
            className="card"
            style={{
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              position: 'relative'
            }}
            onClick={() => openBatchDetail(batch)}
          >
            {/* Top Row: Code Badge & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{batch.code || batch.classLevel || 'BATCH'}</span>
                {batch.course_type === 'fixed_course' ? (
                  <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, border: '1px solid #E9D5FF' }}>
                    Fixed Course
                  </span>
                ) : (
                  <span style={{ background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, border: '1px solid #A7F3D0' }}>
                    Monthly Recurring
                  </span>
                )}
              </div>

              {/* Desktop Hover Icons */}
              <div className="desktop-only" style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Enroll Student"
                  onClick={() => setEnrollModalBatch(batch)}
                >
                  <UserPlus size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Assign Teacher Coverage"
                  onClick={() => setSubstituteBatch(batch)}
                >
                  <UserCheck size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Split Class Section"
                  onClick={() => setSplitBatchState(batch)}
                >
                  <GitBranch size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Track Syllabus Progress"
                  onClick={() => setSyllabusBatchState(batch)}
                >
                  <BookOpen size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Manage Subjects"
                  onClick={() => openManageSubjects(batch)}
                >
                  <Tag size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn"
                  title="Edit Class"
                  onClick={() => openEditModal(batch)}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="table-icon-btn danger"
                  title="Delete Class"
                  onClick={() => setBatchToDelete(batch)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>{batch.name}</h3>
              {batch.section_name && (
                <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>{batch.section_name}</span>
              )}
              <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 2, margin: 0 }}>
                Instructor: {batch.instructor || batch.teacherName || 'Unassigned'}
              </p>
            </div>

            {/* Fee & Course Details Pill */}
            {batch.course_type === 'fixed_course' && (
              <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: '#6B21A8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>
                  Total Fee: PKR {formatCurrency(batch.total_fee || 0)}
                </span>
                <span style={{ color: '#7E22CE', fontWeight: 600 }}>
                  {batch.default_installments || 3} Installments
                </span>
              </div>
            )}

            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>
              {batch.start_date && batch.end_date ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569' }}>
                  <Calendar size={13} color="#64748B" /> Duration: {batch.start_date} to {batch.end_date}
                </div>
              ) : null}

              {(batch.schedule || batch.timing) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#64748B" /> {batch.schedule || batch.timing}
                </div>
              ) : null}

              {batch.room ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="#64748B" /> {batch.room}
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} color="#64748B" /> {batch.studentsCount || 0}/{batch.capacity || batch.maxCapacity || '—'} enrolled
              </div>
            </div>

            {/* Click hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
              <ChevronRight size={12} /> Click to view enrolled students & installment timeline
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
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 620,
              background: '#FFFFFF', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              animation: 'slideInRight 0.25s ease-out'
            }}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, background: '#0F172A', color: '#FFF', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: 6 }}>{selectedBatch.code || selectedBatch.classLevel}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginTop: 4, margin: 0 }}>{selectedBatch.name}</h2>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2, margin: 0 }}>
                  Instructor: {selectedBatch.instructor || selectedBatch.teacherName || 'Unassigned'}
                  {selectedBatch.course_type === 'fixed_course' && ` • Total Course Fee: PKR ${formatCurrency(selectedBatch.total_fee || 0)}`}
                </p>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Subjects Section */}
            <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <BookOpen size={15} color="#475569" /> Assigned Subjects
              </h4>
              {batchSubjects.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
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
                <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', margin: 0, marginTop: 4 }}>No subjects assigned yet.</p>
              )}
            </div>

            {/* Enrolled Students Section */}
            <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <Users size={15} color="#475569" /> Enrolled Students ({batchStudents.length})
                </h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      const lines = [
                        selectedBatch.name,
                        `Teacher: ${selectedBatch.teacherName || selectedBatch.instructor || 'Unassigned'}`,
                        selectedBatch.room ? `Room: ${selectedBatch.room}` : '',
                        '',
                        ...batchStudents.map((enrollment: any, idx: number) => {
                          const stu = enrollment.student || enrollment || {};
                          return `${idx + 1}. ${stu.full_name || stu.name || ''}  ${stu.admission_no || ''}  ${stu.phone || ''}`;
                        })
                      ].filter(Boolean);
                      const w = window.open('', '_blank');
                      if (!w) return;
                      w.document.write(`<pre style="font-family:sans-serif;padding:24px">${lines.join('\n')}</pre>`);
                      w.document.close();
                      w.print();
                    }}
                  >
                    <Printer size={14} /> Print roster
                  </button>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => setEnrollModalBatch(selectedBatch)}
                  >
                    <UserPlus size={14} /> Enroll Student
                  </button>
                </div>
              </div>

              {/* Students Table */}
              {batchStudents.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Reg No</th>
                        <th>Enrolled On</th>
                        <th>Timeline</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchStudents.map((enrollment: any) => {
                        const stu = enrollment.student || enrollment || {};
                        return (
                          <tr key={enrollment.id || stu.id}>
                            <td><span style={{ fontWeight: 600, color: '#0F172A' }}>{stu.full_name || stu.name || 'Unknown'}</span></td>
                            <td><span style={{ fontSize: 12, color: '#64748B' }}>{stu.admission_no || stu.regNo || '—'}</span></td>
                            <td><span style={{ fontSize: 12, color: '#64748B' }}>{enrollment.enrolledOn ? String(enrollment.enrolledOn).split('T')[0] : '—'}</span></td>
                            <td>
                              {enrollment.isExtendedTimeline ? (
                                <span style={{ fontSize: 11, color: '#7E22CE', fontWeight: 500, background: '#FAF5FF', padding: '2px 6px', borderRadius: 4 }}>
                                  Extended ({enrollment.individualEndDate ? String(enrollment.individualEndDate).split('T')[0] : 'Custom'})
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: '#475569' }}>Standard</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleRemoveStudent(stu.id)}
                                style={{
                                  padding: '3px 8px', borderRadius: 6, border: '1px solid #FECACA',
                                  background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11,
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
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
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No students enrolled in this batch yet.</p>
                  <p style={{ fontSize: 12, margin: 0, marginTop: 4 }}>Click "Enroll Student" above to add students with installment schedules.</p>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Waitlist ({waitlist.length})</h4>
                {waitlist.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Empty. Full batches add new enrollments here instead of inventing seats.</p>
                ) : waitlist.map((row: any) => (
                  <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                    <span>#{row.position} {row.student?.full_name} {row.student?.phone ? `· ${row.student.phone}` : ''}</span>
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary btn-sm" onClick={async () => {
                        try {
                          await api.promoteWaitlist(selectedBatch.id, row.student_id);
                          showToast('Seat given. Student enrolled.', 'success');
                          openBatchDetail(selectedBatch);
                          if (onRefresh) onRefresh();
                        } catch (err: any) {
                          showToast(err.message || 'Could not promote.', 'error');
                        }
                      }}>Promote</button>
                      <button className="btn-secondary btn-sm" onClick={async () => {
                        await api.removeWaitlist(selectedBatch.id, row.student_id);
                        setWaitlist(prev => prev.filter(w => w.id !== row.id));
                      }}>Remove</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateBatchModal
        isOpen={isCreateBatchModalOpen}
        onClose={() => setIsCreateBatchModalOpen(false)}
        onAddBatch={(batchData) => {
          if (onAddBatch) onAddBatch(batchData);
          setIsCreateBatchModalOpen(false);
          if (onRefresh) onRefresh();
        }}
      />

      {enrollModalBatch && (
        <EnrollStudentModal
          isOpen={!!enrollModalBatch}
          batch={enrollModalBatch}
          students={students}
          onClose={() => setEnrollModalBatch(null)}
          onEnroll={handleEnrollStudentSubmission}
        />
      )}

      {/* 1. Edit Batch Modal (Floating Island Architecture) */}
      {editingBatch && (
        <div className="floating-island-overlay" onClick={() => setEditingBatch(null)}>
          <div className="floating-island-container" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            {/* Island 1: Floating Dark Navy Header Card */}
            <div className="island-header-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="island-header-title">Edit Class & Batch</h3>
                  <p className="island-header-sub">
                    {editingBatch.name} • Modify schedule, room, instructor & capacity
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="island-close-btn"
                onClick={() => setEditingBatch(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 3: Floating White Scrollable Form Card */}
            <div className="island-content-card">
              <form id="edit-batch-form" onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Class / Batch Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Grade 10 - Mathematics"
                      required
                      style={{ width: '100%', borderRadius: 10, border: '1px solid #CBD5E1', padding: '8px 14px', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        Room / Hall
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={editRoom}
                        onChange={e => setEditRoom(e.target.value)}
                        placeholder="e.g. Room 102 / Lab 1"
                        style={{ width: '100%', borderRadius: 10, border: '1px solid #CBD5E1', padding: '8px 14px', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                        Max Student Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        className="input"
                        value={editCapacity}
                        onChange={e => setEditCapacity(e.target.value)}
                        placeholder="30"
                        style={{ width: '100%', borderRadius: 10, border: '1px solid #CBD5E1', padding: '8px 14px', fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Class Schedule / Timing
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={editTiming}
                      onChange={e => setEditTiming(e.target.value)}
                      placeholder="e.g. Mon, Wed, Fri 09:00 AM - 10:30 AM"
                      style={{ width: '100%', borderRadius: 10, border: '1px solid #CBD5E1', padding: '8px 14px', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Primary Assigned Instructor
                    </label>
                    <ModernSelect
                      value={editTeacherId}
                      onChange={setEditTeacherId}
                      placeholder="Select Instructor..."
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...activeTeachers.map(t => ({ value: t.id, label: `${t.name} (${t.qualification || 'Faculty'})` }))
                      ]}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div className="island-action-row">
              <button
                type="button"
                className="island-btn-cancel"
                onClick={() => setEditingBatch(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-batch-form"
                className="island-btn-action"
                style={{ background: '#0F172A', color: '#FFFFFF' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Batch Confirmation Modal (Floating Island Architecture) */}
      {batchToDelete && (
        <div className="floating-island-overlay" onClick={() => setBatchToDelete(null)}>
          <div className="floating-island-container" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            {/* Island 1: Floating Header Card */}
            <div className="island-header-card danger">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444'
                }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="island-header-title">Delete Class Batch</h3>
                  <p className="island-header-sub">
                    {batchToDelete.name} • Class & Batch Removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="island-close-btn"
                onClick={() => setBatchToDelete(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Notice Card */}
            <div style={{
              background: '#FFF1F2',
              borderRadius: 14,
              border: '1px solid #FECDD3',
              padding: '12px 16px',
              fontSize: 12,
              color: '#9F1239',
              lineHeight: 1.45
            }}>
              <strong>Warning:</strong> Deleting this batch will unassign associated subject assignments and schedules. Any enrolled students will have their enrollment record removed.
            </div>

            {/* Island 3: Content Card */}
            <div className="island-content-card">
              <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong>{batchToDelete.name}</strong>? This operation will remove the class from student enrollments and schedules.
              </p>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div className="island-action-row">
              <button
                type="button"
                className="island-btn-cancel"
                onClick={() => setBatchToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="island-btn-action"
                style={{ background: '#DC2626', color: '#FFFFFF' }}
                onClick={confirmDeleteBatch}
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Subjects Modal (Floating Island Architecture) */}
      {manageSubjectsBatch && (
        <div className="floating-island-overlay" onClick={() => setManageSubjectsBatch(null)}>
          <div className="floating-island-container" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            {/* Island 1: Floating Header Card */}
            <div className="island-header-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="island-header-title">Manage Subjects</h3>
                  <p className="island-header-sub">
                    {manageSubjectsBatch.name} • Curriculum & Teacher Assignments
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="island-close-btn"
                onClick={() => setManageSubjectsBatch(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 3: Content Card */}
            <div className="island-content-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                    Currently Assigned ({batchSubjectsForManage.length})
                  </h4>
                  {batchSubjectsForManage.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {batchSubjectsForManage.map((bs: any) => (
                        <div key={bs.subject?.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0'
                        }}>
                          <div>
                            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5 }}>{bs.subject?.name}</span>
                            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>({bs.subject?.code})</span>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Teacher: <span style={{ fontWeight: 600, color: '#334155' }}>{bs.teacher?.user?.full_name || 'Unassigned'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(bs.subject?.id)}
                            style={{
                              padding: '5px 10px', borderRadius: 6, border: '1px solid #FECACA',
                              background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No subjects assigned yet.</p>
                  )}
                </div>

                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Assign New Subject</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <ModernSelect
                      value={assignSubjectId}
                      onChange={setAssignSubjectId}
                      placeholder="Select Subject..."
                      options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))}
                    />
                    <ModernSelect
                      value={assignTeacherId}
                      onChange={setAssignTeacherId}
                      placeholder="Select Teacher..."
                      options={activeTeachers.map(t => ({ value: t.id, label: t.name }))}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleAssignSubject}
                      disabled={!assignSubjectId || !assignTeacherId}
                      style={{ justifyContent: 'center', borderRadius: 10, height: 38 }}
                    >
                      Assign Subject & Teacher
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div className="island-action-row">
              <button
                type="button"
                className="island-btn-action"
                style={{ background: '#0F172A', color: '#FFFFFF' }}
                onClick={() => setManageSubjectsBatch(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
      {substituteBatch && (
        <SubstituteTeacherModal
          batch={substituteBatch}
          teachers={teachers}
          onClose={() => setSubstituteBatch(null)}
          onSaved={() => {
            setSubstituteBatch(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {splitBatchState && (
        <SplitClassModal
          batch={splitBatchState}
          onClose={() => setSplitBatchState(null)}
          onSaved={() => {
            setSplitBatchState(null);
            if (onRefresh) onRefresh();
          }}
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

export default BatchesView;
