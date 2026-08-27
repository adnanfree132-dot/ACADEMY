import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import { staffSalaryStructureUpsertSchema } from '../validations/payrollValidation';
import { roundCurrency } from '../utils/payrollCalculator';

/**
 * 1. List all staff salary structures.
 */
export async function getSalaryStructures(req: AuthenticatedRequest, res: Response) {
  try {
    const structures = await prisma.staffSalaryStructure.findMany({
      include: {
        staffMember: {
          include: {
            staffType: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const activeStaff = await prisma.staffMember.findMany({
      where: { status: 'active' },
      include: { staffType: true, salaryStructure: true }
    });

    const structureMap = new Map<string, any>();
    for (const s of structures) {
      structureMap.set(s.staff_member_id, s);
    }

    const completeList = activeStaff.map(staff => {
      if (structureMap.has(staff.id)) {
        return structureMap.get(staff.id);
      }
      const baseSalary = staff.base_salary || 0;
      return {
        id: 'synth-' + staff.id,
        staff_member_id: staff.id,
        staffMember: staff,
        base_salary: baseSalary,
        house_rent_allowance: 0,
        medical_allowance: 0,
        conveyance_allowance: 0,
        special_allowance: 0,
        gross_salary: baseSalary,
        tax_deduction: 0,
        provident_fund: 0,
        other_deductions: 0,
        total_deductions: 0,
        net_salary: baseSalary,
        payment_frequency: 'monthly',
        effective_from: null,
        bank_name: staff.bank_name || null,
        account_number: staff.account_number || null,
        account_title: staff.account_title || null,
        is_active: true,
        created_at: staff.created_at,
        updated_at: staff.updated_at
      };
    });

    return sendSuccess(res, completeList);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 2. Get salary structure for a specific staff member.
 */
export async function getSalaryStructureByStaffId(req: AuthenticatedRequest, res: Response) {
  try {
    const staffIdParam = req.params.staffId || req.params.id;
    if (!staffIdParam) {
      return sendError(res, 'Staff ID is required', 400);
    }

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id: staffIdParam },
          { staff_id: { equals: staffIdParam, mode: 'insensitive' } }
        ]
      },
      include: {
        staffType: true,
        salaryStructure: true
      }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const user = req.user;
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      if (user.userId !== staff.id && user.staffId !== staff.staff_id && user.userId !== staff.user_id) {
        return sendError(res, 'Forbidden: You cannot access salary structures of other staff members.', 403);
      }
    }

    if (staff.salaryStructure) {
      return sendSuccess(res, {
        ...staff.salaryStructure,
        staffMember: staff
      });
    }

    const baseSalary = staff.base_salary || 0;
    const defaultStructure = {
      id: 'synth-' + staff.id,
      staff_member_id: staff.id,
      staffMember: staff,
      base_salary: baseSalary,
      house_rent_allowance: 0,
      medical_allowance: 0,
      conveyance_allowance: 0,
      special_allowance: 0,
      gross_salary: baseSalary,
      tax_deduction: 0,
      provident_fund: 0,
      other_deductions: 0,
      total_deductions: 0,
      net_salary: baseSalary,
      payment_frequency: 'monthly',
      effective_from: null,
      bank_name: staff.bank_name || null,
      account_number: staff.account_number || null,
      account_title: staff.account_title || null,
      is_active: true,
      created_at: staff.created_at,
      updated_at: staff.updated_at
    };

    return sendSuccess(res, defaultStructure);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}

/**
 * 3. Create or update itemized salary structure for a staff member.
 */
export async function upsertSalaryStructure(req: AuthenticatedRequest, res: Response) {
  try {
    const staffIdParam = req.params.staffId || req.params.id || req.body.staff_member_id || req.body.staffMemberId;
    if (!staffIdParam) {
      return sendError(res, 'staff_member_id is required', 400);
    }

    const staff = await prisma.staffMember.findFirst({
      where: {
        OR: [
          { id: staffIdParam },
          { staff_id: { equals: staffIdParam, mode: 'insensitive' } }
        ]
      }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const validationResult = staffSalaryStructureUpsertSchema.safeParse({
      ...req.body,
      staff_member_id: staff.id
    });

    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const val = validationResult.data;

    const baseSalary = roundCurrency(val.baseSalary);
    const hra = roundCurrency(val.houseRentAllowance);
    const med = roundCurrency(val.medicalAllowance);
    const conv = roundCurrency(val.conveyanceAllowance);
    const spec = roundCurrency(val.specialAllowance);

    const tax = roundCurrency(val.taxDeduction);
    const pf = roundCurrency(val.providentFund);
    const other = roundCurrency(val.otherDeductions);

    const grossSalary = roundCurrency(baseSalary + hra + med + conv + spec);
    const totalDeductions = roundCurrency(tax + pf + other);
    const netSalary = Math.max(0, roundCurrency(grossSalary - totalDeductions));

    const upserted = await prisma.staffSalaryStructure.upsert({
      where: { staff_member_id: staff.id },
      create: {
        staff_member_id: staff.id,
        base_salary: baseSalary,
        house_rent_allowance: hra,
        medical_allowance: med,
        conveyance_allowance: conv,
        special_allowance: spec,
        gross_salary: grossSalary,
        tax_deduction: tax,
        provident_fund: pf,
        other_deductions: other,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        payment_frequency: val.paymentFrequency,
        effective_from: val.effectiveFrom,
        bank_name: val.bankName || staff.bank_name || null,
        account_number: val.accountNumber || staff.account_number || null,
        account_title: val.accountTitle || staff.account_title || null,
        is_active: val.isActive
      },
      update: {
        base_salary: baseSalary,
        house_rent_allowance: hra,
        medical_allowance: med,
        conveyance_allowance: conv,
        special_allowance: spec,
        gross_salary: grossSalary,
        tax_deduction: tax,
        provident_fund: pf,
        other_deductions: other,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        payment_frequency: val.paymentFrequency,
        effective_from: val.effectiveFrom,
        bank_name: val.bankName !== undefined ? val.bankName : staff.bank_name,
        account_number: val.accountNumber !== undefined ? val.accountNumber : staff.account_number,
        account_title: val.accountTitle !== undefined ? val.accountTitle : staff.account_title,
        is_active: val.isActive
      },
      include: {
        staffMember: {
          include: { staffType: true }
        }
      }
    });

    await prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        base_salary: baseSalary,
        ...(val.bankName !== undefined && { bank_name: val.bankName }),
        ...(val.accountNumber !== undefined && { account_number: val.accountNumber }),
        ...(val.accountTitle !== undefined && { account_title: val.accountTitle })
      }
    });

    if (req.user?.userId) {
      await createAuditLog(
        req.user.userId,
        'UPSERT_SALARY_STRUCTURE',
        'StaffSalaryStructure',
        upserted.id,
        {
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          base_salary: baseSalary,
          gross_salary: grossSalary,
          net_salary: netSalary
        }
      );
    }

    return sendSuccess(res, upserted, undefined, 200);
  } catch (err: any) {
    return sendError(res, err, 500);
  }
}