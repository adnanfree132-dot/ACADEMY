import React, { useState } from 'react';
import { X, UserPlus, CreditCard, BookOpen, Calendar, CheckCircle2, User, Phone, Mail, DollarSign, GraduationCap, Building2, FileText } from 'lucide-react';
import { Student, FeeTransaction, Batch, Announcement, Teacher } from '../types';
import { CredentialSlipModal, CredentialData } from './CredentialSlipModal';
import { ModernSelect } from './ModernSelect';
import { ModernDatePicker } from './ModernDatePicker';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'regNo' | 'paidFee' | 'dueBalance' | 'isDefaulter'>) => void;
  onAddPayment: (payment: Omit<FeeTransaction, 'id' | 'receiptNo'>) => void;
  onAddBatch: (batch: Omit<Batch, 'id' | 'studentsCount'>) => void;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'assignedSubjects' | 'assignedBatches'>) => void;
  students: Student[];
  batches: Batch[];
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  onAddPayment,
  onAddBatch,
  onAddAnnouncement,
  onAddTeacher,
  students,
  batches
}) => {
  const [activeType, setActiveType] = useState<'student' | 'payment' | 'teacher' | 'batch'>('student');
  const [credentialSlipData, setCredentialSlipData] = useState<CredentialData | null>(null);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [batchSelect, setBatchSelect] = useState(batches[0]?.name || 'Grade 10 - Sec A');
  const [totalFee, setTotalFee] = useState('12000');
  const [dueDate, setDueDate] = useState('2026-09-05');

  // Payment Form State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'stu-1');
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'Card'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Teacher Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherQual, setTeacherQual] = useState('');

  // Batch Form State
  const [batchName, setBatchName] = useState('');
  const [classLevel, setClassLevel] = useState('Grade 10');
  const [batchTiming, setBatchTiming] = useState('14:00 - 16:00');
  const [batchRoom, setBatchRoom] = useState('Room 101');
  const [batchCapacity, setBatchCapacity] = useState('30');

  if (!isOpen) return null;

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentName || !phone) return;

    const seq = (students.length + 1).toString().padStart(3, '0');
    const admNo = `ACAD-2026-${seq}`;
    const stuUser = `acad2026${seq}`;
    const stuPass = Math.random().toString(36).slice(-8).toUpperCase();
    const parUser = `PAR-2026${seq}`;
    const parPass = Math.random().toString(36).slice(-8).toUpperCase();

    onAddStudent({
      name: studentName,
      parentName,
      phone,
      email: email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      gradeBatch: batchSelect,
      gender,
      status: 'Active',
      totalFee: Number(totalFee) || 10000,
      dueDate: dueDate || '2026-09-05'
    });

    setCredentialSlipData({
      admissionNo: admNo,
      studentName,
      parentName,
      parentPhone: phone,
      parentUsername: phone,
      parentPassword: '123456'
    });

    setStudentName('');
    setParentName('');
    setPhone('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === selectedStudentId) || students[0] || {
      id: 'stu-1',
      name: 'Muhammad Ali',
      regNo: 'ACAD-2026-001'
    };

    onAddPayment({
      studentId: st.id,
      studentName: st.name,
      regNo: st.regNo,
      amount: Number(paymentAmount) || 5000,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      notes: paymentNotes
    });
    setPaymentNotes('');
    onClose();
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail) return;
    onAddTeacher({
      name: teacherName,
      email: teacherEmail,
      phone: teacherPhone,
      qualification: teacherQual || 'B.Sc'
    });
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPhone('');
    setTeacherQual('');
    onClose();
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName) return;
    onAddBatch({
      name: batchName,
      classLevel,
      timing: batchTiming,
      room: batchRoom,
      capacity: Number(batchCapacity) || 30,
      teacherName: 'Unassigned'
    });
    setBatchName('');
    onClose();
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      style={{ 
        zIndex: 1300, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 560, 
          width: '100%', 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none', 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}
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
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              {activeType === 'student' && <UserPlus size={20} />}
              {activeType === 'payment' && <CreditCard size={20} />}
              {activeType === 'teacher' && <GraduationCap size={20} />}
              {activeType === 'batch' && <BookOpen size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Quick Create Action</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Select category to register student, teacher, batch or fee</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFFFFF', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 2: Floating Tab Selector Bar */}
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          background: 'rgba(255, 255, 255, 0.9)', 
          backdropFilter: 'blur(8px)',
          padding: 6, 
          borderRadius: 14, 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}>
          <button 
            type="button"
            onClick={() => setActiveType('student')}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: 10, 
              border: 'none', 
              background: activeType === 'student' ? '#0F172A' : 'transparent', 
              color: activeType === 'student' ? '#FFFFFF' : '#475569', 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <UserPlus size={14} /> Student
          </button>
          <button 
            type="button"
            onClick={() => setActiveType('payment')}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: 10, 
              border: 'none', 
              background: activeType === 'payment' ? '#0F172A' : 'transparent', 
              color: activeType === 'payment' ? '#FFFFFF' : '#475569', 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <CreditCard size={14} /> Payment
          </button>
          <button 
            type="button"
            onClick={() => setActiveType('teacher')}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: 10, 
              border: 'none', 
              background: activeType === 'teacher' ? '#0F172A' : 'transparent', 
              color: activeType === 'teacher' ? '#FFFFFF' : '#475569', 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <GraduationCap size={14} /> Teacher
          </button>
          <button 
            type="button"
            onClick={() => setActiveType('batch')}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              borderRadius: 10, 
              border: 'none', 
              background: activeType === 'batch' ? '#0F172A' : 'transparent', 
              color: activeType === 'batch' ? '#FFFFFF' : '#475569', 
              fontWeight: 700, 
              fontSize: 12, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <BookOpen size={14} /> Batch
          </button>
        </div>

        {/* Island 3: Floating White Form Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          maxHeight: '65vh', 
          overflowY: 'auto' 
        }}>
          {/* Form 1: Add Student */}
          {activeType === 'student' && (
            <form id="quick-create-form" onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Student Full Name *</label>
                <div className="input-with-icon">
                  <User size={15} className="input-icon" />
                  <input 
                    className="form-input" 
                    required 
                    value={studentName} 
                    onChange={e => setStudentName(e.target.value)} 
                    placeholder="e.g. Muhammad Hamza" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent / Guardian Name *</label>
                  <div className="input-with-icon">
                    <User size={15} className="input-icon" />
                    <input 
                      className="form-input" 
                      required 
                      value={parentName} 
                      onChange={e => setParentName(e.target.value)} 
                      placeholder="e.g. Tariq Mehmood" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Parent Phone (SMS Alerts) *</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="input-icon" />
                    <input 
                      className="form-input" 
                      required 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="+92 300 1234567" 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gender</label>
                  <ModernSelect
                    value={gender}
                    onChange={v => setGender(v as any)}
                    options={[
                      { value: 'Male', label: 'Male', icon: <User size={14} color="#475569" /> },
                      { value: 'Female', label: 'Female', icon: <User size={14} color="#475569" /> }
                    ]}
                    zIndex={1200}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Assigned Batch Section</label>
                  <ModernSelect
                    value={batchSelect}
                    onChange={setBatchSelect}
                    options={batches.length > 0 ? (
                      batches.map(b => ({ value: b.name, label: b.name }))
                    ) : (
                      [{ value: 'Grade 10 - Sec A', label: 'Grade 10 - Sec A' }]
                    )}
                    zIndex={1200}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Monthly Tuition Fee ($)</label>
                  <div className="input-with-icon">
                    <DollarSign size={15} className="input-icon" />
                    <input 
                      className="form-input" 
                      type="number" 
                      value={totalFee} 
                      onChange={e => setTotalFee(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>First Payment Due Date</label>
                  <ModernDatePicker
                    value={dueDate}
                    onChange={setDueDate}
                  />
                </div>
              </div>
            </form>
          )}

          {/* Form 2: Record Payment */}
          {activeType === 'payment' && (
            <form id="quick-create-form" onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Select Student Account</label>
                <ModernSelect
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  options={students.length > 0 ? (
                    students.map(s => ({
                      value: s.id,
                      label: `${s.regNo} - ${s.name} (Balance Due: $${s.dueBalance})`
                    }))
                  ) : (
                    [{ value: 'stu-1', label: 'ACAD-2026-001 - Usman Tariq' }]
                  )}
                  zIndex={1200}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Payment Amount Received ($)</label>
                  <div className="input-with-icon">
                    <DollarSign size={15} className="input-icon" />
                    <input 
                      className="form-input" 
                      type="number" 
                      required 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Payment Method</label>
                  <ModernSelect
                    value={paymentMethod}
                    onChange={v => setPaymentMethod(v as any)}
                    options={[
                      { value: 'Cash', label: 'Cash', icon: <DollarSign size={14} color="#475569" /> },
                      { value: 'Bank Transfer', label: 'Bank Transfer', icon: <Building2 size={14} color="#475569" /> },
                      { value: 'Cheque', label: 'Cheque', icon: <FileText size={14} color="#475569" /> },
                      { value: 'Card', label: 'Card', icon: <CreditCard size={14} color="#475569" /> }
                    ]}
                    zIndex={1200}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Payment Notes / Reference No</label>
                <input 
                  className="form-input" 
                  value={paymentNotes} 
                  onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder="e.g. August 2026 Tuition Fee Payment" 
                />
              </div>
            </form>
          )}

          {/* Form 3: Add Teacher */}
          {activeType === 'teacher' && (
            <form id="quick-create-form" onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Teacher Full Name *</label>
                <div className="input-with-icon">
                  <User size={15} className="input-icon" />
                  <input 
                    className="form-input" 
                    required 
                    value={teacherName} 
                    onChange={e => setTeacherName(e.target.value)} 
                    placeholder="e.g. Asad Ullah" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-icon" />
                  <input 
                    className="form-input" 
                    type="email"
                    required 
                    value={teacherEmail} 
                    onChange={e => setTeacherEmail(e.target.value)} 
                    placeholder="e.g. asad@academy.com" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="input-icon" />
                    <input 
                      className="form-input" 
                      value={teacherPhone} 
                      onChange={e => setTeacherPhone(e.target.value)} 
                      placeholder="+92 300 1234567" 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Qualification</label>
                  <input 
                    className="form-input" 
                    value={teacherQual} 
                    onChange={e => setTeacherQual(e.target.value)} 
                    placeholder="e.g. M.Sc Physics" 
                  />
                </div>
              </div>
            </form>
          )}

          {/* Form 4: Create Batch */}
          {activeType === 'batch' && (
            <form id="quick-create-form" onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>Batch Name *</label>
                <div className="input-with-icon">
                  <BookOpen size={15} className="input-icon" />
                  <input 
                    className="form-input" 
                    required 
                    value={batchName} 
                    onChange={e => setBatchName(e.target.value)} 
                    placeholder="e.g. Grade 10 - Morning Section A" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Class Level</label>
                  <input 
                    className="form-input" 
                    required 
                    value={classLevel} 
                    onChange={e => setClassLevel(e.target.value)} 
                    placeholder="e.g. Grade 10" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Timings</label>
                  <input 
                    className="form-input" 
                    required 
                    value={batchTiming} 
                    onChange={e => setBatchTiming(e.target.value)} 
                    placeholder="e.g. 14:00 - 16:00" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Room Allocation</label>
                  <input 
                    className="form-input" 
                    value={batchRoom} 
                    onChange={e => setBatchRoom(e.target.value)} 
                    placeholder="e.g. Room 101" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Max Capacity</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    value={batchCapacity} 
                    onChange={e => setBatchCapacity(e.target.value)} 
                    placeholder="30" 
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ 
              padding: '10px 20px', 
              borderRadius: 9999, 
              border: '1px solid #CBD5E1', 
              background: '#FFFFFF', 
              color: '#334155', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="quick-create-form"
            style={{ 
              padding: '10px 24px', 
              borderRadius: 9999, 
              border: 'none', 
              background: '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            ✓ Save & Confirm
          </button>
        </div>
      </div>

      {credentialSlipData && (
        <CredentialSlipModal
          data={credentialSlipData}
          onClose={() => {
            setCredentialSlipData(null);
            onClose();
          }}
        />
      )}
    </div>
  );
};
