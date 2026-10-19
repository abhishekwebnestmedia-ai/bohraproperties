import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inventoryService, {
  type GetInventoryParams,
  type CreateInventoryData,
  type UpdateInventoryData,
} from '../services/inventoryService';
import { toast } from '../utils/toast';

/**
 * Hook to get all inventory items
 */
export const useInventory = (params?: GetInventoryParams) => {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryService.getAll(params),
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to get inventory item by ID
 */
export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: ['inventoryItem', id],
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create inventory item
 */
export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryData) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Property Added', 'New inventory property has been added.');
    },
    onError: () => toast.error('Create Failed', 'Could not add the inventory property.'),
  });
};

/**
 * Hook to update inventory item
 */
export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryData }) =>
      inventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItem'] });
      toast.success('Property Updated', 'Inventory details have been saved.');
    },
    onError: () => toast.error('Update Failed', 'Could not update the inventory property.'),
  });
};

/**
 * Hook to delete inventory item
 */
export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Property Deleted', 'Inventory property has been permanently removed.');
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the inventory property.'),
  });
};

/**
 * Hook to bulk delete inventory items
 */
export const useBulkDeleteInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => inventoryService.bulkDelete(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Items Deleted', `${ids.length} item(s) have been permanently removed.`);
    },
    onError: () => toast.error('Delete Failed', 'Could not delete the selected items.'),
  });
};
