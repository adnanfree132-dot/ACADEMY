import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Settings, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Edit2, 
  Play,
  X,
  Bell,
  Sparkles,
  Users,
  Check,
  Smartphone
} from 'lucide-react';
import { DEFAULT_WHATSAPP_TEMPLATES, WhatsAppTemplate, fillTemplate, openWhatsAppLink } from '../utils/whatsappHelper';
import { api } from '../api/apiClient';

export const WhatsAppCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'absence_dispatcher' | 'settings'>('templates');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_WHATSAPP_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Absence Dispatcher State
  const [dispatchedAlerts, setDispatchedAlerts] = useState<any[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');

  // Settings State
  const [apiToken, setApiToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [testPhone, setTestPhone] = useState('+923001234567');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const fetchWhatsAppCenterData = async () => {
    try {
      setLoading(true);
      const [templatesData, logsData] = await Promise.all([
        api.getWhatsAppTemplates().catch(() => []),
        api.getWhatsAppLogs().catch(() => [])
      ]);

      if (templatesData && templatesData.length > 0) {
        setTemplates(templatesData);
      }
      setLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching WhatsApp Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppCenterData();
  }, []);

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

    const newLog = {
      id: `log-${Date.now()}`,
      studentName: 'Test Recipient',
      phone: testPhone,
      template_name: tmpl.code,
      message: filled,
      status: 'manual_opened',
      created_at: new Date().toISOString()
    };

    setLogs(prev => [newLog, ...prev]);

    api.sendWhatsAppNotification({
      phone: testPhone,
      studentName: 'Test Recipient',
      templateCode: tmpl.code,
      body: filled
    }).catch(err => console.error('Error logging WhatsApp notification:', err));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    // 0ms Optimistic UI update
    setTemplates(prev => prev.map(t => t.code === editingTemplate.code ? editingTemplate : t));
    const target = editingTemplate;
    setEditingTemplate(null);

    try {
      await api.updateWhatsAppTemplate(target.code, {
        name: target.name,
        body: target.body,
        is_active: true
      });
      fetchWhatsAppCenterData();
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleDispatchDailyAbsences = async () => {
    try {
      setIsDispatching(true);
      setDispatchSuccessMsg('');
      const res = await api.dispatchAbsenceAlerts();
      
      if (res?.alerts) {
        setDispatchedAlerts(res.alerts);
        setDispatchSuccessMsg(`Generated ${res.dispatchedCount} automated parent absence notifications for today.`);
      }
      fetchWhatsAppCenterData();
    } catch (err: any) {
      console.error('Error dispatching absence alerts:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            WhatsApp Notification Center
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Automated parent absence alerts, fee reminders, admission notices & WhatsApp Web dispatch gateway
          </p>
        </div>
        <div className="header-action-bar">
          <button 
            className="btn-primary" 
            onClick={handleDispatchDailyAbsences}
            disabled={isDispatching}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={15} /> {isDispatching ? 'Scanning Absences...' : 'Dispatch Daily Absence Alerts'}
          </button>
        </div>
      </div>

      {/* KPI Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Templates</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{templates.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Notifications Logged</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{logs.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Gateway Mode</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', marginTop: 2 }}>wa.me + Direct API</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#86198F', textTransform: 'uppercase' }}>Delivery Reliability</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#A21CAF', marginTop: 2 }}>100% Instant</div>
        </div>
      </div>

      {/* Module Tabs (Rule 15 Solid Navy Pill Standard) */}
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        background: '#FFFFFF', 
        padding: '6px 8px', 
        borderRadius: 12, 
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        boxShadow: '0 1px 3px rgba(15,23,42,0.02)'
      }}>
        <button 
          type="button"
          className="tab-pill"
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'templates' ? '#0F172A' : 'transparent',
            color: activeTab === 'templates' ? '#FFFFFF' : '#64748B',
            fontWeight: activeTab === 'templates' ? 800 : 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={14} color={activeTab === 'templates' ? '#FFFFFF' : '#64748B'} />
          Notification Templates ({templates.length})
        </button>
        <button 
          type="button"
          className="tab-pill"
          onClick={() => setActiveTab('absence_dispatcher')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'absence_dispatcher' ? '#0F172A' : 'transparent',
            color: activeTab === 'absence_dispatcher' ? '#FFFFFF' : '#64748B',
            fontWeight: activeTab === 'absence_dispatcher' ? 800 : 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Bell size={14} color={activeTab === 'absence_dispatcher' ? '#FFFFFF' : '#64748B'} />
          Absence Alerts Dispatcher
        </button>
        <button 
          type="button"
          className="tab-pill"
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'logs' ? '#0F172A' : 'transparent',
            color: activeTab === 'logs' ? '#FFFFFF' : '#64748B',
            fontWeight: activeTab === 'logs' ? 800 : 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <MessageSquare size={14} color={activeTab === 'logs' ? '#FFFFFF' : '#64748B'} />
          Dispatch Logs ({logs.length})
        </button>
        <button 
          type="button"
          className="tab-pill"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'settings' ? '#0F172A' : 'transparent',
            color: activeTab === 'settings' ? '#FFFFFF' : '#64748B',
            fontWeight: activeTab === 'settings' ? 800 : 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Settings size={14} color={activeTab === 'settings' ? '#FFFFFF' : '#64748B'} />
          API Credentials & Settings
        </button>
      </div>

      {/* Tab 1: Templates Grid */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {templates.map(tmpl => (
            <div 
              key={tmpl.code} 
              style={{ 
                background: '#FFFFFF', 
                borderRadius: 14, 
                border: '1px solid #E2E8F0', 
                padding: 16, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10,
                boxShadow: '0 2px 6px rgba(15,23,42,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 700 }}>
                  {tmpl.code}
                </span>
                <button 
                  className="btn-secondary btn-sm" 
                  onClick={() => setEditingTemplate(tmpl)}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999 }}
                >
                  <Edit2 size={12} /> Edit Template
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{tmpl.name}</h3>
                <p style={{ 
                  fontSize: 12, 
                  color: '#475569', 
                  marginTop: 8, 
                  background: '#F8FAFC', 
                  padding: 10, 
                  borderRadius: 10, 
                  fontFamily: 'monospace', 
                  wordBreak: 'break-word',
                  border: '1px solid #E2E8F0',
                  lineHeight: 1.5
                }}>
                  {tmpl.body}
                </p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                <button 
                  className="btn-secondary btn-sm" 
                  onClick={() => handleTestSend(tmpl)} 
                  style={{ width: '100%', justifyContent: 'center', height: 34, borderRadius: 9999 }}
                >
                  <Send size={13} color="#16A34A" /> Test Dispatch (wa.me)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Absence Alerts Dispatcher */}
      {activeTab === 'absence_dispatcher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {dispatchSuccessMsg && (
            <div style={{
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} color="#15803D" />
              {dispatchSuccessMsg}
            </div>
          )}

          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Daily Absentee Notification Queue</h3>
            <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
              Scans all active attendance records marked "Absent" today and generates pre-filled parent WhatsApp notifications.
            </p>

            {dispatchedAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {dispatchedAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: '#F8FAFC', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: 12, 
                      padding: 14, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{alert.studentName}</span>
                        <span className="badge badge-red" style={{ fontSize: 10 }}>Absent Today</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Parent: <strong>{alert.parentName}</strong> &bull; Phone: <span style={{ fontFamily: 'monospace' }}>{alert.phone || 'No phone'}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569', fontStyle: 'italic', marginTop: 4 }}>
                        "{alert.messageBody}"
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => openWhatsAppLink(alert.phone, alert.messageBody)}
                      style={{ borderRadius: 9999, padding: '8px 16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={13} /> Send WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 36, color: '#94A3B8' }}>
                <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <strong style={{ color: '#0F172A' }}>No Pending Absentee Alerts</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "Dispatch Daily Absence Alerts" above to run today's attendance scan.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Dispatch Logs */}
      {activeTab === 'logs' && (
        <div className="data-table-container">
          <table className="data-table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Recipient / Student</th>
                <th>Phone Number</th>
                <th>Template</th>
                <th>Message Snapshot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td style={{ fontSize: 11.5, color: '#64748B' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : new Date().toLocaleString()}
                    </td>
                    <td><strong style={{ color: '#0F172A' }}>{log.student?.full_name || log.studentName || 'Direct Recipient'}</strong></td>
                    <td><span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{log.phone}</span></td>
                    <td><span className="badge badge-blue">{log.template_name || 'MANUAL'}</span></td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5, color: '#475569' }}>
                      {log.message || log.body}
                    </td>
                    <td>
                      <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> Logged / Sent
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                    No WhatsApp notifications logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: API Settings */}
      {activeTab === 'settings' && (
        <div style={{ background: '#FFFFFF', maxWidth: 640, padding: 24, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.03)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Meta WhatsApp Cloud API Settings</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 20 }}>
            Configure official Meta WhatsApp Cloud API credentials. If token is omitted, system operates seamlessly via 1-click `wa.me` links.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                Meta Cloud API Permanent Access Token
              </label>
              <input 
                type="password"
                className="form-input" 
                placeholder="EAAG..." 
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                style={{ height: 38, borderRadius: 10 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                WhatsApp Phone Number ID
              </label>
              <input 
                type="text"
                className="form-input" 
                placeholder="109283749102837" 
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                style={{ height: 38, borderRadius: 10 }}
              />
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', marginTop: 6 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>Test Recipient Number</h4>
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text"
                  className="form-input" 
                  value={testPhone} 
                  onChange={e => setTestPhone(e.target.value)} 
                  style={{ flex: 1, height: 38, borderRadius: 10 }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => openWhatsAppLink(testPhone, 'Hello from AcademiaPro OS! Connection verified.')}
                  style={{ borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px' }}
                >
                  <Send size={14} /> Send Test Ping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4-Island Floating Architecture: Edit Template Modal */}
      {editingTemplate && (
        <div 
          className="floating-island-overlay" 
          onClick={() => setEditingTemplate(null)}
          style={{ zIndex: 1300 }}
        >
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 540 }}
          >
            {/* Island 1: Floating Dark Navy Header */}
            <div style={{ 
              background: '#0F172A', 
              color: '#FFFFFF', 
              padding: '16px 20px', 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                    Edit Template: {editingTemplate.code}
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Configure message body format & variable placeholders
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingTemplate(null)} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: 'none', 
                  color: '#94A3B8', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 3: Form Card */}
            <div style={{ 
              padding: 22, 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1px solid #E2E8F0', 
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              maxHeight: '70vh', 
              overflowY: 'auto' 
            }}>
              <form id="edit-template-form" onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Template Friendly Name
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editingTemplate.name} 
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} 
                    style={{ height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600 }}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Message Body Template (Use placeholders e.g. {'{student_name}'}, {'{parent_name}'}, {'{month}'})
                  </label>
                  <textarea 
                    className="form-input" 
                    rows={5} 
                    value={editingTemplate.body} 
                    onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} 
                    style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.5, padding: '10px 12px' }}
                    required 
                  />
                </div>
              </form>
            </div>

            {/* Island 4: Floating Action Pill Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button 
                type="button" 
                onClick={() => setEditingTemplate(null)}
                style={{ 
                  padding: '9px 20px', 
                  borderRadius: 9999, 
                  border: '1px solid #CBD5E1', 
                  background: '#FFFFFF', 
                  color: '#334155', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="edit-template-form"
                style={{ 
                  padding: '9px 24px', 
                  borderRadius: 9999, 
                  border: 'none', 
                  background: '#0F172A', 
                  color: '#FFFFFF', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                }}
              >
                <Check size={15} /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WhatsAppCenterView;
