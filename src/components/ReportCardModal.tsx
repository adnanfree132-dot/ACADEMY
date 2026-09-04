import React, { useState, useEffect } from 'react';
import { X, Printer, Award, CheckCircle2, ShieldCheck, Sparkles, BookOpen, User, Calendar, Check, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface ReportCardModalProps {
  student: Student;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const [reportCardData, setReportCardData] = useState<any | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStudentReportCard(student.id).catch(() => null),
      api.getSettings().catch(() => ({}))
    ]).then(([cardData, settingsData]) => {
      setReportCardData(cardData);
      setSettings(settingsData || {});
      setLoading(false);
    });
  }, [student]);

  const academyName = settings.academyName || 'Academy';
  const principalName = settings.principalName || '';
  const session = reportCardData?.academicSession || settings.academicSession || '';

  const subjects = (reportCardData?.subjects && reportCardData.subjects.length > 0)
    ? reportCardData.subjects
    : [];

  const cumulativeMax = reportCardData?.summary?.cumulativeMax ?? subjects.reduce((sum: number, s: any) => sum + (s.totalMax || 100), 0);
  const cumulativeObtained = reportCardData?.summary?.cumulativeObtained ?? subjects.reduce((sum: number, s: any) => sum + (s.obtainedMarks || 0), 0);
  const overallPercentage = reportCardData?.summary?.overallPercentage ?? (cumulativeMax > 0 ? ((cumulativeObtained / cumulativeMax) * 100).toFixed(1) : '0.0');
  const overallGrade = reportCardData?.summary?.overallGrade || (Number(overallPercentage) >= 90 ? 'A+' : (Number(overallPercentage) >= 80 ? 'A' : (Number(overallPercentage) >= 70 ? 'B+' : 'B')));
  const standingLabel = reportCardData?.summary?.performanceEvaluation || (Number(overallPercentage) >= 80 ? 'Honors / Distinction' : 'Merit Standing');
  const promotionStatus = reportCardData?.summary?.status || (Number(overallPercentage) >= 50 ? 'Promoted' : 'Conditional');

  const attendanceRate = reportCardData?.attendance?.attendancePercentage;
  const presentDays = reportCardData?.attendance?.presentDays;
  const totalDays = reportCardData?.attendance?.totalDays;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="floating-island-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1300 }}
    >
      <div 
        className="floating-island-container" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 680 }}
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
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Award size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                Academic Report Card & Transcript
              </h3>
              <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0 0' }}>
                {student.name} ({student.regNo}) • {session}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#94A3B8', 
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

        {/* Island 3: Scrollable Report Card Dossier Canvas */}
        <div id="academic-report-card-canvas" style={{ 
          padding: 24, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '72vh', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Printable Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Sparkles size={13} /> Official Student Academic Record
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
                {academyName}
              </h2>
              <p style={{ fontSize: 11.5, color: '#64748B', margin: '2px 0 0 0' }}>
                Term Performance & Assessment Transcript &bull; {session}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Issued Date</span>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          {/* Student Dossier Information Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Student Name</span>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{student.name}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Registration No</span>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{student.regNo}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Academic Cohort / Batch</span>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{reportCardData?.batchName || student.gradeBatch || 'Primary Cohort'}</div>
            </div>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent / Guardian</span>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{student.parentName || 'Parent / Guardian'}</div>
            </div>
          </div>

          {/* Subject-Wise Assessment Performance Table */}
          <div>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
              Subject-Wise Examination Marksheet
            </span>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Subject Curriculum</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Max Marks</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Obtained</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Score %</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((m: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{m.subjectName || m.subject}</div>
                        {m.remarks && <div style={{ fontSize: 10.5, color: '#64748B' }}>{m.remarks}</div>}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: '#64748B' }}>{m.totalMax || m.maxMarks || 100}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 800, color: '#0F172A' }}>{m.obtainedMarks ?? m.obtained}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{m.percentage || Math.round(((m.obtainedMarks ?? m.obtained) / (m.totalMax || 100)) * 100)}%</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 800,
                          background: (m.grade || 'A').includes('A') ? '#DCFCE7' : '#EFF6FF',
                          color: (m.grade || 'A').includes('A') ? '#166534' : '#1E40AF',
                          border: `1px solid ${(m.grade || 'A').includes('A') ? '#BBF7D0' : '#BFDBFE'}`
                        }}>
                          {m.grade || 'A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#F8FAFC', fontWeight: 800, borderTop: '2px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', color: '#0F172A' }}>CUMULATIVE RESULT</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B' }}>{cumulativeMax}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#0F172A', fontSize: 13 }}>{cumulativeObtained}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#2563EB', fontSize: 13 }}>{overallPercentage}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 900, background: '#0F172A', color: '#FFFFFF' }}>
                        {overallGrade}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Standing & Attendance KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Attendance Rate</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D', marginTop: 2 }}>{attendanceRate != null && totalDays ? `${attendanceRate}% (${presentDays}/${totalDays}d)` : '—'}</div>
            </div>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 12px', borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Academic Standing</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>{standingLabel}</div>
            </div>
            <div style={{ background: '#FDF4FF', border: '1px solid #F5D0FE', padding: '10px 12px', borderRadius: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#86198F', textTransform: 'uppercase' }}>Term Promotion</span>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#A21CAF', marginTop: 2 }}>{promotionStatus}</div>
            </div>
          </div>

          {/* Official Signatures Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 6 }}>
            <div style={{ maxWidth: '60%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Faculty Assessment Remarks:</div>
              <div style={{ fontSize: 11.5, color: '#0F172A', fontStyle: 'italic', marginTop: 2 }}>
                "Demonstrates consistent dedication and intellectual rigor across all assigned course modules."
              </div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ borderBottom: '1.5px solid #0F172A', paddingBottom: 4, fontWeight: 800, color: '#0F172A', fontSize: 12 }}>
                {principalName}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>Principal / Academic Head</div>
            </div>
          </div>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '9px 20px', 
              borderRadius: 9999, 
              border: '1px solid #CBD5E1', 
              background: '#FFFFFF', 
              color: '#334155', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
            }}
          >
            Close
          </button>
          <button 
            type="button" 
            onClick={handlePrint}
            style={{ 
              padding: '9px 24px', 
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
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
            }}
          >
            <Printer size={15} /> Print Official Report Card
          </button>
        </div>
      </div>
    </div>
  );
};
export default ReportCardModal;
