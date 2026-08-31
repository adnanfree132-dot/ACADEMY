import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import { payrollBatchGenerateSchema, payslipDisburseSchema } from '../validations/payrollValidation';
import {
  getDaysInMonth,
  calculateStaffPayrollItem,
  generatePayslipNumber,
  formatWhatsAppPayslipAdvice,
  roundCurrency
} from '../utils/payrollCalculator';
import { resolveSafeUserId } from '../utils/userResolver';

/**
 * 1. 1-Click Monthly Batch Payroll Generation
 */
export async function generateMonthlyPayrollBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = payrollBatchGenerateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const { year, month, period, staffTypeId, notes, rules } = parseResult.data;
    const batchCode = 'PAY-' + year + '-' + String(month).padStart(2, '0');
    const daysInMonth = getDaysInMonth(year, month);
    const startDate = period + '-01';
    const endDate = period + '-' + String(daysInMonth).padStart(2, '0');

    const staffMembers = await prisma.staffMember.findMany({
      where: {
        status: { in: ['active', 'probation'] },
        ...(staffTypeId && { staff_type_id: staffTypeId })
      },
      include: {
        staffType: true,
        salaryStructure: true
      },
      orderBy: { staff_id: 'asc' }
    });

    if (staffMembers.length === 0) {
      return sendError(res, 'No active staff members found to process payroll for.', 400);
    }

    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const attendanceMap = new Map<string, any[]>();
    for (const record of attendanceRecords) {
      if (!attendanceMap.has(record.staff_member_id)) {
        attendanceMap.set(record.staff_member_id, []);
      }
      attendanceMap.get(record.staff_member_id)!.push(record);
    }

    let totalGrossAmount = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalAttendanceDeductions = 0;
    let totalNetAmount = 0;

    const payslipCreationData: any[] = [];

    for (let i = 0; i < staffMembers.length; i++) {
      const staff = staffMembers[i];
      const records = attendanceMap.get(staff.id) || [];

      let presentDays = 0;
      let lateDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let excusedLeaves = 0;
      let onDutyDays = 0;

      for (const r of records) {
        const s = (r.status || '').toLowerCase();
        if (s === 'present') presentDays++;
        else if (s === 'late') lateDays++;
        else if (s === 'half_day' || s === 'half-day') halfDays++;
        else if (s === 'absent') absentDays++;
        else if (s === 'excused' || s === 'on_leave' || s === 'leave') excusedLeaves++;
        else if (s === 'on_duty' || s === 'onduty') onDutyDays++;
      }

      const unexcusedUnits = absentDays + 0.5 * halfDays;

      const structure = staff.salaryStructure || {
        base_salary: staff.base_salary || 0,
        bank_name: staff.bank_name,
        account_number: staff.account_number,
        account_title: staff.account_title,
        payment_method: staff.payment_method
      };

      const calculated = calculateStaffPayrollItem(
        staff,
        structure,
        {
          calendarDays: daysInMonth,
          presentDays,
          lateDays,
          halfDays,
          absentDays,
          excusedLeaves,
          onDutyDays,
          unexcusedAbsences: unexcusedUnits
        },
        year,
        month,
        rules
      );

      const payslipNumber = generatePayslipNumber(year, month, i + 1, staff.staff_id);

      totalGrossAmount += calculated.grossSalary;
      totalAllowances += (calculated.grossSalary - calculated.baseSalary);
      totalDeductions += calculated.totalDeductions;
      totalAttendanceDeductions += calculated.attendanceDeduction;
      totalNetAmount += calculated.netPayable;

      payslipCreationData.push({
        staff_member_id: staff.id,
        payslip_number: payslipNumber,
        month,
        year,
        month_period: period,
        payment_date: new Date(),
        amount: calculated.netPayable,
        base_pay: calculated.baseSalary,
        allowances: roundCurrency(calculated.grossSalary - calculated.baseSalary),
        house_rent_allowance: calculated.houseRentAllowance,
        medical_allowance: calculated.medicalAllowance,
        conveyance_allowance: calculated.conveyanceAllowance,
        special_allowance: calculated.specialAllowance,
        working_days: daysInMonth,
        present_days: presentDays,
        absent_days: absentDays,
        half_days: halfDays,
        late_days: lateDays,
        excused_leaves: excusedLeaves,
        unexcused_absences: unexcusedUnits,
        attendance_deduction_amount: calculated.attendanceDeduction,
        tax_deduction: calculated.taxDeduction,
        provident_fund: calculated.providentFund,
        other_deductions: calculated.otherDeductions,
        deductions: calculated.totalDeductions,
        net_payable: calculated.netPayable,
        payment_method: calculated.paymentMethod,
        bank_name: calculated.bankName,
        account_number: calculated.accountNumber,
        account_title: calculated.accountTitle,
        status: 'pending',
        notes: notes || null
      });
    }

    totalGrossAmount = roundCurrency(totalGrossAmount);
    totalAllowances = roundCurrency(totalAllowances);
    totalDeductions = roundCurrency(totalDeductions);
    totalAttendanceDeductions = roundCurrency(totalAttendanceDeductions);
    totalNetAmount = roundCurrency(totalNetAmount);

    const safeCreatedByUserId = await resolveSafeUserId(req.user?.userId);

    const existingBatch = await prisma.payrollBatch.findFirst({
      where: { OR: [{ period }, { batch_code: batchCode }] }
    });

    let batch;
    if (existingBatch) {
      await prisma.staffSalaryPayment.deleteMany({
        where: {
          payroll_batch_id: existingBatch.id,
          status: { in: ['pending', 'generated', 'draft'] }
        }
      });

      batch = await prisma.payrollBatch.update({
        where: { id: existingBatch.id },
        data: {
          total_staff_count: staffMembers.length,
          total_gross_amount: totalGrossAmount,
          total_allowances: totalAllowances,
          total_deductions: totalDeductions,
          total_attendance_deductions: totalAttendanceDeductions,
          total_net_amount: totalNetAmount,
          batch_status: 'generated',
          notes: notes || existingBatch.notes
        }
      });
    } else {
      batch = await prisma.payrollBatch.create({
        data: {
          batch_code: batchCode,
          month,
          year,
          period,
          total_staff_count: staffMembers.length,
          total_gross_amount: totalGrossAmount,
          total_allowances: totalAllowances,
          total_deductions: totalDeductions,
          total_attendance_deductions: totalAttendanceDeductions,
          total_net_amount: totalNetAmount,
          batch_status: 'generated',
          notes: notes || null,
          created_by_user_id: safeCreatedByUserId
        }
      });
    }

    // Bulk fetch any existing paid payslips for this batch to preserve them
    const existingPayments = await prisma.staffSalaryPayment.findMany({
      where: { payroll_batch_id: batch.id }
    });
    const paidSlipMap = new Map<string, typeof existingPayments[0]>();
    for (const p of existingPayments) {
      if (p.status === 'paid') {
        paidSlipMap.set(p.staff_member_id, p);
      }
    }

    // Batch insert newly generated payslips in a single query
    const itemsToInsert = payslipCreationData
      .filter(item => !paidSlipMap.has(item.staff_member_id))
      .map(item => ({
        ...item,
        payroll_batch_id: batch.id
      }));

    if (itemsToInsert.length > 0) {
      await prisma.staffSalaryPayment.createMany({
        data: itemsToInsert,
        skipDuplicates: true
      });
    }

    // Fetch complete list of payslips for the batch
    const createdPayslips = await prisma.staffSalaryPayment.findMany({
      where: { payroll_batch_id: batch.id },
      orderBy: { payslip_number: 'asc' },
      include: { staffMember: true }
    });

    const result = { batch, payslips: createdPayslips };

    if (req.user?.userId) {
      await createAuditLog(
        req.user.userId,
        'GENERATE_PAYROLL_BATCH',
        'PayrollBatch',
        result.batch.id,
        {
          period,
          batch_code: batchCode,
          total_staff: staffMembers.length,
          total_net: totalNetAmount
        }
      );
    }

    return sendSuccess(res, result, undefined, 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. List all monthly payroll batches
 */
export async function getPayrollBatches(req: AuthenticatedRequest, res: Response) {
  try {
    const batches = await prisma.payrollBatch.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        created_by: {
          select: { id: true, full_name: true, role: true }
        },
        approved_by: {
          select: { id: true, full_name: true, role: true }
        },
        salaryPayments: {
          select: { id: true, status: true, amount: true, net_payable: true }
        }
      }
    });

    const enrichedBatches = batches.map(batch => {
      const payments = batch.salaryPayments || [];
      const disbursedCount = payments.filter(p => (p.status || '').toLowerCase() === 'paid').length;
      return {
        ...batch,
        total_staff: batch.total_staff_count,
        disbursed_count: disbursedCount,
        is_fully_disbursed: disbursedCount > 0 && disbursedCount === payments.length
      };
    });

    return sendSuccess(res, enrichedBatches);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. Get single payroll batch details by ID or batch code
 */
export async function getPayrollBatchById(req: AuthenticatedRequest, res: Response) {
  try {
    const idParam = req.params.batchId || req.params.id;
    if (!idParam) {
      return sendError(res, 'Batch identifier is required', 400);
    }

    const batch = await prisma.payrollBatch.findFirst({
      where: {
        OR: [
          { id: idParam },
          { batch_code: { equals: idParam, mode: 'insensitive' } },
          { period: idParam }
        ]
      },
      include: {
        created_by: { select: { id: true, full_name: true, role: true } },
        approved_by: { select: { id: true, full_name: true, role: true } },
        salaryPayments: {
          include: {
            staffMember: {
              include: { staffType: true }
            },
            disbursed_by: {
              select: { id: true, full_name: true }
            }
          },
          orderBy: { payslip_number: 'asc' }
        }
      }
    });

    if (!batch) {
      return sendError(res, 'Payroll batch not found', 404);
    }

    return sendSuccess(res, batch);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 4. Disburse a single payslip
 */
export async function disbursePayslip(req: AuthenticatedRequest, res: Response) {
  try {
    const idParam = req.params.id || req.params.payslipId;
    if (!idParam) {
      return sendError(res, 'Payslip ID is required', 400);
    }

    const payslip = await prisma.staffSalaryPayment.findFirst({
      where: {
        OR: [
          { id: idParam },
          { payslip_number: { equals: idParam, mode: 'insensitive' } }
        ]
      },
      include: {
        staffMember: true,
        payrollBatch: true
      }
    });

    if (!payslip) {
      return sendError(res, 'Payslip record not found', 404);
    }

    const parseResult = payslipDisburseSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const { paymentMethod, transactionRef, paymentDate, notes } = parseResult.data;
    const safeDisbursedByUserId = await resolveSafeUserId(req.user?.userId);

    const updatedPayslip = await prisma.staffSalaryPayment.update({
      where: { id: payslip.id },
      data: {
        status: 'paid',
        payment_method: paymentMethod,
        transaction_ref: transactionRef || payslip.transaction_ref,
        reference_no: transactionRef || payslip.reference_no,
        payment_date: paymentDate ? new Date(paymentDate) : new Date(),
        disbursed_by_user_id: safeDisbursedByUserId,
        notes: notes || payslip.notes
      },
      include: {
        staffMember: { include: { staffType: true } },
        disbursed_by: { select: { id: true, full_name: true } }
      }
    });

    if (payslip.payroll_batch_id) {
      const allBatchPayslips = await prisma.staffSalaryPayment.findMany({
        where: { payroll_batch_id: payslip.payroll_batch_id }
      });

      const allPaid = allBatchPayslips.every(p => p.status === 'paid');
      const anyPaid = allBatchPayslips.some(p => p.status === 'paid');

      const batchStatus = allPaid ? 'disbursed' : (anyPaid ? 'partially_disbursed' : 'approved');

      await prisma.payrollBatch.update({
        where: { id: payslip.payroll_batch_id },
        data: {
          batch_status: batchStatus,
          ...(allPaid && { disbursed_at: new Date() })
        }
      });
    }

    if (req.user?.userId) {
      await createAuditLog(
        req.user.userId,
        'DISBURSE_PAYSLIP',
        'StaffSalaryPayment',
        payslip.id,
        {
          payslip_number: payslip.payslip_number,
          staff_id: payslip.staffMember?.staff_id,
          full_name: payslip.staffMember?.full_name,
          payment_method: paymentMethod,
          transaction_ref: transactionRef,
          amount: payslip.net_payable || payslip.amount
        }
      );
    }

    return sendSuccess(res, updatedPayslip);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 5. Get full rich payslip details for Print / PDF / WhatsApp
 */
export async function getPayslipDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const idParam = req.params.id || req.params.payslipId;
    if (!idParam) {
      return sendError(res, 'Payslip ID is required', 400);
    }

    const payslip = await prisma.staffSalaryPayment.findFirst({
      where: {
        OR: [
          { id: idParam },
          { payslip_number: { equals: idParam, mode: 'insensitive' } }
        ]
      },
      include: {
        staffMember: {
          include: { staffType: true }
        },
        payrollBatch: true,
        disbursed_by: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });

    if (!payslip) {
      return sendError(res, 'Payslip record not found', 404);
    }

    const user = req.user;
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      const sm = payslip.staffMember;
      if (sm && user.userId !== sm.id && user.staffId !== sm.staff_id && user.userId !== sm.user_id) {
        return sendError(res, 'Forbidden: You cannot view payslips of other employees.', 403);
      }
    }

    let institution = {
      name: 'Academia Pro OS Model Campus',
      address: 'Main Academic Boulevard, Campus Zone A',
      phone: '+92 42 3578 9900',
      email: 'accounts@academiapro.edu',
      ntn: '7849201-3'
    };

    try {
      const setting = await prisma.appSetting.findUnique({ where: { key: 'institution_profile' } });
      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        institution = { ...institution, ...parsed };
      }
    } catch (_) {}

    const basePay = payslip.base_pay || 0;
    const hra = payslip.house_rent_allowance || 0;
    const med = payslip.medical_allowance || 0;
    const conv = payslip.conveyance_allowance || 0;
    const spec = payslip.special_allowance || 0;
    const gross = basePay + hra + med + conv + spec + (payslip.allowances || 0);

    const attDed = payslip.attendance_deduction_amount || 0;
    const tax = payslip.tax_deduction || 0;
    const pf = payslip.provident_fund || 0;
    const other = payslip.other_deductions || 0;
    const totalDed = payslip.deductions || (attDed + tax + pf + other);
    const net = payslip.net_payable ?? payslip.amount ?? Math.max(0, gross - totalDed);

    const earnings = [
      { label: 'Base Salary', amount: basePay },
      ...(hra > 0 ? [{ label: 'House Rent Allowance (HRA)', amount: hra }] : []),
      ...(med > 0 ? [{ label: 'Medical Allowance', amount: med }] : []),
      ...(conv > 0 ? [{ label: 'Conveyance Allowance', amount: conv }] : []),
      ...(spec > 0 ? [{ label: 'Special Allowance', amount: spec }] : [])
    ];

    const deductions = [
      ...(attDed > 0 ? [{ label: 'Attendance Deduction (' + (payslip.unexcused_absences || 0) + ' Day(s) Unexcused)', amount: attDed }] : []),
      ...(tax > 0 ? [{ label: 'Income Tax Withholding', amount: tax }] : []),
      ...(pf > 0 ? [{ label: 'Provident Fund (PF)', amount: pf }] : []),
      ...(other > 0 ? [{ label: 'Other Deductions', amount: other }] : [])
    ];

    const whatsAppAdvice = formatWhatsAppPayslipAdvice(
      {
        ...payslip,
        grossSalary: gross,
        totalDeductions: totalDed,
        netPayable: net
      },
      institution.name
    );

    const responseData = {
      ...payslip,
      institution,
      earnings,
      grossEarnings: gross,
      deductionsList: deductions,
      totalDeductionsAmount: totalDed,
      netPayableAmount: net,
      whatsAppMessageAdvice: whatsAppAdvice
    };

    return sendSuccess(res, responseData);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 6. Cloudflare Workers AI - Natural Language Payroll Policy Parser
 */
export async function aiParsePayrollPolicyController(req: AuthenticatedRequest, res: Response) {
  try {
    const { policyText, policy } = req.body;
    const text = policyText || policy;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return sendError(res, 'Please provide a non-empty payroll policy text to parse.', 400);
    }

    // Call Cloudflare Workers AI edge worker
    try {
      const cfResponse = await fetch('https://academy-payroll-ai.adnanfree132.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyText: text })
      });

      if (cfResponse.ok) {
        const cfData: any = await cfResponse.json();
        if (cfData?.success && cfData?.data) {
          return sendSuccess(res, cfData.data, 'Payroll policy successfully parsed via Cloudflare Workers AI');
        }
      }
    } catch (cfErr) {
      console.warn('Cloudflare Workers AI fetch failed, falling back to local heuristic parser:', cfErr);
    }

    // Heuristic fallback parser
    const lower = text.toLowerCase();
    const has30 = lower.includes('30 day') || lower.includes('30-day') || lower.includes('calendar');
    const isHalfRatio = lower.includes('half') || lower.includes('half-day');
    const hasFixedAmount = lower.includes('pkr') && (lower.includes('fine') || lower.includes('penalty'));
    
    // Extract numbers with regex
    const graceMatch = lower.match(/(\d+)\s*(?:late|grace)/);
    const graceCount = graceMatch ? parseInt(graceMatch[1], 10) : 2;

    const penaltyMatch = lower.match(/(?:penalty|fine|deduct)\D*(\d+)\s*(?:pkr|rupees|\$)/);
    const penaltyAmount = penaltyMatch ? parseInt(penaltyMatch[1], 10) : 500;

    const paidLeavesMatch = lower.match(/(\d+)\s*(?:paid\s*leave|leave\s*free|casual)/);
    const paidLeaves = paidLeavesMatch ? parseInt(paidLeavesMatch[1], 10) : 2;

    // Staff adjustments regex in fallback parser
    const staffAdjustments: any[] = [];
    const cutHalfMatch = lower.match(/(?:cut|deduct|reduce)\s+(?:half|50%|0\.5)\s*(?:salary|pay|compensation)?\s*(?:of|for|from)?\s*([a-z0-9_\-\s]+?)(?:[.,;\n]|$)/i);
    if (cutHalfMatch) {
      const staffName = cutHalfMatch[1].replace(/salary|pay|for|from|of/gi, '').trim();
      if (staffName) {
        staffAdjustments.push({
          staffName,
          type: 'deduction_percentage',
          value: 50,
          reason: `50% salary reduction requested for ${staffName}`
        });
      }
    }

    const fallbackRules = {
      policy_name: 'Custom Academy Policy',
      summary: `Parsed standard policy: ${has30 ? '30' : '26'} standard working days, ${paidLeaves} monthly paid leaves, with ${isHalfRatio ? '3:0.5' : '3:1'} late ratio.`,
      workingDaysMode: has30 ? 'fixed_30' : 'fixed_26',
      customWorkingDays: has30 ? 30 : 26,
      lateDeductionMode: hasFixedAmount ? 'fixed_amount' : (isHalfRatio ? 'ratio_3_to_half' : 'ratio_3_to_1'),
      lateGraceCount: graceCount,
      latePenaltyAmount: penaltyAmount,
      halfDayDeductionRatio: 0.5,
      unexcusedAbsenceRatio: 1.0,
      paidLeaveAllowance: paidLeaves,
      attendanceBonus: {
        enabled: lower.includes('bonus'),
        amount: 2000,
        condition: 'zero_absences'
      },
      specialAllowances: [],
      staffAdjustments,
      rawPolicyText: text,
      explanation: 'Policy parsed using institutional calculation engine.'
    };

    return sendSuccess(res, fallbackRules, 'Payroll policy parsed successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to process payroll policy', 500);
  }
}