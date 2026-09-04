import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Layers, 
  FileText, 
  Download, 
  Plus, 
  Search, 
  CheckCircle2, 
  Settings, 
  CreditCard, 
  Building, 
  Briefcase, 
  User, 
  RefreshCw, 
  Clock, 
  Send,
  Zap,
  RotateCcw,
  Globe,
  Lock,
  TrendingDown, 
  ShieldCheck, 
  Receipt, 
  Tags, 
  History,
  Sliders,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { StaffSalaryStructureModal } from '../components/StaffSalaryStructureModal';
import { DigitalPayslipModal } from '../components/DigitalPayslipModal';
import { StaffAdjustmentsManager } from '../components/StaffAdjustmentsManager';
import { ProcessStaffPayrollModal } from '../components/ProcessStaffPayrollModal';
import { ModernSelect, ModernSelectOption } from '../components/ModernSelect';
import { 
  StaffMember, 
  StaffSalaryStructure, 
  StaffSalaryAdjustment, 
  SalaryHead, 
  LiveStaffPayrollRow 
} from '../types';
import { api, peekApiCache } from '../api/apiClient';
import { useEntityRemoved } from '../lib/useEntityRemoved';
import { exportToCSV } from '../utils/csvExporter';
import { formatCurrencyPKR, getGlobalCurrencySymbol } from '../utils/payrollUiUtils';

export const StaffPayrollView: React.FC = () => {
  const currencySymbol = getGlobalCurrencySymbol();
  const [activeTab, setActiveTab] = useState<'register' | 'heads' | 'structures'>('register');

  // Helper to derive prior completed month (e.g. August 2026 when in September 2026)
  const getPriorCompletedMonthPeriod = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0 is Jan, so if now is Sep (8), month is 8 (Aug)
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getPriorCompletedMonthPeriod());
  const [liveRows, setLiveRows] = useState<LiveStaffPayrollRow[]>(() => {
    const cached = peekApiCache<{ rows?: LiveStaffPayrollRow[] }>(`/payroll/live-register?month_period=${getPriorCompletedMonthPeriod()}`);
    return cached?.rows || [];
  });
  const [salaryHeads, setSalaryHeads] = useState<SalaryHead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEntityRemoved((ids) => {
    const gone = new Set(ids);
    setLiveRows(prev => prev.filter(r =>
      !gone.has(r.staff_id) &&
      !gone.has(r.staff_member_id)
    ));
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unprocessed' | 'paid' | 'pending'>('all');

  const loadSalaryHeads = async () => {
    try {
      const heads = await api.getSalaryHeads();
      setSalaryHeads(heads || []);
    } catch (e) {}
  };

  const handleAddHead = async (data: any) => {
    try {
      await api.createSalaryHead(data);
      loadSalaryHeads();
    } catch (e) {}
  };

  const handleUpdateHead = async (data: any) => {
    try {
      await api.updateSalaryHead(data.id, data);
      loadSalaryHeads();
    } catch (e) {}
  };

  const handleToggleHeadStatus = async (id: string, is_active: boolean) => {
    try {
      await api.updateSalaryHead(id, { is_active });
      loadSalaryHeads();
    } catch (e) {}
  };

  const handleDeleteHead = async (id: string) => {
    try {
      await api.deleteSalaryHead(id);
      loadSalaryHeads();
    } catch (e) {}
  };

  // Modal states
  const [isProcessModalOpen, setIsProcessModalOpen] = useState<boolean>(false);
  const [selectedStaffForProcess, setSelectedStaffForProcess] = useState<LiveStaffPayrollRow | null>(null);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState<boolean>(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState<boolean>(false);
  const [selectedStaffForStructure, setSelectedStaffForStructure] = useState<StaffMember | null>(null);

  // Month period dropdown options (last 12 completed months)
  const monthPeriodOptions: ModernSelectOption[] = (() => {
    const opts: ModernSelectOption[] = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label });
    }
    return opts;
  })();

  const loadLiveRegister = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLiveStaffPayrollRegister({
        month_period: selectedMonth
      });
      if (res && Array.isArray(res.rows)) {
        setLiveRows(res.rows);
      } else {
        setLiveRows([]);
      }
    } catch (err) {
      console.warn('Failed to load live staff payroll register:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLiveRegister();
    loadSalaryHeads();
  }, [selectedMonth]);

  // Direct Individual Staff Payroll Processing (0ms Optimistic UI)
  const handleProcessPayroll = async (payload: any) => {
    const targetId = payload.staff_member_id;
    const isPaid = payload.payment_status === 'paid';

    // 0ms Optimistic UI update
    setLiveRows(prev => prev.map(row => {
      if (row.staff_member_id === targetId) {
        return {
          ...row,
          is_processed: true,
          payment_status: isPaid ? 'Paid' : 'Pending',
          net_payable: payload.net_payable,
          total_paid: isPaid ? payload.net_payable : 0,
          total_pending: isPaid ? 0 : payload.net_payable,
          is_published: Boolean(payload.is_published),
          base_salary: payload.base_pay,
          payment_method: payload.payment_method,
          reference_no: payload.reference_no,
          notes: payload.notes,
          custom_earnings: payload.earnings,
          custom_deductions: payload.deductions
        };
      }
      return row;
    }));

    try {
      await api.processIndividualPayroll(payload);
    } catch (err: any) {
      console.error('Failed to save payroll:', err);
      loadLiveRegister();
    }
  };

  // Undo Processed Staff Payroll (0ms Optimistic UI)
  const handleUndoPayroll = async (row: LiveStaffPayrollRow) => {
    if (!window.confirm(`Are you sure you want to undo and revert processed payroll for ${row.full_name} (${row.month_period})? This will reset the record to unprocessed and void any linked expense.`)) {
      return;
    }

    // 0ms Optimistic reset
    setLiveRows(prev => prev.map(r => {
      if (r.staff_member_id === row.staff_member_id) {
        return {
          ...r,
          is_processed: false,
          processed_record_id: null,
          payment_status: 'Unprocessed',
          total_paid: 0,
          total_pending: r.base_salary,
          net_payable: r.base_salary,
          is_published: false,
          custom_earnings: [],
          custom_deductions: []
        };
      }
      return r;
    }));

    try {
      await api.undoIndividualPayroll({
        staff_member_id: row.staff_member_id,
        month_period: selectedMonth
      });
    } catch (err: any) {
      console.error('Failed to undo payroll:', err);
      loadLiveRegister();
    }
  };

  // Toggle Portal Publishing for a single staff member (0ms Optimistic UI)
  const handleTogglePortalPublish = async (row: LiveStaffPayrollRow) => {
    const nextPublishedState = !row.is_published;

    setLiveRows(prev => prev.map(r => {
      if (r.staff_member_id === row.staff_member_id) {
        return { ...r, is_published: nextPublishedState };
      }
      return r;
    }));

    try {
      await api.publishPayrollToPortal({
        month_period: selectedMonth,
        staff_member_id: row.staff_member_id,
        is_published: nextPublishedState
      });
    } catch (err: any) {
      console.error('Failed to update portal publication:', err);
      loadLiveRegister();
    }
  };

  // Bulk Publish All Processed Salaries for this month to Staff Portal
  const handlePublishAllToPortal = async () => {
    const processedCount = liveRows.filter(r => r.is_processed).length;
    if (processedCount === 0) {
      alert('No processed salary records found for this month yet. Process staff payrolls before publishing to portal.');
      return;
    }

    if (!window.confirm(`Publish all ${processedCount} processed salary records for ${selectedMonth} to the Staff Portal? All staff members will be able to view their salary breakdowns immediately.`)) {
      return;
    }

    // 0ms Optimistic UI
    setLiveRows(prev => prev.map(r => r.is_processed ? { ...r, is_published: true } : r));

    try {
      await api.publishPayrollToPortal({
        month_period: selectedMonth,
        is_published: true
      });
    } catch (err: any) {
      console.error('Failed to bulk publish to portal:', err);
      loadLiveRegister();
    }
  };

  // CSV Export
  const handleExportRegisterCSV = () => {
    const exportData = liveRows.map(row => ({
      StaffID: row.staff_id,
      FullName: row.full_name,
      Designation: row.designation,
      StaffType: row.staff_type,
      MonthPeriod: row.month_period,
      BaseSalary: row.base_salary,
      DaysPresent: row.attendance.days_present,
      DaysAbsent: row.attendance.days_absent,
      DaysLate: row.attendance.days_late,
      DaysLeave: row.attendance.days_leave,
      TotalEarnings: row.total_earnings,
      TotalDeductions: row.total_deductions,
      NetPayable: row.net_payable,
      Status: row.payment_status,
      PortalPublished: row.is_published ? 'Yes' : 'No'
    }));
    exportToCSV(`staff_payroll_register_${selectedMonth}`, exportData);
  };

  // Computed summary metrics
  const totalStaffCount = liveRows.length;
  const processedRows = liveRows.filter(r => r.is_processed);
  const totalNetPayable = liveRows.reduce((sum, r) => sum + (r.net_payable || 0), 0);
  const totalPaid = liveRows.reduce((sum, r) => sum + (r.total_paid || 0), 0);
  const totalPending = liveRows.reduce((sum, r) => sum + (r.total_pending || 0), 0);
  const totalPublishedCount = liveRows.filter(r => r.is_published).length;

  // Filtered rows for search & status filter
  const filteredRows = liveRows.filter(row => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      row.full_name.toLowerCase().includes(q) ||
      row.staff_id.toLowerCase().includes(q) ||
      (row.designation || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'unprocessed') return !row.is_processed;
    if (statusFilter === 'paid') return row.is_processed && row.payment_status === 'Paid';
    if (statusFilter === 'pending') return row.is_processed && row.payment_status === 'Pending';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Header & Action Controls */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Staff Payroll & Compensation
          </h2>
          <span 
            style={{
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
              padding: '2px 8px',
              borderRadius: 9999,
              fontSize: 11.5,
              fontWeight: 700
            }}
          >
            {totalStaffCount} Staff
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Month Dropdown */}
          <div style={{ width: 160 }}>
            <ModernSelect
              options={monthPeriodOptions}
              value={selectedMonth}
              onChange={setSelectedMonth}
              compact
            />
          </div>

          {/* Release to Portal */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handlePublishAllToPortal}
            style={{ 
              height: 35, 
              fontSize: 12, 
              fontWeight: 700, 
              borderRadius: 8,
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: totalPublishedCount > 0 ? '#ECFDF5' : '#FFFFFF',
              color: totalPublishedCount > 0 ? '#059669' : '#334155',
              borderColor: totalPublishedCount > 0 ? '#A7F3D0' : '#CBD5E1'
            }}
            title="Publish all processed records for this month to staff portal"
          >
            <Globe size={13} />
            <span>Release to Portal</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportRegisterCSV}
            style={{ height: 35, fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            title="Export CSV"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            className="btn-secondary"
            onClick={loadLiveRegister}
            style={{ height: 35, width: 35, padding: 0, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sleek Horizontal Ribbon with Metrics & Navigation Tabs */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '6px 14px',
          gap: 16,
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Compact Key Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Net:</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{formatCurrencyPKR(totalNetPayable)}</span>
          </div>

          <div style={{ width: 1, height: 14, background: '#E2E8F0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Disbursed:</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#059669' }}>{formatCurrencyPKR(totalPaid)}</span>
          </div>

          <div style={{ width: 1, height: 14, background: '#E2E8F0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Pending:</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#DC2626' }}>{formatCurrencyPKR(totalPending)}</span>
          </div>

          <div style={{ width: 1, height: 14, background: '#E2E8F0' }} />

          <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
            {processedRows.length}/{totalStaffCount} processed
          </div>
        </div>

        {/* Compact Navigation Tabs (Rule 15 Standard) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: '3px 4px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: activeTab === 'register' ? 800 : 500,
              color: activeTab === 'register' ? '#FFFFFF' : '#64748B',
              background: activeTab === 'register' ? '#0F172A' : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <FileText size={12} />
            <span>Register</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heads')}
            style={{
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: activeTab === 'heads' ? 800 : 500,
              color: activeTab === 'heads' ? '#FFFFFF' : '#64748B',
              background: activeTab === 'heads' ? '#0F172A' : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Tags size={12} />
            <span>Salary Heads</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structures')}
            style={{
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: activeTab === 'structures' ? 800 : 500,
              color: activeTab === 'structures' ? '#FFFFFF' : '#64748B',
              background: activeTab === 'structures' ? '#0F172A' : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Briefcase size={12} />
            <span>Packages</span>
          </button>
        </div>
      </div>

      {activeTab === 'register' && (
        <>
          {/* Slim Search & Filter Bar */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              padding: '6px 12px',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: 'relative', width: 240 }}>
                <input
                  type="text"
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff..."
                  style={{
                    width: '100%',
                    height: 32,
                    borderRadius: 8,
                    paddingLeft: 30,
                    fontSize: 12.5
                  }}
                />
                <Search size={13} style={{ position: 'absolute', left: 9, top: 10, color: '#94A3B8', pointerEvents: 'none' }} />
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {(['all', 'unprocessed', 'paid', 'pending'] as const).map((filter) => {
                  const isActive = statusFilter === filter;
                  const labels = {
                    all: 'All',
                    unprocessed: 'Unprocessed',
                    paid: 'Paid',
                    pending: 'Pending'
                  };
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      style={{
                        borderRadius: 9999,
                        padding: '3px 10px',
                        fontSize: 11.5,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#FFFFFF' : '#475569',
                        background: isActive ? '#0F172A' : '#F8FAFC',
                        border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        cursor: 'pointer'
                      }}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
              Showing {filteredRows.length} of {liveRows.length}
            </div>
          </div>

          {/* Live Staff Register Table */}
          <div className="data-table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: 18, minWidth: 240 }}>Staff Member</th>
                  <th style={{ textAlign: 'right', minWidth: 120 }}>Base Salary</th>
                  <th style={{ textAlign: 'center', minWidth: 170 }}>Allowances & Deductions</th>
                  <th style={{ textAlign: 'right', minWidth: 120 }}>Net Payable</th>
                  <th style={{ textAlign: 'center', minWidth: 110 }}>Status</th>
                  <th style={{ textAlign: 'center', minWidth: 120 }}>Portal View</th>
                  <th style={{ textAlign: 'right', paddingRight: 18, minWidth: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && liveRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94A3B8', fontSize: 13 }}>
                      Loading live staff payroll register...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No Staff Records Found</div>
                        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                          {searchQuery ? `No staff matching "${searchQuery}"` : `No active staff found for period ${selectedMonth}.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const initials = row.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const att = row.attendance;
                    const isProcessed = row.is_processed;
                    const isPaid = row.payment_status === 'Paid';
                    const isPending = row.payment_status === 'Pending';

                    return (
                      <tr key={row.staff_member_id}>
                        {/* 1. Staff Member Identity */}
                        <td style={{ paddingLeft: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div 
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                                flexShrink: 0
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                                {row.full_name}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                                <span style={{ fontWeight: 600 }}>{row.staff_id}</span>
                                <span>•</span>
                                <span>{row.designation || row.staff_type}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Base Salary */}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                          {formatCurrencyPKR(row.base_salary)}
                        </td>

                        {/* 3. Earnings & Deductions Adjustment Summary */}
                        <td style={{ textAlign: 'center' }}>
                          {row.total_earnings > 0 || row.total_deductions > 0 ? (
                            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                              {row.total_earnings > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                                  +{currencySymbol} {row.total_earnings.toLocaleString()}
                                </span>
                              )}
                              {row.total_deductions > 0 && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                                  -{currencySymbol} {row.total_deductions.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11.5, color: '#94A3B8' }}>None</span>
                          )}
                        </td>

                        {/* 5. Net Payable */}
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>
                          {formatCurrencyPKR(row.net_payable)}
                        </td>

                        {/* 6. Payment Status */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {!isProcessed ? (
                            <span 
                              style={{
                                background: '#F1F5F9',
                                color: '#475569',
                                border: '1px solid #CBD5E1',
                                padding: '3px 10px',
                                borderRadius: 9999,
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              Unprocessed
                            </span>
                          ) : isPaid ? (
                            <span 
                              style={{
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                padding: '3px 10px',
                                borderRadius: 9999,
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              Paid
                            </span>
                          ) : (
                            <span 
                              style={{
                                background: '#FFFBEB',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                                padding: '3px 10px',
                                borderRadius: 9999,
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </td>

                        {/* 7. Portal Visibility */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {isProcessed ? (
                            row.is_published ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePortalPublish(row)}
                                style={{
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  border: '1px solid #A7F3D0',
                                  borderRadius: 9999,
                                  padding: '3px 9px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                title="Click to hide from staff portal"
                              >
                                <Globe size={12} />
                                <span>On Portal</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePortalPublish(row)}
                                style={{
                                  background: '#F8FAFC',
                                  color: '#64748B',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 9999,
                                  padding: '3px 9px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                title="Click to publish to staff portal"
                              >
                                <Lock size={12} />
                                <span>Hidden</span>
                              </button>
                            )
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>
                          )}
                        </td>

                        {/* 8. Actions (Process Payroll / Edit / Undo / Payslip) */}
                        <td style={{ textAlign: 'right', paddingRight: 18, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {!isProcessed ? (
                              /* Clean Primary "Process Payroll" Action */
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffForProcess(row);
                                  setIsProcessModalOpen(true);
                                }}
                                style={{
                                  background: '#0F172A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                <Zap size={13} />
                                <span>Process Payroll</span>
                              </button>
                            ) : (
                              /* Processed State: Edit, Undo, Payslip Options */
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStaffForProcess(row);
                                    setIsProcessModalOpen(true);
                                  }}
                                  style={{
                                    height: 28,
                                    padding: '0 8px',
                                    borderRadius: 6,
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#334155',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Edit deductions, earnings, or payment details"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUndoPayroll(row)}
                                  style={{
                                    height: 28,
                                    padding: '0 8px',
                                    borderRadius: 6,
                                    border: '1px solid #FECACA',
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Undo processed payroll and reset to unprocessed"
                                >
                                  <RotateCcw size={12} />
                                  <span>Undo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayslipId(row.processed_record_id || `SLIP-${selectedMonth}-${row.staff_id}`);
                                    setIsPayslipModalOpen(true);
                                  }}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: '1px solid #E2E8F0',
                                    background: '#FFFFFF',
                                    color: '#475569',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  title="View / Print Payslip"
                                >
                                  <FileText size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab 2: Deductions & Earnings Heads Manager */}
      {activeTab === 'heads' && (
        <StaffAdjustmentsManager
          salaryHeads={salaryHeads}
          onAddHead={handleAddHead}
          onUpdateHead={handleUpdateHead}
          onToggleHeadStatus={handleToggleHeadStatus}
          onDeleteHead={handleDeleteHead}
        />
      )}

      {/* Tab 3: Contracted Salary Packages */}
      {activeTab === 'structures' && (
        <div className="card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px 20px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 6 }}>
            Contracted Base Salary Packages
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginBottom: 16 }}>
            Define default contracted monthly base salaries for staff members. These serve as the baseline in the Staff Payroll Register.
          </p>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: 16 }}>Staff Member</th>
                  <th style={{ textAlign: 'left' }}>Designation</th>
                  <th style={{ textAlign: 'right' }}>Contracted Base Pay</th>
                  <th style={{ textAlign: 'right', paddingRight: 16 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveRows.map((staff) => (
                  <tr key={staff.staff_member_id}>
                    <td style={{ paddingLeft: 16, fontWeight: 700, color: '#0F172A' }}>
                      {staff.full_name} ({staff.staff_id})
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {staff.designation || staff.staff_type}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                      {formatCurrencyPKR(staff.base_salary)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffForStructure({
                            id: staff.staff_member_id,
                            staff_id: staff.staff_id,
                            full_name: staff.full_name,
                            base_salary: staff.base_salary
                          } as any);
                          setIsStructureModalOpen(true);
                        }}
                        style={{
                          height: 28,
                          padding: '0 10px',
                          borderRadius: 6,
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Edit Package
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process / Edit Staff Payroll Modal */}
      <ProcessStaffPayrollModal
        isOpen={isProcessModalOpen}
        onClose={() => {
          setIsProcessModalOpen(false);
          setSelectedStaffForProcess(null);
        }}
        staffRow={selectedStaffForProcess}
        salaryHeads={salaryHeads}
        onProcess={handleProcessPayroll}
      />

      {/* Digital Payslip Print / View Modal */}
      <DigitalPayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => {
          setIsPayslipModalOpen(false);
          setSelectedPayslipId(null);
        }}
        payslipId={selectedPayslipId}
      />

      {/* Salary Structure Modal */}
      <StaffSalaryStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => {
          setIsStructureModalOpen(false);
          setSelectedStaffForStructure(null);
        }}
        staffMember={selectedStaffForStructure}
        onSaved={loadLiveRegister}
      />
    </div>
  );
};
