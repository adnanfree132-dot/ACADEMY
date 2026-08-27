import React from 'react';
import { ShieldCheck, Copy, Printer, Send, X, Smartphone, Key, User, Info, CheckCircle2 } from 'lucide-react';
import { fillTemplate, openWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATES } from '../utils/whatsappHelper';

export interface CredentialData {
  admissionNo: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentUsername?: string;
  parentPassword?: string;
  studentUsername?: string;
  studentPassword?: string;
}

interface CredentialSlipModalProps {
  data: CredentialData | null;
  onClose: () => void;
}

export const CredentialSlipModal: React.FC<CredentialSlipModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const loginPhone = data.parentPhone || data.parentUsername || data.admissionNo;
  const loginPassword = data.parentPassword || '123456';

  const handleCopyAll = () => {
    const text = `🎓 ACADEMIAPRO PARENT PORTAL ACCESS
Student: ${data.studentName}
Admission No: ${data.admissionNo}
Parent/Guardian: ${data.parentName}

📱 Login (Phone or Admission No): ${loginPhone}
🔑 Password: ${loginPassword}

🌐 Portal Link: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    alert('✓ Parent login details copied to clipboard!');
  };

  const handleSendWhatsApp = () => {
    const message = `Assalam-o-Alaikum ${data.parentName},\n\nWelcome to AcademiaPro! Access your child *${data.studentName}*'s attendance, marks, fees, and teacher remarks:\n\n📱 *Login (Phone/Reg No)*: ${loginPhone}\n🔑 *Password*: ${loginPassword}\n\nThank you!`;
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
          maxWidth: 480, 
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Parent Portal Access Slip</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Simple & Easy Parent Account Credentials</p>
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

        {/* Island 2: Floating White Content Card */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: 22, 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16 
        }}>
          {/* Header Row: Student & Admission */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>STUDENT</span>
              <div style={{ fontSize: 15, color: '#0F172A', fontWeight: 800 }}>{data.studentName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ADMISSION NO</span>
              <div style={{ fontSize: 14, color: '#2563EB', fontWeight: 800, fontFamily: 'monospace' }}>{data.admissionNo}</div>
            </div>
          </div>

          {/* Unified Parent Access Card */}
          <div style={{ 
            background: '#F8FAFC', 
            padding: 16, 
            borderRadius: 14, 
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={15} color="#0F172A" />
                <strong style={{ fontSize: 13, color: '#0F172A', fontWeight: 800 }}>
                  {data.parentName || 'Parent / Guardian'}
                </strong>
              </div>
              <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 800 }}>
                Parent Access
              </span>
            </div>

            {/* Login Identifier (Phone or Reg No) */}
            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={16} color="#64748B" />
                <div>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Login (Phone / ID)</span>
                  <strong style={{ fontSize: 14, color: '#0F172A', fontFamily: 'monospace' }}>{loginPhone}</strong>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                Easy Login
              </span>
            </div>

            {/* Simple Password */}
            <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={16} color="#64748B" />
                <div>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Password</span>
                  <strong style={{ fontSize: 15, color: '#16A34A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{loginPassword}</strong>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#166534', fontWeight: 700, background: '#DCFCE7', padding: '3px 8px', borderRadius: 6 }}>
                Active
              </span>
            </div>

            {/* Helper Notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginTop: 2 }}>
              <Info size={13} color="#2563EB" />
              <span>Parents can sign in directly using their registered mobile number.</span>
            </div>
          </div>
        </div>

        {/* Island 3: Floating Action Buttons Row */}
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            <Copy size={15} /> Copy
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={15} /> Print
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
              background: '#10B981',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={15} /> WhatsApp
          </button>
        </div>

        {/* Island 4: Floating Full-Width Done Pill Button */}
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
            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
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
