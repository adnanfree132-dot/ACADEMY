import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Printer, 
  Calendar,
  Check
} from 'lucide-react';
import { api } from '../api/apiClient';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';
import { TabType } from '../types';

interface StudentFeeViewProps {
  student?: any;
  onNavigate: (tab: TabType) => void;
}

export const StudentFeeView: React.FC<StudentFeeViewProps> = ({ student }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentFeeData = async () => {
      setLoading(true);
      try {
        const [invRes, payRes] = await Promise.all([
          api.getInvoices().catch(() => []),
          api.getPayments().catch(() => [])
        ]);
        if (Array.isArray(invRes)) setInvoices(invRes);
        if (Array.isArray(payRes)) setPayments(payRes);
      } catch (err) {
        console.error('Error fetching student fee info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentFeeData();
  }, []);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.net_amount || inv.amount || 0), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const dueBalance = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div 
        style={{
          background: '#0F172A',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div 
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Receipt size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>
              My Fee Slips & Billing
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
              Student: <strong style={{ color: '#E2E8F0' }}>{student?.name || 'Student'}</strong> &bull; Admission No: <strong style={{ color: '#E2E8F0' }}>{student?.admission_no || student?.admissionNo || 'ADM-2026'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Printer size={15} />
          <span>Print Statement</span>
        </button>
      </div>

      {/* 3 Summary Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Total Invoiced Fee</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>{formatCurrencyPKR(totalInvoiced)}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>Total tuition & academy charges</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Total Amount Paid</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>{formatCurrencyPKR(totalPaid)}</div>
          <div style={{ fontSize: 11.5, color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={13} /> {payments.length} Cleared Receipts
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Current Outstanding Dues</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: dueBalance > 0 ? '#DC2626' : '#059669' }}>
            {dueBalance > 0 ? formatCurrencyPKR(dueBalance) : 'Fully Cleared'}
          </div>
          <div style={{ fontSize: 11.5, color: dueBalance > 0 ? '#DC2626' : '#059669', marginTop: 4 }}>
            {dueBalance > 0 ? 'Pending Payment' : 'Zero balance remaining'}
          </div>
        </div>
      </div>

      {/* Invoices and Receipts Dual Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
        {/* Fee Invoices */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FileText size={18} color="#2563EB" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Fee Invoices & Slips</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>Loading invoices...</div>
          ) : invoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invoices.map((inv) => (
                <div 
                  key={inv.id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {inv.invoice_no || inv.invoiceNumber || 'INV-2026'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                      Due: {inv.due_date || 'Current Session'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      {formatCurrencyPKR(inv.net_amount || inv.amount || 0)}
                    </div>
                    <span 
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: inv.status === 'paid' ? '#ECFDF5' : '#FEF2F2',
                        color: inv.status === 'paid' ? '#059669' : '#DC2626'
                      }}
                    >
                      {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
              No fee invoices issued yet.
            </div>
          )}
        </div>

        {/* Payment Receipts */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard size={18} color="#059669" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Payment Receipts</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>Loading payments...</div>
          ) : payments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map((p) => (
                <div 
                  key={p.id}
                  style={{
                    padding: '14px 16px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: 10,
                    border: '1px solid #DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                      {p.receipt_no || p.receiptNo || 'Receipt'}
                    </div>
                    <div style={{ fontSize: 12, color: '#15803D', marginTop: 3 }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Paid'} &bull; Mode: {p.method || 'Cash'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>
                      {formatCurrencyPKR(p.amount || 0)}
                    </div>
                    <span 
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: '#DCFCE7',
                        color: '#15803D'
                      }}
                    >
                      Cleared
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
              No payments recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
