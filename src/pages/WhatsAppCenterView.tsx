import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  FileText,
  CheckCircle2,
  Edit2,
  X,
  Bell,
  CreditCard,
  Check
} from 'lucide-react';
import { DEFAULT_WHATSAPP_TEMPLATES, WhatsAppTemplate, openWhatsAppLink } from '../utils/whatsappHelper';
import { api, peekApiCache } from '../api/apiClient';
import { showToast } from '../lib/toast';

type WaTab = 'templates' | 'compose' | 'absence_dispatcher' | 'fee_reminders' | 'logs';

export const WhatsAppCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WaTab>('templates');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => peekApiCache<WhatsAppTemplate[]>('/whatsapp/templates') || DEFAULT_WHATSAPP_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [logs, setLogs] = useState<any[]>(() => peekApiCache<any[]>('/whatsapp/logs') || []);
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [composeKind, setComposeKind] = useState<'student' | 'inquiry'>('student');
  const [composeId, setComposeId] = useState('');
  const [composeTemplate, setComposeTemplate] = useState('WA_FEE_REMINDER');
  const [composePreview, setComposePreview] = useState<{ phone: string; body: string; studentName?: string } | null>(null);
  const [composeLoading, setComposeLoading] = useState(false);

  const [dispatchedAlerts, setDispatchedAlerts] = useState<any[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState('');

  const [feeAlerts, setFeeAlerts] = useState<any[]>([]);
  const [isFeeDispatching, setIsFeeDispatching] = useState(false);
  const [feeMsg, setFeeMsg] = useState('');

  const fetchWhatsAppCenterData = async () => {
    try {
      if (logs.length === 0 && templates.length === 0) setLoading(true);
      const [templatesData, logsData] = await Promise.all([
        api.getWhatsAppTemplates().catch(() => []),
        api.getWhatsAppLogs().catch(() => [])
      ]);
      if (templatesData && templatesData.length > 0) setTemplates(templatesData);
      setLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching WhatsApp Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppCenterData();
    api.getStudents().then(rows => setStudents(Array.isArray(rows) ? rows.slice(0, 400) : [])).catch(() => {});
    api.getInquiries().then(rows => setInquiries(Array.isArray(rows) ? rows : [])).catch(() => {});
  }, []);

  const logAndOpen = async (phone: string, body: string, templateCode: string, studentId?: string, studentName?: string) => {
    if (!phone) {
      showToast('No phone number on this record.', 'error');
      return;
    }
    openWhatsAppLink(phone, body);
    setLogs(prev => [{
      id: `log-${Date.now()}`,
      studentName: studentName || 'Recipient',
      phone,
      template_name: templateCode,
      template_code: templateCode,
      message: body,
      body_snapshot: body,
      status: 'manual_opened',
      created_at: new Date().toISOString()
    }, ...prev]);
    try {
      await api.sendWhatsAppNotification({ phone, studentName, templateCode, body, studentId });
    } catch (err) {
      console.error('Error logging WhatsApp notification:', err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setTemplates(prev => prev.map(t => t.code === editingTemplate.code ? editingTemplate : t));
    const target = editingTemplate;
    setEditingTemplate(null);
    try {
      await api.updateWhatsAppTemplate(target.code, { name: target.name, body: target.body, is_active: true });
      showToast('Template saved', 'success');
      fetchWhatsAppCenterData();
    } catch (err) {
      console.error('Error saving template:', err);
      showToast('Could not save template', 'error');
    }
  };

  const handlePreviewCompose = async () => {
    if (!composeId) {
      showToast('Pick a student or inquiry first.', 'error');
      return;
    }
    setComposeLoading(true);
    try {
      const preview = await api.previewWhatsApp(
        composeKind === 'student'
          ? { templateCode: composeTemplate, studentId: composeId }
          : { templateCode: composeTemplate, inquiryId: composeId }
      );
      setComposePreview(preview);
    } catch (err: any) {
      showToast(err.message || 'Could not fill template', 'error');
    } finally {
      setComposeLoading(false);
    }
  };

  const handleDispatchDailyAbsences = async () => {
    try {
      setIsDispatching(true);
      setDispatchSuccessMsg('');
      const res = await api.dispatchAbsenceAlerts();
      setDispatchedAlerts(res?.alerts || []);
      setDispatchSuccessMsg(`Prepared ${res?.dispatchedCount || 0} absence messages from today's attendance. This does not send via Meta — open WhatsApp for each parent.`);
      fetchWhatsAppCenterData();
    } catch (err: any) {
      showToast(err.message || 'Dispatch failed', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDispatchFeeReminders = async () => {
    try {
      setIsFeeDispatching(true);
      setFeeMsg('');
      const res = await api.dispatchFeeReminders();
      setFeeAlerts(res?.alerts || []);
      setFeeMsg(`Prepared ${res?.dueCount || 0} fee reminders (${res?.defaulterCount || 0} overdue). Opens WhatsApp; nothing is auto-sent.`);
      fetchWhatsAppCenterData();
    } catch (err: any) {
      showToast(err.message || 'Could not build fee reminders', 'error');
    } finally {
      setIsFeeDispatching(false);
    }
  };

  const tabBtn = (id: WaTab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      className="tab-pill"
      onClick={() => setActiveTab(id)}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: activeTab === id ? '#0F172A' : 'transparent',
        color: activeTab === id ? '#FFFFFF' : '#64748B',
        fontWeight: 500,
        fontSize: 13,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap'
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            WhatsApp Center
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Honest wa.me links with live student, inquiry, absence, and fee data. Delivery is you + WhatsApp — not a Cloud API.
          </p>
        </div>
      </div>

      <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#9A3412', padding: '12px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}>
        This academy does not connect to Meta WhatsApp Cloud API. Clicking Send opens WhatsApp with a pre-filled message and writes a log here. If a parent has no phone, the row stays failed until you add one.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Templates</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{templates.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Logs</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{logs.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Gateway</span>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB', marginTop: 2 }}>wa.me only</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', padding: '6px 8px', borderRadius: 12, border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        {tabBtn('templates', `Templates (${templates.length})`, <FileText size={14} color={activeTab === 'templates' ? '#FFFFFF' : '#64748B'} />)}
        {tabBtn('compose', 'Compose', <Send size={14} color={activeTab === 'compose' ? '#FFFFFF' : '#64748B'} />)}
        {tabBtn('absence_dispatcher', 'Absences', <Bell size={14} color={activeTab === 'absence_dispatcher' ? '#FFFFFF' : '#64748B'} />)}
        {tabBtn('fee_reminders', 'Fee reminders', <CreditCard size={14} color={activeTab === 'fee_reminders' ? '#FFFFFF' : '#64748B'} />)}
        {tabBtn('logs', `Logs (${logs.length})`, <MessageSquare size={14} color={activeTab === 'logs' ? '#FFFFFF' : '#64748B'} />)}
      </div>

      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {templates.map(tmpl => (
            <div key={tmpl.code} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 700 }}>{tmpl.code}</span>
                <button className="btn-secondary btn-sm" onClick={() => setEditingTemplate(tmpl)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 9999 }}>
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{tmpl.name}</h3>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 4, background: '#F8FAFC', padding: 10, borderRadius: 10, fontFamily: 'monospace', border: '1px solid #E2E8F0', lineHeight: 1.5 }}>
                {tmpl.body}
              </p>
              <button className="btn-secondary btn-sm" onClick={() => { setComposeTemplate(tmpl.code); setActiveTab('compose'); }} style={{ width: '100%', justifyContent: 'center', height: 34, borderRadius: 9999 }}>
                <Send size={13} /> Fill with a real student
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Compose from live records</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={composeKind === 'student' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setComposeKind('student'); setComposeId(''); setComposePreview(null); }}>Student</button>
            <button type="button" className={composeKind === 'inquiry' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setComposeKind('inquiry'); setComposeId(''); setComposePreview(null); }}>Inquiry</button>
          </div>
          <div className="form-group">
            <label className="form-label">Template</label>
            <select className="form-input" value={composeTemplate} onChange={e => setComposeTemplate(e.target.value)}>
              {templates.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{composeKind === 'student' ? 'Student' : 'Inquiry'}</label>
            <select className="form-input" value={composeId} onChange={e => { setComposeId(e.target.value); setComposePreview(null); }}>
              <option value="">Select…</option>
              {composeKind === 'student'
                ? students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.full_name || s.name} · {s.admission_no || s.regNo || ''} · {s.phone || ''}</option>
                  ))
                : inquiries.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name || i.studentName} · {i.phone} · {i.status}</option>
                  ))}
            </select>
          </div>
          <button type="button" className="btn-secondary" onClick={handlePreviewCompose} disabled={composeLoading} style={{ alignSelf: 'flex-start' }}>
            {composeLoading ? 'Filling…' : 'Preview with live data'}
          </button>
          {composePreview && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                {composePreview.studentName} · {composePreview.phone || 'No phone'}
              </div>
              <p style={{ fontSize: 13, color: '#0F172A', whiteSpace: 'pre-wrap', margin: 0 }}>{composePreview.body}</p>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 12 }}
                onClick={() => logAndOpen(composePreview.phone, composePreview.body, composeTemplate, composeKind === 'student' ? composeId : undefined, composePreview.studentName)}
              >
                <Send size={14} /> Open WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'absence_dispatcher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {dispatchSuccessMsg && (
            <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#15803D" style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {dispatchSuccessMsg}
            </div>
          )}
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Today's absences</h3>
                <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Uses today's attendance marked absent and the WA_ABSENT template.</p>
              </div>
              <button className="btn-primary" onClick={handleDispatchDailyAbsences} disabled={isDispatching}>
                <Send size={15} /> {isDispatching ? 'Scanning…' : 'Prepare absence messages'}
              </button>
            </div>
            {dispatchedAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {dispatchedAlerts.map((alert, idx) => (
                  <div key={alert.logId || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{alert.studentName}</span>
                        <span className="badge badge-red" style={{ fontSize: 10 }}>Absent</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Parent: <strong>{alert.parentName || '—'}</strong> · {alert.phone || 'No phone'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>{alert.messageBody}</div>
                    </div>
                    <button type="button" className="btn-primary btn-sm" disabled={!alert.phone} onClick={() => logAndOpen(alert.phone, alert.messageBody, 'WA_ABSENT', alert.studentId, alert.studentName)} style={{ borderRadius: 9999, whiteSpace: 'nowrap' }}>
                      <Send size={13} /> WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 36, color: '#94A3B8' }}>
                Prepare messages after attendance is marked. Empty here means no absences, or you have not scanned yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fee_reminders' && (
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #E2E8F0' }}>
          {feeMsg && (
            <div style={{ background: '#DBEAFE', border: '1px solid #93C5FD', color: '#1E3A8A', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              {feeMsg}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Open fee balances</h3>
              <p style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Built from unpaid invoices. Voided receipts are ignored. Overdue uses WA_DEFAULTER; current dues use WA_FEE_REMINDER.</p>
            </div>
            <button className="btn-primary" onClick={handleDispatchFeeReminders} disabled={isFeeDispatching}>
              {isFeeDispatching ? 'Building…' : 'Prepare fee reminders'}
            </button>
          </div>
          {feeAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {feeAlerts.map((alert, idx) => (
                <div key={alert.logId || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{alert.studentName}</strong>
                      {alert.daysOverdue > 0 ? <span className="badge badge-red">{alert.daysOverdue}d overdue</span> : <span className="badge badge-amber">Due {alert.dueDate}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{alert.phone || 'No phone'} · {alert.parentName || '—'}</div>
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>{alert.messageBody}</div>
                  </div>
                  <button type="button" className="btn-primary btn-sm" disabled={!alert.phone} onClick={() => logAndOpen(alert.phone, alert.messageBody, alert.templateCode, alert.studentId, alert.studentName)} style={{ borderRadius: 9999, whiteSpace: 'nowrap' }}>
                    <Send size={13} /> WhatsApp
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 36, color: '#94A3B8' }}>No reminders prepared yet.</div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="data-table-container">
          <table className="data-table" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th>When</th>
                <th>Recipient</th>
                <th>Phone</th>
                <th>Template</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ fontSize: 11.5, color: '#64748B' }}>{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</td>
                  <td><strong>{log.studentName || log.student?.full_name || 'Direct'}</strong></td>
                  <td><span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{log.phone}</span></td>
                  <td><span className="badge badge-blue">{log.template_code || log.template_name || 'MANUAL'}</span></td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{log.body_snapshot || log.message || log.body}</td>
                  <td>
                    <span className={log.status === 'failed' ? 'badge badge-red' : 'badge badge-green'}>{log.status || 'logged'}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                    {loading ? 'Loading logs…' : 'No WhatsApp logs yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingTemplate && (
        <div className="floating-island-overlay" onClick={() => setEditingTemplate(null)} style={{ zIndex: 1300 }}>
          <div className="floating-island-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 20px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Edit {editingTemplate.code}</h3>
              <button type="button" onClick={() => setEditingTemplate(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94A3B8', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 22, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <form id="edit-template-form" onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Body (placeholders like {'{student_name}'})</label>
                  <textarea className="form-input" rows={5} value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} required />
                </div>
              </form>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={() => setEditingTemplate(null)}>Cancel</button>
              <button type="submit" form="edit-template-form" className="btn-primary"><Check size={15} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCenterView;
