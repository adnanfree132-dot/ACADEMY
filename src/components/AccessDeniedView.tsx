import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

interface AccessDeniedViewProps {
  message?: string;
  onReturn?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  message = 'You do not have permission to access this administrative module.',
  onReturn
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <div 
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.06)'
        }}
      >
        <div 
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid #FEE2E2'
          }}
        >
          <Lock size={26} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
          Access Restricted
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
          {message}
        </p>
        {onReturn && (
          <button
            onClick={onReturn}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <ArrowLeft size={15} />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
};
