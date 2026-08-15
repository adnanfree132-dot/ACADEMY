import React, { useState, useEffect } from 'react';
import { X, Printer, Award, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface ReportCardModalProps {
  student: Student;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const [tests, setTests] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTests().catch(() => []),
      api.getSettings().catch(() => ({}))
    ]).then(([testsData, settingsData]) => {
      setTests(Array.isArray(testsData) ? testsData : []);
      setSettings(settingsData || {});
      setLoading(false);
    });
  }, [student]);

  const academyName = settings.academyName || 'AcademiaPro Management OS';
  const principalName = settings.principalName || 'Dr. S. A. Khan';
  const session = settings.academicSession || 'Session 2026-2027';

  // Sample or calculated subject marks
  const subjectMarks = [
    { subject: 'Mathematics (Algebra)', maxMarks: 100, obtained: 88, pass: true, grade: 'A+' },
    { subject: 'Physics (Mechanics)', maxMarks: 100, obtained: 82, pass: true, grade: 'A' },
    { subject: 'Chemistry (Organic)', maxMarks: 100, obtained: 79, pass: true, grade: 'B+' },
    { subject: 'English Grammar & Comp', maxMarks: 100, obtained: 91, pass: true, grade: 'A+' },
    { subject: 'Computer Studies', maxMarks: 100, obtained: 95, pass: true, grade: 'A+' },
  ];

  const totalMax = subjectMarks.reduce((acc, m) => acc + m.maxMarks, 0);
  const totalObtained = subjectMarks.reduce((acc, m) => acc + m.obtained, 0);
  const overallPercentage = ((totalObtained / totalMax) * 100).toFixed(1);

  const handlePrint = () => {
    window.print();
  };

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
          maxWidth: 680, 
          width: '95%', 
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
        <div className="no-print" style={{ 
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
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Academic Report Card</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.name} ({student.regNo}) • {session}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#FFFFFF', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Floating White Dossier Card */}
        <div className="printable-report-card" style={{ 
          padding: 24, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          {/* Printable Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>
                <Sparkles size={14} /> Official Academic Report Card
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 2, margin: 0 }}>{academyName}</h2>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0, marginTop: 2 }}>Academic Evaluation Dossier — {session}</p>
            </div>
          </div>

          {/* Student Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 12, margin: '14px 0', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Student Name:</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{student.name}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Registration No:</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB' }}>{student.regNo}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Class / Section:</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.gradeBatch}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent / Guardian:</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.parentName || 'Parent / Guardian'}</div>
            </div>
          </div>

          {/* Academic Performance Table */}
          <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Academic Subject Performance</h4>
          <div className="data-table-container">
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Max Marks</th>
                  <th>Obtained Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjectMarks.map((m, idx) => (
                  <tr key={idx}>
                    <td><strong>{m.subject}</strong></td>
                    <td>{m.maxMarks}</td>
                    <td><strong style={{ color: '#0F172A' }}>{m.obtained}</strong></td>
                    <td><span className="badge badge-blue" style={{ fontWeight: 800 }}>{m.grade}</span></td>
                    <td><span className="badge badge-green">PASSED</span></td>
                  </tr>
                ))}
                <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                  <td>OVERALL TOTAL</td>
                  <td>{totalMax}</td>
                  <td style={{ color: '#0F172A', fontSize: 14 }}>{totalObtained} ({overallPercentage}%)</td>
                  <td>A+</td>
                  <td><span className="badge badge-green">PROMOTED</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance & Conduct Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 10, borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Attendance Rate</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#15803D', marginTop: 2 }}>94.2% (Present)</div>
            </div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 10, borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Academic Standing</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>Honors / Excellent</div>
            </div>
          </div>

          {/* Signature & Remarks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Class Teacher Remarks:</div>
              <div style={{ fontSize: 11, color: '#0F172A', fontStyle: 'italic', marginTop: 2 }}>"Consistently active in lectures and demonstrates exceptional analytical skills."</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ borderBottom: '1px solid #0F172A', paddingBottom: 4, fontWeight: 800, color: '#0F172A', fontSize: 12 }}>
                {principalName}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Principal Signature</div>
            </div>
          </div>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 9999, 
              border: '1px solid #CBD5E1', 
              background: '#FFFFFF', 
              color: '#334155', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            Close
          </button>
          <button 
            type="button" 
            onClick={handlePrint}
            style={{ 
              padding: '10px 24px', 
              borderRadius: 9999, 
              border: 'none', 
              background: '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            <Printer size={15} /> Print Official Report Card
          </button>
        </div>
      </div>
    </div>
  );
};
