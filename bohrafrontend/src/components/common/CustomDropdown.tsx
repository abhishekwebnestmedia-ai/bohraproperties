import ReactDOM from 'react-dom';
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// ────────────────────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  /** sizing utility, e.g. "w-full" or "w-48" */
  className?: string;
  /** where to render the menu relative to the trigger */
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** shows a small "×" to clear the value */
  clearable?: boolean;
  name?: string;
  error?: string;
}

// ────────────────────────────────────────────────────────────────────────────
//  CustomDropdown
// ────────────────────────────────────────────────────────────────────────────

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  disabled = false,
  className = 'w-full',
  clearable = false,
  name,
  error,
}: CustomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, dropRef);

  const selectedOption = options.find((o) => o.value === value);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estH = Math.min(options.length * 40 + 16, 256);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= estH || spaceBelow >= 120
      ? rect.bottom + 4
      : rect.top - estH - 4;
    const left = Math.min(rect.left, window.innerWidth - rect.width - 8);
    setDropPos({ top, left, width: rect.width });
    setOpen((o) => !o);
  };

  const handleSelect = useCallback((optValue: string) => {
    onChange(optValue);
    setOpen(false);
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      {/* hidden input for form compatibility */}
      {name && <input type="hidden" name={name} value={value} />}

      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={[
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-xl border transition-colors',
          'bg-white text-left focus:outline-none focus:ring-0',
          error
            ? 'border-red-400 focus:ring-red-500'
            : open
            ? 'border-gray-900 ring-2 ring-gray-900'
            : 'border-gray-300 hover:border-gray-400',
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Menu rendered via portal to escape overflow/clip constraints */}
      {open && ReactDOM.createPortal(
        <div
          ref={dropRef}
          data-body-scroll-lock-allow="true"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999, overscrollBehavior: 'contain' }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto scrollbar-hide animate-fade-scale"
        >
          {options.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">No options</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value); }}
                className={[
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-all duration-150',
                  opt.value === value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:pl-4',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
                {opt.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))
          )}
        </div>,
        document.body
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default CustomDropdown;
