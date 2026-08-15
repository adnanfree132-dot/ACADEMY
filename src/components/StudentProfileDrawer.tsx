import React, { useState } from 'react';
import { Student } from '../types';
import { X, User, Phone, Mail, GraduationCap, Calendar, DollarSign, CheckCircle2, AlertTriangle, MessageSquare, Plus, FileText, Printer, ShieldAlert, Award, Upload, FileCheck, Check, Clock, Sparkles } from 'lucide-react';
import { ReportCardModal } from './ReportCardModal';
import { StudentFeePlanModal } from './StudentFeePlanModal';

interface StudentProfileDrawerProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'academics' | 'documents' | 'remarks'>('overview');
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [isFeePlanOpen, setIsFeePlanOpen] = useState(false);

  const [remarks, setRemarks] = useState<string[]>([
    'Demonstrated high performance in Chapter 3 Mathematics assessment.',
    'Parent notified regarding upcoming fee due date.'
  ]);
  const [newRemark, setNewRemark] = useState('');

  if (!student) return null;

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;
    setRemarks([newRemark.trim(), ...remarks]);
    setNewRemark('');
  };

  const handlePrintDossier = () => {
    window.print();
  };


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
          maxWidth: 560,
          background: '#FFFFFF',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        {/* Drawer Header */}
        <div style={{ background: '#0F172A', color: '#FFFFFF', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-green" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>{student.status}</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{student.regNo}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>{student.name}</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{student.gradeBatch} 360° Profile Dossier</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={handlePrintDossier} 
              title="Print Complete 360° Bio-Data Dossier"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', padding: '6px 12px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={14} /> Dossier
            </button>
            <button 
              onClick={onClose} 
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', padding: 6, borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '0 16px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'overview' ? '2px solid #0F172A' : '2px solid transparent',
              color: activeTab === 'overview' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'attendance' ? '2px solid #0F172A' : '2px solid transparent',
              color: activeTab === 'attendance' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'academics' ? '2px solid #0F172A' : '2px solid transparent',
              color: activeTab === 'academics' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Academics
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'documents' ? '2px solid #0F172A' : '2px solid transparent',
              color: activeTab === 'documents' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Vault
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'remarks' ? '2px solid #0F172A' : '2px solid transparent',
              color: activeTab === 'remarks' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Conduct
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* TAB 1: OVERVIEW & EMERGENCY CONTACT */}
          {activeTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>TUITION STATUS</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: student.dueBalance > 0 ? '#DC2626' : '#16A34A', marginTop: 4 }}>
                      {student.dueBalance > 0 ? `$${student.dueBalance.toLocaleString()} Due` : 'Fully Paid'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFeePlanOpen(true)}
                    style={{ fontSize: 11, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 8px', fontWeight: 700, marginTop: 8, cursor: 'pointer', alignSelf: 'flex-start' }}
                  >
                    ⚙️ Customize Fee & Scholarship
                  </button>

                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>ATTENDANCE RATE</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>95.2%</div>
                </div>
              </div>


              {/* Emergency Contact Card (Feature 15) */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={16} color="#DC2626" /> Emergency & Parent Contact Card
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#FFF5F5', padding: 16, borderRadius: 12, border: '1px solid #FECDD3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Primary Contact:</span>
                    <strong style={{ color: '#0F172A' }}>{student.parentName} (Parent)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Emergency Phone:</span>
                    <a href={`tel:${student.phone}`} style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>{student.phone}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#64748B' }}>Registered Email:</span>
                    <span style={{ color: '#0F172A' }}>{student.email || 'None on file'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ATTENDANCE HEATMAP (Feature 12) */}
          {activeTab === 'attendance' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="#2563EB" /> Monthly Attendance Summary
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const isAbsent = i === 5 || i === 18;
                  const isLate = i === 12;
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        aspectRatio: '1', 
                        borderRadius: 6, 
                        background: isAbsent ? '#FEE2E2' : isLate ? '#FEF3C7' : '#DCFCE7',
                        color: isAbsent ? '#B91C1C' : isLate ? '#B45309' : '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                      title={`Day ${i + 1}: ${isAbsent ? 'Absent' : isLate ? 'Late' : 'Present'}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#15803D' }}><Check size={12} /> Present (25 Days)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B91C1C' }}><X size={12} /> Absent (2 Days)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B45309' }}><Clock size={12} /> Late (1 Day)</span>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC MARKSHEETS (Feature 13) */}
          {activeTab === 'academics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={16} color="#8B5CF6" /> Term Marksheet & Exam Grades
                </h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsReportCardOpen(true)}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  <Sparkles size={14} /> Generate Report Card
                </button>

              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11, color: '#64748B' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Score</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>Mathematics</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>88/100</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>A</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>Physics</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>92/100</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>A+</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>Chemistry</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>81/100</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#2563EB' }}>B+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENT VAULT (Feature 10) */}
          {activeTab === 'documents' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileCheck size={16} color="#059669" /> Document Vault Attachments
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#059669" />
                    <div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>B-Form / CNIC Verification</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>Verified PDF • 1.2 MB</span>
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>Verified</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#2563EB" />
                    <div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>Previous School Transcript</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>Uploaded PDF • 2.4 MB</span>
                    </div>
                  </div>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>Attached</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONFIDENTIAL REMARKS (Feature 16) */}
          {activeTab === 'remarks' && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} color="#64748B" /> Behavior & Conduct Logs
              </h3>

              <form onSubmit={handleAddRemark} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input 
                  className="form-input"
                  placeholder="Add confidential teacher note..."
                  value={newRemark}
                  onChange={e => setNewRemark(e.target.value)}
                  style={{ flex: 1, fontSize: 13 }}
                />
                <button type="submit" className="btn-primary btn-sm">
                  <Plus size={14} /> Add
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {remarks.map((rem, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, borderLeft: '3px solid #0F172A', fontSize: 13, color: '#334155' }}>
                    {rem}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {isReportCardOpen && (
        <ReportCardModal
          student={student}
          onClose={() => setIsReportCardOpen(false)}
        />
      )}

      {isFeePlanOpen && (
        <StudentFeePlanModal
          student={student}
          onClose={() => setIsFeePlanOpen(false)}
        />
      )}
    </div>
  );
};


