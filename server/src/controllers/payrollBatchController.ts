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
        status: { in: ['active', 'probation', 'on_leave'] },
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

    // Direct manual staff deductions & earnings (Rate * Quantity multiplier)
    const savedAdjustments = await prisma.staffSalaryAdjustment.findMany({
      where: { month_period: period }
    });
    const adjustmentsByStaffId = new Map<string, typeof savedAdjustments>();
    for (const adj of savedAdjustments) {
      const list = adjustmentsByStaffId.get(adj.staff_member_id) || [];
      list.push(adj);
      adjustmentsByStaffId.set(adj.staff_member_id, list);
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

      // Direct manual staff deductions & earnings (Rate * Quantity multiplier)
      const staffAdjs = adjustmentsByStaffId.get(staff.id) || [];
      const manualDeductions = staffAdjs
        .filter(a => a.type === 'deduction')
        .map(a => ({
          id: a.id,
          name: a.category,
          label: a.category,
          unit_amount: a.unit_amount,
          quantity: a.quantity,
          total_amount: a.total_amount,
          amount: a.total_amount,
          reason: a.reason || null
        }));
      const manualEarnings = staffAdjs
        .filter(a => a.type === 'earning')
        .map(a => ({
          id: a.id,
          name: a.category,
          label: a.category,
          unit_amount: a.unit_amount,
          quantity: a.quantity,
          total_amount: a.total_amount,
          amount: a.total_amount,
          reason: a.reason || null
        }));

      const totalManualDeductions = manualDeductions.reduce((sum, d) => sum + d.total_amount, 0);
      const totalManualEarnings = manualEarnings.reduce((sum, e) => sum + e.total_amount, 0);

      const finalOtherDeductions = roundCurrency(calculated.otherDeductions + totalManualDeductions);
      const finalSpecialAllowance = roundCurrency(calculated.specialAllowance + totalManualEarnings);
      const finalGrossSalary = roundCurrency(calculated.grossSalary + totalManualEarnings);
      const finalAllowances = roundCurrency(finalGrossSalary - calculated.baseSalary);
      const finalTotalDeductions = roundCurrency(calculated.attendanceDeduction + calculated.taxDeduction + calculated.providentFund + finalOtherDeductions);
      const finalNetPayable = roundCurrency(Math.max(0, finalGrossSalary - finalTotalDeductions));

      const payslipNumber = generatePayslipNumber(year, month, i + 1, staff.staff_id);

      totalGrossAmount += finalGrossSalary;
      totalAllowances += finalAllowances;
      totalDeductions += finalTotalDeductions;
      totalAttendanceDeductions += calculated.attendanceDeduction;
      totalNetAmount += finalNetPayable;

      payslipCreationData.push({
        staff_member_id: staff.id,
        payslip_number: payslipNumber,
        month,
        year,
        month_period: period,
        payment_date: new Date(),
        amount: finalNetPayable,
        base_pay: calculated.baseSalary,
        allowances: finalAllowances,
        house_rent_allowance: calculated.houseRentAllowance,
        medical_allowance: calculated.medicalAllowance,
        conveyance_allowance: calculated.conveyanceAllowance,
        special_allowance: finalSpecialAllowance,
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
        other_deductions: finalOtherDeductions,
        deductions: finalTotalDeductions,
        net_payable: finalNetPayable,
        payment_method: calculated.paymentMethod,
        bank_name: calculated.bankName,
        account_number: calculated.accountNumber,
        account_title: calculated.accountTitle,
        custom_deductions_json: JSON.stringify(manualDeductions),
        custom_earnings_json: JSON.stringify(manualEarnings),
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

    // Delete any existing non-paid (pending) payslips for this batch so newly calculated payslips replace them cleanly
    await prisma.staffSalaryPayment.deleteMany({
      where: {
        payroll_batch_id: batch.id,
        status: { not: 'paid' }
      }
    });

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
 * Helper: Recalculates a staff member's pending salary payment whenever
 * their adjustments change, ensuring zero-latency instant updates.
 */
async function recalculateStaffPayslip(staffMemberId: string, period: string) {
  const payslip = await prisma.staffSalaryPayment.findFirst({
    where: {
      staff_member_id: staffMemberId,
      month_period: period,
      status: { not: 'paid' }
    }
  });
  if (!payslip) return;

  const staffAdjs = await prisma.staffSalaryAdjustment.findMany({
    where: {
      staff_member_id: staffMemberId,
      month_period: period
    }
  });

  const manualDeductions = staffAdjs
    .filter(a => a.type === 'deduction')
    .map(a => ({
      id: a.id,
      name: a.category,
      label: a.category,
      unit_amount: a.unit_amount,
      quantity: a.quantity,
      total_amount: a.total_amount,
      amount: a.total_amount,
      reason: a.reason || null
    }));
  const manualEarnings = staffAdjs
    .filter(a => a.type === 'earning')
    .map(a => ({
      id: a.id,
      name: a.category,
      label: a.category,
      unit_amount: a.unit_amount,
      quantity: a.quantity,
      total_amount: a.total_amount,
      amount: a.total_amount,
      reason: a.reason || null
    }));

  const otherDeductions = roundCurrency(manualDeductions.reduce((sum, d) => sum + d.total_amount, 0));
  const specialAllowance = roundCurrency(manualEarnings.reduce((sum, e) => sum + e.total_amount, 0));

  const basePay = payslip.base_pay || 0;
  const hra = payslip.house_rent_allowance || 0;
  const med = payslip.medical_allowance || 0;
  const conv = payslip.conveyance_allowance || 0;
  const gross = roundCurrency(basePay + hra + med + conv + specialAllowance);

  const attDed = payslip.attendance_deduction_amount || 0;
  const tax = payslip.tax_deduction || 0;
  const pf = payslip.provident_fund || 0;
  const totalDed = roundCurrency(attDed + tax + pf + otherDeductions);
  const netPayable = roundCurrency(Math.max(0, gross - totalDed));

  await prisma.staffSalaryPayment.update({
    where: { id: payslip.id },
    data: {
      other_deductions: otherDeductions,
      special_allowance: specialAllowance,
      allowances: roundCurrency(hra + med + conv + specialAllowance),
      deductions: totalDed,
      amount: netPayable,
      net_payable: netPayable,
      custom_deductions_json: JSON.stringify(manualDeductions),
      custom_earnings_json: JSON.stringify(manualEarnings)
    }
  });
}

/**
 * 6. Simple Staff Salary Adjustments & Deductions (Direct Multiplier Calculator)
 * Allows administrators to select staff, select deduction/earning type, enter unit rate and count.
 */
export async function getSalaryAdjustmentsController(req: AuthenticatedRequest, res: Response) {
  try {
    const { month_period, staff_member_id } = req.query;
    const where: any = {};
    if (month_period) where.month_period = String(month_period);
    if (staff_member_id) where.staff_member_id = String(staff_member_id);

    const adjustments = await prisma.staffSalaryAdjustment.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            role: true,
            photo_url: true,
            staffType: { select: { id: true, name: true } }
          }
        }
      }
    });

    return sendSuccess(res, adjustments, 'Salary adjustments retrieved successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function createSalaryAdjustmentController(req: AuthenticatedRequest, res: Response) {
  try {
    const { staff_member_id, month_period, type, category, unit_amount, quantity, reason } = req.body;

    if (!staff_member_id) {
      return sendError(res, 'Staff member is required', 400);
    }
    if (!month_period) {
      return sendError(res, 'Month period (e.g. 2026-08) is required', 400);
    }
    if (!category || !category.trim()) {
      return sendError(res, 'Adjustment type / category is required', 400);
    }

    const unitAmt = Number(unit_amount) || 0;
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    const totalAmt = roundCurrency(unitAmt * qty);

    const created = await prisma.staffSalaryAdjustment.create({
      data: {
        staff_member_id,
        month_period,
        type: type === 'earning' ? 'earning' : 'deduction',
        category: category.trim(),
        unit_amount: unitAmt,
        quantity: qty,
        total_amount: totalAmt,
        reason: reason?.trim() || null
      },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            role: true,
            photo_url: true
          }
        }
      }
    });

    // Auto-recalculate pending payslip for this staff member in this period if one exists
    try {
      await recalculateStaffPayslip(staff_member_id, month_period);
    } catch (recalcErr) {
      console.warn('Payslip auto-recalc warning:', recalcErr);
    }

    return sendSuccess(res, created, 'Salary adjustment added successfully', 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function updateSalaryAdjustmentController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { type, category, unit_amount, quantity, reason } = req.body;

    const existing = await prisma.staffSalaryAdjustment.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Salary adjustment not found', 404);
    }

    const unitAmt = unit_amount !== undefined ? Number(unit_amount) : existing.unit_amount;
    const qty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const totalAmt = roundCurrency(unitAmt * qty);

    const updated = await prisma.staffSalaryAdjustment.update({
      where: { id },
      data: {
        ...(type && { type: type === 'earning' ? 'earning' : 'deduction' }),
        ...(category && { category: category.trim() }),
        unit_amount: unitAmt,
        quantity: qty,
        total_amount: totalAmt,
        ...(reason !== undefined && { reason: reason?.trim() || null })
      },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true,
            role: true
          }
        }
      }
    });

    try {
      await recalculateStaffPayslip(existing.staff_member_id, existing.month_period);
    } catch (recalcErr) {
      console.warn('Payslip auto-recalc warning:', recalcErr);
    }

    return sendSuccess(res, updated, 'Salary adjustment updated successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function deleteSalaryAdjustmentController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.staffSalaryAdjustment.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Salary adjustment not found', 404);
    }

    await prisma.staffSalaryAdjustment.delete({ where: { id } });

    try {
      await recalculateStaffPayslip(existing.staff_member_id, existing.month_period);
    } catch (recalcErr) {
      console.warn('Payslip auto-recalc warning:', recalcErr);
    }

    return sendSuccess(res, { id }, 'Salary adjustment removed successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 7. Simple Salary Heads (Deduction & Earning Types with Standard Amount)
 */
const DEFAULT_STARTER_HEADS = [
  {
    title: 'Late Arrival',
    type: 'deduction',
    amount: 2000,
    description: 'Per-late arrival deduction'
  },
  {
    title: 'Advance Salary',
    type: 'deduction',
    amount: 5000,
    description: 'Salary advance installment recovery'
  },
  {
    title: 'Overtime',
    type: 'earning',
    amount: 1500,
    description: 'Overtime duty remuneration'
  },
  {
    title: 'Bonus',
    type: 'earning',
    amount: 5000,
    description: 'Performance or special bonus'
  }
];

export async function ensureDefaultSalaryHeads() {
  try {
    const count = await prisma.salaryHead.count();
    if (count === 0) {
      for (const head of DEFAULT_STARTER_HEADS) {
        await prisma.salaryHead.create({ data: head });
      }
    }
  } catch (err) {
    console.warn('Failed to seed default salary heads:', err);
  }
}

export async function getSalaryHeadsController(req: AuthenticatedRequest, res: Response) {
  try {
    await ensureDefaultSalaryHeads();
    const { type, active_only } = req.query;
    const where: any = {};
    if (active_only === 'true') where.is_active = true;
    if (type) where.type = String(type);

    const heads = await prisma.salaryHead.findMany({
      where,
      orderBy: [{ type: 'asc' }, { title: 'asc' }]
    });
    return sendSuccess(res, heads, 'Salary heads retrieved successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function createSalaryHeadController(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, type, amount, description } = req.body;
    if (!title || !title.trim()) {
      return sendError(res, 'Head title is required', 400);
    }
    const created = await prisma.salaryHead.create({
      data: {
        title: title.trim(),
        type: type === 'earning' ? 'earning' : 'deduction',
        amount: Number(amount) || 0,
        description: description?.trim() || null
      }
    });
    return sendSuccess(res, created, 'Salary head created successfully', 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function updateSalaryHeadController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, type, amount, description, is_active } = req.body;
    const existing = await prisma.salaryHead.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Salary head not found', 404);
    }
    const updated = await prisma.salaryHead.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(type && { type: type === 'earning' ? 'earning' : 'deduction' }),
        ...(amount !== undefined && { amount: Number(amount) || 0 }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) })
      }
    });
    return sendSuccess(res, updated, 'Salary head updated successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function deleteSalaryHeadController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.salaryHead.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Salary head not found', 404);
    }
    await prisma.salaryHead.delete({ where: { id } });
    return sendSuccess(res, { id }, 'Salary head removed successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 11. Tag Registry Management (WhatsApp-Style Variable System)
 */
const DEFAULT_STARTER_TAGS = [
  {
    tag_code: 'HALF_MONTH_SALARY',
    display_label: 'Disciplinary Half-Month Pay Cut',
    type: 'deduction',
    calculation_type: 'percentage_of_base',
    default_value: 50,
    reason_template: '50% half-month salary deduction per institutional policy memo'
  },
  {
    tag_code: 'ADVANCE_SALARY',
    display_label: 'Salary Advance Recovery',
    type: 'deduction',
    calculation_type: 'fixed_amount',
    default_value: 0,
    reason_template: 'Monthly recovery installment for approved salary advance'
  },
  {
    tag_code: 'LAB_ALLOWANCE',
    display_label: 'Science Lab Duty Allowance',
    type: 'earning',
    calculation_type: 'percentage_of_base',
    default_value: 10,
    reason_template: 'Special remuneration for conducting laboratory practicals'
  },
  {
    tag_code: 'DISCIPLINARY_FINE',
    display_label: 'Disciplinary Fine / Penalty',
    type: 'deduction',
    calculation_type: 'fixed_amount',
    default_value: 1000,
    reason_template: 'Fine deducted for institutional conduct violation'
  },
  {
    tag_code: 'EOBI',
    display_label: 'EOBI Contribution',
    type: 'deduction',
    calculation_type: 'fixed_amount',
    default_value: 500,
    reason_template: 'Employees Old-Age Benefits statutory contribution'
  }
];

export async function ensureDefaultPayrollTags() {
  try {
    for (const tag of DEFAULT_STARTER_TAGS) {
      await (prisma as any).payrollComponentTag.upsert({
        where: { tag_code: tag.tag_code },
        update: {},
        create: tag
      });
    }
  } catch (err) {
    console.warn('Failed to seed default payroll tags:', err);
  }
}

export async function getPayrollTagsController(req: AuthenticatedRequest, res: Response) {
  try {
    await ensureDefaultPayrollTags();
    const tags = await (prisma as any).payrollComponentTag.findMany({
      where: { is_active: true },
      orderBy: [{ type: 'asc' }, { tag_code: 'asc' }]
    });
    return sendSuccess(res, tags, 'Payroll component tags retrieved successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function createPayrollTagController(req: AuthenticatedRequest, res: Response) {
  try {
    const { tag_code, display_label, type, calculation_type, default_value, reason_template } = req.body;
    if (!tag_code || !display_label) {
      return sendError(res, 'Tag code and display label are required', 400);
    }
    const cleanTagCode = tag_code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = await (prisma as any).payrollComponentTag.findUnique({
      where: { tag_code: cleanTagCode }
    });
    if (existing) {
      if (!existing.is_active) {
        const reactivated = await (prisma as any).payrollComponentTag.update({
          where: { id: existing.id },
          data: {
            display_label,
            type: type || 'deduction',
            calculation_type: calculation_type || 'percentage_of_base',
            default_value: Number(default_value) || 0,
            reason_template: reason_template || null,
            is_active: true
          }
        });
        return sendSuccess(res, reactivated, 'Payroll component tag reactivated', 200);
      }
      return sendError(res, `Tag code ${cleanTagCode} already exists`, 409);
    }

    const newTag = await (prisma as any).payrollComponentTag.create({
      data: {
        tag_code: cleanTagCode,
        display_label,
        type: type || 'deduction',
        calculation_type: calculation_type || 'percentage_of_base',
        default_value: Number(default_value) || 0,
        reason_template: reason_template || null,
        is_active: true
      }
    });
    return sendSuccess(res, newTag, 'Payroll component tag created successfully', 201);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function updatePayrollTagController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { display_label, type, calculation_type, default_value, reason_template, is_active } = req.body;
    const updated = await (prisma as any).payrollComponentTag.update({
      where: { id },
      data: {
        ...(display_label && { display_label }),
        ...(type && { type }),
        ...(calculation_type && { calculation_type }),
        ...(default_value !== undefined && { default_value: Number(default_value) }),
        ...(reason_template !== undefined && { reason_template }),
        ...(is_active !== undefined && { is_active: Boolean(is_active) })
      }
    });
    return sendSuccess(res, updated, 'Payroll component tag updated successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

export async function deletePayrollTagController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deactivated = await (prisma as any).payrollComponentTag.update({
      where: { id },
      data: { is_active: false }
    });
    return sendSuccess(res, deactivated, 'Payroll component tag deactivated successfully');
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 12. Direct Live Staff Payroll Register (Zero Batch Barrier)
 * GET /api/v1/payroll/live-register
 * Defaults to prior completed month (e.g. August when in September)
 */
export async function getLiveStaffPayrollRegisterController(req: AuthenticatedRequest, res: Response) {
  try {
    let { month_period, staff_type_id, search } = req.query;

    if (!month_period || typeof month_period !== 'string' || month_period.trim() === '') {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth(); // 0 is Jan, so if now is Sep (8), month is 8 (Aug)
      if (month === 0) {
        month = 12;
        year -= 1;
      }
      month_period = `${year}-${String(month).padStart(2, '0')}`;
    }

    const [yearStr, monthStr] = (month_period as string).split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = getDaysInMonth(year, month);
    const startDate = `${month_period}-01`;
    const endDate = `${month_period}-${String(daysInMonth).padStart(2, '0')}`;

    const where: any = {
      status: { in: ['active', 'probation', 'on_leave'] }
    };

    if (staff_type_id && typeof staff_type_id === 'string' && staff_type_id !== 'all' && staff_type_id !== 'undefined') {
      where.staff_type_id = staff_type_id;
    }

    if (search && typeof search === 'string' && search.trim() !== '' && search !== 'undefined') {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { staff_id: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const staffMembers = await prisma.staffMember.findMany({
      where,
      include: {
        staffType: true,
        salaryStructure: true,
        salaryAdjustments: {
          where: { month_period: month_period as string }
        },
        salaryDisbursements: {
          where: { month_period: month_period as string },
          orderBy: { disbursed_at: 'desc' }
        }
      },
      orderBy: { staff_id: 'asc' }
    });

    // Query attendance records for the month period
    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const attendanceMap = new Map<string, any[]>();
    for (const r of attendanceRecords) {
      if (!attendanceMap.has(r.staff_member_id)) {
        attendanceMap.set(r.staff_member_id, []);
      }
      attendanceMap.get(r.staff_member_id)!.push(r);
    }

    // Query processed salary records for this month
    const processedPayments = await prisma.staffSalaryPayment.findMany({
      where: { month_period }
    });
    const paymentMap = new Map(processedPayments.map(p => [p.staff_member_id, p]));

    const rows = staffMembers.map((staff) => {
      const baseSalary = staff.salaryStructure?.base_salary || staff.base_salary || 0;
      const adjustments = staff.salaryAdjustments || [];

      let totalDeductions = 0;
      let totalEarnings = 0;

      for (const adj of adjustments) {
        if (adj.type === 'deduction') {
          totalDeductions += adj.total_amount;
        } else if (adj.type === 'earning') {
          totalEarnings += adj.total_amount;
        }
      }

      const grossSalary = baseSalary + totalEarnings;
      const computedNet = Math.max(0, grossSalary - totalDeductions);

      const disbursements = staff.salaryDisbursements || [];
      const totalPaidDisbursed = disbursements.reduce((acc, d) => acc + d.amount, 0);

      const attList = attendanceMap.get(staff.id) || [];
      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let halfDays = 0;
      let leaveDays = 0;

      for (const att of attList) {
        const s = (att.status || '').toLowerCase();
        if (s === 'present') presentDays++;
        else if (s === 'absent') absentDays++;
        else if (s === 'late') lateDays++;
        else if (s === 'half_day' || s === 'half-day') halfDays++;
        else if (s === 'excused' || s === 'on_leave' || s === 'leave') leaveDays++;
      }

      const processed = paymentMap.get(staff.id);
      const isProcessed = Boolean(processed);

      if (isProcessed && processed) {
        const net = processed.net_payable ?? processed.amount ?? computedNet;
        const isPaid = processed.status === 'paid';
        let parsedEarnings: any[] = [];
        let parsedDeductions: any[] = [];
        try { parsedEarnings = JSON.parse(processed.custom_earnings_json || '[]'); } catch (e) {}
        try { parsedDeductions = JSON.parse(processed.custom_deductions_json || '[]'); } catch (e) {}

        return {
          staff_id: staff.staff_id,
          staff_member_id: staff.id,
          full_name: staff.full_name,
          designation: staff.designation,
          staff_type: staff.staffType?.name || 'Staff',
          month_period,
          base_salary: processed.base_pay ?? baseSalary,
          gross_salary: (processed.base_pay ?? baseSalary) + (processed.allowances || 0),
          adjustments,
          total_deductions: processed.deductions || 0,
          total_earnings: processed.allowances || 0,
          net_payable: net,
          total_paid: isPaid ? net : 0,
          total_pending: isPaid ? 0 : net,
          payment_status: (isPaid ? 'Paid' : 'Pending') as 'Paid' | 'Pending',
          is_processed: true,
          processed_record_id: processed.id,
          is_published: Boolean(processed.is_published),
          payment_method: processed.payment_method || 'cash',
          reference_no: processed.reference_no || '',
          notes: processed.notes || '',
          custom_earnings: parsedEarnings,
          custom_deductions: parsedDeductions,
          disbursements,
          attendance: {
            days_present: processed.present_days ?? presentDays,
            days_absent: processed.absent_days ?? absentDays,
            days_late: processed.late_days ?? lateDays,
            days_half_day: processed.half_days ?? halfDays,
            days_leave: processed.excused_leaves ?? leaveDays,
            total_working_days: daysInMonth
          }
        };
      }

      const totalPending = Math.max(0, computedNet - totalPaidDisbursed);
      let paymentStatus: 'Paid' | 'Partial' | 'Unprocessed' = 'Unprocessed';
      if (totalPaidDisbursed >= computedNet && computedNet > 0) {
        paymentStatus = 'Paid';
      } else if (totalPaidDisbursed > 0) {
        paymentStatus = 'Partial';
      }

      return {
        staff_id: staff.staff_id,
        staff_member_id: staff.id,
        full_name: staff.full_name,
        designation: staff.designation,
        staff_type: staff.staffType?.name || 'Staff',
        month_period,
        base_salary: baseSalary,
        gross_salary: grossSalary,
        adjustments,
        total_deductions: totalDeductions,
        total_earnings: totalEarnings,
        net_payable: computedNet,
        total_paid: totalPaidDisbursed,
        total_pending: totalPending,
        payment_status: paymentStatus,
        is_processed: false,
        processed_record_id: null,
        is_published: false,
        payment_method: 'cash',
        reference_no: '',
        notes: '',
        custom_earnings: [],
        custom_deductions: [],
        disbursements,
        attendance: {
          days_present: presentDays,
          days_absent: absentDays,
          days_late: lateDays,
          days_half_day: halfDays,
          days_leave: leaveDays,
          total_working_days: daysInMonth
        }
      };
    });

    return sendSuccess(res, {
      month_period,
      total_staff: rows.length,
      total_net_payable: rows.reduce((acc, r) => acc + r.net_payable, 0),
      total_disbursed: rows.reduce((acc, r) => acc + r.total_paid, 0),
      total_pending: rows.reduce((acc, r) => acc + r.total_pending, 0),
      rows
    });
  } catch (err: any) {
    console.error('Error loading live staff payroll register:', err);
    return sendError(res, err.message || 'Failed to load live staff payroll register', 500);
  }
}

/**
 * Direct Individual Staff Payroll Processing (0-Batch Barrier)
 * Saves/updates StaffSalaryPayment and synchronizes with Institutional Expenses.
 */
export async function processIndividualPayrollController(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      staff_member_id,
      month_period,
      base_pay,
      earnings = [],
      deductions = [],
      net_payable,
      payment_status = 'paid', // 'paid' | 'pending'
      payment_method = 'cash',
      reference_no = '',
      notes = '',
      is_published = false,
      attendance = {}
    } = req.body;

    if (!staff_member_id || !month_period) {
      return sendError(res, 'staff_member_id and month_period are required', 400);
    }

    const staff = await prisma.staffMember.findUnique({
      where: { id: staff_member_id }
    });
    if (!staff) return sendError(res, 'Staff member not found', 404);

    const totalEarnings = earnings.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const totalDeductions = deductions.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const calculatedNet = net_payable ?? Math.max(0, Number(base_pay || 0) + totalEarnings - totalDeductions);

    const existingPayment = await prisma.staffSalaryPayment.findFirst({
      where: { staff_member_id, month_period }
    });

    let payment;
    const payslipNum = existingPayment?.payslip_number || `SLIP-${month_period}-${staff.staff_id}`;

    if (existingPayment) {
      payment = await prisma.staffSalaryPayment.update({
        where: { id: existingPayment.id },
        data: {
          base_pay: Number(base_pay || 0),
          allowances: totalEarnings,
          deductions: totalDeductions,
          net_payable: calculatedNet,
          amount: payment_status === 'paid' ? calculatedNet : 0,
          payment_method,
          reference_no: reference_no ? reference_no.trim() : undefined,
          notes: notes ? notes.trim() : undefined,
          status: payment_status,
          is_published: Boolean(is_published),
          custom_earnings_json: JSON.stringify(earnings),
          custom_deductions_json: JSON.stringify(deductions),
          present_days: attendance.days_present ?? existingPayment.present_days,
          absent_days: attendance.days_absent ?? existingPayment.absent_days,
          late_days: attendance.days_late ?? existingPayment.late_days,
          half_days: attendance.days_half_day ?? existingPayment.half_days,
          excused_leaves: attendance.days_leave ?? existingPayment.excused_leaves,
          payment_date: new Date()
        }
      });
    } else {
      payment = await prisma.staffSalaryPayment.create({
        data: {
          staff_member_id,
          month_period,
          payslip_number: payslipNum,
          base_pay: Number(base_pay || 0),
          allowances: totalEarnings,
          deductions: totalDeductions,
          net_payable: calculatedNet,
          amount: payment_status === 'paid' ? calculatedNet : 0,
          payment_method,
          reference_no: reference_no ? reference_no.trim() : undefined,
          notes: notes ? notes.trim() : undefined,
          status: payment_status,
          is_published: Boolean(is_published),
          custom_earnings_json: JSON.stringify(earnings),
          custom_deductions_json: JSON.stringify(deductions),
          present_days: attendance.days_present ?? 0,
          absent_days: attendance.days_absent ?? 0,
          late_days: attendance.days_late ?? 0,
          half_days: attendance.days_half_day ?? 0,
          excused_leaves: attendance.days_leave ?? 0,
          payment_date: new Date()
        }
      });
    }

    // Synchronize to Expenses under category 'Salaries'
    if (payment_status === 'paid') {
      const existingExpense = await prisma.expense.findFirst({
        where: { staff_member_id, month_period, category: 'Salaries' }
      });
      if (existingExpense) {
        await prisma.expense.update({
          where: { id: existingExpense.id },
          data: {
            title: `Salary - ${staff.full_name} (${month_period})`,
            amount: calculatedNet,
            payment_method,
            reference_number: reference_no || undefined,
            payee_name: staff.full_name,
            notes: notes || `Processed salary for ${month_period}`
          }
        });
      } else {
        await prisma.expense.create({
          data: {
            category: 'Salaries',
            title: `Salary - ${staff.full_name} (${month_period})`,
            amount: calculatedNet,
            expense_date: new Date(),
            payment_method,
            reference_number: reference_no || undefined,
            payee_name: staff.full_name,
            month_period,
            staff_member_id,
            notes: notes || `Processed salary for ${month_period}`
          }
        });
      }
    } else {
      // If pending, remove any previous expense
      await prisma.expense.deleteMany({
        where: { staff_member_id, month_period, category: 'Salaries' }
      });
    }

    return sendSuccess(res, payment);
  } catch (err: any) {
    console.error('Error processing staff payroll:', err);
    return sendError(res, err.message || 'Failed to process staff payroll', 500);
  }
}

/**
 * Undo Individual Staff Payroll (reverts to unprocessed state)
 */
export async function undoIndividualPayrollController(req: AuthenticatedRequest, res: Response) {
  try {
    const { staff_member_id, month_period } = req.body;
    if (!staff_member_id || !month_period) {
      return sendError(res, 'staff_member_id and month_period are required', 400);
    }

    await prisma.staffSalaryPayment.deleteMany({
      where: { staff_member_id, month_period }
    });

    await prisma.expense.deleteMany({
      where: { staff_member_id, month_period, category: 'Salaries' }
    });

    return sendSuccess(res, { undone: true, staff_member_id, month_period });
  } catch (err: any) {
    console.error('Error undoing staff payroll:', err);
    return sendError(res, err.message || 'Failed to undo staff payroll', 500);
  }
}

/**
 * Bulk or Individual Publish of Processed Salaries to Staff Portal
 */
export async function publishPayrollToPortalController(req: AuthenticatedRequest, res: Response) {
  try {
    const { month_period, staff_member_id, is_published = true } = req.body;
    if (!month_period) {
      return sendError(res, 'month_period is required', 400);
    }

    const whereClause: any = { month_period };
    if (staff_member_id) {
      whereClause.staff_member_id = staff_member_id;
    }

    const updated = await prisma.staffSalaryPayment.updateMany({
      where: whereClause,
      data: { is_published: Boolean(is_published) }
    });

    return sendSuccess(res, {
      updated_count: updated.count,
      month_period,
      staff_member_id: staff_member_id || 'all',
      is_published: Boolean(is_published)
    });
  } catch (err: any) {
    console.error('Error publishing payroll to portal:', err);
    return sendError(res, err.message || 'Failed to publish payroll to portal', 500);
  }
}
