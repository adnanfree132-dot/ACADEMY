# Data Model: Direct Staff Payroll, Multi-Tranche Disbursements & Expense Management

## 1. Prisma Schema Additions

```prisma
// ============================================================================
// 1. Expense Management Module
// ============================================================================
model Expense {
  id               String   @id @default(uuid())
  category         String   // "Salaries", "Utilities", "Rent", "Maintenance", "Supplies", "Miscellaneous"
  title            String   // e.g. "August 2026 Salary - John Doe", "Campus Electricity Bill"
  amount           Float    @default(0)
  expense_date     DateTime @default(now())
  payment_method   String   @default("cash") // "cash" | "bank_transfer" | "cheque" | "online"
  reference_number String?  // Check #, transaction ID, receipt #
  payee_name       String?  // Staff name, utility company, landlord
  staff_member_id  String?  // Optional foreign link to StaffMember if salary payment
  month_period     String?  // e.g. "2026-08" for monthly accounting reconciliation
  notes            String?  // Memo or audit note
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  staffMember      StaffMember? @relation(fields: [staff_member_id], references: [id], onDelete: SetNull)
  disbursements    StaffSalaryDisbursement[]

  @@index([category])
  @@index([expense_date])
  @@index([month_period])
  @@index([staff_member_id])
}

// ============================================================================
// 2. Multi-Tranche Staff Salary Disbursements
// ============================================================================
model StaffSalaryDisbursement {
  id               String   @id @default(uuid())
  staff_member_id  String
  month_period     String   // e.g. "2026-08"
  amount           Float    @default(0) // Installment amount disbursed (PKR)
  payment_method   String   @default("cash") // "cash" | "bank_transfer" | "cheque"
  disbursed_at     DateTime @default(now())
  reference_number String?  // Check # or bank receipt #
  notes            String?
  expense_id       String?  // Linked auto-created Expense record
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  staffMember      StaffMember @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)
  expense          Expense?    @relation(fields: [expense_id], references: [id], onDelete: SetNull)

  @@index([staff_member_id])
  @@index([month_period])
  @@index([disbursed_at])
}

// ============================================================================
// 3. Salary Heads (Catalog of Deductions and Earnings)
// ============================================================================
model SalaryHead {
  id          String   @id @default(uuid())
  title       String   // e.g. "Late Arrival", "Advance Salary", "Overtime", "Bonus"
  type        String   // "deduction" | "earning"
  amount      Float    @default(0)
  description String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([type])
  @@index([is_active])
}

// ============================================================================
// 4. Staff Salary Adjustments (Amount × Count Multiplier)
// ============================================================================
model StaffSalaryAdjustment {
  id              String   @id @default(uuid())
  staff_member_id String
  month_period    String   // e.g. "2026-08"
  type            String   // "deduction" | "earning"
  category        String   // Matches Head title (e.g. "Late Arrival", "Overtime")
  unit_amount     Float    @default(0) // Standard Amount (PKR)
  quantity        Float    @default(1) // Count multiplier
  total_amount    Float    @default(0) // unit_amount * quantity
  reason          String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  staffMember     StaffMember @relation(fields: [staff_member_id], references: [id], onDelete: Cascade)

  @@index([staff_member_id])
  @@index([month_period])
  @@index([type])
}
```

---

## 2. Frontend TypeScript Interfaces (`src/types.ts`)

```typescript
export interface Expense {
  id: string;
  category: 'Salaries' | 'Utilities' | 'Rent' | 'Maintenance' | 'Supplies' | 'Miscellaneous';
  title: string;
  amount: number;
  expense_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'online';
  reference_number?: string | null;
  payee_name?: string | null;
  staff_member_id?: string | null;
  month_period?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffSalaryDisbursement {
  id: string;
  staff_member_id: string;
  staffMember?: StaffMember;
  month_period: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'cheque';
  disbursed_at: string;
  reference_number?: string | null;
  notes?: string | null;
  expense_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LiveStaffPayrollRow {
  staff_id: string;
  staff_member_id: string;
  full_name: string;
  designation: string;
  staff_type: string;
  month_period: string;
  base_salary: number;
  gross_salary: number;
  adjustments: StaffSalaryAdjustment[];
  total_deductions: number;
  total_earnings: number;
  net_payable: number;
  total_paid: number;
  total_pending: number;
  payment_status: 'Paid' | 'Partial' | 'Pending';
  disbursements: StaffSalaryDisbursement[];
  attendance: {
    days_present: number;
    days_absent: number;
    days_late: number;
    days_half_day: number;
    days_leave: number;
    total_working_days: number;
  };
}
```
