import React from 'react';
import { ShieldCheck, Copy, Printer, Send, X, AlertTriangle } from 'lucide-react';
import { fillTemplate, openWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATES } from '../utils/whatsappHelper';

export interface CredentialData {
  admissionNo: string;
  studentName: string;
  studentUsername: string;
  studentPassword: string;
  parentName: string;
  parentPhone: string;
  parentUsername: string;
  parentPassword: string;
}

interface CredentialSlipModalProps {
  data: CredentialData | null;
  onClose: () => void;
}

export const CredentialSlipModal: React.FC<CredentialSlipModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const handleCopyAll = () => {
    const text = `ACADEMY CREDENTIAL SLIP
Admission No: ${data.admissionNo}
Student Name: ${data.studentName}
Student Username: ${data.studentUsername}
Student Password: ${data.studentPassword}

Parent Username: ${data.parentUsername}
Parent Password: ${data.parentPassword}`;

    navigator.clipboard.writeText(text);
    alert('✓ Credentials copied to clipboard!');
  };

  const handleSendWhatsApp = () => {
    const tmpl = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.code === 'WA_WELCOME') || DEFAULT_WHATSAPP_TEMPLATES[0];
    const message = fillTemplate(tmpl.body, {
      parent_name: data.parentName,
      student_name: data.studentName,
      academy_name: 'AcademiaPro OS',
      admission_no: data.admissionNo,
      username: data.studentUsername,
      password: data.studentPassword
    });

    openWhatsAppLink(data.parentPhone, message);
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
          maxWidth: 520, 
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Admission Credentials Slip</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Auto-Generated System Access Accounts</p>
            </div>
          </div>
          <button 
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

        {/* Island 2: Floating Critical Security Notice Callout */}
        <div style={{ 
          background: '#FEF2F2', 
          border: '1px solid #FCA5A5', 
          padding: '14px 18px', 
          borderRadius: 14, 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 12,
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.1)'
        }}>
          <AlertTriangle size={18} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <strong style={{ color: '#991B1B', display: 'inline' }}>CRITICAL SECURITY NOTICE: </strong>
            <span style={{ color: '#B91C1C' }}>Plaintext passwords are displayed ONCE and cannot be retrieved again after closing this window.</span>
          </div>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: 20, 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 14 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.05em' }}>ADMISSION NO</span>
            <strong style={{ fontSize: 15, color: '#0F172A', fontWeight: 800 }}>{data.admissionNo}</strong>
          </div>

          {/* Student Credentials Card */}
          <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em', marginBottom: 8 }}>STUDENT ACCOUNT</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#64748B' }}>Username:</span>
              <strong style={{ fontFamily: 'monospace', color: '#0F172A', fontSize: 13 }}>{data.studentUsername}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Temp Password:</span>
              <span style={{ fontFamily: 'monospace', color: '#16A34A', background: '#DCFCE7', padding: '3px 10px', borderRadius: 9999, fontWeight: 700, fontSize: 12 }}>
                {data.studentPassword}
              </span>
            </div>
          </div>

          {/* Parent Credentials Card */}
          <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em', marginBottom: 8 }}>PARENT GUARDIAN ACCOUNT</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#64748B' }}>Username:</span>
              <strong style={{ fontFamily: 'monospace', color: '#0F172A', fontSize: 13 }}>{data.parentUsername}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Temp Password:</span>
              <span style={{ fontFamily: 'monospace', color: '#16A34A', background: '#DCFCE7', padding: '3px 10px', borderRadius: 9999, fontWeight: 700, fontSize: 12 }}>
                {data.parentPassword}
              </span>
            </div>
          </div>
        </div>

        {/* Island 4: Floating 3-Column Action Pills Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <button 
            type="button"
            onClick={handleCopyAll} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 14px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Copy size={15} /> Copy All
          </button>
          <button 
            type="button"
            onClick={() => window.print()} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 14px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Printer size={15} /> Print Slip
          </button>
          <button 
            type="button"
            onClick={handleSendWhatsApp} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 14px',
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
            <Send size={15} /> Send via WhatsApp
          </button>
        </div>

        {/* Island 5: Floating Full-Width Done Pill Button */}
        <button 
          type="button"
          onClick={onClose} 
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 9999,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#0F172A',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          ✓ Done & Close
        </button>
      </div>
    </div>
  );
};
