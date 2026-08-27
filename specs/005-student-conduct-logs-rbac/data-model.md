# Phase 1: Data Model Specification

**Feature**: Student Conduct Logs, Role-Based Access Control & Multi-Role Portals  
**Branch**: `005-student-conduct-logs-rbac`  
**Date**: 2026-08-18

---

## 1. Entity Relationship Overview

```text
+-------------------+        +--------------------+        +--------------------+
|       User        |        |      Teacher       |        |      Student       |
|-------------------|        |--------------------|        |--------------------|
| id (PK)           | 1    1 | id (PK)            |        | id (PK)            |
| role              |<-------| user_id (FK)       |        | user_id (FK, opt)  |
| full_name         |        | batches (rel)      |        | enrollments (rel)  |
+-------------------+        +--------------------+        +--------------------+
        | 1                                                          | 1
        |                                                            |
        | 1..* (authors)                                             | 1..*
        v                                                            v
+-------------------------------------------------------------------------------+
|                                  ConductLog                                   |
|-------------------------------------------------------------------------------|
| id: String (UUID PK)                                                          |
| student_id: String (FK -> Student.id)                                         |
| batch_id: String? (FK -> Batch.id, nullable)                                  |
| author_id: String (FK -> User.id)                                             |
| author_name: String                                                           |
| author_role: String ("admin" | "teacher")                                     |
| category: String ("commendation" | "infraction" | "academic" | "attendance"   |
|                   | "general")                                                |
| severity: String ("positive" | "neutral" | "warning" | "critical")            |
| title: String?                                                                |
| remark: String                                                                |
| is_confidential: Boolean (default: false)                                     |
| is_deleted: Boolean (default: false)                                          |
| deleted_at: DateTime? (nullable)                                              |
| deleted_by: String? (nullable)                                                |
| created_at: DateTime (default: now)                                           |
| updated_at: DateTime (updatedAt)                                              |
+-------------------------------------------------------------------------------+

+-------------------+                                      +--------------------+
|       User        |                                      |      Student       |
| (role="parent")   | 1                                  1 |                    |
+-------------------+                                      +--------------------+
        |                                                            |
        | 1..*                                                       | 1..*
        +----------------------------->+<----------------------------+
                                       |
                         +---------------------------+
                         |       ParentStudent       |
                         |---------------------------|
                         | id: String (UUID PK)      |
                         | parent_id: String (FK)    |
                         | student_id: String (FK)   |
                         | relationship: String      |
                         |   ("father"|"mother"|     |
                         |    "guardian")            |
                         | created_at: DateTime      |
                         +---------------------------+
```

---

## 2. Prisma Schema Definitions

```prisma
model ConductLog {
  id              String    @id @default(uuid())
  student_id      String
  student         Student   @relation(fields: [student_id], references: [id], onDelete: Cascade)
  batch_id        String?
  batch           Batch?    @relation(fields: [batch_id], references: [id])
  author_id       String
  author          User      @relation(fields: [author_id], references: [id])
  author_name     String
  author_role     String    // admin, teacher
  category        String    // commendation, infraction, academic, attendance, general
  severity        String    @default("neutral") // positive, neutral, warning, critical
  title           String?
  remark          String
  is_confidential Boolean   @default(false)
  is_deleted      Boolean   @default(false)
  deleted_at      DateTime?
  deleted_by      String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@index([student_id])
  @@index([batch_id])
  @@index([author_id])
  @@index([is_deleted])
}

model ParentStudent {
  id           String   @id @default(uuid())
  parent_id    String
  parent       User     @relation(fields: [parent_id], references: [id], onDelete: Cascade)
  student_id   String
  student      Student  @relation(fields: [student_id], references: [id], onDelete: Cascade)
  relationship String   @default("guardian") // father, mother, guardian
  created_at   DateTime @default(now())

  @@unique([parent_id, student_id])
  @@index([parent_id])
  @@index([student_id])
}
```

---

## 3. Validation Rules (Zod Schemas)

### Create Conduct Log Schema
```typescript
export const createConductLogSchema = z.object({
  student_id: z.string().uuid("Invalid student ID format"),
  batch_id: z.string().uuid("Invalid batch ID format").optional(),
  category: z.enum(["commendation", "infraction", "academic", "attendance", "general"]),
  severity: z.enum(["positive", "neutral", "warning", "critical"]).default("neutral"),
  title: z.string().max(120).optional(),
  remark: z.string().min(3, "Remark must be at least 3 characters").max(2000, "Remark too long"),
  is_confidential: z.boolean().default(false)
});
```

### Update Conduct Log Schema
```typescript
export const updateConductLogSchema = z.object({
  category: z.enum(["commendation", "infraction", "academic", "attendance", "general"]).optional(),
  severity: z.enum(["positive", "neutral", "warning", "critical"]).optional(),
  title: z.string().max(120).optional(),
  remark: z.string().min(3, "Remark must be at least 3 characters").max(2000, "Remark too long").optional(),
  is_confidential: z.boolean().optional()
});
```

---

## 4. State & Lifecycle Transitions

| Action | Pre-condition | Post-condition | Audit Log Generated |
| :--- | :--- | :--- | :---: |
| **Create Log** | User is `admin` OR `teacher` with student in assigned batch | New `ConductLog` record created (`is_deleted=false`) | Yes (`CONDUCT_LOG_CREATED`) |
| **Edit Log** | User is `admin` OR authoring `teacher` (`author_id === user.id`) | Fields updated; `updated_at` refreshed | Yes (`CONDUCT_LOG_UPDATED`) |
| **Soft Delete** | User is `admin` OR authoring `teacher` (`author_id === user.id`) | `is_deleted=true`, `deleted_at=now()`, `deleted_by=user.id` | Yes (`CONDUCT_LOG_DELETED`) |
| **Student/Parent Query** | Request authenticated as `student` or `parent` | Returns only logs where `is_confidential=false` and `is_deleted=false` scoped to own child/record | No (Read operation) |
