import React, { useState } from 'react';
import { CRMLead } from '../types';
import { UserPlus, Plus, Phone, Filter, X, MessageSquare, ExternalLink, Calendar, CheckCircle, Clock } from 'lucide-react';

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
  const [activeContactLeadId, setActiveContactLeadId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({ studentName, parentName, phone, targetClass, source });
    setStudentName('');
    setParentName('');
    setPhone('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted':
        return <span className="badge badge-green">✓ Converted</span>;
      case 'contacted':
        return <span className="badge badge-blue">💬 Contacted</span>;
      default:
        return <span className="badge badge-amber">⚡ New Lead</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="directory-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Inquiries & Admissions CRM</h2>
            <span className="badge badge-primary">{leads.length} Total</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Track prospective student inquiries, trial classes, and conversion funnel</p>
        </div>
        <div className="header-action-bar">
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add New Inquiry
          </button>
        </div>
      </div>

      {/* Mobile Card List (Visible on screens < 768px) */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {leads.map(lead => (
          <div key={lead.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
                  {lead.studentName?.charAt(0) || 'L'}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{lead.studentName}</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Parent: {lead.parentName || 'N/A'}</div>
                </div>
              </div>
              <div>
                {getStatusBadge(lead.status)}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, fontSize: 12 }}>
              <span className="badge badge-gray">🎯 {lead.targetClass}</span>
              <span className="badge badge-gray">📍 {lead.source}</span>
              {lead.date && <span className="badge badge-gray">📅 {lead.date}</span>}
            </div>

            {/* Quick Contact & Action Buttons */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 10, position: 'relative' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => setActiveContactLeadId(activeContactLeadId === lead.id ? null : lead.id)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    fontWeight: 700,
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Phone size={14} color="#059669" /> Contact {lead.phone}
                </button>

                {/* Dual Option Contact Popover */}
                {activeContactLeadId === lead.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      boxShadow: '0 12px 28px -4px rgba(15,23,42,0.18)',
                      padding: 6,
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.studentName)},%20regarding%20your%20inquiry%20at%20AcademiaPro:`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setActiveContactLeadId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#F0FDF4',
                        color: '#166534',
                        fontSize: 12.5,
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <MessageSquare size={15} color="#16A34A" /> 💬 WhatsApp Chat
                    </a>
                    <a
                      href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={() => setActiveContactLeadId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        fontSize: 12.5,
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={15} color="#2563EB" /> 📞 Mobile Call
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Data Table (Visible on screens >= 768px) */}
      <div className="data-table-container desktop-only">
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
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{lead.phone}</span>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Chat"
                      style={{ color: '#16A34A', display: 'flex', alignItems: 'center' }}
                    >
                      <MessageSquare size={14} />
                    </a>
                  </div>
                </td>
                <td><span className="badge badge-gray">{lead.targetClass}</span></td>
                <td>{lead.source}</td>
                <td>{lead.date}</td>
                <td>{getStatusBadge(lead.status)}</td>
                <td>
                  <a
                    href={`tel:${lead.phone}`}
                    className="btn-secondary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Phone size={12} /> Call
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal with Floating Island Architecture */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            {/* Island 1: Floating Header */}
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 20px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-emerald">CRM</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Add New Inquiry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 2: Form Card */}
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Prospective Student Name *</label>
                  <input className="form-input" placeholder="e.g. Hamza Ali" required value={studentName} onChange={e => setStudentName(e.target.value)} />
                </div>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Parent Name</label>
                    <input className="form-input" placeholder="e.g. Tariq Ali" value={parentName} onChange={e => setParentName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Phone Number *</label>
                    <input className="form-input" placeholder="+92 300 1234567" required value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Target Class</label>
                    <input className="form-input" value={targetClass} onChange={e => setTargetClass(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Inquiry Source</label>
                    <select className="form-select" value={source} onChange={e => setSource(e.target.value)}>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Facebook">Facebook / Social</option>
                      <option value="Referral">Friend / Referral</option>
                      <option value="Website">Website / Google</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 9999 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ borderRadius: 9999 }}>
                    ✓ Save Inquiry Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

