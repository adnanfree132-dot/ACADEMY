import React, { useState, useEffect } from 'react';
import { Student, FeeTransaction } from '../types';
import {
  CreditCard,
  AlertTriangle,
  Plus,
  FileText,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Download,
  RefreshCw,
  Calendar,
  Layers,
  Award,
  Clock,
  DollarSign
} from 'lucide-react';
import { api, peekApiCache } from '../api/apiClient';
import { useApiCacheSync } from '../lib/useApiCacheSync';
import { exportToCSV } from '../utils/csvExporter';
import { RecordFeeModal } from '../components/RecordFeeModal';
import { FeeSlipModal, FeeSlipData } from '../components/FeeSlipModal';
import { StudentLedgerModal } from '../components/StudentLedgerModal';
import { formatCurrency, formatCoveragePeriod } from '../utils/feeCalculator';
import { showToast } from '../lib/toast';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

interface FeeManagementViewProps {
  students: Student[];
  transactions: FeeTransaction[];
  onOpenCreateModal: () => void;
  onAddPayment?: (payment: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
}

export const FeeManagementView: React.FC<FeeManagementViewProps> = ({
  students,
  transactions,
  onOpenCreateModal,
  onAddPayment
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledgers' | 'invoices' | 'defaulters' | 'history' | 'dayend'>('ledgers');
  const [dayEnd, setDayEnd] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<any[]>(() => peekApiCache<any[]>('/fees/invoices') || []);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');
  
  // Modals state
  const [isRecordFeeModalOpen, setIsRecordFeeModalOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<any | null>(null);
  const [selectedStudentForLedger, setSelectedStudentForLedger] = useState<Student | null>(null);
  const [selectedSlipData, setSelectedSlipData] = useState<FeeSlipData | null>(null);

  const fetchInvoices = async () => {
    if (invoices.length === 0) setLoadingInvoices(true);
    try {
      const invs = await api.getInvoices();
      setInvoices(invs || []);
    } catch (err) {
      console.warn('Failed to load invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);
  useApiCacheSync<any[]>('/fees/invoices', rows => { if (Array.isArray(rows)) setInvoices(rows); });

  useEffect(() => {
    if (activeSubTab !== 'dayend') return;
    api.getFeeDayEnd().then(setDayEnd).catch(() => setDayEnd(null));
  }, [activeSubTab, transactions.length]);

  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateInvoices();
      setGenMessage(`✓ Successfully generated ${res.generatedCount} monthly invoices for cycle ${res.cycleDate || 'active'}!`);
      fetchInvoices();
      setTimeout(() => setGenMessage(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Could not generate invoices.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'ledgers') {
      exportToCSV('Student_Fee_Ledgers', students.map(s => ({
        RegNo: s.regNo,
        Name: s.name,
        Batch: s.gradeBatch,
        AnchorDay: s.billingAnchorDay || 1,
        Scholarship: s.scholarshipType || 'none',
        AssignedFee: s.totalFee,
        PaidFee: s.paidFee,
        DueBalance: s.dueBalance,
        Status: s.isDefaulter ? 'Defaulter' : 'Clear'
      })));
    } else if (activeSubTab === 'invoices') {
      exportToCSV('Fee_Invoices_List', invoices.map(inv => ({
        PeriodKey: inv.period,
        Student: inv.student?.full_name,
        RegNo: inv.student?.admission_no,
        CoverageStart: inv.fee_period_start,
        CoverageEnd: inv.fee_period_end,
        GrossAmount: inv.amount,
        Discount: inv.discount,
        NetAmount: inv.net_amount,
        PaidAmount: inv.paidAmount,
        DueDate: inv.due_date,
        Status: inv.status
      })));
    } else if (activeSubTab === 'defaulters') {
      exportToCSV('Fee_Defaulters_List', defaultersList.map(s => ({
        RegNo: s.regNo,
        Name: s.name,
        ParentName: s.parentName,
        Phone: s.phone,
        Batch: s.gradeBatch,
        OverdueAmount: s.dueBalance,
        DueDate: s.dueDate
      })));
    } else {
      exportToCSV('Fee_Collection_Receipts', transactions.map(t => ({
        ReceiptNo: t.receiptNo,
        StudentName: t.studentName,
        RegNo: t.regNo,
        Amount: t.amount,
        Date: t.date,
        Method: t.method
      })));
    }
  };

  const totalAssigned = students.reduce((sum, s) => sum + (s.totalFee || 0), 0);
  const totalCollected = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOverdue = students.reduce((sum, s) => sum + (s.dueBalance || 0), 0);
  const defaultersList = students.filter(s => s.isDefaulter || (s.dueBalance || 0) > 0);
  const agingOf = (dueDate?: string) => {
    if (!dueDate) return 0;
    const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
    return Math.max(0, days);
  };
  const agingBuckets = {
    d30: defaultersList.filter(s => agingOf(s.dueDate) <= 30).length,
    d60: defaultersList.filter(s => agingOf(s.dueDate) > 30 && agingOf(s.dueDate) <= 60).length,
    d90: defaultersList.filter(s => agingOf(s.dueDate) > 60).length
  };

  const filteredStudents = students.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.regNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv => {
    const sName = inv.student?.full_name || '';
    const sReg = inv.student?.admission_no || '';
    return sName.toLowerCase().includes(search.toLowerCase()) || sReg.toLowerCase().includes(search.toLowerCase());
  });

  const openSlipForInvoice = (inv: any) => {
    setSelectedSlipData({
      invoiceId: inv.id,
      studentName: inv.student?.full_name || 'Student',
      admissionNo: inv.student?.admission_no || 'N/A',
      parentName: inv.student?.parentName || 'Parent',
      parentPhone: inv.student?.phone || 'N/A',
      batchName: inv.student?.class?.name || 'Standard Batch',
      feePeriodStart: inv.fee_period_start,
      feePeriodEnd: inv.fee_period_end,
      billingAnchorDay: inv.billing_anchor_day,
      installmentNumber: inv.installment_number,
      totalInstallments: inv.total_installments,
      grossAmount: inv.amount,
      discountAmount: inv.discount || 0,
      scholarshipType: inv.student?.feePlan?.scholarship_type,
      scholarshipReason: inv.student?.feePlan?.scholarship_reason,
      netAmount: inv.net_amount,
      paidAmount: inv.paidAmount || 0,
      balanceAmount: inv.balanceAmount || Math.max(0, inv.net_amount - (inv.paidAmount || 0)),
      dueDate: inv.due_date,
      status: inv.status
    });
  };

  const handleTriggerInstallmentCron = async () => {
    setIsGenerating(true);
    try {
      const res = await api.triggerInstallmentCron();
      setGenMessage(`✓ Successfully generated ${res.generatedCount} installment vouchers due on or before ${res.triggeredAt}!`);
      fetchInvoices();
      setTimeout(() => setGenMessage(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Could not sync installments.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Fee & Financial Management</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Anchor-cycle recurring billing, scholarship plans, course installments & receipts
          </p>
        </div>
        <div className="header-action-bar">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={handleTriggerInstallmentCron} disabled={isGenerating}>
            <Layers size={15} className={isGenerating ? 'spin' : ''} /> {isGenerating ? 'Syncing...' : 'Sync Installments'}
          </button>
          <button className="btn-secondary" onClick={handleGenerateInvoices} disabled={isGenerating}>
            <RefreshCw size={15} className={isGenerating ? 'spin' : ''} /> {isGenerating ? 'Generating...' : 'Generate Cycle Invoices'}
          </button>
          <button className="btn-primary" onClick={() => {
            setSelectedStudentForPay(null);
            setIsRecordFeeModalOpen(true);
          }}>
            <Plus size={16} /> Record Fee Payment
          </button>
        </div>
      </div>

      {genMessage && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
          {genMessage}
        </div>
      )}

      {/* Financial KPI Summary Cards */}
      <div className="card-grid-3">
        <div className="card" style={{ background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>TOTAL COLLECTIONS</span>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>PKR {formatCurrency(totalCollected)}</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{transactions.length} Total Receipts Recorded</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>TOTAL OVERDUE DUES</span>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: '#DC2626', margin: '4px 0' }}>PKR {formatCurrency(totalOverdue)}</h3>
          <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{defaultersList.length} Active Defaulters</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>NET ASSIGNED ACADEMIC FEES</span>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>PKR {formatCurrency(totalAssigned)}</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{students.length} Enrolled Student Plans</span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="form-input"
          placeholder="Search by student name or registration number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 380 }}
        />
      </div>

      {/* Sub Tab Switcher */}
      <div className="mobile-filter-scroll-bar" style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, maxWidth: '100%' }}>
        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'ledgers' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('ledgers')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileText size={15} /> Student Ledgers ({students.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'invoices' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('invoices')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Calendar size={15} /> Fee Vouchers & Invoices ({invoices.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'defaulters' ? 'btn-danger' : ''}`}
          onClick={() => setActiveSubTab('defaulters')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={15} /> Defaulters List ({defaultersList.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'history' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('history')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <CreditCard size={15} /> Collection Receipts ({transactions.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'dayend' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('dayend')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Clock size={15} /> Day-end close
        </button>
      </div>

      {/* Tab 1: Student Ledgers */}
      {activeSubTab === 'ledgers' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Info</th>
                <th>Batch & Section</th>
                <th>Billing Anchor</th>
                <th>Monthly Plan Fee</th>
                <th>Paid Amount</th>
                <th>Outstanding Balance</th>
                <th>Defaulter Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.name}</span>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{student.regNo}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{student.gradeBatch}</span></td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
                      {student.billingAnchorDay || 1}th of month
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>
                      PKR {formatCurrency(student.baseMonthlyFee || student.totalFee)}
                    </div>
                    {student.scholarshipType && student.scholarshipType !== 'none' && (
                      <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>
                        {student.scholarshipType === 'percentage' ? `${student.scholarshipValue}% Disc` : `PKR ${student.scholarshipValue} Disc`}
                      </span>
                    )}
                  </td>
                  <td><span style={{ color: '#16A34A', fontWeight: 700 }}>PKR {formatCurrency(student.paidFee)}</span></td>
                  <td>
                    <span style={{ color: student.dueBalance > 0 ? '#DC2626' : '#0F172A', fontWeight: 800 }}>
                      PKR {formatCurrency(student.dueBalance)}
                    </span>
                  </td>
                  <td>
                    {student.isDefaulter ? (
                      <span className="badge badge-red"><AlertTriangle size={12} /> Defaulter</span>
                    ) : (
                      <span className="badge badge-green"><CheckCircle2 size={12} /> Clear</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => setSelectedStudentForLedger(student)}
                      >
                        <FileText size={13} /> Ledger
                      </button>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setSelectedStudentForPay(student);
                          setIsRecordFeeModalOpen(true);
                        }}
                      >
                        <DollarSign size={13} /> Pay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Fee Vouchers & Invoices */}
      {activeSubTab === 'invoices' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher # & Student</th>
                <th>Coverage Period</th>
                <th>Plan / Installment</th>
                <th>Gross Fee</th>
                <th>Scholarship</th>
                <th>Net Invoiced</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>
                        {inv.student?.full_name || 'Student'}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        {inv.student?.admission_no || inv.id.slice(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1E3A8A' }}>
                      {formatCoveragePeriod(inv.fee_period_start, inv.fee_period_end)}
                    </div>
                  </td>
                  <td>
                    {inv.installment_number ? (
                      <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                        Inst {inv.installment_number} of {inv.total_installments}
                      </span>
                    ) : (
                      <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
                        Monthly (Anchor: {inv.billing_anchor_day || 1}th)
                      </span>
                    )}
                  </td>
                  <td>PKR {formatCurrency(inv.amount)}</td>
                  <td>
                    <span style={{ color: inv.discount > 0 ? '#16A34A' : '#64748B', fontWeight: 600 }}>
                      {inv.discount > 0 ? `-PKR ${formatCurrency(inv.discount)}` : 'PKR 0'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0F172A' }}>
                      PKR {formatCurrency(inv.net_amount)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      {inv.due_date}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        background: inv.status === 'paid' ? '#DCFCE7' : inv.status === 'overdue' ? '#FEE2E2' : '#EFF6FF',
                        color: inv.status === 'paid' ? '#166534' : inv.status === 'overdue' ? '#991B1B' : '#1E40AF',
                        border: `1px solid ${inv.status === 'paid' ? '#BBF7D0' : inv.status === 'overdue' ? '#FECACA' : '#BFDBFE'}`
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => openSlipForInvoice(inv)}
                      >
                        <Printer size={13} /> Voucher Slip
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => {
                            const st = students.find(s => s.id === inv.student_id);
                            if (st) setSelectedStudentForPay(st);
                            setSelectedInvoiceForPay(inv);
                            setIsRecordFeeModalOpen(true);
                          }}
                        >
                          <DollarSign size={13} /> Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Defaulters List */}
      {activeSubTab === 'defaulters' && (
        <div className="data-table-container">
          <div style={{ display: 'flex', gap: 10, padding: 12, flexWrap: 'wrap' }}>
            <span className="badge badge-amber">0–30 days: {agingBuckets.d30}</span>
            <span className="badge badge-red">31–60 days: {agingBuckets.d60}</span>
            <span className="badge badge-red">61+ days: {agingBuckets.d90}</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reg No & Student Name</th>
                <th>Parent Name & Phone</th>
                <th>Batch</th>
                <th>Overdue Amount</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {defaultersList.length > 0 ? (
                defaultersList.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{s.name}</span>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{s.regNo}</div>
                    </td>
                    <td>
                      <div>{s.parentName}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{s.phone}</div>
                    </td>
                    <td><span className="badge badge-gray">{s.gradeBatch}</span></td>
                    <td><span style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>PKR {formatCurrency(s.dueBalance)}</span></td>
                    <td><span className="badge badge-red">{s.dueDate}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setSelectedStudentForPay(s);
                          setSelectedInvoiceForPay(null);
                          setIsRecordFeeModalOpen(true);
                        }}
                      >
                        Collect Payment
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#16A34A' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <CheckCircle2 size={16} color="#16A34A" /> Outstanding! No active fee defaulters recorded.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Collection Receipts */}
      {activeSubTab === 'history' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Student</th>
                <th>Reg No</th>
                <th>Amount Paid</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontWeight: 800, color: '#0F172A' }}>{t.receiptNo}</span></td>
                  <td>{t.studentName}</td>
                  <td><span className="badge badge-gray">{t.regNo}</span></td>
                  <td><span style={{ fontWeight: 800, color: '#16A34A' }}>PKR {formatCurrency(t.amount)}</span></td>
                  <td>{t.date}</td>
                  <td><span className="badge badge-blue">{t.method}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedSlipData({
                          receiptNo: t.receiptNo,
                          studentName: t.studentName,
                          admissionNo: t.regNo,
                          grossAmount: t.amount,
                          discountAmount: 0,
                          netAmount: t.amount,
                          paidAmount: t.amount,
                          balanceAmount: 0,
                          dueDate: t.date,
                          status: 'paid',
                          paymentMethod: t.method
                        });
                      }}
                    >
                      <Printer size={13} /> Printable Receipt
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      style={{ marginLeft: 6 }}
                      onClick={async () => {
                        const reason = window.prompt('Void reason (required)');
                        if (!reason) return;
                        try {
                          await api.voidFeePayment(t.id, reason);
                          showToast('Receipt voided.', 'success');
                          fetchInvoices();
                        } catch (err: any) {
                          showToast(err.message || 'Could not void.', 'error');
                        }
                      }}
                    >
                      Void
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'dayend' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Today’s collections</h3>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 0 }}>Cash desk close. Payroll lives in Staff Payroll, not here.</p>
          {dayEnd ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A' }}>{formatCurrencyPKR(dayEnd.total || 0)}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{dayEnd.receiptCount || 0} live receipts · {dayEnd.pendingChequeCount || 0} pending cheques · {dayEnd.voidedCount || 0} voided</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(dayEnd.byMethod || {}).map(([method, amt]) => (
                  <span key={method} className="badge badge-gray">{method}: {formatCurrencyPKR(Number(amt))}</span>
                ))}
              </div>
              <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => window.print()}>
                <Printer size={14} /> Print day-end
              </button>
            </>
          ) : (
            <p>No day-end data yet.</p>
          )}
        </div>
      )}

      {/* Modals */}
      <RecordFeeModal
        isOpen={isRecordFeeModalOpen}
        onClose={() => {
          setIsRecordFeeModalOpen(false);
          setSelectedStudentForPay(null);
          setSelectedInvoiceForPay(null);
        }}
        onAddPayment={(pay) => {
          if (onAddPayment) onAddPayment(pay);
          fetchInvoices();
        }}
        students={students}
        preSelectedStudentId={selectedStudentForPay?.id}
        preSelectedInvoiceId={selectedInvoiceForPay?.id}
        preSelectedAmount={selectedInvoiceForPay ? (selectedInvoiceForPay.balanceAmount || selectedInvoiceForPay.net_amount) : undefined}
      />

      {selectedStudentForLedger && (
        <StudentLedgerModal
          isOpen={!!selectedStudentForLedger}
          student={selectedStudentForLedger}
          onClose={() => setSelectedStudentForLedger(null)}
          onOpenPayModal={(st) => {
            setSelectedStudentForPay(st);
            setIsRecordFeeModalOpen(true);
          }}
        />
      )}

      {selectedSlipData && (
        <FeeSlipModal
          isOpen={!!selectedSlipData}
          onClose={() => setSelectedSlipData(null)}
          data={selectedSlipData}
        />
      )}
    </div>
  );
};

export default FeeManagementView;
