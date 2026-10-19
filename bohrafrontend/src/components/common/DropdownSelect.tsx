/**
 * DropdownSelect — compact custom dropdown for inline-edit panels.
 * API uses `onChange: (value: string) => void` (simpler than CustomSelect's event-based API).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

type Option = { value: string; label: string };

export type DropdownSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  /** Called when dropdown closes without selection */
  onBlur?: () => void;
  /** If true, opens immediately on mount */
  autoFocus?: boolean;
  className?: string;
  /** 'sm' — compact trigger, 'md' — default */
  size?: 'sm' | 'md';
  disabled?: boolean;
};

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  onBlur,
  autoFocus = false,
  className = '',
  size = 'md',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, dropRef);

  // auto-open on mount if autoFocus
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const estH = Math.min(options.length * 36 + 8, 240);
          const spaceBelow = window.innerHeight - rect.bottom;
          let top = spaceBelow >= estH || spaceBelow >= 100
            ? rect.bottom + 4
            : rect.top - estH - 4;
          // clamp vertically to viewport with 8px margin
          top = Math.max(8, Math.min(top, window.innerHeight - estH - 8));
          const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
          setDropPos({ top, left, width: Math.min(rect.width, window.innerWidth - 16) });
          setOpen(true);
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onBlur]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); onBlur?.(); }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onBlur]);

  const toggleDropdown = () => {
    if (disabled || !triggerRef.current) return;
    if (open) { setOpen(false); onBlur?.(); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    const estH = Math.min(options.length * 36 + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = spaceBelow >= estH || spaceBelow >= 100
      ? rect.bottom + 4
      : rect.top - estH - 4;
    top = Math.max(8, Math.min(top, window.innerHeight - estH - 8));
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
    setDropPos({ top, left, width: Math.min(rect.width, window.innerWidth - 16) });
    setOpen(true);
  };

  const selectOption = useCallback((opt: Option) => {
    onChange(opt.value);
    setOpen(false);
  }, [onChange]);

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const displayText = selectedLabel || value || placeholder;
  const hasValue = Boolean(value);

  const isSmall = size === 'sm';

  return (
    <div className={`relative w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`
          flex items-center justify-between w-full text-left bg-white border rounded-lg
          transition-colors focus:outline-none focus:ring-0
          ${isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
          ${hasValue ? 'text-gray-800' : 'text-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}
          ${open ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-blue-500'}
        `}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`shrink-0 ${isSmall ? 'w-3 h-3 ml-1' : 'w-4 h-4 ml-2'} text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          data-body-scroll-lock-allow="true"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="py-1 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-xl max-h-60 scrollbar-hidden animate-fade-scale"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt); }}
              className={`
                flex items-center w-full text-left transition-all duration-150
                ${isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}
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

export default DropdownSelect;
