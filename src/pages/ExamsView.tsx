import React, { useState, useEffect } from 'react';
import { Student, Batch, Subject } from '../types';
import { 
  Award, 
  BookOpen, 
  Plus, 
  Download, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit, 
  X, 
  Sparkles, 
  Clock, 
  User, 
  GraduationCap, 
  Eye, 
  Layers,
  Search,
  Check
} from 'lucide-react';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { ModernSelect } from '../components/ModernSelect';
import { ModernDatePicker } from '../components/ModernDatePicker';
import { MarksheetEntryModal } from '../components/MarksheetEntryModal';

interface ExamsViewProps {
  students: Student[];
  batches?: Batch[];
}

export const ExamsManagementView: React.FC<ExamsViewProps> = ({ students, batches: propBatches }) => {
  const [examsList, setExamsList] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>(propBatches || []);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Create Test Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBatchId, setFormBatchId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formExamDate, setFormExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMaxMarks, setFormMaxMarks] = useState('100');
  const [formPassMarks, setFormPassMarks] = useState('40');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Marksheet Entry Modal State
  const [selectedTestForMarks, setSelectedTestForMarks] = useState<any | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [testsData, batchesData, subjectsData] = await Promise.all([
        api.getTests().catch(() => []),
        api.getBatches().catch(() => []),
        api.getSubjects().catch(() => [])
      ]);
      setExamsList(testsData || []);
      setBatches(batchesData || []);
      setSubjects(subjectsData || []);
      if (batchesData && batchesData.length > 0 && !formBatchId) {
        setFormBatchId(batchesData[0].id);
      }
      if (subjectsData && subjectsData.length > 0 && !formSubjectId) {
        setFormSubjectId(subjectsData[0].id);
      }
    } catch (err) {
      console.error('Error loading exams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtered Assessments
  const filteredExams = examsList.filter(exam => {
    const matchesSearch = !searchQuery || exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) || exam.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatchFilter === 'ALL' || exam.batch_id === selectedBatchFilter || exam.batch?.id === selectedBatchFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' 
      ? true 
      : selectedStatusFilter === 'PUBLISHED' 
        ? exam.is_published 
        : !exam.is_published;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  // Calculate Metrics
  const totalAssessments = examsList.length;
  const publishedCount = examsList.filter(t => t.is_published).length;
  const draftCount = totalAssessments - publishedCount;
  const avgMaxMarks = totalAssessments > 0 
    ? Math.round(examsList.reduce((sum, t) => sum + (Number(t.max_marks) || 100), 0) / totalAssessments) 
    : 100;

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const newTest = await api.createTest({
        title: formTitle.trim(),
        batchId: formBatchId || (batches[0]?.id || ''),
        subjectId: formSubjectId || (subjects[0]?.id || ''),
        examDate: formExamDate,
        maxMarks: Number(formMaxMarks) || 100,
        passMarks: Number(formPassMarks) || 40
      });

      // 0ms Optimistic UI update
      setExamsList(prev => [newTest, ...prev]);
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormMaxMarks('100');
      setFormPassMarks('40');
      fetchInitialData();
    } catch (err) {
      console.error('Error creating assessment test:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (test: any) => {
    const newStatus = !test.is_published;
    // 0ms Optimistic UI update
    setExamsList(prev => prev.map(t => t.id === test.id ? { ...t, is_published: newStatus } : t));

    try {
      await api.updateTest(test.id, { isPublished: newStatus });
    } catch (err) {
      console.error('Error toggling publication status:', err);
      fetchInitialData();
    }
  };

  const handleDeleteTest = async (testId: string) => {
    // 0ms Optimistic UI update
    setExamsList(prev => prev.filter(t => t.id !== testId));

    try {
      await api.deleteTest(testId);
    } catch (err) {
      console.error('Error deleting test:', err);
      fetchInitialData();
    }
  };

  const handleExportCSV = () => {
    exportToCSV('Assessment_Tests_Register', filteredExams.map(t => ({
      Title: t.title,
      Subject: t.subject?.name || 'General Subject',
      Cohort: t.batch?.name || 'General Cohort',
      ExamDate: t.exam_date,
      MaxMarks: t.max_marks,
      PassMarks: t.pass_marks,
      Status: t.is_published ? 'Published' : 'Draft',
      MarksEntered: t.testMarks?.length || 0
    })));
  };

  const batchOptions = [
    { value: 'ALL', label: 'All Academic Cohorts' },
    ...batches.map(b => ({ value: b.id, label: b.name }))
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' }
  ];

  const modalBatchOptions = batches.map(b => ({ value: b.id, label: b.name }));
  const modalSubjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Directory Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Exams & Results Portal
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Curriculum assessment scheduling, marksheet entry, grading curves, and student report card generator
          </p>
        </div>
        <div className="header-action-bar">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setIsCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Create Assessment Test
          </button>
        </div>
      </div>

      {/* Top Academic Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Assessments</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{totalAssessments}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Published Tests</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{publishedCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Draft In-Progress</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', marginTop: 2 }}>{draftCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Avg Assessment Scale</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', marginTop: 2 }}>{avgMaxMarks} Marks</div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        background: '#FFFFFF', 
        padding: '12px 16px', 
        borderRadius: 14, 
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.02)'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search assessments or subject..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              height: 38, 
              paddingLeft: 36, 
              paddingRight: 12, 
              borderRadius: 10, 
              border: '1px solid #CBD5E1', 
              fontSize: 13, 
              color: '#0F172A',
              background: '#FFFFFF',
              outline: 'none'
            }} 
          />
        </div>

        {/* Batch Filter */}
        <div style={{ width: 200 }}>
          <ModernSelect
            options={batchOptions}
            value={selectedBatchFilter}
            onChange={setSelectedBatchFilter}
            placeholder="All Cohorts"
          />
        </div>

        {/* Status Filter */}
        <div style={{ width: 160 }}>
          <ModernSelect
            options={statusOptions}
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Desktop Assessments Table */}
      <div className="data-table-container desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Assessment Name & Subject</th>
              <th>Academic Cohort</th>
              <th>Exam Date</th>
              <th>Max Marks</th>
              <th>Pass Marks</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.length > 0 ? (
              filteredExams.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{exam.title}</div>
                    <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <BookOpen size={12} /> {exam.subject?.name || 'General Assessment'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{exam.batch?.name || 'All Cohorts'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} color="#64748B" /> {exam.exam_date}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{exam.max_marks}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#64748B' }}>{exam.pass_marks}</span>
                  </td>
                  <td>
                    {exam.is_published ? (
                      <span className="badge badge-green">Published</span>
                    ) : (
                      <span className="badge badge-amber">Draft</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        className="btn-primary btn-sm" 
                        onClick={() => setSelectedTestForMarks(exam)}
                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 9999 }}
                      >
                        <Award size={13} /> Marksheet
                      </button>
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => handleTogglePublish(exam)}
                        title={exam.is_published ? 'Unpublish' : 'Publish'}
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 9999 }}
                      >
                        {exam.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        onClick={() => handleDeleteTest(exam.id)}
                        className="table-icon-btn danger"
                        title="Delete Assessment"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#94A3B8' }}>
                  <Award size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 8px auto' }} />
                  <strong>No Assessment Tests Found</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Click "Create Assessment Test" above to schedule a new examination.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Touch Cards (< 768px) */}
      <div className="mobile-card-roster mobile-only">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <div key={exam.id} className="mobile-entity-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{exam.title}</h3>
                <span className="badge badge-gray">{exam.batch?.name || 'All Cohorts'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '8px 10px', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Subject / Date</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{exam.subject?.name || 'General'} &bull; {exam.exam_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Pass / Max</span>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{exam.pass_marks} / {exam.max_marks}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setSelectedTestForMarks(exam)}
                  style={{ flex: 1, justifyContent: 'center', height: 34, borderRadius: 9999 }}
                >
                  <Award size={13} /> Marksheet
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleTogglePublish(exam)}
                  style={{ padding: '0 12px', height: 34, borderRadius: 9999 }}
                >
                  {exam.is_published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 32, background: '#FFFFFF', borderRadius: 14, color: '#94A3B8', border: '1px solid #E2E8F0' }}>
            No Assessment Tests Recorded Yet
          </div>
        )}
      </div>

      {/* Marksheet Entry Modal */}
      {selectedTestForMarks && (
        <MarksheetEntryModal
          test={selectedTestForMarks}
          students={students}
          onClose={() => setSelectedTestForMarks(null)}
          onSaved={fetchInitialData}
        />
      )}

      {/* 4-Island Floating Architecture: Create Assessment Test Modal */}
      {isCreateModalOpen && (
        <div 
          className="floating-island-overlay" 
          onClick={() => setIsCreateModalOpen(false)}
          style={{ zIndex: 1300 }}
        >
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 540 }}
          >
            {/* Island 1: Floating Dark Navy Header */}
            <div style={{ 
              background: '#0F172A', 
              color: '#FFFFFF', 
              padding: '16px 20px', 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Award size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                    Schedule Assessment Test
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Configure assessment title, curriculum cohort, subject & scoring thresholds
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: 'none', 
                  color: '#94A3B8', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 3: Scrollable Form Card */}
            <div style={{ 
              padding: 22, 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1px solid #E2E8F0', 
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              maxHeight: '70vh', 
              overflowY: 'auto' 
            }}>
              <form id="create-test-form" onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Assessment Title <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="e.g. Mid-Term Physics & Mechanics Quiz" 
                    value={formTitle} 
                    onChange={e => setFormTitle(e.target.value)} 
                    style={{
                      height: 38,
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      padding: '0 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      background: '#FFFFFF',
                      outline: 'none'
                    }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Target Cohort</label>
                    <ModernSelect
                      options={modalBatchOptions.length > 0 ? modalBatchOptions : [{ value: '', label: 'General Batch' }]}
                      value={formBatchId}
                      onChange={setFormBatchId}
                      placeholder="Select Cohort"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Curriculum Subject</label>
                    <ModernSelect
                      options={modalSubjectOptions.length > 0 ? modalSubjectOptions : [{ value: '', label: 'General Subject' }]}
                      value={formSubjectId}
                      onChange={setFormSubjectId}
                      placeholder="Select Subject"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Exam Date</label>
                  <ModernDatePicker
                    value={formExamDate}
                    onChange={setFormExamDate}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Max Marks</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formMaxMarks} 
                      onChange={e => setFormMaxMarks(e.target.value)} 
                      min={1}
                      style={{
                        height: 38,
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        outline: 'none'
                      }}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Pass Marks</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formPassMarks} 
                      onChange={e => setFormPassMarks(e.target.value)} 
                      min={1}
                      style={{
                        height: 38,
                        borderRadius: 10,
                        border: '1px solid #CBD5E1',
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        outline: 'none'
                      }}
                      required 
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ 
                  padding: '9px 20px', 
                  borderRadius: 9999, 
                  border: '1px solid #CBD5E1', 
                  background: '#FFFFFF', 
                  color: '#334155', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="create-test-form"
                disabled={isSubmitting}
                style={{ 
                  padding: '9px 24px', 
                  borderRadius: 9999, 
                  border: 'none', 
                  background: isSubmitting ? '#94A3B8' : '#0F172A', 
                  color: '#FFFFFF', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                }}
              >
                <Plus size={15} /> {isSubmitting ? 'Creating...' : 'Schedule Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExamsManagementView;
