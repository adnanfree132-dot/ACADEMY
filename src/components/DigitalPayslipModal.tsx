import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  X, 
  Printer, 
  Download, 
  MessageSquare, 
  Building, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { MonthlyPayrollItem } from '../types';
import { api } from '../api/apiClient';
import { 
  formatCurrencyPKR, 
  numberToCurrencyWords, 
  buildWhatsAppSalaryAdvice
} from '../utils/payrollUiUtils';

interface DigitalPayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslipId?: string | null;
  payslip?: MonthlyPayrollItem | null;
}

export const DigitalPayslipModal: React.FC<DigitalPayslipModalProps> = ({
  isOpen,
  onClose,
  payslipId,
  payslip: initialPayslip
}) => {
  if (!isOpen) return null;

  const [payslipData, setPayslipData] = useState<any>(initialPayslip || null);
  const [loading, setLoading] = useState<boolean>(!initialPayslip && !!payslipId);

  useEffect(() => {
    if (initialPayslip) {
      setPayslipData(initialPayslip);
    } else if (payslipId) {
      setLoading(true);
      api.getPayslipDetails(payslipId)
        .then(data => {
          setPayslipData(data);
        })
        .catch(err => {
          console.warn('Failed to load rich payslip details from backend:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [payslipId, initialPayslip]);

  const p = payslipData || initialPayslip || {};

  // Parse itemized reason-backed line items (Spec 012 - User Story 3)
  const itemizedDeductions: any[] = useMemo(() => {
    if (Array.isArray(p.custom_deductions)) return p.custom_deductions;
    if (Array.isArray(p.customDeductions)) return p.customDeductions;
    if (p.custom_deductions_json) {
      try {
        const parsed = JSON.parse(p.custom_deductions_json);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }, [p]);

  const itemizedEarnings: any[] = useMemo(() => {
    if (Array.isArray(p.custom_earnings)) return p.custom_earnings;
    if (Array.isArray(p.customEarnings)) return p.customEarnings;
    if (p.custom_earnings_json) {
      try {
        const parsed = JSON.parse(p.custom_earnings_json);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }, [p]);

  const staffName = p.staffMember?.full_name || p.staffMember?.fullName || p.staff_name || p.fullName || 'Staff Member';
  const staffCode = p.staffMember?.staff_id || p.staffMember?.staffId || p.staff_id || p.staffCode || 'STAFF';
  const designation = p.staffMember?.designation || p.designation || 'Faculty';
  const department = p.staffMember?.staffType?.name || p.staffMember?.role || p.department || 'Academic Faculty';
  const staffPhone = p.staffMember?.phone || p.phone || '';
  const slipNumber = p.payslip_number || p.payslipNumber || (p.id ? `SLIP-${p.id.slice(0, 8)}` : 'SLIP-2026-08');
  const period = p.month_period || p.monthPeriod || (p.year && p.month ? `${p.year}-${String(p.month).padStart(2, '0')}` : 'August 2026');
  const status = (p.status || 'pending').toLowerCase();
  const isPaid = status === 'paid';

  const basePay = p.base_pay ?? p.baseSalary ?? p.base_salary ?? 0;
  const hra = p.house_rent_allowance ?? p.houseRentAllowance ?? 0;
  const med = p.medical_allowance ?? p.medicalAllowance ?? 0;
  const conv = p.conveyance_allowance ?? p.conveyanceAllowance ?? 0;
  const spec = p.special_allowance ?? p.specialAllowance ?? 0;
  const gross = p.gross_salary ?? p.grossSalary ?? (basePay + hra + med + conv + spec + (p.allowances || 0));

  const attDed = p.attendance_deduction_amount ?? p.attendance_deduction ?? p.attendanceDeduction ?? 0;
  const tax = p.tax_deduction ?? p.taxDeduction ?? 0;
  const pf = p.provident_fund ?? p.providentFund ?? 0;
  const other = p.other_deductions ?? p.otherDeductions ?? 0;
  const totalDed = p.deductions ?? p.total_deductions ?? p.totalDeductions ?? (attDed + tax + pf + other);

  const netPayable = p.net_payable ?? p.netPayable ?? p.amount ?? Math.max(0, gross - totalDed);
  const paymentMethod = (p.payment_method || p.paymentMethod || 'Bank Transfer').replace(/_/g, ' ');
  const bankName = p.bank_name || p.bankName || p.staffMember?.bank_name || '';
  const accountNo = p.account_number || p.accountNumber || p.staffMember?.account_number || '';
  const accountTitle = p.account_title || p.accountTitle || p.staffMember?.account_title || staffName;
  const transactionRef = p.transaction_ref || p.transaction_reference || p.reference_no || '';

  // Attendance metrics
  const daysInMonth = p.working_days || p.daysInMonth || p.days_in_month || 31;
  const daysPresent = p.present_days || p.daysPresent || p.days_present || 0;
  const daysLate = p.late_days || p.daysLate || p.days_late || 0;
  const daysHalfDay = p.half_days || p.daysHalfDay || p.days_half_day || 0;
  const daysExcused = p.excused_leaves || p.daysExcused || p.days_excused || 0;
  const daysAbsent = p.absent_days || p.daysAbsent || p.days_absent || 0;
  const unexcusedUnits = p.unexcused_absences || (daysAbsent + 0.5 * daysHalfDay);

  const institution = p.institution || {
    name: 'Academia Pro OS Model Campus',
    address: 'Main Academic Boulevard, Campus Zone A',
    phone: '+92 42 3578 9900',
    email: 'accounts@academiapro.edu',
    ntn: '7849201-3'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = p.whatsAppMessageAdvice || buildWhatsAppSalaryAdvice(p, institution.name);
    const cleanPhone = staffPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #institutional-payslip-canvas, #institutional-payslip-canvas * {
            visibility: visible;
          }
          #institutional-payslip-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .floating-island-overlay {
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="floating-island-container"
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card (#0F172A) */}
        <div
          className="no-print"
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Institutional Salary Payslip
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                Official Salary Advice & Voucher &bull; {period} &bull; {staffName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Quick Action Bar */}
        <div
          className="no-print"
          style={{
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                background: isPaid ? '#DCFCE7' : '#FEF3C7',
                color: isPaid ? '#166534' : '#92400E',
                border: `1px solid ${isPaid ? '#BBF7D0' : '#FDE68A'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {isPaid ? <CheckCircle2 size={13} color="#166534" /> : <Clock size={13} color="#92400E" />}
              {isPaid ? 'PAID & DISBURSED' : 'CALCULATED / PENDING'}
            </span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Voucher: <strong>{slipNumber}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              style={{
                borderRadius: 8,
                height: 32,
                padding: '0 12px',
                border: '1px solid #BBF7D0',
                background: '#F0FDF4',
                color: '#16A34A',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={13} /> WhatsApp Advice
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                borderRadius: 8,
                height: 32,
                padding: '0 12px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* Island 3: Scrollable Institutional Payslip Canvas (#FFFFFF) */}
        <div
          id="institutional-payslip-canvas"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '24px 28px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '68vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            color: '#0F172A'
          }}
        >
          {/* Institutional Branding Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0F172A',
              paddingBottom: 14
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {institution.name}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                {institution.address} &bull; Ph: {institution.phone}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Email: {institution.email} &bull; NTN / Tax Reg: {institution.ntn}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  display: 'inline-block'
                }}
              >
                SALARY ADVICE VOUCHER
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginTop: 5 }}>
                Voucher #: {slipNumber}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                Pay Period: <strong>{period}</strong>
              </div>
            </div>
          </div>

          {/* Employee & Bank Info Matrix */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              fontSize: 11.5
            }}
          >
            <div>
              <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Employee Name
              </span>
              <strong style={{ fontSize: 12.5, color: '#0F172A' }}>{staffName}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Staff ID & Role
              </span>
              <strong>{staffCode}</strong> &bull; {department}
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Designation
              </span>
              <strong>{designation}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Payment Mode
              </span>
              <strong>{paymentMethod}</strong>
            </div>

            {bankName && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Bank & Account Title
                </span>
                <strong>{bankName}</strong> ({accountTitle})
              </div>
            )}

            {accountNo && (
              <div style={{ gridColumn: bankName ? 'span 2' : 'span 4' }}>
                <span style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Account / IBAN Number
                </span>
                <strong style={{ fontFamily: 'monospace' }}>{accountNo}</strong>
              </div>
            )}
          </div>

          {/* Monthly Attendance Summary Pill Bar */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              border: '1px dashed #CBD5E1',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <div>Days in Month: <strong>{daysInMonth}</strong></div>
            <div style={{ color: '#16A34A' }}>Present: <strong>{daysPresent}</strong></div>
            <div style={{ color: '#D97706' }}>Late: <strong>{daysLate}</strong></div>
            <div style={{ color: '#2563EB' }}>Half-Day: <strong>{daysHalfDay}</strong></div>
            <div style={{ color: '#64748B' }}>Excused: <strong>{daysExcused}</strong></div>
            <div style={{ color: daysAbsent > 0 ? '#DC2626' : '#64748B' }}>
              Unexcused Absences: <strong>{unexcusedUnits}</strong>
            </div>
          </div>

          {/* Two-Column Itemized Earnings vs Deductions Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Earnings Column */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  background: '#F1F5F9',
                  padding: '8px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                Earnings & Allowances
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Salary</span>
                  <strong style={{ color: '#0F172A' }}>{formatCurrencyPKR(basePay)}</strong>
                </div>

                {hra > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>House Rent Allowance (HRA)</span>
                    <strong>{formatCurrencyPKR(hra)}</strong>
                  </div>
                )}

                {med > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Medical Allowance</span>
                    <strong>{formatCurrencyPKR(med)}</strong>
                  </div>
                )}

                {conv > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Conveyance Allowance</span>
                    <strong>{formatCurrencyPKR(conv)}</strong>
                  </div>
                )}

                {/* Reason-Backed Itemized Earnings / Allowances */}
                {itemizedEarnings.length > 0 ? (
                  itemizedEarnings.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {item.label || item.name || 'Special Allowance'}
                          {item.unit_amount && item.quantity && (
                            <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#F0FDF4', color: '#16A34A', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              {formatCurrencyPKR(item.unit_amount)} × {item.quantity}
                            </span>
                          )}
                        </span>
                        <strong style={{ color: '#16A34A' }}>
                          +{formatCurrencyPKR(item.total_amount || item.amount)}
                        </strong>
                      </div>
                      {item.reason && (
                        <span style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid #CBD5E1' }}>
                          Reason: {item.reason}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  spec > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Special Allowance</span>
                      <strong style={{ color: '#16A34A' }}>+{formatCurrencyPKR(spec)}</strong>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  padding: '8px 12px',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#16A34A'
                }}
              >
                <span>Gross Earnings</span>
                <span>{formatCurrencyPKR(gross)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <div
                style={{
                  background: '#F1F5F9',
                  padding: '8px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                Deductions & Adjustments
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {attDed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Attendance Deduction ({unexcusedUnits}d)</span>
                    <strong style={{ color: '#DC2626' }}>
                      -{formatCurrencyPKR(attDed)}
                    </strong>
                  </div>
                )}

                {tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Income Tax Withholding</span>
                    <strong style={{ color: '#DC2626' }}>
                      -{formatCurrencyPKR(tax)}
                    </strong>
                  </div>
                )}

                {pf > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Provident Fund (PF / EOBI)</span>
                    <strong style={{ color: '#DC2626' }}>
                      -{formatCurrencyPKR(pf)}
                    </strong>
                  </div>
                )}

                {/* Reason-Backed Itemized Deductions (Rate × Multiplier) */}
                {itemizedDeductions.length > 0 ? (
                  itemizedDeductions.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {item.label || item.name || 'Deduction'}
                          {item.unit_amount && item.quantity && (
                            <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#FEF2F2', color: '#DC2626', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              {formatCurrencyPKR(item.unit_amount)} × {item.quantity}
                            </span>
                          )}
                        </span>
                        <strong style={{ color: '#DC2626' }}>
                          -{formatCurrencyPKR(item.total_amount || item.amount)}
                        </strong>
                      </div>
                      {item.reason && (
                        <span style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', paddingLeft: 6, borderLeft: '2px solid #CBD5E1' }}>
                          Reason: {item.reason}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  other > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Other Deductions</span>
                      <strong style={{ color: '#DC2626' }}>-{formatCurrencyPKR(other)}</strong>
                    </div>
                  )
                )}

                {attDed === 0 && tax === 0 && pf === 0 && itemizedDeductions.length === 0 && other === 0 && (
                  <div style={{ color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>
                    No deductions applied this month
                  </div>
                )}
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  padding: '8px 12px',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#DC2626'
                }}
              >
                <span>Total Deductions</span>
                <span>-{formatCurrencyPKR(totalDed)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Payable Box with Amount in Words */}
          <div
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net Monthly Payable
              </div>
              <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, fontStyle: 'italic' }}>
                {numberToCurrencyWords(netPayable)}
              </div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em' }}>
              {formatCurrencyPKR(netPayable)}
            </div>
          </div>

          {/* Official Signature Blocks */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginTop: 16,
              paddingTop: 24,
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
              fontSize: 11.5,
              color: '#64748B'
            }}
          >
            <div>
              <div style={{ height: 28 }}></div>
              <div style={{ borderTop: '1px solid #94A3B8', paddingTop: 4, fontWeight: 700, color: '#0F172A' }}>
                Prepared By (Accounts)
              </div>
            </div>

            <div>
              <div style={{ height: 28 }}></div>
              <div style={{ borderTop: '1px solid #94A3B8', paddingTop: 4, fontWeight: 700, color: '#0F172A' }}>
                Verified By (HR & Audit)
              </div>
            </div>

            <div>
              <div style={{ height: 28 }}></div>
              <div style={{ borderTop: '1px solid #94A3B8', paddingTop: 4, fontWeight: 700, color: '#0F172A' }}>
                Employee Acknowledgment
              </div>
            </div>
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 20px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 20px',
              border: 'none',
              background: '#16A34A',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <MessageSquare size={14} /> Send WhatsApp
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              borderRadius: 9999,
              height: 40,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Printer size={14} /> Print Official Voucher
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPayslipModal;
