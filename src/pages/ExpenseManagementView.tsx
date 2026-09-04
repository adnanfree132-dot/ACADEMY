import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  DollarSign, 
  Building, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  TrendingDown, 
  FileText,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { Expense, ExpenseSummary } from '../types';
import { api, peekApiCache } from '../api/apiClient';
import { ExpenseModal } from '../components/ExpenseModal';
import { ModernSelect, ModernSelectOption } from '../components/ModernSelect';
import { exportToCSV } from '../utils/csvExporter';
import { formatCurrencyPKR } from '../utils/payrollUiUtils';

export const ExpenseManagementView: React.FC = () => {
  // Derive prior completed month as default
  const getDefaultMonthPeriod = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultMonthPeriod());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>(() => peekApiCache<Expense[]>(`/expenses?month_period=${getDefaultMonthPeriod()}`) || []);
  const [summary, setSummary] = useState<ExpenseSummary>({
    total_expenses: 0,
    salaries_total: 0,
    operational_total: 0,
    category_breakdown: {}
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [monthCollections, setMonthCollections] = useState(0);

  // Month period options: last 12 completed months
  const monthOptions: ModernSelectOption[] = (() => {
    const opts: ModernSelectOption[] = [{ value: 'all', label: 'All Time Records' }];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label: `${label} (Arrears)` });
    }
    return opts;
  })();

  const categories = [
    { id: 'all', label: 'All Outflows' },
    { id: 'Salaries', label: 'Salaries' },
    { id: 'Utilities', label: 'Utilities' },
    { id: 'Rent', label: 'Rent' },
    { id: 'Maintenance', label: 'Maintenance' },
    { id: 'Supplies', label: 'Supplies' },
    { id: 'Miscellaneous', label: 'Miscellaneous' }
  ];

  const loadExpenses = async () => {
    setIsLoading(prev => expenses.length === 0 ? true : prev);
    try {
      const [list, sum] = await Promise.all([
        api.getExpenses({
          month_period: selectedMonth !== 'all' ? selectedMonth : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined
        }).catch(() => []),
        api.getExpenseSummary({
          month_period: selectedMonth !== 'all' ? selectedMonth : undefined
        }).catch(() => ({
          total_expenses: 0,
          salaries_total: 0,
          operational_total: 0,
          category_breakdown: {}
        }))
      ]);

      setExpenses(list || []);
      setSummary(sum);
      const pays = await api.getPayments().catch(() => []);
      const prefix = selectedMonth !== 'all' ? selectedMonth : '';
      const collected = (pays || []).reduce((s: number, p: any) => {
        if (p.voided_at) return s;
        const d = String(p.paid_at || '').slice(0, 7);
        if (prefix && d !== prefix) return s;
        return s + Number(p.amount || 0);
      }, 0);
      setMonthCollections(collected);
    } catch (err) {
      console.warn('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadExpenses();
  };

  const handleSaveExpense = async (data: any) => {
    if (expenseToEdit) {
      setExpenses(prev => prev.map(e => e.id === expenseToEdit.id ? { ...e, ...data } : e));
      await api.updateExpense(expenseToEdit.id, data);
    } else {
      const tempId = 'temp-' + Date.now();
      const optimisticExp: Expense = {
        id: tempId,
        category: data.category,
        title: data.title,
        amount: data.amount,
        expense_date: data.expense_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        payee_name: data.payee_name,
        month_period: selectedMonth !== 'all' ? selectedMonth : undefined,
        notes: data.notes
      };
      setExpenses(prev => [optimisticExp, ...prev]);
      setSummary(prev => ({
        ...prev,
        total_expenses: prev.total_expenses + data.amount,
        operational_total: data.category === 'Salaries' ? prev.operational_total : prev.operational_total + data.amount,
        salaries_total: data.category === 'Salaries' ? prev.salaries_total + data.amount : prev.salaries_total
      }));

      const created = await api.createExpense({
        ...data,
        month_period: selectedMonth !== 'all' ? selectedMonth : undefined
      });
      if (created?.id) {
        setExpenses(prev => prev.map(e => e.id === tempId ? created : e));
      }
    }
    loadExpenses();
  };

  const handleDeleteExpense = async (id: string, isSalaryAuto: boolean) => {
    if (isSalaryAuto) {
      alert('This expense is linked to an active salary disbursement. To void this salary expense, please delete the disbursement installment from the Staff Payroll module.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    const expToDelete = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (expToDelete) {
      setSummary(prev => ({
        ...prev,
        total_expenses: Math.max(0, prev.total_expenses - expToDelete.amount),
        operational_total: expToDelete.category === 'Salaries' ? prev.operational_total : Math.max(0, prev.operational_total - expToDelete.amount)
      }));
    }

    try {
      await api.deleteExpense(id);
    } catch (err) {
      console.warn('Failed to delete expense:', err);
      loadExpenses();
    }
  };

  const handleExportCSV = () => {
    const data = expenses.map(e => ({
      Date: new Date(e.expense_date).toISOString().split('T')[0],
      Title: e.title,
      Category: e.category,
      Amount: e.amount,
      PaymentMethod: e.payment_method,
      Reference: e.reference_number || 'N/A',
      Payee: e.payee_name || 'N/A',
      Period: e.month_period || 'N/A',
      Notes: e.notes || ''
    }));
    exportToCSV(`academy_expenses_${selectedMonth}`, data);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Salaries':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'Utilities':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'Rent':
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      case 'Maintenance':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
      case 'Supplies':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      default:
        return { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Header Bar */}
      <div className="directory-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Institutional Expenses
            </h2>
            <span 
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                padding: '2px 10px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {expenses.length} Records
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, margin: 0 }}>
            Centralized tracking of academy operational expenditures and automated staff salary disbursements.
          </p>
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
            Month P&amp;L (read-only): collections {formatCurrencyPKR(monthCollections)} − expenses {formatCurrencyPKR(summary.total_expenses)} = {formatCurrencyPKR(monthCollections - summary.total_expenses)}
          </div>
        </div>

        <div className="header-action-bar">
          {/* Month Arrears Selector */}
          <div style={{ width: 220 }}>
            <ModernSelect
              options={monthOptions}
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          {/* Export CSV */}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            style={{ height: 38, fontSize: 12.5, fontWeight: 700, borderRadius: 10 }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Primary Add Expense CTA */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setExpenseToEdit(null);
              setIsModalOpen(true);
            }}
            style={{ height: 38, fontSize: 12.5, fontWeight: 700, borderRadius: 10 }}
          >
            <Plus size={15} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Analytics Cards */}
      <div 
        className="card-grid-3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 14,
          width: '100%'
        }}
      >
        {/* Card 1: Total Expenditures */}
        <div 
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Expenditures
            </span>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#F1F5F9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
            {formatCurrencyPKR(summary.total_expenses)}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            All outflows logged for {selectedMonth === 'all' ? 'all time' : selectedMonth}
          </div>
        </div>

        {/* Card 2: Staff Salary Outflows (Auto-Disbursements) */}
        <div 
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Staff Salary Outflows
            </span>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 6 }}>
            {formatCurrencyPKR(summary.salaries_total)}
          </div>
          <div style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}>
            Auto-synchronized from Staff Payroll disbursements
          </div>
        </div>

        {/* Card 3: Operational Outflows */}
        <div 
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operational Outflows
            </span>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', marginTop: 6 }}>
            {formatCurrencyPKR(summary.operational_total)}
          </div>
          <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>
            Utilities, Rent, Maintenance, and Supplies
          </div>
        </div>
      </div>

      {/* Toolbar & Category Filters */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          padding: '10px 14px',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  borderRadius: 9999,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : '#475569',
                  background: isActive ? '#0F172A' : '#F8FAFC',
                  border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses..."
            style={{
              width: '100%',
              height: 36,
              borderRadius: 10,
              paddingLeft: 32,
              fontSize: 13
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94A3B8', pointerEvents: 'none' }} />
        </form>
      </div>

      {/* Main Expenses Table */}
      <div className="data-table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingLeft: 16 }}>Date</th>
              <th style={{ textAlign: 'left' }}>Title & Payee</th>
              <th style={{ textAlign: 'left' }}>Category</th>
              <th style={{ textAlign: 'left' }}>Payment Method</th>
              <th style={{ textAlign: 'left' }}>Reference #</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && expenses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94A3B8', fontSize: 13 }}>
                  Loading expenses ledger...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No Expenses Found</div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      No expenses found for the selected period and category. Click &quot;Add Expense&quot; to create one.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((item) => {
                const dateObj = new Date(item.expense_date);
                const dateFormatted = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const isSalaryAuto = item.category === 'Salaries' && Boolean(item.staff_member_id);
                const catStyle = getCategoryColor(item.category);

                return (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 16, fontSize: 12.5, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                      {dateFormatted}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{item.title}</div>
                      {item.payee_name && (
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>Payee: {item.payee_name}</div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1, fontStyle: 'italic' }}>&quot;{item.notes}&quot;</div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span 
                        style={{
                          background: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span 
                        style={{
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      >
                        {item.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {item.reference_number || '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {formatCurrencyPKR(item.amount)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {isSalaryAuto ? (
                          <span 
                            style={{
                              background: '#F8FAFC',
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 700
                            }}
                            title="Managed via Staff Payroll disbursements"
                          >
                            Auto-Payroll
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseToEdit(item);
                                setIsModalOpen(true);
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
                              title="Edit Expense"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item.id, false)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: '1px solid #FEE2E2',
                                background: '#FEF2F2',
                                color: '#EF4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Delete Expense"
                            >
                              <Trash2 size={13} />
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

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};
