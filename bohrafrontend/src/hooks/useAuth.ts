import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import authService, { type LoginRequest, type RegisterRequest } from '../services/authService';

/**
 * Hook for user login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Full page reload prevents white-screen / stale auth state
      window.location.href = '/login';
    },
    onError: () => {
      // Even on error, clear and redirect
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};

/**
 * Hook for user registration (Admin/Superadmin only)
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }
      return user;
    },
    retry: false,
    staleTime: Infinity, // User data doesn't change often
  });
};

/**
 * Hook to get all users (Admin/Superadmin only)
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => authService.getAllUsers(),
    enabled: authService.isAuthenticated(), // Only fetch if authenticated
  });
};

/**
 * Hook to change user role (Superadmin only)
 */
export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      authService.changeUserRole(userId, newRole),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook to delete user (Admin/Superadmin only)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authService.deleteUser(userId),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook for forgot password
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
};

/**
 * Hook for reset password
 */
export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password, confirmPassword }: { token: string; password: string; confirmPassword: string }) =>
      authService.resetPassword(token, password, confirmPassword),
    onSuccess: () => {
      // Navigate to login after successful password reset
      navigate('/login');
    },
  });
};

/**
 * Hook to check if user is authenticated
 */
export const useAuth = () => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  return {
    isAuthenticated,
    user,
    role: user?.role,
  };
};
