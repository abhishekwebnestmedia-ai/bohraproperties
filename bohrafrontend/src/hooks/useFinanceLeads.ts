import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import financeLeadsService, { type GetFinanceLeadsParams, type FinanceLead, type CreateFinanceLeadData } from '../services/financeLeadsService';
import { toast } from '../utils/toast';

/**
 * Hook to get finance dashboard data
 */
export const useFinanceDashboard = (range: string = 'yearly') => {
  return useQuery({
    queryKey: ['financeDashboard', range],
    queryFn: () => financeLeadsService.getDashboard(range),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get all finance leads
 */
export const useFinanceLeads = (params?: GetFinanceLeadsParams) => {
  return useQuery({
    queryKey: ['financeLeads', params],
    queryFn: () => financeLeadsService.getAll(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get finance lead by ID
 */
export const useFinanceLead = (id: string) => {
  return useQuery({
    queryKey: ['financeLead', id],
    queryFn: () => financeLeadsService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create finance lead
 */
export const useCreateFinanceLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFinanceLeadData) => financeLeadsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      toast.lead('Lead Created', 'New finance lead has been added.');
    },
    onError: () => toast.error('Create Failed', 'Could not create the finance lead.'),
  });
};

/**
 * Hook to update finance lead
 */
export const useUpdateFinanceLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinanceLead> }) =>
      financeLeadsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeLead'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      toast.success('Lead Updated', 'Finance lead details have been saved.');
    },
    onError: () => toast.error('Update Failed', 'Could not update the finance lead.'),
  });
};

/**
 * Hook to update finance lead status
 */
export const useUpdateFinanceLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      financeLeadsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeLead'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      toast.success('Status Updated', 'Lead status has been changed.');
    },
    onError: () => toast.error('Update Failed', 'Could not update lead status.'),
  });
};

/**
 * Hook to advance a finance lead's lifecycle stage (Lead → Login).
 * Strictly one-way; backend enforces the progression.
 */
export const useUpdateFinanceLeadStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: 'Lead' | 'Login' }) =>
      financeLeadsService.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeLead'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financeLeadHistory'] });
    },
    onError: () => toast.error('Stage Update Failed', 'Could not advance the lead stage.'),
  });
};

/**
 * Hook to update follow-up date
 */
export const useUpdateFinanceLeadFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, followUpDate }: { id: string; followUpDate: string }) =>
      financeLeadsService.updateFollowUp(id, followUpDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeLead'] });
    },
  });
};

/**
 * Hook to transfer finance lead
 */
export const useTransferFinanceLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, relationshipManager, relationshipManagerName }: { id: string; relationshipManager?: string; relationshipManagerName?: string }) =>
      financeLeadsService.transfer(id, relationshipManager, relationshipManagerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeLead'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      toast.transfer('Lead Transferred', 'Finance lead has been transferred.');
    },
    onError: () => toast.error('Transfer Failed', 'Could not transfer the finance lead.'),
  });
};

/**
 * Hook to delete finance lead
 */
export const useDeleteFinanceLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financeLeadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      toast.success('Lead Deleted', 'Finance lead has been permanently removed.');
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the finance lead.'),
  });
};

/**
 * Hook to get lead history
 */
export const useFinanceLeadHistory = (id: string) => {
  return useQuery({
    queryKey: ['financeLeadHistory', id],
    queryFn: () => financeLeadsService.getHistory(id),
    enabled: !!id,
  });
};

/**
 * Hook to bulk upload leads
 */
export const useBulkUploadFinanceLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => financeLeadsService.bulkUpload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
    },
  });
};

/**
 * Hook to bulk transfer leads
 */
export const useBulkTransferFinanceLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, relationshipManager }: { ids: string[]; relationshipManager: string }) =>
      financeLeadsService.bulkTransfer(ids, relationshipManager),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
    },
  });
};

/**
 * Hook to bulk delete finance leads
 */
export const useBulkDeleteFinanceLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => financeLeadsService.bulkDelete(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] });
      toast.success('Leads Deleted', `${ids.length} lead(s) have been permanently removed.`);
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the selected leads.'),
  });
};
