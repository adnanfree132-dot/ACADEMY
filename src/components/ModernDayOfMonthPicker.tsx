import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, RotateCcw } from 'lucide-react';

interface ModernDayOfMonthPickerProps {
  value: string; // "1" to "31" or "" (empty means default)
  onChange: (val: string) => void;
  defaultDay?: number; // e.g. derived from admission date (1-31)
  label?: string;
  required?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
  compact?: boolean;
  openAbove?: boolean;
}

export const ModernDayOfMonthPicker: React.FC<ModernDayOfMonthPickerProps> = ({
  value,
  onChange,
  defaultDay = 1,
  label,
  required = false,
  style,
  disabled = false,
  zIndex = 1200,
  compact = true,
  openAbove = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedDayNumber = value ? parseInt(value, 10) : null;
  const effectiveDay = selectedDayNumber !== null && !isNaN(selectedDayNumber) ? selectedDayNumber : defaultDay;

  const quickPresets = [
    { label: '1st', day: 1 },
    { label: '5th', day: 5 },
    { label: '10th', day: 10 },
    { label: '15th', day: 15 },
    { label: '20th', day: 20 },
    { label: '25th', day: 25 }
  ];

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
          color: value ? '#0F172A' : '#64748B',
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
          <div style={{
            width: compact ? 22 : 24,
            height: compact ? 22 : 24,
            borderRadius: 6,
            background: 'rgba(37, 99, 235, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0
          }}>
            <CalendarIcon size={compact ? 12 : 13} />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value ? `Day ${value} of each month` : `Default: Day ${defaultDay} (Admission Date)`}
          </span>
        </div>

        <ChevronDown
          size={14}
          color={isOpen ? '#2563EB' : '#64748B'}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
            marginLeft: 6
          }}
        />
      </button>

      {/* Floating Glassmorphic Day Grid Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openAbove
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)' }),
            left: 0,
            right: 0,
            minWidth: 280,
            maxWidth: 320,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 12,
            boxShadow: '0 18px 40px -6px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            zIndex: zIndex,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '7px 10px',
            borderRadius: 9
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarIcon size={12} color="#10B981" /> Monthly Billing Day
            </span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                padding: '2px 7px',
                borderRadius: 5,
                color: '#E2E8F0',
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Reset to default admission day"
            >
              <RotateCcw size={10} /> Reset Default
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {quickPresets.map(preset => (
              <button
                key={preset.day}
                type="button"
                onClick={() => {
                  onChange(String(preset.day));
                  setIsOpen(false);
                }}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 9999,
                  border: value === String(preset.day) ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  background: value === String(preset.day) ? '#EFF6FF' : '#F8FAFC',
                  color: value === String(preset.day) ? '#1D4ED8' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 1 to 31 Day Grid */}
          <div>
            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>
              Select day of month (1–31):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isSelected = value === String(day);
                const isDefault = !value && day === defaultDay;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      onChange(String(day));
                      setIsOpen(false);
                    }}
                    style={{
                      height: 28,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11.5,
                      fontWeight: isSelected ? 800 : (isDefault ? 700 : 500),
                      borderRadius: 6,
                      border: isDefault && !isSelected ? '1.5px dashed #3B82F6' : '1px solid transparent',
                      background: isSelected ? '#0F172A' : (isDefault ? '#EFF6FF' : 'transparent'),
                      color: isSelected ? '#FFFFFF' : (isDefault ? '#1D4ED8' : '#334155'),
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.color = '#0F172A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = isDefault ? '#EFF6FF' : 'transparent';
                        e.currentTarget.style.color = isDefault ? '#1D4ED8' : '#334155';
                      }
                    }}
                  >
                    <span>{day}</span>
                    {isSelected && (
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#10B981', marginTop: -2 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Selection Footnote */}
          <div style={{
            fontSize: 10.5,
            color: '#64748B',
            background: '#F8FAFC',
            padding: '5px 8px',
            borderRadius: 7,
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            Invoices generate on <strong>Day {effectiveDay}</strong> of each month
          </div>
        </div>
      )}
    </div>
  );
};
export default ModernDayOfMonthPicker;
