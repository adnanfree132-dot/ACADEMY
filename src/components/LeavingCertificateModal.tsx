import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Calendar,
  CheckCircle,
  FileCheck2,
  Building2
} from 'lucide-react';
import { Student, LeavingCertificateData } from '../types';
import { api } from '../api/apiClient';
import { openWhatsAppLink } from '../utils/whatsappHelper';

interface LeavingCertificateModalProps {
  student: Student;
  onClose: () => void;
}

export const LeavingCertificateModal: React.FC<LeavingCertificateModalProps> = ({
  student,
  onClose
}) => {
  const [data, setData] = useState<LeavingCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const certData = await api.getLeavingCertificate(student.id);
        setData(certData);
        setError(null);
      } catch (err: any) {
        setData(null);
        setError(err.message || 'Could not load the leaving certificate from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [student]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `🎓 ACADEMIAPRO ACADEMY - LEAVING CERTIFICATE & CLEARANCE SLIP\n` +
      `--------------------------------------------------\n` +
      `Reg No: ${data.admissionNo}\n` +
      `Student Name: ${data.studentName}\n` +
      `Parent/Guardian: ${data.parentName}\n` +
      `Class/Batch: ${data.gradeBatch}\n` +
      `Admission Date: ${data.enrollmentDate}\n` +
      `Leaving Date: ${data.leavingDate}\n` +
      `Departure Reason: ${data.reason}\n` +
      `Attendance Rate: ${data.attendancePercentage}%\n` +
      `Fee Status: ${data.feeStatus} (${data.dueBalance > 0 ? `PKR ${data.dueBalance.toLocaleString()}` : 'All Dues Paid'})\n` +
      `Conduct & Character: ${data.conductRating}\n` +
      `Remarks: ${data.remarks}\n` +
      `--------------------------------------------------\n` +
      `Authorized Signatory - AcademiaPro Education Network`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const message = `Assalam-o-Alaikum ${data.parentName},\n\nOfficial School Leaving & Clearance Certificate for *${data.studentName}* (${data.admissionNo}):\n\n` +
      `📅 *Leaving Date*: ${data.leavingDate}\n` +
      `📚 *Class/Batch*: ${data.gradeBatch}\n` +
      `📊 *Attendance Rate*: ${data.attendancePercentage}%\n` +
      `💳 *Fee Clearance*: ${data.feeStatus} ${data.dueBalance > 0 ? `(Pending: PKR ${data.dueBalance})` : '(Cleared)'}\n` +
      `⭐ *Conduct Rating*: ${data.conductRating}\n` +
      `📝 *Remarks*: ${data.remarks}\n\n` +
      `Thank you!\nAcademiaPro Administration`;

    openWhatsAppLink(data.phone, message);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, 
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
          gap: 12,
          animation: 'scaleUp 0.2s ease-out'
        }}
      >
        {/* Island 1: Floating Dark Navy Header Card */}
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
              <FileCheck2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Leaving Certificate & Clearance</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Official Institutional Exit Document</p>
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

        {/* Island 3: Floating White Certificate Card */}
        <div 
          className="printable-certificate-card"
          style={{ 
            background: '#FFFFFF', 
            borderRadius: 16, 
            padding: '24px', 
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Generating official certificate...</div>
            </div>
          ) : error ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: '#B91C1C' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{error}</div>
            </div>
          ) : data ? (
            <>
              {/* Institution Header */}
              <div style={{
                textAlign: 'center',
                borderBottom: '2px dashed #E2E8F0',
                paddingBottom: 14
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0F172A', fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>
                  <Building2 size={20} color="#10B981" />
                  <span>ACADEMIAPRO HIGHER SECONDARY</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Official School Leaving & Dues Clearance Certificate
                </div>
              </div>

              {/* Student Demographics Grid */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                fontSize: 12
              }}>
                <div>
                  <span style={{ color: '#64748B' }}>Student Name:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{data.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Admission No:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{data.admissionNo}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Father/Guardian:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{data.parentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Class / Section:</span>{' '}
                  <strong style={{ color: '#0F172A' }}>{data.gradeBatch}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Admission Date:</span>{' '}
                  <span style={{ color: '#334155', fontWeight: 600 }}>{data.enrollmentDate}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Leaving Date:</span>{' '}
                  <span style={{ color: '#334155', fontWeight: 600 }}>{data.leavingDate}</span>
                </div>
              </div>

              {/* Clearance Summary 3-Column Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: '10px 8px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block' }}>
                    Attendance
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A', marginTop: 2, display: 'block' }}>
                    {data.attendancePercentage}%
                  </span>
                </div>

                <div style={{
                  background: data.dueBalance <= 0 ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${data.dueBalance <= 0 ? '#BBF7D0' : '#FECACA'}`,
                  borderRadius: 10,
                  padding: '10px 8px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: data.dueBalance <= 0 ? '#166534' : '#991B1B', textTransform: 'uppercase', display: 'block' }}>
                    Dues Status
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: data.dueBalance <= 0 ? '#16A34A' : '#DC2626', marginTop: 2, display: 'block' }}>
                    {data.feeStatus}
                  </span>
                </div>

                <div style={{
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  borderRadius: 10,
                  padding: '10px 8px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase', display: 'block' }}>
                    Conduct
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#9333EA', marginTop: 2, display: 'block' }}>
                    {data.conductRating}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                color: '#334155'
              }}>
                <span style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 2 }}>Institutional Remarks:</span>
                {data.remarks}
              </div>

              {/* Signature Line */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: 24,
                borderTop: '1px solid #E2E8F0'
              }}>
                <div style={{ textAlign: 'center', minWidth: 140 }}>
                  <div style={{ borderBottom: '1px solid #94A3B8', height: 20, marginBottom: 4 }} />
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Accounts Officer</span>
                </div>
                <div style={{ textAlign: 'center', minWidth: 140 }}>
                  <div style={{ borderBottom: '1px solid #94A3B8', height: 20, marginBottom: 4 }} />
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Principal / Head of Academy</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Island 4: Floating Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '11px 14px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <Copy size={15} /> {copied ? 'Copied!' : 'Copy Info'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '11px 14px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <Printer size={15} /> Print Slip
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            style={{
              padding: '11px 14px',
              borderRadius: 9999,
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
            }}
          >
            <Send size={15} /> Send WhatsApp
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 9999,
            border: 'none',
            background: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(15,23,42,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <CheckCircle2 size={16} /> Done & Close
        </button>
      </div>
    </div>
  );
};
