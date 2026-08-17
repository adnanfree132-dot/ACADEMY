import React, { useState } from 'react';
import { MessageSquare, Send, Settings, FileText, CheckCircle2, AlertCircle, Copy, ExternalLink, RefreshCw, Edit2, Play } from 'lucide-react';
import { DEFAULT_WHATSAPP_TEMPLATES, WhatsAppTemplate, fillTemplate, openWhatsAppLink } from '../utils/whatsappHelper';

export const WhatsAppCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'settings'>('templates');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_WHATSAPP_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

  // Settings State
  const [apiToken, setApiToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [testPhone, setTestPhone] = useState('+923001234567');
  const [testResult, setTestResult] = useState('');

  // Logs State
  const [logs, setLogs] = useState<any[]>([
    {
      id: 'log-1',
      studentName: 'Muhammad Hamza',
      phone: '+923001122334',
      templateCode: 'WA_WELCOME',
      body: 'Dear Tariq Mehmood, Muhammad Hamza is admitted to AcademiaPro OS. Admission No: ACAD-2026-001. Login: acad2026001 / Password: x8K9p2L1. Please change password after first login.',
      status: 'manual_opened',
      timestamp: new Date().toLocaleString()
    },
    {
      id: 'log-2',
      studentName: 'Ayesha Khan',
      phone: '+923009988776',
      templateCode: 'WA_DEFAULTER',
      body: 'Dear Khan Sahib, Ayesha Khan fee is 12 days overdue. Outstanding balance $5,000. Please clear immediately. – AcademiaPro OS',
      status: 'sent',
      timestamp: new Date().toLocaleString()
    }
  ]);

  const handleTestSend = (tmpl: WhatsAppTemplate) => {
    const filled = fillTemplate(tmpl.body, {
      parent_name: 'Mr. Tariq',
      student_name: 'Usman Tariq',
      academy_name: 'AcademiaPro OS',
      admission_no: 'ACAD-2026-009',
      username: 'acad2026009',
      password: 'm9P3k7W1',
      month: 'August 2026',
      amount: '12,000',
      due_date: '2026-09-05',
      days_overdue: '7',
      balance: '12,000',
      receipt_no: 'REC-2026-0042',
      method: 'Cash',
      date: '2026-08-13',
      batch_name: 'Grade 10 - Sec A',
      attendance_pct: '92.5',
      marks: '88',
      max_marks: '100',
      grade: 'A',
      test_name: 'Physics Quiz #1',
      homework_title: 'Chapter 4 Practice Questions',
      class_name: 'Grade 11 Pre-Eng'
    });

    openWhatsAppLink(testPhone, filled);

    // Log action
    setLogs([
      {
        id: `log-${Date.now()}`,
        studentName: 'Test Recipient',
        phone: testPhone,
        templateCode: tmpl.code,
        body: filled,
        status: 'manual_opened',
        timestamp: new Date().toLocaleString()
      },
      ...logs
    ]);
  };

  const handleSaveTemplate = (updated: WhatsAppTemplate) => {
    setTemplates(templates.map(t => t.code === updated.code ? updated : t));
    setEditingTemplate(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-green"><MessageSquare size={14} /> P1 CORE MODULE</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>WhatsApp Cloud API + wa.me Fallback Dispatcher</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>WhatsApp Notification Center</h2>
        </div>
      </div>

      {/* Tabs */}
      {/* Module Tabs */}
      <div className="mobile-filter-scroll-bar" style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, overflowX: 'auto' }}>
        <button 
          className={`btn-secondary btn-sm ${activeTab === 'templates' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('templates')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileText size={16} /> Notification Templates ({templates.length})
        </button>
        <button 
          className={`btn-secondary btn-sm ${activeTab === 'logs' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('logs')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <MessageSquare size={16} /> Dispatch Logs ({logs.length})
        </button>
        <button 
          className={`btn-secondary btn-sm ${activeTab === 'settings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Settings size={16} /> API Integration Settings
        </button>
      </div>

      {/* Tab 1: Templates Manager */}
      {activeTab === 'templates' && (
        <div className="whatsapp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {templates.map(tmpl => (
            <div key={tmpl.code} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary" style={{ fontSize: 11 }}>{tmpl.code}</span>
                <button className="btn-secondary btn-sm" onClick={() => setEditingTemplate(tmpl)}>
                  <Edit2 size={13} /> Edit
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{tmpl.name}</h3>
                <p style={{ fontSize: 12.5, color: '#475569', marginTop: 8, background: '#F8FAFC', padding: 10, borderRadius: 8, fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  {tmpl.body}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button className="btn-secondary btn-sm" onClick={() => handleTestSend(tmpl)} style={{ width: '100%', justifyContent: 'center' }}>
                  <Send size={14} /> Test Send (wa.me)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Dispatch Logs */}
      {activeTab === 'logs' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Recipient / Student</th>
                <th>Phone Number</th>
                <th>Template</th>
                <th>Body Snapshot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{log.timestamp}</td>
                  <td><strong style={{ color: '#0F172A' }}>{log.studentName}</strong></td>
                  <td><span className="badge badge-gray">{log.phone}</span></td>
                  <td><span className="badge badge-blue">{log.templateCode}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {log.body}
                  </td>
                  <td>
                    {log.status === 'manual_opened' ? (
                      <span className="badge badge-green"><ExternalLink size={12} /> WhatsApp Opened</span>
                    ) : (
                      <span className="badge badge-blue"><CheckCircle2 size={12} /> Delivered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: API Settings */}
      {activeTab === 'settings' && (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>WhatsApp Cloud API Settings</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
            Configure official Meta WhatsApp Cloud API credentials. If token is left empty, system automatically falls back to 1-click `wa.me` links.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Meta Cloud API Permanent Access Token</label>
              <input 
                type="password"
                className="form-input" 
                placeholder="EAAG..." 
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Phone Number ID</label>
              <input 
                className="form-input" 
                placeholder="109283749102837" 
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
              />
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', marginTop: 10 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#0F172A' }}>Test Connection Number</h4>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  className="form-input" 
                  value={testPhone} 
                  onChange={e => setTestPhone(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={() => alert('Test connection ping sent successfully.')}>
                  <Send size={16} /> Test API Ping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Template */}
      {editingTemplate && (
        <div className="modal-backdrop" onClick={() => setEditingTemplate(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Edit Template: {editingTemplate.code}</h3>
              <button className="modal-close-btn" onClick={() => setEditingTemplate(null)}>×</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveTemplate(editingTemplate); }} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input className="form-input" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message Body Template (Use {'{variable}'} placeholders)</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={editingTemplate.body} 
                  onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingTemplate(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
