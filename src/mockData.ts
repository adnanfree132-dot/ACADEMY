import { Student, Teacher, Batch, FeeTransaction, CRMLead, Announcement, Subject } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    regNo: 'STD-2026-001',
    name: 'Aarav Patel',
    parentName: 'Rajesh Patel',
    phone: '+1 (555) 234-5678',
    email: 'aarav.p@example.com',
    gradeBatch: 'Grade 10 - Sec A',
    gender: 'Male',
    status: 'Active',
    totalFee: 10000,
    paidFee: 10000,
    dueBalance: 0,
    isDefaulter: false,
    dueDate: '2026-08-01'
  },
  {
    id: 's2',
    regNo: 'STD-2026-002',
    name: 'Zara Khan',
    parentName: 'Tariq Khan',
    phone: '+1 (555) 345-6789',
    email: 'zara.k@example.com',
    gradeBatch: 'Grade 11 - Pre-Eng',
    gender: 'Female',
    status: 'Active',
    totalFee: 12000,
    paidFee: 6000,
    dueBalance: 6000,
    isDefaulter: false,
    dueDate: '2026-08-15'
  },
  {
    id: 's3',
    regNo: 'STD-2026-003',
    name: 'Bilal Ahmed',
    parentName: 'Nasir Ahmed',
    phone: '+1 (555) 456-7890',
    email: 'bilal.a@example.com',
    gradeBatch: 'Grade 10 - Sec B',
    gender: 'Male',
    status: 'Active',
    totalFee: 10000,
    paidFee: 0,
    dueBalance: 25000,
    isDefaulter: true,
    dueDate: '2026-07-01'
  },
  {
    id: 's4',
    regNo: 'STD-2026-004',
    name: 'Ananya Sharma',
    parentName: 'Vikram Sharma',
    phone: '+1 (555) 567-8901',
    email: 'ananya.s@example.com',
    gradeBatch: 'Grade 9 - Morning',
    gender: 'Female',
    status: 'Active',
    totalFee: 9500,
    paidFee: 9500,
    dueBalance: 0,
    isDefaulter: false,
    dueDate: '2026-08-05'
  },
  {
    id: 's5',
    regNo: 'STD-2026-005',
    name: 'Hamza Malik',
    parentName: 'Kamran Malik',
    phone: '+1 (555) 678-9012',
    email: 'hamza.m@example.com',
    gradeBatch: 'Grade 12 - Pre-Med',
    gender: 'Male',
    status: 'Active',
    totalFee: 15000,
    paidFee: 5000,
    dueBalance: 10000,
    isDefaulter: false,
    dueDate: '2026-08-20'
  },
  {
    id: 's6',
    regNo: 'STD-2026-006',
    name: 'Meera Sen',
    parentName: 'Amit Sen',
    phone: '+1 (555) 789-0123',
    email: 'meera.s@example.com',
    gradeBatch: 'Grade 11 - Computer Science',
    gender: 'Female',
    status: 'Active',
    totalFee: 13000,
    paidFee: 0,
    dueBalance: 28000,
    isDefaulter: true,
    dueDate: '2026-06-15'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Dr. Fatima Zahra',
    subject: 'Physics',
    qualification: 'Ph.D. in Physics, MIT',
    assignedSubjects: ['Physics Mechanics', 'Physics Optics'],
    assignedBatches: ['Grade 11 - Pre-Eng', 'Grade 12 - Pre-Eng'],
    email: 'fatima.zahra@academia.edu',
    phone: '+1 (555) 111-2233',
    status: 'Active'
  },
  {
    id: 't2',
    name: 'Prof. Ahmed Raza',
    subject: 'Mathematics',
    qualification: 'M.Sc. Pure Mathematics, Oxford',
    assignedSubjects: ['Calculus I & II', 'Linear Algebra'],
    assignedBatches: ['Grade 10 - Sec A', 'Grade 12 - Pre-Eng'],
    email: 'ahmed.raza@academia.edu',
    phone: '+1 (555) 222-3344',
    status: 'Active'
  },
  {
    id: 't3',
    name: 'Dr. Sarah Connor',
    subject: 'Chemistry',
    qualification: 'Ph.D. in Organic Chemistry, Stanford',
    assignedSubjects: ['Organic Chemistry', 'Analytical Chemistry'],
    assignedBatches: ['Grade 10 - Sec B', 'Grade 11 - Pre-Med'],
    email: 'sarah.connor@academia.edu',
    phone: '+1 (555) 333-4455',
    status: 'Active'
  },
  {
    id: 't4',
    name: 'Prof. John Doe',
    subject: 'Computer Science',
    qualification: 'M.S. Computer Science, Carnegie Mellon',
    assignedSubjects: ['Data Structures & Algorithms', 'Web Development'],
    assignedBatches: ['Grade 11 - Computer Science'],
    email: 'john.doe@academia.edu',
    phone: '+1 (555) 444-5566',
    status: 'Active'
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'b1',
    code: 'G10-A',
    name: 'Grade 10 - Sec A',
    classLevel: 'Grade 10',
    teacherName: 'Prof. Ahmed Raza',
    instructor: 'Prof. Ahmed Raza',
    timing: '08:00 AM - 10:00 AM',
    room: 'Room 101',
    schedule: 'Mon - Fri',
    studentsCount: 28,
    capacity: 35
  },
  {
    id: 'b2',
    code: 'G10-B',
    name: 'Grade 10 - Sec B',
    classLevel: 'Grade 10',
    teacherName: 'Dr. Sarah Connor',
    instructor: 'Dr. Sarah Connor',
    timing: '10:15 AM - 12:15 PM',
    room: 'Room 102',
    schedule: 'Mon - Fri',
    studentsCount: 24,
    capacity: 30
  },
  {
    id: 'b3',
    code: 'G11-ENG',
    name: 'Grade 11 - Pre-Eng',
    classLevel: 'Grade 11',
    teacherName: 'Dr. Fatima Zahra',
    instructor: 'Dr. Fatima Zahra',
    timing: '12:30 PM - 02:30 PM',
    room: 'Physics Lab 1',
    schedule: 'Mon, Wed, Fri',
    studentsCount: 22,
    capacity: 25
  },
  {
    id: 'b4',
    code: 'G11-CS',
    name: 'Grade 11 - Computer Science',
    classLevel: 'Grade 11',
    teacherName: 'Prof. John Doe',
    instructor: 'Prof. John Doe',
    timing: '03:00 PM - 05:00 PM',
    room: 'Computer Lab 2',
    schedule: 'Tue, Thu, Sat',
    studentsCount: 20,
    capacity: 25
  }
];

export const INITIAL_TRANSACTIONS: FeeTransaction[] = [
  {
    id: 'txn-1',
    receiptNo: 'REC-2026-0801',
    studentId: 's1',
    studentName: 'Aarav Patel',
    regNo: 'STD-2026-001',
    amount: 10000,
    date: '2026-08-01',
    method: 'Online Transfer',
    notes: 'Full Fall term fee paid'
  },
  {
    id: 'txn-2',
    receiptNo: 'REC-2026-0802',
    studentId: 's2',
    studentName: 'Zara Khan',
    regNo: 'STD-2026-002',
    amount: 6000,
    date: '2026-08-03',
    method: 'Cash',
    notes: 'First installment payment'
  },
  {
    id: 'txn-3',
    receiptNo: 'REC-2026-0803',
    studentId: 's4',
    studentName: 'Ananya Sharma',
    regNo: 'STD-2026-004',
    amount: 9500,
    date: '2026-08-05',
    method: 'Credit Card',
    notes: 'Annual registration fee'
  },
  {
    id: 'txn-4',
    receiptNo: 'REC-2026-0804',
    studentId: 's5',
    studentName: 'Hamza Malik',
    regNo: 'STD-2026-005',
    amount: 5000,
    date: '2026-08-08',
    method: 'Cheque',
    notes: 'Partial payment'
  }
];

export const INITIAL_LEADS: CRMLead[] = [
  {
    id: 'lead-1',
    studentName: 'Rahul Verma',
    parentName: 'Sanjay Verma',
    phone: '+1 (555) 901-2345',
    targetClass: 'Grade 11 - Pre-Eng',
    source: 'Website Inquiry',
    date: '2026-08-12',
    status: 'New'
  },
  {
    id: 'lead-2',
    studentName: 'Sana Sheikh',
    parentName: 'Imran Sheikh',
    phone: '+1 (555) 012-3456',
    targetClass: 'Grade 10',
    source: 'Walk-in',
    date: '2026-08-10',
    status: 'Converted'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Mid-Term Examination Schedule Announced',
    content: 'The mid-term examination timetable for Grades 9–12 has been published. Please review your schedules.',
    date: '2026-08-10',
    author: 'Principal Office',
    targetAudience: 'All Students & Parents'
  },
  {
    id: 'ann-2',
    title: 'Parent-Teacher Conference Day',
    content: 'Parent-Teacher meetings will be held this Saturday from 09:00 AM to 02:00 PM in the Main Auditorium.',
    date: '2026-08-08',
    author: 'Academic Coordinator',
    targetAudience: 'Parents'
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Physics', code: 'PHY-101' },
  { id: 'sub-2', name: 'Mathematics', code: 'MTH-101' },
  { id: 'sub-3', name: 'Chemistry', code: 'CHM-101' },
  { id: 'sub-4', name: 'Biology', code: 'BIO-101' },
  { id: 'sub-5', name: 'Computer Science', code: 'CSC-101' },
  { id: 'sub-6', name: 'English Literature', code: 'ENG-101' }
];
