# Visual Design Contract: Floating Island Modal Architecture

**Feature**: `002-popup-forms-ui-redesign`  
**Date**: 2026-08-15  
**Spec**: [spec.md](../spec.md)

---

## 1. Universal Floating Island Container Contract

The parent modal backdrop and transparent container MUST be constructed as follows:

```tsx
<div 
  className="modal-backdrop" 
  onClick={onClose} 
  style={{ 
    zIndex: 1300, 
    background: 'rgba(15, 23, 42, 0.65)', 
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    overflowY: 'auto'
  }}
>
  <div 
    className="modal-card" 
    onClick={e => e.stopPropagation()} 
    style={{ 
      maxWidth: 540, 
      width: '100%', 
      background: 'transparent', 
      border: 'none', 
      boxShadow: 'none', 
      padding: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 12 
    }}
  >
    {/* Stack of Floating Islands (Header, Warning, Form Card, Action Pills) */}
  </div>
</div>
```

---

## 2. Island 1: Floating Dark Header Card Contract

```tsx
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
      borderRadius: 10,
      background: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#10B981'
    }}>
      {/* Icon Component e.g. <UserPlus size={20} /> */}
    </div>
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>
        {subtitle}
      </p>
    </div>
  </div>
  <button 
    type="button"
    onClick={onClose} 
    style={{
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'none',
      width: 32,
      height: 32,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      cursor: 'pointer'
    }}
  >
    <X size={16} />
  </button>
</div>
```

---

## 3. Island 2: Floating Critical Notice Card (When Applicable)

```tsx
<div style={{
  background: '#FEF2F2',
  border: '1px solid #FCA5A5',
  borderRadius: 14,
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.1)'
}}>
  <div style={{ color: '#991B1B', fontWeight: 800, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', minWidth: 100 }}>
    ⚠️ CRITICAL NOTICE:
  </div>
  <div style={{ color: '#991B1B', fontSize: 12, lineHeight: 1.4 }}>
    Plaintext passwords are displayed ONCE and cannot be retrieved again after closing this window.
  </div>
</div>
```

---

## 4. Island 3: Floating White Content Card Contract

```tsx
<div style={{
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E2E8F0',
  padding: 22,
  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
  maxHeight: '68vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14
}}>
  {/* Inner Grouped Cards with #F8FAFC, border: 1px solid #E2E8F0, borderRadius: 12 */}
  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: '0.05em', marginBottom: 10 }}>
      STUDENT PROFILE
    </div>
    {/* Fields */}
  </div>
</div>
```

---

## 5. Island 4 & 5: Floating Action Buttons (Directly Over Backdrop)

### A. Data Entry Forms (Right-Aligned Paired Floating Pills)
```tsx
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
  <button
    type="button"
    onClick={onClose}
    style={{
      padding: '10px 20px',
      borderRadius: 9999,
      border: '1px solid #CBD5E1',
      background: '#FFFFFF',
      color: '#334155',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }}
  >
    Cancel
  </button>
  <button
    type="submit"
    style={{
      padding: '10px 24px',
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
      boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
    }}
  >
    ✓ Save Profile
  </button>
</div>
```

### B. Summary & Credential Slips (3-Column Grid + Full Width Done Floating Pills)
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
  <button 
    type="button" 
    onClick={handleCopy} 
    style={{ 
      padding: '11px 0', 
      borderRadius: 9999, 
      border: '1px solid #CBD5E1', 
      background: '#FFFFFF', 
      color: '#0F172A', 
      fontWeight: 700, 
      fontSize: 13, 
      cursor: 'pointer',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }}
  >
    <Copy size={15} /> Copy All
  </button>
  <button 
    type="button" 
    onClick={handlePrint} 
    style={{ 
      padding: '11px 0', 
      borderRadius: 9999, 
      border: '1px solid #CBD5E1', 
      background: '#FFFFFF', 
      color: '#0F172A', 
      fontWeight: 700, 
      fontSize: 13, 
      cursor: 'pointer',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
    }}
  >
    <Printer size={15} /> Print Slip
  </button>
  <button 
    type="button" 
    onClick={handleWhatsApp} 
    style={{ 
      padding: '11px 0', 
      borderRadius: 9999, 
      border: 'none', 
      background: '#0F172A', 
      color: '#FFFFFF', 
      fontWeight: 700, 
      fontSize: 13, 
      cursor: 'pointer',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 6,
      boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
    }}
  >
    <Send size={15} /> Send via WhatsApp
  </button>
</div>

<button 
  type="button"
  onClick={onClose}
  style={{
    width: '100%',
    padding: '12px 0',
    borderRadius: 9999,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
  }}
>
  ✓ Done & Close
</button>
```
