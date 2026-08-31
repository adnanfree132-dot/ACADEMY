import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Sparkles,
  Award,
  Clock,
  Layers,
  GraduationCap,
  Camera,
  CheckCircle2,
  Percent,
  Calculator,
  CalendarDays,
  CreditCard,
  Banknote,
  Receipt,
  Check,
  AlertCircle,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import { Student, Batch, ScholarshipType, ScholarshipReason } from '../types';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';
import { ModernDayOfMonthPicker } from './ModernDayOfMonthPicker';
import { CredentialSlipModal, CredentialData } from './CredentialSlipModal';
import { resizeImage } from '../utils/imageResizer';
import { api } from '../api/apiClient';
import {
  calculateLiveFeeBreakdown,
  getMidMonthProRataSuggestion,
  formatCurrency,
  formatDateIso
} from '../utils/feeCalculator';

export interface CustomFieldDef {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'time';
  options?: string[];
  required?: boolean;
}

export interface AddonFeeItem {
  id: string;
  type: string;
  amount: string;
}

export const STANDARD_FEE_TYPES = [
  'Admission Fee',
  'Registration Fee',
  'Books & Materials',
  'ID Card & Form Fee',
  'Lab & Computer Charges',
  'Examination Fee',
  'Security Deposit (Refundable)',
  'Uniform Charges',
  'Misc Fee'
];

export interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: any) => void;
  batches: Batch[];
  students?: Student[];
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  batches
}) => {
  // Student Profile
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Batch & Academic Selection
  const [batchSelect, setBatchSelect] = useState(batches[0]?.name || 'Grade 10 - Sec A');
  
  // Find selected batch object to autofill details
  const selectedBatchObj = useMemo(() => {
    return batches.find(b => b.name === batchSelect) || batches[0] || null;
  }, [batches, batchSelect]);

  // Billing Model Choice: 'monthly' (Regular Monthly Tuition) vs 'batch_package' (Fixed Course/Batch Fee)
  const [billingMode, setBillingMode] = useState<'monthly' | 'batch_package'>('monthly');

  // Admission Date
  const [admissionDate, setAdmissionDate] = useState(() => formatDateIso(new Date()));

  // Monthly Recurring Model State
  const [baseMonthlyFee, setBaseMonthlyFee] = useState('5000');
  const [customAnchorDay, setCustomAnchorDay] = useState<string>('');
  const [showBillingDateInfo, setShowBillingDateInfo] = useState(false);
  const [initialFeeOverride, setInitialFeeOverride] = useState<string>('');

  // Fixed Batch / Course Package Model State
  const [totalCourseFee, setTotalCourseFee] = useState<string>('25000');
  const [installmentCount, setInstallmentCount] = useState<string>('3');

  // Dynamic One-Time Add-on Fee Items (Admission, Registration, Books, ID Card, etc.)
  const [addonFeeItems, setAddonFeeItems] = useState<AddonFeeItem[]>([
    { id: 'fee-1', type: 'Admission Fee', amount: '0' }
  ]);

  const handleAddFeeItem = () => {
    const nextType = STANDARD_FEE_TYPES.find(t => !addonFeeItems.some(item => item.type === t)) || 'Misc Fee';
    setAddonFeeItems(prev => [
      ...prev,
      { id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, type: nextType, amount: '0' }
    ]);
  };

  const handleRemoveFeeItem = (id: string) => {
    setAddonFeeItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateFeeItem = (id: string, field: 'type' | 'amount', value: string) => {
    setAddonFeeItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Ad-hoc / One-Time Discount & Remarks (Used in Partial Payment)
  const [adhocDiscount, setAdhocDiscount] = useState<string>('0');
  const [discountRemarks, setDiscountRemarks] = useState<string>('');

  // Payment Collection at Counter (Now vs Later)
  const [paymentOption, setPaymentOption] = useState<'unpaid' | 'paid_full' | 'partial'>('unpaid');
  const [amountPaidNow, setAmountPaidNow] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

  // Scholarship & Concession (Shared)
  const [scholarshipType, setScholarshipType] = useState<ScholarshipType>('none');
  const [scholarshipValue, setScholarshipValue] = useState('20');
  const [scholarshipReason, setScholarshipReason] = useState<ScholarshipReason>('merit');

  // Dynamic Custom Fields State
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [credentialSlipData, setCredentialSlipData] = useState<CredentialData | null>(null);

  // Sync default fee from selected batch
  useEffect(() => {
    if (selectedBatchObj) {
      if (selectedBatchObj.fee || selectedBatchObj.monthlyFee || selectedBatchObj.baseMonthlyFee) {
        const f = selectedBatchObj.fee || selectedBatchObj.monthlyFee || selectedBatchObj.baseMonthlyFee;
        setBaseMonthlyFee(String(f));
      }
      if (selectedBatchObj.totalFee || selectedBatchObj.total_fee) {
        setTotalCourseFee(String(selectedBatchObj.totalFee || selectedBatchObj.total_fee));
      }
    }
  }, [selectedBatchObj]);

  useEffect(() => {
    if (isOpen) {
      const localDefs = localStorage.getItem('customStudentFields');
      if (localDefs) {
        try {
          const parsed = JSON.parse(localDefs);
          if (Array.isArray(parsed) && parsed.length > 0) setCustomFieldDefs(parsed);
        } catch (e) {}
      }

      api.getSettings().then(settings => {
        if (settings?.customStudentFields) {
          try {
            const defs = typeof settings.customStudentFields === 'string'
              ? JSON.parse(settings.customStudentFields)
              : settings.customStudentFields;
            if (Array.isArray(defs) && defs.length > 0) {
              setCustomFieldDefs(defs);
            }
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Derived effective anchor day for Monthly Model
  const effectiveAnchorDay = useMemo(() => {
    if (customAnchorDay && Number(customAnchorDay) >= 1 && Number(customAnchorDay) <= 31) {
      return Number(customAnchorDay);
    }
    const day = parseInt(admissionDate.split('-')[2], 10);
    return isNaN(day) ? 1 : day;
  }, [customAnchorDay, admissionDate]);

  // Monthly Live Calculation
  const monthlyFeeBreakdown = useMemo(() => {
    const gross = Number(baseMonthlyFee) || 0;
    const sVal = scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0;
    return calculateLiveFeeBreakdown(gross, scholarshipType, sVal);
  }, [baseMonthlyFee, scholarshipType, scholarshipValue]);

  // Monthly Mid-Month Pro-Rata Suggestions
  const proRataSuggestion = useMemo(() => {
    const net = monthlyFeeBreakdown.netMonthlyFee;
    return getMidMonthProRataSuggestion(net, admissionDate);
  }, [monthlyFeeBreakdown.netMonthlyFee, admissionDate]);

  // Fixed Batch / Package Live Calculation
  const packageFeeBreakdown = useMemo(() => {
    const grossTotal = Number(totalCourseFee) || 0;
    const sVal = scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0;
    let discount = 0;
    if (scholarshipType === 'percentage') {
      discount = Math.round((grossTotal * Math.min(100, sVal)) / 100);
    } else if (scholarshipType === 'fixed') {
      discount = Math.min(grossTotal, sVal);
    }
    const netTotal = Math.max(0, grossTotal - discount);
    const numInstallments = Math.max(1, Number(installmentCount) || 1);
    const basePerInstallment = Math.floor(netTotal / numInstallments);
    const remainder = netTotal - (basePerInstallment * numInstallments);

    // Build installment milestones preview
    const installments = [];
    const [y, m, d] = admissionDate.split('-').map(Number);
    for (let i = 0; i < numInstallments; i++) {
      const dt = new Date(y, m - 1 + i, d);
      const isLast = i === numInstallments - 1;
      const amount = isLast ? (basePerInstallment + remainder) : basePerInstallment;
      installments.push({
        number: i + 1,
        dueDate: formatDateIso(dt),
        amount
      });
    }

    return {
      grossTotal,
      discount,
      netTotal,
      numInstallments,
      installments,
      firstInstallmentAmount: installments[0]?.amount || 0
    };
  }, [totalCourseFee, scholarshipType, scholarshipValue, installmentCount, admissionDate]);

  // Initial Tuition Component Payable Now
  const effectiveInitialTuition = useMemo(() => {
    if (billingMode === 'monthly') {
      if (initialFeeOverride !== '' && !isNaN(Number(initialFeeOverride))) {
        return Math.round(Number(initialFeeOverride));
      }
      return Math.round(monthlyFeeBreakdown.netMonthlyFee);
    } else {
      return Math.round(packageFeeBreakdown.firstInstallmentAmount);
    }
  }, [billingMode, initialFeeOverride, monthlyFeeBreakdown.netMonthlyFee, packageFeeBreakdown.firstInstallmentAmount]);

  // Total Add-on Fees (Admission, Registration, Materials, etc.)
  const totalAddonFees = useMemo(() => {
    return addonFeeItems.reduce((sum, item) => sum + (Math.max(0, Number(item.amount)) || 0), 0);
  }, [addonFeeItems]);

  // Total Payable Right Now At Admission (Initial Tuition + All Add-on Fee Items)
  const totalPayableNow = useMemo(() => {
    return Math.round(effectiveInitialTuition + totalAddonFees);
  }, [effectiveInitialTuition, totalAddonFees]);

  // Sync amountPaidNow when paymentOption changes
  useEffect(() => {
    if (paymentOption === 'paid_full') {
      setAmountPaidNow(String(totalPayableNow));
      setAdhocDiscount('0');
      setDiscountRemarks('');
    } else if (paymentOption === 'unpaid') {
      setAmountPaidNow('0');
      setAdhocDiscount('0');
      setDiscountRemarks('');
    }
  }, [paymentOption, totalPayableNow]);

  // Remaining Balance Due (In Partial Payment Mode: Total - Paid - Discount)
  const remainingDue = useMemo(() => {
    const paid = paymentOption === 'paid_full' ? totalPayableNow : (Number(amountPaidNow) || 0);
    const disc = paymentOption === 'partial' ? (Number(adhocDiscount) || 0) : 0;
    return Math.max(0, totalPayableNow - paid - disc);
  }, [totalPayableNow, amountPaidNow, adhocDiscount, paymentOption]);

  // Coverage Dates Preview for initial monthly voucher
  const coverageDates = useMemo(() => {
    try {
      const [y, m, d] = admissionDate.split('-').map(Number);
      const startDt = new Date(y, m - 1, d);
      const endDt = new Date(y, m, d - 1);
      const dueDt = new Date(y, m - 1, d + 5);

      return {
        start: formatDateIso(startDt),
        end: formatDateIso(endDt),
        due: formatDateIso(dueDt)
      };
    } catch {
      return { start: admissionDate, end: admissionDate, due: admissionDate };
    }
  }, [admissionDate]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 300, 300, 0.85);
        setPhotoUrl(resized);
      } catch (err) {
        console.error('Image resize failed:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !phone) return;

    const admissionNo = `ACAD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const isMonthly = billingMode === 'monthly';
    const effectiveBaseMonthly = isMonthly 
      ? Number(baseMonthlyFee) || 0 
      : Math.round(packageFeeBreakdown.netTotal / packageFeeBreakdown.numInstallments);

    const paidNow = paymentOption === 'paid_full' 
      ? totalPayableNow 
      : paymentOption === 'partial' 
        ? (Number(amountPaidNow) || 0) 
        : 0;

    const partialDiscount = paymentOption === 'partial' ? (Number(adhocDiscount) || 0) : 0;
    const partialRemarks = paymentOption === 'partial' ? (discountRemarks || undefined) : undefined;

    const validFeeItems = addonFeeItems
      .filter(item => Number(item.amount) > 0)
      .map(item => ({ type: item.type, amount: Number(item.amount) }));

    const studentData: any = {
      name: studentName,
      parentName: parentName || 'Parent / Guardian',
      phone,
      email: email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@academy.com`,
      gender,
      gradeBatch: batchSelect,
      admitted_on: admissionDate,
      base_monthly_fee: effectiveBaseMonthly,
      totalFee: (isMonthly ? monthlyFeeBreakdown.netMonthlyFee : packageFeeBreakdown.netTotal) + totalAddonFees,
      admissionFee: totalAddonFees,
      admission_fee: totalAddonFees,
      feeItems: validFeeItems,
      fee_items: validFeeItems,
      adhocDiscount: partialDiscount,
      adhoc_discount: partialDiscount,
      extraDiscount: partialDiscount,
      extra_discount: partialDiscount,
      discountRemarks: partialRemarks,
      discount_remarks: partialRemarks,
      amountPaidNow: paidNow,
      amount_paid_now: paidNow,
      paymentMethod: paymentOption !== 'unpaid' ? paymentMethod : undefined,
      payment_method: paymentOption !== 'unpaid' ? paymentMethod : undefined,
      scholarship_type: scholarshipType,
      scholarship_value: scholarshipType === 'none' ? 0 : Number(scholarshipValue) || 0,
      scholarship_reason: scholarshipType === 'none' ? undefined : scholarshipReason,
      billing_anchor_day: effectiveAnchorDay,
      billing_mode: isMonthly ? 'monthly_recurring' : 'course_installments',
      total_installments: isMonthly ? 1 : packageFeeBreakdown.numInstallments,
      initial_fee_override: isMonthly && initialFeeOverride !== '' ? Number(initialFeeOverride) : undefined,
      initial_period_start: coverageDates.start,
      initial_period_end: coverageDates.end,
      dueDate: coverageDates.due,
      photoUrl,
      custom_fields: customValues,
      batchIds: selectedBatchObj ? [selectedBatchObj.id] : undefined
    };

    onAddStudent(studentData);

    setCredentialSlipData({
      admissionNo,
      studentName,
      parentName,
      parentPhone: phone,
      parentUsername: phone,
      parentPassword: '123456'
    });

    // Reset Form
    setStudentName('');
    setParentName('');
    setPhone('');
    setEmail('');
    setPhotoUrl(null);
    setCustomValues({});
    setInitialFeeOverride('');
    setAddonFeeItems([{ id: 'fee-1', type: 'Admission Fee', amount: '0' }]);
    setAdhocDiscount('0');
    setDiscountRemarks('');
    setPaymentOption('unpaid');
    setAmountPaidNow('0');
  };

  if (credentialSlipData) {
    return (
      <CredentialSlipModal
        onClose={() => {
          setCredentialSlipData(null);
          onClose();
        }}
        data={credentialSlipData}
      />
    );
  }

  return (
    <div className="floating-island-overlay" onClick={onClose}>
      <div
        className="floating-island-container"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1040 }}
      >
        {/* Island 1: Floating Dark Navy Header */}
        <div className="island-header-card">
          <div className="island-header-left">
            <span className="island-header-badge">
              <GraduationCap size={12} color="#10B981" /> Student Registration
            </span>
            <h3 className="island-header-title">Register New Student</h3>
            <p className="island-header-sub">
              Complete student profile & configure financial fee terms side-by-side
            </p>
          </div>
          <button type="button" className="island-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Scrollable White Form Island */}
        <div
          className="island-form-card"
          style={{
            maxHeight: '76vh',
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          <form id="register-student-form" onSubmit={handleSubmit}>
            <div className="registration-two-column-layout">
              
              {/* ================= LEFT COLUMN: STUDENT PROFILE & ACADEMIC ================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Section 1: Student Profile Information */}
                <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} /> 1. STUDENT PROFILE INFORMATION
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #3B82F6' }}>
                        {photoUrl ? (
                          <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={22} color="#94A3B8" />
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: 11.5, padding: '5px 12px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Camera size={13} color="#2563EB" /> Upload Student Photo
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl(null)}
                          style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 9999,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11.5 }}>Student Full Name *</label>
                      <div className="input-with-icon">
                        <User size={14} className="input-icon" />
                        <input className="form-input" required placeholder="e.g. Hamza Tariq" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ fontSize: 12 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11.5 }}>Gender *</label>
                      <ModernSelect
                        value={gender}
                        onChange={v => setGender(v as any)}
                        compact={true}
                        options={[
                          { value: 'Male', label: 'Male', icon: <User size={13} color="#475569" /> },
                          { value: 'Female', label: 'Female', icon: <User size={13} color="#475569" /> }
                        ]}
                        zIndex={1250}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Parent / Guardian Contact Details */}
                <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} /> 2. PARENT & CONTACT DETAILS
                  </div>
                  
                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11.5 }}>Parent / Guardian Name *</label>
                      <div className="input-with-icon">
                        <User size={14} className="input-icon" />
                        <input className="form-input" required placeholder="e.g. Tariq Ahmed" value={parentName} onChange={e => setParentName(e.target.value)} style={{ fontSize: 12 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11.5 }}>WhatsApp / Phone *</label>
                      <div className="input-with-icon">
                        <Phone size={14} className="input-icon" />
                        <input className="form-input" required placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} style={{ fontSize: 12 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Academic Batch Assignment */}
                <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} /> 3. ACADEMIC BATCH ASSIGNMENT
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11.5 }}>Assign Class / Batch Section *</label>
                    <ModernSelect
                      value={batchSelect}
                      onChange={setBatchSelect}
                      compact={true}
                      options={batches.length > 0 ? (
                        batches.map(b => ({
                          value: b.name,
                          label: `${b.name} ${b.sectionName ? `(${b.sectionName})` : ''} — ${b.timing || 'Standard Schedule'}`
                        }))
                      ) : (
                        [
                          { value: 'Matric Part 1 - Morning', label: 'Matric Part 1 - Morning' },
                          { value: 'Matric Part 2 - Evening', label: 'Matric Part 2 - Evening' },
                          { value: 'FSc Pre-Medical - Group A', label: 'FSc Pre-Medical - Group A' },
                          { value: 'ICS Computer Science - Batch 1', label: 'ICS Computer Science - Batch 1' }
                        ]
                      )}
                      zIndex={1200}
                    />
                  </div>

                  <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11.5 }}>Admission / Start Date *</label>
                      <ModernDatePicker
                        value={admissionDate}
                        onChange={setAdmissionDate}
                        compact={true}
                        openAbove={true}
                        zIndex={1180}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#FFFFFF', padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', minHeight: 35 }}>
                      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, lineHeight: 1.1 }}>Assigned:</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{batchSelect}</span>
                    </div>
                  </div>
                </div>

                {/* Section 6: Dynamic Custom Fields (When Present) */}
                {customFieldDefs.length > 0 && (
                  <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', letterSpacing: '0.05em' }}>ADDITIONAL ATTRIBUTES</div>
                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: customFieldDefs.length > 1 ? '1fr 1fr' : '1fr', gap: 10 }}>
                      {customFieldDefs.map(field => (
                        <div key={field.id} className="form-group">
                          <label className="form-label" style={{ fontSize: 11.5 }}>{field.label} {field.required && '*'}</label>
                          {field.type === 'select' ? (
                            <ModernSelect
                              value={customValues[field.id] || (field.options && field.options[0]) || ''}
                              onChange={val => setCustomValues(prev => ({ ...prev, [field.id]: val }))}
                              compact={true}
                              options={(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map(opt => ({ value: opt, label: opt }))}
                              zIndex={1050}
                            />
                          ) : (
                            <input
                              type={field.type === 'time' ? 'time' : field.type === 'date' ? 'date' : 'text'}
                              className="form-input"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              value={customValues[field.id] || ''}
                              onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                              required={field.required}
                              style={{ fontSize: 12, height: 35 }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= RIGHT COLUMN: FINANCIAL & FEE ENGINE ================= */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Section 4: Fee Structure & Billing Plan */}
                <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={14} color="#2563EB" /> 4. FEE STRUCTURE & BILLING PLAN
                  </div>

                  {/* Billing Model Segmented Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    
                    {/* Option 1: Monthly Recurring */}
                    <div
                      onClick={() => setBillingMode('monthly')}
                      style={{
                        border: billingMode === 'monthly' ? '1.5px solid #2563EB' : '1.5px solid #CBD5E1',
                        boxShadow: billingMode === 'monthly' ? '0 0 0 1px #2563EB' : 'none',
                        background: billingMode === 'monthly' ? '#EFF6FF' : '#FFFFFF',
                        borderRadius: 10,
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color={billingMode === 'monthly' ? '#2563EB' : '#64748B'} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Monthly</span>
                        </div>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: billingMode === 'monthly' ? '2px solid #2563EB' : '2px solid #CBD5E1',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border-color 0.15s ease'
                        }}>
                          {billingMode === 'monthly' && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 10.5, color: '#64748B', margin: 0, lineHeight: 1.3 }}>
                        Regular monthly tuition cycle.
                      </p>
                    </div>

                    {/* Option 2: Fixed Batch Package */}
                    <div
                      onClick={() => setBillingMode('batch_package')}
                      style={{
                        border: billingMode === 'batch_package' ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                        boxShadow: billingMode === 'batch_package' ? '0 0 0 1px #10B981' : 'none',
                        background: billingMode === 'batch_package' ? '#F0FDF4' : '#FFFFFF',
                        borderRadius: 10,
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={14} color={billingMode === 'batch_package' ? '#10B981' : '#64748B'} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>Package</span>
                        </div>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: billingMode === 'batch_package' ? '2px solid #10B981' : '2px solid #CBD5E1',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border-color 0.15s ease'
                        }}>
                          {billingMode === 'batch_package' && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 10.5, color: '#64748B', margin: 0, lineHeight: 1.3 }}>
                        Course package with installments.
                      </p>
                    </div>
                  </div>

                  {/* Mode A (Monthly Recurring) Inputs */}
                  {billingMode === 'monthly' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11.5 }}>Monthly Fee (PKR) *</label>
                          <input
                            className="form-input"
                            type="number"
                            required
                            min="0"
                            step="100"
                            placeholder="5000"
                            value={baseMonthlyFee}
                            onChange={e => setBaseMonthlyFee(e.target.value)}
                            style={{ fontSize: 12 }}
                          />
                        </div>

                        <div className="form-group" style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <label className="form-label" style={{ fontSize: 11.5, margin: 0 }}>Monthly Billing Date</label>
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                onClick={() => setShowBillingDateInfo(!showBillingDateInfo)}
                                onMouseEnter={() => setShowBillingDateInfo(true)}
                                onMouseLeave={() => setShowBillingDateInfo(false)}
                                style={{
                                  background: showBillingDateInfo ? '#0F172A' : '#F1F5F9',
                                  color: showBillingDateInfo ? '#FFFFFF' : '#64748B',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '50%',
                                  width: 17,
                                  height: 17,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Info size={10} />
                              </button>

                              {/* Floating Theme-Matching Glassmorphic Info Card */}
                              {showBillingDateInfo && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 'calc(100% + 8px)',
                                    right: 0,
                                    width: 250,
                                    background: '#0F172A',
                                    color: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: '10px 12px',
                                    fontSize: 11,
                                    lineHeight: 1.4,
                                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.35)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    zIndex: 1300,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10B981', fontWeight: 800, fontSize: 11 }}>
                                    <Calendar size={12} /> Monthly Billing Date
                                  </div>
                                  <div style={{ color: '#E2E8F0', fontSize: 10.5 }}>
                                    The day of the month (1–31) on which future monthly fee invoices are generated.
                                  </div>
                                  <div style={{ color: '#94A3B8', fontSize: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 4 }}>
                                    Leave as default to match admission date (Day {effectiveAnchorDay}).
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <ModernDayOfMonthPicker
                            value={customAnchorDay}
                            onChange={setCustomAnchorDay}
                            defaultDay={effectiveAnchorDay}
                            compact={true}
                            zIndex={1300}
                            openAbove={false}
                          />
                        </div>
                      </div>

                      {/* Mid-Month Pro-Rata Suggestion */}
                      {proRataSuggestion.isMidMonth && (
                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} color="#2563EB" /> Mid-Month (Day {proRataSuggestion.admissionDay}/{proRataSuggestion.totalDaysInMonth})
                            </span>
                            <span style={{ fontSize: 10.5, color: '#3B82F6', fontWeight: 600 }}>
                              {proRataSuggestion.remainingDays} Days Left
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setInitialFeeOverride(String(proRataSuggestion.halfMonthFee))}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 9999,
                                fontSize: 10.5,
                                fontWeight: 500,
                                border: initialFeeOverride === String(proRataSuggestion.halfMonthFee) ? '1px solid #2563EB' : '1px solid #CBD5E1',
                                background: initialFeeOverride === String(proRataSuggestion.halfMonthFee) ? '#DBEAFE' : '#FFFFFF',
                                color: initialFeeOverride === String(proRataSuggestion.halfMonthFee) ? '#1E40AF' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              50% (PKR {formatCurrency(proRataSuggestion.halfMonthFee)})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInitialFeeOverride(String(proRataSuggestion.exactDailyProRata))}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 9999,
                                fontSize: 10.5,
                                fontWeight: 500,
                                border: initialFeeOverride === String(proRataSuggestion.exactDailyProRata) ? '1px solid #2563EB' : '1px solid #CBD5E1',
                                background: initialFeeOverride === String(proRataSuggestion.exactDailyProRata) ? '#DBEAFE' : '#FFFFFF',
                                color: initialFeeOverride === String(proRataSuggestion.exactDailyProRata) ? '#1E40AF' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Pro-Rata (PKR {formatCurrency(proRataSuggestion.exactDailyProRata)})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInitialFeeOverride('')}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 9999,
                                fontSize: 10.5,
                                fontWeight: 500,
                                border: initialFeeOverride === '' ? '1px solid #2563EB' : '1px solid #CBD5E1',
                                background: initialFeeOverride === '' ? '#DBEAFE' : '#FFFFFF',
                                color: initialFeeOverride === '' ? '#1E40AF' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Full
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode B (Fixed Course Package) Inputs */}
                  {billingMode === 'batch_package' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11.5 }}>Total Course Fee (PKR) *</label>
                          <input
                            className="form-input"
                            type="number"
                            required
                            min="0"
                            step="500"
                            placeholder="25000"
                            value={totalCourseFee}
                            onChange={e => setTotalCourseFee(e.target.value)}
                            style={{ fontSize: 12, height: 35 }}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11.5 }}>Installment Plan *</label>
                          <ModernSelect
                            value={installmentCount}
                            onChange={setInstallmentCount}
                            compact={true}
                            options={[
                              { value: '1', label: '1 Full Upfront (100%)' },
                              { value: '2', label: '2 Equal (50%/50%)' },
                              { value: '3', label: '3 Equal (33%/33%/34%)' },
                              { value: '4', label: '4 Quarterly (25% each)' },
                              { value: '6', label: '6 Monthly' }
                            ]}
                            zIndex={1150}
                          />
                        </div>
                      </div>

                      {/* Installment Milestone Schedule Roadmap */}
                      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays size={12} color="#10B981" /> Roadmap ({packageFeeBreakdown.numInstallments} Milestones)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 6 }}>
                          {packageFeeBreakdown.installments.map(inst => (
                            <div
                              key={inst.number}
                              style={{
                                background: inst.number === 1 ? '#F0FDF4' : '#F8FAFC',
                                border: inst.number === 1 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                borderRadius: 6,
                                padding: '6px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                              }}
                            >
                              <div style={{ fontSize: 9.5, fontWeight: 700, color: inst.number === 1 ? '#166534' : '#64748B' }}>
                                {inst.number === 1 ? 'M#1 (Now)' : `M#${inst.number}`}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                                PKR {formatCurrency(inst.amount)}
                              </div>
                              <div style={{ fontSize: 9.5, color: '#2563EB', fontWeight: 600 }}>
                                {inst.dueDate}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared Scholarship / Concession */}
                  <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: scholarshipType !== 'none' ? '1.2fr 0.8fr' : '1fr', gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11.5 }}>Scholarship / Concession</label>
                        <ModernSelect
                          value={scholarshipType}
                          onChange={v => setScholarshipType(v as ScholarshipType)}
                          compact={true}
                          options={[
                            { value: 'none', label: 'None' },
                            { value: 'percentage', label: 'Percentage (%)' },
                            { value: 'fixed', label: 'Fixed PKR Discount' }
                          ]}
                          zIndex={1100}
                        />
                      </div>

                      {scholarshipType !== 'none' ? (
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11.5 }}>
                            {scholarshipType === 'percentage' ? 'Discount (%)' : 'Amount (PKR)'} *
                          </label>
                          <div className="input-with-icon">
                            <Percent size={14} className="input-icon" />
                            <input
                              className="form-input"
                              type="number"
                              required
                              min="1"
                              max={scholarshipType === 'percentage' ? 100 : 100000}
                              placeholder={scholarshipType === 'percentage' ? '20' : '1000'}
                              value={scholarshipValue}
                              onChange={e => setScholarshipValue(e.target.value)}
                              style={{ fontSize: 12, height: 35 }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {scholarshipType !== 'none' && (
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11.5 }}>Scholarship Category / Reason *</label>
                        <ModernSelect
                          value={scholarshipReason}
                          onChange={v => setScholarshipReason(v as ScholarshipReason)}
                          compact={true}
                          options={[
                            { value: 'merit', label: 'Academic Merit' },
                            { value: 'need_based', label: 'Need-Based Financial Aid' },
                            { value: 'sibling', label: 'Sibling Concession' },
                            { value: 'staff_child', label: 'Staff Child Benefit' },
                            { value: 'special_grant', label: 'Special Management Grant' },
                            { value: 'other', label: 'Other Concession' }
                          ]}
                          zIndex={1080}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Total Fees To Be Paid & Immediate Counter Collection */}
                <div style={{ background: '#F8FAFC', padding: 15, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Banknote size={14} color="#16A34A" /> 5. FEES TO BE PAID (AT ADMISSION)
                  </div>

                  {/* 1st Month / Initial Tuition Rate */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11.5 }}>
                      {billingMode === 'monthly' ? '1st Month / Initial Tuition Fee (PKR)' : '1st Installment / Course Fee (PKR)'}
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      value={effectiveInitialTuition}
                      onChange={e => setInitialFeeOverride(e.target.value)}
                      style={{ fontSize: 12, height: 35 }}
                    />
                  </div>

                  {/* Dynamic Additional One-Time Fee Items (Admission, Registration, Books, ID Card, etc.) */}
                  <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Layers size={13} color="#2563EB" /> Additional Fee Charges / Add-ons (Optional)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddFeeItem}
                        style={{
                          background: '#F1F5F9',
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Plus size={12} color="#0F172A" /> Add Fee Item
                      </button>
                    </div>

                    {addonFeeItems.length === 0 ? (
                      <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '6px 0' }}>
                        No extra charges added. Click "+ Add Fee Item" to add Admission, Registration, ID Card, etc.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {addonFeeItems.map((item, index) => (
                          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: 8, alignItems: 'center' }}>
                            <div>
                              <ModernSelect
                                value={item.type}
                                onChange={val => handleUpdateFeeItem(item.id, 'type', val)}
                                compact={true}
                                options={STANDARD_FEE_TYPES.map(t => ({ value: t, label: t }))}
                                zIndex={1000 - index * 5}
                              />
                            </div>
                            <div>
                              <input
                                className="form-input"
                                type="number"
                                min="0"
                                step="100"
                                placeholder="Amount (PKR)"
                                value={item.amount}
                                onChange={e => handleUpdateFeeItem(item.id, 'amount', e.target.value)}
                                style={{ fontSize: 12, height: 35 }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeeItem(item.id)}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                borderRadius: 8,
                                width: 35,
                                height: 35,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title="Remove Fee Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Payable Right Now Banner */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 10,
                    border: '2px solid #10B981',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
                  }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Payable Now at Admission
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Tuition (PKR {formatCurrency(effectiveInitialTuition)})
                        {totalAddonFees > 0 && ` + Add-ons (PKR ${formatCurrency(totalAddonFees)})`}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>
                      PKR {formatCurrency(totalPayableNow)}
                    </div>
                  </div>

                  {/* Counter Payment Collection Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>
                      Collect Payment Now?
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setPaymentOption('unpaid')}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 8,
                          border: paymentOption === 'unpaid' ? '1.5px solid #64748B' : '1.5px solid #CBD5E1',
                          boxShadow: paymentOption === 'unpaid' ? '0 0 0 1px #64748B' : 'none',
                          background: paymentOption === 'unpaid' ? '#F1F5F9' : '#FFFFFF',
                          color: paymentOption === 'unpaid' ? '#0F172A' : '#64748B',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease'
                        }}
                      >
                        <Clock size={13} /> Unpaid
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('paid_full')}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 8,
                          border: paymentOption === 'paid_full' ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                          boxShadow: paymentOption === 'paid_full' ? '0 0 0 1px #10B981' : 'none',
                          background: paymentOption === 'paid_full' ? '#DCFCE7' : '#FFFFFF',
                          color: paymentOption === 'paid_full' ? '#166534' : '#64748B',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease'
                        }}
                      >
                        <CheckCircle2 size={13} /> Full Paid
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('partial')}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 8,
                          border: paymentOption === 'partial' ? '1.5px solid #F59E0B' : '1.5px solid #CBD5E1',
                          boxShadow: paymentOption === 'partial' ? '0 0 0 1px #F59E0B' : 'none',
                          background: paymentOption === 'partial' ? '#FEF3C7' : '#FFFFFF',
                          color: paymentOption === 'partial' ? '#92400E' : '#64748B',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease'
                        }}
                      >
                        <Banknote size={13} /> Partial
                      </button>
                    </div>

                    {/* When Full Paid: ONLY select payment method without clutter */}
                    {paymentOption === 'paid_full' && (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: 10,
                        border: '1px solid #BBF7D0',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 2
                      }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11 }}>Payment Method *</label>
                          <ModernSelect
                            value={paymentMethod}
                            onChange={setPaymentMethod}
                            compact={true}
                            options={[
                              { value: 'Cash', label: 'Cash at Counter', icon: <Banknote size={13} color="#16A34A" /> },
                              { value: 'Bank Transfer', label: 'Bank Transfer (Online)', icon: <CreditCard size={13} color="#2563EB" /> },
                              { value: 'EasyPaisa', label: 'EasyPaisa / JazzCash', icon: <Phone size={13} color="#10B981" /> },
                              { value: 'Card', label: 'Debit / Credit Card', icon: <CreditCard size={13} color="#7C3AED" /> }
                            ]}
                            zIndex={900}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', padding: '6px 10px', borderRadius: 8, fontSize: 11 }}>
                          <span style={{ color: '#166534', fontWeight: 600 }}>Amount Collected:</span>
                          <span style={{ fontWeight: 800, color: '#16A34A' }}>
                            PKR {formatCurrency(totalPayableNow)} (100% Paid in Full)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* When Partial: Show Received Amount + Method + Optional Discount & Remarks */}
                    {paymentOption === 'partial' && (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: 10,
                        border: '1px solid #FEF3C7',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        marginTop: 2
                      }}>
                        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Received Amount (PKR) *</label>
                            <input
                              className="form-input"
                              type="number"
                              required
                              min="1"
                              max={totalPayableNow}
                              placeholder="e.g. 2000"
                              value={amountPaidNow}
                              onChange={e => setAmountPaidNow(e.target.value)}
                              style={{ fontSize: 12, height: 35 }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Payment Method *</label>
                            <ModernSelect
                              value={paymentMethod}
                              onChange={setPaymentMethod}
                              compact={true}
                              options={[
                                { value: 'Cash', label: 'Cash at Counter', icon: <Banknote size={13} color="#16A34A" /> },
                                { value: 'Bank Transfer', label: 'Bank Transfer (Online)', icon: <CreditCard size={13} color="#2563EB" /> },
                                { value: 'EasyPaisa', label: 'EasyPaisa / JazzCash', icon: <Phone size={13} color="#10B981" /> },
                                { value: 'Card', label: 'Debit / Credit Card', icon: <CreditCard size={13} color="#7C3AED" /> }
                              ]}
                              zIndex={900}
                            />
                          </div>
                        </div>

                        {/* Optional Ad-hoc Discount in Partial Payment */}
                        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Discount / Waiver (PKR)</label>
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              step="100"
                              placeholder="0 (Optional)"
                              value={adhocDiscount}
                              onChange={e => setAdhocDiscount(e.target.value)}
                              style={{ fontSize: 12 }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Discount Reason / Remarks</label>
                            <input
                              className="form-input"
                              placeholder="e.g. Special concession / Late waiver"
                              value={discountRemarks}
                              onChange={e => setDiscountRemarks(e.target.value)}
                              style={{ fontSize: 12 }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: 6, fontSize: 11 }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>Remaining Due Balance:</span>
                          <span style={{ fontWeight: 800, color: remainingDue === 0 ? '#10B981' : '#DC2626' }}>
                            {remainingDue === 0 ? 'PKR 0 (Settled)' : `PKR ${formatCurrency(remainingDue)}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LIVE REACTIVE BREAKDOWN CARD */}
                  <div
                    style={{
                      background: '#0F172A',
                      color: '#FFFFFF',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calculator size={13} color="#10B981" /> 
                        {billingMode === 'monthly' ? 'MONTHLY TUITION BREAKDOWN' : 'COURSE PACKAGE BREAKDOWN'}
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: paymentOption === 'paid_full' ? '#34D399' : paymentOption === 'partial' ? '#FBBF24' : '#38BDF8',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '2px 6px',
                        borderRadius: 9999
                      }}>
                        {paymentOption === 'paid_full' ? 'Paid in Full' : paymentOption === 'partial' ? 'Partial Deposit' : 'Unpaid (Due Voucher)'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>{billingMode === 'monthly' ? 'Monthly Fee' : 'Course Fee'}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>
                          PKR {formatCurrency(billingMode === 'monthly' ? monthlyFeeBreakdown.grossMonthlyFee : packageFeeBreakdown.grossTotal)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>Add-on Charges</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: totalAddonFees > 0 ? '#38BDF8' : '#94A3B8' }}>
                          {totalAddonFees > 0 ? `+PKR ${formatCurrency(totalAddonFees)}` : 'PKR 0'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>Scholarship</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: (billingMode === 'monthly' ? monthlyFeeBreakdown.discountAmount : packageFeeBreakdown.discount) > 0 ? '#34D399' : '#94A3B8' }}>
                          {(billingMode === 'monthly' ? monthlyFeeBreakdown.discountAmount : packageFeeBreakdown.discount) > 0 
                            ? `-PKR ${formatCurrency(billingMode === 'monthly' ? monthlyFeeBreakdown.discountAmount : packageFeeBreakdown.discount)}` 
                            : 'PKR 0'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>TOTAL DUE</div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#10B981' }}>
                          PKR {formatCurrency(totalPayableNow)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div className="island-pill-row">
          <button type="button" className="island-pill-btn island-pill-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="register-student-form"
            className="island-pill-btn island-pill-btn-submit"
          >
            <CheckCircle2 size={16} color="#10B981" /> Complete Registration & Issue Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudentModal;
