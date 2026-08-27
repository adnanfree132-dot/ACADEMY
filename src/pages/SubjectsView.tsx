import React, { useState } from 'react';
import { Subject } from '../types';
import { BookOpen, Plus, Pencil, Trash2, X, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SubjectsViewProps {
  subjects: Subject[];
  onAddSubject?: (subjectData: { name: string; code: string }) => void;
  onEditSubject?: (subjectId: string, subjectData: { name: string; code: string }) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onRefresh?: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ 
  subjects, 
  onAddSubject, 
  onEditSubject, 
  onDeleteSubject,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setFormName('');
    setFormCode('');
    setIsAddModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    const data = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase()
    };

    setIsAddModalOpen(false);
    if (onAddSubject) {
      onAddSubject(data);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !formName.trim() || !formCode.trim()) return;

    const targetId = editingSubject.id;
    const data = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase()
    };

    setEditingSubject(null);
    if (onEditSubject) {
      onEditSubject(targetId, data);
    }
  };

  const confirmDelete = () => {
    if (!subjectToDelete) return;
    const targetId = subjectToDelete.id;
    setSubjectToDelete(null);
    if (onDeleteSubject) {
      onDeleteSubject(targetId);
    }
  };

  // Color palette for subject cards
  const colors = [
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#3B82F6' },
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: '#22C55E' },
    { bg: '#FDF4FF', border: '#E9D5FF', text: '#7E22CE', icon: '#A855F7' },
    { bg: '#FFF7ED', border: '#FDBA74', text: '#9A3412', icon: '#F97316' },
    { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#EF4444' },
    { bg: '#F0F9FF', border: '#A5F3FC', text: '#155E75', icon: '#06B6D4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="directory-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Subject Catalog</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Manage academic subjects, assign them to classes, and link to teachers</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            className="form-input"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, width: 'auto' }}>
          <BookOpen size={16} color="#475569" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{subjects.length} Total Subjects</span>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="subjects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filteredSubjects.map((subject, index) => {
            const color = colors[index % colors.length];
            return (
              <div
                key={subject.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderLeft: `4px solid ${color.border}`,
                  background: '#FFFFFF',
                  padding: 16
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: color.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <BookOpen size={18} color={color.icon} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{subject.name}</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: color.text,
                        background: color.bg, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 2
                      }}>
                        {subject.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions (Standard Theme Buttons) */}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <button
                    type="button"
                    className="table-icon-btn"
                    onClick={() => openEdit(subject)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    <Pencil size={13} color="#475569" /> Edit
                  </button>

                  <button
                    type="button"
                    className="table-icon-btn danger"
                    onClick={() => setSubjectToDelete(subject)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    <Trash2 size={13} color="#DC2626" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <BookOpen size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No Subjects Created Yet</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Click "Add Subject" to create your first academic subject (e.g., Mathematics, Physics, English).
          </p>
        </div>
      )}

      {/* Floating Island: Add Subject Modal */}
      {isAddModalOpen && (
        <div className="floating-island-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="floating-island-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            {/* Island 1: Dark Navy Header */}
            <div className="island-header-card">
              <div className="island-header-left">
                <span className="island-header-badge">
                  <BookOpen size={12} color="#10B981" /> Subject Catalog
                </span>
                <h3 className="island-header-title">Add New Subject</h3>
                <p className="island-header-sub">Create an academic subject for classes and study plans</p>
              </div>
              <button className="island-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={15} color="#94A3B8" />
              </button>
            </div>

            {/* Island 3: Form Content Card */}
            <form onSubmit={handleAddSubmit} style={{ display: 'contents' }}>
              <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Mathematics, Organic Chemistry"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Code</label>
                  <input
                    className="form-input"
                    placeholder="e.g. MATH-101, CHEM-201"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    required
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Unique identifier code for marksheets & reports</span>
                </div>
              </div>

              {/* Island 4: Floating Action Pill Row */}
              <div className="island-pill-row">
                <button type="button" className="island-pill-btn island-pill-btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="island-pill-btn island-pill-btn-submit">
                  <CheckCircle2 size={15} color="#10B981" /> Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Island: Edit Subject Modal */}
      {editingSubject && (
        <div className="floating-island-overlay" onClick={() => setEditingSubject(null)}>
          <div className="floating-island-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            {/* Island 1: Dark Navy Header */}
            <div className="island-header-card">
              <div className="island-header-left">
                <span className="island-header-badge">
                  <Pencil size={12} color="#10B981" /> Edit Subject
                </span>
                <h3 className="island-header-title">{editingSubject.name}</h3>
                <p className="island-header-sub">Update subject title and catalog identifier code</p>
              </div>
              <button className="island-close-btn" onClick={() => setEditingSubject(null)}>
                <X size={15} color="#94A3B8" />
              </button>
            </div>

            {/* Island 3: Form Content Card */}
            <form onSubmit={handleEditSubmit} style={{ display: 'contents' }}>
              <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Name</label>
                  <input
                    className="form-input"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Subject Code</label>
                  <input
                    className="form-input"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value.toUpperCase())}
                    required
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>

              {/* Island 4: Floating Action Pill Row */}
              <div className="island-pill-row">
                <button type="button" className="island-pill-btn island-pill-btn-cancel" onClick={() => setEditingSubject(null)}>
                  Cancel
                </button>
                <button type="submit" className="island-pill-btn island-pill-btn-submit">
                  <CheckCircle2 size={15} color="#10B981" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Island: Custom Delete Confirmation Modal (Rule 5 & Rule 11) */}
      {subjectToDelete && (
        <div className="floating-island-overlay" onClick={() => setSubjectToDelete(null)} style={{ zIndex: 1300 }}>
          <div className="floating-island-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            {/* Island 1: Dark Navy Danger Header */}
            <div className="island-header-card" style={{ borderBottom: '2px solid rgba(239, 68, 68, 0.4)' }}>
              <div className="island-header-left">
                <span className="island-header-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                  <AlertTriangle size={12} color="#EF4444" /> Delete Subject Confirmation
                </span>
                <h3 className="island-header-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trash2 size={18} color="#EF4444" /> Delete Subject
                </h3>
                <p className="island-header-sub">
                  Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>{subjectToDelete.name}</strong> ({subjectToDelete.code})?
                </p>
              </div>
              <button className="island-close-btn" onClick={() => setSubjectToDelete(null)}>
                <X size={15} color="#94A3B8" />
              </button>
            </div>

            {/* Island 3: Warning Details Card */}
            <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#FEF2F2',
                border: '1px solid #FECACA'
              }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                  <strong>Important Notice:</strong> Deleting this subject will also remove its associated test marks, homework assignments, and batch mappings from the catalog.
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: 13
              }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Subject Code:</span>
                <span style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'monospace' }}>{subjectToDelete.code}</span>
              </div>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div className="island-pill-row">
              <button type="button" className="island-pill-btn island-pill-btn-cancel" onClick={() => setSubjectToDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="island-pill-btn"
                onClick={confirmDelete}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(220,38,38,0.35)'
                }}
              >
                <Trash2 size={14} color="#FFFFFF" /> Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
