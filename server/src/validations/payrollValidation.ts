import { z } from 'zod';
import { MONTH_PERIOD_REGEX } from './commonValidation';

export const staffSalaryStructureUpsertSchema = z.object({
  staff_member_id: z.string().optional(),
  staffMemberId: z.string().optional(),
  base_salary: z.number().min(0, 'Base salary must be non-negative').optional(),
  baseSalary: z.number().min(0, 'Base salary must be non-negative').optional(),
  house_rent_allowance: z.number().min(0).optional(),
  houseRentAllowance: z.number().min(0).optional(),
  medical_allowance: z.number().min(0).optional(),
  medicalAllowance: z.number().min(0).optional(),
  conveyance_allowance: z.number().min(0).optional(),
  conveyanceAllowance: z.number().min(0).optional(),
  special_allowance: z.number().min(0).optional(),
  specialAllowance: z.number().min(0).optional(),
  custom_earnings: z.array(z.any()).optional(),
  customEarnings: z.array(z.any()).optional(),
  tax_deduction: z.number().min(0).optional(),
  taxDeduction: z.number().min(0).optional(),
  provident_fund: z.number().min(0).optional(),
  providentFund: z.number().min(0).optional(),
  pf: z.number().min(0).optional(),
  other_deductions: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  custom_deductions: z.array(z.any()).optional(),
  customDeductions: z.array(z.any()).optional(),
  payment_frequency: z.enum(['monthly', 'weekly', 'bi_weekly']).optional(),
  paymentFrequency: z.enum(['monthly', 'weekly', 'bi_weekly']).optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  bank_name: z.string().trim().max(100).optional().nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
  account_number: z.string().trim().max(100).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  account_title: z.string().trim().max(150).optional().nullable(),
  accountTitle: z.string().trim().max(150).optional().nullable(),
  is_active: z.boolean().optional()
}).transform(data => {
  const staffMemberId = data.staff_member_id || data.staffMemberId;
  const baseSalary = data.base_salary !== undefined ? data.base_salary : (data.baseSalary !== undefined ? data.baseSalary : 0);
  const houseRentAllowance = data.house_rent_allowance !== undefined ? data.house_rent_allowance : (data.houseRentAllowance !== undefined ? data.houseRentAllowance : 0);
  const medicalAllowance = data.medical_allowance !== undefined ? data.medical_allowance : (data.medicalAllowance !== undefined ? data.medicalAllowance : 0);
  const conveyanceAllowance = data.conveyance_allowance !== undefined ? data.conveyance_allowance : (data.conveyanceAllowance !== undefined ? data.conveyanceAllowance : 0);
  const specialAllowance = data.special_allowance !== undefined ? data.special_allowance : (data.specialAllowance !== undefined ? data.specialAllowance : 0);
  const customEarnings = data.custom_earnings || data.customEarnings || [];
  const taxDeduction = data.tax_deduction !== undefined ? data.tax_deduction : (data.taxDeduction !== undefined ? data.taxDeduction : 0);
  const providentFund = data.provident_fund !== undefined ? data.provident_fund : (data.providentFund !== undefined ? data.providentFund : (data.pf !== undefined ? data.pf : 0));
  const otherDeductions = data.other_deductions !== undefined ? data.other_deductions : (data.otherDeductions !== undefined ? data.otherDeductions : 0);
  const customDeductions = data.custom_deductions || data.customDeductions || [];
  const paymentFrequency = data.payment_frequency || data.paymentFrequency || 'monthly';
  const effectiveFrom = data.effective_from || data.effectiveFrom || null;
  const bankName = data.bank_name || data.bankName || null;
  const accountNumber = data.account_number || data.accountNumber || null;
  const accountTitle = data.account_title || data.accountTitle || null;
  const isActive = data.is_active !== undefined ? data.is_active : true;

  return {
    staffMemberId,
    baseSalary,
    houseRentAllowance,
    medicalAllowance,
    conveyanceAllowance,
    specialAllowance,
    customEarnings,
    taxDeduction,
    providentFund,
    otherDeductions,
    customDeductions,
    paymentFrequency,
    effectiveFrom,
    bankName,
    accountNumber,
    accountTitle,
    isActive
  };
});

export const payrollBatchGenerateSchema = z.object({
  month: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12')
  ).optional(),
  year: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier')
  ).optional(),
  month_period: z.string().regex(MONTH_PERIOD_REGEX, 'Month period must be YYYY-MM').optional(),
  monthPeriod: z.string().regex(MONTH_PERIOD_REGEX).optional(),
  period: z.string().regex(MONTH_PERIOD_REGEX).optional(),
  staff_type_id: z.string().optional().nullable(),
  staffTypeId: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  rules: z.any().optional()
}).refine(data => {
  if (data.month !== undefined && data.year !== undefined) return true;
  if (data.month_period || data.monthPeriod || data.period) return true;
  return false;
}, {
  message: 'Either month (1-12) & year (e.g. 2026) or month_period (YYYY-MM) is required',
  path: ['month']
}).transform(data => {
  let year = data.year;
  let month = data.month;
  const periodStr = data.month_period || data.monthPeriod || data.period;
  if (periodStr && (!year || !month)) {
    const parts = periodStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }
  return {
    year: year!,
    month: month!,
    period: year + '-' + String(month).padStart(2, '0'),
    staffTypeId: data.staff_type_id || data.staffTypeId || undefined,
    notes: data.notes || null,
    rules: data.rules || undefined
  };
});

export const payslipDisburseSchema = z.object({
  payment_method: z.string().optional(),
  paymentMethod: z.string().optional(),
  transaction_ref: z.string().trim().max(100).optional().nullable(),
  transactionRef: z.string().trim().max(100).optional().nullable(),
  reference_no: z.string().trim().max(100).optional().nullable(),
  referenceNo: z.string().trim().max(100).optional().nullable(),
  payment_date: z.string().optional(),
  paymentDate: z.string().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable()
}).transform(data => {
  const method = data.payment_method || data.paymentMethod || 'Bank Transfer';
  const ref = data.transaction_ref || data.transactionRef || data.reference_no || data.referenceNo || null;
  const paymentDate = data.payment_date || data.paymentDate || new Date().toISOString().split('T')[0];
  const notes = data.notes || data.remarks || null;

  return {
    paymentMethod: method,
    transactionRef: ref,
    paymentDate,
    notes
  };
});