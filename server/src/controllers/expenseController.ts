import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { AuthenticatedRequest } from '../auth';
import { createAuditLog } from '../common/audit';
import { resolveSafeUserId } from '../utils/userResolver';

/**
 * GET /api/v1/expenses
 * Retrieve list of academy expenditures with optional filters
 */
export async function getExpensesController(req: AuthenticatedRequest, res: Response) {
  try {
    const { month_period, category, search, start_date, end_date } = req.query;

    const where: any = {};

    if (month_period && typeof month_period === 'string' && month_period !== 'all') {
      where.month_period = month_period;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      where.category = category;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { payee_name: { contains: search, mode: 'insensitive' } },
        { reference_number: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (start_date && end_date) {
      where.expense_date = {
        gte: new Date(String(start_date)),
        lte: new Date(String(end_date) + 'T23:59:59.999Z')
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expense_date: 'desc' },
      include: {
        staffMember: {
          select: {
            id: true,
            staff_id: true,
            full_name: true,
            designation: true
          }
        }
      }
    });

    return sendSuccess(res, expenses);
  } catch (err: any) {
    console.error('Error fetching expenses:', err);
    return sendError(res, err.message || 'Failed to fetch expenses', 500);
  }
}

/**
 * GET /api/v1/expenses/summary
 * Retrieve expenditure totals, salary outflow vs operational outflow, and category breakdowns
 */
export async function getExpenseSummaryController(req: AuthenticatedRequest, res: Response) {
  try {
    const { month_period } = req.query;

    const where: any = {};
    if (month_period && typeof month_period === 'string' && month_period !== 'all') {
      where.month_period = month_period;
    }

    const expenses = await prisma.expense.findMany({
      where
    });

    let total_expenses = 0;
    let salaries_total = 0;
    let operational_total = 0;
    const category_breakdown: Record<string, number> = {
      Salaries: 0,
      Utilities: 0,
      Rent: 0,
      Maintenance: 0,
      Supplies: 0,
      Miscellaneous: 0
    };

    for (const exp of expenses) {
      total_expenses += exp.amount;
      if (exp.category === 'Salaries') {
        salaries_total += exp.amount;
      } else {
        operational_total += exp.amount;
      }

      if (!category_breakdown[exp.category]) {
        category_breakdown[exp.category] = 0;
      }
      category_breakdown[exp.category] += exp.amount;
    }

    return sendSuccess(res, {
      total_expenses,
      salaries_total,
      operational_total,
      category_breakdown
    });
  } catch (err: any) {
    console.error('Error calculating expense summary:', err);
    return sendError(res, err.message || 'Failed to calculate expense summary', 500);
  }
}

/**
 * POST /api/v1/expenses
 * Record a new operational or manual expense
 */
export async function createExpenseController(req: AuthenticatedRequest, res: Response) {
  try {
    const { category, title, amount, expense_date, payment_method, reference_number, payee_name, month_period, notes } = req.body;

    if (!category || !title || amount === undefined || amount === null) {
      return sendError(res, 'Category, title, and amount are required', 400);
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const expenseDate = expense_date ? new Date(expense_date) : new Date();
    const derivedMonthPeriod = month_period || `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;

    const expense = await prisma.expense.create({
      data: {
        category,
        title: title.trim(),
        amount: parsedAmount,
        expense_date: expenseDate,
        payment_method: payment_method || 'cash',
        reference_number: reference_number ? String(reference_number).trim() : null,
        payee_name: payee_name ? String(payee_name).trim() : null,
        month_period: derivedMonthPeriod,
        notes: notes ? String(notes).trim() : null
      }
    });

    const actorId = await resolveSafeUserId(req.user?.userId);
    if (actorId) {
      await createAuditLog(
        actorId,
        'CREATE_EXPENSE',
        'Expense',
        expense.id,
        { category, title, amount: parsedAmount }
      );
    }

    return sendSuccess(res, expense, 201);
  } catch (err: any) {
    console.error('Error creating expense:', err);
    return sendError(res, err.message || 'Failed to create expense', 500);
  }
}

/**
 * PUT /api/v1/expenses/:id
 * Update an existing manual expense
 */
export async function updateExpenseController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { category, title, amount, expense_date, payment_method, reference_number, payee_name, month_period, notes } = req.body;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Expense record not found', 404);
    }

    const updateData: any = {};
    if (category) updateData.category = category;
    if (title) updateData.title = title.trim();
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return sendError(res, 'Amount must be a positive number', 400);
      }
      updateData.amount = parsedAmount;
    }
    if (expense_date) updateData.expense_date = new Date(expense_date);
    if (payment_method) updateData.payment_method = payment_method;
    if (reference_number !== undefined) updateData.reference_number = reference_number ? String(reference_number).trim() : null;
    if (payee_name !== undefined) updateData.payee_name = payee_name ? String(payee_name).trim() : null;
    if (month_period) updateData.month_period = month_period;
    if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData
    });

    const actorId = await resolveSafeUserId(req.user?.userId);
    if (actorId) {
      await createAuditLog(
        actorId,
        'UPDATE_EXPENSE',
        'Expense',
        updated.id,
        updateData
      );
    }

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error('Error updating expense:', err);
    return sendError(res, err.message || 'Failed to update expense', 500);
  }
}

/**
 * DELETE /api/v1/expenses/:id
 * Delete an expense record
 */
export async function deleteExpenseController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Expense record not found', 404);
    }

    await prisma.expense.delete({ where: { id } });

    const actorId = await resolveSafeUserId(req.user?.userId);
    if (actorId) {
      await createAuditLog(
        actorId,
        'DELETE_EXPENSE',
        'Expense',
        id,
        { title: existing.title, amount: existing.amount }
      );
    }

    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    return sendError(res, err.message || 'Failed to delete expense', 500);
  }
}
