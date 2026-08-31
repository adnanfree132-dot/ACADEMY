import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface ModernDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  zIndex?: number;
  compact?: boolean;
  openAbove?: boolean;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  minDate,
  maxDate,
  placeholder = 'Select date...',
  style,
  disabled = false,
  zIndex = 1000,
  compact = false,
  openAbove = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth()); // 0 - 11

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDisplayDate = (val: string) => {
    if (!val) return '';
    try {
      const d = new Date(val + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return val;
    }
  };

  // Generate days grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${mm}-${dd}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleQuickPreset = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const isoString = `${yyyy}-${mm}-${dd}`;
    onChange(isoString);
    setViewYear(yyyy);
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return (
      d.getFullYear() === viewYear &&
      d.getMonth() === viewMonth &&
      d.getDate() === day
    );
  };

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
          borderRadius: compact ? 8 : 8,
          border: isOpen ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          fontSize: compact ? 12 : 12.5,
          fontWeight: 500,
          color: value ? '#0F172A' : '#94A3B8',
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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value ? formatDisplayDate(value) : placeholder}</span>
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

      {/* Floating Glassmorphic Calendar Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openAbove
              ? { bottom: 'calc(100% + 6px)', top: 'auto' }
              : { top: 'calc(100% + 6px)' }),
            left: 0,
            minWidth: 290,
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
          {/* Header Bar: Month & Year Navigator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: 10
          }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                width: 26,
                height: 26,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                width: 26,
                height: 26,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Preset Shortcut Pills */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[
              { label: 'Today', offset: 0 },
              { label: 'Tomorrow', offset: 1 },
              { label: 'In 7 Days', offset: 7 }
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleQuickPreset(preset.offset)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 9999,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#BFDBFE';
                  e.currentTarget.style.color = '#1D4ED8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Days of Week Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '2px 0' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Prev month days padding */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`prev-${idx}`}
                style={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: '#CBD5E1',
                  fontWeight: 500
                }}
              >
                {prevMonthDays - firstDayIndex + idx + 1}
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const currentToday = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12.5,
                    fontWeight: 500,
                    borderRadius: 8,
                    border: currentToday && !selected ? '1.5px solid #3B82F6' : '1px solid transparent',
                    background: selected ? '#0F172A' : (currentToday ? '#EFF6FF' : 'transparent'),
                    color: selected ? '#FFFFFF' : (currentToday ? '#1D4ED8' : '#334155'),
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                      e.currentTarget.style.color = '#0F172A';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = currentToday ? '#EFF6FF' : 'transparent';
                      e.currentTarget.style.color = currentToday ? '#1D4ED8' : '#334155';
                    }
                  }}
                >
                  <span>{day}</span>
                  {selected && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981', marginTop: -2 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
