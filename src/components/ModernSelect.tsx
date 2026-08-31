import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface ModernSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface ModernSelectProps {
  options: ModernSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
  compact?: boolean;
  openUpward?: boolean;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  required = false,
  icon,
  style,
  disabled = false,
  zIndex = 10000,
  compact = false,
  openUpward = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', width: '100%', ...style }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: compact ? 35 : 38,
          padding: compact ? '0 10px' : '0 12px',
          borderRadius: 8,
          border: isOpen ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          fontSize: compact ? 12 : 12.5,
          fontWeight: 500,
          color: selectedOption ? '#0F172A' : '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption?.icon || icon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>

        <ChevronDown
          size={14}
          color={isOpen ? '#2563EB' : '#64748B'}
          style={{
            transform: isOpen ? (openUpward ? 'rotate(0deg)' : 'rotate(180deg)') : (openUpward ? 'rotate(180deg)' : 'rotate(0deg)'),
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
            marginLeft: 6
          }}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openUpward
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)', bottom: 'auto' }),
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 5,
            boxShadow: openUpward
              ? '0 -16px 36px -6px rgba(15, 23, 42, 0.20), 0 0 0 1px rgba(226, 232, 240, 0.8)'
              : '0 16px 36px -6px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            zIndex: zIndex,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: compact ? '7px 10px' : '8px 12px',
                  borderRadius: 7,
                  fontSize: compact ? 12 : 12.5,
                  fontWeight: 500,
                  color: isSelected ? '#1E40AF' : '#334155',
                  background: isSelected ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.color = '#0F172A';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option.icon}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{option.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {option.badge && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE'
                      }}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check size={14} color="#2563EB" style={{ strokeWidth: 2.5 }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
