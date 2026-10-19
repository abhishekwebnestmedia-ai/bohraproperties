import { useRef, useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import DateRangePicker from './DateRangePicker';

// ────────────────────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────────────────────

export interface FilterSection {
  key: string;
  label: string;
  /** flat list of selectable values */
  items: string[];
  /** child items grouped under each parent item (e.g. employees under an RM) */
  childItems?: Record<string, string[]>;
}

export interface DateRangeState {
  from: string;
  to: string;
}

export interface FilterWidgetMenuProps {
  /** sections that appear as sub-menus */
  sections: FilterSection[];
  /** currently selected values per section key */
  selected: Record<string, string[]>;
  /** called when a checkbox is toggled */
  onToggle: (sectionKey: string, value: string) => void;
  /** keys whose children are also selectable (keyed by parentKey) */
  selectedChildren?: Record<string, string[]>;
  onToggleChild?: (parentKey: string, child: string) => void;
  /** optional date range sections */
  dateRanges?: Record<string, DateRangeState>;
  onDateChange?: (rangeKey: string, field: 'from' | 'to', value: string) => void;
  /** clear all filters */
  onClearAll?: () => void;
  /** active filters count badge */
  activeCount?: number;
}

// ────────────────────────────────────────────────────────────────────────────
//  FilterWidgetMenu
// ────────────────────────────────────────────────────────────────────────────

const FilterWidgetMenu = ({
  sections,
  selected,
  onToggle,
  selectedChildren,
  onToggleChild,
  dateRanges,
  onDateChange,
  onClearAll,
  activeCount = 0,
}: FilterWidgetMenuProps) => {
  const MENU_W = 208; // w-52

  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open, menuRef);
  // Debounce timer so hovering from the section row into the sub-panel
  // doesn't immediately close the sub-panel.
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (open) { setOpen(false); setActiveSection(null); return; }
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Right-align menu to trigger button's right edge, clamp so it never goes off either side
    const left = Math.max(8, Math.min(rect.right - MENU_W, window.innerWidth - MENU_W - 8));
    setMenuPos({ top: rect.bottom + 4, left });
    setOpen(true);
    setActiveSection(null);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveSection(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSectionEnter = useCallback((key: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveSection(key);
  }, []);

  const handleSectionLeave = useCallback((_key: string) => {
    // Delay closing so the pointer has time to move into the sub-panel
    leaveTimerRef.current = setTimeout(() => {
      setActiveSection(null);
    }, 400);
  }, []);

  // Cancel the leave timer on any mousedown inside the portal (prevents
  // the sub-panel from collapsing during the mousedown→mouseup click sequence)
  const handlePortalMouseDown = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={openMenu}
        className="relative p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-200"
        title="Filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Primary menu — rendered in document.body so it clears sidebar & any overflow parent */}
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          onMouseDown={handlePortalMouseDown}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, overscrollBehavior: 'contain' }}
          className="py-1 bg-white border border-gray-200 shadow-xl w-52 rounded-xl animate-fade-scale"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Filters</span>
            {activeCount > 0 && onClearAll && (
              <button
                onClick={() => { onClearAll(); setOpen(false); }}
                className="flex items-center gap-0.5 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {sections.map((section) => {
            const hasItems = section.items.length > 0;
            const isDateRange = !hasItems && dateRanges?.[section.key] !== undefined;
            const sectionSelected = selected[section.key] ?? [];
            const sectionCount =
              sectionSelected.length +
              (selectedChildren?.[section.key]?.length ?? 0) +
              (dateRanges?.[section.key]?.from || dateRanges?.[section.key]?.to ? 1 : 0);

            return (
              <div
                key={section.key}
                className="relative"
                onMouseEnter={() => handleSectionEnter(section.key)}
                onMouseLeave={() => handleSectionLeave(section.key)}
              >
                {/* Section row */}
                <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 transition-all duration-150 cursor-pointer select-none hover:bg-gray-100 hover:pl-4">
                  <span>{section.label}</span>
                  <div className="flex items-center gap-1.5">
                    {sectionCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                        {sectionCount}
                      </span>
                    )}
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Sub-panel — absolute inside the portal div, opens to the right of primary menu */}
                {activeSection === section.key && (
                  <div
                    className={`absolute top-0 z-10 py-1 ml-1 bg-white border border-gray-200 shadow-xl left-full rounded-xl animate-fade-scale ${
                      isDateRange ? 'w-56' : 'w-52 overflow-y-auto max-h-72 scrollbar-hide'
                    }`}
                    onMouseEnter={() => handleSectionEnter(section.key)}
                    onMouseLeave={() => handleSectionLeave(section.key)}
                  >
                    {/* ── Checkbox list ── */}
                    {hasItems &&
                      section.items.map((item) => {
                        const checked = sectionSelected.includes(item);
                        return (
                          <div key={item}>
                            <label
                              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggle(section.key, item)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500"
                              />
                              <span className="text-sm leading-tight text-gray-700">{item}</span>
                            </label>

                            {/* child rows */}
                            {section.childItems?.[item] &&
                              section.childItems[item].map((child) => {
                                const childChecked = selectedChildren?.[section.key]?.includes(child) ?? false;
                                return (
                                  <label
                                    key={child}
                                    className="flex items-center gap-2.5 pl-8 pr-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={childChecked}
                                      onChange={() => onToggleChild?.(section.key, child)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-xs leading-tight text-gray-500">{child}</span>
                                  </label>
                                );
                              })}
                          </div>
                        );
                      })}

                    {/* ── Date range ── */}
                    {isDateRange && dateRanges && onDateChange && (
                      <DateRangePicker
                        from={dateRanges[section.key].from}
                        to={dateRanges[section.key].to}
                        onChange={(from, to) => {
                          onDateChange(section.key, 'from', from);
                          onDateChange(section.key, 'to', to);
                        }}
                      />
                    )}

                    {/* ── Empty state ── */}
                    {!hasItems && !isDateRange && (
                      <div className="px-3 py-4 text-xs text-center text-gray-400">No options</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default FilterWidgetMenu;
