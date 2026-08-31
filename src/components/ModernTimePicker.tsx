import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, X, Check } from 'lucide-react';

interface ModernTimePickerProps {
  value: string; // 24-hr format "HH:mm" or ""
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  zIndex?: number;
  openAbove?: boolean;
  style?: React.CSSProperties;
}

export const ModernTimePicker: React.FC<ModernTimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Select time...',
  allowClear = true,
  disabled = false,
  zIndex = 2000,
  openAbove = false,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse "HH:mm" into 12-hr parts
  const parseTime = (val: string) => {
    if (!val) {
      const now = new Date();
      let h = now.getHours();
      const m = Math.floor(now.getMinutes() / 5) * 5;
      const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return {
        hour: h,
        minute: m < 10 ? `0${m}` : `${m}`,
        period
      };
    }

    const [rawH, rawM] = val.split(':').map(Number);
    if (isNaN(rawH) || isNaN(rawM)) {
      return { hour: 8, minute: '30', period: 'AM' as const };
    }

    const period: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
    let hour12 = rawH % 12;
    if (hour12 === 0) hour12 = 12;
    const minStr = rawM < 10 ? `0${rawM}` : `${rawM}`;

    return { hour: hour12, minute: minStr, period };
  };

  const currentParsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState<number>(currentParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<string>(currentParsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(currentParsed.period);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
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

  const formatDisplayTime = (val: string) => {
    if (!val) return '';
    const [rawH, rawM] = val.split(':').map(Number);
    if (isNaN(rawH) || isNaN(rawM)) return val;
    const period = rawH >= 12 ? 'PM' : 'AM';
    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    const mStr = rawM < 10 ? `0${rawM}` : `${rawM}`;
    return `${hStr}:${mStr} ${period}`;
  };

  const applyTime = (h: number, m: string, p: 'AM' | 'PM') => {
    let hour24 = h;
    if (p === 'PM' && hour24 < 12) hour24 += 12;
    if (p === 'AM' && hour24 === 12) hour24 = 0;
    const hourStr = hour24 < 10 ? `0${hour24}` : `${hour24}`;
    onChange(`${hourStr}:${m}`);
  };

  const handleSetNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const hStr = h24 < 10 ? `0${h24}` : `${h24}`;
    onChange(`${hStr}:${mStr}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        width: '100%',
        ...style
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          height: 38,
          borderRadius: 10,
          border: isOpen ? '1.5px solid #3B82F6' : '1.5px solid #CBD5E1',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen
            ? '0 0 0 3.5px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(15, 23, 42, 0.08)'
            : '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <Clock size={15} color={value ? '#2563EB' : '#94A3B8'} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: value ? 700 : 500,
              color: value ? '#0F172A' : '#94A3B8',
              fontFamily: value ? 'monospace' : 'inherit'
            }}
          >
            {value ? formatDisplayTime(value) : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value && allowClear && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear time"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 3,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}
            >
              <X size={13} />
            </button>
          )}

          <ChevronDown
            size={14}
            color="#64748B"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: openAbove ? 'auto' : 'calc(100% + 6px)',
            bottom: openAbove ? 'calc(100% + 6px)' : 'auto',
            left: 0,
            width: 290,
            maxWidth: '100%',
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.22)',
            padding: 14,
            zIndex,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxSizing: 'border-box'
          }}
        >
          {/* Quick Presets Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4, borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Select Time
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={handleSetNow}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#2563EB',
                  cursor: 'pointer'
                }}
              >
                Now
              </button>
              {allowClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Time Columns: Hours / Minutes / AM-PM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 68px', gap: 8, height: 140 }}>
            {/* Hours Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 140 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase' }}>
                Hour
              </span>
              <div
                style={{
                  flex: 1,
                  height: 115,
                  overflowY: 'auto',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  padding: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  background: '#F8FAFC'
                }}
              >
                {hoursList.map(h => {
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setSelectedHour(h);
                        applyTime(h, selectedMinute, selectedPeriod);
                      }}
                      style={{
                        padding: '4px 0',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: isSelected ? 800 : 600,
                        borderRadius: 6,
                        border: 'none',
                        background: isSelected ? '#0F172A' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {h < 10 ? `0${h}` : h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 140 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase' }}>
                Min
              </span>
              <div
                style={{
                  flex: 1,
                  height: 115,
                  overflowY: 'auto',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  padding: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  background: '#F8FAFC'
                }}
              >
                {minutesList.map(m => {
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMinute(m);
                        applyTime(selectedHour, m, selectedPeriod);
                      }}
                      style={{
                        padding: '4px 0',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: isSelected ? 800 : 600,
                        borderRadius: 6,
                        border: 'none',
                        background: isSelected ? '#0F172A' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AM / PM Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, height: 140 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase' }}>
                Period
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: 115 }}>
                {(['AM', 'PM'] as const).map(p => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setSelectedPeriod(p);
                        applyTime(selectedHour, selectedMinute, p);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        borderRadius: 8,
                        border: isSelected ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                        background: isSelected ? '#0F172A' : '#F8FAFC',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Button */}
          <div style={{ paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={() => {
                applyTime(selectedHour, selectedMinute, selectedPeriod);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                borderRadius: 8,
                height: 34,
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
              }}
            >
              <Check size={13} color="#10B981" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
