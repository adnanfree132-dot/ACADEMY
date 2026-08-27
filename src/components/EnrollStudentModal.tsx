import React from 'react';
import { EnrollStudentBatchModal, EnrollStudentBatchModalProps } from './EnrollStudentBatchModal';
import { Batch, Student } from '../types';

export interface EnrollStudentModalProps {
  isOpen: boolean;
  batch: Batch | null;
  students: Student[];
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
  }) => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  batch,
  students,
  onClose,
  onEnroll
}) => {
  return (
    <EnrollStudentBatchModal
      isOpen={isOpen}
      batch={batch}
      students={students}
      onClose={onClose}
      onEnroll={onEnroll}
    />
  );
};
