/**
 * Frontend Reactive Fee & Scholarship Calculation Utilities
 * For RegisterStudentModal, EditStudentModal, and Fee Slip Previews
 */

export interface FeeBreakdown {
  grossMonthlyFee: number;
  scholarshipType: 'none' | 'percentage' | 'fixed';
  scholarshipValue: number;
  scholarshipReason?: string;
  discountAmount: number;
  netMonthlyFee: number;
  isDiscounted: boolean;
}

export interface MidMonthProRataSuggestion {
  isMidMonth: boolean;
  admissionDay: number;
  totalDaysInMonth: number;
  remainingDays: number;
  halfMonthFee: number;
  exactDailyProRata: number;
}

/**
 * Format a number as clean currency string (e.g. 15,000) with ZERO decimals
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  const num = Math.round(Number(amount || 0));
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Live client-side calculation of gross, discount, and net monthly fee (Rounded Whole Numbers)
 */
export function calculateLiveFeeBreakdown(
  grossFee: number,
  scholarshipType: 'none' | 'percentage' | 'fixed',
  scholarshipValue: number
): FeeBreakdown {
  const safeGross = Math.round(Math.max(0, Number(grossFee) || 0));
  const safeVal = Math.max(0, Number(scholarshipValue) || 0);

  let discountAmount = 0;
  if (scholarshipType === 'percentage') {
    const clampedPct = Math.min(100, safeVal);
    discountAmount = Math.round(safeGross * (clampedPct / 100));
  } else if (scholarshipType === 'fixed') {
    discountAmount = Math.round(Math.min(safeGross, safeVal));
  }

  const netMonthlyFee = Math.max(0, safeGross - discountAmount);

  return {
    grossMonthlyFee: safeGross,
    scholarshipType,
    scholarshipValue: safeVal,
    discountAmount,
    netMonthlyFee,
    isDiscounted: discountAmount > 0
  };
}

/**
 * Client-side helper for detecting mid-month admissions and computing preset suggestions (Rounded Whole Numbers)
 */
export function getMidMonthProRataSuggestion(
  baseFee: number,
  admissionDateStr: string
): MidMonthProRataSuggestion {
  if (!admissionDateStr) {
    return {
      isMidMonth: false,
      admissionDay: 1,
      totalDaysInMonth: 30,
      remainingDays: 30,
      halfMonthFee: Math.round(baseFee * 0.5),
      exactDailyProRata: Math.round(baseFee)
    };
  }

  const parts = admissionDateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
  const day = parseInt(parts[2], 10) || 1;

  const totalDays = new Date(year, month, 0).getDate();
  const isMidMonth = day >= 16;
  const remainingDays = Math.max(1, totalDays - day + 1);

  const halfMonthFee = Math.round(baseFee * 0.5);
  const exactDailyProRata = Math.round(baseFee * (remainingDays / totalDays));

  return {
    isMidMonth,
    admissionDay: day,
    totalDaysInMonth: totalDays,
    remainingDays,
    halfMonthFee,
    exactDailyProRata
  };
}

/**
 * Formats date range as "DD-MMM-YYYY to DD-MMM-YYYY"
 */
export function formatCoveragePeriod(startStr?: string, endStr?: string): string {
  if (!startStr) return '';
  const formatDate = (isoStr: string) => {
    try {
      const [y, m, d] = isoStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  if (!endStr) return formatDate(startStr);
  return `${formatDate(startStr)} to ${formatDate(endStr)}`;
}

export function formatDateIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateIso(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateIso(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateIso(date);
}

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

export interface ClientInstallmentItem {
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  fee_period_start: string;
  fee_period_end: string;
  status: 'scheduled' | 'invoiced';
}

export function calculateInstallmentSchedule(
  totalFee: number,
  scholarshipType: 'none' | 'percentage' | 'fixed' | string = 'none',
  scholarshipValue: number = 0,
  startDateStr: string,
  endDateStr: string,
  installmentCount: number = 1
): ClientInstallmentItem[] {
  const N = Math.max(1, Math.min(12, installmentCount));
  const { netAmount: netTotalFee } = calculateNetFee(totalFee, scholarshipType, scholarshipValue);

  const totalRounded = Math.round(netTotalFee);
  const basePerInstallment = Math.floor(totalRounded / N);
  const remainder = totalRounded - (basePerInstallment * N);

  const start = parseDateIso(startDateStr);
  const end = parseDateIso(endDateStr);

  const totalTime = Math.max(1, end.getTime() - start.getTime());
  const intervalMs = totalTime / N;

  const schedule: ClientInstallmentItem[] = [];

  for (let i = 0; i < N; i++) {
    const isFirst = i === 0;
    const amount = isFirst ? (basePerInstallment + remainder) : basePerInstallment;

    const installmentStart = new Date(start.getTime() + (i * intervalMs));
    const installmentEnd = (i === N - 1)
      ? end
      : new Date(start.getTime() + ((i + 1) * intervalMs) - (24 * 60 * 60 * 1000));

    const feePeriodStart = formatDateIso(installmentStart);
    const feePeriodEnd = formatDateIso(installmentEnd);
    const dueDate = addDays(feePeriodStart, 5);

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
  schedule: ClientInstallmentItem[];
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
    const bStart = parseDateIso(batchStartDateStr);
    const bEnd = parseDateIso(batchEndDateStr);
    const durationMs = bEnd.getTime() - bStart.getTime();

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
