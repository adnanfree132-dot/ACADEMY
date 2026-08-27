import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserPlus,
  Calendar,
  Layers,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Award,
  Check,
  CalendarDays
} from 'lucide-react';
import { Batch, Student } from '../types';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import {
  calculateInstallmentSchedule,
  calculateLateEnrollment,
  calculateNetFee,
  formatCurrency,
  formatCoveragePeriod,
  formatDateIso
} from '../utils/feeCalculator';

export interface EnrollStudentBatchModalProps {
  isOpen: boolean;
  batch?: Batch | null;
  batches?: Batch[];
  student?: Student | null;
  students?: Student[];
  onClose: () => void;
  onEnroll: (payload: {
    studentId: string;
    enrolled_on: string;
    alignment_mode?: 'align_batch_end' | 'extend_student_timeline';
    prorate_mode?: 'remaining_duration' | 'full_course_fee';
    custom_fee_override?: number;
    individual_end_date?: string;
    custom_installments?: number;
    adminOverride?: boolean;
    batchId?: string;
  }) => void;
}

export const EnrollStudentBatchModal: React.FC<EnrollStudentBatchModalProps> = ({
  isOpen,
  batch: initialBatch,
  batches = [],
  student: initialStudent,
  students = [],
  onClose,
  onEnroll
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatch?.id || batches[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudent?.id || students[0]?.id || '');
  const [enrolledOn, setEnrolledOn] = useState(() => formatDateIso(new Date()));
  const [alignmentMode, setAlignmentMode] = useState<'align_batch_end' | 'extend_student_timeline'>('align_batch_end');
  const [prorateMode, setProrateMode] = useState<'remaining_duration' | 'full_course_fee'>('remaining_duration');
  const [customFeeOverride, setCustomFeeOverride] = useState<string>('');
  const [customInstallments, setCustomInstallments] = useState<string>('3');
  const [individualEndDate, setIndividualEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return formatDateIso(d);
  });

  useEffect(() => {
    if (initialBatch) setSelectedBatchId(initialBatch.id);
    if (initialStudent) setSelectedStudentId(initialStudent.id);
    if (initialBatch?.defaultInstallments || initialBatch?.default_installments) {
      setCustomInstallments(String(initialBatch.defaultInstallments || initialBatch.default_installments));
    }
  }, [initialBatch, initialStudent]);

  const activeBatch = useMemo(() => {
    if (initialBatch) return initialBatch;
    return batches.find(b => b.id === selectedBatchId) || batches[0] || null;
  }, [initialBatch, batches, selectedBatchId]);

  const activeStudent = useMemo(() => {
    if (initialStudent) return initialStudent;
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [initialStudent, students, selectedStudentId]);

  // Default course or batch fee fallback
  const defaultBatchFee = useMemo(() => {
    if (!activeBatch) return 15000;
    return (
      activeBatch.totalFee ||
      activeBatch.total_fee ||
      activeStudent?.totalFee ||
      activeStudent?.baseMonthlyFee ||
      15000
    );
  }, [activeBatch, activeStudent]);

  // Live calculation of effective fee & installment preview
  const liveCalculation = useMemo(() => {
    if (!activeBatch) {
      return { netFee: 0, schedules: [], isLate: false, effectiveTotalFee: 0, grossFee: 0 };
    }

    const grossFee = Number(customFeeOverride) || defaultBatchFee;
    const sct = activeStudent?.scholarshipType || 'none';
    const scv = activeStudent?.scholarshipValue || 0;
    const bStart = activeBatch.startDate || activeBatch.start_date || enrolledOn;
    const bEnd = activeBatch.endDate || activeBatch.end_date || individualEndDate;
    const numInst = Math.max(1, Number(customInstallments) || activeBatch.defaultInstallments || activeBatch.default_installments || 3);

    const lateResult = calculateLateEnrollment({
      totalCourseFee: grossFee,
      batchStartDateStr: bStart,
      batchEndDateStr: bEnd,
      enrollmentDateStr: enrolledOn,
      scholarshipType: sct,
      scholarshipValue: scv,
      alignmentMode,
      prorateMode,
      customFeeOverride: customFeeOverride !== '' ? Number(customFeeOverride) : undefined,
      installmentCount: numInst,
      individualEndDateStr: individualEndDate
    });

    const isLate = enrolledOn > bStart;

    return {
      grossFee,
      effectiveTotalFee: lateResult.effectiveTotalFee,
      netFee: lateResult.schedule.reduce((sum, s) => sum + s.amount, 0),
      schedules: lateResult.schedule,
      isLate
    };
  }, [
    activeBatch,
    defaultBatchFee,
    activeStudent,
    enrolledOn,
    prorateMode,
    customFeeOverride,
    customInstallments,
    alignmentMode,
    individualEndDate
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId && !activeStudent) return;

    onEnroll({
      studentId: activeStudent?.id || selectedStudentId,
      batchId: activeBatch?.id || selectedBatchId,
      enrolled_on: enrolledOn,
      alignment_mode: alignmentMode,
      prorate_mode: prorateMode,
      custom_fee_override: customFeeOverride !== '' ? Number(customFeeOverride) : defaultBatchFee,
      individual_end_date: alignmentMode === 'extend_student_timeline' ? individualEndDate : undefined,
      custom_installments: Number(customInstallments) || 3
    });

    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1300,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 640,
          width: '100%',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {/* Island 1: Floating Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Batch Enrollment & Fee Installments
              </h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                {activeBatch ? activeBatch.name : 'Select Batch'} • {activeStudent ? activeStudent.name : 'Select Student'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div
          style={{
            padding: 22,
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '72vh',
            overflowY: 'auto'
          }}
        >
          <form id="enroll-batch-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Student Selection (if not preselected) */}
            {!initialStudent && students.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Select Student
                </label>
                <ModernSelect
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  options={students.map(s => ({
                    value: s.id,
                    label: `${s.name} (${s.regNo || 'STU'})`
                  }))}
                />
              </div>
            )}

            {/* Batch Selection (if not preselected) */}
            {!initialBatch && batches.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Select Target Batch / Course
                </label>
                <ModernSelect
                  value={selectedBatchId}
                  onChange={setSelectedBatchId}
                  options={batches.map(b => ({
                    value: b.id,
                    label: `${b.name} (${b.courseType === 'fixed_course' ? 'Course' : 'Recurring'})`
                  }))}
                />
              </div>
            )}

            {/* Enrollment Date */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Enrollment Date
              </label>
              <ModernDatePicker
                value={enrolledOn}
                onChange={setEnrolledOn}
                placeholder="Select enrollment date"
              />
            </div>

            {/* Fee, Installment & Timeline Configuration Island */}
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={14} color="#2563EB" /> Course Timeline, Fee & Installments
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {activeStudent?.scholarshipType && activeStudent.scholarshipType !== 'none' && (
                    <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                      ✓ {activeStudent.scholarshipType === 'percentage' ? `${activeStudent.scholarshipValue}%` : `PKR ${activeStudent.scholarshipValue}`} Scholarship
                    </span>
                  )}
                  {liveCalculation.isLate && (
                    <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                      Late Enrollment Detected
                    </span>
                  )}
                </div>
              </div>

              {/* Alignment Mode Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setAlignmentMode('align_batch_end')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: alignmentMode === 'align_batch_end' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: alignmentMode === 'align_batch_end' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: alignmentMode === 'align_batch_end' ? '#1E40AF' : '#334155' }}>
                    Align to Batch End
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Ends on batch end date ({activeBatch?.endDate || activeBatch?.end_date || 'Standard Term'})
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAlignmentMode('extend_student_timeline')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: alignmentMode === 'extend_student_timeline' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: alignmentMode === 'extend_student_timeline' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: alignmentMode === 'extend_student_timeline' ? '#1E40AF' : '#334155' }}>
                    Extend Student Timeline
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Individualized completion date for makeup classes
                  </div>
                </button>
              </div>

              {/* Sub-options for Align to Batch End */}
              {alignmentMode === 'align_batch_end' && liveCalculation.isLate && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setProrateMode('remaining_duration')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      border: prorateMode === 'remaining_duration' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: prorateMode === 'remaining_duration' ? '#DBEAFE' : '#FFFFFF',
                      color: prorateMode === 'remaining_duration' ? '#1E40AF' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Prorate Remaining Duration
                  </button>

                  <button
                    type="button"
                    onClick={() => setProrateMode('full_course_fee')}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      border: prorateMode === 'full_course_fee' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                      background: prorateMode === 'full_course_fee' ? '#DBEAFE' : '#FFFFFF',
                      color: prorateMode === 'full_course_fee' ? '#1E40AF' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Full Course Fee
                  </button>
                </div>
              )}

              {/* Sub-option for Extended Timeline */}
              {alignmentMode === 'extend_student_timeline' && (
                <div style={{ marginTop: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Student's Individual Completion Date
                  </label>
                  <ModernDatePicker
                    value={individualEndDate}
                    onChange={setIndividualEndDate}
                    placeholder="Select extended completion date"
                  />
                </div>
              )}

              {/* Installments & Fee Override Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Installment Divisions
                  </label>
                  <ModernSelect
                    value={customInstallments}
                    onChange={setCustomInstallments}
                    options={[
                      { value: '1', label: '1 Full Payment (100%)' },
                      { value: '2', label: '2 Equal Installments' },
                      { value: '3', label: '3 Equal Installments' },
                      { value: '4', label: '4 Equal Installments' },
                      { value: '6', label: '6 Monthly Installments' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Batch / Course Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={customFeeOverride}
                    onChange={e => setCustomFeeOverride(e.target.value)}
                    placeholder={`Default: PKR ${formatCurrency(defaultBatchFee)}`}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Live Installment Schedule Roadmap Preview */}
              <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Calculated Installment Roadmap
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                    Total Net: PKR {formatCurrency(liveCalculation.netFee)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {liveCalculation.schedules.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: idx === 0 ? 'rgba(37, 99, 235, 0.06)' : '#F8FAFC',
                        border: idx === 0 ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid #F1F5F9'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: idx === 0 ? '#2563EB' : '#64748B',
                            color: '#FFFFFF'
                          }}
                        >
                          Inst. {item.installment_number}/{item.total_installments}
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {formatCoveragePeriod(item.fee_period_start, item.fee_period_end)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>Due {item.due_date}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                          PKR {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 11, color: '#64748B', margin: 0, marginTop: 8, fontStyle: 'italic' }}>
                  Note: Installment 1 voucher is issued immediately upon enrollment. Subsequent installments are scheduled automatically.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Island 4: Floating Action Pills */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: 9999,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#475569',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)'
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="enroll-batch-form"
            style={{
              padding: '10px 24px',
              borderRadius: 9999,
              background: '#0F172A',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Check size={15} /> Confirm Enrollment
          </button>
        </div>
      </div>
    </div>
  );
};
