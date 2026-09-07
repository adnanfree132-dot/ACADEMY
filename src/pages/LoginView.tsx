import React, { useState } from 'react';
import { api } from '../api/apiClient';
import { 
  Shield, 
  ShieldCheck,
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  Loader2, 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  User
} from 'lucide-react';
import { cacheClear } from '../lib/resourceCache';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState<'super_admin' | 'admin' | 'teacher' | 'student' | null>(null);

  // Self-Serve Academy Registration State
  const [regAcademyName, setRegAcademyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ email, password });
      
      // Wipe stale cached data ONLY if switching user account or switching academy
      const lastActiveRaw = localStorage.getItem('last_active_user') || localStorage.getItem('user');
      let lastUser: any = null;
      try { lastUser = lastActiveRaw ? JSON.parse(lastActiveRaw) : null; } catch {}

      const isSameUser = Boolean(
        lastUser &&
        result.user &&
        (lastUser.id === result.user.id || lastUser.email === result.user.email) &&
        (lastUser.academyId === result.user.academyId)
      );
      if (!isSameUser) {
        cacheClear();
      }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('last_active_user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'super_admin' | 'admin' | 'teacher' | 'student') => {
    setError('');
    setLoading(true);
    setDemoRole(role);

    if (role === 'super_admin') {
      setEmail('superadmin@academiapro.io');
      setPassword('superadmin123');
    } else if (role === 'admin') {
      setEmail('admin');
      setPassword('admin');
    } else if (role === 'teacher') {
      setEmail('teacher@academiapro.edu');
      setPassword('teacher123');
    } else if (role === 'student') {
      setEmail('demo.student@academiapro.edu');
      setPassword('student123');
    }

    try {
      const result = await api.demoLogin(role);
      
      // Wipe stale cached data ONLY if switching user account or switching academy
      const lastActiveRaw = localStorage.getItem('last_active_user') || localStorage.getItem('user');
      let lastUser: any = null;
      try { lastUser = lastActiveRaw ? JSON.parse(lastActiveRaw) : null; } catch {}

      const isSameUser = Boolean(
        lastUser &&
        result.user &&
        (lastUser.id === result.user.id || lastUser.email === result.user.email) &&
        (lastUser.academyId === result.user.academyId)
      );
      if (!isSameUser) {
        cacheClear();
      }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('last_active_user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || `Demo login as ${role} failed. Please check backend status.`);
    } finally {
      setLoading(false);
      setDemoRole(null);
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
      localStorage.setItem('last_active_user', JSON.stringify(result.user));

      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to create academy trial.');
    } finally {
      setRegLoading(false);
    }
  };

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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-with-icon-left"
                    style={{ 
                      width: '100%', 
                      padding: '9px 14px 9px 38px', 
                      paddingLeft: '38px',
                      borderRadius: '10px', 
                      border: '1px solid #CBD5E1', 
                      outline: 'none', 
                      fontSize: '13px', 
                      background: '#FFFFFF', 
                      boxSizing: 'border-box' 
                    }}
                    required
                  />
                  <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-with-icon-left"
                    style={{ 
                      width: '100%', 
                      padding: '9px 14px 9px 38px', 
                      paddingLeft: '38px',
                      borderRadius: '10px', 
                      border: '1px solid #CBD5E1', 
                      outline: 'none', 
                      fontSize: '13px', 
                      background: '#FFFFFF', 
                      boxSizing: 'border-box' 
                    }}
                    required
                  />
                  <Lock size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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

            {/* Quick Demo Login Grid (4 Roles: Super Admin, Admin, Teacher, Student) */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 14px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={11} color="#64748B" /> Quick Demo Roles
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                  gap: '6px',
                  padding: '10px 4px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '11px',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'super_admin' ? 0.5 : 1,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease'
                }}
                title="Platform Super Admin (All Academies & SaaS Oversight)"
              >
                {demoRole === 'super_admin' ? <Loader2 size={16} className="animate-spin" color="#0F172A" /> : <ShieldCheck size={16} color="#0F172A" />}
                <span>Super Admin</span>
              </button>

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
                  gap: '6px',
                  padding: '10px 4px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '11px',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'admin' ? 0.5 : 1,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease'
                }}
                title="Academy Administrator"
              >
                {demoRole === 'admin' ? <Loader2 size={16} className="animate-spin" color="#0F172A" /> : <Shield size={16} color="#475569" />}
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
                  gap: '6px',
                  padding: '10px 4px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '11px',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'teacher' ? 0.5 : 1,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease'
                }}
                title="Faculty Teacher (Assigned Batch & Students)"
              >
                {demoRole === 'teacher' ? <Loader2 size={16} className="animate-spin" color="#0F172A" /> : <GraduationCap size={16} color="#475569" />}
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
                  gap: '6px',
                  padding: '10px 4px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '11px',
                  color: '#0F172A',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && demoRole !== 'student' ? 0.5 : 1,
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease'
                }}
                title="Student (Enrolled in Grade 10 - Section A)"
              >
                {demoRole === 'student' ? <Loader2 size={16} className="animate-spin" color="#0F172A" /> : <UserCheck size={16} color="#475569" />}
                <span>Student</span>
              </button>
            </div>
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="e.g. Apex International Academy"
                  value={regAcademyName}
                  onChange={e => setRegAcademyName(e.target.value)}
                  className="input-with-icon-left"
                  style={{ width: '100%', padding: '8px 12px 8px 38px', paddingLeft: '38px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <Building2 size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Administrator Full Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Administrator Full Name *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={regAdminName}
                  onChange={e => setRegAdminName(e.target.value)}
                  className="input-with-icon-left"
                  style={{ width: '100%', padding: '8px 12px 8px 38px', paddingLeft: '38px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <User size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Admin Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Work Email Address *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="email"
                  placeholder="admin@youracademy.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="input-with-icon-left"
                  style={{ width: '100%', padding: '8px 12px 8px 38px', paddingLeft: '38px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                />
                <Mail size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Master Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Create Admin Password *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="input-with-icon-left"
                  style={{ width: '100%', padding: '8px 12px 8px 38px', paddingLeft: '38px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  required
                  minLength={6}
                />
                <Lock size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Phone & Address Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="tel"
                    placeholder="+1 (555) 0123"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="input-with-icon-left"
                    style={{ width: '100%', padding: '8px 10px 8px 34px', paddingLeft: '34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <Phone size={13} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  City / Campus
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. West Campus"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="input-with-icon-left"
                    style={{ width: '100%', padding: '8px 10px 8px 34px', paddingLeft: '34px', borderRadius: 9, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <MapPin size={13} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
