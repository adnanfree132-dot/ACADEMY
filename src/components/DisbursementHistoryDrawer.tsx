import React, { useEffect, useState } from 'react';
import { 
  X, 
  History, 
  Trash2, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  FileText,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { StaffSalaryDisbursement } from '../types';
import { api } from '../api/apiClient';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

interface DisbursementHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffId: string;
  staffMemberId: string;
  monthPeriod: string;
  netPayable: number;
  onDisbursementDeleted?: (deletedDisbursementId: string, voidedAmount: number) => void;
}

export const DisbursementHistoryDrawer: React.FC<DisbursementHistoryDrawerProps> = ({
  isOpen,
  onClose,
  staffName,
  staffId,
  staffMemberId,
  monthPeriod,
  netPayable,
  onDisbursementDeleted
}) => {
  const [disbursements, setDisbursements] = useState<StaffSalaryDisbursement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && staffMemberId && monthPeriod) {
      loadDisbursements();
    }
  }, [isOpen, staffMemberId, monthPeriod]);

  const loadDisbursements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStaffDisbursements(staffMemberId, monthPeriod);
      setDisbursements(data || []);
    } catch (err) {
      console.warn('Failed to load disbursements history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDisbursement = async (item: StaffSalaryDisbursement) => {
    if (!window.confirm(`Are you sure you want to void this disbursement of ${formatCurrencyPKR(item.amount)}? This will also remove the corresponding salary expense in the Expenses module.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await api.deleteSalaryDisbursement(item.id);
      setDisbursements(prev => prev.filter(d => d.id !== item.id));
      if (onDisbursementDeleted) {
        onDisbursementDeleted(item.id, item.amount);
      }
    } catch (err) {
      console.warn('Failed to delete disbursement:', err);
      alert('Failed to void disbursement.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const totalPaid = disbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalPending = Math.max(0, netPayable - totalPaid);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
      style={{ 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div 
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white m-0">Payment Installments</h2>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                {staffName} ({staffId}) • {monthPeriod}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            className="hover:text-white hover:bg-white/20"
          >
            <X size={16} />
          </button>
        </div>

        {/* Balance Metric Strip */}
        <div 
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px 22px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}
        >
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Net Salary</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{formatCurrencyPKR(netPayable)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-600">Total Paid</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">{formatCurrencyPKR(totalPaid)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-rose-600">Pending</div>
            <div className="text-xs font-bold text-rose-700 mt-0.5">{formatCurrencyPKR(totalPending)}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading payment history...
            </div>
          ) : disbursements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-slate-200 rounded-xl">
              <AlertCircle size={28} className="text-slate-300 mb-2" />
              <div className="text-sm font-semibold text-slate-600">No Payments Recorded Yet</div>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Zero disbursements have been paid for this month. Use the &quot;Pay / Disburse&quot; action to record installments.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Installment History ({disbursements.length} Payments)
              </div>
              {disbursements.map((item, idx) => {
                const dateObj = new Date(item.disbursed_at);
                const dateFormatted = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const timeFormatted = dateObj.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      padding: '12px 14px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                    }}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600">
                          {formatCurrencyPKR(item.amount)}
                        </span>
                        <span 
                          style={{
                            background: item.payment_method === 'bank_transfer' ? '#EFF6FF' : '#F1F5F9',
                            color: item.payment_method === 'bank_transfer' ? '#1D4ED8' : '#475569',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.payment_method.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{dateFormatted} at {timeFormatted}</span>
                        {item.reference_number && (
                          <span>• Ref: {item.reference_number}</span>
                        )}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-slate-600 mt-1 italic">
                          &quot;{item.notes}&quot;
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDisbursement(item)}
                      disabled={deletingId === item.id}
                      title="Void Disbursement"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #FEE2E2',
                        background: '#FEF2F2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="hover:bg-rose-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            borderTop: '1px solid #E2E8F0',
            padding: '14px 20px',
            background: '#F8FAFC'
          }}
          className="flex items-center justify-end"
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: '9999px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0F172A',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              cursor: 'pointer'
            }}
            className="hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
