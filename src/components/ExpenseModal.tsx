import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  Check, 
  DollarSign, 
  Calendar, 
  Tag, 
  Building, 
  Info,
  Hash
} from 'lucide-react';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { Expense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    category: string;
    title: string;
    amount: number;
    expense_date: string;
    payment_method: string;
    reference_number?: string;
    payee_name?: string;
    notes?: string;
  }) => Promise<void>;
  expenseToEdit?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit
}) => {
  const [category, setCategory] = useState<string>(expenseToEdit?.category || 'Utilities');
  const [title, setTitle] = useState<string>(expenseToEdit?.title || '');
  const [amount, setAmount] = useState<number>(expenseToEdit?.amount || 0);
  const [expenseDate, setExpenseDate] = useState<string>(
    expenseToEdit?.expense_date 
      ? new Date(expenseToEdit.expense_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(expenseToEdit?.payment_method || 'cash');
  const [referenceNumber, setReferenceNumber] = useState<string>(expenseToEdit?.reference_number || '');
  const [payeeName, setPayeeName] = useState<string>(expenseToEdit?.payee_name || '');
  const [notes, setNotes] = useState<string>(expenseToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryOptions: ModernSelectOption[] = [
    { value: 'Utilities', label: 'Utilities (Electricity, Internet, Water)' },
    { value: 'Rent', label: 'Campus Rent / Lease' },
    { value: 'Maintenance', label: 'Maintenance & Repairs' },
    { value: 'Supplies', label: 'Academic & Office Supplies' },
    { value: 'Miscellaneous', label: 'Miscellaneous / Other' }
  ];

  const paymentMethodOptions: ModernSelectOption[] = [
    { value: 'cash', label: 'Cash Payment' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online / Card Payment' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        category,
        title: title.trim(),
        amount: Number(amount),
        expense_date: expenseDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        payee_name: payeeName.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="floating-island-overlay" onClick={onClose}>
      <div 
        className="floating-island-container"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Island 1: Header Card */}
        <div className="island-header-card">
          <div className="island-header-left">
            <span className="island-header-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
              <Receipt size={12} /> Institutional Expense
            </span>
            <h3 className="island-header-title">
              {expenseToEdit ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>
            <p className="island-header-sub">
              Log academy operational and maintenance expenditures
            </p>
          </div>
          <button
            type="button"
            className="island-close-btn"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Form Card */}
        <div className="island-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div 
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Info size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Expense Category <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <ModernSelect
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                placeholder="Select category"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Expense Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Expense Title / Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. August Electricity Bill, Science Lab Reagents, Printing Paper"
              style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Amount (PKR) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    paddingLeft: 42,
                    fontSize: 14,
                    fontWeight: 700
                  }}
                  required
                />
                <span style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8', fontWeight: 700, fontSize: 12 }}>
                  PKR
                </span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Payment Method
              </label>
              <ModernSelect
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Payee / Vendor Name
              </label>
              <input
                type="text"
                className="form-input"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. K-Electric, City Stationary, Landlord"
                style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                Reference / Receipt #
              </label>
              <input
                type="text"
                className="form-input"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. INV-2026-990, BILL-0881"
                style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
              Notes / Memo
            </label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks regarding this expenditure"
              style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Island 4: Floating Action Pill Row */}
        <div className="island-pill-row" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ borderRadius: 9999, padding: '9px 22px', fontSize: 13, fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || amount <= 0}
            style={{
              borderRadius: 9999,
              padding: '9px 24px',
              fontSize: 13,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Check size={15} />
            <span>{isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
