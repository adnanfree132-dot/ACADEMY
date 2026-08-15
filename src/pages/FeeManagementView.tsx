import React, { useState } from 'react';
import { Student, FeeTransaction } from '../types';
import { CreditCard, AlertTriangle, Plus, FileText, Printer, CheckCircle2, ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { RecordFeeModal } from '../components/RecordFeeModal';

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
  const [activeSubTab, setActiveSubTab] = useState<'ledgers' | 'defaulters' | 'history'>('ledgers');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<FeeTransaction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');
  const [isRecordFeeModalOpen, setIsRecordFeeModalOpen] = useState(false);

  const handleGenerateInvoices = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateInvoices();
      setGenMessage(`✓ Successfully generated ${res.generatedCount} monthly invoices for ${res.period}!`);
      setTimeout(() => setGenMessage(''), 4000);
    } catch (err: any) {
      alert(`Error generating invoices: ${err.message}`);
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
        AssignedFee: s.totalFee,
        PaidFee: s.paidFee,
        DueBalance: s.dueBalance,
        DueDate: s.dueDate,
        Status: s.isDefaulter ? 'Defaulter' : 'Clear'
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

  const totalAssigned = students.reduce((sum, s) => sum + s.totalFee, 0);
  const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalOverdue = students.reduce((sum, s) => sum + s.dueBalance, 0);
  const defaultersList = students.filter(s => s.isDefaulter);

  const filteredStudents = students.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.regNo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Fee & Financial Management</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Monitor student ledgers, fee dues, collection receipts, and defaulters list</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={handleGenerateInvoices} disabled={isGenerating}>
            <RefreshCw size={15} className={isGenerating ? 'spin' : ''} /> {isGenerating ? 'Generating...' : 'Generate Monthly Invoices'}
          </button>
          <button className="btn-primary" onClick={() => setIsRecordFeeModalOpen(true)}>
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
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>${totalCollected.toLocaleString()}</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{transactions.length} Total Receipts Issued</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>TOTAL OVERDUE DUES</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#DC2626', margin: '4px 0' }}>${totalOverdue.toLocaleString()}</h3>
          <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{defaultersList.length} Active Defaulters</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>NET ASSIGNED ACADEMIC FEES</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>${totalAssigned.toLocaleString()}</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{students.length} Enrolled Student Ledgers</span>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div className="mobile-filter-scroll-bar" style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, maxWidth: '100%' }}>
        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'ledgers' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('ledgers')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileText size={16} /> Student Ledgers ({students.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'defaulters' ? 'btn-danger' : ''}`}
          onClick={() => setActiveSubTab('defaulters')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={16} /> Defaulters List ({defaultersList.length})
        </button>

        <button 
          className={`btn-secondary btn-sm ${activeSubTab === 'history' ? 'btn-primary' : ''}`}
          onClick={() => setActiveSubTab('history')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <CreditCard size={16} /> Collection Receipts ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Student Ledgers */}
      {activeSubTab === 'ledgers' && (
        <>
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Batch</th>
                  <th>Assigned Fee</th>
                  <th>Paid Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Due Date</th>
                  <th>Defaulter Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.name}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{student.regNo}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{student.gradeBatch}</span></td>
                    <td>${student.totalFee.toLocaleString()}</td>
                    <td><span style={{ color: '#16A34A', fontWeight: 700 }}>${student.paidFee.toLocaleString()}</span></td>
                    <td>
                      <span style={{ color: student.dueBalance > 0 ? '#DC2626' : '#0F172A', fontWeight: 800 }}>
                        ${student.dueBalance.toLocaleString()}
                      </span>
                    </td>
                    <td>{student.dueDate}</td>
                    <td>
                      {student.isDefaulter ? (
                        <span className="badge badge-red"><AlertTriangle size={12} /> Defaulter</span>
                      ) : (
                        <span className="badge badge-green"><CheckCircle2 size={12} /> Clear</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-secondary btn-sm" onClick={onOpenCreateModal}>Record Payment</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Ledgers Touch Cards */}
          <div className="mobile-card-roster mobile-only">
            {filteredStudents.map(student => (
              <div key={student.id} className="mobile-entity-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{student.name}</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{student.regNo}</span>
                  </div>
                  <span className="badge badge-gray">{student.gradeBatch}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Paid Fee</span>
                    <div style={{ fontWeight: 700, color: '#16A34A' }}>${student.paidFee.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Due Balance</span>
                    <div style={{ fontWeight: 800, color: student.dueBalance > 0 ? '#DC2626' : '#0F172A' }}>
                      ${student.dueBalance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  <div>
                    {student.isDefaulter ? (
                      <span className="badge badge-red"><AlertTriangle size={11} /> Defaulter</span>
                    ) : (
                      <span className="badge badge-green"><CheckCircle2 size={11} /> Clear</span>
                    )}
                  </div>
                  <button className="btn-primary btn-sm" onClick={onOpenCreateModal} style={{ height: 32 }}>
                    Record Fee
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab 2: Defaulters List */}
      {activeSubTab === 'defaulters' && (
        <>
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg No & Student Name</th>
                  <th>Parent Name & Phone</th>
                  <th>Batch</th>
                  <th>Overdue Amount</th>
                  <th>Due Date</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {defaultersList.length > 0 ? (
                  defaultersList.map(s => (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>{s.name}</span>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.regNo}</div>
                      </td>
                      <td>
                        <div>{s.parentName}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{s.phone}</div>
                      </td>
                      <td><span className="badge badge-gray">{s.gradeBatch}</span></td>
                      <td><span style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>${s.dueBalance.toLocaleString()}</span></td>
                      <td><span className="badge badge-red">{s.dueDate}</span></td>
                      <td>
                        <button className="btn-primary btn-sm" onClick={onOpenCreateModal}>Collect Payment</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#16A34A' }}>
                      🎉 Outstanding! No active fee defaulters recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Defaulters Touch Cards */}
          <div className="mobile-card-roster mobile-only">
            {defaultersList.length > 0 ? (
              defaultersList.map(s => (
                <div key={s.id} className="mobile-entity-card" style={{ borderLeft: '4px solid #DC2626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{s.name}</h3>
                      <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{s.regNo} • Overdue</span>
                    </div>
                    <span className="badge badge-gray">{s.gradeBatch}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#FEF2F2', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#7F1D1D', fontSize: 11 }}>Parent / Phone</div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{s.parentName} • {s.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#7F1D1D', fontSize: 11 }}>Overdue</div>
                      <div style={{ fontWeight: 800, color: '#DC2626', fontSize: 14 }}>${s.dueBalance.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                    <button className="btn-primary btn-sm" onClick={onOpenCreateModal} style={{ width: '100%', justifyContent: 'center', height: 34 }}>
                      Collect Payment
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#16A34A', background: '#FFFFFF', borderRadius: 12 }}>
                🎉 Outstanding! No active fee defaulters recorded.
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 3: Collection Receipts */}
      {activeSubTab === 'history' && (
        <>
          <div className="data-table-container desktop-only">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student</th>
                  <th>Reg No</th>
                  <th>Amount Paid</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontWeight: 800, color: '#0F172A' }}>{t.receiptNo}</span></td>
                    <td>{t.studentName}</td>
                    <td><span className="badge badge-gray">{t.regNo}</span></td>
                    <td><span style={{ fontWeight: 800, color: '#16A34A' }}>${t.amount.toLocaleString()}</span></td>
                    <td>{t.date}</td>
                    <td><span className="badge badge-blue">{t.method}</span></td>
                    <td>
                      <button className="btn-secondary btn-sm" onClick={() => setSelectedReceipt(t)}>
                        <Printer size={14} /> Printable Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Receipts Touch Cards */}
          <div className="mobile-card-roster mobile-only">
            {transactions.map(t => (
              <div key={t.id} className="mobile-entity-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>{t.receiptNo}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{t.studentName}</h3>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>${t.amount.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6 }}>
                  <span>{t.date}</span>
                  <span className="badge badge-blue">{t.method}</span>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                  <button className="btn-secondary btn-sm" onClick={() => setSelectedReceipt(t)} style={{ width: '100%', justifyContent: 'center', height: 32 }}>
                    <Printer size={14} /> View Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Official Printable Digital Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>AcademiaPro OS</h2>
                <p style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Fee Payment Receipt</p>
              </div>
              <div className="receipt-badge-status">
                <ShieldCheck size={16} color="#16A34A" /> PAID & VERIFIED
              </div>
            </div>

            <div className="receipt-meta-grid">
              <div>
                <span className="receipt-lbl">RECEIPT NO</span>
                <span className="receipt-val">{selectedReceipt.receiptNo}</span>
              </div>
              <div>
                <span className="receipt-lbl">DATE</span>
                <span className="receipt-val">{selectedReceipt.date}</span>
              </div>
              <div>
                <span className="receipt-lbl">STUDENT NAME</span>
                <span className="receipt-val">{selectedReceipt.studentName}</span>
              </div>
              <div>
                <span className="receipt-lbl">REGISTRATION NO</span>
                <span className="receipt-val">{selectedReceipt.regNo}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="receipt-items-table">
              <div className="receipt-table-header">
                <span>DESCRIPTION</span>
                <span style={{ textAlign: 'right' }}>AMOUNT</span>
              </div>
              <div className="receipt-table-row">
                <span>Academic Tuition & Facility Fee ({selectedReceipt.notes || 'August Session'})</span>
                <span style={{ fontWeight: 700 }}>${selectedReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="receipt-total-row">
              <span>TOTAL AMOUNT PAID ({selectedReceipt.method})</span>
              <span className="receipt-total-val">${selectedReceipt.amount.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn-primary w-full" onClick={() => window.print()} style={{ justifyContent: 'center' }}>
                <Printer size={16} /> Print / Save PDF Receipt
              </button>
              <button className="btn-secondary w-full" onClick={() => setSelectedReceipt(null)} style={{ justifyContent: 'center' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <RecordFeeModal
        isOpen={isRecordFeeModalOpen}
        onClose={() => setIsRecordFeeModalOpen(false)}
        onAddPayment={onAddPayment || (() => {})}
        students={students}
      />
    </div>
  );
};
