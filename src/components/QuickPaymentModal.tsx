import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { Student } from '../types';

interface QuickPaymentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (paymentData: any) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({ isOpen, student, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Cash');
  const [notes, setNotes] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    onSave({
      studentId: student.id,
      amount: Number(amount),
      method,
      notes,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Reset form
    setAmount('');
    setMethod('Cash');
    setNotes('');
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
              <DollarSign size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Receive Fee Payment</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.name} • {student.regNo}</p>
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

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: 22, 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 14 
        }}>
          <form id="quick-payment-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Balance Card */}
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Current Due Balance:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: student.dueBalance > 0 ? '#DC2626' : '#16A34A' }}>
                ${student.dueBalance.toLocaleString()}
              </span>
            </div>

            {/* Payment Configuration Card */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em' }}>PAYMENT DETAILS</div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Payment Amount ($) *</label>
                <div className="input-with-icon">
                  <DollarSign size={15} className="input-icon" />
                  <input 
                    type="number" 
                    className="form-input" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    required 
                    min="1"
                    placeholder={`e.g. ${student.dueBalance > 0 ? student.dueBalance : '1000'}`}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Payment Method</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['Cash', 'Card', 'Bank Transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m as any)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 9999,
                        border: method === m ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        background: method === m ? '#0F172A' : '#FFFFFF',
                        color: method === m ? '#FFFFFF' : '#475569',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      {m === 'Cash' && <Banknote size={14} />}
                      {m === 'Card' && <CreditCard size={14} />}
                      {m === 'Bank Transfer' && <DollarSign size={14} />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Internal Notes (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="e.g. Cleared for current month, receipt #123" 
                />
              </div>
            </div>
          </form>
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
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
            type="submit"
            form="quick-payment-form"
            disabled={!amount}
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              border: 'none',
              background: !amount ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: !amount ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            <CreditCard size={15} color="#FFFFFF" /> Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};
