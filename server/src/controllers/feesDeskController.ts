import { Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../common/envelope';
import { createAuditLog } from '../common/audit';
import { AuthenticatedRequest } from '../auth';
import { formatDateIso } from '../utils/billingUtils';

function isCountable(p: { voided_at?: Date | null; cleared_status?: string | null }) {
  return !p.voided_at && (p.cleared_status || 'cleared') === 'cleared';
}

export async function getDayEnd(req: AuthenticatedRequest, res: Response) {
  try {
    const date = String(req.query.date || formatDateIso(new Date()));
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    const payments = await prisma.feePayment.findMany({
      where: { paid_at: { gte: start, lte: end } },
      include: { student: true },
      orderBy: { paid_at: 'desc' }
    });
    const live = payments.filter(isCountable);
    const byMethod: Record<string, number> = {};
    live.forEach(p => {
      const key = (p.method || 'cash').toLowerCase();
      byMethod[key] = (byMethod[key] || 0) + p.amount;
    });
    return sendSuccess(res, {
      date,
      receiptCount: live.length,
      voidedCount: payments.filter(p => p.voided_at).length,
      pendingChequeCount: payments.filter(p => p.cleared_status === 'pending').length,
      total: live.reduce((s, p) => s + p.amount, 0),
      byMethod,
      receipts: live
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function voidPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) return sendError(res, 'A reason is required to void a receipt.', 400);
    const payment = await prisma.feePayment.findUnique({ where: { id: req.params.id } });
    if (!payment) return sendError(res, 'Payment not found.', 404);
    if (payment.voided_at) return sendError(res, 'This receipt is already voided.', 409);

    const updated = await prisma.feePayment.update({
      where: { id: payment.id },
      data: { voided_at: new Date(), void_reason: reason, cleared_status: 'bounced' }
    });

    if (payment.invoice_id) {
      await refreshInvoiceStatus(payment.invoice_id);
    }
    if (req.user) await createAuditLog(req.user.userId, 'VOID_FEE_PAYMENT', 'FeePayment', payment.id, { reason, amount: payment.amount });
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function setChequeStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const status = String(req.body.status || '');
    if (!['cleared', 'bounced'].includes(status)) {
      return sendError(res, 'status must be cleared or bounced.', 400);
    }
    const payment = await prisma.feePayment.findUnique({ where: { id: req.params.id } });
    if (!payment) return sendError(res, 'Payment not found.', 404);
    if (payment.voided_at) return sendError(res, 'Voided receipts cannot be cleared.', 409);

    const updated = await prisma.feePayment.update({
      where: { id: payment.id },
      data: { cleared_status: status }
    });
    if (payment.invoice_id) await refreshInvoiceStatus(payment.invoice_id);
    if (req.user) await createAuditLog(req.user.userId, 'CHEQUE_STATUS', 'FeePayment', payment.id, { status });
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function refreshInvoiceStatus(invoiceId: string) {
  const inv = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: { feePayments: true, installmentSchedule: true }
  });
  if (!inv) return;
  const paid = inv.feePayments.filter(isCountable).reduce((s, p) => s + p.amount, 0);
  const today = formatDateIso(new Date());
  let status = 'unpaid';
  if (paid >= inv.net_amount) status = 'paid';
  else if (paid > 0) status = 'partial';
  else if (inv.due_date < today) status = 'overdue';
  await prisma.feeInvoice.update({ where: { id: invoiceId }, data: { status } });
  if (inv.installmentSchedule) {
    await prisma.studentInstallmentSchedule.update({
      where: { id: inv.installmentSchedule.id },
      data: { status: status === 'paid' ? 'paid' : 'invoiced' }
    });
  }
}
