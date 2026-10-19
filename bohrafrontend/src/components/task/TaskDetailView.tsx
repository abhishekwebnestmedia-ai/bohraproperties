import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Save, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import DropdownSelect from '../common/DropdownSelect';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import DatePickerInput from '../common/DatePickerInput';

interface TaskDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = panel is hidden; task with id "new" = create mode */
  task: Task | null;
  onSave: (task: Task) => void;
}

const EMPTY_TASK: Task = {
  id: 'new',
  title: '',
  note: '',
  status: 'Pending',
  priority: 'Medium',
  dueDate: '',
  createdDate: '',
  createdBy: '',
  comments: [],
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

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
};

const toInputDate = (iso: string) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().split('T')[0]; } catch { return iso; }
};

/** Convert YYYY-MM-DD back to ISO for saving */
const toISODate = (val: string) => {
  if (!val) return '';
  try { return new Date(val).toISOString(); } catch { return val; }
};

const TaskDetailView = ({ isOpen, onClose, task, onSave }: TaskDetailViewProps) => {
  const isNew = !task || task.id === 'new';

  // editMode = true immediately for new tasks, false for existing
  const [editMode, setEditMode] = useState(isNew);
  const [draft, setDraft] = useState<Task>(task ?? EMPTY_TASK);
  const [newComment, setNewComment] = useState('');

  // Sync whenever task prop changes
  useEffect(() => {
    if (task) {
      setDraft({ ...task });
      setEditMode(task.id === 'new');
    } else {
      setDraft(EMPTY_TASK);
      setEditMode(true);
    }
  }, [task]);

  const handleSave = () => {
    if (!draft.title.trim()) return;
    // Convert dueDate input (YYYY-MM-DD) to ISO string for API
    const toSave = { ...draft, dueDate: toISODate(draft.dueDate) };
    onSave(toSave);
    setEditMode(false);
  };

  const field = <div className="flex items-start gap-2.5 py-2">
    {/* placeholder – real fields below */}
  </div>;
  void field; // suppress unused var

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-70 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {isNew ? 'Create Task' : 'Task Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
            {(isNew || editMode) && (
              <button
                onClick={handleSave}
                disabled={!draft.title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            )}
          </div>
        </div>

        {/* Content */}
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

          {/* Created Date (read-only always) */}
          {!isNew && (
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 mt-1.5 rounded-full bg-gray-300 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Created</p>
                <p className="text-xs text-gray-700">{formatDateTime(draft.createdDate)}</p>
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Due Date</p>
              {editMode ? (
                <DatePickerInput
                  value={toInputDate(draft.dueDate)}
                  onChange={(v) => setDraft({ ...draft, dueDate: v })}
                  placeholder="Select due date"
                  className="w-40"
                />
              ) : (
                <p className="text-xs text-gray-700">{formatDateTime(draft.dueDate)}</p>
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

          {/* Comments (read-only display) */}
          {draft.comments.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Comments</p>
              <div className="space-y-2 pl-2">
                {draft.comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between group">
                    <div>
                      <p className="text-xs text-gray-700">{c.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.createdBy}  {formatDateTime(c.createdAt)}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-100 rounded transition-opacity">
                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add comment input */}
          <div className="border-t border-gray-100 pt-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment"
              className="w-full px-0 py-1 text-xs text-gray-500 bg-transparent border-none focus:outline-none placeholder-gray-300"
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default TaskDetailView;

