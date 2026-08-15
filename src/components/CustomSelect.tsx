import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Filter } from 'lucide-react';

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select Option',
  icon = <Filter size={14} color="#64748B" />,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', userSelect: 'none', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isOpen ? '#FFFFFF' : '#F8FAFC',
          border: isOpen ? '1px solid #3B82F6' : '1px solid #E2E8F0',
          borderRadius: 9999,
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: '#0F172A',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15), 0 2px 6px rgba(15, 23, 42, 0.06)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          whiteSpace: 'nowrap'
        }}
      >
        {icon}
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={14} 
          color="#64748B" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' 
          }} 
        />
      </button>

      {/* Floating Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 200,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 6,
            boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            zIndex: 1200,
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
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? '#1D4ED8' : '#334155',
                  background: isSelected ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.color = '#0F172A';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#334155';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} color="#2563EB" style={{ marginLeft: 8 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
