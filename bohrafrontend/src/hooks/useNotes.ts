import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notesService, {
  type GetNotesParams,
  type CreateNoteRequest,
  type UpdateNoteRequest,
  type ApiNote,
} from '../services/notesService';
import type { Task } from '../types';
import { toast } from '../utils/toast';

/** Map an API note object to the internal Task shape */
export const mapNoteToTask = (note: ApiNote): Task => ({
  id: note.id || note._id,
  title: note.title,
  note: note.note || '',
  status: note.status as Task['status'],
  priority: note.priority as Task['priority'],
  // Store the full ISO string; consumers can format as needed
  dueDate: note.dueDate || '',
  createdDate: note.createdAt || '',
  createdBy: note.createdBy?.name || '',
  comments: (note.comments || []).map((c) => ({
    id: c._id,
    text: c.text,
    createdBy: c.commentedBy?.name || '',
    createdAt: c.createdAt || '',
  })),
});

/** Map the internal Task shape back to an UpdateNoteRequest */
export const mapTaskToUpdateRequest = (task: Task): UpdateNoteRequest => ({
  title: task.title,
  note: task.note,
  dueDate: task.dueDate,
  status: task.status,
  priority: task.priority,
});

/** Map the internal Task shape to a CreateNoteRequest */
export const mapTaskToCreateRequest = (task: Task): CreateNoteRequest => ({
  title: task.title,
  note: task.note || '',
  dueDate: task.dueDate,
  status: task.status,
  priority: task.priority,
});

/** Fetch notes list with optional filters */
export const useNotes = (params: GetNotesParams = {}) => {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const response = await notesService.getNotes(params);
      return response.data.map(mapNoteToTask);
    },
  });
};

/** Create a new note */
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoteRequest) => notesService.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Task Created', 'New task has been added.');
    },
    onError: () => toast.error('Create Failed', 'Could not create the task.'),
  });
};

/** Update an existing note by id */
export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) =>
      notesService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Task Updated', 'Task details have been saved.');
    },
    onError: () => toast.error('Update Failed', 'Could not update the task.'),
  });
};

/** Delete a note by id */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Task Deleted', 'Task has been removed.');
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the task.'),
  });
};
