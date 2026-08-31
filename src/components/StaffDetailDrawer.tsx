import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  KeyRound,
  Printer,
  MessageSquare,
  Building,
  Clock,
  CheckCircle,
  Plus,
  ChevronRight,
  HeartHandshake,
  Info,
  Settings,
  Trash2,
  CreditCard
} from 'lucide-react';
import { api } from '../api/apiClient';
import { StaffSalaryStructureModal } from './StaffSalaryStructureModal';

interface StaffDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any | null;
  onOpenPermissions?: (staff: any) => void;
  onOpenCredentials?: (staff: any) => void;
  onResetPassword?: (staff: any) => void;
  onEditStaff?: (staff: any) => void;
  onOpenStatusModal?: (staff: any) => void;
  onDeleteStaff?: (staff: any) => void;
}

export const StaffDetailDrawer: React.FC<StaffDetailDrawerProps> = ({
  isOpen,
  onClose,
  staff,
  onOpenPermissions,
  onOpenCredentials,
  onResetPassword,
  onEditStaff,
  onOpenStatusModal,
  onDeleteStaff
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'salary' | 'documents' | 'leaves'>('overview');
  const [currentStaff, setCurrentStaff] = useState<any>(staff);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('cnic');
  const [docUrl, setDocUrl] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

  // Sync currentStaff when staff prop changes
  useEffect(() => {
    setCurrentStaff(staff);
  }, [staff]);

  // Always reset to 'overview' tab whenever the drawer opens or when staff member changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, staff?.id]);

  if (!isOpen || !currentStaff) return null;

  const staffName = currentStaff.fullName || currentStaff.name || 'Staff Member';
  const roleName = currentStaff.staffType?.name || currentStaff.role || 'Staff';

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docUrl.trim()) return;

    const newDoc = {
      id: `doc_${Date.now()}`,
      title: docTitle.trim(),
      document_type: docType,
      file_url: docUrl.trim(),
      uploaded_at: new Date().toISOString()
    };

    setDocs(prev => [...prev, newDoc]);
    setDocTitle('');
    setDocUrl('');

    try {
      await api.uploadStaffDocument(staff.id, {
        title: newDoc.title,
        document_type: newDoc.document_type,
        file_url: newDoc.file_url
      });
    } catch (err) {
      console.error('Failed to upload staff document:', err);
    }
  };

  const handleWhatsAppChat = () => {
    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 1300,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#FFFFFF',
          height: '100%',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Dark Navy Drawer Header */}
        <div
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 18
              }}
            >
              {staffName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{staffName}</h2>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#93C5FD',
                    fontFamily: 'monospace'
                  }}
                >
                  {staff.staffId || 'STF-001'}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 2 }}>
                {staff.designation || 'Staff Member'} &bull; {roleName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleWhatsAppChat}
              style={{
                borderRadius: 8,
                border: '1px solid #BBF7D0',
                background: '#F0FDF4',
                color: '#15803D',
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={13} color="#16A34A" /> WhatsApp
            </button>

            <button
              type="button"
              onClick={() => onOpenCredentials && onOpenCredentials(staff)}
              style={{
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <KeyRound size={13} color="#2563EB" /> Slip
            </button>

            <button
              type="button"
              onClick={() => onOpenPermissions && onOpenPermissions(staff)}
              style={{
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={13} color="#059669" /> RBAC
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
            <button
              type="button"
              onClick={() => onResetPassword && onResetPassword(staff)}
              style={{
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Generate new temporary password and open credential slip"
            >
              <KeyRound size={13} color="#2563EB" /> Reset Password
            </button>

            {/* Info Trigger Button */}
            <button
              type="button"
              onClick={() => setShowResetInfo(!showResetInfo)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '1px solid #CBD5E1',
                background: showResetInfo ? '#0F172A' : '#F1F5F9',
                color: showResetInfo ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease'
              }}
              title="What is Reset Password?"
            >
              <Info size={11} />
            </button>

            {/* Info Popover Card */}
            {showResetInfo && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 260,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
                  padding: 12,
                  zIndex: 1350,
                  animation: 'scaleUp 0.15s ease',
                  fontSize: 11.5,
                  color: '#334155',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <KeyRound size={12} color="#2563EB" /> Reset Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowResetInfo(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
                <p style={{ margin: 0, color: '#64748B' }}>
                  Generates a secure temporary password and produces an official printable <strong>Credential Slip</strong> for the staff member to sign in to their portal account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selector Bar (5-Column Grid with zero horizontal scrolling) */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', padding: '6px 10px', gap: 4, overflow: 'hidden' }}>
          {(['overview', 'schedule', 'salary', 'documents', 'leaves'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 4px',
                border: 'none',
                background: activeTab === tab ? '#0F172A' : 'transparent',
                borderRadius: 8,
                color: activeTab === tab ? '#FFFFFF' : '#64748B',
                fontWeight: 500,
                fontSize: 11.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              {tab === 'overview' && <><FileText size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Overview</span></>}
              {tab === 'schedule' && <><Calendar size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Schedule</span></>}
              {tab === 'salary' && <><CreditCard size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Payroll</span></>}
              {tab === 'documents' && <><FileText size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Documents{docs.length > 0 ? ` (${docs.length})` : ''}</span></>}
              {tab === 'leaves' && <><Clock size={12} color={activeTab === tab ? '#FFFFFF' : '#64748B'} /> <span>Leaves</span></>}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: 8 }}>
                  Contact & Identity Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Phone / WhatsApp</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Email Address</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.email || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Gender</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.gender || 'Male'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Joining Date</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.joiningDate || 'Aug 2026'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Academic Qualification</span>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{staff.qualification || 'M.Sc Physics'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Current Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span 
                        className={
                          (staff.status === 'terminated' || staff.status === 'suspended')
                            ? 'badge badge-red'
                            : (staff.status === 'inactive' || staff.status === 'resigned')
                            ? 'badge badge-slate'
                            : staff.status === 'on_leave'
                            ? 'badge badge-amber'
                            : 'badge badge-emerald'
                        } 
                        style={{ fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}
                      >
                        {staff.status || 'Active'}
                      </span>
                      {onOpenStatusModal && (
                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(staff)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontSize: 10.5,
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Change Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {(staff.statusRemarks || staff.status_remarks) && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#475569' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Status Remarks:</span> {staff.statusRemarks || staff.status_remarks}
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <HeartHandshake size={13} /> Emergency Contact
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Name</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.emergencyName || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Phone</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.emergencyPhone || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Relationship</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{staff.emergencyRelation || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Delete Staff Member */}
              {onDeleteStaff && (
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 12,
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10
                  }}
                >
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    Archive or permanently delete this staff member
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteStaff(staff)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FEE2E2';
                      e.currentTarget.style.borderColor = '#FCA5A5';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.borderColor = '#FECACA';
                    }}
                  >
                    <Trash2 size={13} color="#DC2626" /> Delete Staff Member
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Assigned Academic Batches</div>
              {staff.assignedBatches && staff.assignedBatches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {staff.assignedBatches.map((b: string) => (
                    <div key={b} style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{b}</span>
                      <span className="badge badge-blue" style={{ fontSize: 10.5 }}>Active Batch</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12.5 }}>
                  No academic batches assigned yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'salary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Compensation Terms</span>
                  <button
                    type="button"
                    onClick={() => setIsStructureModalOpen(true)}
                    style={{
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={12} /> Configure Structure
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Base Pay (Monthly)</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                      PKR {Number(currentStaff.baseSalary || currentStaff.base_salary || 65000).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11 }}>Payment Mode</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{currentStaff.paymentMethod || currentStaff.payment_method || 'Bank Transfer'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Staff Document Vault</div>
              {/* Add Document Box */}
              <form onSubmit={handleAddDocument} style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Document Title (e.g. CNIC Card)"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    style={{ height: 36, fontSize: 12.5, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                  />
                  <input
                    type="text"
                    placeholder="File URL / Cloud Link"
                    value={docUrl}
                    onChange={e => setDocUrl(e.target.value)}
                    style={{ height: 36, fontSize: 12.5, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    alignSelf: 'flex-end',
                    borderRadius: 10,
                    height: 34,
                    padding: '0 16px',
                    background: '#0F172A',
                    color: '#FFF',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <Plus size={13} /> Add Document
                </button>
              </form>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12.5 }}>
              No leave records found for current term.
            </div>
          )}
        </div>

        {isStructureModalOpen && (
          <StaffSalaryStructureModal
            isOpen={isStructureModalOpen}
            onClose={() => setIsStructureModalOpen(false)}
            staffMember={currentStaff}
            onSaved={(savedStructure: any) => {
              setIsStructureModalOpen(false);
              const updated = {
                ...currentStaff,
                baseSalary: savedStructure.base_salary ?? savedStructure.baseSalary ?? currentStaff.baseSalary,
                base_salary: savedStructure.base_salary ?? savedStructure.baseSalary ?? currentStaff.baseSalary,
                paymentMethod: savedStructure.payment_method ?? savedStructure.paymentMethod ?? currentStaff.paymentMethod,
                payment_method: savedStructure.payment_method ?? savedStructure.paymentMethod ?? currentStaff.paymentMethod,
                salaryType: savedStructure.salary_type ?? savedStructure.salaryType ?? currentStaff.salaryType,
                salary_type: savedStructure.salary_type ?? savedStructure.salaryType ?? currentStaff.salaryType,
                salaryStructure: savedStructure
              };
              setCurrentStaff(updated);
              if (onEditStaff) {
                onEditStaff(updated);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
export default StaffDetailDrawer;
