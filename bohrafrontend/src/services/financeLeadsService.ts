import api from './api';

// Finance Lead Interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  employeeId: string;
  id: string;
}

export interface FinanceLead {
  _id: string;
  clientName: string;
  contactNumber: string;
  email?: string;
  loanRequirement?: string;
  location?: string;
  project?: string;
  eligibility?: string;
  source?: string;
  followUpDate?: string;
  /** Lifecycle stage — drives the table tab (Lead / Login) */
  stage: 'Lead' | 'Login';
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

export interface CreateFinanceLeadData {
  clientName: string;
  contactNumber: string;
  email?: string;
  loanRequirement?: string;
  location?: string;
  project?: string;
  eligibility?: string;
  source?: string;
  followUpDate?: string;
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

export interface FinanceDashboardData {
  success: boolean;
  range: string;
  cards: {
    loanApplications: StatWithChange;
    activeDeals: StatWithChange;
    loggedIn: StatWithChange;
    pendingTasks: StatWithChange;
    conversionRate: StatWithChange;
  };
  performance: {
    daily: Array<{ _id: string; leads: number; loggedIn: number; }>;
    weekly: Array<{ _id: string; leads: number; loggedIn: number; }>;
    monthly: Array<{ _id: string; leads: number; loggedIn: number; }>;
    yearly: Array<{ _id: string; leads: number; loggedIn: number; }>;
  };
  sources: {
    daily: Array<{ _id: string; count: number; }>;
    weekly: Array<{ _id: string; count: number; }>;
    monthly: Array<{ _id: string; count: number; }>;
    yearly: Array<{ _id: string; count: number; }>;
  };
  recentLeads: FinanceLead[];
}

export interface FinanceLeadsResponse {
  success: boolean;
  message: string;
  data: FinanceLead[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetFinanceLeadsParams {
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

class FinanceLeadsService {
  /**
   * Get finance dashboard data
   */
  async getDashboard(range: string = 'yearly'): Promise<FinanceDashboardData> {
    const response = await api.get('/fleads/fdashboard', { params: { range } });
    return response.data;
  }

  /**
   * Get all finance leads with filters
   */
  async getAll(params?: GetFinanceLeadsParams): Promise<FinanceLeadsResponse> {
    const response = await api.get('/fleads', { params });
    return response.data;
  }

  /**
   * Get finance lead by ID
   */
  async getById(id: string): Promise<{ success: boolean; data: FinanceLead; lead?: FinanceLead }> {
    const response = await api.get(`/fleads/${id}`);
    return response.data;
  }

  /**
   * Create new finance lead
   */
  async create(data: CreateFinanceLeadData): Promise<{ success: boolean; message: string; lead: FinanceLead }> {
    const response = await api.post('/fleads', data);
    return response.data;
  }

  /**
   * Update finance lead
   */
  async update(id: string, data: Partial<FinanceLead>): Promise<{ success: boolean; message: string; lead: FinanceLead }> {
    const response = await api.put(`/fleads/${id}`, data);
    return response.data;
  }

  /**
   * Update finance lead status
   */
  async updateStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/fleads/${id}/status`, { status });
    return response.data;
  }

  /**
   * Update follow-up date
   */
  async updateFollowUp(id: string, followUpDate: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/fleads/${id}/followup`, { followUpDate });
    return response.data;
  }

  /**
   * Advance lead lifecycle stage (Lead → Login). Strictly one-way.
   */
  async updateStage(id: string, stage: 'Lead' | 'Login'): Promise<{ success: boolean; message: string; data?: FinanceLead }> {
    const response = await api.patch(`/fleads/${id}/stage`, { stage });
    return response.data;
  }

  /**
   * Transfer lead to another user
   */
  async transfer(id: string, relationshipManager?: string, relationshipManagerName?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/fleads/${id}/transfer`, { relationshipManager, relationshipManagerName });
    return response.data;
  }

  /**
   * Delete finance lead
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/fleads/${id}`);
    return response.data;
  }

  /**
   * Get lead history
   */
  async getHistory(id: string): Promise<{ success: boolean; history: any[] }> {
    const response = await api.get(`/fleads/${id}/history`);
    return response.data;
  }

  /**
   * Bulk upload leads
   */
  async bulkUpload(file: File): Promise<{ success: boolean; message: string; added: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/fleads/bulk-upload', formData);
    return response.data;
  }

  /**
   * Bulk transfer leads
   */
  async bulkTransfer(ids: string[], relationshipManager: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/fleads/bulk-transfer', { ids, relationshipManager });
    return response.data;
  }

  /**
   * Bulk delete leads
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await api.delete('/fleads/bulk-delete', { data: { ids } });
    return response.data;
  }
}

export const financeLeadsService = new FinanceLeadsService();
export default financeLeadsService;
