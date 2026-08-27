# API Contracts: Student Status Lifecycle & Retention Management

**Feature**: `006-student-status-lifecycle-management`  
**Base URL**: `/api/v1`  
**Authentication**: Bearer JWT (`admin`, `teacher`)

---

## 1. `POST /api/v1/students/:id/status`

Changes a student's lifecycle status, records reason notes, applies fee action, and creates an audit history entry.

### Request
```json
{
  "targetStatus": "inactive",
  "reasonCategory": "medical",
  "remarks": "Student requested 2-month medical leave for surgery recovery",
  "effectiveDate": "2026-08-20",
  "feeAction": "pause_fees"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "e9e968d7-f07d-4120-8188-a9cf5ec176c8",
      "admission_no": "ACAD-2026-005",
      "full_name": "Adnan Khan",
      "status": "inactive",
      "status_reason": "medical",
      "status_remarks": "Student requested 2-month medical leave for surgery recovery",
      "is_fee_paused": true,
      "status_updated_at": "2026-08-19T09:40:00.000Z"
    },
    "historyEntry": {
      "id": "f5a2b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "previous_status": "active",
      "new_status": "inactive",
      "reason_category": "medical",
      "remarks": "Student requested 2-month medical leave for surgery recovery",
      "effective_date": "2026-08-20T00:00:00.000Z",
      "fee_action": "pause_fees",
      "created_at": "2026-08-19T09:40:00.000Z"
    }
  }
}
```

---

## 2. `GET /api/v1/students/:id/status-history`

Retrieves the complete chronological status transition history of a student.

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "f5a2b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "student_id": "e9e968d7-f07d-4120-8188-a9cf5ec176c8",
      "previous_status": "active",
      "new_status": "inactive",
      "reason_category": "medical",
      "remarks": "Student requested 2-month medical leave for surgery recovery",
      "effective_date": "2026-08-20T00:00:00.000Z",
      "fee_action": "pause_fees",
      "changed_by_user_id": "admin-uuid-1234",
      "changed_by_name": "Principal Administrator",
      "created_at": "2026-08-19T09:40:00.000Z"
    }
  ]
}
```

---

## 3. `POST /api/v1/students/:id/reactivate`

Restores an inactive, suspended, or left student back to `active` status, optionally re-assigning them to a batch.

### Request
```json
{
  "targetBatchId": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "monthlyFee": 12000,
  "remarks": "Returned from medical leave and resumed classes"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "e9e968d7-f07d-4120-8188-a9cf5ec176c8",
      "full_name": "Adnan Khan",
      "status": "active",
      "is_fee_paused": false,
      "batch_id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
    }
  }
}
```

---

## 4. `GET /api/v1/students/:id/leaving-certificate`

Generates structured clearance and institutional leaving certificate data for exit documentation.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "admissionNo": "ACAD-2026-005",
    "studentName": "Adnan Khan",
    "parentName": "Tariq Khan",
    "phone": "03061234567",
    "gradeBatch": "Grade 10 - Section A",
    "enrollmentDate": "2024-08-15",
    "leavingDate": "2026-08-19",
    "status": "graduated",
    "reason": "Graduation",
    "attendancePercentage": 96,
    "feeStatus": "Cleared",
    "dueBalance": 0,
    "conductRating": "Exemplary",
    "remarks": "Successfully completed Grade 10 program with distinction."
  }
}
```
