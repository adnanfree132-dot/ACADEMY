import React, { useEffect, useState } from 'react';
import { X, DollarSign, Clock, CheckCircle2, AlertCircle, PieChart, Calendar, FileText, CreditCard, Banknote, ArrowUpRight } from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';

interface StudentLedgerModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onOpenPayModal: (student: Student) => void;
}

export const StudentLedgerModal: React.FC<StudentLedgerModalProps> = ({
  isOpen,
  student,
  onClose,
  onOpenPayModal
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      api.getStudentLedger(student.id)
        .then((res: any) => {
          if (res) {
            setPayments(res.payments || []);
            setInvoices(res.invoices || []);
          }
        })
        .catch(err => console.warn('Ledger fetch warning:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const due = student.dueBalance || 0;
  const monthlyFee = student.totalFee || 10000;
  const paid = student.paidFee || 0;

  const getStatusBadge = () => {
    if (due <= 0) {
      return <span className="badge badge-green"><CheckCircle2 size={12} /> Fully Paid</span>;
    }
    if (paid > 0) {
      return <span className="badge badge-blue"><PieChart size={12} /> Partially Paid</span>;
    }
    if (due <= monthlyFee) {
      return <span className="badge badge-amber"><Clock size={12} /> Pending</span>;
    }
    return <span className="badge badge-red"><AlertCircle size={12} /> Defaulter</span>;
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
          maxWidth: 620, 
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{student.name}</h3>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{student.regNo}</span>
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>{student.gradeBatch} • Parent: {student.parentName}</p>
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

        {/* Island 2: Floating Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Monthly Fee</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2, margin: 0 }}>${monthlyFee.toLocaleString()}</h3>
          </div>

          <div style={{ background: 'rgba(240, 253, 244, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: '1px solid #BBF7D0', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.06)' }}>
            <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>Total Paid</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#16A34A', marginTop: 2, margin: 0 }}>${paid.toLocaleString()}</h3>
          </div>

          <div style={{ background: due > 0 ? 'rgba(254, 242, 242, 0.95)' : 'rgba(240, 253, 244, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: `1px solid ${due > 0 ? '#FECDD3' : '#BBF7D0'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 11, color: due > 0 ? '#B91C1C' : '#15803D', fontWeight: 700 }}>Balance Due</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: due > 0 ? '#DC2626' : '#16A34A', marginTop: 2, margin: 0 }}>${due.toLocaleString()}</h3>
          </div>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '60vh', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Quick Collect Action Prompt */}
          {due > 0 && (
            <div style={{ background: '#EFF6FF', padding: '12px 16px', borderRadius: 12, border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Payment Action Available</span>
                <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, margin: 0 }}>Outstanding balance of ${due.toLocaleString()} remains pending.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayModal(student);
                }}
                style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 9999, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <DollarSign size={14} /> Receive Fee Now
              </button>
            </div>
          )}

          {/* Payment History Section */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={15} color="#3B82F6" /> Previous Payment Transactions
            </h3>

            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Loading financial history...</div>
            ) : payments.length > 0 ? (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 11, color: '#64748B' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Receipt / Ref</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Method</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id || i} style={{ borderBottom: i < payments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : p.date || 'Recent'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>
                          {p.receipt_no || p.receiptNo || `REC-${p.id?.slice(0, 6)}`}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748B', textTransform: 'capitalize' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {p.method === 'card' ? <CreditCard size={12} /> : <Banknote size={12} />}
                            {p.method || 'Cash'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                          +${(p.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginBottom: paid > 0 ? 8 : 0 }}>No previous recorded transactions found for this student.</p>
                {paid > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', color: '#15803D', padding: '6px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Recorded Paid Total: ${paid.toLocaleString()}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};
