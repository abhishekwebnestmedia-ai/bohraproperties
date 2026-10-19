import type {
  DashboardStats,
  PerformanceData,
  LeadSourceData,
  RecentLead,
  RecentLoanApplication,
} from '../types';

// Mock dashboard statistics
export const dashboardStats: DashboardStats = {
  totalLeads: 220,
  activeDeals: 220,
  loanApplications: 220,
  pendingTasks: 220,
  conversionRate: 24.5,
  changePercentage: {
    totalLeads: 12,
    activeDeals: 12,
    loanApplications: -12,
    pendingTasks: 12,
    conversionRate: 12,
  },
};

// Mock performance data
export const performanceData: PerformanceData[] = [
  { date: '1 Oct', leads: 1800, closedDeals: 1200 },
  { date: '3 Oct', leads: 2500, closedDeals: 1400 },
  { date: '7 Oct', leads: 2000, closedDeals: 1600 },
  { date: '10 Oct', leads: 1500, closedDeals: 1200 },
  { date: '14 Oct', leads: 3500, closedDeals: 2800 },
  { date: '20 Oct', leads: 3200, closedDeals: 3200 },
   { date: '22 Oct', leads: 3800, closedDeals: 2000 },
 
 
  

];

// Mock lead source data
export const leadSourceData: LeadSourceData[] = [
  { name: 'Referral', value: 410, percentage: 39, color: '#FFC107' },
  { name: 'Social Media', value: 410, percentage: 24, color: '#9C27B0' },
  { name: 'Walk-in', value: 410, percentage: 26, color: '#E0BBE4' },
  { name: 'Other', value: 410, percentage: 11, color: '#5B9BD5' },
];

// Mock recent leads
export const recentLeads: RecentLead[] = [
  { id: 1, name: 'Rahul Kumar', number: '8171839997', source: '99Acer' },
  { id: 2, name: 'Rahul Kumar', number: '8171839997', source: '99Acer' },
  { id: 3, name: 'Rahul Kumar', number: '8171839997', source: '99Acer' },
  { id: 4, name: 'Rahul Kumar', number: '8171839997', source: '99Acer' },
  { id: 5, name: 'Rahul Kumar', number: '8171839997', source: '99Acer' },
];

// Mock recent loan applications
export const recentLoanApplications: RecentLoanApplication[] = [
  { id: 1, name: 'Rahul Kumar', number: '8171839997', email: 'tushar@gmail.com', source: '99Acer' },
  { id: 2, name: 'Rahul Kumar', number: '8171839997', email: 'tushar@gmail.com', source: '99Acer' },
  { id: 3, name: 'Rahul Kumar', number: '8171839997', email: 'tushar@gmail.com', source: '99Acer' },
  { id: 4, name: 'Rahul Kumar', number: '8171839997', email: 'tushar@gmail.com', source: '99Acer' },
  { id: 5, name: 'Rahul Kumar', number: '8171839997', email: 'tushar@gmail.com', source: '99Acer' },
];
