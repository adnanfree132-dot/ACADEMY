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
import { StudentDashboardView } from './components/StudentDashboardView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { StudentFeeView } from './components/StudentFeeView';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { AccessDeniedView } from './components/AccessDeniedView';
import { SuperAdminDashboardView } from './pages/SuperAdminDashboardView';
import { hasPermission } from './utils/rbac';
import { api } from './api/apiClient';
import { applyAcademySettings } from './lib/academySettings';
import { readBootstrapSnapshot, writeBootstrapSnapshot, filterDeleted, removeIdFromCaches, cacheClear } from './lib/resourceCache';
import { useEntityRemoved } from './lib/useEntityRemoved';
import { showToast } from './lib/toast';

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

let activeFetchDataInstance: (() => Promise<any>) | null = null;

/**
 * Staged loader export for backward compatibility & external triggers.
 * Invokes the active mounted App instance's staged loader if present,
 * or safely executes the bounded Stage 1 queries if invoked standalone.
 */
export const fetchData = async (): Promise<any> => {
  if (activeFetchDataInstance) {
    return activeFetchDataInstance();
  }
  return Promise.all([
    api.getMe().catch(() => null),
    api.getDashboard().catch(() => null),
    api.getStudents().catch(() => []),
    api.getBatches().catch(() => []),
  ]);
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
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [isLoadingCore, setIsLoadingCore] = useState<boolean>(false);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState<boolean>(false);
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

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const userRole = (currentUser?.role || 'admin').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher' || userRole === 'faculty';
  const isAdmin = userRole === 'admin' || userRole === 'administrator';

  const currentStudent = students.find(s =>
    (currentUser?.studentId && s.id === currentUser.studentId) ||
    (currentUser?.phone && s.phone === currentUser.phone) ||
    (currentUser?.email && s.email === currentUser.email)
  ) || students[0];

  const currentTeacher = teachers.find(t =>
    (currentUser?.teacherId && t.id === currentUser.teacherId) ||
    (currentUser?.phone && t.phone === currentUser.phone) ||
    (currentUser?.email && t.email === currentUser.email)
  ) || teachers[0];

  useEntityRemoved((ids) => {
    const gone = new Set(ids);
    setStaffList(prev => prev.filter(s => !gone.has(s.id) && !gone.has(s.teacher_id) && !gone.has(s.teacherId)));
    setTeachers(prev => prev.filter(t => !gone.has(t.id)));
  });

  // Handle session revocation (suspended or deactivated by administrator)
  useEffect(() => {
    const handleRevoked = (e: any) => {
      setIsAuthenticated(false);
      setCurrentUser({});
      const msg = e.detail || 'Your account access has been suspended or revoked by administration.';
      showToast(msg, 'error');
    };

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setCurrentUser({});
    };

    window.addEventListener('auth:session_revoked', handleRevoked);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:session_revoked', handleRevoked);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Sync user profile & dynamic permissions directly from DB on focus, mount, and visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const syncSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await api.getMe();
        if (isMounted && res?.user) {
          setCurrentUser((prev: any) => {
            const updated = { ...prev, ...res.user };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // If 403 / revoked, the custom event will trigger logout
      }
    };

    // Initial session sync is handled as part of Stage 1 in fetchData()
    // syncSession is retained for window focus and document visibility events
    const onFocus = () => syncSession();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncSession();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token && !isAuthenticated) return;

    setIsLoadingStudents(true);
    setIsLoadingCore(true);
    setIsLoadingSecondary(true);

    const run = async (loader: () => Promise<any>, onData: (value: any) => void) => {
      try {
        const value = await loader();
        if (value !== null && value !== undefined) onData(value);
      } catch {
        /* keep snapshot already on screen */
      }
    };

    // --- STAGE 1: Core Data (Sequential to avoid Worker connection pool exhaustion) ---
    // Login already provides user data, so getMe() is deferred to Stage 2.
    // Each request completes before the next fires, preventing concurrent DB connections.
    try {
      await run(() => api.getDashboard(), (stats) => {
        if (stats?.overview) {
          setDashboardStats(stats.overview);
          setDashboardLive(stats);
        } else {
          setDashboardLive(stats);
        }
      });

      await run(() => api.getStudents(), (backendStudents) => {
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
      });

      await run(() => api.getBatches(), (backendBatches) => {
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
      });
    } finally {
      // Release student loading indicator immediately once Stage 1 completes
      setIsLoadingStudents(false);
      setIsLoadingCore(false);
    }

    // --- YIELD MICRO-PAUSE (50ms) ---
    // Yield execution to allow DOM painting and connection buffer drain
    await new Promise(r => setTimeout(r, 50));

    try {
      // --- STAGE 2: Secondary Modules (Sequential to avoid Worker crashes) ---
    // getMe is deferred here since login already provides user data
    await run(() => api.getMe(), (res) => {
      if (res?.user) {
        setCurrentUser((prev: any) => {
          const updated = { ...prev, ...res.user };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    });

    await run(() => api.getNotifications(), (backendNotifications) => {
      if (!Array.isArray(backendNotifications)) return;
      setNotifications(backendNotifications);
      setUnreadNotifications(backendNotifications.filter((n: any) => !n.is_read).length);
    });

    await run(() => api.getSubjects(), (backendSubjects) => {
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
    });

    await run(() => api.getAnnouncements(), (backendAnn) => {
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
    });

    if (isAdmin) {
      await run(() => api.getSettings(), (backendSettings) => {
        applyAcademySettings(backendSettings);
        if (backendSettings.academyName) setAcademyName(backendSettings.academyName);
      });
    }

    if (isAdmin || isTeacher) {
      await run(() => api.getTeachers(), (backendTeachers) => {
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
      });
    }

    if (isAdmin) {
      await run(() => api.getStaffList(), (backendStaff) => {
        if (Array.isArray(backendStaff)) setStaffList(filterDeleted(backendStaff));
      });
      await run(() => api.getInquiries(), (backendInq) => {
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
      });
    }

    if (isAdmin || isStudent) {
      await run(() => api.getPayments(), (backendPayments) => {
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
      });
    }
    } finally {
      setIsLoadingSecondary(false);
    }
  };

  // Full backward compatibility: alias refreshDataFromBackend to staged fetchData
  const refreshDataFromBackend = fetchData;
  activeFetchDataInstance = fetchData;

  useEffect(() => {
    return () => {
      activeFetchDataInstance = null;
    };
  }, []);

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
    let idleHandle: any = null;

    void (async () => {
      // Execute staged loader (Stage 1 Core Data -> 50ms Yield -> Stage 2 Secondary Modules)
      await fetchData();

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth();
      if (m === 0) { m = 12; y -= 1; }
      const priorMonth = `${y}-${String(m).padStart(2, '0')}`;

      // Stage 3: Lazy Auxiliary Prefetch (wrapped in requestIdleCallback with 1200ms fallback)
      const runAuxiliaryPrefetch = async () => {
        const prefetchFns: (() => Promise<any>)[] = [
          () => api.getHomework(),
          () => api.getStudyMaterials(),
          () => api.getTests(),
          () => api.getTimetableSlots(),
          () => api.getLeaves(),
          () => api.getClasses()
        ];

        if (isAdmin) {
          prefetchFns.push(
            () => api.getInvoices(),
            () => api.getExpenses(),
            () => api.getConductDesk(),
            () => api.getWhatsAppTemplates(),
            () => api.getWhatsAppLogs(),
            () => api.getStaffTypes(),
            () => api.getLiveStaffPayrollRegister({ month_period: priorMonth }),
            () => api.getStaffAttendanceRoster({ date: today })
          );
        } else if (isTeacher) {
          prefetchFns.push(
            () => api.getConductDesk(),
            () => api.getStaffAttendanceRoster({ date: today })
          );
        } else if (isStudent) {
          prefetchFns.push(
            () => api.getInvoices()
          );
        }

        // Execute sequentially one-by-one with 150ms pauses so connection pool is never crowded
        for (const fn of prefetchFns) {
          await quiet(fn());
          await new Promise(r => setTimeout(r, 150));
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleHandle = (window as any).requestIdleCallback(() => {
          void runAuxiliaryPrefetch();
        }, { timeout: 4000 });
      } else {
        idleHandle = setTimeout(() => {
          void runAuxiliaryPrefetch();
        }, 4000);
      }
    })();

    return () => {
      if (idleHandle) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle);
        }
      }
    };
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    if ((dashboardStats?.totalStudents || 0) > 0 && students.length === 0) {
      return;
    }
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
  }, [isAuthenticated, isAdmin, dashboardStats, dashboardLive, students, teachers, staffList, batches, transactions, leads, announcements, subjects, academyName, notifications]);

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
    cacheClear();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser({});
    setStudents([]);
    setTeachers([]);
    setBatches([]);
    setTransactions([]);
    setDashboardStats(null);
    setDashboardLive(null);
    setLeads([]);
    setAnnouncements([]);
    setSubjects([]);
    setStaffList([]);
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
        currentUser?.role === 'super_admin' ? (
          <SuperAdminDashboardView />
        ) : isStudent ? (
          <StudentDashboardView
            student={currentStudent}
            dashboardLive={dashboardLive}
            isLoading={isLoadingCore && !dashboardLive}
            onNavigate={setCurrentTab}
          />
        ) : isTeacher ? (
          <TeacherDashboardView
            teacher={currentTeacher}
            dashboardLive={dashboardLive}
            isLoading={isLoadingCore && !dashboardLive}
            onNavigate={setCurrentTab}
          />
        ) : (
          <DashboardView
            students={students}
            teachers={teachers}
            batches={batches}
            transactions={transactions}
            leads={leads}
            onNavigate={setCurrentTab}
            dashboardStats={dashboardStats}
            dashboardLive={dashboardLive}
            isLoading={isLoadingCore && !dashboardStats}
          />
        )
      ))}
      {pane('super_admin', (
        currentUser?.role === 'super_admin' ? (
          <SuperAdminDashboardView />
        ) : (
          <AccessDeniedView
            message="You do not have permission to access the Super Admin oversight portal."
            onReturn={() => setCurrentTab('dashboard')}
          />
        )
      ))}
      {pane('academies', (
        currentUser?.role === 'super_admin' ? (
          <SuperAdminDashboardView />
        ) : (
          <AccessDeniedView
            message="You do not have permission to access the Academies directory."
            onReturn={() => setCurrentTab('dashboard')}
          />
        )
      ))}
      {pane('students', (
        !hasPermission(currentUser, 'students', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to view the institutional student directory."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <StudentsView
            students={students}
            isLoading={isLoadingStudents}
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
        )
      ))}
      {pane('teachers', (
        !hasPermission(currentUser, 'teachers', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to view faculty records and staff payroll."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <TeachersView
            teachers={teachers}
            staff={staffList}
            onUpdateStaffList={setStaffList}
            batches={batches}
            students={students}
            onAddTeacher={handleAddTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onEditTeacher={handleEditTeacher}
            isLoading={isLoadingSecondary && teachers.length === 0}
          />
        )
      ))}
      {pane('batches', (
        !hasPermission(currentUser, 'batches', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access classes and batches."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <BatchesView
            batches={batches}
            teachers={teachers}
            subjects={subjects}
            students={students}
            onAddBatch={handleAddBatch}
            onDeleteBatch={handleDeleteBatch}
            onEditBatch={handleEditBatch}
            onRefresh={refreshDataFromBackend}
            isLoading={isLoadingCore && batches.length === 0}
          />
        )
      ))}
      {pane('subjects', (
        !hasPermission(currentUser, 'subjects', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access course subjects."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <SubjectsView
            subjects={subjects}
            isLoading={isLoadingSecondary && subjects.length === 0}
            onAddSubject={handleAddSubject}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onRefresh={refreshDataFromBackend}
          />
        )
      ))}
      {pane('attendance', (
        !hasPermission(currentUser, 'attendance', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access attendance records."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : isStudent ? (
          <StudentAttendanceView
            student={currentStudent}
            onNavigate={setCurrentTab}
          />
        ) : (
          <AttendanceView batches={batches} students={students} />
        )
      ))}
      {pane('staff_attendance', (
        !hasPermission(currentUser, 'staff_attendance', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access staff attendance."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <StaffAttendanceView />
        )
      ))}
      {pane('staff_payroll', (
        !hasPermission(currentUser, 'staff_payroll', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access institutional staff payroll."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <StaffPayrollView />
        )
      ))}
      {pane('fees', (
        !hasPermission(currentUser, 'fees', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access fee management."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : isStudent ? (
          <StudentFeeView
            student={currentStudent}
            onNavigate={setCurrentTab}
          />
        ) : (
          <FeeManagementView
            students={students}
            transactions={transactions}
            onOpenCreateModal={() => {}}
            onAddPayment={handleAddPayment}
            isLoading={(isLoadingCore || isLoadingSecondary) && transactions.length === 0}
          />
        )
      ))}
      {pane('expenses', (
        !hasPermission(currentUser, 'expenses', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access institutional expenses."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <ExpenseManagementView />
        )
      ))}
      {pane('crm', (
        !hasPermission(currentUser, 'crm', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access admissions CRM and leads."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <CrmView
            leads={leads}
            isLoading={isLoadingSecondary && leads.length === 0}
            onAddLead={handleAddLead}
            onConvertLead={(lead) => {
              setConvertLead(lead);
              setIsMobileAddStudentOpen(true);
            }}
            onLeadsChanged={refreshDataFromBackend}
          />
        )
      ))}
      {pane('announcements', (
        !hasPermission(currentUser, 'announcements', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access announcements."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <AnnouncementsView
            announcements={announcements}
            isLoading={isLoadingSecondary && announcements.length === 0}
            onAddAnnouncement={handleAddAnnouncement}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        )
      ))}
      {pane('whatsapp', (
        !hasPermission(currentUser, 'whatsapp', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access administrative WhatsApp messaging."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <WhatsAppCenterView />
        )
      ))}
      {pane('timetable', (
        !hasPermission(currentUser, 'timetable', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access timetables."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <TimetableView />
        )
      ))}
      {pane('exams', (
        !hasPermission(currentUser, 'exams', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access exams and results."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <ExamsView students={students} batches={batches} />
        )
      ))}
      {pane('homework', (
        !hasPermission(currentUser, 'homework', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access homework and study materials."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <HomeworkView />
        )
      ))}
      {pane('leaves', (
        !hasPermission(currentUser, 'leaves', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access student leaves."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <StudentLeaveView students={isStudent && currentStudent ? [currentStudent] : students} />
        )
      ))}
      {pane('conduct', (
        !hasPermission(currentUser, 'conduct', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access the Conduct Desk."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <ConductView />
        )
      ))}
      {pane('settings', (
        !hasPermission(currentUser, 'settings', 'view_only') ? (
          <AccessDeniedView
            message="You do not have permission to access academy configuration."
            onReturn={() => setCurrentTab('dashboard')}
          />
        ) : (
          <SettingsView />
        )
      ))}
    </>
  );

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          try {
            setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));
          } catch {
            setCurrentUser({});
          }
        }}
      />
    );
  }

  const tabTitles: Record<TabType, string> = {
    dashboard: currentUser?.role === 'super_admin' ? 'Super Admin - Academy Oversight' : isStudent ? 'Student Portal' : isTeacher ? 'Faculty Portal' : 'Dashboard',
    students: 'Students Directory',
    teachers: 'Faculty Directory',
    batches: 'Classes & Batches',
    subjects: 'Course Subjects',
    attendance: isStudent ? 'My Attendance' : 'Attendance Portal',
    staff_attendance: 'Staff Geolocation Attendance',
    staff_payroll: 'Staff Payroll & Salary Management',
    fees: isStudent ? 'My Fee Slips' : 'Fee Management',
    expenses: 'Institutional Expenses',
    crm: 'Inquiries & CRM',
    announcements: 'Announcements',
    whatsapp: 'WhatsApp Center',
    timetable: 'Timetables',
    exams: 'Exams & Results',
    homework: 'Homework & Study',
    leaves: 'Student Leave',
    conduct: 'Conduct Desk',
    settings: 'Academy Settings',
    super_admin: 'Super Admin - Academy Oversight',
    academies: 'Registered Academies Directory'
  };

  const displayName = currentUser?.name || currentUser?.full_name || currentUser?.username || (isStudent ? 'Student' : isTeacher ? 'Teacher' : 'Admin');
  const displayRole = currentUser?.role ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)) : (isStudent ? 'Student' : isTeacher ? 'Teacher' : 'Administrator');

  return (
    <div className="app-container">
      {/* Mobile Top App Bar */}
      <MobileTopBar
        academyName={academyName}
        activeViewTitle={tabTitles[currentTab] || 'Dashboard'}
        notificationCount={unreadNotifications}
        userName={displayName}
        userRole={displayRole}
        onOpenNotifications={() => setCurrentTab('announcements')}
        onOpenQuickCreate={() => setIsMobileMoreOpen(true)}
      />

      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
        userRole={userRole}
        currentUser={currentUser}
      />

      {/* Main Content View Container */}
      <main className="main-content">
        <Header
          userName={displayName}
          userRole={displayRole}
          currentUser={currentUser}
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

      {/* Mobile Floating Speed-Dial Action Button (Admins only) */}
      {isAdmin && (
        <MobileSpeedDialFab
          onAddStudent={() => setIsMobileAddStudentOpen(true)}
          onAddBatch={() => setIsMobileAddBatchOpen(true)}
          onRecordPayment={() => setIsMobileRecordFeeOpen(true)}
        />
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={currentTab}
        onSelectTab={(tabId) => {
          setCurrentTab(tabId as TabType);
          setIsMobileMoreOpen(false);
        }}
        onOpenMore={() => setIsMobileMoreOpen(true)}
        isMoreOpen={isMobileMoreOpen}
        userRole={userRole}
        currentUser={currentUser}
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
        userName={displayName}
        userRole={displayRole}
        currentUser={currentUser}
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
