import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastHost } from './components/ToastHost';
import { applyAcademySettings } from './lib/academySettings';
import './index.css';

try {
  applyAcademySettings({
    themePrimary: localStorage.getItem('themePrimary') || undefined,
    themeSecondary: localStorage.getItem('themeSecondary') || undefined,
    currencySymbol: localStorage.getItem('currencySymbol') || undefined,
    academicSession: localStorage.getItem('academicSession') || undefined,
    academyName: localStorage.getItem('academyName') || undefined
  });
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ToastHost />
  </React.StrictMode>
);
