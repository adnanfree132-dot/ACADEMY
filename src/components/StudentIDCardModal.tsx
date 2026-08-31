import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, QrCode, ShieldCheck, Phone, MapPin, GraduationCap, Building2 } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface StudentIDCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({ student, onClose }) => {
  const [academyName, setAcademyName] = useState<string>('EXCELLENCE ACADEMY');
  const [session, setSession] = useState<string>('2026 - 2027');
  const [principalName, setPrincipalName] = useState<string>('Dr. S. A. Khan');
  const [academyAddress, setAcademyAddress] = useState<string>('123 Elm Street, Springfield, USA');
  const [academyPhone, setAcademyPhone] = useState<string>('(123) 456-7890');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  // Dynamic theme colors (defaults: Orange & Charcoal)
  const [pc, setPc] = useState('#EA580C'); // primary color
  const [sc, setSc] = useState('#1E293B'); // secondary color
  const [idCardFields, setIdCardFields] = useState<any>({
    showRegNo: true,
    showClassBatch: true,
    showPhone: true,
    showDOB: true,
    showBloodGroup: true,
    showAddress: true,
    showCustomFields: true
  });

  useEffect(() => {
    api.getSettings()
      .then(s => {
        if (s?.academyName) setAcademyName(s.academyName.toUpperCase());
        if (s?.academicSession) setSession(s.academicSession);
        if (s?.principalName) setPrincipalName(s.principalName);
        if (s?.academyAddress) setAcademyAddress(s.academyAddress);
        if (s?.academyPhone) setAcademyPhone(s.academyPhone);
        if (s?.logoUrl) setLogoUrl(s.logoUrl);
        if (s?.signatureUrl) setSignatureUrl(s.signatureUrl);
        if (s?.themePrimary) setPc(s.themePrimary);
        if (s?.themeSecondary) setSc(s.themeSecondary);
        if (s?.idCardFields) {
          try {
            const parsed = typeof s.idCardFields === 'string' ? JSON.parse(s.idCardFields) : s.idCardFields;
            if (parsed) setIdCardFields(parsed);
          } catch (e) {}
        }
      })
      .catch(() => {
        const localConfig = localStorage.getItem('idCardFields');
        if (localConfig) {
          try { setIdCardFields(JSON.parse(localConfig)); } catch (e) {}
        }
      });
  }, []);

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://academy-system.com/verify?studentId=${student.id}%26regNo=${student.regNo}`;

  return createPortal(
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
          maxWidth: 760, 
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
        <div className="print-hide" style={{ 
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
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Official Student ID Card</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.name} ({student.regNo}) • Institutional Identity Badge</p>
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

        {/* Island 3: Floating ID Card Preview Area */}
        <div id="printable-id-card-area" style={{ 
          padding: 24, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          gap: 24, 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          
          {/* ==================== CARD FRONT ==================== */}
          <div 
            style={{ 
              width: 310, 
              height: 485, 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1px solid #CBD5E1', 
              boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.15)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative' 
            }}
          >
            {/* Top Wavy Banner SVG */}
            <div style={{ width: '100%', height: 110, background: pc, position: 'relative', overflow: 'hidden' }}>
              {/* Institution Logo & Text with 14px safe margin on both left and right edges */}
              <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF', zIndex: 2 }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ height: 34, width: 34, objectFit: 'contain', background: '#FFF', padding: 2, borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.15)' }}>
                    <GraduationCap size={18} color="#FFF" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: 0.4, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {academyName}
                  </h4>
                  <span style={{ fontSize: 8, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginTop: 1, fontWeight: 700 }}>
                    OFFICIAL CARD
                  </span>
                </div>
              </div>

              {/* Dark Wave Overlay */}
              <svg viewBox="0 0 310 110" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 60 }}>
                <path d="M0,40 C100,80 200,10 310,50 L310,110 L0,110 Z" fill={sc} />
                <path d="M0,60 C120,100 220,30 310,75 L310,110 L0,110 Z" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Student Photo Avatar (Large Circular Ring) */}
            <div style={{ marginTop: -45, zIndex: 3, position: 'relative' }}>
              <div 
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: '50%', 
                  background: sc, 
                  border: `5px solid ${pc}`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#FFFFFF', 
                  fontSize: 38, 
                  fontWeight: 900, 
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  overflow: 'hidden'
                }}
              >
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                ) : (
                  student.name.charAt(0)
                )}
              </div>
            </div>

            {/* Student Name & Subtitle */}
            <div style={{ textAlign: 'center', marginTop: 10, padding: '0 16px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: sc, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {student.name}
              </h3>
              <span style={{ fontSize: 11, fontWeight: 800, color: pc, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginTop: 2 }}>
                OFFICIAL STUDENT
              </span>
            </div>

            {/* Details Table with Themed Lined Dividers & Configurable Fields */}
            <div style={{ width: '85%', marginTop: 14, background: '#FFFFFF', borderRadius: 8, overflow: 'hidden' }}>
              {idCardFields.showRegNo !== false && (
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: `1px solid ${pc}`, padding: '6px 0', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: sc, paddingLeft: 8, borderRight: `2px solid ${pc}` }}>Student ID #:</span>
                  <strong style={{ color: sc, paddingLeft: 10 }}>{student.regNo}</strong>
                </div>
              )}

              {idCardFields.showClassBatch !== false && (
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: `1px solid ${pc}`, padding: '6px 0', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: sc, paddingLeft: 8, borderRight: `2px solid ${pc}` }}>Grade / Batch:</span>
                  <strong style={{ color: sc, paddingLeft: 10 }}>{student.gradeBatch}</strong>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: `1px solid ${pc}`, padding: '6px 0', fontSize: 11 }}>
                <span style={{ fontWeight: 700, color: sc, paddingLeft: 8, borderRight: `2px solid ${pc}` }}>Guardian:</span>
                <strong style={{ color: sc, paddingLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.parentName}</strong>
              </div>

              {idCardFields.showPhone !== false && (
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: `1px solid ${pc}`, padding: '6px 0', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: sc, paddingLeft: 8, borderRight: `2px solid ${pc}` }}>Phone:</span>
                  <strong style={{ color: sc, paddingLeft: 10 }}>{student.phone}</strong>
                </div>
              )}

              {/* Custom Fields Dynamically Rendered on Card */}
              {idCardFields.showCustomFields !== false && (student as any).custom_fields && (
                Object.entries((student as any).custom_fields).map(([key, val]) => (
                  val ? (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: `1px solid ${pc}`, padding: '6px 0', fontSize: 11 }}>
                      <span style={{ fontWeight: 700, color: sc, paddingLeft: 8, borderRight: `2px solid ${pc}`, textTransform: 'capitalize' }}>{key}:</span>
                      <strong style={{ color: sc, paddingLeft: 10 }}>{String(val)}</strong>
                    </div>
                  ) : null
                ))
              )}
            </div>

            {/* Bottom Section: QR Code & Bottom Wave */}
            <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
              {/* QR Code Positioned Bottom Right with explicit digital scan label */}
              <div style={{ position: 'absolute', bottom: 35, right: 14, zIndex: 4, background: '#FFF', padding: '4px 6px', borderRadius: 6, border: '1px solid #CBD5E1', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 44, height: 44, display: 'block' }} />
                <span style={{ fontSize: 6, fontWeight: 800, color: sc, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  SCAN FOR DIGITAL VERIFICATION
                </span>
              </div>

              {/* Bottom Decorative Waves */}
              <svg viewBox="0 0 310 50" preserveAspectRatio="none" style={{ width: '100%', height: 45, display: 'block' }}>
                <path d="M0,20 C100,50 200,0 310,30 L310,50 L0,50 Z" fill={sc} />
                <path d="M0,35 C120,50 220,15 310,40 L310,50 L0,50 Z" fill={pc} />
              </svg>
            </div>
          </div>


          {/* ==================== CARD BACK ==================== */}
          <div 
            style={{ 
              width: 310, 
              height: 485, 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1px solid #CBD5E1', 
              boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.15)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              position: 'relative' 
            }}
          >
            {/* Top Wavy Banner SVG */}
            <div style={{ width: '100%', height: 60, background: pc, position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 310 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 40 }}>
                <path d="M0,15 C100,50 200,0 310,25 L310,60 L0,60 Z" fill={sc} />
                <path d="M0,28 C120,55 220,10 310,40 L310,60 L0,60 Z" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Contact Details Grid with Themed Lines */}
            <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', borderBottom: `1px solid ${pc}`, paddingBottom: 4 }}>
                <span style={{ fontWeight: 700, color: sc, borderRight: `1px solid ${pc}` }}>Phone:</span>
                <strong style={{ color: '#334155', paddingLeft: 8 }}>{academyPhone}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', borderBottom: `1px solid ${pc}`, paddingBottom: 4 }}>
                <span style={{ fontWeight: 700, color: sc, borderRight: `1px solid ${pc}` }}>Email:</span>
                <strong style={{ color: '#334155', paddingLeft: 8 }}>info@schoolname.com</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', borderBottom: `1px solid ${pc}`, paddingBottom: 4 }}>
                <span style={{ fontWeight: 700, color: sc, borderRight: `1px solid ${pc}` }}>School Address:</span>
                <strong style={{ color: '#334155', paddingLeft: 8 }}>{academyAddress}</strong>
              </div>
            </div>

            {/* Terms of Use */}
            <div style={{ padding: '16px 20px 0 20px', fontSize: 9 }}>
              <strong style={{ color: sc, display: 'block', marginBottom: 4 }}>Terms of Use:</strong>
              <p style={{ margin: 0, color: '#64748B', lineHeight: 1.4 }}>
                This card is non-transferable and remains property of the Academy. Present upon entering campus and taking examinations. If found, please return to Student Affairs ({academyAddress}).
              </p>
            </div>

            {/* Signature & Bottom Wave */}
            <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
              {/* Signature Line */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 20, marginBottom: 6 }}>
                <div style={{ textAlign: 'center' }}>
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature" style={{ height: 32, maxHeight: 36, objectFit: 'contain', display: 'block', margin: '0 auto 2px auto', background: 'transparent' }} />
                  ) : (
                    <span style={{ fontFamily: 'cursive', fontSize: 12, fontWeight: 700, color: sc }}>{principalName}</span>
                  )}
                  <span style={{ fontSize: 7, color: '#64748B', borderTop: '1px solid #94A3B8', display: 'block', paddingTop: 1, textTransform: 'uppercase' }}>
                    AUTHORIZED SIGNATURE
                  </span>
                </div>
              </div>

              {/* Bottom Decorative Waves */}
              <svg viewBox="0 0 310 50" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }}>
                <path d="M0,20 C100,50 200,0 310,30 L310,50 L0,50 Z" fill={sc} />
                <path d="M0,35 C120,50 220,15 310,40 L310,50 L0,50 Z" fill={pc} />
              </svg>
            </div>
          </div>

        </div>

        {/* Island 4: Floating Actions Row directly on Canvas */}
        <div className="print-hide" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={handlePrint}
            style={{ 
              background: '#FFFFFF', 
              color: '#0F172A',
              border: '1px solid #CBD5E1', 
              padding: '10px 20px', 
              borderRadius: 9999, 
              fontSize: 13, 
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Printer size={15} /> Print / Save as PDF
          </button>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: '#0F172A', 
              color: '#FFFFFF',
              border: 'none', 
              padding: '10px 24px', 
              borderRadius: 9999, 
              fontSize: 13, 
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            ✓ Done & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

