# Phase 1: Component Data Models & Modal Props Contracts

**Feature**: `002-popup-forms-ui-redesign`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

---

## 1. Universal Modal Props & Layout Model

### Universal Modal Header Model
```typescript
export interface ModalHeaderConfig {
  title: string;                 // e.g. "Admission Credentials Slip", "Register New Student"
  subtitle: string;              // e.g. "Auto-Generated System Access Accounts"
  icon: React.ReactNode;         // Lucide Icon component
  badgeAccentColor?: string;     // Uniform default: '#10B981' (Emerald)
  onClose: () => void;           // Close handler
}
```

### Universal Modal Alert Callout Model
```typescript
export type CalloutVariant = 'critical' | 'warning' | 'info' | 'success';

export interface ModalCalloutConfig {
  variant: CalloutVariant;
  prefix: string;                // e.g. "CRITICAL SECURITY NOTICE:", "CAPACITY CEILING REACHED:"
  message: string;               // e.g. "Plaintext passwords are displayed ONCE and cannot be retrieved again."
  icon?: React.ReactNode;
}
```

---

## 2. Component Props Definitions

### 1. Student Module Popups
```typescript
// RegisterStudentModal.tsx
export interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'regNo' | 'paidFee' | 'dueBalance' | 'isDefaulter'>) => void;
  batches: Batch[];
}

// EditStudentModal.tsx
export interface EditStudentModalProps {
  student: Student | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (student: Student) => void;
}

// QuickPaymentModal.tsx
export interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onAddPayment: (data: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
}

// CredentialSlipModal.tsx
export interface CredentialData {
  admissionNo: string;
  studentName: string;
  studentUsername: string;
  studentPassword: string;
  parentName: string;
  parentPhone: string;
  parentUsername: string;
  parentPassword: string;
}

export interface CredentialSlipModalProps {
  data: CredentialData | null;
  onClose: () => void;
}
```

### 2. Teacher Module Popups
```typescript
// AddTeacherModal.tsx
export interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'assignedSubjects' | 'assignedBatches'>) => void;
}

// TeacherEvaluationModal.tsx
export interface TeacherEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onSubmitEvaluation: (teacherId: string, evaluation: any) => void;
}

// SubstituteTeacherModal.tsx
export interface SubstituteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  teachers: Teacher[];
  onAssignSubstitute: (batchId: string, data: any) => void;
}
```

### 3. Class & Batch Module Popups
```typescript
// CreateBatchModal.tsx
export interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  classes: any[];
  onAddBatch: (batch: any) => void;
}

// SplitBatchModal.tsx
export interface SplitBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onSplitBatch: (batchId: string, data: any) => void;
}
```

---

## 3. UI Token Mappings for Floating Island Modal Hierarchy

| Element | CSS Property / Token | Value |
| :--- | :--- | :--- |
| **Modal Backdrop** | `background` | `rgba(15, 23, 42, 0.65)` |
| | `backdrop-filter` | `blur(12px)` |
| **Modal Container (Canvas)** | `background` | `transparent` (Where no entries exist, backdrop is visible) |
| | `border` | `none` |
| | `box-shadow` | `none` |
| | `gap` | `12px` |
| **Island 1: Floating Dark Header** | `background` | `#0F172A` (Solid Dark Slate) |
| | `color` | `#FFFFFF` |
| | `border-radius` | `16px` |
| | `padding` | `16px 20px` |
| | `box-shadow` | `0 10px 25px -5px rgba(15, 23, 42, 0.4)` |
| **Header Icon Badge** | `background` | `rgba(16, 185, 129, 0.15)` |
| | `border` | `1px solid rgba(16, 185, 129, 0.35)` |
| | `color` | `#10B981` (Uniform Emerald Accent) |
| | `border-radius` | `10px` |
| **Island 2: Floating Warning Card** | `background` | `#FEF2F2` (Soft Pink/Red) |
| | `border` | `1px solid #FCA5A5` |
| | `border-radius` | `14px` |
| | `padding` | `14px 18px` |
| **Island 3: Floating White Content Card** | `background` | `#FFFFFF` |
| | `border` | `1px solid #E2E8F0` |
| | `border-radius` | `16px` |
| | `padding` | `20px-24px` |
| | `box-shadow` | `0 10px 25px -5px rgba(15, 23, 42, 0.12)` |
| **Inner Grouped Section** | `background` | `#F8FAFC` |
| | `border` | `1px solid #E2E8F0` |
| | `border-radius` | `12px` |
| | `padding` | `14px-16px` |
| **Section Header Label** | `font-size` | `11px` |
| | `font-weight` | `800` |
| | `letter-spacing` | `0.05em` |
| | `color` | `#2563EB` (Blue) / `#7C3AED` (Purple) / `#059669` (Emerald) |
| **Island 4: Floating Primary Action Pill** | `background` | `#0F172A` |
| | `color` | `#FFFFFF` |
| | `border-radius` | `9999px` |
| | `font-weight` | `700` |
| | `box-shadow` | `0 8px 20px -4px rgba(15, 23, 42, 0.4)` |
| **Island 4: Floating Secondary Action Pill** | `background` | `#FFFFFF` |
| | `border` | `1px solid #CBD5E1` |
| | `color` | `#334155` |
| | `border-radius` | `9999px` |
| | `font-weight` | `700` |
| | `box-shadow` | `0 4px 12px rgba(0,0,0,0.06)` |
| **Island 5: Floating Full-Width Done Pill** | `background` | `#FFFFFF` |
| | `border` | `1px solid #CBD5E1` |
| | `color` | `#0F172A` |
| | `border-radius` | `9999px` |
| | `font-weight` | `800` |
| | `box-shadow` | `0 4px 12px rgba(0,0,0,0.06)` |
