import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYMD(v: string): Date | null {
  if (!v) return null;
  const parts = v.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatShort(v: string): string {
  const d = parseYMD(v);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ──────────────────────────────────────────────────────────────────────────────

export interface DateRangePickerProps {
  /** YYYY-MM-DD or '' */
  from: string;
  /** YYYY-MM-DD or '' */
  to: string;
  onChange: (from: string, to: string) => void;
}

const DateRangePicker = ({ from, to, onChange }: DateRangePickerProps) => {
  const today = new Date();
  const fromDate = parseYMD(from);
  const toDate = parseYMD(to);

  // Determine initial view month: if from is set, view that month; else today
  const initFrom = fromDate ?? today;
  const [viewYear, setViewYear] = useState(initFrom.getFullYear());
  const [viewMonth, setViewMonth] = useState(initFrom.getMonth());
  // 'from' = next click sets from; 'to' = next click sets to
  const [selecting, setSelecting] = useState<'from' | 'to'>(from ? 'to' : 'from');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day: number) => {
    const ymd = toYMD(viewYear, viewMonth, day);
    const clicked = new Date(viewYear, viewMonth, day);

    if (selecting === 'from') {
      // Set from; clear to if to is now before new from
      if (toDate && clicked > toDate) {
        onChange(ymd, '');
      } else {
        onChange(ymd, to);
      }
      setSelecting('to');
    } else {
      // Setting to
      if (fromDate && clicked < fromDate) {
        // Clicked before from → make it the new from, keep old from as to
        onChange(ymd, from);
      } else if (fromDate && clicked.getTime() === fromDate.getTime()) {
        // Clicked same as from → clear both
        onChange('', '');
        setSelecting('from');
      } else {
        onChange(from, ymd);
      }
      setSelecting('from');
    }
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);

  const isPivotFrom = (day: number) => {
    if (!fromDate) return false;
    return fromDate.getFullYear() === viewYear && fromDate.getMonth() === viewMonth && fromDate.getDate() === day;
  };
  const isPivotTo = (day: number) => {
    if (!toDate) return false;
    return toDate.getFullYear() === viewYear && toDate.getMonth() === viewMonth && toDate.getDate() === day;
  };
  const isInRange = (day: number) => {
    if (!fromDate || !toDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d > fromDate && d < toDate;
  };
  const isTodayCell = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div className="px-2 pt-2 pb-1 select-none w-full">
      {/* From / To display pills */}
      <div className="flex items-center gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => setSelecting('from')}
          className={`flex-1 text-center text-[11px] px-1.5 py-1 rounded-md border transition-colors truncate ${
            selecting === 'from'
              ? 'border-gray-900 bg-gray-900 text-white font-medium'
              : from
                ? 'border-gray-300 text-gray-800 bg-white'
                : 'border-dashed border-gray-300 text-gray-400 bg-white'
          }`}
        >
          {from ? formatShort(from) : 'From date'}
        </button>
        <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
        <button
          type="button"
          onClick={() => setSelecting('to')}
          className={`flex-1 text-center text-[11px] px-1.5 py-1 rounded-md border transition-colors truncate ${
            selecting === 'to'
              ? 'border-gray-900 bg-gray-900 text-white font-medium'
              : to
                ? 'border-gray-300 text-gray-800 bg-white'
                : 'border-dashed border-gray-300 text-gray-400 bg-white'
          }`}
        >
          {to ? formatShort(to) : 'To date'}
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-center text-gray-400 mb-2">
        Selecting: <span className="font-medium text-gray-600">{selecting === 'from' ? 'start date' : 'end date'}</span>
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-1.5">
        <button type="button" onClick={prevMonth} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <span className="text-[11px] font-semibold text-gray-800">
          {FULL_MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const isF = isPivotFrom(day);
          const isT = isPivotTo(day);
          const inRange = isInRange(day);
          const isTod = isTodayCell(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              className={[
                'h-6 flex items-center justify-center text-[11px] font-medium transition-colors',
                inRange ? 'bg-blue-50 text-blue-700 rounded-none' : '',
                isF || isT ? 'bg-gray-900 text-white rounded-full z-10' : '',
                !isF && !isT && !inRange && isTod ? 'text-blue-600 font-bold rounded-full' : '',
                !isF && !isT && !inRange && !isTod ? 'text-gray-600 hover:bg-gray-100 rounded-full' : '',
              ].filter(Boolean).join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Quick presets */}
      <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-1">
        {[
          { label: 'Today', action: () => { const t = toYMD(today.getFullYear(), today.getMonth(), today.getDate()); onChange(t, t); setSelecting('from'); } },
          { label: 'This week', action: () => {
            const dow = today.getDay(); // 0=Sun
            const mon = new Date(today);
            mon.setDate(today.getDate() - dow + 1);
            const sun = new Date(mon);
            sun.setDate(mon.getDate() + 6);
            onChange(
              toYMD(mon.getFullYear(), mon.getMonth(), mon.getDate()),
              toYMD(sun.getFullYear(), sun.getMonth(), sun.getDate()),
            );
            setSelecting('from');
          }},
          { label: 'This month', action: () => {
            const first = toYMD(today.getFullYear(), today.getMonth(), 1);
            const last = toYMD(today.getFullYear(), today.getMonth(), daysInMonth(today.getFullYear(), today.getMonth()));
            onChange(first, last);
            setSelecting('from');
          }},
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className="text-[10px] text-center text-gray-500 hover:text-gray-800 py-1 rounded hover:bg-gray-50 transition-colors border border-gray-200"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {(from || to) && (
        <button
          type="button"
          onClick={() => { onChange('', ''); setSelecting('from'); }}
          className="w-full mt-1.5 text-[10px] text-center text-red-500 hover:text-red-700 py-1 transition-colors"
        >
          Clear dates
        </button>
      )}
    </div>
  );
};

export default DateRangePicker;
