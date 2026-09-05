import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendSuccess, sendError } from './common/envelope';
import {
  authenticateJwt,
  generateToken,
  AuthenticatedRequest,
  handleLogin,
  handleDemoLogin,
  handleChangePassword
} from './auth';
import { requireModulePermission, requireAdmin } from './middleware/rbacMiddleware';
import { createAuditLog } from './common/audit';
import {
  getStaffTypes,
  getStaffTypeById,
  createStaffType,
  updateStaffType,
  deleteStaffType
} from './controllers/staffTypeController';
import {
  getStaffList,
  registerStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
  getStaffPermissions,
  updateStaffPermissions,
  bulkUpdateStaffStatus,
  bulkReassignStaffType,
  exportStaffCsv,
  getStaffDocuments,
  uploadStaffDocument,
  deleteStaffDocument,
  updateStaffSalary,
  getStaffSalaryPayments,
  recordStaffSalaryPayment,
  checkInStaffAttendance,
  checkOutStaffAttendance,
  getStaffAttendance,
  bulkStaffAttendance,
  submitStaffLeave,
  getStaffLeaves,
  getStaffLeaveById,
  decideStaffLeave,
  getStaffDashboard
} from './controllers/staffController';
import {
  getGeofenceConfig,
  updateGeofenceConfig,
  testGeofenceLocation
} from './controllers/geofenceController';
import {
  staffCheckIn,
  staffCheckOut,
  getStaffAttendanceRoster,
  adminAttendanceOverride,
  bulkStaffAttendance as bulkStaffAttendanceController
} from './controllers/staffAttendanceController';
import {
  getSalaryStructures,
  getSalaryStructureByStaffId,
  upsertSalaryStructure
} from './controllers/staffSalaryStructureController';
import {
  generateMonthlyPayrollBatch,
  getPayrollBatches,
  getPayrollBatchById,
  disbursePayslip,
  getPayslipDetails,
  getSalaryAdjustmentsController,
  createSalaryAdjustmentController,
  updateSalaryAdjustmentController,
  deleteSalaryAdjustmentController,
  getSalaryHeadsController,
  createSalaryHeadController,
  updateSalaryHeadController,
  deleteSalaryHeadController,
  getPayrollTagsController,
  createPayrollTagController,
  updatePayrollTagController,
  deletePayrollTagController,
  getLiveStaffPayrollRegisterController,
  processIndividualPayrollController,
  undoIndividualPayrollController,
  publishPayrollToPortalController
} from './controllers/payrollBatchController';
import {
  getExpensesController,
  getExpenseSummaryController,
  createExpenseController,
  updateExpenseController,
  deleteExpenseController
} from './controllers/expenseController';
import {
  createSalaryDisbursementController,
  getStaffDisbursementsController,
  deleteSalaryDisbursementController
} from './controllers/salaryDisbursementController';
import {
  calculateProRataFee,
  calculateCyclePeriod,
  calculateNetFee,
  calculateInstallmentSchedule,
  calculateLateEnrollment,
  formatDateIso,
  parseDateIso
} from './utils/billingUtils';

import { prisma } from './prisma';
import { timeRangesOverlap, timeToMinutes } from './utils/timeOverlap';
import { getNextSequenceValue } from './utils/sequenceGenerator';
import {
  getSubjectCatalog,
  deleteSubjectSafe,
  archiveBatch,
  getBatchWaitlist,
  addBatchWaitlist,
  promoteWaitlist,
  removeWaitlist,
  listSubstitutes,
  createSubstitute,
  copyTimetableDay
} from './controllers/academicController';
import { getDayEnd, voidPayment, setChequeStatus } from './controllers/feesDeskController';
import { listInquiries, createInquiry, updateInquiry, addInquiryFollowUp, findDuplicatePhones } from './controllers/crmController';
import {
  getDashboard,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listWhatsAppTemplates,
  upsertWhatsAppTemplate,
  listWhatsAppLogs,
  sendWhatsApp,
  previewWhatsApp,
  dispatchAbsenceAlerts,
  dispatchFeeReminders
} from './controllers/opsController';
import {
  listHomework,
  getHomeworkRoster,
  saveHomeworkRoster,
  getTestRoster,
  saveTestMarksGuarded,
  decideLeave,
  createStudyMaterial,
  deleteStudyMaterial
} from './controllers/academicsWorkController';
import { listConductDesk } from './controllers/conductDeskController';

const router = Router();

/* ==========================================================================
   1. AUTH MODULE (M1 AUTH & M2 SMART AUTH)
   ========================================================================== */
router.post('/auth/login', handleLogin);
router.post('/auth/demo-login', handleDemoLogin);
router.post('/auth/change-password', authenticateJwt, handleChangePassword);
router.post('/staff/me/change-password', authenticateJwt, handleChangePassword);

// Feature 008: Staff Types Endpoints
router.get('/staff-types', authenticateJwt, requireModulePermission('staff_types', 'view_only'), getStaffTypes);
router.get('/staff-types/:id', authenticateJwt, requireModulePermission('staff_types', 'view_only'), getStaffTypeById);
router.post('/staff-types', authenticateJwt, requireAdmin, createStaffType);
router.put('/staff-types/:id', authenticateJwt, requireAdmin, updateStaffType);
router.delete('/staff-types/:id', authenticateJwt, requireAdmin, deleteStaffType);

// Feature 008: Staff Directory & Management Endpoints
router.get('/staff/export-csv', authenticateJwt, requireModulePermission('teachers', 'view_only'), exportStaffCsv);
router.post('/staff/bulk-status', authenticateJwt, requireModulePermission('teachers', 'editable'), bulkUpdateStaffStatus);
router.post('/staff/bulk-reassign', authenticateJwt, requireModulePermission('teachers', 'editable'), bulkReassignStaffType);
router.get('/staff', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffList);
router.post('/staff', authenticateJwt, requireModulePermission('teachers', 'editable'), registerStaff);
router.get('/staff/:id', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffById);
router.put('/staff/:id', authenticateJwt, requireModulePermission('teachers', 'editable'), updateStaff);
router.delete('/staff/:id', authenticateJwt, requireModulePermission('teachers', 'editable'), deleteStaff);
router.post('/staff/:id/reset-password', authenticateJwt, requireModulePermission('teachers', 'editable'), resetStaffPassword);
router.get('/staff/:id/permissions', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffPermissions);
router.put('/staff/:id/permissions', authenticateJwt, requireModulePermission('teachers', 'editable'), updateStaffPermissions);
router.get('/staff/:id/documents', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffDocuments);
router.post('/staff/:id/documents', authenticateJwt, requireModulePermission('teachers', 'editable'), uploadStaffDocument);
router.delete('/staff/:id/documents/:docId', authenticateJwt, requireModulePermission('teachers', 'editable'), deleteStaffDocument);
router.delete('/staff-documents/:id', authenticateJwt, requireModulePermission('teachers', 'editable'), deleteStaffDocument);
router.put('/staff/:id/salary', authenticateJwt, requireModulePermission('teachers', 'editable'), updateStaffSalary);
router.get('/staff/:id/salary-payments', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffSalaryPayments);
router.post('/staff/:id/salary-payments', authenticateJwt, requireModulePermission('teachers', 'editable'), recordStaffSalaryPayment);

// Feature: Campus GPS Geofence Configuration & Location Testing
router.get('/settings/geofence', authenticateJwt, getGeofenceConfig);
router.put('/settings/geofence', authenticateJwt, requireModulePermission('settings', 'editable'), updateGeofenceConfig);
router.post('/settings/geofence/test', authenticateJwt, testGeofenceLocation);

// Feature: Staff GPS Attendance, Roster & Administrative Override
router.post('/staff-attendance/check-in', authenticateJwt, staffCheckIn);
router.post('/staff-attendance/check-out', authenticateJwt, staffCheckOut);
router.get('/staff-attendance/roster', authenticateJwt, requireModulePermission('attendance', 'view_only'), getStaffAttendanceRoster);
router.get('/staff-attendance', authenticateJwt, requireModulePermission('attendance', 'view_only'), getStaffAttendanceRoster);
router.post('/staff-attendance/override', authenticateJwt, requireAdmin, adminAttendanceOverride);
router.post('/staff-attendance/bulk', authenticateJwt, requireModulePermission('attendance', 'editable'), bulkStaffAttendanceController);
router.get('/staff-portal/dashboard', authenticateJwt, getStaffDashboard);
router.post('/staff-leaves', authenticateJwt, submitStaffLeave);
router.get('/staff-leaves', authenticateJwt, requireModulePermission('staff_portal', 'view_only'), getStaffLeaves);
router.get('/staff-leaves/:id', authenticateJwt, requireModulePermission('staff_portal', 'view_only'), getStaffLeaveById);
router.put('/staff-leaves/:id/decision', authenticateJwt, requireAdmin, decideStaffLeave);

// Feature: Staff Salary Structures (Itemized Packages)
router.get('/staff-salary-structures', authenticateJwt, requireModulePermission('teachers', 'view_only'), getSalaryStructures);
router.get('/staff-salary-structures/:staffId', authenticateJwt, getSalaryStructureByStaffId);
router.post('/staff-salary-structures', authenticateJwt, requireAdmin, upsertSalaryStructure);
router.put('/staff-salary-structures/:staffId', authenticateJwt, requireAdmin, upsertSalaryStructure);
router.post('/staff-salary-structures/:staffId', authenticateJwt, requireAdmin, upsertSalaryStructure);

// Feature: 1-Click Monthly Batch Payroll & Payslips
router.post('/payroll/generate-batch', authenticateJwt, requireAdmin, generateMonthlyPayrollBatch);
router.get('/payroll/batches', authenticateJwt, requireModulePermission('teachers', 'view_only'), getPayrollBatches);
router.get('/payroll/batches/:batchId', authenticateJwt, requireModulePermission('teachers', 'view_only'), getPayrollBatchById);
router.put('/payroll/payslips/:id/disburse', authenticateJwt, requireAdmin, disbursePayslip);
router.get('/payroll/payslips/:id', authenticateJwt, getPayslipDetails);

// Feature: Simple Staff Salary Deductions & Earnings (Direct Multiplier Calculator)
router.get('/payroll/adjustments', authenticateJwt, requireModulePermission('teachers', 'view_only'), getSalaryAdjustmentsController);
router.post('/payroll/adjustments', authenticateJwt, requireAdmin, createSalaryAdjustmentController);
router.put('/payroll/adjustments/:id', authenticateJwt, requireAdmin, updateSalaryAdjustmentController);
// Feature: Simple Salary Heads Catalog (Deduction & Earning Types)
router.get('/payroll/heads', authenticateJwt, requireModulePermission('teachers', 'view_only'), getSalaryHeadsController);
router.post('/payroll/heads', authenticateJwt, requireAdmin, createSalaryHeadController);
router.put('/payroll/heads/:id', authenticateJwt, requireAdmin, updateSalaryHeadController);
router.delete('/payroll/heads/:id', authenticateJwt, requireAdmin, deleteSalaryHeadController);

// Feature: Payroll Component Tags (Universal WhatsApp-Style Variables)
router.get('/payroll/tags', authenticateJwt, requireModulePermission('teachers', 'view_only'), getPayrollTagsController);
router.post('/payroll/tags', authenticateJwt, requireAdmin, createPayrollTagController);
router.put('/payroll/tags/:id', authenticateJwt, requireAdmin, updatePayrollTagController);
router.delete('/payroll/tags/:id', authenticateJwt, requireAdmin, deletePayrollTagController);

// Feature: Live Staff Payroll Register (Zero Batch Barrier)
router.get('/payroll/live-register', authenticateJwt, requireModulePermission('teachers', 'view_only'), getLiveStaffPayrollRegisterController);
router.post('/payroll/process-individual', authenticateJwt, requireAdmin, processIndividualPayrollController);
router.post('/payroll/undo-individual', authenticateJwt, requireAdmin, undoIndividualPayrollController);
router.post('/payroll/publish-to-portal', authenticateJwt, requireAdmin, publishPayrollToPortalController);

// Feature: Multi-Tranche Staff Salary Disbursements & Installment Tracking
router.post('/payroll/disbursements', authenticateJwt, requireAdmin, createSalaryDisbursementController);
router.get('/payroll/disbursements/:staffId/:monthPeriod', authenticateJwt, requireModulePermission('teachers', 'view_only'), getStaffDisbursementsController);
router.delete('/payroll/disbursements/:id', authenticateJwt, requireAdmin, deleteSalaryDisbursementController);

// Feature: Academy Expense Management Module
router.get('/expenses', authenticateJwt, requireModulePermission('finance', 'view_only'), getExpensesController);
router.get('/expenses/summary', authenticateJwt, requireModulePermission('finance', 'view_only'), getExpenseSummaryController);
router.post('/expenses', authenticateJwt, requireAdmin, createExpenseController);
router.put('/expenses/:id', authenticateJwt, requireAdmin, updateExpenseController);
router.delete('/expenses/:id', authenticateJwt, requireAdmin, deleteExpenseController);


/* ==========================================================================
   2. DASHBOARD MODULE (M15 DASH)
   ========================================================================== */
router.get('/dashboard', authenticateJwt, requireModulePermission('analytics', 'view_only'), getDashboard);

/* ==========================================================================
   3. STUDENTS MODULE (M2 STU)
   ========================================================================== */
router.get('/students', authenticateJwt, requireModulePermission('students', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { q, status, classId } = req.query;

    // Faculty Scoping Check
    let teacherBatchIds: string[] | null = null;
    const isTeacherRole = req.user?.role === 'teacher' || req.user?.role === 'faculty';
    const isGlobal = (req as any).modulePermission?.isGlobalScope || req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (isTeacherRole && !isGlobal && req.user) {
      let teacherId = req.user.teacherId;
      if (!teacherId) {
        const staff = await prisma.staffMember.findFirst({
          where: {
            OR: [
              req.user.staffId ? { staff_id: { equals: req.user.staffId, mode: 'insensitive' as const } } : {},
              req.user.userId ? { user_id: req.user.userId } : {}
            ].filter((c) => Object.keys(c).length > 0)
          },
          select: { teacher_id: true }
        });
        teacherId = staff?.teacher_id || undefined;
      }
      if (!teacherId && req.user.userId) {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.userId } });
        teacherId = teacher?.id;
      }

      if (teacherId) {
        const batches = await prisma.batch.findMany({
          where: { teacher_id: teacherId, is_active: true },
          select: { id: true }
        });
        const batchSubjects = await prisma.batchSubject.findMany({
          where: { teacher_id: teacherId },
          select: { batch_id: true }
        });
        teacherBatchIds = Array.from(new Set([...batches.map((b) => b.id), ...batchSubjects.map((bs) => bs.batch_id)]));
      } else {
        teacherBatchIds = [];
      }
    }

    if (teacherBatchIds !== null && teacherBatchIds.length === 0) {
      return sendSuccess(res, []);
    }

    const students = await prisma.student.findMany({
      where: {
        status: status ? (status as string) : undefined,
        class_id: classId ? (classId as string) : undefined,
        ...(teacherBatchIds !== null
          ? {
              enrollments: {
                some: {
                  batch_id: { in: teacherBatchIds },
                  status: 'active'
                }
              }
            }
          : {}),
        OR: q
          ? [
              { full_name: { contains: q as string, mode: 'insensitive' as const } },
              { admission_no: { contains: q as string, mode: 'insensitive' as const } },
              { phone: { contains: q as string, mode: 'insensitive' as const } }
            ]
          : undefined
      },
      include: {
        class: true,
        feePlan: true,
        feeInvoices: {
          include: { feePayments: true }
        },
        enrollments: {
          include: {
            batch: true,
            installmentSchedules: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const todayStr = formatDateIso(new Date());

    const enriched = students.map((s) => {
      const totalInvoiced = s.feeInvoices.reduce((sum, inv) => sum + inv.net_amount, 0);
      const totalPaid = s.feeInvoices.reduce((sum, inv) => {
        const paid = inv.feePayments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paid;
      }, 0);
      const dueBalance = Math.max(0, totalInvoiced - totalPaid);

      return {
        ...s,
        parentName: (s.custom_fields as any)?.parentName || (s as any).parentStudents?.[0]?.parent?.full_name || '',
        baseMonthlyFee: s.feePlan?.monthly_amount || 0,
        scholarshipType: s.feePlan?.scholarship_type || 'none',
        scholarshipValue: s.feePlan?.scholarship_value || 0,
        scholarshipReason: s.feePlan?.scholarship_reason || null,
        billingAnchorDay: s.feePlan?.billing_anchor_day || 1,
        totalFee: s.feePlan?.monthly_amount || totalInvoiced,
        paidFee: totalPaid,
        dueBalance,
        isDefaulter:
          dueBalance > 0 &&
          s.feeInvoices.some(
            (inv) => inv.status === 'overdue' || (inv.status === 'unpaid' && inv.due_date < todayStr)
          )
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/students', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name, parentName, phone, email, gender, gradeBatch,
      totalFee, baseMonthlyFee, base_monthly_fee, monthlyFee,
      admissionFee, admission_fee,
      adhocDiscount, adhoc_discount, extraDiscount, extra_discount,
      discountRemarks, discount_remarks,
      amountPaidNow, amount_paid_now,
      paymentMethod, payment_method,
      scholarshipType, scholarship_type,
      scholarshipValue, scholarship_value,
      scholarshipReason, scholarship_reason,
      billingAnchorDay, billing_anchor_day,
      admitted_on, admissionDate,
      initialFeeOverride, initial_fee_override,
      initialPeriodStart, initial_period_start,
      initialPeriodEnd, initial_period_end,
      photoUrl, photo_url, custom_fields, customFields,
      batchIds, adminOverride
    } = req.body;
    
    if (!name || !phone) {
      return sendError(res, 'Full name and valid phone are required', 400);
    }

    // Capacity check for each requested batch
    if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
      for (const bId of batchIds) {
        const batch = await prisma.batch.findUnique({ where: { id: bId } });
        if (batch) {
          const activeCount = await prisma.enrollment.count({
            where: { batch_id: bId, status: 'active' }
          });
          if (activeCount >= batch.capacity && !adminOverride) {
            return sendError(res, `Batch "${batch.name}" has reached maximum capacity (${activeCount}/${batch.capacity})`, 409);
          }
          if (activeCount >= batch.capacity && adminOverride && req.user) {
            await createAuditLog(req.user.userId, 'BATCH_CAPACITY_OVERRIDE', 'Batch', bId, {
              studentName: name,
              currentCount: activeCount,
              capacity: batch.capacity
            });
          }
        }
      }
    }

    // Auto-generate admission_no atomically to prevent race collisions
    const admissionNo = await getNextSequenceValue('admission_no_seq', 'ACAD-2026-', 4);
    const admittedDateStr = admitted_on || admissionDate || formatDateIso(new Date());

    const studentCustomData = {
      ...((custom_fields || customFields) && typeof (custom_fields || customFields) === 'object' ? (custom_fields || customFields) : {}),
      ...(parentName ? { parentName } : {})
    };

    const student = await prisma.student.create({
      data: {
        admission_no: admissionNo,
        full_name: name,
        phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        gender: gender || 'Male',
        admitted_on: parseDateIso(admittedDateStr),
        photo_url: photoUrl || photo_url || null,
        custom_fields: Object.keys(studentCustomData).length > 0 ? studentCustomData : null,
        status: 'active'
      }
    });

    // Determine fee terms & scholarship
    const rawFeeItems = Array.isArray(req.body.feeItems || req.body.fee_items) ? (req.body.feeItems || req.body.fee_items) : [];
    const sumFeeItems = rawFeeItems.reduce((acc: number, item: any) => acc + (Number(item?.amount) || 0), 0);
    const grossAmount = Number(base_monthly_fee ?? baseMonthlyFee ?? totalFee ?? monthlyFee ?? 0);
    const oneTimeAdmissionFee = sumFeeItems > 0 ? sumFeeItems : Number(admission_fee ?? admissionFee ?? 0);
    const adhocDiscountAmount = Math.max(0, Number(adhoc_discount ?? adhocDiscount ?? extra_discount ?? extraDiscount ?? 0));
    const discountReason = discount_remarks || discountRemarks || '';
    const sct = scholarship_type || scholarshipType || 'none';
    const scv = Number(scholarship_value ?? scholarshipValue ?? 0);
    const scr = scholarship_reason || scholarshipReason || null;
    const admissionDay = parseDateIso(admittedDateStr).getDate();
    const anchorDay = Number(billing_anchor_day ?? billingAnchorDay ?? admissionDay) || 1;

    const { discountAmount, netAmount } = calculateNetFee(grossAmount, sct, scv);

    let feePlan = null;
    let initialInvoice = null;
    let initialPayment = null;

    if (grossAmount > 0 || oneTimeAdmissionFee > 0) {
      feePlan = await prisma.studentFeePlan.create({
        data: {
          student_id: student.id,
          monthly_amount: grossAmount,
          discount: discountAmount,
          scholarship_type: sct,
          scholarship_value: scv,
          scholarship_reason: scr,
          billing_anchor_day: anchorDay,
          due_day: 5
        }
      });

      // Generate initial invoice voucher with From-To coverage dates
      const cyclePeriod = calculateCyclePeriod(anchorDay, admittedDateStr);
      const effectivePeriodStart = initial_period_start || initialPeriodStart || cyclePeriod.periodStart;
      const effectivePeriodEnd = initial_period_end || initialPeriodEnd || cyclePeriod.periodEnd;

      let tuitionPayable = netAmount;
      if (initial_fee_override !== undefined && initial_fee_override !== null && initial_fee_override !== '') {
        tuitionPayable = Number(initial_fee_override);
      } else if (initialFeeOverride !== undefined && initialFeeOverride !== null && initialFeeOverride !== '') {
        tuitionPayable = Number(initialFeeOverride);
      }

      const totalPayableNow = Math.max(0, tuitionPayable + oneTimeAdmissionFee - adhocDiscountAmount);
      const effectiveGross = grossAmount + oneTimeAdmissionFee;
      const effectiveDiscount = Math.max(0, effectiveGross - totalPayableNow);
      const collectedAmount = Number(amount_paid_now ?? amountPaidNow ?? 0);

      let invoiceStatus = 'unpaid';
      if (totalPayableNow === 0 || (collectedAmount >= totalPayableNow && totalPayableNow > 0)) {
        invoiceStatus = 'paid';
      } else if (collectedAmount > 0 && collectedAmount < totalPayableNow) {
        invoiceStatus = 'partial';
      }

      initialInvoice = await prisma.feeInvoice.create({
        data: {
          student_id: student.id,
          period: `${admissionNo}-${effectivePeriodStart}`,
          fee_period_start: effectivePeriodStart,
          fee_period_end: effectivePeriodEnd,
          amount: effectiveGross,
          discount: effectiveDiscount,
          net_amount: totalPayableNow,
          due_date: cyclePeriod.dueDate,
          billing_anchor_day: anchorDay,
          status: invoiceStatus
        }
      });

      // Record immediate payment at counter if collected
      if (collectedAmount > 0) {
        const receiptNo = await getNextSequenceValue('receipt_no_seq', 'REC-2026-', 5);
        const payMethod = (payment_method || paymentMethod || 'Cash').toLowerCase();
        const feeItemDetails = rawFeeItems.length > 0
          ? ` [Items: ${rawFeeItems.map((i: any) => `${i.type}: PKR ${i.amount}`).join(', ')}]`
          : '';
        const paymentNote = [
          `Initial Admission Fee Collection (${admissionNo})${feeItemDetails}`,
          adhocDiscountAmount > 0 ? `[Ad-hoc Discount: PKR ${adhocDiscountAmount}${discountReason ? ` - Reason: ${discountReason}` : ''}]` : ''
        ].filter(Boolean).join(' ');

        initialPayment = await prisma.feePayment.create({
          data: {
            invoice_id: initialInvoice.id,
            student_id: student.id,
            amount: collectedAmount,
            method: payMethod,
            receipt_no: receiptNo,
            note: paymentNote,
            recorded_by: req.user?.userId || 'system'
          }
        });
      }
    }

    // Create enrollment records for selected batches
    if (batchIds && Array.isArray(batchIds) && batchIds.length > 0) {
      await prisma.enrollment.createMany({
        data: batchIds.map((batchId: string) => ({
          student_id: student.id,
          batch_id: batchId,
          status: 'active'
        })),
        skipDuplicates: true
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'CREATE_STUDENT', 'Student', student.id, {
        name,
        admissionNo,
        grossAmount,
        discountAmount,
        admissionFee: oneTimeAdmissionFee,
        amountPaidNow: Number(amount_paid_now ?? amountPaidNow ?? 0),
        scholarshipType: sct,
        scholarshipValue: scv,
        anchorDay
      });
    }

    return sendSuccess(res, {
      ...student,
      feePlan,
      initialInvoice,
      initialPayment
    }, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/students/:id/fee-plan', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      base_monthly_fee, baseMonthlyFee,
      scholarship_type, scholarshipType,
      scholarship_value, scholarshipValue,
      scholarship_reason, scholarshipReason,
      billing_anchor_day, billingAnchorDay,
      notes
    } = req.body;

    const grossAmount = Number(base_monthly_fee ?? baseMonthlyFee ?? 0);
    const sct = scholarship_type || scholarshipType || 'none';
    const scv = Number(scholarship_value ?? scholarshipValue ?? 0);
    const scr = scholarship_reason || scholarshipReason || null;
    const anchorDay = Number(billing_anchor_day ?? billingAnchorDay ?? 1);

    const { discountAmount, netAmount } = calculateNetFee(grossAmount, sct, scv);

    const updatedPlan = await prisma.studentFeePlan.upsert({
      where: { student_id: id },
      update: {
        monthly_amount: grossAmount,
        discount: discountAmount,
        scholarship_type: sct,
        scholarship_value: scv,
        scholarship_reason: scr,
        billing_anchor_day: anchorDay,
        notes: notes || undefined
      },
      create: {
        student_id: id,
        monthly_amount: grossAmount,
        discount: discountAmount,
        scholarship_type: sct,
        scholarship_value: scv,
        scholarship_reason: scr,
        billing_anchor_day: anchorDay,
        due_day: 5,
        notes: notes || undefined
      }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'UPDATE_STUDENT_FEE_PLAN', 'StudentFeePlan', id, {
        grossAmount,
        sct,
        scv,
        scr,
        anchorDay
      });
    }

    return sendSuccess(res, {
      ...updatedPlan,
      net_monthly_amount: netAmount
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/students/:id', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { fullName, name, parentName, phone, email, gender, status, photoUrl, photo_url, custom_fields, customFields } = req.body;
    
    let customUpdate: any = undefined;
    if (parentName !== undefined || custom_fields !== undefined || customFields !== undefined) {
      const existing = await prisma.student.findUnique({ where: { id }, select: { custom_fields: true } });
      const currentCustom = (existing?.custom_fields && typeof existing.custom_fields === 'object')
        ? (existing.custom_fields as Record<string, any>)
        : {};
      customUpdate = {
        ...currentCustom,
        ...((custom_fields || customFields) && typeof (custom_fields || customFields) === 'object' ? (custom_fields || customFields) : {}),
        ...(parentName !== undefined ? { parentName } : {})
      };
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        full_name: fullName || name,
        phone,
        email,
        gender,
        status,
        photo_url: photoUrl || photo_url !== undefined ? (photoUrl || photo_url) : undefined,
        custom_fields: customUpdate !== undefined ? customUpdate : undefined
      }
    });

    // If status changed to 'left' or 'suspended', update enrollments and pause/delete fee plan (HIGH-02)
    if (status === 'left' || status === 'suspended') {
      await prisma.enrollment.updateMany({
        where: { student_id: id },
        data: { status: 'removed' }
      });
      if (status === 'left') {
        await prisma.studentFeePlan.deleteMany({
          where: { student_id: id }
        });
      } else {
        await prisma.student.update({
          where: { id },
          data: { is_fee_paused: true }
        });
      }
      if (req.user) {
        await createAuditLog(req.user.userId, 'STUDENT_DEPARTURE_FEE_FREEZE', 'Student', id, { status });
      }
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'UPDATE_STUDENT', 'Student', student.id, { status });
    }

    return sendSuccess(res, student);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/students/:id', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const mode = (req.query.mode as string) || (req.body?.mode as string) || 'soft';
    
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return sendError(res, 'Student not found', 404);

    if (mode === 'hard') {
      // Hard / Permanent Delete - Purge all records & cascade
      await prisma.attendance.deleteMany({ where: { student_id: id } });
      await prisma.leave.deleteMany({ where: { student_id: id } });
      await prisma.conductLog.deleteMany({ where: { student_id: id } });
      await prisma.testMark.deleteMany({ where: { student_id: id } });
      await prisma.parentStudent.deleteMany({ where: { student_id: id } });
      await prisma.studentStatusHistory.deleteMany({ where: { student_id: id } });
      await prisma.studentFeePlan.deleteMany({ where: { student_id: id } });
      
      const enrollments = await prisma.enrollment.findMany({ where: { student_id: id }, select: { id: true } });
      const enrollmentIds = enrollments.map(e => e.id);
      if (enrollmentIds.length > 0) {
        await prisma.studentInstallmentSchedule.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
      }
      await prisma.enrollment.deleteMany({ where: { student_id: id } });

      await prisma.feePayment.deleteMany({ where: { student_id: id } });
      await prisma.feeInvoice.deleteMany({ where: { student_id: id } });

      await prisma.student.delete({ where: { id } });

      if (student.user_id) {
        await prisma.user.delete({ where: { id: student.user_id } }).catch(() => {});
      }

      if (req.user) {
        await createAuditLog(req.user.userId, 'PERMANENT_DELETE_STUDENT', 'Student', id, { 
          action: 'hard_delete', 
          studentName: student.full_name, 
          regNo: student.admission_no 
        });
      }

      return sendSuccess(res, { message: 'Student permanently deleted from database', deleted: true, mode: 'hard' });
    } else {
      // Soft Delete / Archive
      const updated = await prisma.student.update({
        where: { id },
        data: { 
          status: 'left',
          status_reason: 'archived',
          status_remarks: 'Archived via student directory',
          status_updated_at: new Date(),
          leaving_date: new Date(),
          is_fee_paused: true
        }
      });

      await prisma.enrollment.updateMany({
        where: { student_id: id },
        data: { status: 'removed' }
      });

      await prisma.studentStatusHistory.create({
        data: {
          student_id: id,
          previous_status: student.status,
          new_status: 'left',
          reason_category: 'archived',
          remarks: 'Soft archived via directory management',
          changed_by_user_id: req.user?.userId || 'admin',
          fee_action: 'pause_fees'
        }
      });

      if (req.user) {
        await createAuditLog(req.user.userId, 'ARCHIVE_STUDENT', 'Student', id, { 
          action: 'soft_delete', 
          studentName: student.full_name, 
          regNo: student.admission_no 
        });
      }

      return sendSuccess(res, { message: 'Student archived successfully', student: updated, mode: 'soft' });
    }
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Bulk Roster Creation (CSV Import) */
router.post('/students/bulk', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { students: studentList } = req.body; // Array of student objects
    if (!Array.isArray(studentList) || studentList.length === 0) {
      return sendError(res, 'No student records provided for bulk import', 400);
    }

    const createdStudents = [];
    const defaultPassword = await bcrypt.hash('student123', 10);
    for (const item of studentList) {
      const user = await prisma.user.create({
        data: {
          role: 'student',
          full_name: item.name || item.fullName,
          email: item.email || `student_${Date.now()}_${Math.floor(Math.random()*1000)}@academy.com`,
          phone: item.phone || '+9200000000',
          password_hash: defaultPassword
        }
      });

      let cls = await prisma.class.findFirst({ where: { name: item.gradeBatch || 'Grade 10' } });
      if (!cls) {
        cls = await prisma.class.create({ data: { name: item.gradeBatch || 'Grade 10', is_active: true } });
      }

      const admissionNo = await getNextSequenceValue('admission_no_seq', `ACAD-${new Date().getFullYear()}-`, 4);
      const student = await prisma.student.create({
        data: {
          user_id: user.id,
          class_id: cls.id,
          admission_no: admissionNo,
          full_name: item.name || item.fullName || 'Student',
          phone: item.phone || '+9200000000',
          gender: item.gender || 'Male',
          status: 'active'
        }
      });

      createdStudents.push(student);
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'BULK_IMPORT_STUDENTS', 'Student', 'bulk', { count: createdStudents.length });
    }

    return sendSuccess(res, { count: createdStudents.length, students: createdStudents }, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Bulk Soft or Hard Delete */
router.post('/students/bulk-delete', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentIds, mode = 'soft' } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return sendError(res, 'No student IDs provided for bulk delete', 400);
    }

    if (mode === 'hard') {
      await prisma.attendance.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.leave.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.conductLog.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.testMark.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.parentStudent.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.studentStatusHistory.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.studentFeePlan.deleteMany({ where: { student_id: { in: studentIds } } });

      const enrollments = await prisma.enrollment.findMany({ where: { student_id: { in: studentIds } }, select: { id: true } });
      const enrollmentIds = enrollments.map(e => e.id);
      if (enrollmentIds.length > 0) {
        await prisma.studentInstallmentSchedule.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
      }
      await prisma.enrollment.deleteMany({ where: { student_id: { in: studentIds } } });

      await prisma.feePayment.deleteMany({ where: { student_id: { in: studentIds } } });
      await prisma.feeInvoice.deleteMany({ where: { student_id: { in: studentIds } } });

      const deleted = await prisma.student.deleteMany({ where: { id: { in: studentIds } } });

      if (req.user) {
        await createAuditLog(req.user.userId, 'BULK_PERMANENT_DELETE_STUDENTS', 'Student', 'bulk', { count: deleted.count, mode: 'hard' });
      }

      return sendSuccess(res, { count: deleted.count, message: 'Students permanently deleted from database', mode: 'hard' });
    } else {
      const updated = await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { status: 'left', is_fee_paused: true }
      });

      await prisma.enrollment.updateMany({
        where: { student_id: { in: studentIds } },
        data: { status: 'removed' }
      });

      if (req.user) {
        await createAuditLog(req.user.userId, 'BULK_ARCHIVE_STUDENTS', 'Student', 'bulk', { count: updated.count, mode: 'soft' });
      }

      return sendSuccess(res, { count: updated.count, message: 'Students archived successfully', mode: 'soft' });
    }
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Bulk Batch Transfer */
router.post('/students/bulk-transfer', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentIds, targetBatch } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetBatch) {
      return sendError(res, 'Student IDs and target batch are required', 400);
    }

    let cls = await prisma.class.findFirst({ where: { name: targetBatch } });
    if (!cls) {
      cls = await prisma.class.create({ data: { name: targetBatch, is_active: true } });
    }

    const updated = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { class_id: cls.id }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'BULK_TRANSFER_STUDENTS', 'Student', 'bulk', { targetBatch, count: updated.count });
    }

    return sendSuccess(res, { count: updated.count, targetBatch, message: 'Students transferred successfully' });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Change Student Lifecycle Status */
router.post('/students/:id/status', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { targetStatus, reasonCategory, remarks, effectiveDate, feeAction, targetBatchId } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended', 'graduated', 'left'];
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return sendError(res, `Invalid target status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const currentStudent = await prisma.student.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!currentStudent) {
      return sendError(res, 'Student not found', 404);
    }

    const previousStatus = currentStudent.status || 'active';
    const isFeePaused = feeAction === 'pause_fees' 
      ? true 
      : (feeAction === 'continue_fees' ? false : (targetStatus !== 'active'));

    const effectiveDateTime = effectiveDate ? new Date(effectiveDate) : new Date();

    // 1. Resolve Target Batch Parent Class ID if provided (CRIT-10)
    let resolvedClassId: string | undefined = undefined;
    if (targetBatchId) {
      const targetBatch = await prisma.batch.findUnique({ where: { id: targetBatchId } });
      if (targetBatch) {
        resolvedClassId = targetBatch.class_id;
      }
    }

    // Update Student Record
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        status: targetStatus,
        status_reason: reasonCategory || null,
        status_remarks: remarks || null,
        status_updated_at: new Date(),
        leaving_date: (targetStatus === 'left' || targetStatus === 'graduated') ? effectiveDateTime : null,
        is_fee_paused: isFeePaused,
        class_id: resolvedClassId
      },
      include: { class: true, feePlan: true }
    });

    // 2. Handle Enrollments & Fee Plans if Leaving or Graduating
    if (targetStatus === 'left' || targetStatus === 'graduated') {
      await prisma.enrollment.updateMany({
        where: { student_id: id },
        data: { status: 'removed' }
      });
      if (feeAction === 'waive_balance') {
        await prisma.studentFeePlan.deleteMany({
          where: { student_id: id }
        });
      }
    } else if (targetStatus === 'active' && targetBatchId) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { student_id: id, batch_id: targetBatchId }
      });
      if (existingEnrollment) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'active' }
        });
      } else {
        await prisma.enrollment.create({
          data: {
            student_id: id,
            batch_id: targetBatchId,
            status: 'active'
          }
        });
      }
    }

    // 3. Create Immutable Status Transition History Entry
    const historyEntry = await prisma.studentStatusHistory.create({
      data: {
        student_id: id,
        previous_status: previousStatus,
        new_status: targetStatus,
        reason_category: reasonCategory || 'other',
        remarks: remarks || null,
        effective_date: effectiveDateTime,
        fee_action: feeAction || null,
        changed_by_user_id: req.user?.userId || null
      }
    });

    // 4. Record Audit Log
    if (req.user) {
      await createAuditLog(req.user.userId, 'CHANGE_STUDENT_STATUS', 'Student', id, {
        previousStatus,
        newStatus: targetStatus,
        reason: reasonCategory,
        feeAction
      });
    }

    return sendSuccess(res, {
      student: updatedStudent,
      historyEntry
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Get Student Status Transition History */
router.get('/students/:id/status-history', authenticateJwt, requireModulePermission('students', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.studentStatusHistory.findMany({
      where: { student_id: id },
      orderBy: { created_at: 'desc' }
    });

    // Enrich with user name if available
    const userIds = history.map(h => h.changed_by_user_id).filter(Boolean) as string[];
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, full_name: true }
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u.full_name]));

    const enrichedHistory = history.map(item => ({
      id: item.id,
      studentId: item.student_id,
      previousStatus: item.previous_status,
      newStatus: item.new_status,
      reasonCategory: item.reason_category,
      remarks: item.remarks,
      effectiveDate: item.effective_date.toISOString(),
      feeAction: item.fee_action,
      changedByUserId: item.changed_by_user_id,
      changedByName: item.changed_by_user_id ? (userMap.get(item.changed_by_user_id) || 'Administrator') : 'Administrator',
      createdAt: item.created_at.toISOString()
    }));

    return sendSuccess(res, enrichedHistory);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Reactivate Inactive / Left / Suspended Student */
router.post('/students/:id/reactivate', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { targetBatchId, monthlyFee, remarks } = req.body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { class: true }
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const previousStatus = student.status || 'inactive';

    // 1. Update Student Status to Active
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        status: 'active',
        status_reason: null,
        status_remarks: remarks || 'Reactivated and re-enrolled',
        status_updated_at: new Date(),
        is_fee_paused: false,
        leaving_date: null,
        class_id: targetBatchId ? targetBatchId : student.class_id
      },
      include: { class: true, feePlan: true }
    });

    // 2. Reactivate / Create Enrollment
    const batchIdToUse = targetBatchId || student.class_id;
    if (batchIdToUse) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { student_id: id, batch_id: batchIdToUse }
      });
      if (existingEnrollment) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'active' }
        });
      } else {
        await prisma.enrollment.create({
          data: {
            student_id: id,
            batch_id: batchIdToUse,
            status: 'active'
          }
        });
      }
    }

    // 3. Ensure Fee Plan
    if (monthlyFee && Number(monthlyFee) > 0) {
      const existingFeePlan = await prisma.studentFeePlan.findUnique({
        where: { student_id: id }
      });
      if (existingFeePlan) {
        await prisma.studentFeePlan.update({
          where: { student_id: id },
          data: { monthly_amount: Number(monthlyFee) }
        });
      } else {
        await prisma.studentFeePlan.create({
          data: {
            student_id: id,
            monthly_amount: Number(monthlyFee),
            discount: 0,
            due_day: 5
          }
        });
      }
    }

    // 4. Log History Entry
    await prisma.studentStatusHistory.create({
      data: {
        student_id: id,
        previous_status: previousStatus,
        new_status: 'active',
        reason_category: 'other',
        remarks: remarks || 'Reactivated and reinstated',
        effective_date: new Date(),
        fee_action: 'continue_fees',
        changed_by_user_id: req.user?.userId || null
      }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'REACTIVATE_STUDENT', 'Student', id, { previousStatus, remarks });
    }

    return sendSuccess(res, updatedStudent);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Generate Leaving Certificate & Clearance Slip */
router.get('/students/:id/leaving-certificate', authenticateJwt, requireModulePermission('students', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        attendances: true,
        feeInvoices: true,
        feePayments: true,
        conductLogs: { where: { is_deleted: false } },
        parentStudents: { include: { parent: true } }
      }
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Compute Attendance %
    const totalAttendances = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalAttendances > 0
      ? Math.round((presentCount / totalAttendances) * 100)
      : 0;

    const totalInvoiced = student.feeInvoices.reduce((sum, inv) => sum + (inv.net_amount || 0), 0);
    const totalPaid = student.feePayments
      .filter(pay => !pay.voided_at && (pay.cleared_status || 'cleared') === 'cleared')
      .reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const dueBalance = Math.max(0, totalInvoiced - totalPaid);
    const feeStatus = dueBalance <= 0 ? 'Cleared' : 'Pending Dues';

    const infractionCount = student.conductLogs.filter(c => c.category === 'infraction').length;
    const commendationCount = student.conductLogs.filter(c => c.category === 'commendation').length;
    const criticalCount = student.conductLogs.filter(c => c.severity === 'critical').length;
    let conductRating: 'Exemplary' | 'Good' | 'Satisfactory' | 'Needs Improvement' = 'Satisfactory';
    if (student.conductLogs.length === 0) conductRating = 'Satisfactory';
    else if (criticalCount > 0 || infractionCount > 2) conductRating = 'Needs Improvement';
    else if (commendationCount > 0 && infractionCount === 0) conductRating = 'Exemplary';
    else if (infractionCount > 0) conductRating = 'Satisfactory';
    else conductRating = 'Good';

    const parentName = student.parentStudents[0]?.parent?.full_name || '';

    const leavingCertificateData = {
      admissionNo: student.admission_no,
      studentName: student.full_name,
      parentName,
      phone: student.phone,
      gradeBatch: student.class?.name || '',
      enrollmentDate: student.admitted_on ? student.admitted_on.toISOString().split('T')[0] : '',
      leavingDate: student.leaving_date ? student.leaving_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reason: student.status_reason ? (student.status_reason.charAt(0).toUpperCase() + student.status_reason.slice(1)) : (student.status === 'graduated' ? 'Graduation' : student.status),
      status: student.status,
      attendancePercentage,
      feeStatus,
      dueBalance,
      conductRating,
      remarks: student.status_remarks || (student.conductLogs.length === 0 ? 'No conduct remarks on file.' : '')
    };

    return sendSuccess(res, leavingCertificateData);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   4. TEACHERS MODULE (M4 TCH)
   ========================================================================== */
router.get('/teachers', authenticateJwt, requireModulePermission('teachers', 'view_only'), async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        batches: { select: { id: true, name: true } },
        batchSubjects: { include: { subject: true, batch: true } }
      }
    });
    return sendSuccess(res, teachers);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/teachers', authenticateJwt, requireModulePermission('teachers', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { fullName, email, phone, qualification } = req.body;
    const defaultPassword = await bcrypt.hash('teacher123', 10);

    const user = await prisma.user.create({
      data: {
        role: 'teacher',
        full_name: fullName,
        email,
        phone,
        password_hash: defaultPassword
      }
    });

    const teacher = await prisma.teacher.create({
      data: {
        user_id: user.id,
        qualification
      }
    });

    return sendSuccess(res, teacher, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/teachers/:id', authenticateJwt, requireModulePermission('teachers', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, qualification } = req.body;

    const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
    if (!teacher) return sendError(res, 'Teacher not found', 404);

    if (teacher.user_id) {
      await prisma.user.update({
        where: { id: teacher.user_id },
        data: {
          ...(fullName && { full_name: fullName }),
          ...(email && { email }),
          ...(phone && { phone })
        }
      });
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        ...(qualification && { qualification })
      },
      include: { user: true }
    });

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/teachers/:id', authenticateJwt, requireModulePermission('teachers', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return sendError(res, 'Teacher not found', 404);

    await prisma.$transaction(async (tx) => {
      // 1. Unassign batches and timetable slots
      await tx.batch.updateMany({
        where: { teacher_id: id },
        data: { teacher_id: null }
      });
      await tx.timetableSlot.updateMany({
        where: { teacher_id: id },
        data: { teacher_id: null }
      }).catch(() => {});
      await tx.homework.deleteMany({ where: { teacher_id: id } }).catch(() => {});
      await tx.studyMaterial.deleteMany({ where: { teacher_id: id } }).catch(() => {});
      await tx.batchSubject.deleteMany({ where: { teacher_id: id } }).catch(() => {});
      await tx.batchSubstitute.deleteMany({
        where: { OR: [{ original_teacher_id: id }, { substitute_teacher_id: id }] }
      }).catch(() => {});

      // 2. Cascade delete linked StaffMember if exists
      const staff = await tx.staffMember.findFirst({ where: { teacher_id: id } });
      if (staff) {
        await tx.staffPermission.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffAttendance.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffDocument.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffSalaryPayment.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffLeaveRequest.deleteMany({ where: { staff_member_id: staff.id } });
        await tx.staffSalaryStructure.deleteMany({ where: { staff_member_id: staff.id } }).catch(() => {});
        await tx.staffMember.delete({ where: { id: staff.id } });
      }

      // 3. Delete Teacher & User
      await tx.teacher.delete({ where: { id } });
      if (teacher.user_id) {
        await tx.user.delete({ where: { id: teacher.user_id } }).catch(() => {});
      }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'DELETE_TEACHER', 'Teacher', id);
    }

    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});


/* ==========================================================================
   5. ACADEMIC STRUCTURE (M5 ACA)
   ========================================================================== */
router.get('/classes', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: { _count: { select: { batches: true } } },
      orderBy: { name: 'asc' }
    });
    return sendSuccess(res, classes);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/classes', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return sendError(res, 'Class name is required.', 400);
    const existing = await prisma.class.findUnique({ where: { name } });
    if (existing) return sendError(res, `Class "${name}" already exists.`, 409);
    const cls = await prisma.class.create({ data: { name, is_active: true } });
    if (req.user) await createAuditLog(req.user.userId, 'CREATE_CLASS', 'Class', cls.id, { name });
    return sendSuccess(res, cls, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/classes/:id', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const name = req.body.name !== undefined ? String(req.body.name).trim() : undefined;
    const isActive = req.body.is_active;
    const data: any = {};
    if (name) data.name = name;
    if (isActive !== undefined) data.is_active = Boolean(isActive);
    if (Object.keys(data).length === 0) return sendError(res, 'Nothing to update.', 400);
    const cls = await prisma.class.update({ where: { id: req.params.id }, data });
    if (req.user) await createAuditLog(req.user.userId, 'UPDATE_CLASS', 'Class', cls.id, data);
    return sendSuccess(res, cls);
  } catch (err: any) {
    if (err.code === 'P2025') return sendError(res, 'Class not found.', 404);
    if (err.code === 'P2002') return sendError(res, 'A class with that name already exists.', 409);
    return sendError(res, err.message, 500);
  }
});

router.delete('/classes/:id', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const batchCount = await prisma.batch.count({ where: { class_id: req.params.id } });
    if (batchCount > 0) {
      return sendError(res, `Cannot delete class: ${batchCount} batch(es) still belong to it. Archive it instead.`, 409);
    }
    await prisma.class.delete({ where: { id: req.params.id } });
    if (req.user) await createAuditLog(req.user.userId, 'DELETE_CLASS', 'Class', req.params.id, {});
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err: any) {
    if (err.code === 'P2025') return sendError(res, 'Class not found.', 404);
    return sendError(res, err.message, 500);
  }
});

router.get('/batches', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        class: true,
        teacher: { include: { user: true } },
        enrollments: {
          where: { status: 'active' }
        }
      }
    });
    return sendSuccess(res, batches);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name, classLevel, teacherId, timing, room, capacity,
      course_type, courseType,
      total_fee, totalFee,
      start_date, startDate,
      end_date, endDate,
      default_installments, defaultInstallments,
      section_name, sectionName
    } = req.body;

    // Find or create class
    let cls = await prisma.class.findUnique({ where: { name: classLevel } });
    if (!cls) {
      cls = await prisma.class.create({ data: { name: classLevel, is_active: true } });
    }

    const cType = course_type || courseType || 'recurring_monthly';
    const sDate = (start_date || startDate) ? String(start_date || startDate) : null;
    const eDate = (end_date || endDate) ? String(end_date || endDate) : null;
    const tFee = total_fee ?? totalFee ? Number(total_fee ?? totalFee) : null;
    const defInst = default_installments ?? defaultInstallments ? Number(default_installments ?? defaultInstallments) : 3;

    const batch = await prisma.batch.create({
      data: {
        name,
        class_id: cls.id,
        teacher_id: teacherId || null,
        days: req.body.days || 'MON,WED,FRI',
        start_time: timing?.split('-')[0]?.trim() || '14:00',
        end_time: timing?.split('-')[1]?.trim() || '16:00',
        capacity: Number(capacity) || 30,
        course_type: cType,
        total_fee: tFee,
        start_date: sDate,
        end_date: eDate,
        default_installments: defInst,
        section_name: section_name || sectionName || null,
        room: room || null
      },
      include: { class: true, teacher: { include: { user: true } } }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'CREATE_BATCH', 'Batch', batch.id, { name, classLevel, cType, tFee });
    }

    return sendSuccess(res, batch, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/batches/:id', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name, capacity, teacherId, teacher_id, timing, room, start_time, end_time,
      course_type, courseType,
      total_fee, totalFee,
      start_date, startDate,
      end_date, endDate,
      default_installments, defaultInstallments,
      section_name, sectionName
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (capacity) updateData.capacity = Number(capacity);
    if (teacherId || teacher_id) updateData.teacher_id = teacherId || teacher_id;
    if (room) updateData.room = room;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (course_type || courseType) updateData.course_type = course_type || courseType;
    if (total_fee !== undefined || totalFee !== undefined) updateData.total_fee = Number(total_fee ?? totalFee);
    if (start_date || startDate) updateData.start_date = String(start_date || startDate);
    if (end_date || endDate) updateData.end_date = String(end_date || endDate);
    if (default_installments !== undefined || defaultInstallments !== undefined) updateData.default_installments = Number(default_installments ?? defaultInstallments);
    if (section_name !== undefined || sectionName !== undefined) updateData.section_name = section_name || sectionName;
    if (timing) {
      const parts = timing.split('-');
      if (parts.length === 2) {
        updateData.start_time = parts[0].trim();
        updateData.end_time = parts[1].trim();
      }
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: updateData,
      include: { class: true, teacher: { include: { user: true } } }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'UPDATE_BATCH', 'Batch', id, { name });
    }

    return sendSuccess(res, batch);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/batches/:id', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      // 1. Delete installment schedules for enrollments in this batch
      const enrollments = await tx.enrollment.findMany({ where: { batch_id: id }, select: { id: true } });
      const enrollmentIds = enrollments.map(e => e.id);
      if (enrollmentIds.length > 0) {
        await tx.studentInstallmentSchedule.deleteMany({ where: { enrollment_id: { in: enrollmentIds } } });
      }

      // 2. Delete enrollments, batch subjects, schedules, attendance, tests
      await tx.enrollment.deleteMany({ where: { batch_id: id } });
      await tx.batchSubject.deleteMany({ where: { batch_id: id } });
      await tx.timetableSlot.deleteMany({ where: { batch_id: id } }).catch(() => {});
      await tx.attendance.deleteMany({ where: { batch_id: id } });
      await tx.homework.deleteMany({ where: { batch_id: id } }).catch(() => {});
      await tx.studyMaterial.deleteMany({ where: { batch_id: id } }).catch(() => {});
      
      const tests = await tx.test.findMany({ where: { batch_id: id }, select: { id: true } });
      const testIds = tests.map(t => t.id);
      if (testIds.length > 0) {
        await tx.testMark.deleteMany({ where: { test_id: { in: testIds } } });
      }
      await tx.test.deleteMany({ where: { batch_id: id } });
      await tx.feeStructure.deleteMany({ where: { batch_id: id } }).catch(() => {});
      await tx.conductLog.deleteMany({ where: { batch_id: id } }).catch(() => {});
      await tx.batchWaitlist.deleteMany({ where: { batch_id: id } }).catch(() => {});
      await tx.batchSubstitute.deleteMany({ where: { batch_id: id } }).catch(() => {});

      // 3. Delete batch
      await tx.batch.delete({ where: { id } });
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'DELETE_BATCH', 'Batch', id);
    }

    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Batch Students & Enrollments */
router.get('/batches/:id/students', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const canViewFees = userRole === 'admin' || userRole === 'super_admin' || userRole === 'accountant';

    const enrollments = await prisma.enrollment.findMany({
      where: { batch_id: id, status: 'active' },
      include: {
        student: {
          include: { class: true, feePlan: canViewFees }
        },
        installmentSchedules: canViewFees
      },
      orderBy: { enrolled_on: 'desc' }
    });
    return sendSuccess(res, enrollments.map(e => ({
      ...e.student,
      feePlan: canViewFees ? (e.student as any).feePlan : undefined,
      enrollmentId: e.id,
      enrolledOn: e.enrolled_on,
      isExtendedTimeline: e.is_extended_timeline,
      individualEndDate: e.individual_end_date,
      installmentSchedules: canViewFees ? e.installmentSchedules : []
    })));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/enroll', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      studentId,
      enrolled_on, enrolledOn,
      alignment_mode, alignmentMode,
      prorate_mode, prorateMode,
      custom_fee_override, customFeeOverride,
      individual_end_date, individualEndDate,
      custom_installments, customInstallments,
      adminOverride
    } = req.body;

    if (!studentId) {
      return sendError(res, 'studentId is required', 400);
    }

    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) return sendError(res, 'Batch not found', 404);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { feePlan: true }
    });
    if (!student) return sendError(res, 'Student not found', 404);

    // Atomic Capacity Check with Row-Level Lock (CRIT-04 / Hardening 2.3)
    let batchCapacity = batch.capacity;
    try {
      const lockedBatch = await prisma.$queryRaw<Array<{ id: string; capacity: number }>>`
        SELECT id, capacity FROM "Batch" WHERE id = ${id} FOR UPDATE
      `;
      if (lockedBatch && lockedBatch.length > 0 && lockedBatch[0].capacity != null) {
        batchCapacity = lockedBatch[0].capacity;
      }
    } catch {
      // If DB driver does not support row lock outside transaction, continue with read capacity
    }

    const activeCount = await prisma.enrollment.count({
      where: { batch_id: id, status: 'active' }
    });

    if (activeCount >= batchCapacity && !adminOverride) {
      if (req.body.waitlist) {
        const last = await prisma.batchWaitlist.findFirst({
          where: { batch_id: id },
          orderBy: { position: 'desc' }
        });
        const row = await prisma.batchWaitlist.upsert({
          where: { batch_id_student_id: { batch_id: id, student_id: studentId } },
          update: {},
          create: {
            batch_id: id,
            student_id: studentId,
            position: (last?.position || 0) + 1,
            reason: 'Capacity full'
          },
          include: { student: true }
        });
        return sendSuccess(res, { waitlisted: true, waitlist: row }, null, 201);
      }
      return res.status(409).json({
        success: false,
        error: `Batch "${batch.name}" has reached maximum capacity (${activeCount}/${batchCapacity})`,
        meta: { current: activeCount, capacity: batchCapacity, canOverride: true, canWaitlist: true }
      });
    }

    const enrollDateStr = enrolled_on || enrolledOn || formatDateIso(new Date());
    const isExtended = (alignment_mode || alignmentMode) === 'extend_student_timeline';
    const indEndDateStr = individual_end_date || individualEndDate;
    const indEndDate = indEndDateStr ? parseDateIso(indEndDateStr) : null;

    const enrollment = await prisma.enrollment.upsert({
      where: { student_id_batch_id: { student_id: studentId, batch_id: id } },
      update: {
        status: 'active',
        enrolled_on: parseDateIso(enrollDateStr),
        is_extended_timeline: isExtended,
        individual_end_date: indEndDateStr || null
      },
      create: {
        student_id: studentId,
        batch_id: id,
        status: 'active',
        enrolled_on: parseDateIso(enrollDateStr),
        is_extended_timeline: isExtended,
        individual_end_date: indEndDateStr || null
      }
    });

    // Handle Fixed Course Installments Generation
    let installmentSchedules: any[] = [];
    let initialInstallmentInvoice: any = null;
    const hasCourseFee = Boolean(
      batch.course_type === 'fixed_course' ||
      (batch.total_fee && batch.total_fee > 0) ||
      (custom_fee_override && Number(custom_fee_override) > 0) ||
      (customFeeOverride && Number(customFeeOverride) > 0) ||
      (custom_installments && Number(custom_installments) > 0) ||
      (customInstallments && Number(customInstallments) > 0)
    );
    if (hasCourseFee) {
      const defaultGross = Number(batch.total_fee || 15000);
      const grossCourseFee = Number(custom_fee_override ?? customFeeOverride ?? defaultGross);
      const sct = student.feePlan?.scholarship_type || 'none';
      const scv = student.feePlan?.scholarship_value || 0;
      const numInstallments = Number(custom_installments ?? customInstallments ?? batch.default_installments ?? 3);
      const batchStartStr = batch.start_date || enrollDateStr;
      const batchEndStr = batch.end_date || (indEndDateStr || enrollDateStr);

      const lateCalc = calculateLateEnrollment({
        totalCourseFee: grossCourseFee,
        batchStartDateStr: batchStartStr,
        batchEndDateStr: batchEndStr,
        enrollmentDateStr: enrollDateStr,
        scholarshipType: sct,
        scholarshipValue: scv,
        alignmentMode: isExtended ? 'extend_student_timeline' : 'align_batch_end',
        prorateMode: (prorate_mode || prorateMode || 'remaining_duration') as any,
        customFeeOverride: (custom_fee_override ?? customFeeOverride) ? Number(custom_fee_override ?? customFeeOverride) : undefined,
        installmentCount: numInstallments,
        individualEndDateStr: indEndDateStr
      });

      const scheduleItems = lateCalc.schedule;

      // Clean existing scheduled (unbilled) rows for this enrollment
      await prisma.studentInstallmentSchedule.deleteMany({
        where: {
          enrollment_id: enrollment.id,
          status: 'scheduled',
          invoice_id: null
        }
      });

      // Insert all installment schedules
      for (const item of scheduleItems) {
        const createdSchedule = await prisma.studentInstallmentSchedule.create({
          data: {
            enrollment_id: enrollment.id,
            installment_number: item.installment_number,
            total_installments: item.total_installments,
            amount: item.amount,
            due_date: item.due_date,
            fee_period_start: item.fee_period_start,
            fee_period_end: item.fee_period_end,
            status: 'scheduled'
          }
        });
        installmentSchedules.push(createdSchedule);
      }

      // Automatically generate voucher for Installment 1 immediately at enrollment (Option B Decision)
      if (installmentSchedules.length > 0) {
        const inst1 = installmentSchedules[0];
        const voucherPeriod = `INST-1-${batch.name.replace(/\s+/g, '-').slice(0, 10)}-${student.admission_no || studentId.slice(0, 4)}`;

        initialInstallmentInvoice = await prisma.feeInvoice.create({
          data: {
            student_id: studentId,
            period: voucherPeriod,
            fee_period_start: inst1.fee_period_start,
            fee_period_end: inst1.fee_period_end,
            amount: inst1.amount,
            discount: 0,
            net_amount: inst1.amount,
            due_date: inst1.due_date,
            billing_anchor_day: parseDateIso(inst1.fee_period_start).getDate(),
            installment_number: 1,
            total_installments: installmentSchedules.length,
            status: 'unpaid'
          }
        });

        // Link voucher to installment 1
        await prisma.studentInstallmentSchedule.update({
          where: { id: inst1.id },
          data: {
            invoice_id: initialInstallmentInvoice.id
          }
        });
        inst1.invoice_id = initialInstallmentInvoice.id;
      }
    }

    if (activeCount >= batch.capacity && adminOverride && req.user) {
      await createAuditLog(req.user.userId, 'BATCH_CAPACITY_OVERRIDE', 'Batch', id, {
        studentId,
        currentCount: activeCount,
        capacity: batch.capacity
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'ENROLL_STUDENT', 'Batch', id, {
        studentId,
        installmentsCount: installmentSchedules.length
      });
    }

    return sendSuccess(res, {
      enrollment,
      installmentSchedules,
      initialInstallmentInvoice
    }, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/batches/:id/enroll/:studentId', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id, studentId } = req.params;
    await prisma.enrollment.updateMany({
      where: { batch_id: id, student_id: studentId },
      data: { status: 'removed' }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'REMOVE_STUDENT_ENROLLMENT', 'Batch', id, { studentId });
    }

    return sendSuccess(res, { message: 'Student removed from batch successfully' });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Student Installment Schedules Listing */
router.get('/students/:id/installment-schedule', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const schedules = await prisma.studentInstallmentSchedule.findMany({
      where: {
        enrollment: {
          student_id: id
        }
      },
      include: {
        enrollment: {
          include: { batch: true, student: true }
        },
        invoice: {
          include: { feePayments: true }
        }
      },
      orderBy: [{ enrollment_id: 'asc' }, { installment_number: 'asc' }]
    });

    return sendSuccess(res, schedules.map(s => ({
      id: s.id,
      studentId: s.enrollment.student_id,
      batchId: s.enrollment.batch_id,
      batchName: s.enrollment.batch.name,
      courseType: s.enrollment.batch.course_type,
      installmentNumber: s.installment_number,
      totalInstallments: s.total_installments,
      amount: s.amount,
      feePeriodStart: s.fee_period_start,
      feePeriodEnd: s.fee_period_end,
      dueDate: s.due_date,
      status: s.status,
      invoiceId: s.invoice_id,
      invoiceStatus: s.invoice?.status || 'unbilled',
      paidAmount: s.invoice?.feePayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    })));
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Batch Subjects */
router.get('/batches/:id/subjects', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const batchSubjects = await prisma.batchSubject.findMany({
      where: { batch_id: id },
      include: {
        subject: true,
        teacher: { include: { user: true } }
      }
    });
    return sendSuccess(res, batchSubjects);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/subjects', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { subjectId, teacherId } = req.body;

    if (!subjectId || !teacherId) {
      return sendError(res, 'subjectId and teacherId are required', 400);
    }

    const assigned = await prisma.batchSubject.upsert({
      where: { batch_id_subject_id: { batch_id: id, subject_id: subjectId } },
      update: { teacher_id: teacherId },
      create: { batch_id: id, subject_id: subjectId, teacher_id: teacherId },
      include: { subject: true, teacher: { include: { user: true } } }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'ASSIGN_BATCH_SUBJECT', 'BatchSubject', `${id}-${subjectId}`, { teacherId });
    }

    return sendSuccess(res, assigned, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/batches/:id/subjects/:subjectId', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id, subjectId } = req.params;
    await prisma.batchSubject.deleteMany({
      where: { batch_id: id, subject_id: subjectId }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'REMOVE_BATCH_SUBJECT', 'BatchSubject', `${id}-${subjectId}`);
    }

    return sendSuccess(res, { message: 'Subject removed from batch' });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});


/* ==========================================================================
   6. ATTENDANCE MODULE (M6 ATT)
   ========================================================================== */
router.get('/attendance', authenticateJwt, requireModulePermission('attendance', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, date, studentId } = req.query;

    // Faculty Scoping Check
    const isTeacherRole = req.user?.role === 'teacher' || req.user?.role === 'faculty';
    const isGlobal = (req as any).modulePermission?.isGlobalScope || req.user?.role === 'admin' || req.user?.role === 'super_admin';

    let allowedBatchIds: string[] | null = null;
    if (isTeacherRole && !isGlobal && req.user) {
      let teacherId = req.user.teacherId;
      if (!teacherId && req.user.userId) {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.userId } });
        teacherId = teacher?.id;
      }
      if (teacherId) {
        const batches = await prisma.batch.findMany({
          where: { teacher_id: teacherId, is_active: true },
          select: { id: true }
        });
        const batchSubjects = await prisma.batchSubject.findMany({
          where: { teacher_id: teacherId },
          select: { batch_id: true }
        });
        allowedBatchIds = Array.from(new Set([...batches.map((b) => b.id), ...batchSubjects.map((bs) => bs.batch_id)]));
      } else {
        allowedBatchIds = [];
      }
    }

    if (allowedBatchIds !== null && allowedBatchIds.length === 0) {
      return sendSuccess(res, []);
    }

    if (batchId && allowedBatchIds !== null && !allowedBatchIds.includes(batchId as string)) {
      return sendError(res, 'Forbidden: You do not teach this batch.', 403);
    }

    const records = await prisma.attendance.findMany({
      where: {
        batch_id: batchId ? (batchId as string) : (allowedBatchIds !== null ? { in: allowedBatchIds } : undefined),
        date: date ? (date as string) : undefined,
        student_id: studentId ? (studentId as string) : undefined
      },
      include: {
        student: true,
        batch: true
      },
      orderBy: { date: 'desc' }
    });
    return sendSuccess(res, records);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post(['/attendance/bulk', '/attendance/mark'], authenticateJwt, requireModulePermission('attendance', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, date, entries, records } = req.body;
    const items = entries || records || [];
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Lock retroactive attendance older than 48 hours unless admin
    const today = new Date().toISOString().split('T')[0];
    const diffMs = new Date(today).getTime() - new Date(targetDate).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (diffDays > 2 && !isAdmin) {
      return sendError(res, 'Attendance for dates older than 48 hours is locked. Admin override required.', 403);
    }

    // Faculty Scoping Check
    const isTeacherRole = req.user?.role === 'teacher' || req.user?.role === 'faculty';
    const isGlobal = (req as any).modulePermission?.isGlobalScope || req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (isTeacherRole && !isGlobal && req.user && batchId) {
      let teacherId = req.user.teacherId;
      if (!teacherId && req.user.userId) {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.userId } });
        teacherId = teacher?.id;
      }
      if (teacherId) {
        const isAssigned =
          (await prisma.batch.findFirst({
            where: { id: batchId, teacher_id: teacherId }
          })) ||
          (await prisma.batchSubject.findFirst({
            where: { batch_id: batchId, teacher_id: teacherId }
          }));
        if (!isAssigned) {
          return sendError(res, 'Faculty cannot mark attendance for batches assigned to other teachers', 403);
        }
      } else {
        return sendError(res, 'Faculty cannot mark attendance for batches assigned to other teachers', 403);
      }
    }

    const results = [];
    for (const entry of items) {
      const studentId = entry.studentId || entry.student_id;
      if (studentId) {
        const att = await prisma.attendance.upsert({
          where: {
            batch_id_student_id_date: {
              batch_id: batchId || 'default-batch',
              student_id: studentId,
              date: targetDate
            }
          },
          update: {
            status: entry.status || 'present',
            remark: entry.remark || entry.notes || null,
            marked_by: req.user?.userId || 'admin'
          },
          create: {
            batch_id: batchId || 'default-batch',
            student_id: studentId,
            date: targetDate,
            status: entry.status || 'present',
            remark: entry.remark || entry.notes || null,
            marked_by: req.user?.userId || 'admin'
          }
        });
        results.push(att);
      }
    }

    if (req.user && req.user.userId !== 'admin-id') {
      await createAuditLog(req.user.userId, 'MARK_ATTENDANCE', 'Attendance', batchId || 'bulk', { date: targetDate, count: items.length });
    }

    return sendSuccess(res, results);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   7. FEE MANAGEMENT MODULE (M12 FEE)
   ========================================================================== */
router.get('/fees', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const [payments, invoices] = await Promise.all([
      prisma.feePayment.findMany({
        where: { voided_at: null, cleared_status: { not: 'bounced' } }
      }),
      prisma.feeInvoice.findMany({
        include: {
          feePayments: {
            where: { voided_at: null, cleared_status: { not: 'bounced' } }
          }
        }
      })
    ]);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = invoices.reduce((sum, i) => {
      const invoicePaid = i.feePayments ? i.feePayments.reduce((pSum, p) => pSum + p.amount, 0) : 0;
      const targetAmount = (i.net_amount !== undefined && i.net_amount !== null) ? i.net_amount : (i.amount || 0);
      return sum + Math.max(0, targetAmount - invoicePaid);
    }, 0);
    return sendSuccess(res, {
      totalCollected,
      totalPending,
      paymentCount: payments.length,
      invoiceCount: invoices.length
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/fees/defaulters', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const candidateInvoices = await prisma.feeInvoice.findMany({
      where: {
        status: { in: ['unpaid', 'partial', 'overdue'] },
        due_date: { lt: todayStr }
      },
      include: {
        student: true,
        feePayments: {
          where: { voided_at: null, cleared_status: { not: 'bounced' } }
        }
      },
      orderBy: { due_date: 'asc' }
    });

    const overdueInvoices = candidateInvoices.filter(inv => {
      const paid = inv.feePayments ? inv.feePayments.reduce((sum, p) => sum + p.amount, 0) : 0;
      return (inv.net_amount || inv.amount || 0) > paid;
    });

    return sendSuccess(res, overdueInvoices);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/fees/payments', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const payments = await prisma.feePayment.findMany({
      include: { student: true },
      orderBy: { paid_at: 'desc' }
    });
    return sendSuccess(res, payments);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/fees/payments', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, amount, method, notes, invoiceId, discount, discountRemarks, discount_remarks } = req.body;
    const paymentAmount = Number(amount);
    const adhocDiscount = Math.max(0, Number(discount) || 0);
    const discountReason = discountRemarks || discount_remarks || '';
    
    if (!studentId || isNaN(paymentAmount) || paymentAmount <= 0) {
      return sendError(res, 'Valid studentId and positive amount are required', 400);
    }
    if (adhocDiscount > 0 && !discountReason) {
      return sendError(res, 'A reason is required when applying a discount or waiver.', 400);
    }

    // Determine invoice to link or cascade
    let targetInvoiceId = invoiceId || null;

    if (!targetInvoiceId) {
      // Find oldest unpaid/partial invoice for this student
      const oldestUnpaid = await prisma.feeInvoice.findFirst({
        where: { student_id: studentId, status: { in: ['unpaid', 'partial', 'overdue'] } },
        orderBy: { due_date: 'asc' }
      });
      if (oldestUnpaid) {
        targetInvoiceId = oldestUnpaid.id;
      }
    }

    // If ad-hoc discount is provided and linked to target invoice, apply discount to invoice
    if (targetInvoiceId && adhocDiscount > 0) {
      const inv = await prisma.feeInvoice.findUnique({ where: { id: targetInvoiceId } });
      if (inv) {
        const updatedDiscount = (inv.discount || 0) + adhocDiscount;
        const updatedNetAmount = Math.max(0, inv.amount - updatedDiscount);
        await prisma.feeInvoice.update({
          where: { id: inv.id },
          data: {
            discount: updatedDiscount,
            net_amount: updatedNetAmount
          }
        });
      }
    }

    // Create payment records with atomic sequence numbers and multi-invoice cascading allocation
    const methodNorm = String(method || 'cash').toLowerCase();
    const chequePending = methodNorm === 'cheque';
    const paymentNote = [
      notes || '',
      adhocDiscount > 0 ? `[Ad-hoc Discount: PKR ${adhocDiscount}${discountReason ? ` - Reason: ${discountReason}` : ''}]` : ''
    ].filter(Boolean).join(' ');

    let createdPayments: any[] = [];

    if (invoiceId) {
      // Direct payment targeting a specific invoice
      const receiptNo = await getNextSequenceValue('receipt_no_seq', 'RCP-2026-', 5);
      const payment = await prisma.feePayment.create({
        data: {
          student_id: studentId,
          invoice_id: invoiceId,
          amount: paymentAmount,
          method: methodNorm,
          receipt_no: receiptNo,
          recorded_by: req.user?.userId || 'admin',
          note: paymentNote || null,
          paid_at: new Date(),
          cleared_status: chequePending ? 'pending' : 'cleared',
          credit_applied: 0
        }
      });
      createdPayments.push(payment);

      if (!chequePending) {
        const inv = await prisma.feeInvoice.findUnique({
          where: { id: invoiceId },
          include: { feePayments: true, installmentSchedule: true }
        });
        if (inv) {
          const countablePaid = inv.feePayments
            .filter(p => !p.voided_at && (p.cleared_status || 'cleared') === 'cleared')
            .reduce((sum, p) => sum + p.amount, 0);
          const isNowFullyPaid = countablePaid >= inv.net_amount;
          const newStatus = isNowFullyPaid ? 'paid' : (countablePaid > 0 ? 'partial' : 'unpaid');
          await prisma.feeInvoice.update({
            where: { id: inv.id },
            data: { status: newStatus }
          });
          if (inv.installmentSchedule) {
            await prisma.studentInstallmentSchedule.update({
              where: { id: inv.installmentSchedule.id },
              data: { status: isNowFullyPaid ? 'paid' : 'invoiced' }
            });
          }
          if (countablePaid > inv.net_amount) {
            await prisma.feePayment.update({
              where: { id: payment.id },
              data: { credit_applied: countablePaid - inv.net_amount }
            });
          }
        }
      }
    } else {
      // Cascading payment across unpaid/partial/overdue invoices (CRIT-13)
      const targetInvoices = await prisma.feeInvoice.findMany({
        where: {
          student_id: studentId,
          status: { in: ['unpaid', 'partial', 'overdue'] }
        },
        include: { feePayments: true, installmentSchedule: true },
        orderBy: { due_date: 'asc' }
      });

      let unallocated = paymentAmount;

      for (const inv of targetInvoices) {
        if (unallocated <= 0) break;
        const currentPaid = inv.feePayments
          .filter(p => !p.voided_at && (p.cleared_status || 'cleared') === 'cleared')
          .reduce((sum, p) => sum + p.amount, 0);
        const due = Math.max(0, inv.net_amount - currentPaid);
        if (due <= 0) continue;

        const portion = Math.min(unallocated, due);
        const receiptNo = await getNextSequenceValue('receipt_no_seq', 'RCP-2026-', 5);
        const subPayment = await prisma.feePayment.create({
          data: {
            student_id: studentId,
            invoice_id: inv.id,
            amount: portion,
            method: methodNorm,
            receipt_no: receiptNo,
            recorded_by: req.user?.userId || 'admin',
            note: paymentNote || null,
            paid_at: new Date(),
            cleared_status: chequePending ? 'pending' : 'cleared',
            credit_applied: 0
          }
        });
        createdPayments.push(subPayment);

        if (!chequePending) {
          const newPaid = currentPaid + portion;
          const isNowFullyPaid = newPaid >= inv.net_amount;
          await prisma.feeInvoice.update({
            where: { id: inv.id },
            data: { status: isNowFullyPaid ? 'paid' : 'partial' }
          });
          if (inv.installmentSchedule) {
            await prisma.studentInstallmentSchedule.update({
              where: { id: inv.installmentSchedule.id },
              data: { status: isNowFullyPaid ? 'paid' : 'invoiced' }
            });
          }
        }
        unallocated -= portion;
      }

      // If leftover or no open invoices exist, record advance credit payment
      if (unallocated > 0 || createdPayments.length === 0) {
        const receiptNo = await getNextSequenceValue('receipt_no_seq', 'RCP-2026-', 5);
        const advancePayment = await prisma.feePayment.create({
          data: {
            student_id: studentId,
            invoice_id: null,
            amount: unallocated,
            method: methodNorm,
            receipt_no: receiptNo,
            recorded_by: req.user?.userId || 'admin',
            note: `Advance fee credit payment: ${paymentNote}`.trim(),
            paid_at: new Date(),
            cleared_status: chequePending ? 'pending' : 'cleared',
            credit_applied: unallocated
          }
        });
        createdPayments.push(advancePayment);
      }
    }

    const primaryPayment = createdPayments[0];
    if (req.user && primaryPayment) {
      await createAuditLog(req.user.userId, 'COLLECT_FEE', 'FeePayment', primaryPayment.id, {
        amount: paymentAmount,
        studentId,
        paymentsCount: createdPayments.length
      });
    }

    return sendSuccess(res, primaryPayment, { payments: createdPayments }, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/fees/invoices', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const invoices = await prisma.feeInvoice.findMany({
      include: {
        student: {
          include: { feePlan: true }
        },
        feePayments: true,
        installmentSchedule: true
      },
      orderBy: { due_date: 'desc' }
    });

    const todayStr = formatDateIso(new Date());

    const enriched = invoices.map(inv => {
      const paid = inv.feePayments
        .filter((p: any) => !p.voided_at && (p.cleared_status || 'cleared') === 'cleared')
        .reduce((sum: number, p: any) => sum + p.amount, 0);
      const balance = Math.max(0, inv.net_amount - paid);
      let calculatedStatus = inv.status;
      if (paid >= inv.net_amount) {
        calculatedStatus = 'paid';
      } else if (paid > 0) {
        calculatedStatus = 'partial';
      } else if (inv.due_date < todayStr) {
        calculatedStatus = 'overdue';
      } else {
        calculatedStatus = 'unpaid';
      }

      return {
        ...inv,
        paidAmount: paid,
        balanceAmount: balance,
        status: calculatedStatus
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/fees/invoices/generate', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { cycleDate } = req.body;
    const targetDateStr = cycleDate || formatDateIso(new Date());

    const students = await prisma.student.findMany({
      where: { status: 'active', is_fee_paused: false },
      include: { feePlan: true }
    });

    const generated = [];
    for (const student of students) {
      const amount = student.feePlan?.monthly_amount || 5000;
      const discount = student.feePlan?.discount || 0;
      const netAmount = Math.max(0, amount - discount);
      const anchorDay = student.feePlan?.billing_anchor_day || 1;

      // Compute cycle period with date clamping and 5-day due date
      const cycle = calculateCyclePeriod(anchorDay, targetDateStr);
      const periodKey = `${student.admission_no || student.id.slice(0, 4)}-${cycle.periodStart}`;

      const invoice = await prisma.feeInvoice.upsert({
        where: {
          student_id_period: {
            student_id: student.id,
            period: periodKey
          }
        },
        update: {
          amount,
          discount,
          net_amount: netAmount,
          fee_period_start: cycle.periodStart,
          fee_period_end: cycle.periodEnd,
          due_date: cycle.dueDate,
          billing_anchor_day: anchorDay
        },
        create: {
          student_id: student.id,
          period: periodKey,
          fee_period_start: cycle.periodStart,
          fee_period_end: cycle.periodEnd,
          amount,
          discount,
          net_amount: netAmount,
          due_date: cycle.dueDate,
          billing_anchor_day: anchorDay,
          status: 'unpaid'
        }
      });
      generated.push(invoice);
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'GENERATE_MONTHLY_INVOICES', 'FeeInvoice', targetDateStr, { count: generated.length });
    }

    return sendSuccess(res, {
      cycleDate: targetDateStr,
      generatedCount: generated.length,
      invoices: generated
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* Recurring Cron Trigger for Course Installments Auto-Generation */
router.post('/cron/billing/generate-installments', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const todayStr = formatDateIso(new Date());

    // Find scheduled installments whose fee_period_start has arrived (or within 5 days) and have no invoice_id yet
    const pendingInstallments = await prisma.studentInstallmentSchedule.findMany({
      where: {
        status: 'scheduled',
        invoice_id: null,
        fee_period_start: { lte: todayStr }
      },
      include: {
        enrollment: {
          include: {
            batch: true,
            student: true
          }
        }
      }
    });

    const generatedInvoices = [];
    for (const item of pendingInstallments) {
      const student = item.enrollment.student;
      const batch = item.enrollment.batch;
      const voucherPeriod = `INST-${item.installment_number}-${batch.name.replace(/\s+/g, '-').slice(0, 10)}-${student.admission_no || student.id.slice(0, 4)}`;

      const invoice = await prisma.feeInvoice.create({
        data: {
          student_id: student.id,
          period: voucherPeriod,
          fee_period_start: item.fee_period_start,
          fee_period_end: item.fee_period_end,
          amount: item.amount,
          discount: 0,
          net_amount: item.amount,
          due_date: item.due_date,
          billing_anchor_day: parseDateIso(item.fee_period_start).getDate(),
          installment_number: item.installment_number,
          total_installments: item.total_installments,
          status: 'unpaid'
        }
      });

      await prisma.studentInstallmentSchedule.update({
        where: { id: item.id },
        data: { invoice_id: invoice.id }
      });

      generatedInvoices.push({
        installmentId: item.id,
        studentName: student.full_name,
        invoiceId: invoice.id,
        amount: item.amount,
        dueDate: item.due_date
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'CRON_GENERATE_INSTALLMENTS', 'StudentInstallmentSchedule', todayStr, { count: generatedInvoices.length });
    }

    return sendSuccess(res, {
      triggeredAt: todayStr,
      generatedCount: generatedInvoices.length,
      vouchers: generatedInvoices
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/fees/ledger/:studentId', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const [invoices, payments, student, installmentSchedules] = await Promise.all([
      prisma.feeInvoice.findMany({
        where: { student_id: studentId },
        include: { feePayments: true },
        orderBy: { due_date: 'desc' }
      }),
      prisma.feePayment.findMany({
        where: { student_id: studentId },
        orderBy: { paid_at: 'desc' }
      }),
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          feePlan: true,
          enrollments: { include: { batch: true } }
        }
      }),
      prisma.studentInstallmentSchedule.findMany({
        where: {
          enrollment: { student_id: studentId }
        },
        include: {
          enrollment: { include: { batch: true } },
          invoice: true
        },
        orderBy: { installment_number: 'asc' }
      })
    ]);

    if (!student) return sendError(res, 'Student not found', 404);

    return sendSuccess(res, {
      student,
      invoices,
      payments,
      installmentSchedules
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   8. ANNOUNCEMENTS & INQUIRIES (M13 INQ & M14 COM)
   ========================================================================== */
router.get('/announcements', authenticateJwt, requireModulePermission('announcements', 'view_only'), listAnnouncements);
router.post('/announcements', authenticateJwt, requireModulePermission('announcements', 'editable'), createAnnouncement);
router.put('/announcements/:id', authenticateJwt, requireModulePermission('announcements', 'editable'), updateAnnouncement);
router.delete('/announcements/:id', authenticateJwt, requireModulePermission('announcements', 'editable'), deleteAnnouncement);

router.get('/inquiries', authenticateJwt, requireModulePermission('crm', 'view_only'), listInquiries);
router.get('/inquiries/duplicates', authenticateJwt, requireModulePermission('crm', 'view_only'), findDuplicatePhones);
router.post('/inquiries', authenticateJwt, requireModulePermission('crm', 'editable'), createInquiry);
router.put('/inquiries/:id', authenticateJwt, requireModulePermission('crm', 'editable'), updateInquiry);
router.post('/inquiries/:id/follow-ups', authenticateJwt, requireModulePermission('crm', 'editable'), addInquiryFollowUp);

router.get('/fees/day-end', authenticateJwt, requireModulePermission('fees', 'view_only'), getDayEnd);
router.post('/fees/payments/:id/void', authenticateJwt, requireAdmin, voidPayment);
router.post('/fees/payments/:id/cheque', authenticateJwt, requireAdmin, setChequeStatus);

/* ==========================================================================
   9. ACADEMIC MODULES — HOMEWORK, MATERIALS, EXAMS (M9 HW, M10 SM, M11 EX)
   ========================================================================== */
router.get('/homework', authenticateJwt, requireModulePermission('homework', 'view_only'), listHomework);

router.post('/homework', authenticateJwt, requireModulePermission('homework', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, subjectId, teacherId, title, description, dueDate } = req.body;

    if (!batchId || !subjectId || !title) {
      return sendError(res, 'Batch, subject, and title are required to create homework.', 400);
    }

    // Faculty Scoping Check (HIGH-01)
    const isTeacherRole = req.user?.role === 'teacher' || req.user?.role === 'faculty';
    const isGlobal = (req as any).modulePermission?.isGlobalScope || req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (isTeacherRole && !isGlobal && req.user && batchId) {
      let teacherIdVal = req.user.teacherId;
      if (!teacherIdVal && req.user.userId) {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.userId } });
        teacherIdVal = teacher?.id;
      }
      if (teacherIdVal) {
        const isAssigned =
          (await prisma.batch.findFirst({
            where: { id: batchId, teacher_id: teacherIdVal }
          })) ||
          (await prisma.batchSubject.findFirst({
            where: { batch_id: batchId, teacher_id: teacherIdVal }
          }));
        if (!isAssigned) {
          return sendError(res, 'Faculty cannot create homework for batches assigned to other teachers', 403);
        }
      } else {
        return sendError(res, 'Faculty cannot create homework for batches assigned to other teachers', 403);
      }
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    const resolvedTeacher = teacherId || batch?.teacher_id;
    if (!resolvedTeacher) {
      return sendError(res, 'Assign a teacher to the batch, or pick a teacher on the homework.', 400);
    }

    const hw = await prisma.homework.create({
      data: {
        batch_id: batchId,
        subject_id: subjectId,
        teacher_id: resolvedTeacher,
        title,
        description: description || '',
        due_date: dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      }
    });
    return sendSuccess(res, hw, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/study-materials', authenticateJwt, requireModulePermission('homework', 'view_only'), async (req, res) => {
  try {
    const list = await prisma.studyMaterial.findMany({
      include: { batch: true, subject: true, teacher: { include: { user: true } } },
      orderBy: { created_at: 'desc' }
    });
    return sendSuccess(res, list);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/study-materials', authenticateJwt, requireModulePermission('homework', 'editable'), createStudyMaterial);
router.delete('/study-materials/:id', authenticateJwt, requireModulePermission('homework', 'editable'), deleteStudyMaterial);

router.get('/tests', authenticateJwt, requireModulePermission('exams', 'view_only'), async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: { batch: true, subject: true, testMarks: { include: { student: true } } },
      orderBy: { exam_date: 'desc' }
    });
    return sendSuccess(res, tests);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/tests', authenticateJwt, requireModulePermission('exams', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, subjectId, title, examDate, maxMarks, passMarks } = req.body;
    if (!batchId || !subjectId || !title) {
      return sendError(res, 'Batch, subject, and title are required to create a test.', 400);
    }

    const test = await prisma.test.create({
      data: {
        batch_id: batchId,
        subject_id: subjectId,
        title,
        exam_date: examDate || new Date().toISOString().split('T')[0],
        max_marks: Number(maxMarks) || 100,
        pass_marks: Number(passMarks) || 40,
        is_published: false
      }
    });
    return sendSuccess(res, test, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/tests/:id/roster', authenticateJwt, requireModulePermission('exams', 'view_only'), getTestRoster);
router.post('/tests/:id/marks', authenticateJwt, requireModulePermission('exams', 'editable'), saveTestMarksGuarded);

router.put('/tests/:id', authenticateJwt, requireModulePermission('exams', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, examDate, maxMarks, passMarks, isPublished } = req.body;

    const updated = await prisma.test.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(examDate && { exam_date: examDate }),
        ...(maxMarks !== undefined && { max_marks: Number(maxMarks) }),
        ...(passMarks !== undefined && { pass_marks: Number(passMarks) }),
        ...(isPublished !== undefined && { is_published: Boolean(isPublished) })
      },
      include: { batch: true, subject: true }
    });

    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/tests/:id', authenticateJwt, requireModulePermission('exams', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) return sendError(res, 'Test not found.', 404);
    if (test.is_published && req.query.confirm !== 'true') {
      return sendError(res, 'Published tests cannot be deleted without confirm=true.', 409);
    }
    await prisma.testMark.deleteMany({ where: { test_id: id } });
    await prisma.test.delete({ where: { id } });
    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   TIMETABLE & ROOM CONFLICT SOLVER
   ========================================================================== */
router.get('/timetable', authenticateJwt, requireModulePermission('timetable', 'view_only'), async (req, res) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      include: {
        batch: { include: { class: true } },
        subject: true,
        teacher: { include: { user: true } }
      },
      orderBy: [
        { day: 'asc' },
        { start_time: 'asc' }
      ]
    });
    return sendSuccess(res, slots);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/timetable', authenticateJwt, requireModulePermission('timetable', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { day, startTime, endTime, room, batchId, subjectId, teacherId, topic } = req.body;

    if (!day || !startTime || !endTime || !batchId) {
      return sendError(res, 'Day, start time, end time, and batch are required.', 400);
    }
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins === null || endMins === null) {
      return sendError(res, 'Start and end time must be valid (HH:MM or h:mm AM/PM).', 400);
    }
    if (endMins <= startMins) {
      return sendError(res, 'End time must be after start time. Overnight slots are not allowed.', 400);
    }

    const sameDaySlots = await prisma.timetableSlot.findMany({
      where: { day },
      include: { batch: true, teacher: { include: { user: true } } }
    });

    if (room) {
      const roomConflict = sameDaySlots.find(slot =>
        slot.room &&
        slot.room.toLowerCase() === String(room).toLowerCase() &&
        timeRangesOverlap(startTime, endTime, slot.start_time, slot.end_time)
      );
      if (roomConflict) {
        return sendError(
          res,
          `Room conflict: ${room} is already booked for "${roomConflict.batch?.name}" (${roomConflict.start_time}–${roomConflict.end_time}) on ${day}.`,
          409
        );
      }
    }

    if (teacherId) {
      const teacherConflict = sameDaySlots.find(slot =>
        slot.teacher_id === teacherId &&
        timeRangesOverlap(startTime, endTime, slot.start_time, slot.end_time)
      );
      if (teacherConflict) {
        const teacherName = teacherConflict.teacher?.user?.full_name || 'Assigned faculty';
        return sendError(
          res,
          `Teacher collision: ${teacherName} is already assigned to "${teacherConflict.batch?.name}" (${teacherConflict.start_time}–${teacherConflict.end_time}) on ${day}.`,
          409
        );
      }
    }

    const batchConflict = sameDaySlots.find(slot =>
      slot.batch_id === batchId &&
      timeRangesOverlap(startTime, endTime, slot.start_time, slot.end_time)
    );
    if (batchConflict) {
      return sendError(
        res,
        `Batch collision: "${batchConflict.batch?.name || 'This batch'}" is already scheduled for another class (${batchConflict.start_time}–${batchConflict.end_time}) on ${day}.`,
        409
      );
    }

    const createdSlot = await prisma.timetableSlot.create({
      data: {
        day,
        start_time: startTime,
        end_time: endTime,
        room,
        batch_id: batchId,
        subject_id: subjectId || null,
        teacher_id: teacherId || null,
        topic: topic || null
      },
      include: {
        batch: { include: { class: true } },
        subject: true,
        teacher: { include: { user: true } }
      }
    });

    return sendSuccess(res, createdSlot, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/timetable/:id', authenticateJwt, requireModulePermission('timetable', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.timetableSlot.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Timetable slot not found.', 404);

    const day = req.body.day || existing.day;
    const startTime = req.body.startTime || req.body.start_time || existing.start_time;
    const endTime = req.body.endTime || req.body.end_time || existing.end_time;
    const room = req.body.room !== undefined ? req.body.room : existing.room;
    const batchId = req.body.batchId || req.body.batch_id || existing.batch_id;
    const subjectId = req.body.subjectId !== undefined ? req.body.subjectId : existing.subject_id;
    const teacherId = req.body.teacherId !== undefined ? req.body.teacherId : existing.teacher_id;
    const topic = req.body.topic !== undefined ? req.body.topic : existing.topic;

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins === null || endMins === null || endMins <= startMins) {
      return sendError(res, 'End time must be after a valid start time.', 400);
    }

    const sameDaySlots = await prisma.timetableSlot.findMany({
      where: { day, id: { not: existing.id } },
      include: { batch: true, teacher: { include: { user: true } } }
    });

    if (room) {
      const roomConflict = sameDaySlots.find(slot =>
        slot.room &&
        slot.room.toLowerCase() === String(room).toLowerCase() &&
        timeRangesOverlap(startTime, endTime, slot.start_time, slot.end_time)
      );
      if (roomConflict) {
        return sendError(res, `Room conflict: ${room} is booked for "${roomConflict.batch?.name}" on ${day}.`, 409);
      }
    }
    if (teacherId) {
      const teacherConflict = sameDaySlots.find(slot =>
        slot.teacher_id === teacherId &&
        timeRangesOverlap(startTime, endTime, slot.start_time, slot.end_time)
      );
      if (teacherConflict) {
        return sendError(res, `Teacher collision with "${teacherConflict.batch?.name}" on ${day}.`, 409);
      }
    }

    const updated = await prisma.timetableSlot.update({
      where: { id: existing.id },
      data: {
        day,
        start_time: startTime,
        end_time: endTime,
        room: room || '',
        batch_id: batchId,
        subject_id: subjectId || null,
        teacher_id: teacherId || null,
        topic: topic || null
      },
      include: {
        batch: { include: { class: true } },
        subject: true,
        teacher: { include: { user: true } }
      }
    });
    return sendSuccess(res, updated);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/timetable/:id', authenticateJwt, requireModulePermission('timetable', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.timetableSlot.delete({ where: { id } });
    return sendSuccess(res, { deleted: true, id });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   WHATSAPP NOTIFICATION DISPATCHER & AUTOMATION ENGINE
   ========================================================================== */
router.get('/whatsapp/templates', authenticateJwt, requireModulePermission('whatsapp', 'view_only'), listWhatsAppTemplates);
router.put('/whatsapp/templates/:code', authenticateJwt, requireModulePermission('whatsapp', 'editable'), upsertWhatsAppTemplate);
router.get('/whatsapp/logs', authenticateJwt, requireModulePermission('whatsapp', 'view_only'), listWhatsAppLogs);
router.get('/whatsapp/preview', authenticateJwt, requireModulePermission('whatsapp', 'view_only'), previewWhatsApp);
router.post('/whatsapp/send', authenticateJwt, requireModulePermission('whatsapp', 'editable'), sendWhatsApp);
router.post('/whatsapp/dispatch-absence-alerts', authenticateJwt, requireModulePermission('whatsapp', 'editable'), dispatchAbsenceAlerts);
router.post('/whatsapp/dispatch-fee-reminders', authenticateJwt, requireModulePermission('whatsapp', 'editable'), dispatchFeeReminders);

router.get('/students/:id/report-card', authenticateJwt, requireModulePermission('academics', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id: studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            batch: {
              include: {
                batchSubjects: {
                  include: { subject: true }
                }
              }
            }
          }
        },
        testMarks: {
          include: {
            test: {
              include: { subject: true, batch: true }
            }
          }
        },
        attendances: true,
        parentStudents: {
          include: {
            parent: true
          }
        }
      }
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // 1. Group test marks by subject
    const subjectMap = new Map<string, {
      subjectId: string;
      subjectName: string;
      testsTaken: number;
      totalObtained: number;
      totalMax: number;
      remarks: string[];
    }>();

    // Initialize with enrolled subjects
    for (const enr of student.enrollments) {
      for (const bs of enr.batch.batchSubjects) {
        if (bs.subject && !subjectMap.has(bs.subject.id)) {
          subjectMap.set(bs.subject.id, {
            subjectId: bs.subject.id,
            subjectName: bs.subject.name,
            testsTaken: 0,
            totalObtained: 0,
            totalMax: 0,
            remarks: []
          });
        }
      }
    }

    // Populate with real marks
    for (const tm of student.testMarks) {
      const subId = tm.test.subject_id || (tm.test.subject ? tm.test.subject.id : 'general');
      const subName = tm.test.subject ? tm.test.subject.name : tm.test.title;

      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          subjectName: subName,
          testsTaken: 0,
          totalObtained: 0,
          totalMax: 0,
          remarks: []
        });
      }

      const rec = subjectMap.get(subId)!;
      rec.testsTaken += 1;
      rec.totalObtained += Number(tm.marks) || 0;
      rec.totalMax += Number(tm.test.max_marks) || 100;
      if (tm.remark) rec.remarks.push(tm.remark);
    }

    // Calculate subject percentages & letter grades
    const getLetterGrade = (percentage: number) => {
      if (percentage >= 90) return { grade: 'A+', label: 'Outstanding' };
      if (percentage >= 80) return { grade: 'A', label: 'Excellent' };
      if (percentage >= 70) return { grade: 'B+', label: 'Very Good' };
      if (percentage >= 60) return { grade: 'B', label: 'Good' };
      if (percentage >= 50) return { grade: 'C', label: 'Satisfactory' };
      return { grade: 'F', label: 'Needs Improvement' };
    };

    const subjectBreakdown = Array.from(subjectMap.values()).map(sub => {
      const max = sub.totalMax > 0 ? sub.totalMax : 100;
      const obtained = sub.totalObtained;
      const percentage = Math.round((obtained / max) * 1000) / 10;
      const { grade, label } = getLetterGrade(percentage);

      return {
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        testsCount: sub.testsTaken,
        totalMax: max,
        obtainedMarks: obtained,
        percentage,
        grade,
        performanceLabel: label,
        isPass: percentage >= 40,
        remarks: sub.remarks.join('; ') || 'Satisfactory academic progress'
      };
    });

    const cumulativeMax = subjectBreakdown.reduce((sum, s) => sum + s.totalMax, 0);
    const cumulativeObtained = subjectBreakdown.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const overallPercentage = cumulativeMax > 0 ? Math.round((cumulativeObtained / cumulativeMax) * 1000) / 10 : 0;
    const overallGradeInfo = getLetterGrade(overallPercentage);

    // 2. Attendance Summary
    const totalDays = student.attendances.length;
    const presentDays = student.attendances.filter(a => a.status === 'present').length;
    const lateDays = student.attendances.filter(a => a.status === 'late').length;
    const absentDays = student.attendances.filter(a => a.status === 'absent').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 100;

    const parentName = student.parentStudents?.[0]?.parent?.full_name || 'Parent / Guardian';

    const reportCard = {
      studentId: student.id,
      studentName: student.full_name,
      regNo: student.admission_no,
      parentName,
      batchName: student.enrollments[0]?.batch?.name || 'General Academic Cohort',
      academicSession: 'Academic Session 2026-2027',
      issuedDate: new Date().toISOString().split('T')[0],
      subjects: subjectBreakdown,
      summary: {
        totalSubjects: subjectBreakdown.length,
        cumulativeMax,
        cumulativeObtained,
        overallPercentage,
        overallGrade: overallGradeInfo.grade,
        performanceEvaluation: overallGradeInfo.label,
        status: overallPercentage >= 50 ? 'Promoted' : 'Conditional Pass'
      },
      attendance: {
        totalDays: totalDays > 0 ? totalDays : 30,
        presentDays: totalDays > 0 ? presentDays : 28,
        lateDays: totalDays > 0 ? lateDays : 1,
        absentDays: totalDays > 0 ? absentDays : 1,
        attendancePercentage: totalDays > 0 ? attendancePercentage : 93.3
      }
    };

    return sendSuccess(res, reportCard);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   10. SETTINGS & AUDIT LOGS (M17 SYS)
   ========================================================================== */
router.get('/audit-logs', authenticateJwt, requireModulePermission('reports', 'view_only'), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
      take: 100
    });
    return sendSuccess(res, logs);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/settings', authenticateJwt, requireModulePermission('settings', 'view_only'), async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const configMap: Record<string, any> = {};
    settings.forEach(s => {
      try { configMap[s.key] = JSON.parse(s.value); } catch { configMap[s.key] = s.value; }
    });
    return sendSuccess(res, configMap);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/settings', authenticateJwt, requireModulePermission('settings', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { key, value } = req.body;
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value: strValue },
      create: { key, value: strValue }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'UPDATE_SETTING', 'AppSetting', key, { value });
    }

    return sendSuccess(res, setting);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   12. SUBJECT MANAGEMENT (M12 SUB)
   ========================================================================== */
router.get('/subjects', authenticateJwt, requireModulePermission('batches', 'view_only'), getSubjectCatalog);

router.post('/subjects', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return sendError(res, 'Name and code are required', 400);

    const subject = await prisma.subject.create({
      data: { name, code: code.toUpperCase() }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'CREATE_SUBJECT', 'Subject', subject.id, { name, code });
    }

    return sendSuccess(res, subject, null, 201);
  } catch (err: any) {
    if (err.code === 'P2002') return sendError(res, 'Subject code already exists', 409);
    return sendError(res, err.message, 500);
  }
});

router.put('/subjects/:id', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() })
      }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'UPDATE_SUBJECT', 'Subject', id, { name, code });
    }

    return sendSuccess(res, subject);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/subjects/:id', authenticateJwt, requireModulePermission('batches', 'editable'), deleteSubjectSafe);

/* ==========================================================================
   13. BATCH-SUBJECT ASSIGNMENTS (M13 BSA)
   ========================================================================== */
router.get('/batches/:id/subjects', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await prisma.batchSubject.findMany({
      where: { batch_id: id },
      include: {
        subject: true,
        teacher: { include: { user: true } }
      }
    });
    return sendSuccess(res, assignments);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/subjects', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { subjectId, teacherId } = req.body;

    if (!subjectId || !teacherId) return sendError(res, 'subjectId and teacherId are required', 400);

    const assignment = await prisma.batchSubject.create({
      data: {
        batch_id: id,
        subject_id: subjectId,
        teacher_id: teacherId
      },
      include: {
        subject: true,
        teacher: { include: { user: true } }
      }
    });

    return sendSuccess(res, assignment, null, 201);
  } catch (err: any) {
    if (err.code === 'P2002') return sendError(res, 'This subject is already assigned to this batch', 409);
    return sendError(res, err.message, 500);
  }
});

router.delete('/batches/:batchId/subjects/:subjectId', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, subjectId } = req.params;
    await prisma.batchSubject.delete({
      where: { batch_id_subject_id: { batch_id: batchId, subject_id: subjectId } }
    });
    return sendSuccess(res, { deleted: true });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   14. BATCH ENROLLED STUDENTS (M14 BES)
   ========================================================================== */
router.get('/batches/:id/students', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const enrollments = await prisma.enrollment.findMany({
      where: { batch_id: id, status: 'active' },
      include: {
        student: true
      },
      orderBy: { enrolled_on: 'desc' }
    });
    return sendSuccess(res, enrollments);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.delete('/batches/:batchId/enroll/:studentId', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, studentId } = req.params;
    await prisma.enrollment.deleteMany({
      where: { batch_id: batchId, student_id: studentId }
    });
    return sendSuccess(res, { removed: true });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   15. STUDENT ENROLLMENTS (M15 ENR)
   ========================================================================== */
router.get('/students/:id/enrollments', authenticateJwt, requireModulePermission('students', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: id },
      include: { batch: { include: { class: true, teacher: { include: { user: true } } } } },
      orderBy: { enrolled_on: 'desc' }
    });
    return sendSuccess(res, enrollments);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   16. STUDENT LEAVE MANAGEMENT (M16 LVE)
   ========================================================================== */
router.get('/leaves', authenticateJwt, requireModulePermission('attendance', 'view_only'), async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({
      include: { student: true },
      orderBy: { from_date: 'desc' }
    });
    return sendSuccess(res, leaves);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/leaves', authenticateJwt, requireModulePermission('attendance', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, fromDate, toDate, reason } = req.body;
    if (!studentId || !fromDate || !toDate || !reason) {
      return sendError(res, 'studentId, fromDate, toDate, and reason are required', 400);
    }

    const leave = await prisma.leave.create({
      data: {
        student_id: studentId,
        requester_id: req.user?.userId || studentId,
        from_date: fromDate,
        to_date: toDate,
        reason,
        status: 'pending'
      },
      include: { student: true }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'CREATE_LEAVE_REQUEST', 'Leave', leave.id, { studentId, fromDate, toDate });
    }

    return sendSuccess(res, leave, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/leaves/:id', authenticateJwt, requireModulePermission('attendance', 'editable'), decideLeave);

/* ==========================================================================
   17. BULK CLASS PROMOTION & TRANSFER (M17 PRM)
   ========================================================================== */
router.post('/students/promote', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { sourceBatchId, targetBatchId, studentIds } = req.body;
    if (!sourceBatchId || !targetBatchId || !Array.isArray(studentIds)) {
      return sendError(res, 'sourceBatchId, targetBatchId, and studentIds array are required', 400);
    }

    // Move students to target batch
    const targetBatch = await prisma.batch.findUnique({ where: { id: targetBatchId } });

    for (const studentId of studentIds) {
      // 1. Mark old enrollment as completed
      await prisma.enrollment.updateMany({
        where: { student_id: studentId, batch_id: sourceBatchId },
        data: { status: 'completed' }
      });

      // 2. Create new enrollment in target batch
      await prisma.enrollment.upsert({
        where: { student_id_batch_id: { student_id: studentId, batch_id: targetBatchId } },
        update: { status: 'active' },
        create: { student_id: studentId, batch_id: targetBatchId, status: 'active' }
      });
    }

    if (targetBatch?.class_id) {
      await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { class_id: targetBatch.class_id }
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'BULK_PROMOTE_STUDENTS', 'Student', sourceBatchId, { targetBatchId, count: studentIds.length });
    }

    return sendSuccess(res, { promotedCount: studentIds.length });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/students/transfer', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, targetBatchId, reason } = req.body;
    if (!studentId || !targetBatchId) {
      return sendError(res, 'studentId and targetBatchId are required', 400);
    }

    const targetBatch = await prisma.batch.findUnique({ where: { id: targetBatchId } });

    // Create active enrollment in new batch
    const enrollment = await prisma.enrollment.upsert({
      where: { student_id_batch_id: { student_id: studentId, batch_id: targetBatchId } },
      update: { status: 'active' },
      create: { student_id: studentId, batch_id: targetBatchId, status: 'active' }
    });

    if (targetBatch?.class_id) {
      await prisma.student.update({
        where: { id: studentId },
        data: { class_id: targetBatch.class_id }
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'TRANSFER_STUDENT_BATCH', 'Student', studentId, { targetBatchId, reason });
    }

    return sendSuccess(res, enrollment);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   18. FACULTY OPERATIONS & SUBSTITUTION (M18 SUB)
   ========================================================================== */
router.get('/batches/:id/waitlist', authenticateJwt, requireModulePermission('batches', 'view_only'), getBatchWaitlist);
router.post('/batches/:id/waitlist', authenticateJwt, requireModulePermission('batches', 'editable'), addBatchWaitlist);
router.post('/batches/:id/waitlist/promote', authenticateJwt, requireModulePermission('batches', 'editable'), promoteWaitlist);
router.delete('/batches/:id/waitlist/:studentId', authenticateJwt, requireModulePermission('batches', 'editable'), removeWaitlist);
router.post('/batches/:id/archive', authenticateJwt, requireModulePermission('batches', 'editable'), archiveBatch);
router.get('/batches/:id/substitutes', authenticateJwt, requireModulePermission('timetable', 'view_only'), listSubstitutes);
router.post('/batches/:id/substitute', authenticateJwt, requireModulePermission('timetable', 'editable'), createSubstitute);
router.post('/timetable/copy-day', authenticateJwt, requireModulePermission('timetable', 'editable'), copyTimetableDay);

router.post('/batches/:id/co-teacher', authenticateJwt, requireModulePermission('timetable', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { coTeacherId, coTeacherName } = req.body;

    const key = `coteacher_batch_${id}`;
    const record = { coTeacherId, coTeacherName, assignedAt: new Date() };

    await prisma.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(record) },
      create: { key, value: JSON.stringify(record) }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'ASSIGN_CO_TEACHER', 'Batch', id, { coTeacherName });
    }

    return sendSuccess(res, record);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   19. CLASS SPLITTING & FEE STRUCTURES (M19 SPL)
   ========================================================================== */
router.post('/batches/:id/split', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { newBatchName, newRoom } = req.body;

    // 1. Fetch original batch
    const sourceBatch = await prisma.batch.findUnique({ where: { id } });
    if (!sourceBatch) return sendError(res, 'Source batch not found', 404);

    // 2. Create new batch section
    const newBatch = await prisma.batch.create({
      data: {
        name: newBatchName || `${sourceBatch.name} - Sec B`,
        class_id: sourceBatch.class_id,
        teacher_id: sourceBatch.teacher_id,
        days: sourceBatch.days,
        start_time: sourceBatch.start_time,
        end_time: sourceBatch.end_time,
        capacity: sourceBatch.capacity
      }
    });

    // 3. Redistribute half the active enrollments to the new section
    const enrollments = await prisma.enrollment.findMany({ where: { batch_id: id, status: 'active' } });
    const halfCount = Math.floor(enrollments.length / 2);
    const toMove = enrollments.slice(0, halfCount);

    for (const enr of toMove) {
      await prisma.enrollment.update({
        where: { id: enr.id },
        data: { batch_id: newBatch.id }
      });
    }

    if (req.user) {
      await createAuditLog(req.user.userId, 'SPLIT_CLASS_BATCH', 'Batch', id, { newBatchId: newBatch.id, movedStudents: halfCount });
    }

    return sendSuccess(res, { newBatch, movedStudents: halfCount });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/batches/:id/fee-structures', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const structures = await prisma.feeStructure.findMany({ where: { batch_id: id } });
    return sendSuccess(res, structures);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/fee-structures', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { feeType, amount, frequency } = req.body;

    const structure = await prisma.feeStructure.create({
      data: {
        batch_id: id,
        fee_type: feeType || 'tuition',
        amount: Number(amount) || 0,
        frequency: frequency || 'monthly'
      }
    });

    return sendSuccess(res, structure, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   20. STUDENT FEE PLAN & SCHOLARSHIP OVERRIDE (M20 SCH)
   ========================================================================== */
router.get('/students/:id/fee-plan', authenticateJwt, requireModulePermission('fees', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.studentFeePlan.findUnique({ where: { student_id: id } });
    return sendSuccess(res, plan);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/students/:id/fee-plan', authenticateJwt, requireModulePermission('fees', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { monthlyAmount, discount, dueDay, notes } = req.body;

    const plan = await prisma.studentFeePlan.upsert({
      where: { student_id: id },
      update: {
        monthly_amount: Number(monthlyAmount),
        discount: Number(discount) || 0,
        due_day: Number(dueDay) || 5,
        notes
      },
      create: {
        student_id: id,
        monthly_amount: Number(monthlyAmount),
        discount: Number(discount) || 0,
        due_day: Number(dueDay) || 5,
        notes
      }
    });

    if (req.user) {
      await createAuditLog(req.user.userId, 'SAVE_STUDENT_FEE_PLAN', 'Student', id, { monthlyAmount, discount });
    }

    return sendSuccess(res, plan);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   21. SYLLABUS PROGRESS & CLASS DIARY (M21 SYL)
   ========================================================================== */
router.get('/batches/:id/syllabus', authenticateJwt, requireModulePermission('batches', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const key = `syllabus_batch_${id}`;
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    const topics = setting && setting.value ? JSON.parse(setting.value) : [];
    return sendSuccess(res, topics);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/syllabus', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { topicName, chapter, estimatedHours } = req.body;

    const key = `syllabus_batch_${id}`;
    const existingSetting = await prisma.appSetting.findUnique({ where: { key } });
    const existing = existingSetting && existingSetting.value ? JSON.parse(existingSetting.value) : [];

    const newTopic = {
      id: `top_${Date.now()}`,
      topicName,
      chapter: chapter || 'General',
      estimatedHours: Number(estimatedHours) || 2,
      isCovered: false,
      coveredAt: null
    };

    const updated = [...existing, newTopic];
    await prisma.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(updated) },
      create: { key, value: JSON.stringify(updated) }
    });

    return sendSuccess(res, newTopic, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.put('/syllabus/:batchId/:topicId', authenticateJwt, requireModulePermission('batches', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { batchId, topicId } = req.params;
    const { isCovered } = req.body;

    const key = `syllabus_batch_${batchId}`;
    const existingSetting = await prisma.appSetting.findUnique({ where: { key } });
    const existing = existingSetting && existingSetting.value ? JSON.parse(existingSetting.value) : [];

    const updated = existing.map((t: any) => t.id === topicId ? { ...t, isCovered: Boolean(isCovered), coveredAt: isCovered ? new Date() : null } : t);

    await prisma.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(updated) },
      create: { key, value: JSON.stringify(updated) }
    });

    return sendSuccess(res, { updated: true });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   22. DAILY CLASS DIARY & HOMEWORK SUBMISSIONS (M22 DIR)
   ========================================================================== */
router.get('/batches/:id/diaries', authenticateJwt, requireModulePermission('homework', 'view_only'), async (req, res) => {
  try {
    const { id } = req.params;
    const key = `diaries_batch_${id}`;
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    const diaries = setting && setting.value ? JSON.parse(setting.value) : [];
    return sendSuccess(res, diaries);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/batches/:id/diaries', authenticateJwt, requireModulePermission('homework', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { topicTaught, homeworkAssigned, date, teacherName } = req.body;

    const key = `diaries_batch_${id}`;
    const existingSetting = await prisma.appSetting.findUnique({ where: { key } });
    const existing = existingSetting && existingSetting.value ? JSON.parse(existingSetting.value) : [];

    const entry = {
      id: `dir_${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      topicTaught,
      homeworkAssigned: homeworkAssigned || 'None',
      teacherName: teacherName || req.user?.userId || 'Faculty'
    };

    const updated = [entry, ...existing];
    await prisma.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(updated) },
      create: { key, value: JSON.stringify(updated) }
    });

    return sendSuccess(res, entry, null, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/homework/:id/submissions', authenticateJwt, requireModulePermission('homework', 'view_only'), getHomeworkRoster);
router.post('/homework/:id/submissions', authenticateJwt, requireModulePermission('homework', 'editable'), saveHomeworkRoster);

import { createConductLogSchema, updateConductLogSchema } from './validations/conductLogValidation';
import { canModifyConductLog, canViewConductLog } from './common/auth';

/* ==========================================================================
   22. STUDENT CONDUCT & BEHAVIOR LOGS MODULE (M16 RBAC)
   ========================================================================== */

router.get('/conduct-logs', authenticateJwt, requireModulePermission('students', 'view_only'), listConductDesk);

// GET /students/:studentId/conduct-logs
router.get('/students/:studentId/conduct-logs', authenticateJwt, requireModulePermission('students', 'view_only'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId } = req.params;
    const user = req.user;

    const isRestricted = user?.role === 'student' || user?.role === 'parent';

    if (user?.role === 'student') {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (student?.user_id && student.user_id !== user.userId) {
        return sendError(res, 'Forbidden: You can only view your own conduct logs', 403);
      }
    }

    if (user?.role === 'parent') {
      const link = await prisma.parentStudent.findFirst({
        where: { parent_id: user.userId, student_id: studentId }
      });
      if (!link) {
        return sendError(res, 'Forbidden: You can only view conduct logs for your linked children', 403);
      }
    }

    const logs = await prisma.conductLog.findMany({
      where: {
        student_id: studentId,
        is_deleted: false,
        ...(isRestricted ? { is_confidential: false } : {})
      },
      orderBy: { created_at: 'desc' }
    });

    const mapped = logs.map(l => ({
      id: l.id,
      studentId: l.student_id,
      batchId: l.batch_id,
      authorId: l.author_id,
      authorName: l.author_name,
      authorRole: l.author_role,
      category: l.category,
      severity: l.severity,
      title: l.title,
      remark: l.remark,
      isConfidential: l.is_confidential,
      createdAt: l.created_at.toISOString(),
      updatedAt: l.updated_at.toISOString()
    }));

    return sendSuccess(res, mapped);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// POST /students/:studentId/conduct-logs
router.post('/students/:studentId/conduct-logs', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId } = req.params;
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return sendError(res, 'Forbidden: Only administrators and teachers can create conduct logs', 403);
    }

    const validation = createConductLogSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, validation.error.errors[0]?.message || 'Invalid conduct log payload', 400);
    }

    const data = validation.data;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const newLog = await prisma.conductLog.create({
      data: {
        student_id: studentId,
        batch_id: data.batch_id || undefined,
        author_id: user.userId,
        author_name: user.fullName || (user.role === 'admin' ? 'Academy Administrator' : 'Teacher'),
        author_role: user.role,
        category: data.category,
        severity: data.severity,
        title: data.title || undefined,
        remark: data.remark,
        is_confidential: data.is_confidential
      }
    });

    await createAuditLog(
      user.userId,
      'CONDUCT_LOG_CREATED',
      'ConductLog',
      newLog.id,
      { student_id: studentId, category: data.category, remark: data.remark }
    );

    const mapped = {
      id: newLog.id,
      studentId: newLog.student_id,
      batchId: newLog.batch_id,
      authorId: newLog.author_id,
      authorName: newLog.author_name,
      authorRole: newLog.author_role,
      category: newLog.category,
      severity: newLog.severity,
      title: newLog.title,
      remark: newLog.remark,
      isConfidential: newLog.is_confidential,
      createdAt: newLog.created_at.toISOString(),
      updatedAt: newLog.updated_at.toISOString()
    };

    return sendSuccess(res, mapped, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// PUT /conduct-logs/:id
router.put('/conduct-logs/:id', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existing = await prisma.conductLog.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return sendError(res, 'Conduct log not found', 404);
    }

    if (!canModifyConductLog(user, existing.author_id)) {
      return sendError(res, 'Forbidden: Only the original authoring teacher or an administrator can edit this conduct log', 403);
    }

    const validation = updateConductLogSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, validation.error.errors[0]?.message || 'Invalid conduct log payload', 400);
    }

    const data = validation.data;

    const updated = await prisma.conductLog.update({
      where: { id },
      data: {
        ...(data.category ? { category: data.category } : {}),
        ...(data.severity ? { severity: data.severity } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.remark !== undefined ? { remark: data.remark } : {}),
        ...(data.is_confidential !== undefined ? { is_confidential: data.is_confidential } : {})
      }
    });

    await createAuditLog(
      user?.userId || 'unknown',
      'CONDUCT_LOG_UPDATED',
      'ConductLog',
      id,
      data
    );

    const mapped = {
      id: updated.id,
      studentId: updated.student_id,
      batchId: updated.batch_id,
      authorId: updated.author_id,
      authorName: updated.author_name,
      authorRole: updated.author_role,
      category: updated.category,
      severity: updated.severity,
      title: updated.title,
      remark: updated.remark,
      isConfidential: updated.is_confidential,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString()
    };

    return sendSuccess(res, mapped);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// DELETE /conduct-logs/:id
router.delete('/conduct-logs/:id', authenticateJwt, requireModulePermission('students', 'editable'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existing = await prisma.conductLog.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return sendError(res, 'Conduct log not found', 404);
    }

    if (!canModifyConductLog(user, existing.author_id)) {
      return sendError(res, 'Forbidden: Only the original authoring teacher or an administrator can delete this conduct log', 403);
    }

    const deleted = await prisma.conductLog.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: user?.userId
      }
    });

    await createAuditLog(
      user?.userId || 'unknown',
      'CONDUCT_LOG_DELETED',
      'ConductLog',
      id,
      { is_deleted: true, deleted_at: new Date() }
    );

    return sendSuccess(res, { id: deleted.id, is_deleted: true });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

/* ==========================================================================
   23. MULTI-TENANT PARENT PORTAL MODULE
   ========================================================================== */

// GET /parents/my-children
router.get('/parents/my-children', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'parent' && user.role !== 'admin')) {
      return sendError(res, 'Forbidden: Only parents can access their children profile links', 403);
    }

    const relations = await prisma.parentStudent.findMany({
      where: user.role === 'admin' ? {} : { parent_id: user.userId },
      include: {
        student: {
          include: { class: true }
        }
      }
    });

    const mapped = relations.map(r => ({
      id: r.id,
      parentId: r.parent_id,
      studentId: r.student_id,
      relationship: r.relationship,
      student: r.student ? {
        id: r.student.id,
        regNo: r.student.admission_no,
        name: r.student.full_name,
        gradeBatch: r.student.class?.name || 'Unassigned',
        status: r.student.status,
        phone: r.student.phone,
        email: r.student.email
      } : null
    }));

    return sendSuccess(res, mapped);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// POST /students/:studentId/reset-parent-password
router.post('/students/:studentId/reset-parent-password', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return sendError(res, 'Forbidden: Only Super Admin and Academy Admin can reset parent passwords', 403);
    }

    const { studentId } = req.params;
    const { newPassword } = req.body;
    const finalPassword = (newPassword || '123456').trim();

    if (finalPassword.length < 4) {
      return sendError(res, 'Password must be at least 4 characters', 400);
    }

    // 1. Find the student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: studentId },
          { admission_no: studentId }
        ]
      }
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // 2. Find parent-student link
    const parentLink = await prisma.parentStudent.findFirst({
      where: { student_id: student.id },
      include: { parent: true }
    });

    let parentUser = parentLink?.parent;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    if (parentUser) {
      // Update existing parent user
      parentUser = await prisma.user.update({
        where: { id: parentUser.id },
        data: {
          password_hash: passwordHash,
          must_change_password: false,
          failed_attempts: 0,
          locked_until: null
        }
      });
    } else {
      // Create new parent user if missing and link to student
      const parentPhone = student.phone || `0300${Math.floor(1000000 + Math.random()*9000000)}`;
      const parentEmail = `parent_${student.admission_no.toLowerCase().replace(/[^a-z0-9]/g, '')}@academy.com`;

      // Check if user already exists with this phone
      const existingUser = await prisma.user.findFirst({
        where: { phone: parentPhone }
      });

      if (existingUser) {
        parentUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password_hash: passwordHash,
            must_change_password: false,
            failed_attempts: 0,
            locked_until: null
          }
        });
      } else {
        parentUser = await prisma.user.create({
          data: {
            role: 'parent',
            full_name: `${student.full_name}'s Parent`,
            phone: parentPhone,
            email: parentEmail,
            password_hash: passwordHash,
            must_change_password: false
          }
        });
      }

      await prisma.parentStudent.create({
        data: {
          parent_id: parentUser.id,
          student_id: student.id,
          relationship: 'guardian'
        }
      });
    }

    // 3. Create Audit Log
    await createAuditLog(
      user.userId,
      'PARENT_PASSWORD_RESET',
      'User',
      parentUser.id,
      { studentId: student.id, studentName: student.full_name, resetBy: user.fullName }
    );

    return sendSuccess(res, {
      success: true,
      studentName: student.full_name,
      admissionNo: student.admission_no,
      parentName: parentUser.full_name,
      phone: parentUser.phone || student.phone,
      newPassword: finalPassword
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.get('/notifications', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);
    const rows = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    return sendSuccess(res, rows);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/notifications/:id/read', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);
    const row = await prisma.notification.updateMany({
      where: { id: req.params.id, user_id: userId },
      data: { is_read: true }
    });
    return sendSuccess(res, { updated: row.count });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

router.post('/notifications/read-all', authenticateJwt, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);
    const row = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });
    return sendSuccess(res, { updated: row.count });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

export default router;







