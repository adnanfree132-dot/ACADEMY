import React, { useState } from 'react';
import { X, CreditCard, DollarSign, User, FileText } from 'lucide-react';
import { FeeTransaction, Student } from '../types';
import { CustomSelect } from './CustomSelect';

interface RecordFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
  students: Student[];
}

export const RecordFeeModal: React.FC<RecordFeeModalProps> = ({
  isOpen,
  onClose,
  onAddPayment,
  students
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Card'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentObj = students.find(s => s.id === selectedStudentId) || students[0];
    if (!studentObj) return;

    onAddPayment({
      studentId: studentObj.id,
      studentName: studentObj.name,
      regNo: studentObj.regNo,
      amount: Number(paymentAmount),
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      notes: paymentNotes
    });

    onClose();
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
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Record Fee Payment</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Select student and enter paid tuition amount</p>
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

        {/* Island 3: Floating White Form Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          <form id="record-fee-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Select Student *</label>
              <CustomSelect
                value={selectedStudentId}
                onChange={val => setSelectedStudentId(val)}
                options={students.map(s => ({
                  value: s.id,
                  label: `${s.name} (${s.regNo}) — Due: $${s.dueBalance}`
                }))}
              />
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Amount Paid ($) *</label>
                <div className="input-with-icon">
                  <DollarSign size={15} className="input-icon" />
                  <input 
                    type="number" 
                    className="form-input" 
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Payment Method</label>
                <CustomSelect
                  value={paymentMethod}
                  onChange={val => setPaymentMethod(val as any)}
                  options={[
                    { value: 'Cash', label: '💵 Cash' },
                    { value: 'Bank Transfer', label: '🏦 Bank Transfer' },
                    { value: 'Cheque', label: '📜 Cheque' },
                    { value: 'Card', label: '💳 Card' }
                  ]}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Receipt Notes / Reference No</label>
              <div className="input-with-icon">
                <FileText size={15} className="input-icon" />
                <input 
                  className="form-input" 
                  placeholder="Optional payment notes or transaction ID" 
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
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
            form="record-fee-form"
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
            ✓ Submit Payment Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
