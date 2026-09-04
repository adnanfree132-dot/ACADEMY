import React, { useState, useEffect } from 'react';
import { TabType, Student, Teacher, Batch, FeeTransaction, CRMLead, Announcement, Subject } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './pages/DashboardView';
import { StudentsView } from './pages/StudentsView';
import { TeachersView } from './pages/TeachersView';
import { BatchesView } from './pages/BatchesView';
import { SubjectsView } from './pages/SubjectsView';
import { AttendanceView } from './pages/AttendanceView';
import { StaffAttendanceView } from './pages/StaffAttendanceView';
import { StaffPayrollView } from './pages/StaffPayrollView';
import { FeeManagementView } from './pages/FeeManagementView';
import { ExpenseManagementView } from './pages/ExpenseManagementView';
import { CrmView } from './pages/CrmView';
import { AnnouncementsView } from './pages/AnnouncementsView';
import { TimetableView, ExamsView, HomeworkView, SettingsView } from './pages/SecondaryViews';
import { StudentLeaveView } from './pages/StudentLeaveView';
import { ConductView } from './pages/ConductView';
import { LoginView } from './pages/LoginView';
import { api } from './api/apiClient';
import { applyAcademySettings } from './lib/academySettings';
import { readBootstrapSnapshot, writeBootstrapSnapshot, filterDeleted, removeIdFromCaches } from './lib/resourceCache';
import { useEntityRemoved } from './lib/useEntityRemoved';

import { WhatsAppCenterView } from './pages/WhatsAppCenterView';
import { MobileTopBar } from './components/MobileTopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreDrawer } from './components/MobileMoreDrawer';
import { MobileSpeedDialFab } from './components/MobileSpeedDialFab';
import { RegisterStudentModal } from './components/RegisterStudentModal';
import { CreateBatchModal } from './components/CreateBatchModal';
import { RecordFeeModal } from './components/RecordFeeModal';
import { KeepAliveTab } from './components/KeepAliveTab';

type AppSnapshot = {
  dashboardStats?: any;
  dashboardLive?: any;
  students?: Student[];
  teachers?: Teacher[];
  staffList?: any[];
  batches?: Batch[];
  transactions?: FeeTransaction[];
  leads?: CRMLead[];
  announcements?: Announcement[];
  subjects?: Subject[];
  academyName?: string;
  notifications?: any[];
};

export function App() {
  const snap = readBootstrapSnapshot<AppSnapshot>() || {};
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(() => new Set(['dashboard']));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile App State
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileAddStudentOpen, setIsMobileAddStudentOpen] = useState(false);
  const [isMobileAddBatchOpen, setIsMobileAddBatchOpen] = useState(false);
  const [isMobileRecordFeeOpen, setIsMobileRecordFeeOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<CRMLead | null>(null);

  // Paint last snapshot immediately; network refresh fills in behind it
  const [dashboardStats, setDashboardStats] = useState<any>(snap.dashboardStats ?? null);
  const [dashboardLive, setDashboardLive] = useState<any>(snap.dashboardLive ?? null);
  const [students, setStudents] = useState<Student[]>(snap.students || []);
  const [teachers, setTeachers] = useState<Teacher[]>(snap.teachers || []);
  const [staffList, setStaffList] = useState<any[]>(snap.staffList || []);
  const [batches, setBatches] = useState<Batch[]>(snap.batches || []);
  const [transactions, setTransactions] = useState<FeeTransaction[]>(snap.transactions || []);
  const [leads, setLeads] = useState<CRMLead[]>(snap.leads || []);
  const [announcements, setAnnouncements] = useState<Announcement[]>(snap.announcements || []);
  const [subjects, setSubjects] = useState<Subject[]>(snap.subjects || []);

  const [academyName, setAcademyName] = useState(snap.academyName || 'AcademiaPro');
  const [notifications, setNotifications] = useState<any[]>(snap.notifications || []);
  const [unreadNotifications, setUnreadNotifications] = useState(
    Array.isArray(snap.notifications) ? snap.notifications.filter((n: any) => !n.is_read).length : 0
  );

  const sessionUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEntityRemoved((ids) => {
    const gone = new Set(ids);
    setStaffList(prev => prev.filter(s => !gone.has(s.id) && !gone.has(s.teacher_id) && !gone.has(s.teacherId)));
    setTeachers(prev => prev.filter(t => !gone.has(t.id)));
  });

  const refreshDataFromBackend = async () => {
    const run = async (loader: () => Promise<any>, onData: (value: any) => void) => {
      try {
        const value = await loader();
        if (value !== null && value !== undefined) onData(value);
      } catch {
        /* keep snapshot already on screen */
      }
    };

    await Promise.all([
      run(() => api.getDashboard(), (stats) => {
        if (stats?.overview) {
          setDashboardStats(stats.overview);
          setDashboardLive(stats);
        } else {
          setDashboardLive(stats);
        }
      }),
      run(() => api.getSettings(), (backendSettings) => {
        applyAcademySettings(backendSettings);
        if (backendSettings.academyName) setAcademyName(backendSettings.academyName);
      })
    ]);

    await Promise.all([
      run(() => api.getNotifications(), (backendNotifications) => {
        if (!Array.isArray(backendNotifications)) return;
        setNotifications(backendNotifications);
        setUnreadNotifications(backendNotifications.filter((n: any) => !n.is_read).length);
      }),
      run(() => api.getStaffList(), (backendStaff) => {
        if (Array.isArray(backendStaff)) setStaffList(filterDeleted(backendStaff));
      }),
      run(() => api.getSubjects(), (backendSubjects) => {
        if (!Array.isArray(backendSubjects)) return;
        setSubjects(filterDeleted(backendSubjects).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          batchCount: s._count?.batchSubjects || 0,
          homeworkCount: s._count?.homeworks || 0,
          testCount: s._count?.tests || 0,
          slotCount: s._count?.timetableSlots || 0
        })));
      }),
      run(() => api.getStudents(), (backendStudents) => {
        if (!Array.isArray(backendStudents)) return;
        setStudents(filterDeleted(backendStudents).map((s: any) => {
          const totalFee = s.totalFee !== undefined ? s.totalFee : (s.feePlan?.monthly_amount || 0);
          const dueBalance = s.dueBalance !== undefined ? s.dueBalance : 0;
          const paidFee = s.paidFee !== undefined ? s.paidFee : Math.max(0, totalFee - dueBalance);
          const activeEnrollment = (s.enrollments || []).find((e: any) => e.status === 'active') || s.enrollments?.[0];
          const gradeBatch = s.class?.name || activeEnrollment?.batch?.name || '';
          const nextDue = (s.feeInvoices || [])
            .filter((inv: any) => inv.status === 'unpaid' || inv.status === 'partial' || inv.status === 'overdue')
            .map((inv: any) => inv.due_date)
            .filter(Boolean)
            .sort()[0] || '';

          let studentStatus: 'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left' = 'Active';
          const sLower = (s.status || '').toLowerCase();
          if (sLower === 'active') studentStatus = 'Active';
          else if (sLower.includes('leave') || sLower === 'inactive') studentStatus = 'On Leave';
          else if (sLower.includes('graduat') || sLower === 'alumni') studentStatus = 'Graduated';
          else if (sLower.includes('suspend')) studentStatus = 'Suspended';
          else if (sLower.includes('left') || sLower.includes('withdraw') || sLower.includes('remov')) studentStatus = 'Left';

          const parentName = s.parentName && s.parentName !== 'Parent / Guardian'
            ? s.parentName
            : ((s.custom_fields as any)?.parentName || '');

          return {
            id: s.id,
            regNo: s.admission_no || s.id,
            name: s.full_name,
            parentName,
            phone: s.phone,
            email: s.email || '',
            gradeBatch,
            gender: (s.gender as any) || 'Male',
            status: studentStatus,
            statusReason: s.status_reason,
            statusRemarks: s.status_remarks,
            statusUpdatedAt: s.status_updated_at,
            leavingDate: s.leaving_date ? s.leaving_date.split('T')[0] : undefined,
            isFeePaused: s.is_fee_paused,
            baseMonthlyFee: s.baseMonthlyFee || s.feePlan?.monthly_amount || 0,
            scholarshipType: s.scholarshipType || s.feePlan?.scholarship_type || 'none',
            scholarshipValue: s.scholarshipValue || s.feePlan?.scholarship_value || 0,
            scholarshipReason: s.scholarshipReason || s.feePlan?.scholarship_reason || null,
            billingAnchorDay: s.billingAnchorDay || s.feePlan?.billing_anchor_day || 1,
            totalFee,
            paidFee,
            dueBalance,
            dueDate: nextDue,
            isDefaulter: s.isDefaulter !== undefined ? s.isDefaulter : dueBalance > 0
          };
        }));
      }),
      run(() => api.getTeachers(), (backendTeachers) => {
        if (!Array.isArray(backendTeachers)) return;
        setTeachers(filterDeleted(backendTeachers).map((t: any) => ({
          id: t.id,
          name: t.user?.full_name || t.full_name || '',
          qualification: t.qualification || '',
          assignedSubjects: (t.batchSubjects || []).map((bs: any) => bs.subject?.name).filter(Boolean),
          assignedBatches: [
            ...(t.batches || []).map((b: any) => b.name),
            ...(t.batchSubjects || []).map((bs: any) => bs.batch?.name)
          ].filter(Boolean).filter((name: string, i: number, arr: string[]) => arr.indexOf(name) === i),
          phone: t.user?.phone || t.phone || '',
          email: t.user?.email || t.email || ''
        })));
      }),
      run(() => api.getBatches(), (backendBatches) => {
        if (!Array.isArray(backendBatches)) return;
        setBatches(filterDeleted(backendBatches).map((b: any) => ({
          id: b.id,
          name: b.name || '',
          classLevel: b.class?.name || '',
          teacherName: b.teacher?.user?.full_name || '',
          timing: b.start_time && b.end_time ? `${b.start_time} - ${b.end_time}` : '',
          room: b.room || '',
          capacity: b.capacity || 0,
          studentsCount: Array.isArray(b.enrollments) ? b.enrollments.length : 0,
          courseType: b.course_type,
          totalFee: b.total_fee,
          startDate: b.start_date,
          endDate: b.end_date,
          defaultInstallments: b.default_installments,
          sectionName: b.section_name
        })));
      }),
      run(() => api.getAnnouncements(), (backendAnn) => {
        if (!Array.isArray(backendAnn)) return;
        setAnnouncements(filterDeleted(backendAnn).map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content || a.body,
          date: a.created_at ? String(a.created_at).split('T')[0] : '',
          targetAudience: a.audience || a.targetAudience || a.target_audience || 'all',
          urgent: Boolean(a.urgent),
          pinned: Boolean(a.pinned),
          scheduledFor: a.scheduled_for || a.scheduledFor || null,
          author: a.created_by === 'admin' ? 'Administration' : undefined
        })));
      }),
      run(() => api.getInquiries(), (backendInq) => {
        if (!Array.isArray(backendInq)) return;
        setLeads(filterDeleted(backendInq).map((i: any) => ({
          id: i.id,
          studentName: i.student_name || i.name || '',
          parentName: i.parent_name || '',
          phone: i.phone,
          gradeInterest: i.grade_interest || i.class_interest || '',
          targetClass: i.grade_interest || i.class_interest || '',
          source: i.source,
          status: i.status === 'new' ? 'New' : i.status === 'contacted' ? 'Contacted' : i.status === 'admitted' || i.status === 'converted' ? 'Converted' : i.status,
          followUpDate: i.follow_up_on || '',
          date: i.created_at ? String(i.created_at).split('T')[0] : ''
        })));
      }),
      run(() => api.getPayments(), (backendPayments) => {
        if (!Array.isArray(backendPayments)) return;
        setTransactions(filterDeleted(backendPayments).map((p: any) => ({
          id: p.id,
          receiptNo: p.receipt_no,
          studentId: p.student_id,
          studentName: p.student?.full_name || '',
          regNo: p.student?.admission_no || '',
          amount: p.amount,
          date: p.paid_at ? String(p.paid_at).split('T')[0] : '',
          method: p.method,
          notes: p.note || p.notes
        })));
      })
    ]);
  };

  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(currentTab)) return prev;
      const next = new Set(prev);
      next.add(currentTab);
      return next;
    });
  }, [currentTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const quiet = (p: Promise<any>) => p.catch(() => null);
    void (async () => {
      await refreshDataFromBackend();
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth();
      if (m === 0) { m = 12; y -= 1; }
      const priorMonth = `${y}-${String(m).padStart(2, '0')}`;
      await Promise.all([
        quiet(api.getHomework()),
        quiet(api.getStudyMaterials()),
        quiet(api.getTests()),
        quiet(api.getTimetableSlots()),
        quiet(api.getLeaves()),
        quiet(api.getInvoices()),
        quiet(api.getExpenses()),
        quiet(api.getConductDesk()),
        quiet(api.getWhatsAppTemplates()),
        quiet(api.getWhatsAppLogs()),
        quiet(api.getStaffTypes()),
        quiet(api.getClasses()),
        quiet(api.getLiveStaffPayrollRegister({ month_period: priorMonth })),
        quiet(api.getStaffAttendanceRoster({ date: today }))
      ]);
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    writeBootstrapSnapshot({
      dashboardStats,
      dashboardLive,
      students,
      teachers,
      staffList,
      batches,
      transactions,
      leads,
      announcements,
      subjects,
      academyName,
      notifications
    });
  }, [isAuthenticated, dashboardStats, dashboardLive, students, teachers, staffList, batches, transactions, leads, announcements, subjects, academyName, notifications]);

  // --- Optimistic Instant-Reflect Handlers (0ms UI Updates + Silent Background API) ---
  const handleAddStudent = async (newStudentData: Omit<Student, 'id' | 'regNo' | 'paidFee' | 'dueBalance' | 'isDefaulter'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempStudent: Student = {
      ...newStudentData,
      id: `stu-${Date.now()}`,
      regNo: `STD-${Date.now().toString().slice(-4)}`,
      paidFee: 0,
      dueBalance: newStudentData.totalFee,
      isDefaulter: false
    };
    setStudents(prev => [tempStudent, ...prev]);

    // 2. Background Sync
    try {
      await api.createStudent(newStudentData);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding student to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleEditStudent = async (updatedStudent: Student) => {
    // 1. Optimistic UI Update (Instant 0ms)
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    
    // 2. Background Sync
    try {
      const promises: Promise<any>[] = [
        api.updateStudent(updatedStudent.id, {
          fullName: updatedStudent.name,
          parentName: updatedStudent.parentName,
          phone: updatedStudent.phone,
          email: updatedStudent.email,
          status: updatedStudent.status.toLowerCase(),
          gender: updatedStudent.gender
        })
      ];

      if (
        updatedStudent.baseMonthlyFee !== undefined ||
        updatedStudent.scholarshipType !== undefined ||
        updatedStudent.billingAnchorDay !== undefined
      ) {
        promises.push(
          api.updateStudentFeePlan(updatedStudent.id, {
            base_monthly_fee: Number(updatedStudent.baseMonthlyFee ?? updatedStudent.totalFee ?? 0),
            scholarship_type: updatedStudent.scholarshipType,
            scholarship_value: Number(updatedStudent.scholarshipValue || 0),
            scholarship_reason: updatedStudent.scholarshipReason || undefined,
            billing_anchor_day: Number(updatedStudent.billingAnchorDay || 1)
          }).catch(err => console.warn('Non-fatal fee plan sync warning:', err))
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Error updating student to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteStudent = async (studentId: string, mode: 'soft' | 'hard' = 'soft') => {
    if (mode === 'hard') {
      removeIdFromCaches(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } else {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'Left', isFeePaused: true } : s));
    }

    try {
      await api.deleteStudent(studentId, mode);
    } catch (err) {
      console.error('Error deleting student on backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddPayment = async (paymentData: Omit<FeeTransaction, 'id' | 'receiptNo'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempPayment: FeeTransaction = {
      ...paymentData,
      id: `txn-${Date.now()}`,
      receiptNo: `REC-${Date.now().toString().slice(-4)}`
    };
    setTransactions(prev => [tempPayment, ...prev]);
    
    setStudents(prev => prev.map(s => {
      if (s.id === paymentData.studentId) {
        const discountVal = paymentData.discount || 0;
        const newPaid = (s.paidFee || 0) + paymentData.amount;
        const newDue = Math.max(0, s.dueBalance - paymentData.amount - discountVal);
        return { ...s, paidFee: newPaid, dueBalance: newDue, isDefaulter: newDue > 0 };
      }
      return s;
    }));

    // 2. Background Sync
    try {
      const saved = await api.recordPayment({
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        method: paymentData.method.toLowerCase(),
        notes: paymentData.notes,
        discount: paymentData.discount,
        discountRemarks: paymentData.discountRemarks,
        invoiceId: (paymentData as any).invoiceId
      });
      if (saved?.id) {
        setTransactions(prev => prev.map(t => t.id === tempPayment.id ? {
          ...t,
          id: saved.id,
          receiptNo: saved.receipt_no || t.receiptNo
        } : t));
      }
    } catch (err) {
      console.error('Error recording payment to backend:', err);
      setTransactions(prev => prev.filter(t => t.id !== tempPayment.id));
      setStudents(prev => prev.map(s => {
        if (s.id !== paymentData.studentId) return s;
        const discountVal = paymentData.discount || 0;
        return {
          ...s,
          paidFee: Math.max(0, (s.paidFee || 0) - paymentData.amount),
          dueBalance: (s.dueBalance || 0) + paymentData.amount + discountVal,
          isDefaulter: true
        };
      }));
      const { showToast } = await import('./lib/toast');
      showToast('Payment was not saved. The ledger was restored.', 'error');
    }
  };

  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id' | 'assignedSubjects' | 'assignedBatches'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempTeacher: Teacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
      assignedSubjects: [],
      assignedBatches: []
    };
    setTeachers(prev => [tempTeacher, ...prev]);

    // 2. Background Sync
    try {
      await api.createTeacher({
        fullName: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        qualification: teacherData.qualification
      });
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding teacher:', err);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    removeIdFromCaches(teacherId);
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    setStaffList(prev => prev.filter(s => s.id !== teacherId && s.teacher_id !== teacherId));
    try {
      await api.deleteTeacher(teacherId);
    } catch (err) {
      console.error('Error deleting teacher:', err);
      refreshDataFromBackend();
    }
  };

  const handleEditTeacher = async (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? { ...t, ...updatedTeacher } : t));
    try {
      await api.updateTeacher(updatedTeacher.id, {
        fullName: updatedTeacher.name,
        email: updatedTeacher.email,
        phone: updatedTeacher.phone,
        qualification: updatedTeacher.qualification
      });
    } catch (err) {
      console.error('Error updating teacher:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddBatch = async (batchData: Omit<Batch, 'id' | 'studentsCount'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempBatch: Batch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      studentsCount: 0
    };
    setBatches(prev => [...prev, tempBatch]);

    // 2. Background Sync
    try {
      await api.createBatch({
        name: batchData.name,
        classLevel: batchData.classLevel || batchData.name,
        timing: batchData.timing,
        room: batchData.room,
        capacity: batchData.capacity,
        teacherId: (batchData as any).teacherId,
        days: (batchData as any).days,
        course_type: batchData.course_type || batchData.courseType,
        total_fee: batchData.total_fee || batchData.totalFee,
        start_date: batchData.start_date || batchData.startDate,
        end_date: batchData.end_date || batchData.endDate,
        default_installments: batchData.default_installments || batchData.defaultInstallments,
        section_name: batchData.section_name || batchData.sectionName
      });
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding batch to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    removeIdFromCaches(batchId);
    setBatches(prev => prev.filter(b => b.id !== batchId));
    try {
      await api.deleteBatch(batchId);
    } catch (err) {
      console.error('Error deleting batch from backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleEditBatch = async (updatedBatch: Batch) => {
    setBatches(prev => prev.map(b => b.id === updatedBatch.id ? { ...b, ...updatedBatch } : b));
    try {
      await api.updateBatch(updatedBatch.id, {
        name: updatedBatch.name,
        capacity: updatedBatch.maxCapacity || updatedBatch.capacity
      });
    } catch (err) {
      console.error('Error updating batch in backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'date'>) => {
    const tempAnn: Announcement = {
      ...announcementData,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [tempAnn, ...prev]);
    try {
      await api.createAnnouncement(announcementData);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding announcement:', err);
      refreshDataFromBackend();
    }
  };

  const handleUpdateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      await api.updateAnnouncement(id, data);
    } catch (err) {
      console.error('Error updating announcement:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    removeIdFromCaches(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try {
      await api.deleteAnnouncement(id);
    } catch (err) {
      console.error('Error deleting announcement:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddLead = async (leadData: Omit<CRMLead, 'id' | 'date' | 'status'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempLead: CRMLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'New'
    };
    setLeads(prev => [tempLead, ...prev]);

    // 2. Background Sync
    try {
      await api.createInquiry(leadData);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding inquiry:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddSubject = async (subjectData: { name: string; code: string }) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempSubject: Subject = {
      id: `subj-${Date.now()}`,
      name: subjectData.name,
      code: subjectData.code
    };
    setSubjects(prev => [tempSubject, ...prev]);

    // 2. Background Sync
    try {
      await api.createSubject(subjectData);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding subject:', err);
      refreshDataFromBackend();
    }
  };

  const handleEditSubject = async (subjectId: string, subjectData: { name: string; code: string }) => {
    // 1. Optimistic UI Update (Instant 0ms)
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, ...subjectData } : s));

    // 2. Background Sync
    try {
      await api.updateSubject(subjectId, subjectData);
    } catch (err) {
      console.error('Error updating subject:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    removeIdFromCaches(subjectId);
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    try {
      await api.deleteSubject(subjectId);
    } catch (err) {
      console.error('Error deleting subject:', err);
      refreshDataFromBackend();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleBulkImport = async (studentList: any[]) => {
    try {
      await api.bulkImportStudents(studentList);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Bulk import error:', err);
    }
  };

  const handleBulkDelete = async (studentIds: string[], mode: 'soft' | 'hard' = 'soft') => {
    // 1. Optimistic UI Update (Instant 0ms)
    setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));

    // 2. Background Sync
    try {
      await api.bulkDeleteStudents(studentIds, mode);
    } catch (err) {
      console.error('Bulk delete error:', err);
      refreshDataFromBackend();
    }
  };

  const handleBulkTransfer = async (studentIds: string[], targetBatch: string) => {
    // 1. Optimistic UI Update (Instant 0ms)
    setStudents(prev => prev.map(s => studentIds.includes(s.id) ? { ...s, gradeBatch: targetBatch } : s));

    // 2. Background Sync
    try {
      await api.bulkTransferStudents(studentIds, targetBatch);
    } catch (err) {
      console.error('Bulk transfer error:', err);
      refreshDataFromBackend();
    }
  };

  const pane = (tab: TabType, node: React.ReactNode) => (
    <KeepAliveTab key={tab} active={currentTab === tab} mounted={visitedTabs.has(tab) || currentTab === tab}>
      {node}
    </KeepAliveTab>
  );

  const renderCurrentView = () => (
    <>
      {pane('dashboard', (
        <DashboardView
          students={students}
          teachers={teachers}
          batches={batches}
          transactions={transactions}
          leads={leads}
          onNavigate={setCurrentTab}
          dashboardStats={dashboardStats}
          dashboardLive={dashboardLive}
        />
      ))}
      {pane('students', (
        <StudentsView
          students={students}
          batches={batches}
          onOpenCreateModal={() => {}}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onAddPayment={handleAddPayment}
          onBulkImport={handleBulkImport}
          onBulkDelete={handleBulkDelete}
          onBulkTransfer={handleBulkTransfer}
          onRefreshStudents={refreshDataFromBackend}
        />
      ))}
      {pane('teachers', (
        <TeachersView
          teachers={teachers}
          staff={staffList}
          onUpdateStaffList={setStaffList}
          batches={batches}
          students={students}
          onAddTeacher={handleAddTeacher}
          onDeleteTeacher={handleDeleteTeacher}
          onEditTeacher={handleEditTeacher}
        />
      ))}
      {pane('batches', (
        <BatchesView
          batches={batches}
          teachers={teachers}
          subjects={subjects}
          students={students}
          onAddBatch={handleAddBatch}
          onDeleteBatch={handleDeleteBatch}
          onEditBatch={handleEditBatch}
          onRefresh={refreshDataFromBackend}
        />
      ))}
      {pane('subjects', (
        <SubjectsView
          subjects={subjects}
          onAddSubject={handleAddSubject}
          onEditSubject={handleEditSubject}
          onDeleteSubject={handleDeleteSubject}
          onRefresh={refreshDataFromBackend}
        />
      ))}
      {pane('attendance', (
        <AttendanceView batches={batches} students={students} />
      ))}
      {pane('staff_attendance', <StaffAttendanceView />)}
      {pane('staff_payroll', <StaffPayrollView />)}
      {pane('fees', (
        <FeeManagementView
          students={students}
          transactions={transactions}
          onOpenCreateModal={() => {}}
          onAddPayment={handleAddPayment}
        />
      ))}
      {pane('expenses', <ExpenseManagementView />)}
      {pane('crm', (
        <CrmView
          leads={leads}
          onAddLead={handleAddLead}
          onConvertLead={(lead) => {
            setConvertLead(lead);
            setIsMobileAddStudentOpen(true);
          }}
          onLeadsChanged={refreshDataFromBackend}
        />
      ))}
      {pane('announcements', (
        <AnnouncementsView
          announcements={announcements}
          onAddAnnouncement={handleAddAnnouncement}
          onUpdateAnnouncement={handleUpdateAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
        />
      ))}
      {pane('whatsapp', <WhatsAppCenterView />)}
      {pane('timetable', <TimetableView />)}
      {pane('exams', <ExamsView students={students} batches={batches} />)}
      {pane('homework', <HomeworkView />)}
      {pane('leaves', <StudentLeaveView students={students} />)}
      {pane('conduct', <ConductView />)}
      {pane('settings', <SettingsView />)}
    </>
  );

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => { setIsAuthenticated(true); }} />;
  }

  const tabTitles: Record<TabType, string> = {
    dashboard: 'Dashboard',
    students: 'Students Directory',
    teachers: 'Faculty Directory',
    batches: 'Classes & Batches',
    subjects: 'Course Subjects',
    attendance: 'Attendance Portal',
    staff_attendance: 'Staff Geolocation Attendance',
    staff_payroll: 'Staff Payroll & Salary Management',
    fees: 'Fee Management',
    expenses: 'Institutional Expenses',
    crm: 'Inquiries & CRM',
    announcements: 'Announcements',
    whatsapp: 'WhatsApp Center',
    timetable: 'Timetables',
    exams: 'Exams & Results',
    homework: 'Homework & Study',
    leaves: 'Student Leave',
    conduct: 'Conduct Desk',
    settings: 'Academy Settings'
  };

  return (
    <div className="app-container">
      {/* Mobile Top App Bar */}
      <MobileTopBar
        academyName={academyName}
        activeViewTitle={tabTitles[currentTab] || 'Dashboard'}
        notificationCount={unreadNotifications}
        userName={sessionUser.name || sessionUser.full_name || sessionUser.username || 'Admin'}
        userRole={sessionUser.role || 'Admin'}
        onOpenNotifications={() => setCurrentTab('announcements')}
        onOpenQuickCreate={() => setIsMobileMoreOpen(true)}
      />

      {/* Desktop Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} onLogout={handleLogout} />

      {/* Main Content View Container */}
      <main className="main-content">
        <Header
          userName={sessionUser.name || sessionUser.full_name || sessionUser.username || 'Admin'}
          userRole={sessionUser.role || 'Admin'}
          onOpenAction={(type) => setCurrentTab(type === 'student' ? 'students' : type === 'teacher' ? 'teachers' : type === 'fee' ? 'fees' : 'batches')}
          onSearch={setSearchQuery}
          onLogout={handleLogout}
          students={students}
          teachers={teachers}
          batches={batches}
          notifications={notifications}
          unreadCount={unreadNotifications}
          onMarkNotificationRead={async (id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadNotifications(prev => Math.max(0, prev - 1));
            try { await api.markNotificationRead(id); } catch { /* keep optimistic */ }
          }}
          onMarkAllNotificationsRead={async () => {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadNotifications(0);
            try { await api.markAllNotificationsRead(); } catch { /* keep optimistic */ }
          }}
          onNavigate={(tab, query) => {
            setCurrentTab(tab);
            if (query) setSearchQuery(query);
          }}
        />
        {renderCurrentView()}
      </main>

      {/* Mobile Floating Speed-Dial Action Button */}
      <MobileSpeedDialFab
        onAddStudent={() => setIsMobileAddStudentOpen(true)}
        onAddBatch={() => setIsMobileAddBatchOpen(true)}
        onRecordPayment={() => setIsMobileRecordFeeOpen(true)}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={currentTab}
        onSelectTab={(tabId) => {
          setCurrentTab(tabId as TabType);
          setIsMobileMoreOpen(false);
        }}
        onOpenMore={() => setIsMobileMoreOpen(true)}
        isMoreOpen={isMobileMoreOpen}
      />

      {/* Mobile More Navigation Drawer */}
      <MobileMoreDrawer
        isOpen={isMobileMoreOpen}
        activeView={currentTab}
        onClose={() => setIsMobileMoreOpen(false)}
        onNavigate={(viewId) => {
          setCurrentTab(viewId as TabType);
          setIsMobileMoreOpen(false);
        }}
        onLogout={handleLogout}
        userName={sessionUser.name || sessionUser.full_name || sessionUser.username || 'Admin'}
        userRole={sessionUser.role || 'Administrator'}
      />

      {/* Mobile FAB Creation Modals */}
      {isMobileAddStudentOpen && (
        <RegisterStudentModal
          isOpen={isMobileAddStudentOpen}
          onClose={() => { setIsMobileAddStudentOpen(false); setConvertLead(null); }}
          onAddStudent={async (newStudent) => {
            handleAddStudent(newStudent);
            setIsMobileAddStudentOpen(false);
            if (convertLead) {
              try {
                await api.updateInquiry(convertLead.id, { status: 'converted' });
              } catch (err) {
                console.warn('Could not mark inquiry converted', err);
              }
              setConvertLead(null);
              refreshDataFromBackend();
            }
          }}
          batches={batches}
          initialName={convertLead?.studentName}
          initialParentName={convertLead?.parentName}
          initialPhone={convertLead?.phone}
        />
      )}

      {isMobileAddBatchOpen && (
        <CreateBatchModal
          isOpen={isMobileAddBatchOpen}
          onClose={() => setIsMobileAddBatchOpen(false)}
          onAddBatch={(newBatch) => {
            handleAddBatch(newBatch);
            setIsMobileAddBatchOpen(false);
          }}
        />
      )}

      {isMobileRecordFeeOpen && (
        <RecordFeeModal
          isOpen={isMobileRecordFeeOpen}
          onClose={() => setIsMobileRecordFeeOpen(false)}
          onAddPayment={(payment) => {
            handleAddPayment(payment);
            setIsMobileRecordFeeOpen(false);
          }}
          students={students}
        />
      )}
    </div>
  );
}

export default App;
