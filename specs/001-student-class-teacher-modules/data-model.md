# Data Model: Student, Class, and Teacher Core Modules

**Feature**: `001-student-class-teacher-modules`  
**Date**: 2026-08-15  
**Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

---

## Entity Relationship Diagram

```
       +-----------------------------------------------------------+
       |                           User                            |
       |-----------------------------------------------------------|
       | id: UUID (PK)                                             |
       | username: String? (Unique)                                |
       | role: String ('admin' | 'teacher' | 'student' | 'parent') |
       | full_name: String                                         |
       | email: String? (Unique)                                   |
       | phone: String? (Unique)                                   |
       | password_hash: String                                     |
       | is_active: Boolean (Default: true)                        |
       | created_at: DateTime                                      |
       | updated_at: DateTime                                      |
       +-----------------------------+-----------------------------+
                                     | 1:1
                     +---------------+---------------+
                     |                               |
                     v 1:1                           v 1:1 (optional)
       +-----------------------------+ +-----------------------------+
       |           Teacher           | |           Student           |
       |-----------------------------| |-----------------------------|
       | id: UUID (PK)               | | id: UUID (PK)               |
       | user_id: UUID (FK -> User)  | | user_id: UUID? (FK -> User) |
       | qualification: String?      | | admission_no: String (UQ)   |
       | custom_fields: Json?        | | full_name: String           |
       | joined_on: DateTime         | | phone: String               |
       +--------------+--------------+ | email: String?              |
                      |                | dob: String? (YYYY-MM-DD)   |
                      | 1:N            | gender: String ('Male'|'Fem')|
                      v                | address: String?            |
       +-----------------------------+ | photo_url: String?          |
       |            Batch            | | custom_fields: Json?        |
       |-----------------------------| | status: String (active/left)|
       | id: UUID (PK)               | | class_id: UUID? (FK->Class) |
       | class_id: UUID (FK -> Class)| | admitted_on: DateTime       |
       | name: String                | | created_at: DateTime        |
       | teacher_id: UUID? (FK->Tch) | +--------------+--------------+
       | days: String ("MON,WED,FRI")|                |
       | start_time: String ("14:00")|                | 1:N
       | end_time: String ("16:00")  |                |
       | capacity: Int (Default: 30) |                |
       | is_active: Boolean (true)   |                |
       +--------------+--------------+                |
                      |                               |
                      | 1:N                           v 1:N
       +--------------v-------------------------------+--------------+
       |                         Enrollment                          |
       |-------------------------------------------------------------|
       | id: UUID (PK)                                               |
       | student_id: UUID (FK -> Student)                            |
       | batch_id: UUID (FK -> Batch)                                |
       | enrolled_on: DateTime (Default: now())                      |
       | status: String ('active' | 'removed')                       |
       | Unique Constraint: [student_id, batch_id]                   |
       +-------------------------------------------------------------+

       +-----------------------------+ +-----------------------------+
       |            Class            | |       StudentFeePlan        |
       |-----------------------------| |-----------------------------|
       | id: UUID (PK)               | | student_id: UUID (PK, FK)   |
       | name: String (Unique)       | | monthly_amount: Float       |
       | is_active: Boolean (true)   | | discount: Float (Def: 0)    |
       +-----------------------------+ | due_day: Int (Def: 5)       |
                                       | notes: String?              |
                                       +-----------------------------+
```

---

## Detailed Entity Specifications

### 1. Student (`students` table)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, `@default(uuid())` | Unique student internal identifier |
| `user_id` | UUID | FK -> `User.id`, Unique, Nullable | Optional portal authentication login |
| `admission_no` | String | Unique, Indexed | Formatted registration code (`ACAD-YYYY-NNN`) |
| `full_name` | String | Not Null | Student's full official name |
| `phone` | String | Not Null | Primary contact / parent phone |
| `email` | String | Nullable | Primary or guardian email address |
| `dob` | String | Nullable | Date of birth formatted as `YYYY-MM-DD` |
| `gender` | String | Default `'Male'` | Learner gender designation |
| `address` | String | Nullable | Residential address details |
| `photo_url` | String | Nullable | Link to uploaded avatar file |
| `custom_fields`| JSONB | Nullable | Arbitrary custom metadata |
| `admitted_on` | DateTime | Default `now()` | Formal admission timestamp |
| `status` | String | Default `'active'` | Values: `'active'`, `'left'`, `'suspended'`, `'completed'` |
| `class_id` | UUID | FK -> `Class.id`, Nullable | Linked current grade/class |
| `created_at` | DateTime | Default `now()` | Record creation timestamp |

### 2. Teacher (`teachers` table)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, `@default(uuid())` | Unique teacher record identifier |
| `user_id` | UUID | FK -> `User.id`, Unique, Cascade | Linked user account with `role = 'teacher'` |
| `qualification`| String| Nullable | Academic degrees / subject expertise |
| `custom_fields`| JSONB | Nullable | Emergency contact, certifications |
| `joined_on` | DateTime | Default `now()` | Date faculty member joined academy |

### 3. Class (`classes` table)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, `@default(uuid())` | Unique class identifier |
| `name` | String | Unique | Name of grade level (e.g., "Grade 10", "O-Levels") |
| `is_active` | Boolean | Default `true` | Active academic offering flag |

### 4. Batch (`batches` table)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, `@default(uuid())` | Unique batch instance identifier |
| `class_id` | UUID | FK -> `Class.id`, Not Null | Parent class grade |
| `name` | String | Not Null | Cohort label (e.g., "Morning Batch A") |
| `teacher_id` | UUID | FK -> `Teacher.id`, Nullable | Designated lead instructor |
| `days` | String | Default `'MON,WED,FRI'` | Scheduled active weekdays |
| `start_time` | String | Not Null | Session start time (`HH:MM`) |
| `end_time` | String | Not Null | Session end time (`HH:MM`) |
| `capacity` | Integer | Default `30` | Maximum student capacity ceiling |
| `is_active` | Boolean | Default `true` | Soft-deactivation status flag |

### 5. Enrollment (`enrollments` table)
| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, `@default(uuid())` | Unique enrollment record identifier |
| `student_id` | UUID | FK -> `Student.id`, Not Null | Enrolled student reference |
| `batch_id` | UUID | FK -> `Batch.id`, Not Null | Enrolled batch reference |
| `enrolled_on` | DateTime | Default `now()` | Date student joined the batch |
| `status` | String | Default `'active'` | Values: `'active'`, `'removed'` |
| **Index** | Compound | `@@unique([student_id, batch_id])` | Prevents duplicate student enrollments |

---

## State Transition Models

### Student Status Lifecycle
```
             +------------+
             |   (NEW)    |
             +-----+------+
                   |
                   v (Register)
             +------------+
             |   ACTIVE   | <-------------------------+
             +-----+------+                           |
                   |                                  |
         +---------+---------+                        | (Re-admit)
         |                   |                        |
         v (Depart)          v (Disciplinary)         |
  +--------------+    +--------------+                |
  |     LEFT     |    |  SUSPENDED   | ---------------+
  +--------------+    +--------------+
  (Fee plan frozen,   (Fee plan frozen,
   enrollments removed)enrollments removed)
```
