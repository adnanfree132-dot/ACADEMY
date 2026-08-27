# Data Model Specification: Staff Portal Authentication & Permissions

**Feature**: `008-staff-portal-auth-permissions` | **Date**: 2026-08-21 | **Spec**: [specs/008-staff-portal-auth-permissions/spec.md](file:///d:/academy/specs/008-staff-portal-auth-permissions/spec.md)

---

## Prisma Schema Extensions

### 1. `StaffType` Model
Represents both system-default and dynamic user-created staff categories.

```prisma
model StaffType {
  id                 String          @id @default(uuid())
  name               String          @unique // Faculty, Admin, Domestic Staff, Librarian, etc.
  code               String          @unique // FAC, ADM, DOM, LIB, etc.
  description        String?
  icon_name          String          @default("UserCheck") // Lucide icon name
  is_system_default  Boolean         @default(false)
  is_active          Boolean         @default(true)
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  staffMembers       StaffMember[]
  defaultPermissions StaffPermission[]
}
```

---

### 2. `StaffMember` Model
The centralized employee entity for all staff categories.

```prisma
model StaffMember {
  id                 String          @id @default(uuid())
  user_id            String          @unique
  user               User            @relation(fields: [user_id], references: [id], onDelete: Cascade)
  staff_id           String          @unique // e.g. FAC-2026-001, ADM-2026-002
  full_name          String
  email              String?
  phone              String
  gender             String          @default("Male") // Male, Female, Other
  staff_type_id      String
  staffType          StaffType       @relation(fields: [staff_type_id], references: [id])
  designation        String          // e.g. Senior Physics Lecturer, Head Accountant, Security Incharge
  qualification      String?
  joining_date       DateTime        @default(now())
  status             String          @default("active") // active, probation, on_leave, suspended, resigned, terminated
  status_remarks     String?
  photo_url          String?
  
  // Financial & Compensation Structure
  base_salary        Float?          @default(0)
  hourly_rate        Float?          @default(0)
  payment_method     String          @default("bank_transfer") // bank_transfer, cash, cheque
  bank_name          String?
  account_number     String?
  account_title      String?
  
  // Emergency Contact
  emergency_name     String?
  emergency_phone    String?
  emergency_relation String?
  
  // Custom Dynamic Attributes
  custom_fields      Json?
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  // Relationships
  teacher            Teacher?        // If staff_type is Faculty, 1-to-1 link with Teacher model
  permissions        StaffPermission[]
  attendances        StaffAttendance[]
  leaveRequests      StaffLeaveRequest[]
  documents          StaffDocument[]
  salaryPayments     StaffSalaryPayment[]

  @@index([staff_type_id])
  @@index([status])
  @@index([staff_id])
}
```

---

### 3. `StaffPermission` Model
Granular module-level access definitions for staff types (default template) and individual staff members (overrides).

```prisma
model StaffPermission {
  id                 String          @id @default(uuid())
  staff_type_id      String?
  staffType          StaffType?      @relation(fields: [staff_type_id], references: [id], onDelete: Cascade)
  staff_member_id    String?
  staffMember        StaffMember?    @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  module_key         String          // students, teachers_staff, batches, subjects, attendance, fees, exams, homework, timetable, crm_inquiries, announcements, whatsapp, settings
  access_level       String          @default("hidden") // hidden, view_only, editable
  is_global_scope    Boolean         @default(false)    // If true, bypasses batch/classroom scoping
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  @@unique([staff_type_id, module_key])
  @@unique([staff_member_id, module_key])
  @@index([module_key])
}
```

---

### 4. `StaffAttendance` Model
Tracks daily check-in, check-out, presence, and punctuality.

```prisma
model StaffAttendance {
  id                 String          @id @default(uuid())
  staff_member_id    String
  staffMember        StaffMember     @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  date               String          // YYYY-MM-DD
  check_in_time      String?         // HH:mm:ss
  check_out_time     String?         // HH:mm:ss
  status             String          @default("present") // present, late, absent, half_day, on_leave
  notes              String?
  marked_by          String          // Admin or biometric or self
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  @@unique([staff_member_id, date])
  @@index([date])
  @@index([status])
}
```

---

### 5. `StaffLeaveRequest` Model
Employee leave application workflow and decision recording.

```prisma
model StaffLeaveRequest {
  id                 String          @id @default(uuid())
  staff_member_id    String
  staffMember        StaffMember     @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  leave_type         String          // casual, sick, maternity, emergency, annual, unpaid
  start_date         String          // YYYY-MM-DD
  end_date           String          // YYYY-MM-DD
  total_days         Int
  reason             String
  status             String          @default("pending") // pending, approved, rejected
  reviewed_by        String?         // Admin User ID
  reviewer_remarks   String?
  decided_at         DateTime?
  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  @@index([staff_member_id])
  @@index([status])
}
```

---

### 6. `StaffDocument` Model
Digital document vault for compliance, identification, and qualifications.

```prisma
model StaffDocument {
  id                 String          @id @default(uuid())
  staff_member_id    String
  staffMember        StaffMember     @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  title              String          // e.g. National CNIC Card, Master Degree in Physics, Police Clearance
  document_type      String          // cnic, degree, certificate, contract, resume, other
  file_url           String
  expiry_date        String?         // YYYY-MM-DD (optional for contracts/visas)
  uploaded_at        DateTime        @default(now())

  @@index([staff_member_id])
}
```

---

### 7. `StaffSalaryPayment` Model
Historical compensation disbursement records.

```prisma
model StaffSalaryPayment {
  id                 String          @id @default(uuid())
  staff_member_id    String
  staffMember        StaffMember     @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  month_period       String          // YYYY-MM
  base_pay           Float
  allowances         Float           @default(0)
  deductions         Float           @default(0)
  net_payable        Float
  status             String          @default("paid") // pending, paid, partial
  payment_date       DateTime        @default(now())
  payment_method     String          // bank_transfer, cash, cheque
  transaction_ref    String?
  remarks            String?

  @@unique([staff_member_id, month_period])
  @@index([month_period])
}
```

---

## State Transitions & Validation Rules

1. **Staff Lifecycle Transitions**:
   - `active` ↔ `probation`
   - `active` ↔ `on_leave` (Automatic when approved leave window is active)
   - `active` → `suspended` (Revokes all active sessions immediately)
   - `active` → `resigned` / `terminated` (Soft archives profile, deactivates credentials)

2. **Leave Request Lifecycle**:
   - `pending` → `approved` (Triggers `SubstituteTeacherModal` prompt if faculty + marks `StaffAttendance` as `on_leave`)
   - `pending` → `rejected` (Logs reviewer remarks)
