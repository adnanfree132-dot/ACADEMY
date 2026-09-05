import React, { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { 
  Shield, 
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  Loader2, 
  Building2, 
  ShieldCheck, 
  Users, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  User
} from 'lucide-react';
import { cacheClear } from '../lib/resourceCache';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

interface QuickStaffItem {
  id: string;
  staffId: string;
  fullName: string;
  role: string;
  designation: string;
  phone: string;
  email?: string;
  tempPasswordPlain: string;
  permissionsCount: number;
  permissionsSummary: string;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState<'admin' | 'teacher' | 'student' | 'super_admin' | null>(null);

  // Real Staff Quick Login Helper State
  const [staffList, setStaffList] = useState<QuickStaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Self-Serve Academy Registration State
  const [regAcademyName, setRegAcademyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Load real staff for quick testing
  useEffect(() => {
    let isMounted = true;
    api.getQuickStaff()
      .then(items => {
        if (isMounted && Array.isArray(items)) {
          setStaffList(items);
          if (items.length > 0) {
            setSelectedStaffId(items[0].staffId);
          }
        }
      })
      .catch(() => {
        // Non-fatal if quick-staff fails (e.g. fresh DB before seeding)
      });
    return () => { isMounted = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ email, password });
      
      // Wipe stale cached data from previous sessions
      cacheClear();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'admin' | 'teacher' | 'student' | 'super_admin') => {
    setError('');
    setLoading(true);
    setDemoRole(role);

    if (role === 'admin') {
      setEmail('admin');
      setPassword('admin');
    } else if (role === 'teacher') {
      setEmail('teacher@academiapro.edu');
      setPassword('••••••••');
    } else if (role === 'student') {
      setEmail('demo.student@academiapro.edu');
      setPassword('••••••••');
    } else if (role === 'super_admin') {
      setEmail('superadmin');
      setPassword('superadmin123');
    }

    try {
      const result = await api.demoLogin(role);
      
      // Wipe stale cached data from previous sessions
      cacheClear();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || `Demo login as ${role} failed. Please check backend status.`);
    } finally {
      setLoading(false);
      setDemoRole(null);
    }
  };

  const handleQuickStaffLogin = async () => {
    if (!selectedStaffId) return;
    setError('');
    setStaffLoading(true);

    try {
      const result = await api.quickStaffLogin(selectedStaffId);
      
      cacheClear();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick staff login failed.');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleRegisterAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegLoading(true);

    try {
      const result = await api.registerAcademy({
        academyName: regAcademyName.trim(),
        adminName: regAdminName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
        address: regAddress.trim() || undefined
      });

      setRegSuccess(true);
      cacheClear();
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to create academy trial.');
    } finally {
      setRegLoading(false);
    }
  };

  const selectedStaffMember = staffList.find(s => s.staffId === selectedStaffId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', padding: '24px 16px' }}>
      <div 
        style={{ 
          background: 'var(--bg-surface)', 
          padding: '36px 32px', 
          borderRadius: '18px', 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 12px 32px -4px rgba(15,23,42,0.1)', 
          width: '100%', 
          maxWidth: '460px' 
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: '#0F172A', color: '#FFFFFF', marginBottom: 12 }}>
            <Building2 size={22} />
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AcademiaPro OS
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Multi-Tenant Academy ERP &amp; Staff Management SaaS
          </p>
        </div>

        {/* Tab Switcher: Sign In vs 30-Day Free Trial */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 4, 
            background: '#F1F5F9', 
            padding: 4, 
            borderRadius: 12, 
            marginBottom: 22 
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(''); }}
            style={{
              padding: '8px 12px',
              borderRadius: 9,
              border: 'none',
              background: activeTab === 'signin' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'signin' ? '#0F172A' : '#64748B',
              fontSize: 13,
              fontWeight: activeTab === 'signin' ? 700 : 500,
              cursor: 'pointer',
              boxShadow: activeTab === 'signin' ? '0 2px 5px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              padding: '8px 12px',
              borderRadius: 9,
              border: 'none',
              background: activeTab === 'register' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'register' ? '#059669' : '#64748B',
              fontSize: 13,
              fontWeight: activeTab === 'register' ? 700 : 500,
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? '0 2px 5px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5
            }}
          >
            <Sparkles size={13} color="#10B981" />
            <span>Start Free Trial</span>
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: SIGN IN                                                            */}
        {/* ========================================================================= */}
        {activeTab === 'signin' && (
          <>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Username / Email / Staff ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', background: '#FFFFFF', boxSizing: 'border-box' }}
                    required
                  />
                  <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', background: '#FFFFFF', boxSizing: 'border-box' }}
                    required
                  />
                  <Lock size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole === null ? 0.7 : 1,
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading && demoRole === null ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{loading && demoRole === null ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>

            {/* Quick Demo Login Grid */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 14px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={11} color="#64748B" /> Quick Demo Roles
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {/* Admin */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('admin')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 2px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '9px',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'admin' ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {demoRole === 'admin' ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                <span>Admin</span>
              </button>

              {/* Teacher */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('teacher')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 2px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '9px',
                  color: '#1D4ED8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'teacher' ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {demoRole === 'teacher' ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                <span>Teacher</span>
              </button>

              {/* Student */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('student')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 2px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '9px',
                  color: '#047857',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'student' ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {demoRole === 'student' ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                <span>Student</span>
              </button>

              {/* Super Admin */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('super_admin')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 2px',
                  backgroundColor: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  borderRadius: '9px',
                  color: '#7C3AED',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'super_admin' ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {demoRole === 'super_admin' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>Platform</span>
              </button>
            </div>

            {/* Test Real Staff Account Helper */}
            {staffList.length > 0 && (
              <div 
                style={{ 
                  marginTop: 22, 
                  padding: 14, 
                  background: '#F8FAFC', 
                  borderRadius: 12, 
                  border: '1px solid #E2E8F0' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Users size={14} color="#0F172A" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                    Test Real Staff Account (RBAC)
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#64748B', lineHeight: 1.35 }}>
                  Select a live staff member to test dynamic permissions and restricted view gates.
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      background: '#FFFFFF',
                      color: '#0F172A'
                    }}
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.staffId}>
                        {s.fullName} ({s.designation || s.role})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleQuickStaffLogin}
                    disabled={staffLoading || !selectedStaffId}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {staffLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                    <span>Test Login</span>
                  </button>
                </div>

                {selectedStaffMember && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#475569', background: '#FFFFFF', padding: '6px 8px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontWeight: 700 }}>Permissions:</span> {selectedStaffMember.permissionsSummary}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: START 30-DAY FREE TRIAL (SELF-SERVE REGISTRATION)                  */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterAcademy}>
            {/* Trial Value Banner */}
            <div 
              style={{ 
                background: '#ECFDF5', 
                border: '1px solid #A7F3D0', 
                borderRadius: 10, 
                padding: '10px 14px', 
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#047857'
              }}
            >
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
              <div>
                <strong>30-Day Complete Enterprise Trial</strong> &bull; Zero credit card required. Full ERP features active instantly.
              </div>
            </div>

            {/* Academy Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Academy / Institute Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Apex International Academy"
                  value={regAcademyName}
                  onChange={e => setRegAcademyName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <Building2 size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>

            {/* Administrator Full Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Administrator Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={regAdminName}
                  onChange={e => setRegAdminName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <User size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>

            {/* Admin Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Work Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="admin@youracademy.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <Mail size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>

            {/* Master Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Create Admin Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                  minLength={6}
                />
                <Lock size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 10 }} />
              </div>
            </div>

            {/* Phone & Address Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="+1 (555) 0123"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <Phone size={13} color="#94A3B8" style={{ position: 'absolute', left: 9, top: 10 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  City / Campus
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. West Campus"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <MapPin size={13} color="#94A3B8" style={{ position: 'absolute', left: 9, top: 10 }} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={regLoading || regSuccess}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: regSuccess ? '#059669' : '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: regLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
              }}
            >
              {regLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{regSuccess ? 'Trial Provisioned! Launching...' : regLoading ? 'Provisioning Academy...' : 'Start 30-Day Free Trial'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
