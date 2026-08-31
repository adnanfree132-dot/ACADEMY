// API Client helper connecting React state to Express REST API (/api/v1)

const BASE_URL = '/api/v1';

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all' && val !== 'undefined' && val !== 'null') {
      searchParams.append(key, String(val));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

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
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
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
  deleteStudent: (id: string, mode: 'soft' | 'hard' = 'soft') =>
    fetchApi<any>(`/students/${id}?mode=${mode}`, {
      method: 'DELETE'
    }),
  bulkImportStudents: (studentList: any[]) =>
    fetchApi<any>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students: studentList })
    }),
  bulkDeleteStudents: (studentIds: string[], mode: 'soft' | 'hard' = 'soft') =>
    fetchApi<any>('/students/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ studentIds, mode })
    }),
  bulkTransferStudents: (studentIds: string[], targetBatch: string) =>
    fetchApi<any>('/students/bulk-transfer', {
      method: 'POST',
      body: JSON.stringify({ studentIds, targetBatch })
    }),
  changeStudentStatus: (id: string, payload: {
    targetStatus: string;
    reasonCategory: string;
    remarks?: string;
    effectiveDate?: string;
    feeAction?: string;
    targetBatchId?: string;
  }) => fetchApi<{ student: any; historyEntry: any }>(`/students/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getStudentStatusHistory: (id: string) =>
    fetchApi<any[]>(`/students/${id}/status-history`),
  reactivateStudent: (id: string, payload?: {
    targetBatchId?: string;
    monthlyFee?: number;
    remarks?: string;
  }) => fetchApi<any>(`/students/${id}/reactivate`, {
    method: 'POST',
    body: JSON.stringify(payload || {})
  }),
  getLeavingCertificate: (id: string) =>
    fetchApi<any>(`/students/${id}/leaving-certificate`),
  updateStudentFeePlan: (id: string, payload: {
    base_monthly_fee: number;
    scholarship_type?: string;
    scholarship_value?: number;
    scholarship_reason?: string;
    billing_anchor_day?: number;
    notes?: string;
  }) => fetchApi<any>(`/students/${id}/fee-plan`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  getStudentInstallmentSchedule: (id: string) =>
    fetchApi<any[]>(`/students/${id}/installment-schedule`),
  enrollStudentInBatch: (batchId: string, payload: string | {
    studentId: string;
    enrolled_on?: string;
    alignment_mode?: 'align_batch_end' | 'extend_student_timeline';
    prorate_mode?: 'remaining_duration' | 'full_course_fee';
    custom_fee_override?: number;
    individual_end_date?: string;
    custom_installments?: number;
    adminOverride?: boolean;
  }) => fetchApi<any>(`/batches/${batchId}/enroll`, {
    method: 'POST',
    body: JSON.stringify(typeof payload === 'string' ? { studentId: payload } : payload)
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
  getAttendance: (params?: { batchId?: string; date?: string; studentId?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchApi<any[]>(`/attendance${query ? `?${query}` : ''}`);
  },
  markAttendanceBulk: (data: { batchId: string; date: string; entries: any[] }) =>
    fetchApi<any[]>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Fees & Invoices
  getPayments: () => fetchApi<any[]>('/fees/payments'),
  getInvoices: () => fetchApi<any[]>('/fees/invoices'),
  generateInvoices: (data?: { cycleDate?: string }) =>
    fetchApi<any>('/fees/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(data || {})
    }),
  triggerInstallmentCron: () =>
    fetchApi<any>('/cron/billing/generate-installments', {
      method: 'POST',
      body: JSON.stringify({})
    }),
  getStudentLedger: (studentId: string) => fetchApi<any>(`/fees/ledger/${studentId}`),
  recordPayment: (data: { studentId: string; amount: number; method: string; notes?: string; invoiceId?: string; discount?: number; discountRemarks?: string }) =>
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
  updateTest: (id: string, data: any) =>
    fetchApi<any>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTest: (id: string) =>
    fetchApi<any>(`/tests/${id}`, {
      method: 'DELETE'
    }),
  saveTestMarks: (testId: string, marks: Array<{ studentId: string; marks: number; remark?: string }>) =>
    fetchApi<any>(`/tests/${testId}/marks`, {
      method: 'POST',
      body: JSON.stringify({ marks })
    }),
  getStudentReportCard: (studentId: string) =>
    fetchApi<any>(`/students/${studentId}/report-card`),

  // Timetable & Room Conflict Solver
  getTimetableSlots: () => fetchApi<any[]>('/timetable'),
  createTimetableSlot: (data: { day: string; startTime: string; endTime: string; room: string; batchId: string; subjectId?: string; teacherId?: string; topic?: string }) =>
    fetchApi<any>('/timetable', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteTimetableSlot: (id: string) =>
    fetchApi<any>(`/timetable/${id}`, {
      method: 'DELETE'
    }),

  // WhatsApp Automation Center
  getWhatsAppTemplates: () => fetchApi<any[]>('/whatsapp/templates'),
  updateWhatsAppTemplate: (code: string, data: any) =>
    fetchApi<any>(`/whatsapp/templates/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getWhatsAppLogs: () => fetchApi<any[]>('/whatsapp/logs'),
  sendWhatsAppNotification: (data: { phone: string; studentName?: string; templateCode?: string; body: string; studentId?: string }) =>
    fetchApi<any>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  dispatchAbsenceAlerts: () =>
    fetchApi<any>('/whatsapp/dispatch-absence-alerts', {
      method: 'POST'
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
    }),

  // Student Conduct & Behavior Logs (M16 RBAC)
  getStudentConductLogs: (studentId: string) => fetchApi<any[]>(`/students/${studentId}/conduct-logs`),
  createConductLog: (studentId: string, data: { batch_id?: string; category?: string; severity?: string; title?: string; remark: string; is_confidential?: boolean }) =>
    fetchApi<any>(`/students/${studentId}/conduct-logs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateConductLog: (logId: string, data: { category?: string; severity?: string; title?: string; remark?: string; is_confidential?: boolean }) =>
    fetchApi<any>(`/conduct-logs/${logId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteConductLog: (logId: string) =>
    fetchApi<{ id: string; is_deleted: boolean }>(`/conduct-logs/${logId}`, {
      method: 'DELETE'
    }),

  // Multi-Tenant Parent Portal & Password Reset
  getMyChildren: () => fetchApi<any[]>('/parents/my-children'),
  resetParentPassword: (studentId: string, newPassword?: string) =>
    fetchApi<{ success: boolean; studentName: string; admissionNo: string; parentName: string; phone: string; newPassword: string }>(`/students/${studentId}/reset-parent-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  // ==========================================================================
  // FEATURE 008: STAFF PORTAL, DYNAMIC ROLES & GRANULAR 3-TIER RBAC API
  // ==========================================================================
  // Staff Types
  getStaffTypes: () => fetchApi<any[]>('/staff-types'),
  getStaffTypeById: (id: string) => fetchApi<any>(`/staff-types/${id}`),
  createStaffType: (data: { name: string; code: string; slug?: string; description?: string; icon_name?: string; is_system?: boolean; base_permissions?: any }) =>
    fetchApi<any>('/staff-types', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateStaffType: (id: string, data: any) =>
    fetchApi<any>(`/staff-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteStaffType: (id: string) =>
    fetchApi<any>(`/staff-types/${id}`, {
      method: 'DELETE'
    }),

  // Staff Members & Credentials
  getStaffList: (params?: { staff_type_id?: string; status?: string; role?: string; search?: string }) => {
    return fetchApi<any[]>(`/staff${buildQueryString(params)}`);
  },
  getStaffById: (id: string) => fetchApi<any>(`/staff/${id}`),
  registerStaff: (data: any) =>
    fetchApi<{ staff: any; credentials: { staffId: string; temporaryPassword: string; loginUrl: string; issuedAt: string; mustChangePassword?: boolean } }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateStaff: (id: string, data: any) =>
    fetchApi<any>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteStaff: (id: string, mode: 'soft' | 'hard' = 'soft') =>
    fetchApi<any>(`/staff/${id}?mode=${mode}`, {
      method: 'DELETE'
    }),
  resetStaffPassword: (id: string, newPassword?: string) =>
    fetchApi<{ success: boolean; staffId: string; fullName: string; phone: string; temporaryPassword: string; issuedAt: string }>(`/staff/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  // Granular Module Permissions
  getStaffPermissions: (id: string) => fetchApi<{ staffId: string; staffType: any; permissions: any[] }>(`/staff/${id}/permissions`),
  updateStaffPermissions: (id: string, permissions: Array<{ module_key: string; access_level: string; is_global_scope?: boolean }>) =>
    fetchApi<any>(`/staff/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    }),

  // Bulk Operations
  bulkUpdateStaffStatus: (staffIds: string[], status: string, remarks?: string) =>
    fetchApi<any>('/staff/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ staff_ids: staffIds, status, remarks })
    }),
  bulkReassignStaffType: (staffIds: string[], staffTypeId: string) =>
    fetchApi<any>('/staff/bulk-reassign', {
      method: 'POST',
      body: JSON.stringify({ staff_ids: staffIds, staff_type_id: staffTypeId })
    }),

  // Documents Vault
  getStaffDocuments: (staffId: string) => fetchApi<any[]>(`/staff/${staffId}/documents`),
  uploadStaffDocument: (staffId: string, data: { title: string; document_type: string; file_url: string; expiry_date?: string }) =>
    fetchApi<any>(`/staff/${staffId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteStaffDocument: (documentId: string) =>
    fetchApi<any>(`/staff/documents/${documentId}`, {
      method: 'DELETE'
    }),

  // Salary & Payroll
  updateStaffSalary: (staffId: string, data: { base_salary?: number; hourly_rate?: number; salary_type?: string; payment_method?: string; bank_name?: string; account_number?: string; account_title?: string }) =>
    fetchApi<any>(`/staff/${staffId}/salary`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getStaffSalaryPayments: (staffId: string) => fetchApi<any[]>(`/staff/${staffId}/salary-payments`),
  recordStaffSalaryPayment: (staffId: string, data: any) =>
    fetchApi<any>(`/staff/${staffId}/salary-payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Staff Attendance & Duty
  getStaffAttendance: (params?: { date?: string; month?: string; staff_id?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchApi<any[]>(`/staff-attendance${query ? `?${query}` : ''}`);
  },
  checkInStaff: (staffIdOrPayload?: string | { staffMemberId?: string; staff_id?: string; date?: string; check_in_time?: string; notes?: string; device_info?: string }, notes?: string) => {
    const body = typeof staffIdOrPayload === 'string'
      ? { staff_id: staffIdOrPayload, notes }
      : (staffIdOrPayload || {});
    return fetchApi<any>('/staff-attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  checkOutStaff: (staffIdOrPayload?: string | { staffMemberId?: string; staff_id?: string; date?: string; check_out_time?: string; notes?: string }, notes?: string) => {
    const body = typeof staffIdOrPayload === 'string'
      ? { staff_id: staffIdOrPayload, notes }
      : (staffIdOrPayload || {});
    return fetchApi<any>('/staff-attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  bulkStaffAttendance: (date: string, entries: Array<{ staff_id: string; status: string; check_in_time?: string; check_out_time?: string; notes?: string }>) =>
    fetchApi<any>('/staff-attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ date, entries })
    }),

  // Staff Leave Applications & Approvals
  getStaffLeaves: (params?: { staff_id?: string; status?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchApi<any[]>(`/staff-leaves${query ? `?${query}` : ''}`);
  },
  submitStaffLeave: (data: { staff_id?: string; leave_type: string; start_date: string; end_date: string; reason: string }) =>
    fetchApi<any>('/staff-leaves', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  decideStaffLeave: (leaveId: string, data: { decision: 'approved' | 'rejected'; reviewer_remarks?: string; substitute_teacher_id?: string }) =>
    fetchApi<any>(`/staff-leaves/${leaveId}/decision`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Staff Dashboard & Password
  getStaffDashboard: () => fetchApi<any>('/staff/dashboard'),
  changeStaffPassword: (currentPassword: string, newPassword: string) =>
    fetchApi<any>('/staff/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  // ==========================================================================
  // ENTERPRISE GEOFENCING & GPS ATTENDANCE API
  // ==========================================================================
  getGeofenceConfig: () => fetchApi<any>('/settings/geofence'),
  saveGeofenceConfig: (config: any) =>
    fetchApi<any>('/settings/geofence', {
      method: 'PUT',
      body: JSON.stringify(config)
    }),
  updateGeofenceConfig: (config: any) =>
    fetchApi<any>('/settings/geofence', {
      method: 'PUT',
      body: JSON.stringify(config)
    }),
  testGeofenceLocation: (payload: {
    latitude: number;
    longitude: number;
    campus_lat?: number;
    campus_lng?: number;
    radius_meters?: number;
    radius?: number;
  }) =>
    fetchApi<any>('/settings/geofence/test', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Staff Attendance Override & GPS Fallback
  checkInStaffWithGps: (payload: {
    staffMemberId?: string;
    staff_id?: string;
    latitude?: number;
    longitude?: number;
    distance?: number;
    device_info?: string;
    notes?: string;
    date?: string;
    check_in_time?: string;
  }) =>
    fetchApi<any>('/staff-attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  checkOutStaffWithGps: (payload: {
    staffMemberId?: string;
    staff_id?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    date?: string;
    check_out_time?: string;
  }) =>
    fetchApi<any>('/staff-attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  overrideStaffAttendance: (payload: any) =>
    fetchApi<any>('/staff-attendance/override', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getStaffAttendanceRoster: (params?: {
    date?: string;
    month?: string;
    start_date?: string;
    end_date?: string;
    staff_member_id?: string;
    staff_type_id?: string;
    status?: string;
  }) => {
    return fetchApi<any>(`/staff-attendance/roster${buildQueryString(params)}`);
  },

  // ==========================================================================
  // ENTERPRISE SALARY STRUCTURES & PAYROLL BATCHES API
  // ==========================================================================
  getSalaryStructures: () => fetchApi<any[]>('/staff-salary-structures'),
  getStaffSalaryStructure: (staffId: string) =>
    fetchApi<any>(`/staff-salary-structures/${staffId}`),
  saveStaffSalaryStructure: (staffId: string, payload: any) =>
    fetchApi<any>(`/staff-salary-structures/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  generateMonthlyPayrollBatch: (payload: {
    year: number;
    month: number;
    period: string;
    staffTypeId?: string;
    notes?: string;
  }) =>
    fetchApi<any>('/payroll/generate-batch', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPayrollBatches: (params?: { year?: number; month?: number; period?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchApi<any[]>(`/payroll/batches${query ? `?${query}` : ''}`);
  },
  getPayrollBatchById: (batchId: string) =>
    fetchApi<any>(`/payroll/batches/${batchId}`),
  disbursePayslip: (
    id: string,
    payload: {
      payment_method: string;
      transaction_reference?: string;
      transaction_ref?: string;
      payment_date?: string;
      remarks?: string;
      notes?: string;
    }
  ) =>
    fetchApi<any>(`/payroll/payslips/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPayslipDetails: (id: string) =>
    fetchApi<any>(`/payroll/payslips/${id}`),
  aiParsePayrollPolicy: (policyText: string) =>
    fetchApi<any>('/payroll/ai-parse-policy', {
      method: 'POST',
      body: JSON.stringify({ policyText })
    })
};








