// User roles enum
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TEAMLEAD' | 'EMPLOYEE';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  domain?: string;
  designation?: string;
  avatar?: string;
  profileImage?: string | null;
  phoneNumber?: string;
  employeeId?: string;
}

// Dashboard stats interface
export interface DashboardStats {
  totalLeads: number;
  activeDeals: number;
  loanApplications: number;
  pendingTasks: number;
  conversionRate: number;
  changePercentage: {
    totalLeads: number;
    activeDeals: number;
    loanApplications: number;
    pendingTasks: number;
    conversionRate: number;
  };
}

// Performance data interface
export interface PerformanceData {
  date: string;
  leads: number;
  closedDeals: number;
}

// Lead source data interface
export interface LeadSourceData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number; // Allow additional properties for Recharts
}

// Recent lead interface
export interface RecentLead {
  id: number;
  name: string;
  number: string;
  source: string;
}

// Recent loan application interface
export interface RecentLoanApplication {
  id: number;
  name: string;
  number: string;
  email: string;
  source: string;
}

// Task status type — must match API values
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

// Task priority type
export type TaskPriority = 'Low' | 'Medium' | 'High';

// Task comment interface
export interface TaskComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdDate: string;
  createdBy: string;
  assignedTo?: string;
  note?: string;
  comments: TaskComment[];
}
