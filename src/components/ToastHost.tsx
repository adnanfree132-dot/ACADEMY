import React, { useEffect, useState } from 'react';
import { ToastEventDetail, ToastKind } from '../lib/toast';

interface ToastItem extends ToastEventDetail {
  id: number;
}

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-4), { id, ...detail }]);
      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4200);
    };
    window.addEventListener('academy-toast', onToast as EventListener);
    return () => window.removeEventListener('academy-toast', onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 88,
        zIndex: 4000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            background: tone(toast.kind).bg,
            color: tone(toast.kind).fg,
            border: `1px solid ${tone(toast.kind).border}`,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)'
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

function tone(kind: ToastKind) {
  if (kind === 'success') return { bg: '#ECFDF3', fg: '#166534', border: '#BBF7D0' };
  if (kind === 'error') return { bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA' };
  return { bg: '#F8FAFC', fg: '#0F172A', border: '#E2E8F0' };
}
