import { z } from 'zod';
import { 
  MONTH_PERIOD_REGEX, 
  staffPaymentMethodEnum, 
  staffSalaryPaymentStatusEnum 
} from './commonValidation';

export const staffSalaryPaymentCreateSchema = z.object({
  monthPeriod: z.string().regex(MONTH_PERIOD_REGEX, "Month period must be YYYY-MM").optional(),
  month_period: z.string().regex(MONTH_PERIOD_REGEX).optional(),
  amount: z.number().min(0).optional(),
  basePay: z.number().min(0, "Base pay must be non-negative").optional(),
  base_pay: z.number().min(0).optional(),
  allowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  netPayable: z.number().min(0).optional(),
  net_payable: z.number().min(0).optional(),
  status: staffSalaryPaymentStatusEnum.optional(),
  paymentDate: z.string().optional(),
  payment_date: z.string().optional(),
  paymentMethod: staffPaymentMethodEnum.optional(),
  payment_method: staffPaymentMethodEnum.optional(),
  referenceNo: z.string().trim().max(100).optional().nullable(),
  reference_no: z.string().trim().max(100).optional().nullable(),
  transactionRef: z.string().trim().max(100).optional().nullable(),
  transaction_ref: z.string().trim().max(100).optional().nullable(),
  slipUrl: z.string().trim().optional().nullable(),
  slip_url: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  remarks: z.string().trim().max(500).optional().nullable()
}).refine(data => data.monthPeriod || data.month_period, {
  message: "Month period (YYYY-MM) is required",
  path: ["monthPeriod"]
}).refine(data => data.basePay !== undefined || data.base_pay !== undefined || data.amount !== undefined, {
  message: "Base pay or amount is required",
  path: ["basePay"]
}).transform(data => {
  const basePay = (data.basePay !== undefined ? data.basePay : (data.base_pay !== undefined ? data.base_pay : data.amount)) || 0;
  const allowances = data.allowances || 0;
  const deductions = data.deductions || 0;
  const amount = data.amount !== undefined ? data.amount : (basePay + allowances - deductions);
  const netPayable = data.netPayable !== undefined ? data.netPayable : (data.net_payable !== undefined ? data.net_payable : amount);
  return {
    monthPeriod: (data.monthPeriod || data.month_period)!,
    basePay,
    allowances,
    deductions,
    amount,
    netPayable,
    status: data.status || "paid",
    paymentDate: data.paymentDate || data.payment_date || new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod || data.payment_method || "bank_transfer",
    referenceNo: data.referenceNo || data.reference_no || data.transactionRef || data.transaction_ref || null,
    transactionRef: data.transactionRef || data.transaction_ref || data.referenceNo || data.reference_no || null,
    slipUrl: data.slipUrl || data.slip_url || null,
    notes: data.notes || data.remarks || null,
    remarks: data.remarks || data.notes || null
  };
});
