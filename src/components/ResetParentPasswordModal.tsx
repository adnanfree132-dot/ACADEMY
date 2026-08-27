import React, { useState } from 'react';
import { Key, X, Smartphone, CheckCircle2, ShieldAlert, Copy, Send, Sparkles, User, RefreshCw, MessageCircle, GraduationCap } from 'lucide-react';
import { openWhatsAppLink } from '../utils/whatsappHelper';
import { api } from '../api/apiClient';

interface ResetParentPasswordModalProps {
  student: {
    id: string;
    name: string;
    regNo: string;
    parentName?: string;
    phone: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetParentPasswordModal: React.FC<ResetParentPasswordModalProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    parentName: string;
    phone: string;
    newPassword: string;
    admissionNo: string;
  } | null>(null);

  const phoneDigits = student.phone.replace(/\D/g, '');
  const last4Phone = phoneDigits.slice(-4) || '1234';
  const cleanAdmNo = student.regNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.trim().length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.resetParentPassword(student.id, password.trim());
      setSuccessData(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reset parent password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!successData) return;
    const text = `Parent Portal Credentials\nStudent: ${student.name} (${student.regNo})\nParent: ${successData.parentName}\nLogin: ${successData.phone}\nNew Password: ${successData.newPassword}`;
    navigator.clipboard.writeText(text);
    alert('✓ Credentials copied to clipboard!');
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
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B'
            }}>
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Reset Parent Password</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Admin / Super Admin Credential Control</p>
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

        {/* Island 2: Error alert if any */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: 12,
            padding: '10px 16px',
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        {/* Success State View */}
        {successData ? (
          <>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#DCFCE7', padding: '12px 14px', borderRadius: 12, border: '1px solid #BBF7D0', color: '#166534' }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <div>
                  <strong style={{ fontSize: 13, display: 'block' }}>Password Reset Successfully!</strong>
                  <span style={{ fontSize: 11 }}>Parent account credentials have been updated and active.</span>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>Parent Name:</span>
                  <strong style={{ color: '#0F172A' }}>{successData.parentName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>Login Phone:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{successData.phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>New Password:</span>
                  <span style={{ fontFamily: 'monospace', color: '#16A34A', background: '#DCFCE7', padding: '3px 10px', borderRadius: 9999, fontWeight: 800, fontSize: 13 }}>
                    {successData.newPassword}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                  gap: 6
                }}
              >
                <Copy size={15} /> Copy Info
              </button>
              <button
                type="button"
                onClick={() => {
                  const message = `Assalam-o-Alaikum ${student.parentName || 'Parent'},\n\nYour AcademiaPro Parent Portal password for student *${student.name}* (${student.regNo}) has been updated:\n\n📱 *Login (Phone/Reg No)*: ${student.phone}\n🔑 *New Password*: ${successData.newPassword}\n\nThank you!`;
                  openWhatsAppLink(student.phone, message);
                }}
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
                boxShadow: '0 4px 14px rgba(15,23,42,0.25)'
              }}
            >
              ✓ Done & Close
            </button>
          </>
        ) : (
          /* Form View */
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Island 3: Floating White Content Card */}
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
              {/* Student & Parent Info Banner */}
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>STUDENT</div>
                  <strong style={{ fontSize: 14, color: '#0F172A' }}>{student.name}</strong>
                  <span style={{ fontSize: 11, color: '#2563EB', marginLeft: 6, fontWeight: 700 }}>({student.regNo})</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PARENT / GUARDIAN</div>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>{student.parentName || 'Parent'}</strong>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{student.phone}</div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  New Password / PIN <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new parent password..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Sparkles size={12} color="#475569" /> Quick Preset Passwords:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setPassword('123456')}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: password === '123456' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      background: password === '123456' ? '#EFF6FF' : '#FFFFFF',
                      color: password === '123456' ? '#1D4ED8' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Key size={12} color={password === '123456' ? '#1D4ED8' : '#475569'} /> Easy PIN (123456)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassword(last4Phone)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: password === last4Phone ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      background: password === last4Phone ? '#EFF6FF' : '#FFFFFF',
                      color: password === last4Phone ? '#1D4ED8' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Smartphone size={12} color={password === last4Phone ? '#1D4ED8' : '#475569'} /> Phone Last 4 ({last4Phone})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassword(cleanAdmNo)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: password === cleanAdmNo ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      background: password === cleanAdmNo ? '#EFF6FF' : '#FFFFFF',
                      color: password === cleanAdmNo ? '#1D4ED8' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <GraduationCap size={12} color={password === cleanAdmNo ? '#1D4ED8' : '#475569'} /> Admission ({cleanAdmNo})
                  </button>
                </div>
              </div>

              {/* Parent WhatsApp Quick Action Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '10px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={18} color="#16A34A" />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', display: 'block' }}>Parent WhatsApp</span>
                    <span style={{ fontSize: 11, color: '#15803D' }}>{student.phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const message = `Assalam-o-Alaikum ${student.parentName || 'Parent'},\n\nYour AcademiaPro Parent Portal password for student *${student.name}* (${student.regNo}) is:\n\n📱 *Login (Phone/Reg No)*: ${student.phone}\n🔑 *Password*: ${password.trim()}\n\nThank you!`;
                    openWhatsAppLink(student.phone, message);
                  }}
                  style={{
                    background: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Send size={13} /> Send WhatsApp
                </button>
              </div>
            </div>

            {/* Island 4: Floating Action Pills Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '12px 16px',
                  borderRadius: 9999,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '12px 16px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <Key size={16} /> Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
