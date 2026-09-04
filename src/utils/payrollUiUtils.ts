/**
 * Academy Pro OS — Frontend Payroll & Compensation UI Utilities
 * Real financial formatting, currency-to-words translator, and WhatsApp message advice builder.
 */

export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

let _currentCurrency = '';

export function getGlobalCurrencySymbol(): string {
  if (_currentCurrency) return _currentCurrency;
  try {
    const cached = localStorage.getItem('currencySymbol');
    if (cached && cached.trim()) {
      _currentCurrency = cached.trim();
      return _currentCurrency;
    }
  } catch (e) {}
  return 'Rs.';
}

export function setGlobalCurrencySymbol(symbol: string) {
  if (symbol && symbol.trim()) {
    _currentCurrency = symbol.trim();
    try {
      localStorage.setItem('currencySymbol', _currentCurrency);
    } catch (e) {}
  }
}

export function formatCurrencyPKR(amount: number | null | undefined): string {
  const sym = getGlobalCurrencySymbol();
  if (amount === null || amount === undefined || isNaN(amount)) return `${sym} 0`;
  return `${sym} ` + Math.round(amount).toLocaleString('en-US');
}

export function formatNumberOnly(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

/**
 * Converts numeric amount to English words (Rupees & Paisas) in Pakistani numbering format (Crore / Lakh / Thousand).
 */
export function numberToCurrencyWords(amount: number | null | undefined): string {
  if (!amount || amount === 0 || isNaN(amount)) return 'Zero Rupees Only';
  const rounded = roundCurrency(Math.abs(amount));
  const rupees = Math.floor(rounded);
  const paisas = Math.round((rounded - rupees) * 100);

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(num: number): string {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '') + ' ';
    } else if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  }

  let result = '';
  let tempRupees = rupees;

  if (tempRupees >= 10000000) {
    const crore = Math.floor(tempRupees / 10000000);
    result += convertChunk(crore) + ' Crore ';
    tempRupees %= 10000000;
  }
  if (tempRupees >= 100000) {
    const lakh = Math.floor(tempRupees / 100000);
    result += convertChunk(lakh) + ' Lakh ';
    tempRupees %= 100000;
  }
  if (tempRupees >= 1000) {
    const thousand = Math.floor(tempRupees / 1000);
    result += convertChunk(thousand) + ' Thousand ';
    tempRupees %= 1000;
  }
  if (tempRupees > 0) {
    result += convertChunk(tempRupees) + ' ';
  }

  result = result.trim() + ' Rupees';
  if (paisas > 0) {
    result += ' and ' + convertChunk(paisas) + ' Paisas';
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Builds standard WhatsApp salary slip advice template.
 */
export function buildWhatsAppSalaryAdvice(payslip: any, institutionName = 'Academia Pro OS Model Campus'): string {
  const name = payslip.staffMember?.full_name || payslip.fullName || payslip.staff_name || 'Staff Member';
  const code = payslip.staffMember?.staff_id || payslip.staffCode || payslip.staff_id || 'STAFF';
  const designation = payslip.staffMember?.designation || payslip.designation || 'Faculty';
  const period = payslip.month_period || (payslip.year && payslip.month ? `${payslip.year}-${String(payslip.month).padStart(2, '0')}` : 'Current Month');
  const slipNo = payslip.payslip_number || 'SLIP-CURRENT';

  const base = payslip.base_pay ?? payslip.baseSalary ?? payslip.base_salary ?? 0;
  const hra = payslip.house_rent_allowance ?? payslip.houseRentAllowance ?? 0;
  const med = payslip.medical_allowance ?? payslip.medicalAllowance ?? 0;
  const conv = payslip.conveyance_allowance ?? payslip.conveyanceAllowance ?? 0;
  const spec = payslip.special_allowance ?? payslip.specialAllowance ?? 0;
  const gross = payslip.gross_salary ?? payslip.grossSalary ?? (base + hra + med + conv + spec + (payslip.allowances || 0));

  const attDed = payslip.attendance_deduction_amount ?? payslip.attendance_deduction ?? payslip.attendanceDeduction ?? 0;
  const tax = payslip.tax_deduction ?? payslip.taxDeduction ?? 0;
  const pf = payslip.provident_fund ?? payslip.providentFund ?? 0;
  const other = payslip.other_deductions ?? payslip.otherDeductions ?? 0;
  const totalDed = payslip.deductions ?? payslip.total_deductions ?? payslip.totalDeductions ?? (attDed + tax + pf + other);

  const net = payslip.net_payable ?? payslip.netPayable ?? payslip.amount ?? Math.max(0, gross - totalDed);
  const method = (payslip.payment_method || payslip.paymentMethod || 'Bank Transfer').replace(/_/g, ' ');
  const bank = payslip.bank_name || payslip.bankName || '';
  const maskedAcc = payslip.account_number || payslip.accountNumber ? '...' + String(payslip.account_number || payslip.accountNumber).slice(-4) : '';
  const ref = payslip.transaction_ref || payslip.transaction_reference ? '\n*Ref:* ' + (payslip.transaction_ref || payslip.transaction_reference) : '';
  const statusStr = (payslip.status || 'PAID').toUpperCase();

  const lines = [
    `*${institutionName.toUpperCase()}*`,
    `*DIGITAL SALARY ADVICE — ${period}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Voucher No:* ${slipNo}`,
    `*Employee:* ${name} (${code})`,
    `*Designation:* ${designation}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*EARNINGS & ALLOWANCES:*`,
    `  • Base Salary: ${formatCurrencyPKR(base)}`,
    hra > 0 ? `  • House Rent Allowance: ${formatCurrencyPKR(hra)}` : null,
    med > 0 ? `  • Medical Allowance: ${formatCurrencyPKR(med)}` : null,
    conv > 0 ? `  • Conveyance Allowance: ${formatCurrencyPKR(conv)}` : null,
    spec > 0 ? `  • Special Allowance: ${formatCurrencyPKR(spec)}` : null,
    `  *Gross Earnings: ${formatCurrencyPKR(gross)}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*DEDUCTIONS & ADJUSTMENTS:*`,
    attDed > 0 ? `  • Attendance Deduction (${payslip.unexcused_absences || payslip.days_absent || 0}d): ${formatCurrencyPKR(attDed)}` : null,
    tax > 0 ? `  • Income Tax: ${formatCurrencyPKR(tax)}` : null,
    pf > 0 ? `  • Provident Fund (PF): ${formatCurrencyPKR(pf)}` : null,
    other > 0 ? `  • Other Deductions: ${formatCurrencyPKR(other)}` : null,
    `  *Total Deductions: ${formatCurrencyPKR(totalDed)}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*NET SALARY PAYABLE: ${formatCurrencyPKR(net)}*`,
    `*(${numberToCurrencyWords(net)})*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Payment Mode:* ${method}${bank ? ` (${bank}${maskedAcc ? ` - ${maskedAcc}` : ''})` : ''}${ref}`,
    `*Status:* ${statusStr} ✓`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Official digital payroll voucher generated by AcademiaPro OS._`
  ];

  return lines.filter(Boolean).join('\n');
}
