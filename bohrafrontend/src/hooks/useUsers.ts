import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';

/** Emails to hide from all frontend user lists */
const HIDDEN_EMAILS = ['webnestmediacrm@gmail.com'];

const filterHiddenUsers = (data: Awaited<ReturnType<typeof authService.getAllUsers>>) => ({
  ...data,
  users: data.users.filter(u => !HIDDEN_EMAILS.includes(u.email.toLowerCase())),
});

/**
 * Hook to get all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => authService.getAllUsers(),
    select: filterHiddenUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get users filtered by role
 */
export const useUsersByRole = (role?: string) => {
  return useQuery({
    queryKey: ['users', role],
    queryFn: () => authService.getAllUsers(),
    select: (data) => {
      const filtered = filterHiddenUsers(data);
      if (!role) return filtered;
      return {
        ...filtered,
        users: filtered.users.filter(user => user.role === role)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get leads assigned to a specific user
 */
export const useUserLeads = (
  userId: string,
  params?: { page?: number; limit?: number; status?: string; search?: string }
) => {
  return useQuery({
    queryKey: ['userLeads', userId, params],
    queryFn: () => authService.getUserLeads(userId, params),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get users filtered by domain
 */
export const useUsersByDomain = (domain?: string) => {
  return useQuery({
    queryKey: ['users', 'domain', domain],
    queryFn: () => authService.getAllUsers(),
    select: (data) => {
      const filtered = filterHiddenUsers(data);
      if (!domain) return filtered;
      return {
        ...filtered,
        users: filtered.users.filter(user => user.domain === domain)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};