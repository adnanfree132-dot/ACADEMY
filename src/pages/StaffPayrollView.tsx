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
  TrendingDown,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { MonthlyBatchPayrollDashboard } from '../components/MonthlyBatchPayrollDashboard';
import { StaffSalaryStructureModal } from '../components/StaffSalaryStructureModal';
import { DigitalPayslipModal } from '../components/DigitalPayslipModal';
import { ModernSelect, ModernSelectOption } from '../components/ModernSelect';
import { StaffMember, StaffSalaryStructure, PayrollBatch } from '../types';
import { api } from '../api/apiClient';
import { exportToCSV } from '../utils/csvExporter';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

export const StaffPayrollView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batch' | 'structures' | 'history'>('batch');

  // Staff & Structure Catalog State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [structures, setStructures] = useState<StaffSalaryStructure[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffType, setSelectedStaffType] = useState<string>('all');
  const [staffTypes, setStaffTypes] = useState<any[]>([]);

  // Modals
  const [selectedStaffForStructure, setSelectedStaffForStructure] = useState<StaffMember | null>(null);
  const [selectedStructureForEdit, setSelectedStructureForEdit] = useState<StaffSalaryStructure | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffs, structs, batchList, types] = await Promise.all([
        api.getStaffList().catch(() => []),
        api.getSalaryStructures().catch(() => []),
        api.getPayrollBatches().catch(() => []),
        api.getStaffTypes().catch(() => [])
      ]);
      setStaffList(staffs || []);
      setStructures(structs || []);
      setBatches(batchList || []);
      setStaffTypes(types || []);
    } catch (err) {
      console.warn('Error loading staff payroll data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportStructuresCSV = () => {
    if (staffList.length === 0) return;
    const rows = staffList.map(s => {
      const struct = structures.find(st => st.staff_member_id === s.id || st.staffMemberId === s.id);
      const base = struct?.base_salary ?? struct?.baseSalary ?? s.base_salary ?? 0;
      const hra = struct?.house_rent_allowance ?? struct?.houseRentAllowance ?? 0;
      const med = struct?.medical_allowance ?? struct?.medicalAllowance ?? 0;
      const conv = struct?.conveyance_allowance ?? struct?.conveyanceAllowance ?? 0;
      const spec = struct?.special_allowance ?? struct?.specialAllowance ?? 0;
      const gross = struct?.gross_salary ?? struct?.grossSalary ?? (base + hra + med + conv + spec);
      const tax = struct?.income_tax ?? struct?.incomeTax ?? 0;
      const pf = struct?.provident_fund ?? struct?.providentFund ?? 0;
      const net = struct?.net_standard_salary ?? struct?.netStandardSalary ?? (gross - (tax + pf));

      return {
        StaffID: s.staff_id,
        FullName: s.full_name,
        Designation: s.designation,
        Department: s.staffType?.name || s.role || 'Staff',
        BaseSalary: base,
        HouseRentAllowance: hra,
        MedicalAllowance: med,
        ConveyanceAllowance: conv,
        SpecialAllowance: spec,
        GrossSalary: gross,
        IncomeTax: tax,
        ProvidentFund: pf,
        NetSalary: net,
        PaymentMethod: struct?.payment_method || s.payment_method || 'Bank Transfer',
        BankName: struct?.bank_name || s.bank_name || 'N/A',
        AccountNumber: struct?.account_number || s.account_number || 'N/A'
      };
    });

    exportToCSV('Staff_Salary_Compensation_Structures', rows);
  };

  const handleExportBatchesCSV = () => {
    if (batches.length === 0) return;
    exportToCSV('Historical_Payroll_Batches', batches.map(b => ({
      BatchCode: b.batch_code,
      Period: b.period,
      StaffCount: b.total_staff_count,
      GrossPayable: b.total_gross_amount,
      AttendanceDeductions: b.total_attendance_deductions,
      TotalAllowances: b.total_allowances,
      NetDisbursement: b.total_net_amount,
      Status: b.status,
      CreatedAt: b.created_at
    })));
  };

  const filteredStaff = staffList.filter(s => {
    const sName = s.full_name || s.fullName || '';
    const sId = s.staff_id || s.staffId || '';
    const sType = s.staff_type_id || s.staffTypeId || '';
    const matchesSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedStaffType === 'all' || sType === selectedStaffType;
    return matchesSearch && matchesType;
  });

  const staffTypeOptions: ModernSelectOption[] = [
    { value: 'all', label: 'All Staff Departments', icon: <Building size={14} color="#64748B" /> },
    ...staffTypes.map(st => ({
      value: st.id,
      label: st.name,
      icon: <Briefcase size={14} color="#2563EB" />
    }))
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header */}
      <div className="directory-header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Staff Payroll & Salaries
            </h2>
            <span
              style={{
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 9999,
                border: '1px solid #E2E8F0'
              }}
            >
              {staffList.length} Members
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Monthly payroll processing, attendance adjustments, itemized salary structures, and payslips
          </p>
        </div>

        <div className="header-action-bar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeTab === 'structures' && (
            <button className="btn-secondary" onClick={handleExportStructuresCSV} style={{ height: 36, fontSize: 12.5, fontWeight: 700, borderRadius: 10 }}>
              <Download size={14} /> Export CSV
            </button>
          )}

          {activeTab === 'history' && (
            <button className="btn-secondary" onClick={handleExportBatchesCSV} style={{ height: 36, fontSize: 12.5, fontWeight: 700, borderRadius: 10 }}>
              <Download size={14} /> Export CSV
            </button>
          )}

          <button className="btn-secondary" onClick={loadData} title="Refresh Data" style={{ height: 36, fontSize: 12.5, fontWeight: 700, borderRadius: 10 }}>
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Active Navy Solid Pill Tabs (Rule 15 Compliance) */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 6, 
          background: '#FFFFFF', 
          border: '1.5px solid #E2E8F0', 
          borderRadius: 12, 
          padding: 5,
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 12,
            fontWeight: activeTab === 'batch' ? 800 : 600,
            cursor: 'pointer',
            background: activeTab === 'batch' ? '#0F172A' : 'transparent',
            color: activeTab === 'batch' ? '#FFFFFF' : '#64748B',
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
        >
          <Calendar size={14} color={activeTab === 'batch' ? '#FFFFFF' : '#64748B'} />
          Monthly Payroll
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('structures')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 12,
            fontWeight: activeTab === 'structures' ? 800 : 600,
            cursor: 'pointer',
            background: activeTab === 'structures' ? '#0F172A' : 'transparent',
            color: activeTab === 'structures' ? '#FFFFFF' : '#64748B',
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
        >
          <Layers size={14} color={activeTab === 'structures' ? '#FFFFFF' : '#64748B'} />
          Salary Packages ({staffList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 12,
            fontWeight: activeTab === 'history' ? 800 : 600,
            cursor: 'pointer',
            background: activeTab === 'history' ? '#0F172A' : 'transparent',
            color: activeTab === 'history' ? '#FFFFFF' : '#64748B',
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
        >
          <FileText size={14} color={activeTab === 'history' ? '#FFFFFF' : '#64748B'} />
          Historical Cycles ({batches.length})
        </button>
      </div>

      {/* Tab 1: 1-Click Monthly Batch Payroll Dashboard */}
      {activeTab === 'batch' && (
        <MonthlyBatchPayrollDashboard 
          onNavigateToStructures={() => setActiveTab('structures')} 
        />
      )}

      {/* Tab 2: Staff Compensation Packages Catalog */}
      {activeTab === 'structures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filter Toolbar */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1.5px solid #E2E8F0',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ width: 240 }}>
              <ModernSelect
                value={selectedStaffType}
                onChange={setSelectedStaffType}
                options={staffTypeOptions}
                compact
              />
            </div>

            <div style={{ position: 'relative', width: 300 }}>
              <Search
                size={14}
                color="#94A3B8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search staff by name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  paddingLeft: 38,
                  paddingRight: 12,
                  fontSize: 12,
                  background: '#FFFFFF',
                  color: '#0F172A',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              />
            </div>
          </div>

          {/* Structures Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Department & Role</th>
                  <th>Base Monthly Salary</th>
                  <th>Itemized Allowances</th>
                  <th>Gross Earnings</th>
                  <th>Monthly Fixed Deductions</th>
                  <th>Net Standard Salary</th>
                  <th>Disbursement Mode</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(staff => {
                  const struct = structures.find(st => st.staff_member_id === staff.id || st.staffMemberId === staff.id);
                  const base = struct?.base_salary ?? struct?.baseSalary ?? staff.base_salary ?? staff.baseSalary ?? 50000;
                  const hra = struct?.house_rent_allowance ?? struct?.houseRentAllowance ?? 0;
                  const med = struct?.medical_allowance ?? struct?.medicalAllowance ?? 0;
                  const conv = struct?.conveyance_allowance ?? struct?.conveyanceAllowance ?? 0;
                  const spec = struct?.special_allowance ?? struct?.specialAllowance ?? 0;
                  const allowancesTotal = hra + med + conv + spec;
                  const gross = struct?.gross_salary ?? struct?.grossSalary ?? (base + allowancesTotal);
                  const tax = struct?.income_tax ?? struct?.incomeTax ?? 0;
                  const pf = struct?.provident_fund ?? struct?.providentFund ?? 0;
                  const other = struct?.other_deductions ?? struct?.otherDeductions ?? 0;
                  const deductionsTotal = tax + pf + other;
                  const net = struct?.net_standard_salary ?? struct?.netStandardSalary ?? Math.max(0, gross - deductionsTotal);
                  const method = (struct?.payment_method || staff.payment_method || 'bank_transfer').replace(/_/g, ' ');

                  return (
                    <tr key={staff.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#2563EB',
                              fontWeight: 800,
                              fontSize: 12
                            }}
                          >
                            {(staff.full_name || staff.fullName || 'S').charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                              {staff.full_name || staff.fullName}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                              {staff.staff_id || staff.staffId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 12 }}>{staff.designation}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{staff.staffType?.name || staff.role || 'Faculty'}</div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5 }}>
                          {formatCurrencyPKR(base)}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: allowancesTotal > 0 ? '#16A34A' : '#64748B', fontSize: 12 }}>
                          {allowancesTotal > 0 ? `+${formatCurrencyPKR(allowancesTotal)}` : 'PKR 0'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 12.5 }}>
                          {formatCurrencyPKR(gross)}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: deductionsTotal > 0 ? '#DC2626' : '#64748B', fontSize: 12 }}>
                          {deductionsTotal > 0 ? `-${formatCurrencyPKR(deductionsTotal)}` : 'PKR 0'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 900, color: '#10B981', fontSize: 13.5 }}>
                          {formatCurrencyPKR(net)}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                          {method}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedStaffForStructure(staff);
                            setSelectedStructureForEdit(struct || null);
                          }}
                        >
                          <Settings size={13} /> Configure Structure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Historical Payroll Batches */}
      {activeTab === 'history' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Payroll Period</th>
                <th>Staff Count</th>
                <th>Gross Payroll Budget</th>
                <th>Attendance Deductions Saved</th>
                <th>Net Disbursement</th>
                <th>Disbursement Status</th>
                <th>Processed On</th>
              </tr>
            </thead>
            <tbody>
              {batches.length > 0 ? (
                batches.map(batch => (
                  <tr key={batch.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                        {batch.batch_code}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#2563EB' }}>
                        {batch.period}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>
                        {batch.total_staff_count} Employees
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        {formatCurrencyPKR(batch.total_gross_amount)}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>
                        -{formatCurrencyPKR(batch.total_attendance_deductions)}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 900, color: '#16A34A', fontSize: 13.5 }}>
                        {formatCurrencyPKR(batch.total_net_amount)}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: batch.status === 'paid' || (batch as any).batch_status === 'disbursed' ? '#DCFCE7' : '#FEF3C7',
                          color: batch.status === 'paid' || (batch as any).batch_status === 'disbursed' ? '#166534' : '#92400E',
                          border: `1px solid ${batch.status === 'paid' || (batch as any).batch_status === 'disbursed' ? '#BBF7D0' : '#FDE68A'}`
                        }}
                      >
                        {(batch as any).batch_status || batch.status || 'Generated'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        {batch.created_at ? batch.created_at.split('T')[0] : '2026-08-25'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#64748B' }}>
                    No historical batches recorded. Generate a 1-click batch from the Monthly Batch Payroll tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary Structure Modal */}
      {selectedStaffForStructure && (
        <StaffSalaryStructureModal
          isOpen={!!selectedStaffForStructure}
          onClose={() => {
            setSelectedStaffForStructure(null);
            setSelectedStructureForEdit(null);
          }}
          staffMember={selectedStaffForStructure}
          initialStructure={selectedStructureForEdit}
          onSaved={saved => {
            setStructures(prev => {
              const existingIdx = prev.findIndex(st => (st.staff_member_id || st.staffMemberId) === (saved.staff_member_id || saved.staffMemberId));
              if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx] = saved;
                return copy;
              }
              return [saved, ...prev];
            });
            setSelectedStaffForStructure(null);
            setSelectedStructureForEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default StaffPayrollView;
