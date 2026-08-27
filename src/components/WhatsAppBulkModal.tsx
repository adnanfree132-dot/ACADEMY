import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Send, CheckCircle2, FileText, User, ChevronRight, Sparkles, Edit3 } from 'lucide-react';
import { Student } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES, WhatsAppTemplate, fillTemplate, openWhatsAppLink } from '../utils/whatsappHelper';
import { api } from '../api/apiClient';

interface WhatsAppBulkModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
}

export const WhatsAppBulkModal: React.FC<WhatsAppBulkModalProps> = ({ isOpen, students, onClose }) => {
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('WA_DEFAULTER');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [academyName, setAcademyName] = useState<string>('EXCELLENCE ACADEMY');
  const [sentStudentIds, setSentStudentIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      api.getSettings()
        .then(s => {
          if (s?.academyName) setAcademyName(s.academyName);
        })
        .catch(() => {});
      setSentStudentIds(new Set());
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !students || students.length === 0) return null;

  const currentTemplate = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.code === selectedTemplateCode);

  const generateMessageForStudent = (s: Student): string => {
    const rawTemplate = selectedTemplateCode === 'CUSTOM' ? customMessage : (currentTemplate?.body || '');
    return fillTemplate(rawTemplate, {
      student_name: s.name,
      parent_name: s.parentName || 'Parent / Guardian',
      academy_name: academyName,
      admission_no: s.regNo,
      balance: (s.dueBalance || 0).toLocaleString(),
      amount: (s.dueBalance || 0).toLocaleString(),
      month: 'Current Month',
      days_overdue: '7',
      due_date: '5th of this month',
      batch_name: s.gradeBatch
    });
  };

  const handleSendToStudent = (student: Student) => {
    const message = generateMessageForStudent(student);
    openWhatsAppLink(student.phone, message);
    setSentStudentIds(prev => new Set(prev).add(student.id));
  };

  const handleSendNext = () => {
    const pendingStudents = students.filter(s => !sentStudentIds.has(s.id));
    if (pendingStudents.length > 0) {
      const nextStudent = pendingStudents[0];
      handleSendToStudent(nextStudent);
    }
  };

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
          maxWidth: 840, 
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
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>WhatsApp Bulk Message Dispatcher</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Select a message template & dispatch to {students.length} recipient{students.length > 1 ? 's' : ''}
              </p>
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

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 18 
        }}>
          
          {/* Section 1: Template Selection Grid */}
          <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>
              1. Choose Message Template:
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {DEFAULT_WHATSAPP_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplateCode === tmpl.code;
                return (
                  <div 
                    key={tmpl.code}
                    onClick={() => setSelectedTemplateCode(tmpl.code)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: isSelected ? '2px solid #16A34A' : '1px solid #CBD5E1',
                      background: isSelected ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? '#15803D' : '#0F172A' }}>
                      {tmpl.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{tmpl.code}</div>
                  </div>
                );
              })}
              
              {/* Custom Message Card */}
              <div 
                onClick={() => setSelectedTemplateCode('CUSTOM')}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: selectedTemplateCode === 'CUSTOM' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                  background: selectedTemplateCode === 'CUSTOM' ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12, color: selectedTemplateCode === 'CUSTOM' ? '#15803D' : '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Edit3 size={13} color={selectedTemplateCode === 'CUSTOM' ? '#15803D' : '#475569'} /> Custom Message
                </div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Write your own text</div>
              </div>
            </div>

            {selectedTemplateCode === 'CUSTOM' && (
              <div style={{ marginTop: 12 }}>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={customMessage} 
                  onChange={e => setCustomMessage(e.target.value)} 
                  placeholder="Type your custom notification message here..." 
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Section 2: Dispatch Queue */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  2. Dispatch Queue ({sentStudentIds.size} / {students.length} sent)
                </label>
              </div>

              {students.length > sentStudentIds.size && (
                <button
                  type="button"
                  onClick={handleSendNext}
                  style={{
                    background: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Send size={14} /> Send Next ({students.length - sentStudentIds.size} Remaining) <ChevronRight size={14} />
                </button>
              )}
            </div>

            {/* Student Dispatch Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 10, color: '#64748B' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Student</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Parent & Contact</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Pending Due</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const isSent = sentStudentIds.has(s.id);
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9', background: isSent ? '#F0FDF4' : '#FFFFFF' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: '#0F172A', display: 'block' }}>{s.name}</strong>
                          <span style={{ fontSize: 10, color: '#64748B' }}>{s.regNo}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ color: '#334155', display: 'block' }}>{s.parentName || 'Parent'}</span>
                          <span style={{ fontSize: 10, color: '#64748B' }}>{s.phone}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontWeight: 700, color: (s.dueBalance || 0) > 0 ? '#DC2626' : '#16A34A' }}>
                            ${(s.dueBalance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isSent ? (
                            <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 800 }}>Sent</span>
                          ) : (
                            <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button 
                            type="button" 
                            onClick={() => handleSendToStudent(s)}
                            style={{
                              background: isSent ? '#E2E8F0' : '#15803D',
                              color: isSent ? '#475569' : '#FFFFFF',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isSent ? 'Resend' : 'Send'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Island 4: Floating Right-Aligned Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '10px 24px', 
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
            ✓ Done & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
