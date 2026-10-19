import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DropdownSelect from '../common/DropdownSelect';
import {
  X, Menu, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowLeft, Pencil, Save, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, MessageSquare, SendHorizonal, Trash2,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import {
  useNotes, useCreateNote, useUpdateNote, useDeleteNote,
  mapTaskToCreateRequest, mapTaskToUpdateRequest,
} from '../../hooks/useNotes';
import DatePickerInput from '../common/DatePickerInput';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PanelView = 'list' | 'detail' | 'create';

const EMPTY_TASK: Task = {
  id: 'new', title: '', note: '', status: 'Pending',
  priority: 'Medium', dueDate: '', createdDate: '', createdBy: '', comments: [],
};

const getStatusColor = (s: TaskStatus) => {
  switch (s) {
    case 'Pending':     return 'text-yellow-600 bg-yellow-50';
    case 'In Progress': return 'text-blue-600 bg-blue-50';
    case 'Completed':   return 'text-green-600 bg-green-50';
    case 'Cancelled':   return 'text-red-600 bg-red-50';
    default:            return 'text-gray-600 bg-gray-50';
  }
};

const getPriorityColor = (p: TaskPriority) => {
  switch (p) {
    case 'High':   return 'text-red-600 border-red-500';
    case 'Medium': return 'text-orange-600 border-orange-500';
    case 'Low':    return 'text-green-600 border-green-500';
    default:       return 'text-gray-600 border-gray-400';
  }
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
};

type DueTime12 = { hour: string; minute: string; period: 'AM' | 'PM' };

const pad2 = (n: number) => String(n).padStart(2, '0');

const parseDueTimeFromISO = (iso: string): DueTime12 => {
  if (!iso) return { hour: '12', minute: '00', period: 'AM' };
  try {
    const d = new Date(iso);
    const hour24 = d.getHours();
    const minute = d.getMinutes();
    const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return { hour: pad2(hour12), minute: pad2(minute), period };
  } catch {
    return { hour: '12', minute: '00', period: 'AM' };
  }
};

const toInputDateOnly = (iso: string) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().split('T')[0]; } catch { return iso; }
};

const buildDueDateIso = (dateOnly: string, time: DueTime12) => {
  if (!dateOnly) return '';
  const hour = Number(time.hour);
  const minute = Number(time.minute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';

  let hour24 = hour % 12;
  if (time.period === 'PM') hour24 += 12;

  const hh = pad2(hour24);
  const mm = pad2(Math.min(59, Math.max(0, minute)));

  // Interprets as local time; backend gets ISO.
  const d = new Date(`${dateOnly}T${hh}:${mm}:00`);
  return d.toISOString();
};

const formatTime = (iso: string) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return ''; }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending':     return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'Completed':   return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Cancelled':   return <XCircle className="w-4 h-4 text-red-500" />;
    case 'In Progress': return <Clock className="w-4 h-4 text-blue-500" />;
    default:            return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const TaskPanel = ({ isOpen, onClose }: TaskPanelProps) => {
  const [view, setView] = useState<PanelView>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Task>(EMPTY_TASK);
  const [dueTime, setDueTime] = useState<DueTime12>({ hour: '12', minute: '00', period: 'AM' });
  const [newComment, setNewComment] = useState('');
  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  // Month picker
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  // Date filter
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Full calendar view
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const { data: tasks = [], isLoading, isError } = useNotes();
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();

  const today = new Date();

  // When viewing a task, sync draft; reset edit mode
  const openDetail = (task: Task) => {
    setSelectedTask(task);
    setDraft({ ...task, dueDate: toInputDateOnly(task.dueDate) });
    setDueTime(parseDueTimeFromISO(task.dueDate));
    setEditMode(false);
    setNewComment('');
    setView('detail');
  };

  // Go to create form
  const openCreate = () => {
    setDraft({ ...EMPTY_TASK, dueDate: '' });
    setDueTime({ hour: '12', minute: '00', period: 'AM' });
    setEditMode(true);
    setView('create');
  };

  // Go back to list
  const goBack = () => {
    setView('list');
    setSelectedTask(null);
    setEditMode(false);
    setNewComment('');
  };

  // If panel closes, reset to list
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => { setView('list'); setSelectedTask(null); setEditMode(false); setNewComment(''); }, 300);
    }
  }, [isOpen]);

  // Save create
  const handleCreate = () => {
    if (!draft.title.trim()) return;
    const dueDateIso = buildDueDateIso(draft.dueDate, dueTime);
    createNote(mapTaskToCreateRequest({ ...draft, dueDate: dueDateIso }), {
      onSuccess: () => goBack(),
    });
  };

  // Save edit
  const handleUpdate = () => {
    if (!selectedTask || !draft.title.trim()) return;
    const dueDateIso = buildDueDateIso(draft.dueDate, dueTime);
    updateNote({ id: selectedTask.id, data: mapTaskToUpdateRequest({ ...draft, dueDate: dueDateIso }) }, {
      onSuccess: () => { setEditMode(false); setSelectedTask({ ...draft }); },
    });
  };

  const handleDelete = () => {
    if (!selectedTask) return;
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    deleteNote(selectedTask.id, { onSuccess: () => goBack() });
  };

  // Add comment without entering edit mode
  const handleAddComment = () => {
    if (!selectedTask || !newComment.trim()) return;
    const text = newComment.trim();

    // Optimistic UI: append a temporary comment locally so user sees it immediately
    const tempComment = { id: `temp-${Date.now()}`, text, createdBy: 'You', createdAt: new Date().toISOString() };
    const optimistic = { ...draft, comments: [...(draft.comments || []), tempComment] };
    setDraft(optimistic);
    setSelectedTask(optimistic);
    setNewComment('');

    updateNote({ id: selectedTask.id, data: { comments: [text] } }, {
      onSuccess: () => {
        // server will invalidate queries and refresh; nothing else needed
      },
      onError: () => {
        // revert optimistic comment on error
        setDraft((prev) => ({ ...prev, comments: (prev.comments || []).filter((c) => c.id !== tempComment.id) }));
        setSelectedTask((prev) => (prev ? { ...prev, comments: (prev.comments || []).filter((c) => c.id !== tempComment.id) } : prev));
      },
    });
  };

  // Calendar helpers are now in renderList (7-day strip)

  if (typeof document === 'undefined') return null;

  //  HEADER 
  const renderHeader = () => {
    if (view === 'list') {
      return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900">Task Panel</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${showCalendar ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-400'}`}
              title="Toggle calendar"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={openCreate}
              className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Create new task
            </button>
          </div>
        </div>
      );
    }

    if (view === 'create') {
      return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900">Create Task</h2>
          </div>
          <button
            onClick={handleCreate}
            disabled={!draft.title.trim() || isCreating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </button>
        </div>
      );
    }

    // detail
    return (
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">Task Details</h2>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete task"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete
            </button>
          )}
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          ) : (
            <button
              onClick={handleUpdate}
              disabled={!draft.title.trim() || isUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          )}
        </div>
      </div>
    );
  };

  //  DETAIL / CREATE FORM 
  const renderDetailForm = () => (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        <div>
          {editMode ? (
            <input
              autoFocus
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Task title *"
              className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400"
            />
          ) : (
            <h3 className="text-base font-semibold text-gray-900">{draft.title || '—'}</h3>
          )}
        </div>

        {/* Created Date (read-only) */}
        {view === 'detail' && draft.createdDate && (
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 mt-1.5 rounded-full bg-gray-300 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Created</p>
              <p className="text-xs text-gray-700">{formatDate(draft.createdDate)}</p>
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="flex items-start gap-3">
          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Due Date</p>
            {editMode ? (
              <div className="flex flex-wrap items-center gap-2">
                <DatePickerInput
                  value={draft.dueDate}
                  onChange={(v) => setDraft({ ...draft, dueDate: v })}
                  placeholder="Select date"
                  className="w-36"
                />

                <div className="flex items-center gap-1">
                  <DropdownSelect
                    size="sm"
                    value={dueTime.hour}
                    onChange={(v) => setDueTime((t) => ({ ...t, hour: v }))}
                    className="w-16"
                    options={Array.from({ length: 12 }, (_, i) => ({ value: pad2(i + 1), label: pad2(i + 1) }))}
                  />
                  <span className="text-xs text-gray-500">:</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-5][0-9]"
                    maxLength={2}
                    value={dueTime.minute}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                      setDueTime((t) => ({ ...t, minute: next }));
                    }}
                    onBlur={() => {
                      const n = Number(dueTime.minute);
                      const safe = Number.isFinite(n) ? Math.min(59, Math.max(0, n)) : 0;
                      setDueTime((t) => ({ ...t, minute: pad2(safe) }));
                    }}
                    className="w-12 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400"
                    placeholder="00"
                  />
                  <DropdownSelect
                    size="sm"
                    value={dueTime.period}
                    onChange={(v) => setDueTime((t) => ({ ...t, period: v as 'AM' | 'PM' }))}
                    className="w-16"
                    options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]}
                  />
                </div>

                <span className="text-[10px] text-gray-400">(12-hour)</span>
              </div>
            ) : (
              <p className="text-xs text-gray-700">
                {draft.dueDate ? formatDate(buildDueDateIso(draft.dueDate, dueTime)) : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Status</p>
            {editMode ? (
              <DropdownSelect
                size="sm"
                value={draft.status}
                onChange={(v) => setDraft({ ...draft, status: v as TaskStatus })}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                {draft.status}
              </span>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Priority</p>
            {editMode ? (
              <DropdownSelect
                size="sm"
                value={draft.priority}
                onChange={(v) => setDraft({ ...draft, priority: v as TaskPriority })}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                ]}
              />
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(draft.priority)}`}>
                {draft.priority}
              </span>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Note</p>
            {editMode ? (
              <textarea
                value={draft.note || ''}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-400 resize-none"
              />
            ) : (
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{draft.note || '—'}</p>
            )}
          </div>
        </div>

        {/* Comments list */}
        {view === 'detail' && draft.comments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Comments</p>
            </div>
            <div className="space-y-3 pl-5">
              {draft.comments.map((c) => (
                <div key={c.id} className="border-l-2 border-gray-100 pl-3">
                  <p className="text-xs text-gray-800">{c.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{c.createdBy} &middot; {formatDate(c.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Comment — only in detail view, not in edit mode */}
      {view === 'detail' && !editMode && (
        <div className="shrink-0 border-t border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newComment.trim()) handleAddComment(); }}
              placeholder="Add a comment"
              className="flex-1 text-xs text-gray-700 bg-transparent border-b border-gray-200 focus:border-blue-400 focus:outline-none py-1.5 transition-colors placeholder-gray-300"
            />
            {newComment.trim() && (
              <button
                onClick={handleAddComment}
                disabled={isUpdating}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <SendHorizonal className="w-3 h-3" />}
                Add
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  //  LIST VIEW 
  const renderList = () => {
    const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Build week strip based on weekOffset
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    const strip = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    // Displayed month/year for the strip header
    const midDate = strip[3];
    const displayedMonth = midDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const hasTaskOnDate = (date: Date) => tasks.some((t) => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), date);
    });

    const isToday = (date: Date) => isSameDay(date, today);

    // Jump to first week of selected month
    const jumpToMonth = (year: number, month: number) => {
      const firstDay = new Date(year, month, 1);
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = Math.round((firstDay.getTime() - todayMidnight.getTime()) / 86_400_000);
      setWeekOffset(Math.round(diffDays / 7));
      setShowMonthPicker(false);
    };

    // Calendar grid helpers
    const firstDayOfCal = new Date(calYear, calMonth, 1).getDay();
    const daysInCal = new Date(calYear, calMonth + 1, 0).getDate();
    const calCells: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfCal; i++) calCells.push(null);
    for (let d = 1; d <= daysInCal; d++) calCells.push(new Date(calYear, calMonth, d));
    while (calCells.length % 7 !== 0) calCells.push(null);

    const prevCalMonth = () => {
      if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
      else setCalMonth((m) => m - 1);
    };
    const nextCalMonth = () => {
      if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
      else setCalMonth((m) => m + 1);
    };

    // Filtered tasks by selected date
    const filteredTasks = selectedDate
      ? tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate))
      : tasks;

    return (
      <>
        {/* Strip / Calendar */}
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          {/* Navigation header */}
          <div className="flex items-center justify-between mb-2 relative">
            <button
              onClick={showCalendar ? prevCalMonth : () => setWeekOffset((w) => w - 1)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={showCalendar ? 'Previous month' : 'Previous week'}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showCalendar ? (
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                {MONTHS[calMonth]} {calYear}
              </span>
            ) : (
              <button
                onClick={() => { setPickerYear(midDate.getFullYear()); setShowMonthPicker((v) => !v); }}
                className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 transition-colors"
              >
                {displayedMonth}
              </button>
            )}

            <button
              onClick={showCalendar ? nextCalMonth : () => setWeekOffset((w) => w + 1)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title={showCalendar ? 'Next month' : 'Next week'}
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Month picker dropdown (week strip mode only) */}
            {!showCalendar && showMonthPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-3 h-3 text-gray-500" />
                  </button>
                  <span className="text-xs font-semibold text-gray-700">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((m, idx) => {
                    const isCurrent =
                      pickerYear === today.getFullYear() && idx === today.getMonth();
                    return (
                      <button
                        key={m}
                        onClick={() => jumpToMonth(pickerYear, idx)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          isCurrent
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setWeekOffset(0); setShowMonthPicker(false); }}
                  className="mt-2 w-full py-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  Today
                </button>
              </div>
            )}
          </div>

          {showCalendar ? (
            /* Full calendar grid */
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAY_LETTERS.map((d, i) => (
                  <div key={i} className="text-center text-[9px] font-medium text-gray-400 py-0.5">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {calCells.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const todayFlag = isToday(date);
                  const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;
                  const hasTask = hasTaskOnDate(date);
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(isSelected ? null : date); setShowCalendar(false); }}
                      className="flex flex-col items-center py-0.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : todayFlag
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasTask && (
                        <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-blue-300' : todayFlag ? 'bg-white' : 'bg-gray-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* 7-day week strip */
            <div className="flex items-center justify-between gap-1">
              {strip.map((date, i) => {
                const todayFlag = isToday(date);
                const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;
                const hasTask = hasTaskOnDate(date);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : date)}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <span className={`text-[10px] font-medium ${todayFlag || isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                      {DAY_LETTERS[date.getDay()]}
                    </span>
                    <div className={`
                      relative w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : todayFlag
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'}
                    `}>
                      {date.getDate()}
                      {hasTask && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected || todayFlag ? 'bg-white' : 'bg-gray-900'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date shortcut chips */}
        <div className="flex items-center gap-1.5 px-4 pt-2 pb-1 shrink-0">
          {[
            { label: 'Yesterday', offset: -1 },
            { label: 'Today',     offset: 0  },
            { label: 'Tomorrow',  offset: 1  },
          ].map(({ label, offset }) => {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            const isActive = selectedDate ? isSameDay(selectedDate, d) : false;
            return (
              <button
                key={label}
                onClick={() => setSelectedDate(isActive ? null : d)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Activities */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Activities</h3>
                {selectedDate && (
                  <span className="text-[10px] text-gray-400">
                    — {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Show all
                  </button>
                )}
                <Menu className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}
            {isError && <p className="text-xs text-red-500 text-center py-4">Failed to load tasks.</p>}
            {!isLoading && !isError && filteredTasks.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                {selectedDate ? 'No tasks for this date.' : 'No tasks yet.'}
              </p>
            )}
            <div className="space-y-1.5">
              {filteredTasks.map((task) => (
                <button key={task.id} onClick={() => openDetail(task)} className="flex items-center w-full gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{formatTime(task.dueDate) || formatTime(task.createdDate)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 opacity-70 group-hover:opacity-100">{getStatusIcon(task.status)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-70 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {renderHeader()}
        {(view === 'detail' || view === 'create') ? renderDetailForm() : renderList()}
      </div>
    </>,
    document.body
  );
};

export default TaskPanel;
