import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CreditCard,
  User,
  FileText,
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  Check
} from 'lucide-react';
import { FeeTransaction, Student } from '../types';
import { ModernSelect } from './ModernSelect';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';

const getOrdinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

interface RecordFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: Omit<FeeTransaction, 'id' | 'receiptNo'> & { invoiceId?: string }) => void;
  students: Student[];
  preSelectedStudentId?: string;
  preSelectedInvoiceId?: string;
  preSelectedAmount?: number;
}

export const RecordFeeModal: React.FC<RecordFeeModalProps> = ({
  isOpen,
  onClose,
  onAddPayment,
  students,
  preSelectedStudentId,
  preSelectedInvoiceId,
  preSelectedAmount
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedStudentId || students[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState(preSelectedAmount !== undefined ? String(preSelectedAmount) : '5000');
  const [waiverDiscount, setWaiverDiscount] = useState('0');
  const [discountRemarks, setDiscountRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Card' | 'JazzCash' | 'Easypaisa'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preSelectedStudentId) {
        setSelectedStudentId(preSelectedStudentId);
      }
      setWaiverDiscount('0');
      setDiscountRemarks('');
      if (preSelectedAmount !== undefined) {
        setPaymentAmount(String(preSelectedAmount));
      } else {
        const currentStudent = students.find(s => s.id === (preSelectedStudentId || selectedStudentId));
        if (currentStudent?.dueBalance && currentStudent.dueBalance > 0) {
          setPaymentAmount(String(currentStudent.dueBalance));
        } else if (currentStudent?.baseMonthlyFee) {
          setPaymentAmount(String(currentStudent.baseMonthlyFee));
        }
      }
    }
  }, [isOpen, preSelectedStudentId, preSelectedAmount, students]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (Number(waiverDiscount) > 0 && !discountRemarks.trim()) {
      return;
    }
    onAddPayment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      regNo: selectedStudent.regNo,
      amount: Number(paymentAmount) || 0,
      discount: Number(waiverDiscount) || 0,
      discountRemarks: discountRemarks || undefined,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      notes: paymentNotes,
      invoiceId: preSelectedInvoiceId
    });

    onClose();
  };

  return (
    <div 
      className="floating-island-overlay" 
      onClick={onClose} 
      style={{ zIndex: 1300 }}
    >
      <div 
        className="floating-island-container" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 540 }}
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
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Record Fee Collection</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Receive tuition payments and issue official receipts
              </p>
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
              <label className="form-label" style={{ fontSize: 12 }}>Select Enrolled Student *</label>
              <ModernSelect
                value={selectedStudentId}
                onChange={val => {
                  setSelectedStudentId(val);
                  const st = students.find(s => s.id === val);
                  if (st && st.dueBalance > 0) {
                    setPaymentAmount(String(st.dueBalance));
                  }
                }}
                options={students.map(s => ({
                  value: s.id,
                  label: `${s.name} (${s.regNo}) — Due: PKR ${formatCurrency(s.dueBalance)}`
                }))}
                zIndex={1200}
              />
            </div>

            {/* Selected Student Plan Summary */}
            {selectedStudent && (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  fontSize: 11
                }}
              >
                <div>
                  <span style={{ color: '#64748B' }}>Assigned Batch:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedStudent.gradeBatch}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Cycle Anchor:</span>
                  <div style={{ fontWeight: 700, color: '#2563EB' }}>
                    {getOrdinal(selectedStudent.billingAnchorDay || 1)} of Month
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Outstanding Dues:</span>
                  <div style={{ fontWeight: 800, color: selectedStudent.dueBalance > 0 ? '#DC2626' : '#16A34A' }}>
                    PKR {formatCurrency(selectedStudent.dueBalance)}
                  </div>
                </div>
              </div>
            )}

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Collection Amount (PKR) *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: 12, 
                    fontSize: 11, 
                    fontWeight: 800, 
                    color: '#64748B', 
                    pointerEvents: 'none' 
                  }}>
                    PKR
                  </span>
                  <input 
                    className="form-input" 
                    type="number" 
                    required 
                    min="0.01"
                    step="any"
                    placeholder="e.g. 5000" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    style={{ paddingLeft: 46 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Payment Method *</label>
                <ModernSelect
                  value={paymentMethod}
                  onChange={val => setPaymentMethod(val as any)}
                  options={[
                    { value: 'Cash', label: 'Cash Payment' },
                    { value: 'Bank Transfer', label: 'Bank Transfer (Online)' },
                    { value: 'Cheque', label: 'Cheque Deposit' },
                    { value: 'Card', label: 'Debit / Credit Card' },
                    { value: 'JazzCash', label: 'JazzCash' },
                    { value: 'Easypaisa', label: 'Easypaisa' }
                  ]}
                  zIndex={1150}
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Extra / Waiver Discount (PKR)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: 12, 
                    fontSize: 11, 
                    fontWeight: 800, 
                    color: '#64748B', 
                    pointerEvents: 'none' 
                  }}>
                    PKR
                  </span>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="0"
                    step="any"
                    placeholder="0 (Optional)" 
                    value={waiverDiscount} 
                    onChange={e => setWaiverDiscount(e.target.value)} 
                    style={{ paddingLeft: 46 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Discount Reason / Remarks {Number(waiverDiscount) > 0 ? '*' : ''}</label>
                <input 
                  className="form-input" 
                  placeholder="Required if a waiver is applied" 
                  value={discountRemarks} 
                  onChange={e => setDiscountRemarks(e.target.value)} 
                  required={Number(waiverDiscount) > 0}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Transaction Remarks / Notes</label>
              <input 
                className="form-input" 
                placeholder="e.g. Monthly fee / Installment 1 / Online Ref #84930" 
                value={paymentNotes} 
                onChange={e => setPaymentNotes(e.target.value)} 
              />
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
            <CheckCircle2 size={16} color="#10B981" /> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordFeeModal;
