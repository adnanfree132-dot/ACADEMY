/**
 * Billing & Fee Calculation Utilities for Academy Pro OS
 * Handles pro-rata admissions, cycle anchor date clamping, Banker's penny balancing,
 * and course batch installment schedules.
 */

export interface ProRataCalculationResult {
  baseMonthlyFee: number;
  halfMonthFee: number;
  exactDailyProRata: number;
  isMidMonth: boolean;
  admissionDay: number;
  totalDaysInMonth: number;
  remainingDays: number;
}

export interface CyclePeriodResult {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD (Anchor + 5 days)
  nextAnchorDate: string; // YYYY-MM-DD
}

export interface InstallmentScheduleItem {
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  fee_period_start: string;
  fee_period_end: string;
  status: 'scheduled' | 'invoiced';
}

/**
 * Format a Date object to YYYY-MM-DD safely in UTC/local string format
 */
export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object without UTC timezone drift
 */
export function parseDateIso(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns total days in a given year & month (1-indexed month)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Adds days safely to an ISO date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateIso(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateIso(date);
}

/**
 * Calculates Pro-Rata / Half-Month Admission Fee Proposal
 */
export function calculateProRataFee(
  baseMonthlyFee: number,
  admissionDateStr: string
): ProRataCalculationResult {
  const date = parseDateIso(admissionDateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const totalDays = getDaysInMonth(year, month);

  // Mid-month is defined as admission on 16th or later
  const isMidMonth = day >= 16;
  const remainingDays = totalDays - day + 1;

  const halfMonthFee = Math.round(baseMonthlyFee * 0.5 * 100) / 100;
  const exactDailyProRata = Math.round((baseMonthlyFee * (remainingDays / totalDays)) * 100) / 100;

  return {
    baseMonthlyFee,
    halfMonthFee,
    exactDailyProRata,
    isMidMonth,
    admissionDay: day,
    totalDaysInMonth: totalDays,
    remainingDays
  };
}

/**
 * Computes cycle period coverage and due date with month-end clamping (28/29/30/31)
 */
export function calculateCyclePeriod(
  anchorDay: number,
  startDateStr: string
): CyclePeriodResult {
  const start = parseDateIso(startDateStr);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth(); // 0-indexed

  // Clamp anchor day for the start month
  const maxDaysInStartMonth = getDaysInMonth(startYear, startMonth + 1);
  const effectiveStartDay = Math.min(anchorDay, maxDaysInStartMonth);

  // Compute end date: 1 month later minus 1 day
  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endYear += 1;
    endMonth = 0;
  }

  const maxDaysInEndMonth = getDaysInMonth(endYear, endMonth + 1);
  const effectiveEndDay = Math.min(anchorDay, maxDaysInEndMonth);

  const endDate = new Date(endYear, endMonth, effectiveEndDay);
  endDate.setDate(endDate.getDate() - 1);

  // Next anchor date
  const nextAnchor = new Date(endYear, endMonth, effectiveEndDay);

  const periodStartStr = startDateStr;
  const periodEndStr = formatDateIso(endDate);
  const dueDateStr = addDays(periodStartStr, 5); // 5 calendar days grace window
  const nextAnchorDateStr = formatDateIso(nextAnchor);

  return {
    periodStart: periodStartStr,
    periodEnd: periodEndStr,
    dueDate: dueDateStr,
    nextAnchorDate: nextAnchorDateStr
  };
}

/**
 * Calculates net fee after scholarship discount
 */
export function calculateNetFee(
  grossAmount: number,
  scholarshipType: 'none' | 'percentage' | 'fixed' | string = 'none',
  scholarshipValue: number = 0
): { grossAmount: number; discountAmount: number; netAmount: number } {
  const safeGross = Math.round(Number(grossAmount) || 0);
  let discountAmount = 0;
  if (scholarshipType === 'percentage') {
    const clampedPct = Math.min(100, Math.max(0, scholarshipValue));
    discountAmount = Math.round(safeGross * (clampedPct / 100));
  } else if (scholarshipType === 'fixed') {
    discountAmount = Math.round(Math.min(safeGross, Math.max(0, scholarshipValue)));
  }
  const netAmount = Math.max(0, safeGross - discountAmount);
  return { grossAmount: safeGross, discountAmount, netAmount };
}

/**
 * Generates an installment schedule using Banker's Penny Balancing Algorithm (Whole Rounded Integers)
 */
export function calculateInstallmentSchedule(
  totalFee: number,
  scholarshipType: 'none' | 'percentage' | 'fixed' | string = 'none',
  scholarshipValue: number = 0,
  startDateStr: string,
  endDateStr: string,
  installmentCount: number = 1
): InstallmentScheduleItem[] {
  const N = Math.max(1, Math.min(12, installmentCount));
  const { netAmount: netTotalFee } = calculateNetFee(totalFee, scholarshipType, scholarshipValue);

  const totalRounded = Math.round(netTotalFee);
  const basePerInstallment = Math.floor(totalRounded / N);
  const remainder = totalRounded - (basePerInstallment * N);

  const start = parseDateIso(startDateStr);
  const end = parseDateIso(endDateStr);

  const totalTime = Math.max(1, end.getTime() - start.getTime());
  const intervalMs = totalTime / N;

  const schedule: InstallmentScheduleItem[] = [];

  for (let i = 0; i < N; i++) {
    const isFirst = i === 0;
    const amount = isFirst ? (basePerInstallment + remainder) : basePerInstallment;

    const installmentStart = new Date(start.getTime() + (i * intervalMs));
    const installmentEnd = (i === N - 1)
      ? end
      : new Date(start.getTime() + ((i + 1) * intervalMs) - (24 * 60 * 60 * 1000));

    const feePeriodStart = formatDateIso(installmentStart);
    const feePeriodEnd = formatDateIso(installmentEnd);
    const dueDate = addDays(feePeriodStart, 5); // Due 5 days from period start

    schedule.push({
      installment_number: i + 1,
      total_installments: N,
      amount,
      due_date: dueDate,
      fee_period_start: feePeriodStart,
      fee_period_end: feePeriodEnd,
      status: isFirst ? 'invoiced' : 'scheduled'
    });
  }

  return schedule;
}

/**
 * Calculates late enrollment timeline adjustments and fees
 */
export function calculateLateEnrollment(params: {
  totalCourseFee: number;
  batchStartDateStr: string;
  batchEndDateStr: string;
  enrollmentDateStr: string;
  scholarshipType?: string;
  scholarshipValue?: number;
  alignmentMode: 'align_batch_end' | 'extend_student_timeline';
  prorateMode?: 'remaining_duration' | 'full_course_fee';
  customFeeOverride?: number;
  installmentCount?: number;
  individualEndDateStr?: string;
}): {
  effectiveTotalFee: number;
  effectiveEndDateStr: string;
  effectiveInstallments: number;
  isExtendedTimeline: boolean;
  schedule: InstallmentScheduleItem[];
} {
  const {
    totalCourseFee,
    batchStartDateStr,
    batchEndDateStr,
    enrollmentDateStr,
    scholarshipType = 'none',
    scholarshipValue = 0,
    alignmentMode,
    prorateMode = 'remaining_duration',
    customFeeOverride,
    installmentCount = 3,
    individualEndDateStr
  } = params;

  if (alignmentMode === 'extend_student_timeline') {
    // Determine duration from original batch start to end
    const bStart = parseDateIso(batchStartDateStr);
    const bEnd = parseDateIso(batchEndDateStr);
    const durationMs = bEnd.getTime() - bStart.getTime();

    // Default extended end date is enrollment date + original duration if not specified
    const enrollDate = parseDateIso(enrollmentDateStr);
    const computedEnd = new Date(enrollDate.getTime() + durationMs);
    const effectiveEnd = individualEndDateStr || formatDateIso(computedEnd);

    const effectiveFee = customFeeOverride !== undefined ? customFeeOverride : totalCourseFee;
    const schedule = calculateInstallmentSchedule(
      effectiveFee,
      scholarshipType,
      scholarshipValue,
      enrollmentDateStr,
      effectiveEnd,
      installmentCount
    );

    return {
      effectiveTotalFee: effectiveFee,
      effectiveEndDateStr: effectiveEnd,
      effectiveInstallments: installmentCount,
      isExtendedTimeline: true,
      schedule
    };
  } else {
    // Align to batch end
    let effectiveFee = totalCourseFee;
    if (customFeeOverride !== undefined) {
      effectiveFee = customFeeOverride;
    } else if (prorateMode === 'remaining_duration') {
      const bStart = parseDateIso(batchStartDateStr);
      const bEnd = parseDateIso(batchEndDateStr);
      const eDate = parseDateIso(enrollmentDateStr);

      const totalBatchDays = Math.max(1, Math.round((bEnd.getTime() - bStart.getTime()) / (24 * 60 * 60 * 1000)));
      const remainingDays = Math.max(1, Math.round((bEnd.getTime() - eDate.getTime()) / (24 * 60 * 60 * 1000)));
      const ratio = Math.min(1, remainingDays / totalBatchDays);
      effectiveFee = Math.round((totalCourseFee * ratio) * 100) / 100;
    }

    const schedule = calculateInstallmentSchedule(
      effectiveFee,
      scholarshipType,
      scholarshipValue,
      enrollmentDateStr,
      batchEndDateStr,
      installmentCount
    );

    return {
      effectiveTotalFee: effectiveFee,
      effectiveEndDateStr: batchEndDateStr,
      effectiveInstallments: installmentCount,
      isExtendedTimeline: false,
      schedule
    };
  }
}
