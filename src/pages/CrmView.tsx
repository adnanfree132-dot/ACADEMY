import React, { useState } from 'react';
import { CRMLead } from '../types';
import { UserPlus, Plus, Phone, Filter, X } from 'lucide-react';

interface CrmViewProps {
  leads: CRMLead[];
  onAddLead: (data: any) => void;
}

export const CrmView: React.FC<CrmViewProps> = ({ leads, onAddLead }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetClass, setTargetClass] = useState('Grade 9');
  const [source, setSource] = useState('Walk-in');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({ studentName, parentName, phone, targetClass, source });
    setStudentName('');
    setParentName('');
    setPhone('');
    setIsModalOpen(false);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Inquiries & Admissions CRM</h2>
          <p style={{ fontSize: 13, color: '#64748B' }}>Track prospective student inquiries, trial classes, and conversion funnel</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add New Inquiry
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student & Parent</th>
              <th>Phone Contact</th>
              <th>Target Class</th>
              <th>Inquiry Source</th>
              <th>Date</th>
              <th>Lead Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>{lead.studentName}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Parent: {lead.parentName}</div>
                </td>
                <td>{lead.phone}</td>
                <td><span className="badge badge-gray">{lead.targetClass}</span></td>
                <td>{lead.source}</td>
                <td>{lead.date}</td>
                <td><span className="badge badge-blue">{lead.status}</span></td>
                <td>
                  <button className="btn-secondary btn-sm">Follow Up</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Add New Inquiry</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Prospective Student Name *</label>
                <input className="form-input" required value={studentName} onChange={e => setStudentName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Parent Name</label>
                  <input className="form-input" value={parentName} onChange={e => setParentName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" required value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Target Class</label>
                  <input className="form-input" value={targetClass} onChange={e => setTargetClass(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={source} onChange={e => setSource(e.target.value)}>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" style={{ marginTop: 16, height: 44, justifyContent: 'center' }}>
                Save Inquiry Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
