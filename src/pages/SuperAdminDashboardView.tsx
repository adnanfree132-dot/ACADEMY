import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Calendar, 
  Download, 
  X, 
  Check, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  UserX,
  UserCheck,
  CalendarPlus
} from 'lucide-react';
import { api } from '../api/apiClient';
import { ModernDatePicker } from '../components/ModernDatePicker';

interface AcademyRecord {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  subscription_status: string;
  trial_started_at: string;
  trial_ends_at: string;
  is_active: boolean;
  created_at: string;
  days_remaining: number;
  owner?: {
    id: string;
    username: string;
    full_name: string;
    email: string;
    phone: string;
  };
  stats?: {
    studentsCount: number;
    staffCount: number;
    usersCount: number;
  };
}

interface SuperAdminStats {
  totalAcademies: number;
  activeTrials: number;
  expiredTrials: number;
  revokedAcademies: number;
  activeSubscriptions: number;
  totalUsers: number;
  totalStudents: number;
}

export const SuperAdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [academies, setAcademies] = useState<AcademyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Extend Trial Modal State
  const [selectedAcademyForExtension, setSelectedAcademyForExtension] = useState<AcademyRecord | null>(null);
  const [extensionPreset, setExtensionPreset] = useState<number | 'custom'>(14);
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [extensionNotes, setExtensionNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, academiesData] = await Promise.all([
        api.getSuperAdminStats().catch(() => null),
        api.getSuperAdminAcademies().catch(() => [])
      ]);
      if (statsData) setStats(statsData);
      if (academiesData) {
        const normalized = academiesData.map((a: any) => ({
          ...a,
          is_active: a.is_active !== undefined ? a.is_active : (a.isActive ?? true),
          isActive: a.isActive !== undefined ? a.isActive : (a.is_active ?? true),
          days_remaining: a.days_remaining !== undefined ? a.days_remaining : (a.daysRemaining ?? 0),
          daysRemaining: a.daysRemaining !== undefined ? a.daysRemaining : (a.days_remaining ?? 0),
          subscription_status: a.subscription_status || a.subscriptionStatus || 'trial',
          owner: a.owner || a.adminUser || null,
          stats: a.stats || { studentsCount: 0, staffCount: 0, usersCount: 0 }
        }));
        setAcademies(normalized);
      }
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenExtendModal = (academy: AcademyRecord) => {
    setSelectedAcademyForExtension(academy);
    setExtensionPreset(14);
    // Pre-populate custom date with current trial end + 14 days
    const currentEnd = new Date(academy.trial_ends_at || Date.now());
    const target = new Date(currentEnd.getTime() + 14 * 86400000);
    setCustomEndDate(target.toISOString().split('T')[0]);
    setExtensionNotes('');
  };

  const handleConfirmExtension = async () => {
    if (!selectedAcademyForExtension) return;
    const academyId = selectedAcademyForExtension.id;
    const academyName = selectedAcademyForExtension.name;

    // Calculate new end date and new days remaining for optimistic UI update
    let calculatedEndDate: Date;
    let daysAdded = 0;

    if (extensionPreset === 'custom') {
      calculatedEndDate = new Date(customEndDate + 'T23:59:59Z');
    } else {
      daysAdded = extensionPreset;
      const base = new Date(selectedAcademyForExtension.trial_ends_at);
      const start = base > new Date() ? base : new Date();
      calculatedEndDate = new Date(start.getTime() + daysAdded * 86400000);
    }

    const newDaysRemaining = Math.max(0, Math.ceil((calculatedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // 1. Instant 0ms Optimistic UI Reflection
    setAcademies(prev => prev.map(a => {
      if (a.id === academyId) {
        return {
          ...a,
          trial_ends_at: calculatedEndDate.toISOString(),
          days_remaining: newDaysRemaining,
          subscription_status: 'trial',
          is_active: true
        };
      }
      return a;
    }));

    if (stats) {
      setStats({
        ...stats,
        activeTrials: stats.activeTrials + (selectedAcademyForExtension.subscription_status === 'expired' ? 1 : 0),
        expiredTrials: Math.max(0, stats.expiredTrials - (selectedAcademyForExtension.subscription_status === 'expired' ? 1 : 0))
      });
    }

    // Close modal immediately
    setSelectedAcademyForExtension(null);

    // 2. Silent Background API Request
    try {
      if (extensionPreset === 'custom') {
        await api.extendAcademyTrial(academyId, undefined, customEndDate);
      } else {
        await api.extendAcademyTrial(academyId, extensionPreset);
      }
    } catch (err) {
      console.error(`Error extending trial for ${academyName}:`, err);
      // Re-fetch backend state on error
      loadData();
    }
  };

  const handleToggleRevoke = async (academy: AcademyRecord) => {
    const isActive = academy.is_active !== undefined ? academy.is_active : ((academy as any).isActive ?? true);
    const isCurrentlyRevoked = academy.subscription_status === 'revoked' || !isActive;
    const willRevoke = !isCurrentlyRevoked;
    const daysRemaining = academy.days_remaining ?? (academy as any).daysRemaining ?? 0;

    // 1. Instant 0ms Optimistic UI Reflection
    setAcademies(prev => prev.map(a => {
      if (a.id === academy.id) {
        return {
          ...a,
          is_active: !willRevoke,
          isActive: !willRevoke,
          subscription_status: willRevoke ? 'revoked' : (daysRemaining > 0 ? 'trial' : 'expired')
        };
      }
      return a;
    }));

    if (stats) {
      setStats({
        ...stats,
        revokedAcademies: willRevoke ? stats.revokedAcademies + 1 : Math.max(0, stats.revokedAcademies - 1),
        activeTrials: willRevoke 
          ? (academy.subscription_status === 'trial' ? Math.max(0, stats.activeTrials - 1) : stats.activeTrials)
          : (daysRemaining > 0 ? stats.activeTrials + 1 : stats.activeTrials)
      });
    }

    // 2. Silent Background API Request
    try {
      await api.revokeAcademyAccess(academy.id, willRevoke);
    } catch (err) {
      console.error(`Failed to toggle revoke status for ${academy.name}:`, err);
      loadData();
    }
  };

  const handleExportCsv = () => {
    if (academies.length === 0) return;
    const headers = ['Academy Name', 'Slug', 'Owner Name', 'Owner Email', 'Owner Phone', 'Status', 'Days Remaining', 'Trial Started', 'Trial Ends', 'Active Students', 'Active Staff'];
    const rows = academies.map(a => [
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.slug || ''}"`,
      `"${(a.owner?.full_name || '').replace(/"/g, '""')}"`,
      `"${a.owner?.email || ''}"`,
      `"${a.owner?.phone || a.phone || ''}"`,
      `"${a.subscription_status}"`,
      a.days_remaining ?? (a as any).daysRemaining ?? 0,
      `"${a.trial_started_at ? a.trial_started_at.split('T')[0] : ''}"`,
      `"${a.trial_ends_at ? a.trial_ends_at.split('T')[0] : ''}"`,
      a.stats?.studentsCount ?? 0,
      a.stats?.staffCount ?? 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `academies_platform_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered academies list
  const filteredAcademies = academies.filter(a => {
    const matchesSearch = 
      (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.owner?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.owner?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone || '').includes(searchQuery);

    if (!matchesSearch) return false;

    const isActive = a.is_active !== undefined ? a.is_active : ((a as any).isActive ?? true);
    const daysRemaining = a.days_remaining ?? (a as any).daysRemaining ?? 0;
    const isRevoked = a.subscription_status === 'revoked' || !isActive;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return !isRevoked && a.subscription_status === 'active';
    if (statusFilter === 'trial') return !isRevoked && a.subscription_status === 'trial' && daysRemaining > 0;
    if (statusFilter === 'expired') return !isRevoked && (a.subscription_status === 'expired' || daysRemaining <= 0);
    if (statusFilter === 'revoked') return isRevoked;

    return true;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div 
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Platform Super Admin Oversight
            </h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0 0' }}>
              Global SaaS multi-tenant supervisor &bull; Monitor all academies, trial lifecycles, and access control
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              background: '#10B981',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Row */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}
      >
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Academies</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>
            {stats?.totalAcademies ?? academies.length}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Active on platform
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active 30-Day Trials</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#059669' }}>
            {stats?.activeTrials ?? academies.filter(a => {
              const isActive = a.is_active !== undefined ? a.is_active : ((a as any).isActive ?? true);
              const days = a.days_remaining ?? (a as any).daysRemaining ?? 0;
              return isActive && a.subscription_status === 'trial' && days > 0;
            }).length}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            In evaluation window
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Expired Trials</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626' }}>
            {stats?.expiredTrials ?? academies.filter(a => {
              const isActive = a.is_active !== undefined ? a.is_active : ((a as any).isActive ?? true);
              const days = a.days_remaining ?? (a as any).daysRemaining ?? 0;
              return isActive && (a.subscription_status === 'expired' || days <= 0);
            }).length}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Requires trial extension
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Revoked Access</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#E11D48' }}>
            {stats?.revokedAcademies ?? academies.filter(a => {
              const isActive = a.is_active !== undefined ? a.is_active : ((a as any).isActive ?? true);
              return a.subscription_status === 'revoked' || !isActive;
            }).length}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Suspended or blocked
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 2px 4px rgba(15,23,42,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Enrolled Students</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED' }}>
            {stats?.totalStudents ?? academies.reduce((acc, a) => acc + (a.stats?.studentsCount || 0), 0)}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
            Across all tenant academies
          </div>
        </div>
      </div>

      {/* Directory & Management Table Card */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(15,23,42,0.04)',
          overflow: 'hidden'
        }}
      >
        {/* Table Controls Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                placeholder="Search academy, owner, slug, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 10 }} />
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { id: 'all', label: 'All Academies' },
                { id: 'trial', label: 'Active Trials' },
                { id: 'active', label: 'Paid Subscriptions' },
                { id: 'expired', label: 'Expired' },
                { id: 'revoked', label: 'Revoked' }
              ].map(chip => {
                const isActive = statusFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setStatusFilter(chip.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: isActive ? '#0F172A' : '#F8FAFC',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Showing {filteredAcademies.length} of {academies.length} academies
          </div>
        </div>

        {/* Academies Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Academy &amp; Slug</th>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Owner Contact</th>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subscription Status</th>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trial Window</th>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enrollment</th>
                <th style={{ padding: '12px 18px', fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAcademies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: 13.5 }}>
                    {loading ? 'Loading platform academies...' : 'No academies found matching your search and filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredAcademies.map(a => {
                  const isActive = a.is_active !== undefined ? a.is_active : ((a as any).isActive ?? true);
                  const daysRemaining = a.days_remaining ?? (a as any).daysRemaining ?? 0;
                  const isRevoked = a.subscription_status === 'revoked' || !isActive;
                  const isExpired = !isRevoked && (a.subscription_status === 'expired' || daysRemaining <= 0);
                  const isActiveSub = !isRevoked && a.subscription_status === 'active';
                  const isTrial = !isRevoked && a.subscription_status === 'trial' && daysRemaining > 0;

                  return (
                    <tr 
                      key={a.id} 
                      style={{ 
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Academy Name & Slug */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div 
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: '#0F172A',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0
                            }}
                          >
                            {(a.name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                              {a.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>slug:</span>
                              <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>{a.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {a.owner?.full_name || a.owner?.username || 'Academy Admin'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {a.owner?.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Mail size={11} /> {a.owner.email}
                            </span>
                          )}
                          {(a.owner?.phone || a.phone) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Phone size={11} /> {a.owner?.phone || a.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subscription Status Badge */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {isRevoked ? (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA'
                            }}
                          >
                            <ShieldAlert size={12} /> Access Revoked
                          </span>
                        ) : isActiveSub ? (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: '#ECFDF5',
                              color: '#047857',
                              border: '1px solid #A7F3D0'
                            }}
                          >
                            <CheckCircle size={12} /> Active Subscription
                          </span>
                        ) : isTrial ? (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: daysRemaining <= 7 ? '#FFFBEB' : '#ECFDF5',
                              color: daysRemaining <= 7 ? '#B45309' : '#047857',
                              border: daysRemaining <= 7 ? '1px solid #FDE68A' : '1px solid #A7F3D0'
                            }}
                          >
                            <Clock size={12} /> {daysRemaining} Days Remaining
                          </span>
                        ) : (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA'
                            }}
                          >
                            <AlertCircle size={12} /> Trial Expired
                          </span>
                        )}
                      </td>

                      {/* Trial Window Dates */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, color: '#334155' }}>
                          Ends: <strong>{a.trial_ends_at ? a.trial_ends_at.split('T')[0] : 'None'}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          Started: {a.trial_started_at ? a.trial_started_at.split('T')[0] : 'N/A'}
                        </div>
                      </td>

                      {/* Metrics (Students & Staff) */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                          {a.stats?.studentsCount ?? 0} Students
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {a.stats?.staffCount ?? 0} Faculty / Staff
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenExtendModal(a)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 12px',
                              borderRadius: 8,
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#0F172A',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#0F172A';
                              e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#F1F5F9';
                              e.currentTarget.style.color = '#0F172A';
                            }}
                          >
                            <CalendarPlus size={13} />
                            <span>Extend Trial</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleRevoke(a)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 12px',
                              borderRadius: 8,
                              background: isRevoked ? '#ECFDF5' : '#FEF2F2',
                              border: isRevoked ? '1px solid #A7F3D0' : '1px solid #FECACA',
                              color: isRevoked ? '#047857' : '#DC2626',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isRevoked ? (
                              <>
                                <UserCheck size={13} />
                                <span>Restore</span>
                              </>
                            ) : (
                              <>
                                <UserX size={13} />
                                <span>Revoke</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXTEND TRIAL MODAL - STRICT FLOATING ISLAND ARCHITECTURE                  */}
      {/* ========================================================================= */}
      {selectedAcademyForExtension && (
        <div 
          className="floating-island-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedAcademyForExtension(null);
          }}
        >
          <div 
            className="floating-island-container"
            style={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              width: '100%',
              maxWidth: 540
            }}
          >
            {/* Island 1: Deep Navy Header Card */}
            <div
              style={{
                background: '#0F172A',
                borderRadius: 16,
                padding: '16px 20px',
                color: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(15,23,42,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    Extend Academy Trial
                  </h3>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0 0' }}>
                    {selectedAcademyForExtension.name} &bull; {selectedAcademyForExtension.slug}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAcademyForExtension(null)}
                style={{
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  width: 32,
                  height: 32,
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Notice / Status Island */}
            <div
              style={{
                background: '#F0FDF4',
                borderRadius: 14,
                border: '1px solid #BBF7D0',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 12,
                color: '#166534',
                boxShadow: '0 4px 12px rgba(15,23,42,0.03)'
              }}
            >
              <Clock size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700 }}>Current Trial Expiration:</span>{' '}
                {selectedAcademyForExtension.trial_ends_at 
                  ? new Date(selectedAcademyForExtension.trial_ends_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Not set'
                } ({selectedAcademyForExtension.days_remaining} days remaining). Extending trial instantly restores all administrative mutating operations.
              </div>
            </div>

            {/* Island 3: Form Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '20px 22px',
                boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {/* Preset Selection Chips */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Select Extension Window
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { value: 7, label: '+7 Days' },
                    { value: 14, label: '+14 Days' },
                    { value: 30, label: '+30 Days' },
                    { value: 'custom', label: 'Custom Date' }
                  ].map(preset => {
                    const isSelected = extensionPreset === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setExtensionPreset(preset.value as any)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 10,
                          border: isSelected ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                          background: isSelected ? '#0F172A' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center'
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Picker if selected */}
              {extensionPreset === 'custom' && (
                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <ModernDatePicker
                    label="Target Trial Expiration Date"
                    value={customEndDate}
                    onChange={setCustomEndDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              )}

              {/* Notes / Reason */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                  Administrative Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extended for prospective enterprise contract review"
                  value={extensionNotes}
                  onChange={e => setExtensionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '2px 4px'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedAcademyForExtension(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 9999,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmExtension}
                style={{
                  padding: '9px 22px',
                  borderRadius: 9999,
                  background: '#0F172A',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <Check size={14} />
                <span>Confirm Trial Extension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
