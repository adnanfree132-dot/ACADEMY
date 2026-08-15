# API Contract: Students Module (M2 STU)

**Base URL**: `/api/v1`  
**Security**: Bearer JWT Authorization Token

---

## 1. List Students
`GET /api/v1/students`

### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `q` | string | No | Search across full name, admission number, or phone |
| `status` | string | No | Filter by `'active'`, `'left'`, `'suspended'`, `'completed'` |
| `classId` | string (UUID) | No | Filter by enrolled class grade |

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "c8b4f4c2-7b56-4c3e-9764-67253be61da2",
      "admission_no": "ACAD-2026-001",
      "full_name": "Ayesha Khan",
      "phone": "+923001234567",
      "email": "ayesha.khan@example.com",
      "dob": "2008-05-14",
      "gender": "Female",
      "address": "House 12, Street 4, Islamabad",
      "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "status": "active",
      "class_id": "893c5d6e-9821-4f6c-b391-729bc412a819",
      "class": {
        "id": "893c5d6e-9821-4f6c-b391-729bc412a819",
        "name": "Grade 10"
      },
      "feePlan": {
        "monthly_amount": 15000,
        "discount": 0,
        "due_day": 5
      },
      "admitted_on": "2026-01-10T08:00:00.000Z"
    }
  ]
}
```

---

## 2. Register Student
`POST /api/v1/students`

### Request Body (JSON)
```json
{
  "name": "Hamza Ali",
  "parentName": "Tariq Ali",
  "phone": "+923019876543",
  "email": "hamza.ali@example.com",
  "gender": "Male",
  "gradeBatch": "Grade 10 Batch A",
  "totalFee": 15000,
  "dueDate": "2026-09-05",
  "batchIds": ["b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"],
  "adminOverride": false
}
```

### Response Envelope (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
    "admission_no": "ACAD-2026-042",
    "full_name": "Hamza Ali",
    "phone": "+923019876543",
    "email": "hamza.ali@example.com",
    "status": "active"
  }
}
```

### Error Responses
- `400 Bad Request`: `{ "success": false, "error": "Full name and valid phone are required" }`
- `409 Conflict`: `{ "success": false, "error": "Batch capacity ceiling reached (30/30)", "meta": { "canOverride": true } }`

---

## 3. Update Student Profile & Status
`PUT /api/v1/students/:id`

### Request Body (JSON)
```json
{
  "fullName": "Hamza Tariq Ali",
  "phone": "+923019876543",
  "email": "hamza.tariq@example.com",
  "gender": "Male",
  "status": "left"
}
```

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
    "full_name": "Hamza Tariq Ali",
    "status": "left"
  }
}
```

---

## 4. Archive / Soft-Delete Student
`DELETE /api/v1/students/:id`

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": {
    "message": "Student archived successfully",
    "student": {
      "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
      "status": "left"
    }
  }
}
```
