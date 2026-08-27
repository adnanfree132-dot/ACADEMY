# Data Model & Schema Design: Student Status Lifecycle & Retention Management

**Feature**: `006-student-status-lifecycle-management`  
**Date**: 2026-08-19  
**Status**: Completed

---

## 1. Prisma Schema Additions & Modifications

```prisma
// server/prisma/schema.prisma

// Extended Student Model
model Student {
  id                    String    @id @default(uuid())
  user_id               String?
  user                  User?     @relation(fields: [user_id], references: [id])
  admission_no          String    @unique
  full_name             String
  phone                 String
  email                 String?
  dob                   DateTime?
  gender                String    // Male, Female, Other
  address               String?
  photo_url             String?
  admitted_on           DateTime  @default(now())
  
  // Lifecycle Status Fields
  status                String    @default("active") // active, inactive, suspended, graduated, left
  status_reason         String?   // Short reason code / category
  status_remarks        String?   // Detailed administrative notes
  status_updated_at     DateTime  @default(now())
  leaving_date          DateTime? // Effective departure or graduation date
  is_fee_paused         Boolean   @default(false)

  class_id              String?
  class                 Class?    @relation(fields: [class_id], references: [id])
  batch_id              String?
  batch                 Batch?    @relation(fields: [batch_id], references: [id])

  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  feePlan               FeePlan?
  feeInvoices           FeeInvoice[]
  attendanceRecords     AttendanceRecord[]
  examMarks             ExamMark[]
  conductLogs           ConductLog[]
  parentStudents        ParentStudent[]
  statusHistory         StudentStatusHistory[]
}

// Immutable Student Status Transition History Log
model StudentStatusHistory {
  id                  String    @id @default(uuid())
  student_id          String
  student             Student   @relation(fields: [student_id], references: [id], onDelete: Cascade)
  
  previous_status     String    // e.g. "active"
  new_status          String    // e.g. "inactive", "suspended", "graduated", "left"
  reason_category     String    // medical, financial, relocation, disciplinary, graduation, personal, other
  remarks             String?
  effective_date      DateTime  @default(now())
  fee_action          String?   // pause_fees, continue_fees, waive_balance
  
  changed_by_user_id  String?
  created_at          DateTime  @default(now())

  @@index([student_id])
  @@index([created_at])
}
```

---

## 2. TypeScript Interfaces (Client & Server)

```typescript
// src/types.ts

export type StudentLifecycleStatus = 'active' | 'inactive' | 'suspended' | 'graduated' | 'left';

export type StatusReasonCategory = 
  | 'medical'
  | 'financial'
  | 'relocation'
  | 'disciplinary'
  | 'graduation'
  | 'personal'
  | 'other';

export interface StudentStatusHistoryItem {
  id: string;
  studentId: string;
  previousStatus: StudentLifecycleStatus;
  newStatus: StudentLifecycleStatus;
  reasonCategory: StatusReasonCategory;
  remarks?: string;
  effectiveDate: string;
  feeAction?: 'pause_fees' | 'continue_fees' | 'waive_balance';
  changedByUserId?: string;
  changedByName?: string;
  createdAt: string;
}

export interface StatusTransitionPayload {
  targetStatus: StudentLifecycleStatus;
  reasonCategory: StatusReasonCategory;
  remarks?: string;
  effectiveDate: string;
  feeAction?: 'pause_fees' | 'continue_fees' | 'waive_balance';
  targetBatchId?: string;
}

export interface LeavingCertificateData {
  admissionNo: string;
  studentName: string;
  parentName: string;
  phone: string;
  gradeBatch: string;
  enrollmentDate: string;
  leavingDate: string;
  reason: string;
  status: StudentLifecycleStatus;
  attendancePercentage: number;
  feeStatus: 'Cleared' | 'Pending Dues' | 'Waived';
  dueBalance: number;
  conductRating: 'Exemplary' | 'Good' | 'Satisfactory' | 'Needs Improvement';
  remarks: string;
}
```

---

## 3. Zod Validation Schemas (Backend API)

```typescript
// server/src/routes.ts

const ChangeStudentStatusSchema = z.object({
  targetStatus: z.enum(['active', 'inactive', 'suspended', 'graduated', 'left']),
  reasonCategory: z.enum(['medical', 'financial', 'relocation', 'disciplinary', 'graduation', 'personal', 'other']),
  remarks: z.string().optional(),
  effectiveDate: z.string().optional(),
  feeAction: z.enum(['pause_fees', 'continue_fees', 'waive_balance']).optional(),
  targetBatchId: z.string().uuid().optional()
});

const ReactivateStudentSchema = z.object({
  targetBatchId: z.string().optional(),
  monthlyFee: z.number().nonnegative().optional(),
  remarks: z.string().optional()
});
```
