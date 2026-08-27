# Data Model & Schema Specification: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Feature Branch**: `007-advanced-fee-billing-installments`  
**Date**: 2026-08-19  

---

## 1. Prisma ORM Schema Extensions

### Extended `StudentFeePlan` Model

```prisma
model StudentFeePlan {
  student_id         String   @id
  student            Student  @relation(fields: [student_id], references: [id], onDelete: Cascade)
  monthly_amount     Float
  discount           Float    @default(0)
  scholarship_type   String   @default("none") // none, percentage, fixed
  scholarship_value  Float    @default(0)
  scholarship_reason String?  // merit, need_based, sibling, staff_child, special_grant, other
  billing_anchor_day Int      @default(1)      // 1 to 31 (e.g. 15 for 15th-of-the-month cycles)
  billing_mode       String   @default("monthly_recurring") // monthly_recurring, course_installments
  due_day            Int      @default(5)      // Relative grace offset (e.g. 5 days after anchor)
  notes              String?
}
```

### Extended `Batch` Model

```prisma
model Batch {
  id                   String   @id @default(uuid())
  class_id             String
  class                Class    @relation(fields: [class_id], references: [id])
  name                 String
  section_name         String?  // Section mapping (e.g., "Section A", "Morning Bootcamp")
  teacher_id           String?
  teacher              Teacher? @relation(fields: [teacher_id], references: [id])
  days                 String   @default("MON,WED,FRI")
  start_time           String
  end_time             String
  capacity             Int      @default(30)
  is_active            Boolean  @default(true)
  
  // Course Installment Fields
  course_type          String   @default("monthly") // monthly, fixed_course
  total_fee            Float?   // Total fee for fixed-duration courses
  start_date           String?  // YYYY-MM-DD
  end_date             String?  // YYYY-MM-DD
  default_installments Int?     @default(1) // 1 to 12

  enrollments          Enrollment[]
  batchSubjects        BatchSubject[]
  attendances          Attendance[]
  homeworks            Homework[]
  studyMaterials       StudyMaterial[]
  tests                Test[]
  feeStructures        FeeStructure[]
  conductLogs          ConductLog[]
}
```

### Extended `Enrollment` Model

```prisma
model Enrollment {
  id                      String   @id @default(uuid())
  student_id              String
  student                 Student  @relation(fields: [student_id], references: [id], onDelete: Cascade)
  batch_id                String
  batch                   Batch    @relation(fields: [batch_id], references: [id], onDelete: Cascade)
  enrolled_on             DateTime @default(now())
  status                  String   @default("active") // active, removed
  
  // Mid-Batch Late Enrollment & Installments
  is_extended_timeline    Boolean  @default(false)
  individual_end_date     String?  // YYYY-MM-DD (e.g. Nov 30 when batch ends Oct 31)
  custom_installment_count Int?
  
  installmentSchedules    StudentInstallmentSchedule[]

  @@unique([student_id, batch_id])
}
```

### New `StudentInstallmentSchedule` Model

```prisma
model StudentInstallmentSchedule {
  id                 String      @id @default(uuid())
  enrollment_id      String
  enrollment         Enrollment  @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)
  installment_number Int         // 1, 2, 3... N
  total_installments Int         // N
  amount             Float       // Penny-reconciled amount
  due_date           String      // YYYY-MM-DD
  fee_period_start   String      // YYYY-MM-DD
  fee_period_end     String      // YYYY-MM-DD
  invoice_id         String?     @unique
  invoice            FeeInvoice? @relation(fields: [invoice_id], references: [id], onDelete: SetNull)
  status             String      @default("scheduled") // scheduled, invoiced, paid, cancelled
  created_at         DateTime    @default(now())
  updated_at         DateTime    @updatedAt

  @@index([enrollment_id])
  @@index([due_date])
}
```

### Extended `FeeInvoice` Model

```prisma
model FeeInvoice {
  id                   String   @id @default(uuid())
  student_id           String
  student              Student  @relation(fields: [student_id], references: [id], onDelete: Cascade)
  period               String   // YYYY-MM or Unique Cycle Code
  fee_period_start     String?  // YYYY-MM-DD (Explicit coverage start)
  fee_period_end       String?  // YYYY-MM-DD (Explicit coverage end)
  installment_number   Int?     // e.g. 1 for Inst 1 of 3
  total_installments   Int?     // e.g. 3 for Inst 1 of 3
  billing_anchor_day   Int?     // Anchor day used for this cycle
  amount               Float    // Gross amount
  discount             Float    @default(0)
  net_amount           Float    // Net payable
  due_date             String   // YYYY-MM-DD
  status               String   @default("unpaid") // unpaid, partial, paid, overdue

  feePayments          FeePayment[]
  installmentSchedule  StudentInstallmentSchedule?

  @@unique([student_id, period])
  @@index([student_id])
  @@index([status])
}
```

---

## 2. Zod Validation Schemas

```typescript
import { z } from 'zod';

export const ScholarshipTypeSchema = z.enum(['none', 'percentage', 'fixed']);
export const ScholarshipReasonSchema = z.enum([
  'merit',
  'need_based',
  'sibling',
  'staff_child',
  'special_grant',
  'other'
]);

export const StudentRegistrationFeeSchema = z.object({
  base_monthly_fee: z.number().nonnegative(),
  scholarship_type: ScholarshipTypeSchema.default('none'),
  scholarship_value: z.number().nonnegative().default(0),
  scholarship_reason: ScholarshipReasonSchema.optional(),
  billing_anchor_day: z.number().int().min(1).max(31).default(1),
  initial_fee_override: z.number().nonnegative().optional(),
  initial_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  initial_period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const BatchCoursePlanSchema = z.object({
  course_type: z.enum(['monthly', 'fixed_course']).default('monthly'),
  total_fee: z.number().nonnegative().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  default_installments: z.number().int().min(1).max(12).default(1),
  section_name: z.string().optional()
});

export const LateEnrollmentSchema = z.object({
  batch_id: z.string().uuid(),
  student_id: z.string().uuid(),
  alignment_mode: z.enum(['align_batch_end', 'extend_student_timeline']),
  prorate_mode: z.enum(['remaining_duration', 'full_course_fee']).optional(),
  custom_fee_override: z.number().nonnegative().optional(),
  individual_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  installment_count: z.number().int().min(1).max(12).optional()
});
```
