import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import { resolveSafeUserId } from '../utils/userResolver';

/**
 * POST /api/v1/payroll/disbursements
 * Disburse a salary installment (partial or full) and auto-create an Expense record under "Salaries"
 */
export async function createSalaryDisbursementController(req: AuthenticatedRequest, res: Response) {
  try {
    const { staff_member_id, month_period, amount, payment_method, reference_number, notes } = req.body;

    if (!staff_member_id || !month_period || amount === undefined || amount === null) {
      return sendError(res, 'staff_member_id, month_period, and amount are required', 400);
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, 'Disbursement amount must be a positive number', 400);
    }

    const staff = await prisma.staffMember.findUnique({
      where: { id: staff_member_id }
    });

    if (!staff) {
      return sendError(res, 'Staff member not found', 404);
    }

    const paymentMethod = payment_method || 'cash';
    const now = new Date();

    // Use transaction to ensure both disbursement and linked expense are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create linked Expense in Expenses ledger under "Salaries"
      const expense = await tx.expense.create({
        data: {
          category: 'Salaries',
          title: `Salary Disbursement - ${staff.full_name} (${month_period})`,
          amount: parsedAmount,
          expense_date: now,
          payment_method: paymentMethod,
          reference_number: reference_number ? String(reference_number).trim() : null,
          payee_name: staff.full_name,
          staff_member_id: staff.id,
          month_period: month_period,
          notes: notes ? String(notes).trim() : `Salary installment for ${month_period}`
        }
      });

      // 2. Create StaffSalaryDisbursement record
      const disbursement = await tx.staffSalaryDisbursement.create({
        data: {
          staff_member_id: staff.id,
          month_period: month_period,
          amount: parsedAmount,
          payment_method: paymentMethod,
          disbursed_at: now,
          reference_number: reference_number ? String(reference_number).trim() : null,
          notes: notes ? String(notes).trim() : null,
          expense_id: expense.id
        }
      });

      return { disbursement, expense };
    });

    const actorId = await resolveSafeUserId(req.user?.userId);
    if (actorId) {
      await createAuditLog(
        actorId,
        'DISBURSE_SALARY',
        'StaffSalaryDisbursement',
        result.disbursement.id,
        {
          staff_id: staff.staff_id,
          staff_name: staff.full_name,
          month_period,
          amount: parsedAmount,
          expense_id: result.expense.id
        }
      );
    }

    return sendSuccess(res, result, 201);
  } catch (err: any) {
    console.error('Error creating salary disbursement:', err);
    return sendError(res, err.message || 'Failed to record salary disbursement', 500);
  }
}

/**
 * GET /api/v1/payroll/disbursements/:staffId/:monthPeriod
 * Retrieve installment history for a staff member for a specific month period
 */
export async function getStaffDisbursementsController(req: AuthenticatedRequest, res: Response) {
  try {
    const { staffId, monthPeriod } = req.params;

    const disbursements = await prisma.staffSalaryDisbursement.findMany({
      where: {
        staff_member_id: staffId,
        month_period: monthPeriod
      },
      orderBy: { disbursed_at: 'desc' },
      include: {
        expense: {
          select: {
            id: true,
            title: true,
            amount: true,
            category: true,
            payment_method: true
          }
        }
      }
    });

    return sendSuccess(res, disbursements);
  } catch (err: any) {
    console.error('Error fetching staff disbursements:', err);
    return sendError(res, err.message || 'Failed to fetch staff disbursements', 500);
  }
}

/**
 * DELETE /api/v1/payroll/disbursements/:id
 * Void or delete a disbursement and automatically delete the linked expense record
 */
export async function deleteSalaryDisbursementController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const disbursement = await prisma.staffSalaryDisbursement.findUnique({
      where: { id }
    });

    if (!disbursement) {
      return sendError(res, 'Disbursement record not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      if (disbursement.expense_id) {
        await tx.expense.delete({
          where: { id: disbursement.expense_id }
        }).catch(() => null); // If already deleted or not found, proceed safely
      }

      await tx.staffSalaryDisbursement.delete({
        where: { id }
      });
    });

    const actorId = await resolveSafeUserId(req.user?.userId);
    if (actorId) {
      await createAuditLog(
        actorId,
        'VOID_SALARY_DISBURSEMENT',
        'StaffSalaryDisbursement',
        id,
        {
          amount: disbursement.amount,
          month_period: disbursement.month_period
        }
      );
    }

    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    console.error('Error voiding salary disbursement:', err);
    return sendError(res, err.message || 'Failed to void salary disbursement', 500);
  }
}
