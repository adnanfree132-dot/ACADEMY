import React from 'react';
import {
  X,
  Printer,
  Share2,
  Calendar,
  CreditCard,
  ShieldCheck,
  Award,
  Layers,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FeeTransaction, Student } from '../types';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';

export interface FeeSlipData {
  invoiceId?: string;
  receiptNo?: string;
  studentName: string;
  admissionNo: string;
  parentName?: string;
  parentPhone?: string;
  batchName?: string;
  feePeriodStart?: string;
  feePeriodEnd?: string;
  billingAnchorDay?: number;
  installmentNumber?: number;
  totalInstallments?: number;
  grossAmount: number;
  discountAmount: number;
  scholarshipType?: string;
  scholarshipReason?: string;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  paymentMethod?: string;
  paidAt?: string;
}

interface FeeSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FeeSlipData | null;
}

export const FeeSlipModal: React.FC<FeeSlipModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data) return null;

  const isPaid = data.status === 'paid';
  const isOverdue = data.status === 'overdue';
  const coverageStr = formatCoveragePeriod(data.feePeriodStart, data.feePeriodEnd);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = data.parentPhone?.replace(/[^0-9]/g, '') || '';
    const cleanPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone;
    const msg = `*ACADEMIAPRO FEE VOUCHER*\n\nStudent: ${data.studentName} (${data.admissionNo})\nBatch: ${data.batchName || 'Standard'}\nCoverage: ${coverageStr}\n${data.installmentNumber ? `Installment: ${data.installmentNumber} of ${data.totalInstallments}\n` : ''}Net Amount: PKR ${formatCurrency(data.netAmount)}\nPaid: PKR ${formatCurrency(data.paidAmount)}\nBalance Due: PKR ${formatCurrency(data.balanceAmount)}\nDue Date: ${data.dueDate}\nStatus: ${data.status.toUpperCase()}\n\nThank you!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1350,
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
          maxWidth: 580,
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
        <div
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(37, 99, 235, 0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPaid ? '#10B981' : '#38BDF8'
              }}
            >
              {isPaid ? <ShieldCheck size={20} /> : <CreditCard size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {isPaid ? 'Fee Payment Receipt' : 'Fee Billing Voucher'}
              </h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Voucher #{data.invoiceId?.slice(0, 10) || data.receiptNo || 'VCH-2026'} • {data.studentName}
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

        {/* Island 3: Floating White Slip Card */}
        <div
          id="printable-fee-slip"
          style={{
            background: '#FFFFFF',
            padding: 24,
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Header & Institute Brand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>AcademiaPro OS</h2>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Financial Statement
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: isPaid ? '#DCFCE7' : isOverdue ? '#FEE2E2' : '#EFF6FF',
                  color: isPaid ? '#166534' : isOverdue ? '#991B1B' : '#1E40AF',
                  border: `1px solid ${isPaid ? '#BBF7D0' : isOverdue ? '#FECACA' : '#BFDBFE'}`
                }}
              >
                {isPaid ? <CheckCircle2 size={12} /> : isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                {data.status}
              </span>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Due: {data.dueDate} (5 Days Grace)
              </div>
            </div>
          </div>

          {/* Student & Batch Information Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              background: '#F8FAFC',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              fontSize: 12
            }}
          >
            <div>
              <span style={{ color: '#64748B', fontSize: 11 }}>Student Name:</span>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{data.studentName}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11 }}>Admission No:</span>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{data.admissionNo}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11 }}>Academic Batch:</span>
              <div style={{ fontWeight: 600, color: '#334155' }}>{data.batchName || 'Standard'}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11 }}>Parent / Phone:</span>
              <div style={{ fontWeight: 600, color: '#334155' }}>{data.parentPhone || 'N/A'}</div>
            </div>
          </div>

          {/* Coverage Period & Cycle Indicator */}
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#2563EB" />
              <div>
                <span style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
                  Coverage Period:
                </span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1E3A8A' }}>
                  {coverageStr}
                </div>
              </div>
            </div>
            {data.installmentNumber ? (
              <span
                style={{
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  padding: '3px 9px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Installment {data.installmentNumber} of {data.totalInstallments}
              </span>
            ) : data.billingAnchorDay ? (
              <span
                style={{
                  background: '#DBEAFE',
                  color: '#1E40AF',
                  padding: '3px 9px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                Anchor Day: {data.billingAnchorDay}th
              </span>
            ) : null}
          </div>

          {/* Line Items Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', fontSize: 10 }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>
                    Tuition & Facility Fee ({coverageStr})
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                    PKR {formatCurrency(data.grossAmount)}
                  </td>
                </tr>
                {data.discountAmount > 0 && (
                  <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F0FDF4' }}>
                    <td style={{ padding: '10px 12px', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={13} color="#16A34A" />
                      Scholarship Concession {data.scholarshipReason ? `(${data.scholarshipReason})` : ''}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                      -PKR {formatCurrency(data.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>
                    Net Invoiced Amount
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                    PKR {formatCurrency(data.netAmount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', color: '#64748B' }}>
                    Amount Paid {data.paymentMethod ? `via ${data.paymentMethod}` : ''}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                    PKR {formatCurrency(data.paidAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Due Footer */}
          <div
            style={{
              background: data.balanceAmount > 0 ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${data.balanceAmount > 0 ? '#FECACA' : '#BBF7D0'}`,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: data.balanceAmount > 0 ? '#991B1B' : '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                Outstanding Balance Due:
              </span>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                Grace Period Due Date: {data.dueDate}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: data.balanceAmount > 0 ? '#DC2626' : '#16A34A' }}>
              PKR {formatCurrency(data.balanceAmount)}
            </div>
          </div>
        </div>

        {/* Island 4: Floating Paired Action Pills (Directly on Canvas) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              padding: '10px 18px',
              borderRadius: 9999,
              border: '1px solid #86EFAC',
              background: '#F0FDF4',
              color: '#16A34A',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
            }}
          >
            <MessageSquare size={15} color="#16A34A" /> WhatsApp Slip
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '10px 20px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Printer size={15} /> Print Slip
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 22px',
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
            ✓ Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeSlipModal;
