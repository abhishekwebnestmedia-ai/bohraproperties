import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

type Option = { value: string; label: string };

type Props = {
  name?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  options: Option[];
  /** ignored — kept for API compatibility */
  variant?: 'filled' | 'outlined' | 'standard';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

const CustomSelect: React.FC<Props> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  options,
  fullWidth = true,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, dropRef);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estH = Math.min(options.length * 38 + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= estH || spaceBelow >= 120
      ? rect.bottom + 4
      : rect.top - estH - 4;
    const left = Math.min(rect.left, window.innerWidth - rect.width - 8);
    setDropPos({ top, left, width: rect.width });
    setOpen((o) => !o);
  };

  const selectOption = useCallback((opt: Option) => {
    const fakeEvent = {
      target: { name: name ?? '', value: opt.value },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
    setOpen(false);
  }, [onChange, name]);

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const displayText = selectedLabel || placeholder || label || 'Select…';
  const hasValue = Boolean(value);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={`
          flex items-center justify-between w-full px-3 py-2.5 text-sm text-left
          bg-white border rounded-xl transition-colors
          focus:outline-none focus:ring-0
          ${hasValue ? 'text-gray-800' : 'text-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}
          ${open ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-gray-300'}
        `}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`shrink-0 w-4 h-4 ml-2 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          data-body-scroll-lock-allow="true"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, overscrollBehavior: 'contain' }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto max-h-60 py-1 scrollbar-hidden animate-fade-scale"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              className={`
                flex items-center w-full px-4 py-2.5 text-sm text-left transition-all duration-150
                ${opt.value === value
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:pl-5'}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
