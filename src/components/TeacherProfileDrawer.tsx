import React, { useState, useEffect } from 'react';
import { Teacher, Batch, Student } from '../types';
import { X, User, Phone, Mail, GraduationCap, Calendar, BookOpen, Users, Star, Award, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../api/apiClient';

interface TeacherProfileDrawerProps {
  teacher: Teacher | null;
  batches: Batch[];
  students: Student[];
  onClose: () => void;
  onRefresh?: () => void;
}

export const TeacherProfileDrawer: React.FC<TeacherProfileDrawerProps> = ({
  teacher,
  batches,
  students,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students'>('overview');
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);

  if (!teacher) return null;

  // Filter batches assigned to this teacher
  const assignedBatchList = batches.filter(b => 
    b.instructor === teacher.name || 
    b.teacherName === teacher.name || 
    (teacher.assignedBatches && teacher.assignedBatches.includes(b.name))
  );

  // Filter students in assigned batches
  const assignedBatchNames = assignedBatchList.map(b => b.name);
  const myStudents = students.filter(s => assignedBatchNames.includes(s.gradeBatch));

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="profile-drawer-card" 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 580,
          background: '#FFFFFF',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ background: '#0F172A', color: '#FFFFFF', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge" style={{ background: '#1E293B', color: '#38BDF8', border: '1px solid #334155', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', fontWeight: 800 }}>Faculty Profile</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>ID: {teacher.id.slice(0, 8)}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>{teacher.name}</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{teacher.qualification || teacher.assignedSubjects?.[0] || 'Faculty Member'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '0 16px' }}>
          {(['overview', 'batches', 'students'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab ? '2px solid #0F172A' : '2px solid transparent',
                color: activeTab === tab ? '#0F172A' : '#64748B',
                fontWeight: activeTab === tab ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'overview' && '📋 Overview'}
              {tab === 'batches' && `📚 Classes (${assignedBatchList.length})`}
              {tab === 'students' && `👥 Students (${myStudents.length})`}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>Assigned Batches</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>
                    {assignedBatchList.length} Classes
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Total Enrolled Students</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                    {myStudents.length} Students
                  </div>
                </div>
              </div>


              {/* Contact Information */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: 12 }}>Contact & Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={16} color="#64748B" /> <strong>Email:</strong> {teacher.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Phone size={16} color="#64748B" /> <strong>Phone:</strong> {teacher.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GraduationCap size={16} color="#64748B" /> <strong>Qualification:</strong> {teacher.qualification || 'M.Sc Physics / Specialist'}
                  </div>
                </div>
              </div>

              {/* Assigned Subjects & Batches */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: 10 }}>Assigned Batches</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {assignedBatchList.length > 0 ? (
                    assignedBatchList.map(b => (
                      <span key={b.id} className="badge badge-gray" style={{ fontSize: 12, padding: '4px 10px' }}>
                        {b.name} ({b.room || 'Room 101'})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No active batches assigned</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED BATCHES */}
          {activeTab === 'batches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignedBatchList.length > 0 ? (
                assignedBatchList.map(batch => (
                  <div key={batch.id} style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-blue">{batch.code || batch.classLevel || 'Class'}</span>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{batch.name}</h4>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', gap: 12 }}>
                        <span>📍 {batch.room || 'Room 101'}</span>
                        <span>⏰ {batch.schedule || batch.timing || '09:00 AM - 11:00 AM'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#7E22CE' }}>{batch.studentsCount || 0} Students</div>
                      <span className="badge badge-green" style={{ marginTop: 4 }}>Active</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  <BookOpen size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>No classes currently assigned to this teacher.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY STUDENTS ROSTER */}
          {activeTab === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myStudents.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Reg No</th>
                        <th>Class / Batch</th>
                        <th>Fee Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myStudents.map(student => (
                        <tr key={student.id}>
                          <td><strong style={{ color: '#0F172A' }}>{student.name}</strong></td>
                          <td><span style={{ fontSize: 12, color: '#64748B' }}>{student.regNo}</span></td>
                          <td><span className="badge badge-gray">{student.gradeBatch}</span></td>
                          <td>
                            {(student.dueBalance || 0) <= 0 ? (
                              <span className="badge badge-green">Paid</span>
                            ) : (
                              <span className="badge badge-red">Unpaid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  <Users size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>No students found in assigned batches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
