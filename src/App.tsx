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
import { CrmView } from './pages/CrmView';
import { AnnouncementsView } from './pages/AnnouncementsView';
import { TimetableView, ExamsView, HomeworkView, SettingsView } from './pages/SecondaryViews';
import { LoginView } from './pages/LoginView';
import { api } from './api/apiClient';

import { WhatsAppCenterView } from './pages/WhatsAppCenterView';
import { MobileTopBar } from './components/MobileTopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreDrawer } from './components/MobileMoreDrawer';
import { MobileSpeedDialFab } from './components/MobileSpeedDialFab';
import { RegisterStudentModal } from './components/RegisterStudentModal';
import { CreateBatchModal } from './components/CreateBatchModal';
import { RecordFeeModal } from './components/RecordFeeModal';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile App State
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobileAddStudentOpen, setIsMobileAddStudentOpen] = useState(false);
  const [isMobileAddBatchOpen, setIsMobileAddBatchOpen] = useState(false);
  const [isMobileRecordFeeOpen, setIsMobileRecordFeeOpen] = useState(false);

  // Main State (Live Database Connected via Express REST API)
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Sync with Backend API
  const refreshDataFromBackend = async () => {
    try {
      const [
        stats,
        backendStudents,
        backendTeachers,
        backendBatches,
        backendAnn,
        backendInq
      ] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getStudents().catch(() => []),
        api.getTeachers().catch(() => []),
        api.getBatches().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getInquiries().catch(() => []),
        api.getSubjects().catch(() => [])
      ]);

      const backendSubjects = (await api.getSubjects().catch(() => [])) as any[];
      if (Array.isArray(backendSubjects) && backendSubjects.length > 0) {
        setSubjects(backendSubjects.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code
        })));
      }

      if (stats?.overview) {
        setDashboardStats(stats.overview);
      }

      if (Array.isArray(backendStudents) && backendStudents.length > 0) {
        setStudents(backendStudents.map((s: any, idx: number) => {
          const totalFee = s.totalFee !== undefined ? s.totalFee : (s.feePlan?.monthly_amount || 10000);
          const dueBalance = s.dueBalance !== undefined ? s.dueBalance : 0;
          const paidFee = s.paidFee !== undefined ? s.paidFee : Math.max(0, totalFee - dueBalance);

          const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
          const gradeBatch = s.class?.name || grades[idx % grades.length];

          let studentStatus: 'Active' | 'On Leave' | 'Graduated' | 'Suspended' | 'Left' = 'Active';
          const sLower = (s.status || '').toLowerCase();
          if (sLower === 'active') studentStatus = 'Active';
          else if (sLower.includes('leave') || sLower === 'inactive') studentStatus = 'On Leave';
          else if (sLower.includes('graduat') || sLower === 'alumni') studentStatus = 'Graduated';
          else if (sLower.includes('suspend')) studentStatus = 'Suspended';
          else if (sLower.includes('left') || sLower.includes('withdraw') || sLower.includes('remov')) studentStatus = 'Left';

          return {
            id: s.id,
            regNo: s.admission_no || s.id,
            name: s.full_name,
            parentName: s.parentName || 'Parent / Guardian',
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
            dueDate: '2026-09-05',
            isDefaulter: s.isDefaulter !== undefined ? s.isDefaulter : dueBalance > 0
          };
        }));
      }

      if (Array.isArray(backendTeachers) && backendTeachers.length > 0) {
        setTeachers(backendTeachers.map((t: any) => ({
          id: t.id,
          name: t.user?.full_name || 'Unknown',
          qualification: t.qualification || 'M.Sc',
          assignedSubjects: ['Physics'],
          assignedBatches: ['Grade 10 - Sec A'],
          phone: t.user?.phone || '+92000000',
          email: t.user?.email || 'teacher@academy.com'
        })));
      }

      if (Array.isArray(backendBatches) && backendBatches.length > 0) {
        setBatches(backendBatches.map((b: any) => ({
          id: b.id,
          name: b.name || 'Default Batch',
          classLevel: b.class?.name || 'Grade 10',
          teacherName: b.teacher?.user?.full_name || 'Unassigned',
          timing: b.start_time && b.end_time ? `${b.start_time} - ${b.end_time}` : '08:00 AM - 10:00 AM',
          room: 'Room 101',
          capacity: b.capacity || 30,
          studentsCount: Array.isArray(b.enrollments) ? b.enrollments.length : 0
        })));
      }
      
      if (Array.isArray(backendAnn) && backendAnn.length > 0) {
        setAnnouncements(backendAnn.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content || a.body,
          date: a.created_at ? String(a.created_at).split('T')[0] : '2026-08-13',
          targetAudience: a.audience || a.target_audience || 'All'
        })));
      }
      
      if (Array.isArray(backendInq) && backendInq.length > 0) {
        setLeads(backendInq.map((i: any) => ({
          id: i.id,
          studentName: i.student_name || i.name,
          parentName: i.parent_name || (i.notes ? i.notes.replace('Parent: ', '') : 'Unknown'),
          phone: i.phone,
          gradeInterest: i.grade_interest || i.class_interest,
          status: i.status === 'new' ? 'New' : i.status === 'contacted' ? 'Contacted' : 'Converted',
          followUpDate: '2026-09-01',
          date: i.created_at ? String(i.created_at).split('T')[0] : '2026-08-13'
        })));
      }
    } catch (err) {
      console.warn('Backend API offline or initial sync:', err);
    } finally {
      setIsAppLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDataFromBackend();
    }
  }, [isAuthenticated]);

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
      await api.updateStudent(updatedStudent.id, {
        fullName: updatedStudent.name,
        parentName: updatedStudent.parentName,
        phone: updatedStudent.phone,
        email: updatedStudent.email,
        status: updatedStudent.status.toLowerCase(),
        gender: updatedStudent.gender
      });
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error updating student to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteStudent = async (studentId: string, mode: 'soft' | 'hard' = 'soft') => {
    // 1. Optimistic UI Update (Instant 0ms removal from all views & dashboard)
    setStudents(prev => prev.filter(s => s.id !== studentId));

    // 2. Background Sync
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
      await api.recordPayment({
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        method: paymentData.method.toLowerCase(),
        notes: paymentData.notes,
        discount: paymentData.discount,
        discountRemarks: paymentData.discountRemarks,
        invoiceId: (paymentData as any).invoiceId
      });
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error recording payment to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id' | 'assignedSubjects' | 'assignedBatches'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempTeacher: Teacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
      assignedSubjects: ['Pending'],
      assignedBatches: ['Pending']
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
      refreshDataFromBackend();
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
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
      refreshDataFromBackend();
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
        classLevel: batchData.classLevel,
        timing: batchData.timing,
        room: batchData.room,
        capacity: batchData.capacity
      });
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding batch to backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
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
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error updating batch in backend:', err);
      refreshDataFromBackend();
    }
  };

  const handleAddAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'date'>) => {
    // 1. Optimistic UI Update (Instant 0ms)
    const tempAnn: Announcement = {
      ...announcementData,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements(prev => [tempAnn, ...prev]);

    // 2. Background Sync
    try {
      await api.createAnnouncement(announcementData);
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error adding announcement:', err);
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
      refreshDataFromBackend();
    } catch (err) {
      console.error('Error updating subject:', err);
      refreshDataFromBackend();
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    // 1. Optimistic UI Update (Instant 0ms)
    setSubjects(prev => prev.filter(s => s.id !== subjectId));

    // 2. Background Sync
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

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            students={students}
            teachers={teachers}
            batches={batches}
            transactions={transactions}
            leads={leads}
            onNavigate={setCurrentTab}
            dashboardStats={dashboardStats}
          />
        );
      case 'students':
        return (
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
        );
      case 'teachers':
        return (
          <TeachersView
            teachers={teachers}
            batches={batches}
            students={students}
            onAddTeacher={handleAddTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onEditTeacher={handleEditTeacher}
          />
        );

      case 'batches':
        return (
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
        );
      case 'subjects':
        return (
          <SubjectsView
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onRefresh={refreshDataFromBackend}
          />
        );
      case 'attendance':
        return (
          <AttendanceView
            batches={batches}
            students={students}
          />
        );
      case 'staff_attendance':
        return <StaffAttendanceView />;
      case 'staff_payroll':
        return <StaffPayrollView />;
      case 'fees':
        return (
          <FeeManagementView
            students={students}
            transactions={transactions}
            onOpenCreateModal={() => {}}
            onAddPayment={handleAddPayment}
          />
        );
      case 'crm':
        return <CrmView leads={leads} onAddLead={handleAddLead} />;
      case 'announcements':
        return <AnnouncementsView announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />;
      case 'whatsapp':
        return <WhatsAppCenterView />;
      case 'timetable':
        return <TimetableView />;
      case 'exams':
        return <ExamsView students={students} batches={batches} />;
      case 'homework':
        return <HomeworkView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView students={students} teachers={teachers} batches={batches} transactions={transactions} leads={leads} onNavigate={setCurrentTab} dashboardStats={dashboardStats} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => { setIsAuthenticated(true); setIsAppLoading(true); }} />;
  }

  if (isAppLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ border: '4px solid rgba(0, 0, 0, 0.1)', width: 48, height: 48, borderRadius: '50%', borderLeftColor: 'var(--color-primary-500)', animation: 'spin 1s linear infinite', marginBottom: 20 }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Loading Academy Data...</h2>
        <p>Please wait while we securely connect to your dashboard.</p>
      </div>
    );
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
    crm: 'Inquiries & CRM',
    announcements: 'Announcements',
    whatsapp: 'WhatsApp Center',
    timetable: 'Timetables',
    exams: 'Exams & Results',
    homework: 'Homework & Study',
    settings: 'Academy Settings'
  };

  return (
    <div className="app-container">
      {/* Mobile Top App Bar */}
      <MobileTopBar
        academyName="AcademiaPro"
        activeViewTitle={tabTitles[currentTab] || 'Dashboard'}
        onOpenNotifications={() => {}}
        onOpenQuickCreate={() => setIsMobileMoreOpen(true)}
      />

      {/* Desktop Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} onLogout={handleLogout} />

      {/* Main Content View Container */}
      <main className="main-content">
        <Header
          onOpenAction={(type) => setCurrentTab(type === 'student' ? 'students' : type === 'teacher' ? 'teachers' : type === 'fee' ? 'fees' : 'batches')}
          onSearch={setSearchQuery}
          onLogout={handleLogout}
          students={students}
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
      />

      {/* Mobile FAB Creation Modals */}
      {isMobileAddStudentOpen && (
        <RegisterStudentModal
          isOpen={isMobileAddStudentOpen}
          onClose={() => setIsMobileAddStudentOpen(false)}
          onAddStudent={(newStudent) => {
            handleAddStudent(newStudent);
            setIsMobileAddStudentOpen(false);
          }}
          batches={batches}
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
