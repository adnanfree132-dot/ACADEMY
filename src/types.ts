export type TabType = 
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'batches'
  | 'subjects'
  | 'attendance'
  | 'fees'
  | 'exams'
  | 'homework'
  | 'timetable'
  | 'crm'
  | 'announcements'
  | 'whatsapp'
  | 'settings';

export interface Student {
  id: string;
  regNo: string;
  name: string;
  parentName: string;
  phone: string;
  email: string;
  gradeBatch: string;
  gender: 'Male' | 'Female';
  status: 'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left';
  totalFee: number;
  paidFee: number;
  dueBalance: number;
  isDefaulter: boolean;
  dueDate: string;
  photoUrl?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject?: string;
  qualification?: string;
  assignedSubjects?: string[];
  assignedBatches?: string[];
  email: string;
  phone: string;
  batchesAssigned?: string[];
  status?: 'Active' | 'On Leave';
  avatar?: string;
}

export interface Batch {
  id: string;
  code?: string;
  name: string;
  classLevel?: string;
  teacherName?: string;
  timing?: string;
  instructor?: string;
  room: string;
  schedule?: string;
  studentsCount: number;
  capacity?: number;
  maxCapacity?: number;
}

export interface FeeTransaction {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  regNo: string;
  amount: number;
  date: string;
  method: string;
  notes?: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  regNo: string;
  batchId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
}

export interface CRMLead {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  gradeInterest?: string;
  targetClass?: string;
  source?: string;
  status: 'New Inquiry' | 'Follow Up' | 'Trial Class' | 'Enrolled' | 'Closed' | 'New' | 'Contacted' | 'Converted';
  followUpDate?: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  date: string;
  author?: string;
  urgent?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}
