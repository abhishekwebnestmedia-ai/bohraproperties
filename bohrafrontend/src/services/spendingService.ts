import api from './api';

export interface SpendingStatsItem {
  type: string;
  totalAmount: number;
  currentAmount: number;
  previousAmount: number;
  changePercent: number;
}

export interface SpendingStatsResponse {
  success: boolean;
  range: string;
  data: SpendingStatsItem[];
}

export interface SpendingCreator {
  _id: string;
  name: string;
  id: string;
}

export interface SpendingEntry {
  _id: string;
  type: string;
  amount: number;
  note: string;
  createdBy: SpendingCreator;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface SpendingListResponse {
  success: boolean;
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: SpendingEntry[];
}

export interface CreateSpendingData {
  type: string;
  amount: number;
  note: string;
}

export interface UpdateSpendingData {
  type?: string;
  amount?: number;
  note?: string;
}

// Fetch spending stats
export const getSpendingStats = async (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Promise<SpendingStatsResponse> => {
  const response = await api.get(`/opera/spending-stats?range=${range}`);
  return response.data;
};

// Fetch spending list with pagination
export const getSpendings = async (page: number = 1, limit: number = 10, type?: string): Promise<SpendingListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (type) {
    params.append('type', type);
  }
  
  const response = await api.get(`/opera/spending?${params.toString()}`);
  return response.data;
};

// Create new spending
export const createSpending = async (data: CreateSpendingData): Promise<SpendingEntry> => {
  const response = await api.post('/opera/spending', data);
  return response.data;
};

// Update spending
export const updateSpending = async (id: string, data: UpdateSpendingData): Promise<SpendingEntry> => {
  const response = await api.put(`/opera/spending/${id}`, data);
  return response.data;
};

// Delete spending
export const deleteSpending = async (id: string): Promise<void> => {
  await api.delete(`/opera/spending/${id}`);
};

// Operations dashboard (totalLeads, totalSpending, conversionRate)
export interface OperationsDashboardResponse {
  success: boolean;
  cards: {
    totalLeads: number;
    totalSpending: number;
    conversionRate: number;
  };
  charts: {
    performance: Array<{ _id: number; spending: number }>;
    sources: Array<{ _id: string; total: number }>;
  };
}

export const getOperationsDashboard = async (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<OperationsDashboardResponse> => {
  const response = await api.get(`/opera/dashboard?range=${range}`);
  return response.data;
};

// Lead source chart (time-series per source)
export interface LeadSourceChartRow {
  date: string;
  [source: string]: string | number;
}

export interface LeadSourceChartResponse {
  success: boolean;
  range: string;
  data: LeadSourceChartRow[];
}

export const getLeadSourceChart = async (
  range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
): Promise<LeadSourceChartResponse> => {
  const response = await api.get(`/opera/lead-source-chart?range=${range}`);
  return response.data;
};
