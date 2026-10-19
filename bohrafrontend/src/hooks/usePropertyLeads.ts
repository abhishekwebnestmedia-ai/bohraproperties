import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import propertyLeadsService, { type GetPropertyLeadsParams, type PropertyLead, type CreatePropertyLeadData } from '../services/propertyLeadsService';
import { toast } from '../utils/toast';

/**
 * Hook to get property dashboard data
 */
export const usePropertyDashboard = (range: string = 'yearly') => {
  return useQuery({
    queryKey: ['propertyDashboard', range],
    queryFn: () => propertyLeadsService.getDashboard(range),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get all property leads
 */
export const usePropertyLeads = (params?: GetPropertyLeadsParams) => {
  return useQuery({
    queryKey: ['propertyLeads', params],
    queryFn: () => propertyLeadsService.getAll(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to get property lead by ID
 */
export const usePropertyLead = (id: string) => {
  return useQuery({
    queryKey: ['propertyLead', id],
    queryFn: () => propertyLeadsService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create property lead
 */
export const useCreatePropertyLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePropertyLeadData) => propertyLeadsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
      toast.lead('Lead Created', 'New property lead has been added.');
    },
    onError: () => toast.error('Create Failed', 'Could not create the property lead.'),
  });
};

/**
 * Hook to update property lead (with optimistic update so table reflects instantly)
 */
export const useUpdatePropertyLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyLead> }) =>
      propertyLeadsService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['propertyLeads'] });
      // Snapshot all matching query data so we can roll back on error
      const snapshots = queryClient.getQueriesData<{ data: PropertyLead[]; [k: string]: any }>({
        queryKey: ['propertyLeads'],
      });
      // Apply optimistic patch to every cached page
      queryClient.setQueriesData(
        { queryKey: ['propertyLeads'] },
        (old: { data: PropertyLead[]; [k: string]: any } | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((lead) =>
              lead._id === id ? { ...lead, ...data } : lead
            ),
          };
        }
      );
      return { snapshots };
    },
    onSuccess: () => toast.success('Lead Updated', 'Property lead details have been saved.'),
    onError: (_err, _vars, context) => {
      // Roll back on failure
      context?.snapshots?.forEach(([queryKey, value]) =>
        queryClient.setQueryData(queryKey, value)
      );
      toast.error('Update Failed', 'Could not update the property lead.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyLead'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
    },
  });
};

/**
 * Hook to update property lead activity/follow-up status
 */
export const useUpdatePropertyLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      propertyLeadsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyLead'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
      toast.success('Status Updated', 'Lead status has been changed.');
    },
    onError: () => toast.error('Update Failed', 'Could not update lead status.'),
  });
};

/**
 * Hook to advance a property lead's lifecycle stage.
 * Strictly one-way; backend enforces the progression.
 */
export const useUpdatePropertyLeadStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: 'Lead' | 'Token' | 'Completed' | 'Dead' }) =>
      propertyLeadsService.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyLead'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
    },
  });
};

/**
 * Hook to get property lead history
 */
export const usePropertyLeadHistory = (id: string) => {
  return useQuery({
    queryKey: ['propertyLeadHistory', id],
    queryFn: () => propertyLeadsService.getHistory(id),
    enabled: !!id,
  });
};

/**
 * Hook to update follow-up date
 */
export const useUpdatePropertyLeadFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, followUpDate }: { id: string; followUpDate: string }) =>
      propertyLeadsService.updateFollowUp(id, followUpDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyLead'] });
    },
  });
};

/**
 * Hook to transfer property lead
 */
export const useTransferPropertyLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, relationshipManager, relationshipManagerName }: { id: string; relationshipManager?: string; relationshipManagerName?: string }) =>
      propertyLeadsService.transfer(id, relationshipManager, relationshipManagerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyLead'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
      toast.transfer('Lead Transferred', 'Property lead has been transferred.');
    },
    onError: () => toast.error('Transfer Failed', 'Could not transfer the property lead.'),
  });
};

/**
 * Hook to delete property lead
 */
export const useDeletePropertyLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => propertyLeadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
      toast.success('Lead Deleted', 'Property lead has been permanently removed.');
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the property lead.'),
  });
};

/**
 * Hook to bulk upload leads
 */
export const useBulkUploadPropertyLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => propertyLeadsService.bulkUpload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
    },
  });
};

/**
 * Hook to bulk transfer leads
 */
export const useBulkTransferPropertyLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, relationshipManager }: { ids: string[]; relationshipManager: string }) =>
      propertyLeadsService.bulkTransfer(ids, relationshipManager),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDashboard'] });
    },
  });
};

/**
 * Hook to bulk delete leads
 */
export const useBulkDeletePropertyLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => propertyLeadsService.bulkDelete(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['propertyLeads'] });
      toast.success('Leads Deleted', `${ids.length} lead(s) have been permanently removed.`);
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the selected leads.'),
  });
};
