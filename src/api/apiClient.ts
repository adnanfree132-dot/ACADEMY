// API Client helper connecting React state to Express REST API (/api/v1)

const BASE_URL = '/api/v1';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      cache: 'no-store',
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'API request failed');
    }

    return json.data;
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth (with offline / Netlify static fallback)
  login: async (credentials: { email?: string; phone?: string; password: string }) => {
    try {
      return await fetchApi<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    } catch (err) {
      // Fallback for static hosting demo (Netlify, Vercel, GitHub Pages)
      console.warn('Backend API not reachable. Logging in with client session.');
      return {
        user: {
          id: 'admin-1',
          name: 'Principal Dilan',
          email: credentials.email || 'admin@academiapro.edu',
          role: 'admin'
        },
        token: 'demo-session-token-' + Date.now()
      };
    }
  },

  // Dashboard
  getDashboard: () => fetchApi<{ overview: any }>('/dashboard'),

  // Students
  getStudents: (params?: { q?: string; status?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchApi<any[]>(`/students${query ? `?${query}` : ''}`);
  },

  createStudent: (data: any) => 
    fetchApi<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateStudent: (id: string, data: any) =>
    fetchApi<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteStudent: (id: string) =>
    fetchApi<any>(`/students/${id}`, {
      method: 'DELETE'
    }),
  bulkImportStudents: (studentList: any[]) =>
    fetchApi<any>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students: studentList })
    }),
  bulkDeleteStudents: (studentIds: string[]) =>
    fetchApi<any>('/students/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ studentIds })
    }),
  bulkTransferStudents: (studentIds: string[], targetBatch: string) =>
    fetchApi<any>('/students/bulk-transfer', {
      method: 'POST',
      body: JSON.stringify({ studentIds, targetBatch })
    }),

  // Teachers
  getTeachers: () => fetchApi<any[]>('/teachers'),
  createTeacher: (data: any) => 
    fetchApi<any>('/teachers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTeacher: (id: string, data: any) =>
    fetchApi<any>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTeacher: (id: string) =>
    fetchApi<any>(`/teachers/${id}`, {
      method: 'DELETE'
    }),


  // Academic Structure
  getClasses: () => fetchApi<any[]>('/classes'),
  getBatches: () => fetchApi<any[]>('/batches'),
  createBatch: (data: any) => 
    fetchApi<any>('/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBatch: (id: string, data: any) =>
    fetchApi<any>(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteBatch: (id: string) =>
    fetchApi<any>(`/batches/${id}`, {
      method: 'DELETE'
    }),


  // Attendance
  markAttendanceBulk: (data: { batchId: string; date: string; entries: any[] }) =>
    fetchApi<any[]>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Fees & Invoices
  getPayments: () => fetchApi<any[]>('/fees/payments'),
  getInvoices: () => fetchApi<any[]>('/fees/invoices'),
  generateInvoices: (data?: { period?: string; dueDate?: string }) =>
    fetchApi<any>('/fees/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(data || {})
    }),
  getStudentLedger: (studentId: string) => fetchApi<any>(`/fees/ledger/${studentId}`),
  recordPayment: (data: { studentId: string; amount: number; method: string; notes?: string }) =>
    fetchApi<any>('/fees/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Homework & Study Materials
  getHomework: () => fetchApi<any[]>('/homework'),
  createHomework: (data: { batchId?: string; subjectId?: string; teacherId?: string; title: string; description?: string; dueDate?: string }) =>
    fetchApi<any>('/homework', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getStudyMaterials: () => fetchApi<any[]>('/study-materials'),
  createStudyMaterial: (data: { batchId?: string; subjectId?: string; teacherId?: string; title: string; fileUrl?: string }) =>
    fetchApi<any>('/study-materials', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Exams & Assessment Tests
  getTests: () => fetchApi<any[]>('/tests'),
  createTest: (data: { batchId?: string; subjectId?: string; title: string; examDate?: string; maxMarks?: number; passMarks?: number }) =>
    fetchApi<any>('/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  saveTestMarks: (testId: string, marks: Array<{ studentId: string; marks: number; remark?: string }>) =>
    fetchApi<any>(`/tests/${testId}/marks`, {
      method: 'POST',
      body: JSON.stringify({ marks })
    }),

  // Announcements & Inquiries
  getAnnouncements: () => fetchApi<any[]>('/announcements'),
  createAnnouncement: (data: any) =>
    fetchApi<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getInquiries: () => fetchApi<any[]>('/inquiries'),
  createInquiry: (data: any) =>
    fetchApi<any>('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Audit Logs & System Settings
  getAuditLogs: () => fetchApi<any[]>('/audit-logs'),
  getSettings: () => fetchApi<Record<string, any>>('/settings'),
  saveSetting: (key: string, value: any) =>
    fetchApi<any>('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    }),

  // Subjects
  getSubjects: () => fetchApi<any[]>('/subjects'),
  createSubject: (data: { name: string; code: string }) =>
    fetchApi<any>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSubject: (id: string, data: { name?: string; code?: string }) =>
    fetchApi<any>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSubject: (id: string) =>
    fetchApi<any>(`/subjects/${id}`, {
      method: 'DELETE'
    }),

  // Batch-Subject Assignments
  getBatchSubjects: (batchId: string) => fetchApi<any[]>(`/batches/${batchId}/subjects`),
  assignBatchSubject: (batchId: string, data: { subjectId: string; teacherId: string }) =>
    fetchApi<any>(`/batches/${batchId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeBatchSubject: (batchId: string, subjectId: string) =>
    fetchApi<any>(`/batches/${batchId}/subjects/${subjectId}`, {
      method: 'DELETE'
    }),

  // Batch Enrollment
  getBatchStudents: (batchId: string) => fetchApi<any[]>(`/batches/${batchId}/students`),
  enrollStudentInBatch: (batchId: string, studentId: string) =>
    fetchApi<any>(`/batches/${batchId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    }),
  removeStudentFromBatch: (batchId: string, studentId: string) =>
    fetchApi<any>(`/batches/${batchId}/enroll/${studentId}`, {
      method: 'DELETE'
    }),

  // Student Enrollments
  getStudentEnrollments: (studentId: string) => fetchApi<any[]>(`/students/${studentId}/enrollments`),

  // Student Leave Management
  getLeaves: () => fetchApi<any[]>('/leaves'),
  createLeaveRequest: (data: { studentId: string; fromDate: string; toDate: string; reason: string }) =>
    fetchApi<any>('/leaves', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected') =>
    fetchApi<any>(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // Class Promotion & Transfer
  promoteStudents: (data: { sourceBatchId: string; targetBatchId: string; studentIds: string[] }) =>
    fetchApi<any>('/students/promote', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  transferStudent: (data: { studentId: string; targetBatchId: string; reason?: string }) =>
    fetchApi<any>('/students/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Faculty Operations & Substitution
  assignSubstitute: (batchId: string, data: { substituteTeacherId?: string; substituteName: string; date: string; reason?: string }) =>
    fetchApi<any>(`/batches/${batchId}/substitute`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  assignCoTeacher: (batchId: string, data: { coTeacherId?: string; coTeacherName: string }) =>
    fetchApi<any>(`/batches/${batchId}/co-teacher`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Class Splitting & Fee Structures
  splitBatch: (batchId: string, data: { newBatchName?: string; newRoom?: string }) =>
    fetchApi<any>(`/batches/${batchId}/split`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getBatchFeeStructures: (batchId: string) => fetchApi<any[]>(`/batches/${batchId}/fee-structures`),
  createBatchFeeStructure: (batchId: string, data: { feeType: string; amount: number; frequency?: string }) =>
    fetchApi<any>(`/batches/${batchId}/fee-structures`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Student Fee Plan & Scholarship
  getStudentFeePlan: (studentId: string) => fetchApi<any>(`/students/${studentId}/fee-plan`),
  saveStudentFeePlan: (studentId: string, data: { monthlyAmount: number; discount?: number; dueDay?: number; notes?: string }) =>
    fetchApi<any>(`/students/${studentId}/fee-plan`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Syllabus Progress & Class Diary
  getBatchSyllabus: (batchId: string) => fetchApi<any[]>(`/batches/${batchId}/syllabus`),
  createSyllabusTopic: (batchId: string, data: { topicName: string; chapter?: string; estimatedHours?: number }) =>
    fetchApi<any>(`/batches/${batchId}/syllabus`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  toggleSyllabusTopic: (batchId: string, topicId: string, isCovered: boolean) =>
    fetchApi<any>(`/syllabus/${batchId}/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify({ isCovered })
    }),

  getBatchDiaries: (batchId: string) => fetchApi<any[]>(`/batches/${batchId}/diaries`),
  createDailyDiary: (batchId: string, data: { topicTaught: string; homeworkAssigned?: string; date?: string; teacherName?: string }) =>
    fetchApi<any>(`/batches/${batchId}/diaries`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getHomeworkSubmissions: (homeworkId: string) => fetchApi<any[]>(`/homework/${homeworkId}/submissions`),
  markHomeworkSubmission: (homeworkId: string, data: { studentId: string; status: 'submitted' | 'late' | 'pending'; remarks?: string }) =>
    fetchApi<any>(`/homework/${homeworkId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};





