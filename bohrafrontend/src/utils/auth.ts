import type { User } from '../types';
import authService from '../services/authService';

// Get current user from authentication service
export const getCurrentUser = (): User => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    // Fallback for development - In production, user should be authenticated
    return {
      id: '1',
      name: 'Guest',
      email: 'guest@bohraproperties.com',
      role: 'EMPLOYEE',
    };
  }

  const roleUpper = user.role.toUpperCase();
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'] as const;
  const normalizedRole = (allowedRoles as readonly string[]).includes(roleUpper)
    ? (roleUpper as User['role'])
    : 'EMPLOYEE';

  // Map backend user to frontend User type
  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: normalizedRole,
    domain: user.domain,
    designation: user.designation,
    profileImage: user.profileImage || null,
    phoneNumber: user.phoneNumber,
    employeeId: user.employeeId,
  };
};

// Check if user has access to a specific role's dashboard
export const hasAccess = (userRole: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};
