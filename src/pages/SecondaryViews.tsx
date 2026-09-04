import React, { useState, useEffect } from 'react';
import { Award, FileText, Calendar as CalendarIcon, Settings, Plus, Download, Clock, MapPin, CheckCircle2, User, BookOpen, X, Upload, Building2, Image as ImageIcon, Palette, Sliders, Sparkles, ShieldCheck, ChevronRight, GraduationCap, UserSquare2, Pencil, Trash2, CreditCard, Compass, History } from 'lucide-react';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { compressAndResizeImage } from '../utils/imageResizer';
import { MarksheetEntryModal } from '../components/MarksheetEntryModal';
import { ModernSelect } from '../components/ModernSelect';
import { Student } from '../types';
import { CampusGeofenceSettings } from '../components/CampusGeofenceSettings';
import { setGlobalCurrencySymbol } from '../utils/payrollUiUtils';
import { applyAcademySettings } from '../lib/academySettings';


/* ==========================================================================
   1. Academic Timetable & Weekly Calendar Grid
   ========================================================================== */
export { TimetableView } from './TimetableView';


/* ==========================================================================
   2. Exams & Assessment Manager (Connected to Express API)
   ========================================================================== */
export { ExamsManagementView, ExamsManagementView as ExamsView } from './ExamsView';


/* ==========================================================================
   3. Homework & Study Notes Manager (Connected to Express API)
   ========================================================================== */
export { HomeworkView } from './HomeworkView';

/* ==========================================================================
   4. Settings View (Connected to Express Settings API)
   ========================================================================== */
export const SettingsView: React.FC = () => {
  const [subTab, setSubTab] = useState<'branding' | 'assets' | 'idcard' | 'customizer' | 'geofence' | 'audit'>('branding');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [academyName, setAcademyName] = useState('AcademiaPro Management OS');
  const [academicSession, setAcademicSession] = useState('Session 2026-2027');
  const [currencySymbol, setCurrencySymbol] = useState('Rs');
  const [gracePeriod, setGracePeriod] = useState('5');
  const [principalName, setPrincipalName] = useState('Dr. S. A. Khan');
  const [academyAddress, setAcademyAddress] = useState('Campus 1, Academic Zone');
  const [academyPhone, setAcademyPhone] = useState('+92 300 0000000');
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [themePrimary, setThemePrimary] = useState('#EA580C');
  const [themeSecondary, setThemeSecondary] = useState('#1E293B');
  const [academyMode, setAcademyModeState] = useState<'CLASS' | 'BATCH'>('CLASS');
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic Custom Form Fields Config
  const [customStudentFields, setCustomStudentFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'date' | 'time'; options?: string[] }>>([
    { id: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    { id: 'fatherOccupation', label: "Father's Occupation", type: 'text' }
  ]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'select' | 'date' | 'time'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Teacher Custom Fields Config
  const [customTeacherFields, setCustomTeacherFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'date' | 'time'; options?: string[] }>>([
    { id: 'qualification', label: 'Highest Qualification', type: 'text' },
    { id: 'experience', label: 'Years of Experience', type: 'text' }
  ]);
  const [newTeacherFieldLabel, setNewTeacherFieldLabel] = useState('');
  const [newTeacherFieldType, setNewTeacherFieldType] = useState<'text' | 'select' | 'date' | 'time'>('text');
  const [newTeacherFieldOptions, setNewTeacherFieldOptions] = useState('');

  // Class Custom Fields Config
  const [customClassFields, setCustomClassFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'date' | 'time'; options?: string[] }>>([
    { id: 'academicLevel', label: 'Academic Section / Level', type: 'select', options: ['Montessori', 'Primary', 'Secondary', 'Higher Secondary'] },
    { id: 'timing', label: 'Class Timing', type: 'time' },
    { id: 'room', label: 'Room / Hall', type: 'text' }
  ]);
  const [newClassFieldLabel, setNewClassFieldLabel] = useState('');
  const [newClassFieldType, setNewClassFieldType] = useState<'text' | 'select' | 'date' | 'time'>('text');
  const [newClassFieldOptions, setNewClassFieldOptions] = useState('');

  // Horizontal Sub-Tab state for Form Customizer
  const [customizerTab, setCustomizerTab] = useState<'student' | 'teacher' | 'class'>('student');

  // Editing state for Custom Fields
  const [editingStudentFieldId, setEditingStudentFieldId] = useState<string | null>(null);
  const [editingTeacherFieldId, setEditingTeacherFieldId] = useState<string | null>(null);
  const [editingClassFieldId, setEditingClassFieldId] = useState<string | null>(null);



  // ID Card Display Options
  const [idCardFields, setIdCardFields] = useState<{
    showRegNo: boolean;
    showClassBatch: boolean;
    showPhone: boolean;
    showDOB: boolean;
    showBloodGroup: boolean;
    showAddress: boolean;
    showCustomFields: boolean;
  }>({
    showRegNo: true,
    showClassBatch: true,
    showPhone: true,
    showDOB: true,
    showBloodGroup: true,
    showAddress: true,
    showCustomFields: true
  });

  // Preset palette swatches for quick selection
  const primaryPresets = ['#EA580C', '#2563EB', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#D97706', '#BE185D'];
  const secondaryPresets = ['#1E293B', '#0F172A', '#1A1A2E', '#16213E', '#0D1B2A', '#1B1B2F', '#2D2D44', '#191919'];

  useEffect(() => {
    // 1. Initial load from localStorage for instant persistence
    const localStudent = localStorage.getItem('customStudentFields');
    const localTeacher = localStorage.getItem('customTeacherFields');
    const localClass = localStorage.getItem('customClassFields');
    if (localStudent) { try { setCustomStudentFields(JSON.parse(localStudent)); } catch (e) {} }
    if (localTeacher) { try { setCustomTeacherFields(JSON.parse(localTeacher)); } catch (e) {} }
    if (localClass) { try { setCustomClassFields(JSON.parse(localClass)); } catch (e) {} }

    api.getAuditLogs().then(rows => { if (Array.isArray(rows)) setAuditLogs(rows); }).catch(() => {});
    api.getSettings().then(settings => {
      if (settings?.academyName) setAcademyName(settings.academyName);
      if (settings?.academicSession) setAcademicSession(settings.academicSession);
      if (settings?.currencySymbol) {
        setCurrencySymbol(settings.currencySymbol);
        setGlobalCurrencySymbol(settings.currencySymbol);
      }
      if (settings?.gracePeriod) setGracePeriod(String(settings.gracePeriod));
      if (settings?.principalName) setPrincipalName(settings.principalName);
      if (settings?.academyAddress) setAcademyAddress(settings.academyAddress);
      if (settings?.academyPhone) setAcademyPhone(settings.academyPhone);
      if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
      if (settings?.signatureUrl) setSignatureUrl(settings.signatureUrl);
      if (settings?.themePrimary) setThemePrimary(settings.themePrimary);
      if (settings?.themeSecondary) setThemeSecondary(settings.themeSecondary);
      applyAcademySettings(settings);
      if (settings?.academyMode) {
        setAcademyModeState(settings.academyMode as any);
        localStorage.setItem('academyMode', settings.academyMode);
      }
      if (settings?.customStudentFields) {
        try {
          const parsed = typeof settings.customStudentFields === 'string' ? JSON.parse(settings.customStudentFields) : settings.customStudentFields;
          if (Array.isArray(parsed) && parsed.length > 0) setCustomStudentFields(parsed);
        } catch (e) {}
      }
      if (settings?.customTeacherFields) {
        try {
          const parsed = typeof settings.customTeacherFields === 'string' ? JSON.parse(settings.customTeacherFields) : settings.customTeacherFields;
          if (Array.isArray(parsed) && parsed.length > 0) setCustomTeacherFields(parsed);
        } catch (e) {}
      }
      if (settings?.customClassFields) {
        try {
          const parsed = typeof settings.customClassFields === 'string' ? JSON.parse(settings.customClassFields) : settings.customClassFields;
          if (Array.isArray(parsed) && parsed.length > 0) setCustomClassFields(parsed);
        } catch (e) {}
      }

      if (settings?.idCardFields) {
        try {
          const parsed = typeof settings.idCardFields === 'string' ? JSON.parse(settings.idCardFields) : settings.idCardFields;
          if (parsed && typeof parsed === 'object') setIdCardFields(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    }).catch(() => {});
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressAndResizeImage(file, 300, 200, 0.85, true);
      setter(compressedUrl);
    } catch (err) {
      console.error('Error compressing image asset:', err);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('academyMode', academyMode);
      localStorage.setItem('customStudentFields', JSON.stringify(customStudentFields));
      localStorage.setItem('customTeacherFields', JSON.stringify(customTeacherFields));
      localStorage.setItem('customClassFields', JSON.stringify(customClassFields));
      localStorage.setItem('idCardFields', JSON.stringify(idCardFields));

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);

      applyAcademySettings({
        themePrimary,
        themeSecondary,
        currencySymbol,
        academicSession,
        academyName
      });
      setGlobalCurrencySymbol(currencySymbol);

      Promise.all([
        api.saveSetting('academyName', academyName),
        api.saveSetting('academicSession', academicSession),
        api.saveSetting('currencySymbol', currencySymbol),
        api.saveSetting('gracePeriod', gracePeriod),
        api.saveSetting('principalName', principalName),
        api.saveSetting('academyAddress', academyAddress),
        api.saveSetting('academyPhone', academyPhone),
        api.saveSetting('logoUrl', logoUrl),
        api.saveSetting('signatureUrl', signatureUrl),
        api.saveSetting('themePrimary', themePrimary),
        api.saveSetting('themeSecondary', themeSecondary),
        api.saveSetting('academyMode', academyMode),
        api.saveSetting('customStudentFields', JSON.stringify(customStudentFields)),
        api.saveSetting('customTeacherFields', JSON.stringify(customTeacherFields)),
        api.saveSetting('customClassFields', JSON.stringify(customClassFields)),
        api.saveSetting('idCardFields', JSON.stringify(idCardFields))
      ]).catch(err => console.error('API save background error:', err));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Academy System Settings</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>Configure academy branding, official logo, principal signature, session, and campus details</p>
      </div>

      {isSaved && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          ✓ Configuration & identity assets successfully saved to server!
        </div>
      )}

      {/* Master-Detail Settings Layout */}
      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Navigation Menu (Horizontal scrollable on mobile, vertical on desktop) */}
        <div className="mobile-filter-scroll-bar" style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setSubTab('branding')}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'branding' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'branding' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'branding' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'branding' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                border: subTab === 'branding' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                borderRadius: 6, 
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={15} color={subTab === 'branding' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>Branding & Mode</span>
            </div>
            <ChevronRight size={14} color={subTab === 'branding' ? '#FFFFFF' : '#94A3B8'} />
          </button>

          <button
            type="button"
            onClick={() => setSubTab('assets')}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'assets' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'assets' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'assets' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'assets' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                border: subTab === 'assets' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                borderRadius: 6, 
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon size={15} color={subTab === 'assets' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>Logo & Signature</span>
            </div>
            <ChevronRight size={14} color={subTab === 'assets' ? '#FFFFFF' : '#94A3B8'} />
          </button>

          <button
            type="button"
            onClick={() => setSubTab('idcard')}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'idcard' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'idcard' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'idcard' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'idcard' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                border: subTab === 'idcard' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                borderRadius: 6, 
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Palette size={15} color={subTab === 'idcard' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>ID Card Settings</span>
            </div>
            <ChevronRight size={14} color={subTab === 'idcard' ? '#FFFFFF' : '#94A3B8'} />
          </button>

          <button
            type="button"
            onClick={() => setSubTab('customizer')}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'customizer' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'customizer' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'customizer' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'customizer' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                border: subTab === 'customizer' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                borderRadius: 6, 
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sliders size={15} color={subTab === 'customizer' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>Form Customizer</span>
            </div>
            <ChevronRight size={14} color={subTab === 'customizer' ? '#FFFFFF' : '#94A3B8'} />
          </button>

          <button
            type="button"
            onClick={() => setSubTab('geofence')}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'geofence' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'geofence' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'geofence' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'geofence' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                border: subTab === 'geofence' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                borderRadius: 6, 
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Compass size={15} color={subTab === 'geofence' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>GPS & Geofencing</span>
            </div>
            <ChevronRight size={14} color={subTab === 'geofence' ? '#FFFFFF' : '#94A3B8'} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('audit');
              api.getAuditLogs().then(rows => { if (Array.isArray(rows)) setAuditLogs(rows); }).catch(() => {});
            }}
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: subTab === 'audit' ? 'none' : '1px solid #E2E8F0',
              background: subTab === 'audit' ? '#0F172A' : '#FFFFFF',
              color: subTab === 'audit' ? '#FFFFFF' : '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: subTab === 'audit' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                border: subTab === 'audit' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '3px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <History size={15} color={subTab === 'audit' ? '#FFFFFF' : '#475569'} />
              </div>
              <span>Activity log</span>
            </div>
            <ChevronRight size={14} color={subTab === 'audit' ? '#FFFFFF' : '#94A3B8'} />
          </button>
        </div>

        {/* Right Active Settings Configuration Panel */}
        <div className="card" style={{ padding: 20, borderRadius: 16 }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* SUB-SECTION 1: BRANDING & OPERATING MODE */}
        {subTab === 'branding' && (
          <>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Academy Name</label>
                <input className="form-input" value={academyName} onChange={e => setAcademyName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Principal / Registrar Name</label>
                <input className="form-input" value={principalName} onChange={e => setPrincipalName(e.target.value)} />
              </div>
            </div>

            {/* Operating Mode */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A' }}>
                <Sliders size={16} color="#475569" /> Academy Operating Mode
              </label>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                Choose how your academy structures student groupings across the system (Sidebar, Directory, Filters & ID Cards).
              </p>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div 
                  onClick={() => setAcademyModeState('CLASS')}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: academyMode === 'CLASS' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: academyMode === 'CLASS' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input type="radio" name="academyMode" checked={academyMode === 'CLASS'} onChange={() => setAcademyModeState('CLASS')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={15} color={academyMode === 'CLASS' ? '#2563EB' : '#475569'} />
                      <strong style={{ fontSize: 13, color: academyMode === 'CLASS' ? '#1D4ED8' : '#0F172A' }}>Regular Class System</strong>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0, paddingLeft: 22 }}>
                    Uses terminology like <b>"9th Class"</b>, <b>"10th Class"</b>, <b>"Classes & Sections"</b>. Best for regular class-based academies.
                  </p>
                </div>

                <div 
                  onClick={() => setAcademyModeState('BATCH')}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: academyMode === 'BATCH' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: academyMode === 'BATCH' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input type="radio" name="academyMode" checked={academyMode === 'BATCH'} onChange={() => setAcademyModeState('BATCH')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GraduationCap size={15} color={academyMode === 'BATCH' ? '#2563EB' : '#475569'} />
                      <strong style={{ fontSize: 13, color: academyMode === 'BATCH' ? '#1D4ED8' : '#0F172A' }}>Batch System</strong>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0, paddingLeft: 22 }}>
                    Uses terminology like <b>"Morning Batch 2026"</b>, <b>"Batch A"</b>, <b>"Batches & Shifts"</b>. Best for batch & coaching academies.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Campus Address</label>
                <input className="form-input" value={academyAddress} onChange={e => setAcademyAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Helpline / Office Phone</label>
                <input className="form-input" value={academyPhone} onChange={e => setAcademyPhone(e.target.value)} />
              </div>
            </div>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Academic Session</label>
                <input className="form-input" value={academicSession} onChange={e => setAcademicSession(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input className="form-input" value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Defaulter Grace Period (Days)</label>
              <input className="form-input" type="number" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} />
            </div>
          </>
        )}

        {/* SUB-SECTION 2: LOGO & SIGNATURE ASSETS */}
        {subTab === 'assets' && (
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Academy Logo Image</label>
              {logoUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img src={logoUrl} alt="Academy Logo" style={{ height: 48, objectFit: 'contain', background: '#FFF', padding: 4, borderRadius: 6, border: '1px solid #CBD5E1' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setLogoUrl)} style={{ fontSize: 12 }} />
              <input className="form-input" placeholder="Or paste Logo Image URL..." value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ marginTop: 6, fontSize: 12 }} />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Authorized Signature Image</label>
              {signatureUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img src={signatureUrl} alt="Principal Signature" style={{ height: 44, objectFit: 'contain', background: '#FFF', padding: 4, borderRadius: 6, border: '1px solid #CBD5E1' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setSignatureUrl)} style={{ fontSize: 12 }} />
              <input className="form-input" placeholder="Or paste Signature Image URL..." value={signatureUrl} onChange={e => setSignatureUrl(e.target.value)} style={{ marginTop: 6, fontSize: 12 }} />
            </div>
          </div>
        )}

        {/* SUB-SECTION 3: ID CARD THEME & DISPLAY FIELDS */}
        {subTab === 'idcard' && (
          <>
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A' }}>
                <Palette size={16} color="#475569" /> ID Card Theme Colors
              </label>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 14 }}>Choose your academy's brand colors. These will apply to Student ID Cards, badges, and accents.</p>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Primary Color (Accent)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <input type="color" value={themePrimary} onChange={e => { setThemePrimary(e.target.value); applyAcademySettings({ themePrimary: e.target.value, themeSecondary, currencySymbol, academicSession, academyName }); }} style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                    <input className="form-input" value={themePrimary} onChange={e => setThemePrimary(e.target.value)} style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {primaryPresets.map(c => (
                      <button key={c} type="button" onClick={() => { setThemePrimary(c); applyAcademySettings({ themePrimary: c, themeSecondary, currencySymbol, academicSession, academyName }); }} title={c}
                        style={{ width: 28, height: 28, borderRadius: 8, background: c, border: themePrimary === c ? '3px solid #0F172A' : '2px solid #CBD5E1', cursor: 'pointer', boxShadow: themePrimary === c ? '0 0 0 2px #FFF, 0 0 0 4px ' + c : 'none' }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>Secondary Color (Dark)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <input type="color" value={themeSecondary} onChange={e => { setThemeSecondary(e.target.value); applyAcademySettings({ themePrimary, themeSecondary: e.target.value, currencySymbol, academicSession, academyName }); }} style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                    <input className="form-input" value={themeSecondary} onChange={e => setThemeSecondary(e.target.value)} style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {secondaryPresets.map(c => (
                      <button key={c} type="button" onClick={() => { setThemeSecondary(c); applyAcademySettings({ themePrimary, themeSecondary: c, currencySymbol, academicSession, academyName }); }} title={c}
                        style={{ width: 28, height: 28, borderRadius: 8, background: c, border: themeSecondary === c ? '3px solid #FFF' : '2px solid #475569', cursor: 'pointer', boxShadow: themeSecondary === c ? '0 0 0 2px #FFF, 0 0 0 4px ' + c : 'none' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 120, height: 75, borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: '1px solid #CBD5E1', position: 'relative' }}>
                  <div style={{ height: 30, background: themePrimary, position: 'relative' }}>
                    <svg viewBox="0 0 120 30" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 14 }}>
                      <path d="M0,5 C40,20 80,0 120,12 L120,30 L0,30 Z" fill={themeSecondary} />
                      <path d="M0,14 C50,25 90,5 120,20 L120,30 L0,30 Z" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: themeSecondary, border: `2px solid ${themePrimary}`, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 6, fontWeight: 800, color: themeSecondary }}>STUDENT NAME</div>
                      <div style={{ fontSize: 5, color: themePrimary, fontWeight: 700 }}>OFFICIAL STUDENT</div>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#64748B' }}>Live preview of your ID Card theme colors</span>
              </div>
            </div>

            {/* ID Card Display Fields Configurator */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A' }}>
                <CreditCard size={16} color="#475569" /> Printed ID Card Display Fields
              </label>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                Choose which form fields and attributes appear on single & bulk printed Student ID Cards.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', background: '#FFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <input type="checkbox" checked={idCardFields.showRegNo} onChange={e => setIdCardFields(prev => ({ ...prev, showRegNo: e.target.checked }))} />
                  <strong>Registration / Admission No</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', background: '#FFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <input type="checkbox" checked={idCardFields.showClassBatch} onChange={e => setIdCardFields(prev => ({ ...prev, showClassBatch: e.target.checked }))} />
                  <strong>Class / Batch Name</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', background: '#FFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <input type="checkbox" checked={idCardFields.showPhone} onChange={e => setIdCardFields(prev => ({ ...prev, showPhone: e.target.checked }))} />
                  <strong>Parent Phone Number</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', background: '#FFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <input type="checkbox" checked={idCardFields.showCustomFields} onChange={e => setIdCardFields(prev => ({ ...prev, showCustomFields: e.target.checked }))} />
                  <strong>Dynamic Custom Fields</strong>
                </label>
              </div>
            </div>
          </>
        )}
                {/* SUB-SECTION 4: FORM CUSTOMIZER */}
        {subTab === 'customizer' && (
          <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
            {/* Horizontal Sub-Navigation Bar matching left sidebar button UI */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <button
                type="button"
                onClick={() => setCustomizerTab('student')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: customizerTab === 'student' ? 'none' : '1px solid #CBD5E1',
                  background: customizerTab === 'student' ? '#0F172A' : '#FFFFFF',
                  color: customizerTab === 'student' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: customizerTab === 'student' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ 
                  border: customizerTab === 'student' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                  borderRadius: 6, 
                  padding: '3px 5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GraduationCap size={14} color={customizerTab === 'student' ? '#FFFFFF' : '#475569'} />
                </div>
                <span>Student Form Customizer</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerTab('teacher')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: customizerTab === 'teacher' ? 'none' : '1px solid #CBD5E1',
                  background: customizerTab === 'teacher' ? '#0F172A' : '#FFFFFF',
                  color: customizerTab === 'teacher' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: customizerTab === 'teacher' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ 
                  border: customizerTab === 'teacher' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                  borderRadius: 6, 
                  padding: '3px 5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserSquare2 size={14} color={customizerTab === 'teacher' ? '#FFFFFF' : '#475569'} />
                </div>
                <span>Teacher Form Customizer</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizerTab('class')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: customizerTab === 'class' ? 'none' : '1px solid #CBD5E1',
                  background: customizerTab === 'class' ? '#0F172A' : '#FFFFFF',
                  color: customizerTab === 'class' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: customizerTab === 'class' ? '0 4px 12px -2px rgba(15,23,42,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ 
                  border: customizerTab === 'class' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #CBD5E1', 
                  borderRadius: 6, 
                  padding: '3px 5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={14} color={customizerTab === 'class' ? '#FFFFFF' : '#475569'} />
                </div>
                <span>Class Form Customizer</span>
              </button>
            </div>

            {/* TAB 1: STUDENT FORM CUSTOMIZER */}
            {customizerTab === 'student' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GraduationCap size={16} color="#475569" />
                    <span style={{ color: '#0F172A', fontSize: 12, fontWeight: 700 }}>
                      Student Admission Profile
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>Student Form Customizer</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  Add custom data fields (e.g. Blood Group, Emergency Contact, Father's Occupation) to your student registration form.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      className="form-input" 
                      placeholder="Custom Field Name (e.g. Emergency Contact)" 
                      value={newFieldLabel} 
                      onChange={e => setNewFieldLabel(e.target.value)} 
                      style={{ flex: 1 }} 
                    />
                    <div style={{ width: 140 }}>
                      <ModernSelect 
                        value={newFieldType} 
                        onChange={val => setNewFieldType(val as any)} 
                        options={[
                          { value: 'text', label: 'Text Input' },
                          { value: 'select', label: 'Dropdown' },
                          { value: 'date', label: 'Date' },
                          { value: 'time', label: 'Time' }
                        ]}
                        zIndex={100}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={() => {
                        if (!newFieldLabel.trim()) return;
                        const opts = newFieldType === 'select' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined;
                        
                        if (editingStudentFieldId) {
                          setCustomStudentFields(prev => prev.map(f => f.id === editingStudentFieldId ? { ...f, label: newFieldLabel.trim(), type: newFieldType, options: opts && opts.length > 0 ? opts : f.options } : f));
                          setEditingStudentFieldId(null);
                        } else {
                          const fieldId = newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCustomStudentFields(prev => [...prev, { id: fieldId, label: newFieldLabel.trim(), type: newFieldType, options: opts && opts.length > 0 ? opts : ['Option 1', 'Option 2'] }]);
                        }
                        setNewFieldLabel('');
                        setNewFieldOptions('');
                      }}
                      style={{ padding: '8px 18px', fontSize: 13, background: editingStudentFieldId ? '#059669' : '#2563EB', color: '#FFF', fontWeight: 700 }}
                    >
                      {editingStudentFieldId ? '✓ Update Field' : '+ Add Field'}
                    </button>
                  </div>

                  {newFieldType === 'select' && (
                    <input 
                      className="form-input" 
                      placeholder="Dropdown Options (comma separated: e.g. Option 1, Option 2, Option 3)" 
                      value={newFieldOptions} 
                      onChange={e => setNewFieldOptions(e.target.value)} 
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {customStudentFields.map(field => (
                    <div 
                      key={field.id} 
                      style={{ 
                        background: '#FFFFFF', 
                        padding: '10px 14px', 
                        borderRadius: 12, 
                        border: editingStudentFieldId === field.id ? '2px solid #2563EB' : '1px solid #CBD5E1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        fontSize: 13, 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{field.label}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>
                          {field.type} {field.options ? `: [${field.options.join(', ')}]` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingStudentFieldId(field.id);
                            setNewFieldLabel(field.label);
                            setNewFieldType(field.type);
                            setNewFieldOptions(field.options ? field.options.join(', ') : '');
                          }}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomStudentFields(prev => prev.filter(f => f.id !== field.id))}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: TEACHER FORM CUSTOMIZER */}
            {customizerTab === 'teacher' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserSquare2 size={16} color="#475569" />
                    <span style={{ color: '#0F172A', fontSize: 12, fontWeight: 700 }}>
                      Teacher & Faculty Profile
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>Teacher Form Customizer</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  Add custom data fields (e.g. Qualification, Experience, Department) to your teacher registration form.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      className="form-input" 
                      placeholder="Custom Field Name (e.g. Qualification)" 
                      value={newTeacherFieldLabel} 
                      onChange={e => setNewTeacherFieldLabel(e.target.value)} 
                      style={{ flex: 1 }} 
                    />
                    <div style={{ width: 140 }}>
                      <ModernSelect 
                        value={newTeacherFieldType} 
                        onChange={val => setNewTeacherFieldType(val as any)} 
                        options={[
                          { value: 'text', label: 'Text Input' },
                          { value: 'select', label: 'Dropdown' },
                          { value: 'date', label: 'Date' },
                          { value: 'time', label: 'Time' }
                        ]}
                        zIndex={100}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={() => {
                        if (!newTeacherFieldLabel.trim()) return;
                        const opts = newTeacherFieldType === 'select' ? newTeacherFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined;
                        
                        if (editingTeacherFieldId) {
                          setCustomTeacherFields(prev => prev.map(f => f.id === editingTeacherFieldId ? { ...f, label: newTeacherFieldLabel.trim(), type: newTeacherFieldType, options: opts && opts.length > 0 ? opts : f.options } : f));
                          setEditingTeacherFieldId(null);
                        } else {
                          const fieldId = newTeacherFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCustomTeacherFields(prev => [...prev, { id: fieldId, label: newTeacherFieldLabel.trim(), type: newTeacherFieldType, options: opts && opts.length > 0 ? opts : ['Option 1', 'Option 2'] }]);
                        }
                        setNewTeacherFieldLabel('');
                        setNewTeacherFieldOptions('');
                      }}
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      {editingTeacherFieldId ? '✓ Update Field' : '+ Add Field'}
                    </button>
                  </div>

                  {newTeacherFieldType === 'select' && (
                    <input 
                      className="form-input" 
                      placeholder="Dropdown Options (comma separated: e.g. Option 1, Option 2, Option 3)" 
                      value={newTeacherFieldOptions} 
                      onChange={e => setNewTeacherFieldOptions(e.target.value)} 
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {customTeacherFields.map(field => (
                    <div 
                      key={field.id} 
                      style={{ 
                        background: '#FFFFFF', 
                        padding: '10px 14px', 
                        borderRadius: 12, 
                        border: editingTeacherFieldId === field.id ? '2px solid #0F172A' : '1px solid #CBD5E1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        fontSize: 13, 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{field.label}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>
                          {field.type} {field.options ? `: [${field.options.join(', ')}]` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingTeacherFieldId(field.id);
                            setNewTeacherFieldLabel(field.label);
                            setNewTeacherFieldType(field.type);
                            setNewTeacherFieldOptions(field.options ? field.options.join(', ') : '');
                          }}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Pencil size={11} /> Edit
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setCustomTeacherFields(prev => prev.filter(f => f.id !== field.id))}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CLASS FORM CUSTOMIZER */}
            {customizerTab === 'class' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={16} color="#475569" />
                    <span style={{ color: '#0F172A', fontSize: 12, fontWeight: 700 }}>
                      Academic Unit Config
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>Class Form Customizer</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  Add custom data fields (e.g. Academic Section / Level, Room, Timing, Instructor) to your class creation form.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      className="form-input" 
                      placeholder="Custom Field Name (e.g. Class Section / Level)" 
                      value={newClassFieldLabel} 
                      onChange={e => setNewClassFieldLabel(e.target.value)} 
                      style={{ flex: 1 }} 
                    />
                    <div style={{ width: 140 }}>
                      <ModernSelect 
                        value={newClassFieldType} 
                        onChange={val => setNewClassFieldType(val as any)} 
                        options={[
                          { value: 'text', label: 'Text Input' },
                          { value: 'select', label: 'Dropdown' },
                          { value: 'date', label: 'Date' },
                          { value: 'time', label: 'Time' }
                        ]}
                        zIndex={100}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={() => {
                        if (!newClassFieldLabel.trim()) return;
                        const opts = newClassFieldType === 'select' ? newClassFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined;
                        
                        if (editingClassFieldId) {
                          setCustomClassFields(prev => prev.map(f => f.id === editingClassFieldId ? { ...f, label: newClassFieldLabel.trim(), type: newClassFieldType, options: opts && opts.length > 0 ? opts : f.options } : f));
                          setEditingClassFieldId(null);
                        } else {
                          const fieldId = newClassFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
                          setCustomClassFields(prev => [...prev, { id: fieldId, label: newClassFieldLabel.trim(), type: newClassFieldType, options: opts && opts.length > 0 ? opts : ['Option 1', 'Option 2'] }]);
                        }
                        setNewClassFieldLabel('');
                        setNewClassFieldOptions('');
                      }}
                      style={{ padding: '8px 18px', fontSize: 13, background: editingClassFieldId ? '#059669' : '#059669', color: '#FFF', fontWeight: 700 }}
                    >
                      {editingClassFieldId ? '✓ Update Field' : '+ Add Field'}
                    </button>
                  </div>

                  {newClassFieldType === 'select' && (
                    <input 
                      className="form-input" 
                      placeholder="Dropdown Options (comma separated: e.g. Primary, Secondary, Montessori, Higher Secondary)" 
                      value={newClassFieldOptions} 
                      onChange={e => setNewClassFieldOptions(e.target.value)} 
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {customClassFields.map(field => (
                    <div 
                      key={field.id} 
                      style={{ 
                        background: '#FFFFFF', 
                        padding: '10px 14px', 
                        borderRadius: 12, 
                        border: editingClassFieldId === field.id ? '2px solid #059669' : '1px solid #CBD5E1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12, 
                        fontSize: 13, 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{field.label}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>
                          {field.type} {field.options ? `: [${field.options.join(', ')}]` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingClassFieldId(field.id);
                            setNewClassFieldLabel(field.label);
                            setNewClassFieldType(field.type);
                            setNewClassFieldOptions(field.options ? field.options.join(', ') : '');
                          }}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCustomClassFields(prev => prev.filter(f => f.id !== field.id))}
                          style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-SECTION 5: CAMPUS GPS & GEOFENCING */}
        {subTab === 'geofence' && (
          <CampusGeofenceSettings />
        )}

        {subTab === 'audit' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Activity log</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Last 100 staff actions. This is the real audit trail, not a demo feed.</p>
            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94A3B8' }}>No audit rows yet.</td></tr>
                  ) : auditLogs.map((row: any) => (
                    <tr key={row.id}>
                      <td>{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</td>
                      <td>{row.user?.full_name || row.user_id}</td>
                      <td><strong>{row.action}</strong></td>
                      <td>{row.entity}{row.entity_id ? ` · ${String(row.entity_id).slice(0, 8)}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab !== 'geofence' && subTab !== 'audit' && (
          <button 
            type="button"
            className="btn-primary" 
            onClick={e => handleSaveSettings(e)} 
            style={{ alignSelf: 'flex-start', marginTop: 10, padding: '12px 24px', fontSize: 14, background: '#0F172A', color: '#FFF' }}
          >
            ✓ Save Configuration & Branding Assets
          </button>
        )}
      </div>
    </div>
  </div>
</div>
  );
};
