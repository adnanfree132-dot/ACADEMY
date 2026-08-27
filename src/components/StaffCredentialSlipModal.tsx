import React, { useRef, useState } from 'react';
import {
  KeyRound,
  Printer,
  Download,
  MessageSquare,
  X,
  Check,
  Copy,
  Building,
  ShieldCheck,
  Calendar,
  Phone,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export interface StaffCredentialData {
  staffId: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  designation: string;
  temporaryPassword: string;
  loginUrl?: string;
  issuedAt?: string;
}

interface StaffCredentialSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StaffCredentialData | null;
}

export const StaffCredentialSlipModal: React.FC<StaffCredentialSlipModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const displayPassword =
    data.temporaryPassword && data.temporaryPassword !== '••••••••'
      ? data.temporaryPassword
      : `TempPass#${Math.floor(1000 + Math.random() * 9000)}`;

  const loginUrl = data.loginUrl || `${window.location.origin}/login`;
  const issuedDateStr = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const handleCopy = () => {
    const text = `*AcademiaPro Staff Portal Credentials*\nStaff Name: ${data.fullName}\nStaff ID: ${data.staffId}\nRole: ${data.role} (${data.designation})\nTemporary Password: ${displayPassword}\nLogin Portal: ${loginUrl}\nIssued: ${issuedDateStr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppSend = () => {
    const text = `*Welcome to AcademiaPro Staff Portal*\n\nHello ${data.fullName},\nYour staff credentials have been generated:\n\n*Staff ID:* ${data.staffId}\n*Designation:* ${data.designation} (${data.role})\n*Temporary Password:* ${displayPassword}\n*Portal URL:* ${loginUrl}\n\nPlease keep your credentials confidential. You can update your password in profile settings at any time.`;
    const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1550,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="floating-island-container"
        style={{
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Staff Credential Slip
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Official access token & login credentials for staff onboarding
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Notice Callout Island */}
        <div
          style={{
            background: '#F0FDF4',
            borderRadius: 12,
            border: '1px solid #BBF7D0',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: 12, fontWeight: 600 }}>
            <ShieldCheck size={16} color="#16A34A" />
            <span>Staff profile successfully created. Credentials issued.</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: '#FFFFFF',
              border: '1px solid #86EFAC',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>

        {/* Island 3: White Printable Credential Slip Card */}
        <div
          ref={slipRef}
          className="printable-slip-card"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '22px 24px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Institutional Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px dashed #E2E8F0', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>AcademiaPro Academy</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Staff Access & Security Voucher</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-emerald" style={{ fontSize: 11, fontWeight: 700 }}>
                {data.role}
              </span>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>Issued: {issuedDateStr}</div>
            </div>
          </div>

          {/* Staff Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Employee Full Name</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{data.fullName}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Designation / Title</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>{data.designation}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Registered Contact Phone</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} color="#64748B" /> {data.phone}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Access Role Category</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={12} color="#64748B" /> {data.role}
              </div>
            </div>
          </div>

          {/* Credentials Security Box */}
          <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>System Staff ID (Login ID)</span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1E3A8A', fontFamily: 'monospace', letterSpacing: 0.5 }}>{data.staffId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Temporary Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563EB',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#065F46',
                      fontFamily: 'monospace',
                      background: '#ECFDF5',
                      padding: '4px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #A7F3D0',
                      letterSpacing: showPassword ? 0.5 : 2
                    }}
                  >
                    {showPassword ? displayPassword : '••••••••••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(displayPassword);
                      setPasswordCopied(true);
                      setTimeout(() => setPasswordCopied(false), 2000);
                    }}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: passwordCopied ? '#16A34A' : '#475569',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 30
                    }}
                    title="Copy Password"
                  >
                    {passwordCopied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #BFDBFE', paddingTop: 8, fontSize: 11, color: '#3B82F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span>Login Portal: <strong>{loginUrl}</strong></span>
              <span style={{ fontSize: 10, color: '#64748B' }}>Password can be personalized in Profile Settings</span>
            </div>
          </div>

          {/* Security Notice */}
          <div style={{ fontSize: 10.5, color: '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>
            Confidential document. Please hand over this slip securely to the staff member.
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={handleWhatsAppSend}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 18px',
              border: '1px solid #86EFAC',
              background: '#F0FDF4',
              color: '#15803D',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 101, 52, 0.12)'
            }}
          >
            <MessageSquare size={15} color="#16A34A" /> Send via WhatsApp
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                borderRadius: 9999,
                height: 40,
                padding: '0 16px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Printer size={15} color="#64748B" /> Print Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                borderRadius: 9999,
                height: 40,
                padding: '0 22px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
              }}
            >
              <Check size={15} /> Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StaffCredentialSlipModal;
