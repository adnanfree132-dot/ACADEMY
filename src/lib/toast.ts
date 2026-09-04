export type ToastKind = 'success' | 'error' | 'info';

export interface ToastEventDetail {
  message: string;
  kind: ToastKind;
}

export function showToast(message: string, kind: ToastKind = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastEventDetail>('academy-toast', { detail: { message, kind } }));
}
