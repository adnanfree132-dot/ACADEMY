import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, GraduationCap } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface BulkIDCardModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
}

export const BulkIDCardModal: React.FC<BulkIDCardModalProps> = ({ isOpen, students, onClose }) => {
  const [academyName, setAcademyName] = useState<string>('EXCELLENCE ACADEMY');
  const [academyAddress, setAcademyAddress] = useState<string>('Campus 1, Academic Zone');
  const [academyPhone, setAcademyPhone] = useState<string>('+92 300 0000000');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [pc, setPc] = useState('#EA580C'); // primary color
  const [sc, setSc] = useState('#1E293B'); // secondary color

  // Layout mode switcher: 'dual' (3 pairs/A4), 'front-only' (8 fronts/A4), 'back-only' (8 backs/A4)
  const [layoutMode, setLayoutMode] = useState<'dual' | 'front-only' | 'back-only'>('dual');

  useEffect(() => {
    if (isOpen) {
      api.getSettings()
        .then(s => {
          if (s?.academyName) setAcademyName(s.academyName.toUpperCase());
          if (s?.academyAddress) setAcademyAddress(s.academyAddress);
          if (s?.academyPhone) setAcademyPhone(s.academyPhone);
          if (s?.logoUrl) setLogoUrl(s.logoUrl);
          if (s?.signatureUrl) setSignatureUrl(s.signatureUrl);
          if (s?.themePrimary) setPc(s.themePrimary);
          if (s?.themeSecondary) setSc(s.themeSecondary);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !students || students.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group students into A4 pages: 3 for dual mode, 8 for front-only or back-only mode
  const studentsPerPage = layoutMode === 'dual' ? 3 : 8;
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += studentsPerPage) {
    pages.push(students.slice(i, i + studentsPerPage));
  }

  const renderFrontCard = (student: Student) => (
    <div key={student.id} className="cr80-card" style={{ width: '2.125in', height: '3.375in', background: '#FFF', borderRadius: 10, border: '1px solid #CBD5E1', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', flexShrink: 0 }}>
      {/* Top Banner */}
      <div style={{ width: '100%', height: 75, background: pc, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#FFF', zIndex: 2 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 22, width: 22, objectFit: 'contain', background: '#FFF', padding: 1, borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GraduationCap size={12} color="#FFF" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 }}>{academyName}</h4>
            <span style={{ fontSize: 6, opacity: 0.9, textTransform: 'uppercase', display: 'block' }}>OFFICIAL CARD</span>
          </div>
        </div>
        <svg viewBox="0 0 204 75" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 40 }}>
          <path d="M0,25 C70,55 140,10 204,35 L204,75 L0,75 Z" fill={sc} />
          <path d="M0,40 C80,65 150,20 204,50 L204,75 L0,75 Z" fill="#FFFFFF" />
        </svg>
      </div>
      
      {/* Student Avatar */}
      <div style={{ marginTop: -32, zIndex: 3, position: 'relative' }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: sc, border: `3.5px solid ${pc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 24, fontWeight: 900, overflow: 'hidden' }}>
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          ) : (
            student.name.charAt(0)
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 4, padding: '0 8px' }}>
        <h3 style={{ fontSize: 11, fontWeight: 900, color: sc, margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</h3>
        <span style={{ fontSize: 7, fontWeight: 800, color: pc, textTransform: 'uppercase', display: 'block' }}>OFFICIAL STUDENT</span>
      </div>

      <div style={{ width: '90%', marginTop: 6, background: '#FFF', borderRadius: 6, fontSize: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', borderBottom: `1px solid ${pc}`, padding: '3px 0' }}>
          <span style={{ fontWeight: 700, color: sc, paddingLeft: 4, borderRight: `1px.5px solid ${pc}` }}>ID #:</span>
          <strong style={{ color: sc, paddingLeft: 6 }}>{student.regNo}</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', padding: '3px 0' }}>
          <span style={{ fontWeight: 700, color: sc, paddingLeft: 4, borderRight: `1px.5px solid ${pc}` }}>Grade:</span>
          <strong style={{ color: sc, paddingLeft: 6 }}>{student.gradeBatch}</strong>
        </div>
      </div>

      <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 20, right: 8, zIndex: 4, background: '#FFF', padding: 2, borderRadius: 4, border: '1px solid #CBD5E1' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${student.regNo}`} alt="QR" style={{ width: 28, height: 28, display: 'block' }} />
        </div>
        <svg viewBox="0 0 204 35" preserveAspectRatio="none" style={{ width: '100%', height: 30, display: 'block' }}>
          <path d="M0,12 C70,35 140,0 204,20 L204,35 L0,35 Z" fill={sc} />
          <path d="M0,22 C80,35 150,10 204,28 L204,35 L0,35 Z" fill={pc} />
        </svg>
      </div>
    </div>
  );

  const renderBackCard = (student: Student) => (
    <div key={student.id} className="cr80-card" style={{ width: '2.125in', height: '3.375in', background: '#FFF', borderRadius: 10, border: '1px solid #CBD5E1', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', flexShrink: 0 }}>
      {/* Top Wavy Banner */}
      <div style={{ width: '100%', height: 42, background: pc, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 204 42" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 28 }}>
          <path d="M0,10 C70,35 140,0 204,18 L204,42 L0,42 Z" fill={sc} />
          <path d="M0,20 C80,35 150,8 204,28 L204,42 L0,42 Z" fill="#FFFFFF" />
        </svg>
      </div>

      <div style={{ padding: '12px 12px 0 12px', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', borderBottom: `1px solid ${pc}`, paddingBottom: 2 }}>
          <span style={{ fontWeight: 700, color: sc, borderRight: `1px solid ${pc}` }}>Phone:</span>
          <strong style={{ color: '#334155', paddingLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>{academyPhone}</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', borderBottom: `1px solid ${pc}`, paddingBottom: 2 }}>
          <span style={{ fontWeight: 700, color: sc, borderRight: `1px solid ${pc}` }}>School:</span>
          <strong style={{ color: '#334155', paddingLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>{academyAddress}</strong>
        </div>
      </div>

      <div style={{ padding: '10px 12px 0 12px', fontSize: 7 }}>
        <strong style={{ color: sc, display: 'block', marginBottom: 2 }}>Terms of Use:</strong>
        <p style={{ margin: 0, color: '#64748B', lineHeight: 1.2 }}>
          Property of Academy. Present upon entering campus. Return if found.
        </p>
      </div>

      <div style={{ marginTop: 'auto', width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 12, marginBottom: 4 }}>
          <div style={{ textAlign: 'center' }}>
            {signatureUrl ? (
              <img src={signatureUrl} alt="Signature" style={{ height: 22, objectFit: 'contain', background: 'transparent' }} />
            ) : (
              <span style={{ fontFamily: 'cursive', fontSize: 9, color: sc }}>Auth Sign</span>
            )}
            <span style={{ fontSize: 5, color: '#64748B', borderTop: '1px solid #94A3B8', display: 'block', textTransform: 'uppercase' }}>SIGNATURE</span>
          </div>
        </div>
        <svg viewBox="0 0 204 35" preserveAspectRatio="none" style={{ width: '100%', height: 28, display: 'block' }}>
          <path d="M0,12 C70,35 140,0 204,20 L204,35 L0,35 Z" fill={sc} />
          <path d="M0,22 C80,35 150,10 204,28 L204,35 L0,35 Z" fill={pc} />
        </svg>
      </div>
    </div>
  );

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
          maxWidth: 960, 
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
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Bulk Student ID Card Printer</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Printing {students.length} Student ID Cards ({pages.length} A4 Sheet{pages.length > 1 ? 's' : ''})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', padding: 3, borderRadius: 9999 }}>
              <button 
                type="button" 
                onClick={() => setLayoutMode('dual')}
                style={{ 
                  background: layoutMode === 'dual' ? '#10B981' : 'transparent', 
                  color: '#FFF', 
                  border: 'none', 
                  padding: '4px 12px', 
                  borderRadius: 9999, 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                Dual Side (3/A4)
              </button>
              <button 
                type="button" 
                onClick={() => setLayoutMode('front-only')}
                style={{ 
                  background: layoutMode === 'front-only' ? '#10B981' : 'transparent', 
                  color: '#FFF', 
                  border: 'none', 
                  padding: '4px 12px', 
                  borderRadius: 9999, 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                Front Only (8/A4)
              </button>
              <button 
                type="button" 
                onClick={() => setLayoutMode('back-only')}
                style={{ 
                  background: layoutMode === 'back-only' ? '#10B981' : 'transparent', 
                  color: '#FFF', 
                  border: 'none', 
                  padding: '4px 12px', 
                  borderRadius: 9999, 
                  fontSize: 11, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }}
              >
                Back Only (8/A4)
              </button>
            </div>

            <button 
              type="button" 
              onClick={handlePrint}
              style={{ background: '#10B981', border: 'none', color: '#FFFFFF', padding: '8px 18px', borderRadius: 9999, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={14} /> Print All {students.length} Cards
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFFFFF', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Island 3: Floating White Content Card (A4 Sheet Pages Preview) */}
        <div style={{ 
          padding: 22, 
          background: '#F8FAFC', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          
          <div className="print-hide" style={{ background: '#EFF6FF', color: '#1E40AF', padding: '10px 16px', borderRadius: 10, fontSize: 12, marginBottom: 20, border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              ℹ️ Standard CR80 Card Dimensions: <strong>2.125" × 3.375" (54mm × 85.6mm)</strong>. Arranged for exact A4 paper printing.
            </span>
            <span style={{ fontWeight: 700 }}>
              {layoutMode === 'dual' ? '3 Student Pairs per A4' : layoutMode === 'front-only' ? '8 Front Cards per A4' : '8 Back Cards per A4'}
            </span>
          </div>

          <div id="printable-id-card-area" style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center' }}>
            {pages.map((pageStudents, pageIdx) => (
              <div 
                key={pageIdx} 
                className="a4-print-page"
                style={{ 
                  width: '100%', 
                  maxWidth: '8.27in', 
                  minHeight: '11.69in', 
                  background: '#FFFFFF', 
                  padding: '0.4in 0.3in', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  pageBreakAfter: 'always',
                  position: 'relative'
                }}
              >
                {/* Page Number Badge (hidden when printing) */}
                <div className="print-hide" style={{ position: 'absolute', top: 10, right: 14, fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                  A4 Sheet {pageIdx + 1} of {pages.length} ({layoutMode === 'dual' ? 'Dual Pairs' : layoutMode === 'front-only' ? 'Fronts' : 'Backs'})
                </div>

                {layoutMode === 'dual' ? (
                  /* Dual Mode: 3 Rows of Student Pairs (Front + Back) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25in', alignItems: 'center' }}>
                    {pageStudents.map(student => (
                      <div key={student.id} style={{ display: 'flex', gap: '0.3in', justifyContent: 'center', alignItems: 'center' }}>
                        {renderFrontCard(student)}
                        {renderBackCard(student)}
                      </div>
                    ))}
                  </div>
                ) : layoutMode === 'front-only' ? (
                  /* Front-Only Mode: 8 Cards (2 Columns x 4 Rows Grid) per A4 */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 2.125in)', gap: '0.2in', justifyContent: 'center' }}>
                    {pageStudents.map(student => renderFrontCard(student))}
                  </div>
                ) : (
                  /* Back-Only Mode: 8 Cards (2 Columns x 4 Rows Grid) per A4 */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 2.125in)', gap: '0.2in', justifyContent: 'center' }}>
                    {pageStudents.map(student => renderBackCard(student))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Island 4: Floating Right-Aligned Action Buttons */}
        <div className="print-hide" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
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
            Cancel
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
            🖨️ Print All Cards
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
