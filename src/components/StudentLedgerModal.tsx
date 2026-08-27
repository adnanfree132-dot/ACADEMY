import React, { useEffect, useState } from 'react';
import {
  X,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Printer,
  Award,
  Layers,
  Check
} from 'lucide-react';
import { Student } from '../types';
import { api } from '../api/apiClient';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';
import { FeeSlipModal, FeeSlipData } from './FeeSlipModal';

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
  const [installmentSchedules, setInstallmentSchedules] = useState<any[]>([]);
  const [selectedSlipData, setSelectedSlipData] = useState<FeeSlipData | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      api.getStudentLedger(student.id)
        .then((res: any) => {
          if (res) {
            setPayments(res.payments || []);
            setInvoices(res.invoices || []);
            setInstallmentSchedules(res.installmentSchedules || []);
          }
        })
        .catch(err => console.warn('Ledger fetch warning:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const due = student.dueBalance || 0;
  const monthlyFee = student.baseMonthlyFee || student.totalFee || 5000;
  const paid = student.paidFee || 0;

  const handleOpenSlip = (inv: any) => {
    setSelectedSlipData({
      invoiceId: inv.id,
      studentName: student.name,
      admissionNo: student.regNo || student.admission_no || 'N/A',
      parentName: student.parentName,
      parentPhone: student.phone,
      batchName: student.gradeBatch,
      feePeriodStart: inv.fee_period_start,
      feePeriodEnd: inv.fee_period_end,
      billingAnchorDay: inv.billing_anchor_day || student.billingAnchorDay,
      installmentNumber: inv.installment_number,
      totalInstallments: inv.total_installments,
      grossAmount: inv.amount,
      discountAmount: inv.discount || 0,
      scholarshipType: student.scholarshipType,
      scholarshipReason: student.scholarshipReason,
      netAmount: inv.net_amount,
      paidAmount: inv.feePayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
      balanceAmount: Math.max(0, inv.net_amount - (inv.feePayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)),
      dueDate: inv.due_date,
      status: inv.status
    });
  };

  return (
    <>
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
            maxWidth: 680, 
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{student.name}</h3>
                  <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700 }}>{student.regNo}</span>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                  {student.gradeBatch} • Anchor Cycle: {student.billingAnchorDay || 1}th of month
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

          {/* Island 2: Floating Summary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Base Tuition Fee</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2, margin: 0 }}>PKR {formatCurrency(monthlyFee)}</h3>
            </div>

            <div style={{ background: 'rgba(240, 253, 244, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: '1px solid #BBF7D0', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.06)' }}>
              <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>Total Collected</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#16A34A', marginTop: 2, margin: 0 }}>PKR {formatCurrency(paid)}</h3>
            </div>

            <div style={{ background: due > 0 ? 'rgba(254, 242, 242, 0.95)' : 'rgba(240, 253, 244, 0.95)', backdropFilter: 'blur(8px)', padding: '12px 14px', borderRadius: 14, border: `1px solid ${due > 0 ? '#FECDD3' : '#BBF7D0'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 11, color: due > 0 ? '#B91C1C' : '#15803D', fontWeight: 700 }}>Balance Due</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: due > 0 ? '#DC2626' : '#16A34A', marginTop: 2, margin: 0 }}>PKR {formatCurrency(due)}</h3>
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
                  <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, margin: 0 }}>
                    Outstanding balance of PKR {formatCurrency(due)} remains pending.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayModal(student);
                  }}
                  style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', padding: '7px 16px', borderRadius: 9999, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <DollarSign size={14} /> Receive Fee Now
                </button>
              </div>
            )}

            {/* Course Installment Plan (If Active) */}
            {installmentSchedules.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} color="#2563EB" /> Course Installment Timeline
                </h3>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 10, color: '#64748B' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Inst #</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Coverage Window</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Due Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Voucher Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentSchedules.map((s, i) => (
                        <tr key={s.id || i} style={{ borderBottom: i < installmentSchedules.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>
                            {s.installment_number} of {s.total_installments}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#334155' }}>
                            {formatCoveragePeriod(s.fee_period_start, s.fee_period_end)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                            PKR {formatCurrency(s.amount)}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>
                            {s.due_date}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                background: s.invoice_id ? '#EFF6FF' : '#F1F5F9',
                                color: s.invoice_id ? '#2563EB' : '#64748B'
                              }}
                            >
                              {s.invoice_id ? 'Voucher Issued' : 'Scheduled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoiced Vouchers Section */}
            {invoices.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} color="#475569" /> Invoiced Fee Vouchers
                </h3>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 10, color: '#64748B' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Coverage Period</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Fee</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Due Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv, i) => (
                        <tr key={inv.id || i} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 10px', color: '#0F172A', fontWeight: 600 }}>
                            {formatCoveragePeriod(inv.fee_period_start, inv.fee_period_end)}
                            {inv.installment_number && (
                              <span style={{ marginLeft: 6, fontSize: 10, background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: 9999, fontWeight: 700 }}>
                                Inst {inv.installment_number}/{inv.total_installments}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                            PKR {formatCurrency(inv.net_amount)}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748B' }}>
                            {inv.due_date}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                background: inv.status === 'paid' ? '#DCFCE7' : inv.status === 'overdue' ? '#FEE2E2' : '#EFF6FF',
                                color: inv.status === 'paid' ? '#166534' : inv.status === 'overdue' ? '#991B1B' : '#1E40AF'
                              }}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenSlip(inv)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #CBD5E1',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Printer size={12} /> Voucher
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment History Section */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} color="#475569" /> Recorded Payment Receipts
              </h3>

              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: 12 }}>Loading financial records...</div>
              ) : payments.length > 0 ? (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 10, color: '#64748B' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Receipt No</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Method</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={p.id || i} style={{ borderBottom: i < payments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 10px', color: '#334155' }}>
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : p.date || 'Recent'}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>
                            {p.receipt_no || p.receiptNo || `REC-${p.id?.slice(0, 6)}`}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748B', textTransform: 'capitalize' }}>
                            {p.method || 'Cash'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                            +PKR {formatCurrency(p.amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>No payments recorded yet.</p>
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

      {selectedSlipData && (
        <FeeSlipModal
          isOpen={!!selectedSlipData}
          onClose={() => setSelectedSlipData(null)}
          data={selectedSlipData}
        />
      )}
    </>
  );
};

export default StudentLedgerModal;
