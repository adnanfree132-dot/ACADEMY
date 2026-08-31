/**
 * ============================================================================
 * Academy Pro OS — Enterprise Payroll Calculator & Financial Engine
 * ============================================================================
 * High-precision payroll calculation engine supporting pro-rata unexcused
 * attendance deductions, calendar days determination, itemized earnings/deductions,
 * financial rounding, payslip numbering, and WhatsApp advice formatting.
 */

export interface StaffMemberInfo {
  id: string;
  staff_id?: string | null;
  staffId?: string | null;
  full_name?: string | null;
  fullName?: string | null;
  designation?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  bank_name?: string | null;
  bankName?: string | null;
  account_number?: string | null;
  accountNumber?: string | null;
  account_title?: string | null;
  accountTitle?: string | null;
  payment_method?: string | null;
  paymentMethod?: string | null;
}

export interface SalaryStructureInfo {
  base_salary?: number | null;
  baseSalary?: number | null;
  house_rent_allowance?: number | null;
  houseRentAllowance?: number | null;
  hra?: number | null;
  medical_allowance?: number | null;
  medicalAllowance?: number | null;
  medical?: number | null;
  conveyance_allowance?: number | null;
  conveyanceAllowance?: number | null;
  conveyance?: number | null;
  special_allowance?: number | null;
  specialAllowance?: number | null;
  special?: number | null;
  tax_deduction?: number | null;
  taxDeduction?: number | null;
  tax?: number | null;
  provident_fund?: number | null;
  providentFund?: number | null;
  pf?: number | null;
  other_deductions?: number | null;
  otherDeductions?: number | null;
  bank_name?: string | null;
  bankName?: string | null;
  account_number?: string | null;
  accountNumber?: string | null;
  account_title?: string | null;
  accountTitle?: string | null;
  payment_method?: string | null;
  paymentMethod?: string | null;
}

export interface AttendanceStats {
  calendarDays?: number;
  presentDays?: number;
  lateDays?: number;
  halfDays?: number;
  absentDays?: number;
  excusedLeaves?: number;
  onDutyDays?: number;
  unexcusedAbsences?: number;
}

export interface PayrollDeductionRules {
  policyName?: string;
  workingDaysMode?: 'calendar' | 'fixed_26' | 'fixed_30';
  customWorkingDays?: number;
  lateDeductionMode?: 'ratio_3_to_1' | 'ratio_3_to_half' | 'fixed_amount' | 'none';
  lateGraceCount?: number;
  latePenaltyAmount?: number;
  halfDayDeductionRatio?: number;
  unexcusedAbsenceRatio?: number;
  paidLeaveAllowance?: number;
  attendanceBonus?: {
    enabled?: boolean;
    amount?: number;
    condition?: string;
  };
  specialAllowances?: Array<{
    label: string;
    type: 'percentage' | 'fixed';
    value: number;
    applies_to: string;
  }>;
  staffAdjustments?: Array<{
    staffName: string;
    type: 'deduction_percentage' | 'deduction_fixed' | 'bonus_percentage' | 'bonus_fixed';
    value: number;
    reason?: string;
  }>;
  rawPolicyText?: string;
}

export interface CalculatedPayrollItem {
  staffMemberId: string;
  staffCode: string;
  fullName: string;
  designation: string;
  year: number;
  month: number;
  period: string;
  calendarDays: number;
  workingDays: number;
  dailyRate: number;
  
  // Attendance Breakdown
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
  excusedLeaves: number;
  onDutyDays: number;
  unexcusedUnits: number;
  absenceDeduction: number;
  halfDayDeduction: number;
  lateDeduction: number;
  attendanceDeduction: number;

  // Earnings
  baseSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  specialAllowance: number;
  grossSalary: number;

  // Deductions
  taxDeduction: number;
  providentFund: number;
  otherDeductions: number;
  statutoryDeductions: number;
  totalDeductions: number;

  // Net Pay
  netPayable: number;
  netPayableWords: string;

  // Banking
  paymentMethod: string;
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
}

/**
 * Returns total days in the given month (1-12) and year, accounting for leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  if (!year || isNaN(year) || !month || isNaN(month)) return 30;
  return new Date(year, month, 0).getDate();
}

/**
 * Standard financial rounding to 2 decimal places.
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Computes pro-rata unexcused absence deduction with financial rounding.
 */
export function calculateAbsenceDeduction(
  baseSalary: number,
  workingDays: number,
  unexcusedAbsenceUnits: number
): number {
  if (!baseSalary || baseSalary <= 0 || !workingDays || workingDays <= 0 || !unexcusedAbsenceUnits || unexcusedAbsenceUnits <= 0) {
    return 0;
  }
  const dailyRate = baseSalary / workingDays;
  const rawDeduction = dailyRate * unexcusedAbsenceUnits;
  return roundCurrency(rawDeduction);
}

/**
 * Converts a numeric amount to English words (Rupees & Paisas).
 */
export function numberToWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  const rounded = roundCurrency(amount);
  const rupees = Math.floor(rounded);
  const paisas = Math.round((rounded - rupees) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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
 * Calculates complete itemized payroll for a single staff member using institutional rules.
 */
export function calculateStaffPayrollItem(
  staffMember: StaffMemberInfo,
  salaryStructure: SalaryStructureInfo,
  attendanceStats: AttendanceStats = {},
  year: number,
  month: number,
  rules?: PayrollDeductionRules
): CalculatedPayrollItem {
  const period = year + '-' + String(month).padStart(2, '0');
  const calendarDays = attendanceStats.calendarDays || getDaysInMonth(year, month);

  // Determine working days basis
  let workingDays = calendarDays;
  if (rules?.workingDaysMode === 'fixed_26') workingDays = 26;
  else if (rules?.workingDaysMode === 'fixed_30') workingDays = 30;
  else if (rules?.customWorkingDays && rules.customWorkingDays > 0) workingDays = rules.customWorkingDays;

  // Fallback standard base salary if 0/null
  const rawBase = salaryStructure.base_salary ?? salaryStructure.baseSalary ?? 0;
  const baseSalary = roundCurrency(rawBase > 0 ? rawBase : 65000);

  const houseRentAllowance = roundCurrency(
    salaryStructure.house_rent_allowance ?? salaryStructure.houseRentAllowance ?? salaryStructure.hra ?? Math.round(baseSalary * 0.15)
  );
  const medicalAllowance = roundCurrency(
    salaryStructure.medical_allowance ?? salaryStructure.medicalAllowance ?? salaryStructure.medical ?? Math.round(baseSalary * 0.08)
  );
  const conveyanceAllowance = roundCurrency(
    salaryStructure.conveyance_allowance ?? salaryStructure.conveyanceAllowance ?? salaryStructure.conveyance ?? Math.round(baseSalary * 0.07)
  );
  const specialAllowance = roundCurrency(
    Math.max(0, salaryStructure.special_allowance ?? salaryStructure.specialAllowance ?? salaryStructure.special ?? 0)
  );

  const taxDeduction = roundCurrency(
    Math.max(0, salaryStructure.tax_deduction ?? salaryStructure.taxDeduction ?? salaryStructure.tax ?? Math.round(baseSalary * 0.05))
  );
  const providentFund = roundCurrency(
    Math.max(0, salaryStructure.provident_fund ?? salaryStructure.providentFund ?? salaryStructure.pf ?? Math.round(baseSalary * 0.03))
  );
  const otherDeductions = roundCurrency(
    Math.max(0, salaryStructure.other_deductions ?? salaryStructure.otherDeductions ?? 0)
  );

  const presentDays = attendanceStats.presentDays || 0;
  const lateDays = attendanceStats.lateDays || 0;
  const halfDays = attendanceStats.halfDays || 0;
  const absentDays = attendanceStats.absentDays || 0;
  const excusedLeaves = attendanceStats.excusedLeaves || 0;
  const onDutyDays = attendanceStats.onDutyDays || 0;

  const dailyRate = workingDays > 0 ? (baseSalary / workingDays) : 0;

  // 1. Pro-rata absence deduction
  const absenceRatio = rules?.unexcusedAbsenceRatio ?? 1.0;
  const absenceDeduction = roundCurrency(absentDays * absenceRatio * dailyRate);

  // 2. Half-day deduction
  const halfDayRatio = rules?.halfDayDeductionRatio ?? 0.5;
  const halfDayDeduction = roundCurrency(halfDays * halfDayRatio * dailyRate);

  // 3. Late arrival penalty deduction
  let lateDeduction = 0;
  const lateMode = rules?.lateDeductionMode || 'ratio_3_to_1';
  if (lateMode === 'ratio_3_to_1') {
    const penalizedDays = Math.floor(lateDays / 3);
    lateDeduction = roundCurrency(penalizedDays * dailyRate);
  } else if (lateMode === 'ratio_3_to_half') {
    const penalizedUnits = Math.floor(lateDays / 3) * 0.5;
    lateDeduction = roundCurrency(penalizedUnits * dailyRate);
  } else if (lateMode === 'fixed_amount') {
    const grace = rules?.lateGraceCount ?? 2;
    const chargeable = Math.max(0, lateDays - grace);
    lateDeduction = roundCurrency(chargeable * (rules?.latePenaltyAmount ?? 500));
  }

  const unexcusedUnits = absentDays + (halfDays * halfDayRatio);
  const attendanceDeduction = roundCurrency(absenceDeduction + halfDayDeduction + lateDeduction);

  // Dynamic Special Allowances from AI Policy Rules
  let dynamicSpecialAllowance = specialAllowance;
  if (rules?.specialAllowances && rules.specialAllowances.length > 0) {
    const staffRole = (staffMember.designation || staffMember.department || '').toLowerCase();
    for (const allow of rules.specialAllowances) {
      const applies = (allow.applies_to || 'all').toLowerCase();
      if (applies === 'all' || applies.includes('all') || staffRole.includes(applies) || applies.includes(staffRole)) {
        const added = allow.type === 'percentage'
          ? roundCurrency((baseSalary * allow.value) / 100)
          : roundCurrency(allow.value);
        dynamicSpecialAllowance += added;
      }
    }
  }

  // Dynamic Attendance Bonus from AI Policy Rules
  let attendanceBonusAmount = 0;
  if (rules?.attendanceBonus?.enabled && (rules.attendanceBonus.amount || 0) > 0) {
    const cond = rules.attendanceBonus.condition || 'zero_absences';
    if (cond === 'zero_absences' && absentDays === 0 && halfDays === 0) {
      attendanceBonusAmount = roundCurrency(rules.attendanceBonus.amount || 0);
    } else if (cond === 'zero_lates_and_absences' && absentDays === 0 && halfDays === 0 && lateDays === 0) {
      attendanceBonusAmount = roundCurrency(rules.attendanceBonus.amount || 0);
    }
  }

  // Dynamic Staff-Specific Adjustments (e.g. "Cut half salary of Adnan", "Deduct 5000 fine from Ali")
  let staffAdjustmentDeduction = 0;
  let staffAdjustmentBonus = 0;
  const staffFullName = (staffMember.full_name || staffMember.fullName || '').toLowerCase().trim();
  const staffCodeLower = (staffMember.staff_id || staffMember.staffId || '').toLowerCase().trim();

  if (rules?.staffAdjustments && rules.staffAdjustments.length > 0) {
    for (const adj of rules.staffAdjustments) {
      const targetName = (adj.staffName || '').toLowerCase().trim();
      if (targetName && (staffFullName.includes(targetName) || targetName.includes(staffFullName) || staffCodeLower.includes(targetName))) {
        if (adj.type === 'deduction_percentage') {
          const cutRatio = Math.min(100, Math.max(0, adj.value || 50)) / 100;
          staffAdjustmentDeduction += roundCurrency(baseSalary * cutRatio);
        } else if (adj.type === 'deduction_fixed') {
          staffAdjustmentDeduction += roundCurrency(adj.value || 0);
        } else if (adj.type === 'bonus_percentage') {
          const bonusRatio = Math.max(0, adj.value || 0) / 100;
          staffAdjustmentBonus += roundCurrency(baseSalary * bonusRatio);
        } else if (adj.type === 'bonus_fixed') {
          staffAdjustmentBonus += roundCurrency(adj.value || 0);
        }
      }
    }
  }

  // Heuristic safety match against raw policy text if staff adjustments array missed it
  if (staffAdjustmentDeduction === 0 && rules?.rawPolicyText) {
    const rawLower = rules.rawPolicyText.toLowerCase();
    const firstWord = staffFullName.split(' ')[0];
    if (firstWord && rawLower.includes(firstWord)) {
      if (rawLower.includes(`cut half salary of ${firstWord}`) || rawLower.includes(`half salary of ${firstWord}`) || rawLower.includes(`cut half of ${firstWord}`) || rawLower.includes(`deduct half from ${firstWord}`) || rawLower.includes(`half ${firstWord}`)) {
        staffAdjustmentDeduction += roundCurrency(baseSalary * 0.5);
      }
    }
  }

  const grossSalary = roundCurrency(
    baseSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance + dynamicSpecialAllowance + attendanceBonusAmount + staffAdjustmentBonus
  );

  const totalOtherDeductions = roundCurrency(otherDeductions + staffAdjustmentDeduction);
  const statutoryDeductions = roundCurrency(taxDeduction + providentFund + totalOtherDeductions);
  const totalDeductions = roundCurrency(attendanceDeduction + statutoryDeductions);

  // Negative balance guard: Net cannot be negative
  const netPayable = Math.max(0, roundCurrency(grossSalary - totalDeductions));
  const netPayableWords = numberToWords(netPayable);

  const staffCode = staffMember.staff_id || staffMember.staffId || 'STF-001';
  const fullName = staffMember.full_name || staffMember.fullName || 'Staff Member';
  const designation = staffMember.designation || 'Faculty Lecturer';

  const paymentMethod = salaryStructure.payment_method || salaryStructure.paymentMethod || staffMember.payment_method || staffMember.paymentMethod || 'bank_transfer';
  const bankName = salaryStructure.bank_name || salaryStructure.bankName || staffMember.bank_name || staffMember.bankName || null;
  const accountTitle = salaryStructure.account_title || salaryStructure.accountTitle || staffMember.account_title || staffMember.accountTitle || null;
  const accountNumber = salaryStructure.account_number || salaryStructure.accountNumber || staffMember.account_number || staffMember.accountNumber || null;

  return {
    staffMemberId: staffMember.id,
    staffCode,
    fullName,
    designation,
    year,
    month,
    period,
    calendarDays,
    workingDays,
    dailyRate: roundCurrency(dailyRate),
    presentDays,
    lateDays,
    halfDays,
    absentDays,
    excusedLeaves,
    onDutyDays,
    unexcusedUnits,
    absenceDeduction,
    halfDayDeduction,
    lateDeduction,
    attendanceDeduction,
    baseSalary,
    houseRentAllowance,
    medicalAllowance,
    conveyanceAllowance,
    specialAllowance,
    grossSalary,
    taxDeduction,
    providentFund,
    otherDeductions,
    statutoryDeductions,
    totalDeductions,
    netPayable,
    netPayableWords,
    paymentMethod,
    bankName,
    accountTitle,
    accountNumber
  };
}

/**
 * Generates structured, unique payslip numbers.
 * Example: PSL-202608-001 or SLIP-2026-08-FAC001
 */
export function generatePayslipNumber(year: number, month: number, index: number, staffCode?: string): string {
  const monthStr = String(month).padStart(2, '0');
  const indexStr = String(index).padStart(3, '0');
  if (staffCode) {
    const cleanCode = staffCode.replace(/[^A-Za-z0-9]/g, '');
    return 'SLIP-' + year + '-' + monthStr + '-' + cleanCode;
  }
  return 'PSL-' + year + monthStr + '-' + indexStr;
}

/**
 * Formats a clean WhatsApp Payslip Advice message template.
 */
export function formatWhatsAppPayslipAdvice(
  payslip: {
    payslip_number?: string | null;
    month_period?: string | null;
    month?: number | null;
    year?: number | null;
    staffMember?: { staff_id?: string | null; full_name?: string | null; designation?: string | null } | null;
    fullName?: string | null;
    staffCode?: string | null;
    designation?: string | null;
    base_pay?: number | null;
    baseSalary?: number | null;
    house_rent_allowance?: number | null;
    medical_allowance?: number | null;
    conveyance_allowance?: number | null;
    special_allowance?: number | null;
    grossSalary?: number | null;
    allowances?: number | null;
    attendance_deduction_amount?: number | null;
    attendanceDeduction?: number | null;
    tax_deduction?: number | null;
    provident_fund?: number | null;
    other_deductions?: number | null;
    totalDeductions?: number | null;
    deductions?: number | null;
    net_payable?: number | null;
    netPayable?: number | null;
    amount?: number | null;
    payment_method?: string | null;
    paymentMethod?: string | null;
    bank_name?: string | null;
    account_number?: string | null;
    transaction_ref?: string | null;
    unexcused_absences?: number | null;
  },
  institutionName = 'Academia Pro OS'
): string {
  const name = payslip.staffMember?.full_name || payslip.fullName || 'Employee';
  const code = payslip.staffMember?.staff_id || payslip.staffCode || 'N/A';
  const designation = payslip.staffMember?.designation || payslip.designation || 'Staff Member';
  const period = payslip.month_period || (payslip.year && payslip.month ? payslip.year + '-' + String(payslip.month).padStart(2, '0') : 'Current Period');
  
  const base = payslip.base_pay ?? payslip.baseSalary ?? 0;
  const hra = payslip.house_rent_allowance ?? 0;
  const med = payslip.medical_allowance ?? 0;
  const conv = payslip.conveyance_allowance ?? 0;
  const spec = payslip.special_allowance ?? 0;
  const gross = payslip.grossSalary ?? (base + hra + med + conv + spec + (payslip.allowances ?? 0));

  const attDed = payslip.attendance_deduction_amount ?? payslip.attendanceDeduction ?? 0;
  const tax = payslip.tax_deduction ?? 0;
  const pf = payslip.provident_fund ?? 0;
  const other = payslip.other_deductions ?? 0;
  const totalDed = payslip.totalDeductions ?? payslip.deductions ?? (attDed + tax + pf + other);

  const net = payslip.net_payable ?? payslip.netPayable ?? payslip.amount ?? Math.max(0, gross - totalDed);
  const method = payslip.payment_method || payslip.paymentMethod || 'Bank Transfer';
  const bank = payslip.bank_name ? payslip.bank_name : '';
  const maskedAcc = payslip.account_number ? '...' + payslip.account_number.slice(-5) : '';
  const ref = payslip.transaction_ref ? '\nRef: ' + payslip.transaction_ref : '';

  const formatPKR = (num: number) => 'PKR ' + num.toLocaleString('en-US', { minimumFractionDigits: num % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });

  return [
    '*' + institutionName.toUpperCase() + ' — OFFICIAL SALARY ADVICE*',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '*Employee:* ' + name + ' (' + code + ')',
    '*Designation:* ' + designation,
    '*Period:* ' + period,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '*EARNINGS BREAKDOWN:*',
    '  • Base Salary: ' + formatPKR(base),
    hra > 0 ? '  • House Rent: ' + formatPKR(hra) : null,
    med > 0 ? '  • Medical Allowance: ' + formatPKR(med) : null,
    conv > 0 ? '  • Conveyance Allowance: ' + formatPKR(conv) : null,
    spec > 0 ? '  • Special Allowance: ' + formatPKR(spec) : null,
    '  *Gross Salary: ' + formatPKR(gross) + '*',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '*DEDUCTIONS:*',
    attDed > 0 ? '  • Attendance Deduction: ' + formatPKR(attDed) : null,
    tax > 0 ? '  • Income Tax: ' + formatPKR(tax) : null,
    pf > 0 ? '  • Provident Fund: ' + formatPKR(pf) : null,
    other > 0 ? '  • Other Deductions: ' + formatPKR(other) : null,
    '  *Total Deductions: ' + formatPKR(totalDed) + '*',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '*NET SALARY PAID: ' + formatPKR(net) + '*',
    '*Mode:* ' + method + (bank ? ' (' + bank + (maskedAcc ? ' - ' + maskedAcc : '') + ')' : '') + ref,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '_This is a verified digital payroll advice. Thank you for your service to ' + institutionName + '._'
  ].filter(Boolean).join('\n');
}