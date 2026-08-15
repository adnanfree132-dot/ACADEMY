# API Contract: Teachers & Faculty Module (M4 TCH)

**Base URL**: `/api/v1`  
**Security**: Bearer JWT Authorization Token

---

## 1. List Faculty Members
`GET /api/v1/teachers`

### Response Envelope (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "78a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c",
      "user_id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "qualification": "M.Sc Mathematics",
      "joined_on": "2025-08-01T00:00:00.000Z",
      "user": {
        "id": "u1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "full_name": "Prof. Zahid Hussain",
        "email": "zahid.hussain@academy.com",
        "phone": "+923005551234",
        "is_active": true
      }
    }
  ]
}
```

---

## 2. Onboard Faculty Member
`POST /api/v1/teachers`

### Request Body (JSON)
```json
{
  "fullName": "Dr. Sarah Ahmed",
  "email": "sarah.ahmed@academy.com",
  "phone": "+923007778899",
  "qualification": "Ph.D Organic Chemistry"
}
```

### Response Envelope (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "t9a0b1c2-d3e4-5f6a-7b8c-9d0e1f2a3b4c",
    "qualification": "Ph.D Organic Chemistry",
    "user_id": "u9a0b1c2-d3e4-5f6a-7b8c-9d0e1f2a3b4c"
  }
}
```

---

## 3. Delete Faculty Member (Guarded)
`DELETE /api/v1/teachers/:id`

### Successful Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "t9a0b1c2-d3e4-5f6a-7b8c-9d0e1f2a3b4c"
  }
}
```

### Blocked Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Cannot delete faculty member assigned to active batches. Reassign batches first.",
  "data": {
    "activeBatches": [
      {
        "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Grade 10 - Morning Alpha"
      }
    ]
  }
}
```
