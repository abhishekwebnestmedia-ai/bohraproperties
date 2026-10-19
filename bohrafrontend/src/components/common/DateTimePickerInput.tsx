import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, X, Clock } from 'lucide-react';
import DropdownSelect from './DropdownSelect';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad2(n: number) { return String(n).padStart(2, '0'); }

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }

interface ParsedDT {
  year: number; month: number; day: number;
  hour: number; minute: number; period: 'AM' | 'PM';
}

function parseISO(iso: string): ParsedDT | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const h24 = d.getHours();
    const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return {
      year: d.getFullYear(), month: d.getMonth(), day: d.getDate(),
      hour: hour12, minute: d.getMinutes(), period,
    };
  } catch { return null; }
}

function toISO(p: ParsedDT): string {
  let h = p.hour % 12;
  if (p.period === 'PM') h += 12;
  return new Date(p.year, p.month, p.day, h, p.minute).toISOString();
}

function formatDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return '';
  const d = new Date(p.year, p.month, p.day, p.period === 'PM' ? (p.hour % 12) + 12 : p.hour % 12, p.minute);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    + ', '
    + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────────────────────────────────

interface DateTimePickerInputProps {
  value: string;          // ISO string or ''
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

const DateTimePickerInput = ({
  value,
  onChange,
  placeholder = 'Select date & time',
  className = '',
  clearable = true,
}: DateTimePickerInputProps) => {
  const today = new Date();
  const parsed = parseISO(value);

  const [open, setOpen] = useState(false);
  const [viewYear,  setViewYear]  = useState(parsed?.year  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [selDay,    setSelDay]    = useState<number | null>(parsed?.day   ?? null);
  const [hour,   setHour]   = useState<number>(parsed?.hour   ?? 12);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed?.period ?? 'AM');
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef   = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, popupRef);

  // Sync state when external value changes
  useEffect(() => {
    const p = parseISO(value);
    if (p) {
      setViewYear(p.year); setViewMonth(p.month); setSelDay(p.day);
      setHour(p.hour); setMinute(p.minute); setPeriod(p.period);
    }
  }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popupRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPicker = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const POPUP_H = 400;
      const POPUP_W = 288;
      const VIEWPORT_MARGIN = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal boundary: flip left if would overflow
      let left = r.left;
      if (left + POPUP_W > vw - VIEWPORT_MARGIN) left = Math.max(VIEWPORT_MARGIN, r.right - POPUP_W);

      // Vertical boundary: prefer opening above when the popup would touch the bottom
      let top = r.bottom + VIEWPORT_MARGIN;
      if (r.bottom + POPUP_H > vh - VIEWPORT_MARGIN && r.top > POPUP_H + VIEWPORT_MARGIN) {
        top = r.top - POPUP_H - VIEWPORT_MARGIN;
      } else if (top + POPUP_H > vh - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, vh - POPUP_H - VIEWPORT_MARGIN);
      }

      setDropPos({ top, left });
    }
    setOpen((o) => !o);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    setSelDay(day);
    onChange(toISO({ year: viewYear, month: viewMonth, day, hour, minute, period }));
  };

  const handleTimeChange = (h: number, m: number, p: 'AM' | 'PM') => {
    setHour(h); setMinute(m); setPeriod(p);
    if (selDay) {
      onChange(toISO({ year: viewYear, month: viewMonth, day: selDay, hour: h, minute: m, period: p }));
    }
  };

  const total  = daysInMonth(viewYear, viewMonth);
  const startD = firstDay(viewYear, viewMonth);

  const isSelected = (d: number) =>
    selDay === d && parsed?.year === viewYear && parsed?.month === viewMonth;
  const isToday = (d: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  // ── Popup ──────────────────────────────────────────────────────────────────
  const popup = (
    <div
      ref={popupRef}
      className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-72 animate-fade-scale"
      style={dropPos ? { position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999, overscrollBehavior: 'contain' } : { overscrollBehavior: 'contain' }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTHS_FULL[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5 mb-4">
        {Array.from({ length: startD }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: total }).map((_, i) => {
          const d = i + 1;
          const sel = isSelected(d);
          const tod = isToday(d);
          return (
            <button
              key={d} type="button"
              onClick={() => handleDayClick(d)}
              className={`
                aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${sel ? 'bg-gray-900 text-white'
                  : tod ? 'bg-gray-100 text-gray-900 font-bold ring-1 ring-gray-400'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Time picker */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1 mb-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Time</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Hour */}
          <DropdownSelect
            size="sm"
            value={String(hour)}
            onChange={(v) => handleTimeChange(Number(v), minute, period)}
            className="flex-1"
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: pad2(i + 1) }))}
          />
          <span className="text-sm font-medium text-gray-400">:</span>
          {/* Minute */}
          <DropdownSelect
            size="sm"
            value={String(minute)}
            onChange={(v) => handleTimeChange(hour, Number(v), period)}
            className="flex-1"
            options={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => ({ value: String(m), label: pad2(m) }))}
          />
          {/* AM/PM */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['AM', 'PM'] as const).map(p => (
              <button
                key={p} type="button"
                onClick={() => handleTimeChange(hour, minute, p)}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  period === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Today/Now shortcut */}
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            const h24 = now.getHours();
            const p: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
            const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
            const m = Math.floor(now.getMinutes() / 5) * 5;
            setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelDay(now.getDate());
            setHour(h12); setMinute(m); setPeriod(p);
            onChange(toISO({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hour: h12, minute: m, period: p }));
          }}
          className="mt-2.5 w-full text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors text-center"
        >
          Now
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      {/* Trigger */}
      <div
        onClick={openPicker}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors select-none"
      >
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
        <span className={`flex-1 truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {clearable && value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); setSelDay(null); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Portal popup */}
      {open && createPortal(popup, document.body)}
    </div>
  );
};

export default DateTimePickerInput;
