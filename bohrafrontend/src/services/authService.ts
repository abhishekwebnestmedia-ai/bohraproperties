import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber: string;
    domain?: string;
    designation?: string;
    employeeId?: string;
    profileImage?: string | null;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  role: string;
  domain: string;
  designation: string;
  employeeId: string;
  teamleadName?: string;
  aadharNumber?: string;
  /** Optional profile picture file */
  profileImage?: File | null;
  /** Optional supporting documents */
  documents?: File[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdBy?: string;
  domain?: string;
  designation?: string;
  employeeId?: string;
  teamleadName?: string;
  reportingManager?: string;
  reportingManagerName?: string;
  isLoggedIn?: boolean;
  isApproved?: boolean;
  profileImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  id: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Store token and user data in localStorage
    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('auth:changed'));
    }
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:changed'));
    }
  }

  /**
   * Register new user (Admin/Superadmin only).
   * Sends multipart/form-data when files are included so the backend
   * can store a profile picture + supporting documents.
   */
  async register(userData: RegisterRequest): Promise<{ success: boolean; message: string; user: User }> {
    const { profileImage, documents, ...rest } = userData;

    const hasFiles = (profileImage instanceof File) || (documents && documents.length > 0);

    if (hasFiles) {
      const fd = new FormData();

      // Append all scalar fields
      (Object.entries(rest) as [string, string | undefined][]).forEach(([key, val]) => {
        if (val !== undefined && val !== null) fd.append(key, val);
      });

      if (profileImage instanceof File) {
        fd.append("profileImage", profileImage, profileImage.name);
      }
      if (documents && documents.length > 0) {
        documents.forEach((doc) => fd.append("documents", doc, doc.name));
      }

      const response = await api.post('/auth/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }

    // No files — send regular JSON
    const response = await api.post('/auth/register', rest);
    return response.data;
  }

  /**
   * Get all users (Admin/Superadmin only)
   */
  async getAllUsers(): Promise<{ success: boolean; count: number; users: User[] }> {
    const response = await api.get('/auth/users');
    return response.data;
  }

  /**
   * Change user role (Superadmin only)
   */
  async changeUserRole(userId: string, newRole: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/auth/change-role/${userId}`, { role: newRole });
    return response.data;
  }

  /**
   * Delete user (Admin/Superadmin only)
   */
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/auth/delete-user/${userId}`);
    return response.data;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/reset-password', { token, newPassword: password, confirmPassword });
    return response.data;
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get leads for a specific user (Admin/Superadmin/Teamlead)
   */
  async getUserLeads(
    userId: string,
    params?: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<{ success: boolean; count: number; data: any[]; meta?: any }> {
    const response = await api.get(`/auth/users/${userId}/leads`, { params });
    return response.data;
  }






























  
  /**
   * Get own profile (authenticated)
   */
  async getMe(): Promise<{ success: boolean; data: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  /**
   * Update user details — PUT /auth/update-user/:id  (multipart/form-data)
   */
  async updateUser(
    userId: string,
    fields: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      designation?: string;
      employeeId?: string;
      teamleadName?: string;
      domain?: string;
      password?: string;
    }
  ): Promise<{ success: boolean; message?: string; data?: User }> {
    const form = new FormData();
    (Object.entries(fields) as [string, string | undefined][]).forEach(([k, v]) => {
      if (v !== undefined && v !== '') form.append(k, v);
    });
    const response = await api.put(`/auth/update-user/${userId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /**
   * Approve or disapprove a user — PUT /auth/approve-user/:id
   */
  async toggleUserApproval(
    userId: string,
    isApproved: boolean
  ): Promise<{ success: boolean; message: string; data?: User }> {
    const response = await api.put(`/auth/approve-user/${userId}`, { isApproved });
    return response.data;
  }

  /**
   * Get dashboard stats for a specific user
   * GET /auth/users/:id/dashboard?range=daily|weekly|monthly|yearly
   */
  async getUserDashboard(
    userId: string,
    range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<{
    success: boolean;
    data: {
      user: User & { permissions?: Record<string, boolean>; createdBy?: string; registeredAt?: string };
      stats: { totalLeads: number; activeDeals: number; pendingTasks: number; conversionRate: string };
      performance: Array<{ _id: string; leads: number; closed: number }>;
      leadStatus: Array<{ _id: string; count: number }>;
    };
  }> {
    const response = await api.get(`/auth/users/${userId}/dashboard`, { params: { range } });
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;
