# API Contracts: Advanced Fee Billing Cycles, Prorated Admissions, Scholarship Registration & Course Installments

**Feature Branch**: `007-advanced-fee-billing-installments`  
**Date**: 2026-08-19  
**Base URL**: `/api/v1`  

---

## 1. Student Registration with Fee & Scholarship Terms

### `POST /api/v1/students`
Creates a new student, configures their `StudentFeePlan`, and automatically generates their initial `FeeInvoice` with explicit From-To coverage dates.

#### Request Body
```json
{
  "full_name": "Hamza Tariq",
  "phone": "+92 300 1234567",
  "email": "hamza@example.com",
  "gender": "Male",
  "dob": "2008-04-12",
  "admitted_on": "2026-08-18",
  "class_id": "c1a2b3c4-...",
  "base_monthly_fee": 4000,
  "scholarship_type": "percentage",
  "scholarship_value": 25,
  "scholarship_reason": "merit",
  "billing_anchor_day": 18,
  "initial_fee_override": 1500,
  "initial_period_start": "2026-08-18",
  "initial_period_end": "2026-09-17"
}
```

#### Response `201 Created`
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "s9f8e7d6-...",
      "admission_no": "STU-2026-0042",
      "full_name": "Hamza Tariq",
      "status": "active"
    },
    "fee_plan": {
      "monthly_amount": 4000,
      "discount": 1000,
      "net_monthly_amount": 3000,
      "scholarship_type": "percentage",
      "scholarship_value": 25,
      "scholarship_reason": "merit",
      "billing_anchor_day": 18
    },
    "initial_invoice": {
      "id": "inv-00123-...",
      "period": "2026-08-18",
      "fee_period_start": "2026-08-18",
      "fee_period_end": "2026-09-17",
      "amount": 4000,
      "discount": 2500,
      "net_amount": 1500,
      "due_date": "2026-08-23",
      "status": "unpaid"
    }
  }
}
```

---

## 2. Update Student Fee Plan & Scholarship

### `PUT /api/v1/students/:id/fee-plan`
Modifies an existing student's tuition fee terms, scholarship settings, or anchor billing day.

#### Request Body
```json
{
  "base_monthly_fee": 5000,
  "scholarship_type": "fixed",
  "scholarship_value": 1500,
  "scholarship_reason": "need_based",
  "billing_anchor_day": 15,
  "notes": "Approved by Principal for Autumn term"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "student_id": "s9f8e7d6-...",
    "monthly_amount": 5000,
    "discount": 1500,
    "net_monthly_amount": 3500,
    "scholarship_type": "fixed",
    "scholarship_value": 1500,
    "scholarship_reason": "need_based",
    "billing_anchor_day": 15
  }
}
```

---

## 3. Batch Creation with Course Installment Plan

### `POST /api/v1/batches`
Creates a batch with optional fixed-duration course configuration and default installment divisions.

#### Request Body
```json
{
  "class_id": "c1a2b3c4-...",
  "name": "Full-Stack Web Dev Bootcamp",
  "section_name": "Cohort Alpha",
  "days": "MON,WED,FRI",
  "start_time": "14:00",
  "end_time": "16:00",
  "capacity": 25,
  "course_type": "fixed_course",
  "total_fee": 15000,
  "start_date": "2026-08-01",
  "end_date": "2026-10-31",
  "default_installments": 3
}
```

#### Response `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "b5a4c3d2-...",
    "name": "Full-Stack Web Dev Bootcamp",
    "section_name": "Cohort Alpha",
    "course_type": "fixed_course",
    "total_fee": 15000,
    "start_date": "2026-08-01",
    "end_date": "2026-10-31",
    "default_installments": 3
  }
}
```

---

## 4. Batch Enrollment with Installment Schedule / Late Joiner Handling

### `POST /api/v1/batches/:id/enroll`
Enrolls a student in a batch with automated installment schedule generation and late-enrollment timeline adjustments.

#### Request Body (Standard or Late Enrollment)
```json
{
  "student_id": "s9f8e7d6-...",
  "enrolled_on": "2026-09-01",
  "alignment_mode": "extend_student_timeline",
  "custom_installments": 3,
  "individual_end_date": "2026-11-30"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "id": "enr-7788-...",
      "student_id": "s9f8e7d6-...",
      "batch_id": "b5a4c3d2-...",
      "is_extended_timeline": true,
      "individual_end_date": "2026-11-30",
      "status": "active"
    },
    "first_voucher": {
      "id": "inv-inst-01-...",
      "period": "INST-1-b5a4-s9f8",
      "fee_period_start": "2026-09-01",
      "fee_period_end": "2026-09-30",
      "installment_number": 1,
      "total_installments": 3,
      "amount": 5000,
      "discount": 1000,
      "net_amount": 4000,
      "due_date": "2026-09-06",
      "status": "unpaid"
    },
    "scheduled_installments": [
      {
        "installment_number": 2,
        "total_installments": 3,
        "amount": 4000,
        "due_date": "2026-10-01",
        "fee_period_start": "2026-10-01",
        "fee_period_end": "2026-10-31",
        "status": "scheduled"
      },
      {
        "installment_number": 3,
        "total_installments": 3,
        "amount": 4000,
        "due_date": "2026-11-01",
        "fee_period_start": "2026-11-01",
        "fee_period_end": "2026-11-30",
        "status": "scheduled"
      }
    ]
  }
}
```

---

## 5. Fetch Student Installment Schedules

### `GET /api/v1/students/:id/installment-schedule`
Retrieves all active course installment schedules and their linked voucher states for a student.

#### Response `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "sch-01-...",
      "batch_name": "Full-Stack Web Dev Bootcamp",
      "installment_number": 1,
      "total_installments": 3,
      "amount": 4000,
      "due_date": "2026-09-06",
      "fee_period_start": "2026-09-01",
      "fee_period_end": "2026-09-30",
      "status": "invoiced",
      "invoice_id": "inv-inst-01-...",
      "invoice_status": "unpaid"
    },
    {
      "id": "sch-02-...",
      "batch_name": "Full-Stack Web Dev Bootcamp",
      "installment_number": 2,
      "total_installments": 3,
      "amount": 4000,
      "due_date": "2026-10-01",
      "fee_period_start": "2026-10-01",
      "fee_period_end": "2026-10-31",
      "status": "scheduled",
      "invoice_id": null
    }
  ]
}
```
