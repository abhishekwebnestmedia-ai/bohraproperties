import api from './api';

// Property Lead Interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  employeeId: string;
  id: string;
}

export interface PropertyLead {
  _id: string;
  clientName: string;
  contactNumber: string;
  email?: string;
  budget?: string;
  location?: string;
  project?: string;
  propertyType?: string;
  source?: string;
  followUpDate?: string;
  /** Lifecycle stage — drives the table tab (Lead / Token / Completed / Dead) */
  stage: 'Lead' | 'Token' | 'Completed' | 'Dead';
  /** Activity / follow-up status within the current stage */
  status?: string | null;
  notes?: string;
  remarks?: string;
  createdBy?: User;
  teamLead?: User | null;
  relationshipManager?: User | null;
  transferDate?: string | null;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
  __v?: number;
}

export interface CreatePropertyLeadData {
  clientName: string;
  contactNumber: string;
  email?: string;
  budget?: string;
  location?: string;
  project?: string;
  propertyType?: string;
  source?: string;
  followUpDate?: string;
  /** Lifecycle stage to start at; defaults to "Lead" on the backend */
  stage?: 'Lead' | 'Token' | 'Completed' | 'Dead';
  /** Activity status (Follow up / Interested / etc.) */
  status?: string;
  notes?: string;
  remarks?: string;
  teamLead?: string;
  relationshipManager?: string;
  teamLeadName?: string;
  relationshipManagerName?: string;
}

export interface StatWithChange {
  value: number;
  change: number;
}

export interface PropertyDashboardData {
  success: boolean;
  range: string;
  cards: {
    totalLeads: StatWithChange;
    activeDeals: StatWithChange;
    completed: StatWithChange;
    pending: StatWithChange;
    token: StatWithChange;
    conversionRate: StatWithChange;
  };
  performance: {
    daily: Array<{ _id: string; leads: number; completed: number; }>;
    weekly: Array<{ _id: string; leads: number; completed: number; }>;
    monthly: Array<{ _id: string; leads: number; completed: number; }>;
    yearly: Array<{ _id: string; leads: number; completed: number; }>;
  };
  sources: {
    daily: Array<{ _id: string; count: number; }>;
    weekly: Array<{ _id: string; count: number; }>;
    monthly: Array<{ _id: string; count: number; }>;
    yearly: Array<{ _id: string; count: number; }>;
  };
  recentLeads: PropertyLead[];
}

export interface PropertyLeadsResponse {
  success: boolean;
  message: string;
  data: PropertyLead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetPropertyLeadsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  teamLead?: string;
  employee?: string;
  rm?: string;
  transferTo?: string;
  unassigned?: boolean;
  from?: string;
  to?: string;
  followFrom?: string;
  followTo?: string;
  activityStatus?: string;
}

class PropertyLeadsService {
  /**
   * Get property dashboard data
   */
  async getDashboard(range: string = 'yearly'): Promise<PropertyDashboardData> {
    const response = await api.get('/pleads/pdashboard', { params: { range } });
    return response.data;
  }

  /**
   * Get all property leads with filters
   */
  async getAll(params?: GetPropertyLeadsParams): Promise<PropertyLeadsResponse> {
    const response = await api.get('/pleads', { params });
    return response.data;
  }

  /**
   * Get property lead by ID
   */
  async getById(id: string): Promise<{ success: boolean; data: PropertyLead; lead?: PropertyLead }> {
    const response = await api.get(`/pleads/${id}`);
    return response.data;
  }

  /**
   * Create new property lead
   */
  async create(data: CreatePropertyLeadData): Promise<{ success: boolean; message: string; lead: PropertyLead }> {
    const response = await api.post('/pleads', data);
    return response.data;
  }

  /**
   * Update property lead
   */
  async update(id: string, data: Partial<PropertyLead>): Promise<{ success: boolean; message: string; lead: PropertyLead }> {
    const response = await api.put(`/pleads/${id}`, data);
    return response.data;
  }

  /**
   * Update lead activity/follow-up status (Follow up / Interested / etc.)
   */
  async updateStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/pleads/${id}/status`, { status });
    return response.data;
  }

  /**
   * Advance lead lifecycle stage.
   * Strictly one-way; backend enforces the progression.
   */
  async updateStage(id: string, stage: 'Lead' | 'Token' | 'Completed' | 'Dead'): Promise<{ success: boolean; message: string; data?: PropertyLead }> {
    const response = await api.patch(`/pleads/${id}/stage`, { stage });
    return response.data;
  }

  /**
   * Update follow-up date
   */
  async updateFollowUp(id: string, followUpDate: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/pleads/${id}/followup`, { followUpDate });
    return response.data;
  }

  /**
   * Transfer lead to another user
   */
  async transfer(id: string, relationshipManager?: string, relationshipManagerName?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/pleads/${id}/transfer`, { relationshipManager, relationshipManagerName });
    return response.data;
  }

  /**
   * Delete property lead
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/pleads/${id}`);
    return response.data;
  }

  /**
   * Get lead history
   */
  async getHistory(id: string): Promise<{ success: boolean; history: any[] }> {
    const response = await api.get(`/pleads/${id}/history`);
    return response.data;
  }

  /**
   * Bulk upload leads
   */
  async bulkUpload(file: File): Promise<{ success: boolean; message: string; added: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/pleads/bulk-upload', formData);
    return response.data;
  }

  /**
   * Bulk transfer leads
   */
  async bulkTransfer(ids: string[], relationshipManager: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/pleads/bulk-transfer', { ids, relationshipManager });
    return response.data;
  }

  /**
   * Bulk delete leads
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await api.delete('/pleads/bulk-delete', { data: { ids } });
    return response.data;
  }
}

export const propertyLeadsService = new PropertyLeadsService();
export default propertyLeadsService;
