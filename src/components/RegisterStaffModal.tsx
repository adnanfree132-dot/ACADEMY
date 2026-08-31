import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Check,
  User,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Calendar,
  DollarSign,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { StaffCredentialData } from './StaffCredentialSlipModal';
import { api } from '../api/apiClient';

interface RegisterStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffTypes: Array<{ id: string; name: string; code: string }>;
  onSuccess: (newStaff: any, credentials: StaffCredentialData) => void;
}

export const RegisterStaffModal: React.FC<RegisterStaffModalProps> = ({
  isOpen,
  onClose,
  staffTypes,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [staffTypeId, setStaffTypeId] = useState(staffTypes[0]?.id || '');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseSalary, setBaseSalary] = useState('');
  const [salaryType, setSalaryType] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const defaultTypeId = staffTypeId || staffTypes[0]?.id || '';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('Please enter the employee Full Name and Phone Number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const selectedType = staffTypes.find(t => t.id === defaultTypeId) || staffTypes[0];
    const generatedPrefix = selectedType?.code || 'FAC';
    const tempStaffId = `${generatedPrefix}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const tempPassword = `Acad#${Math.floor(1000 + Math.random() * 9000)}`;
    const finalDesignation = designation.trim() || `${selectedType?.name || 'Faculty'} Lecturer`;

    const optimisticStaff = {
      id: `temp_${Date.now()}`,
      staffId: tempStaffId,
      fullName: fullName.trim(),
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@academy.com`,
      gender,
      staffTypeId: defaultTypeId || selectedType?.id || 'st_faculty',
      staffType: selectedType,
      role: selectedType?.name || 'Faculty',
      designation: finalDesignation,
      qualification: qualification.trim() || 'Master of Science',
      joiningDate,
      status: 'active',
      baseSalary: Number(baseSalary) || 65000,
      salaryType,
      paymentMethod,
      emergencyName: emergencyName.trim(),
      emergencyPhone: emergencyPhone.trim(),
      emergencyRelation: emergencyRelation.trim()
    };

    const credentialsData: StaffCredentialData = {
      staffId: tempStaffId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@academy.com`,
      role: selectedType?.name || 'Faculty',
      designation: finalDesignation,
      temporaryPassword: tempPassword,
      issuedAt: new Date().toISOString()
    };

    // Direct API registration call
    try {
      const response = await api.registerStaff({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        staffTypeId: defaultTypeId || selectedType?.id || 'st_faculty',
        designation: finalDesignation,
        qualification: qualification.trim() || undefined,
        joiningDate,
        baseSalary: Number(baseSalary) || 0,
        salaryType,
        paymentMethod,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        emergencyRelation: emergencyRelation.trim() || undefined
      });

      const resData = response as any;
      const createdStaff = resData?.staff ? resData.staff : {
        ...optimisticStaff,
        id: resData?.id || optimisticStaff.id,
        staffId: resData?.staffId || resData?.staff_id || tempStaffId
      };

      const finalCredentials: StaffCredentialData = resData?.credentials ? {
        staffId: resData.credentials.staffId || createdStaff.staffId || tempStaffId,
        fullName: createdStaff.fullName,
        phone: createdStaff.phone,
        email: createdStaff.email,
        role: createdStaff.role || selectedType?.name || 'Faculty',
        designation: createdStaff.designation,
        temporaryPassword: resData.credentials.temporaryPassword || tempPassword,
        issuedAt: resData.credentials.issuedAt || new Date().toISOString()
      } : credentialsData;

      onSuccess(createdStaff, finalCredentials);
      onClose();
    } catch (err: any) {
      console.error('Staff registration error:', err);
      setErrorMsg(err?.message || 'Failed to register staff member. Please verify phone number and email uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="floating-island-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="floating-island-container"
        style={{
          width: '100%',
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Island 1: Dark Navy Header Card */}
        <div
          style={{
            background: '#0F172A',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Register Staff Member
              </h3>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, marginTop: 2 }}>
                Onboard faculty, admin, or support staff & issue login credentials
              </p>
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
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: White Scrollable Form Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
            maxHeight: '74vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Profile */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} /> 1. Employee Profile Information
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Salman Tariq"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Staff Type *</label>
                <ModernSelect
                  value={defaultTypeId}
                  onChange={setStaffTypeId}
                  compact={true}
                  options={staffTypes.map(t => ({ value: t.id, label: `${t.name} (${t.code})` }))}
                  zIndex={1200}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>WhatsApp / Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. salman.tariq@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Gender</label>
                <ModernSelect
                  value={gender}
                  onChange={setGender}
                  compact={true}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  zIndex={1150}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Joining Date</label>
                <ModernDatePicker
                  value={joiningDate}
                  onChange={setJoiningDate}
                  compact={true}
                  zIndex={1100}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Designation & Academic Qualification */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={13} /> 2. Designation & Position
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Designation / Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Chemistry Lecturer"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Qualification / Degree</label>
                <input
                  type="text"
                  placeholder="e.g. M.Phil in Organic Chemistry"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Salary & Compensation (Optional) */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={13} /> 3. Compensation & Payment Method
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Base Salary (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 65000"
                  value={baseSalary}
                  onChange={e => setBaseSalary(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Payment Mode</label>
                <ModernSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  compact={true}
                  options={[
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'cash', label: 'Cash Disbursement' },
                    { value: 'cheque', label: 'Cheque' }
                  ]}
                  zIndex={1050}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contact */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HeartHandshake size={13} /> 4. Emergency Contact
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Ahmed"
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Emergency Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 9876543"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Brother, Spouse"
                  value={emergencyRelation}
                  onChange={e => setEmergencyRelation(e.target.value)}
                  style={{ height: 38, fontSize: 13, borderRadius: 10, border: '1px solid #CBD5E1', padding: '0 12px', background: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Island 3: Floating Action Pill Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 9999,
              height: 42,
              padding: '0 20px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              borderRadius: 9999,
              height: 42,
              padding: '0 24px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
            }}
          >
            <Check size={16} /> Complete Registration & Issue Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
export default RegisterStaffModal;
