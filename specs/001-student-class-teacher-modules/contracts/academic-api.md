# API Contract: Academic Structure & Batches (M5 ACA)

**Base URL**: `/api/v1`  
**Security**: Bearer JWT Authorization Token

---

## 1. List Classes
`GET /api/v1/classes`

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "893c5d6e-9821-4f6c-b391-729bc412a819",
      "name": "Grade 10",
      "is_active": true
    }
  ]
}
```

---

## 2. List Batches
`GET /api/v1/batches`

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Grade 10 - Morning Alpha",
      "class_id": "893c5d6e-9821-4f6c-b391-729bc412a819",
      "teacher_id": "78a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
      "days": "MON,WED,FRI",
      "start_time": "08:00",
      "end_time": "10:00",
      "capacity": 30,
      "is_active": true,
      "class": {
        "id": "893c5d6e-9821-4f6c-b391-729bc412a819",
        "name": "Grade 10"
      },
      "teacher": {
        "id": "78a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
        "user": {
          "full_name": "Prof. Zahid Hussain"
        }
      }
    }
  ]
}
```

---

## 3. Create Batch
`POST /api/v1/batches`

### Request Body (JSON)
```json
{
  "name": "Grade 11 - Evening Physics",
  "classLevel": "Grade 11",
  "teacherId": "78a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
  "timing": "16:00 - 18:00",
  "room": "Lab 2",
  "capacity": 25
}
```

### Response Envelope (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "f5a6b7c8-d9e0-1a2b-3c4d-5e6f7a8b9c0d",
    "name": "Grade 11 - Evening Physics",
    "capacity": 25,
    "is_active": true
  }
}
```

---

## 4. Enroll Student in Batch
`POST /api/v1/batches/:id/enroll`

### Request Body (JSON)
```json
{
  "studentId": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
  "adminOverride": false
}
```

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "enr_12345",
    "student_id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
    "batch_id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "active"
  }
}
```

### Error Responses
- `409 Conflict`: `{ "success": false, "error": "Batch capacity ceiling reached (30/30)", "meta": { "canOverride": true } }`
