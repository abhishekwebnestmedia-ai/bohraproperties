import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(value: string): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function formatDisplay(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) return '';
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DatePickerInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  clearable?: boolean;
  /** Render calendar popup via portal to escape overflow containers */
  portal?: boolean;
}

const DatePickerInput = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  clearable = true,
  portal = false,
}: DatePickerInputProps) => {
  const today = new Date();
  const parsed = parseDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed ? parsed.year : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.month : today.getMonth());
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, popupRef);

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // also check portal popup
        const popup = document.getElementById('datepicker-portal-popup');
        if (popup && popup.contains(target)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPicker = () => {
    if (!open && portal && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const POPUP_H = 310;
      const POPUP_W = 256;
      const VIEWPORT_MARGIN = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: flip left if would overflow right edge
      let left = rect.left;
      if (left + POPUP_W > vw - VIEWPORT_MARGIN) left = Math.max(VIEWPORT_MARGIN, rect.right - POPUP_W);

      // Vertical: prefer opening above when not enough space below
      let top = rect.bottom + VIEWPORT_MARGIN;
      if (rect.bottom + POPUP_H > vh - VIEWPORT_MARGIN && rect.top > POPUP_H + VIEWPORT_MARGIN) {
        top = rect.top - POPUP_H - VIEWPORT_MARGIN;
      } else if (top + POPUP_H > vh - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, vh - POPUP_H - VIEWPORT_MARGIN);
      }

      setDropPos({ top, left, width: Math.max(256, rect.width) });
    }
    setOpen((o) => !o);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);

  const isSelectedDay = (day: number) =>
    parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;

  const isTodayCell = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const calendarContent = (
    <div
      id={portal ? 'datepicker-portal-popup' : undefined}
      ref={popupRef}
      className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64 animate-fade-scale"
      style={portal && dropPos ? {
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        zIndex: 9999,
        overscrollBehavior: 'contain',
      } : { overscrollBehavior: 'contain' }}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const selected = isSelectedDay(day);
          const todayCell = isTodayCell(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDay(day)}
              className={`
                aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${selected ? 'bg-gray-900 text-white'
                  : todayCell ? 'bg-gray-100 text-gray-900 font-bold ring-1 ring-gray-400'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => {
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            onChange(`${y}-${m}-${d}`);
            setOpen(false);
          }}
          className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={openPicker}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors select-none"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className={`flex-1 truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {clearable && value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        portal
          ? createPortal(calendarContent, document.body)
          : <div className="absolute left-0 top-full mt-1 z-50">{calendarContent}</div>
      )}
    </div>
  );
};

export default DatePickerInput;
