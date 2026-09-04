import { setGlobalCurrencySymbol } from '../utils/payrollUiUtils';

export interface AcademySettingsSlice {
  themePrimary?: string;
  themeSecondary?: string;
  currencySymbol?: string;
  academicSession?: string;
  academyName?: string;
}

const DEFAULT_PRIMARY = '#EA580C';
const DEFAULT_SECONDARY = '#0F172A';

export function applyAcademySettings(settings: AcademySettingsSlice | null | undefined) {
  if (typeof document === 'undefined' || !settings) return;
  const root = document.documentElement;
  const primary = String(settings.themePrimary || '').trim() || DEFAULT_PRIMARY;
  const secondary = String(settings.themeSecondary || '').trim() || DEFAULT_SECONDARY;

  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--color-primary-500', primary);
  root.style.setProperty('--theme-secondary', secondary);
  root.style.setProperty('--bg-dark-hero', secondary);

  if (settings.currencySymbol) setGlobalCurrencySymbol(String(settings.currencySymbol));
  try {
    if (settings.academicSession) localStorage.setItem('academicSession', String(settings.academicSession));
    if (settings.academyName) localStorage.setItem('academyName', String(settings.academyName));
    if (settings.themePrimary) localStorage.setItem('themePrimary', primary);
    if (settings.themeSecondary) localStorage.setItem('themeSecondary', secondary);
  } catch {
    /* ignore quota / private mode */
  }

  window.dispatchEvent(new CustomEvent('academy-settings-applied', { detail: settings }));
}

export function readCachedSessionLabel(): string {
  try {
    return localStorage.getItem('academicSession') || '';
  } catch {
    return '';
  }
}
