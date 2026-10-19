import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSpendingStats,
  getSpendings,
  createSpending,
  updateSpending,
  deleteSpending,
  getLeadSourceChart,
  getOperationsDashboard,
} from '../services/spendingService';
import type {
  CreateSpendingData,
  UpdateSpendingData,
} from '../services/spendingService';
import { toast } from '../utils/toast';

// Hook to fetch spending stats
export const useSpendingStats = (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily') => {
  return useQuery({
    queryKey: ['spendingStats', range],
    queryFn: () => getSpendingStats(range),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch spending list
export const useSpendings = (page: number = 1, limit: number = 10, type?: string) => {
  return useQuery({
    queryKey: ['spendings', page, limit, type],
    queryFn: () => getSpendings(page, limit, type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create spending
export const useCreateSpending = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpendingData) => createSpending(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendingStats'] });
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      toast.success('Expense Added', 'New spending has been recorded.');
    },
    onError: () => toast.error('Create Failed', 'Could not add the expense.'),
  });
};

// Hook to update spending
export const useUpdateSpending = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpendingData }) => 
      updateSpending(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendingStats'] });
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      toast.success('Expense Updated', 'Spending details have been saved.');
    },
    onError: () => toast.error('Update Failed', 'Could not update the expense.'),
  });
};

// Hook to delete spending
export const useDeleteSpending = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSpending(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spendingStats'] });
      queryClient.invalidateQueries({ queryKey: ['spendings'] });
      toast.success('Expense Deleted', 'Spending has been removed.');
    },
    onError: () => toast.error('Delete Failed', 'Could not remove the expense.'),
  });
};

// Hook to fetch lead source time-series chart data
export const useLeadSourceChart = (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
  return useQuery({
    queryKey: ['leadSourceChart', range],
    queryFn: () => getLeadSourceChart(range),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch operations dashboard (totalLeads, totalSpending, conversionRate)
export const useOperationsDashboard = (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
  return useQuery({
    queryKey: ['operationsDashboard', range],
    queryFn: () => getOperationsDashboard(range),
    staleTime: 5 * 60 * 1000,
  });
};
