import React, { useState } from 'react';
import { api } from '../api/apiClient';
import { Shield, GraduationCap, UserCheck, Sparkles, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState<'admin' | 'teacher' | 'student' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ email, password });
      
      // Save token to local storage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'admin' | 'teacher' | 'student') => {
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
    }

    try {
      const result = await api.demoLogin(role);
      
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

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.08)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AcademiaPro</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '10px', marginBottom: '20px', fontSize: '13.5px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Username / Email / Staff ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13.5px', background: '#FFFFFF', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13.5px', background: '#FFFFFF', boxSizing: 'border-box' }}
              required
            />
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
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && demoRole === null ? 0.7 : 1,
              transition: 'background-color 0.15s ease'
            }}
          >
            {loading && demoRole === null ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} color="#64748B" /> Quick Demo Login
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemoLogin('admin')}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#0F172A';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#0F172A';
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 4px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              color: '#0F172A',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && demoRole !== 'admin' ? 0.5 : 1,
              transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
            }}
          >
            {demoRole === 'admin' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Shield size={16} color="currentColor" />
            )}
            <span>Admin</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemoLogin('teacher')}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#1D4ED8';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.color = '#1D4ED8';
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 4px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              color: '#1D4ED8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && demoRole !== 'teacher' ? 0.5 : 1,
              transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
            }}
          >
            {demoRole === 'teacher' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GraduationCap size={16} color="currentColor" />
            )}
            <span>Teacher</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickDemoLogin('student')}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#047857';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ECFDF5';
                e.currentTarget.style.color = '#047857';
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 4px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              color: '#047857',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && demoRole !== 'student' ? 0.5 : 1,
              transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
            }}
          >
            {demoRole === 'student' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserCheck size={16} color="currentColor" />
            )}
            <span>Student</span>
          </button>
        </div>
      </div>
    </div>
  );
}
