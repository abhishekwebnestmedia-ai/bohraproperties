import api from './api';

export interface ApiNote {
  _id: string;
  id: string;
  title: string;
  note: string;
  reminderSent: boolean;
  dueDate: string;
  status: string;
  priority: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
    employeeId: string;
    id: string;
  };
  comments: Array<{
    _id: string;
    text: string;
    commentedBy: {
      _id: string;
      name: string;
      email: string;
      role: string;
      employeeId: string;
      id: string;
    };
    createdAt: string;
  }>;
  deleteAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  success: boolean;
  message: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: ApiNote[];
}

export interface GetNotesParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface CreateNoteRequest {
  title: string;
  note: string;
  dueDate: string;
  status: string;
  priority: string;
  comments?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  note?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  comments?: string[];
}

class NotesService {
  async getNotes(params: GetNotesParams = {}): Promise<NotesResponse> {
    const response = await api.get<NotesResponse>('/notes', { params });
    return response.data;
  }

  async createNote(data: CreateNoteRequest): Promise<{ success: boolean; message: string; data: ApiNote }> {
    const response = await api.post('/notes', data);
    return response.data;
  }

  async updateNote(id: string, data: UpdateNoteRequest): Promise<{ success: boolean; message: string; data: ApiNote }> {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
}

export const notesService = new NotesService();
export default notesService;
