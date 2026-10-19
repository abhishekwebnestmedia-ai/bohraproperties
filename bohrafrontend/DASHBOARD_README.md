# Bohra Properties - Role-Based Dashboard Application

A comprehensive property management dashboard built with React, TypeScript, Tailwind CSS, and Recharts.

## 🏗️ Folder Structure

```
src/
├── components/
│   ├── layout/              # Layout components
│   │   ├── Sidebar.tsx      # Collapsible sidebar with hover animation
│   │   ├── Header.tsx       # Top header with user info and icons
│   │   └── MainLayout.tsx   # Main layout wrapper
│   │
│   └── dashboard/           # Dashboard-specific components
│       ├── StatCard.tsx                      # Metric cards with trends
│       ├── PerformanceChart.tsx             # Line chart for performance
│       ├── LeadSourceChart.tsx              # Pie chart for lead sources
│       ├── RecentLeadsTable.tsx             # Recent leads table
│       └── RecentLoanApplicationsTable.tsx  # Recent applications table
│
├── pages/
│   ├── superadmin/          # SuperAdmin dashboard
│   │   └── SuperAdminDashboard.tsx
│   │
│   ├── admin/               # Admin dashboard
│   │   └── AdminDashboard.tsx
│   │
│   ├── teamlead/            # Team Lead dashboard
│   │   └── TeamLeadDashboard.tsx
│   │
│   ├── employee/            # Employee dashboard
│   │   └── EmployeeDashboard.tsx
│   │
│   └── shared/              # Shared pages across roles
│       ├── LeadsPage.tsx
│       ├── ApplicationsPage.tsx
│       ├── PropertiesPage.tsx
│       ├── TeamPage.tsx
│       ├── SettingsPage.tsx
│       └── HelpPage.tsx
│
├── routes/
│   └── DashboardRouter.tsx  # Role-based dashboard routing
│
├── types/
│   └── index.ts             # TypeScript interfaces and types
│
├── utils/
│   └── auth.ts              # Authentication utilities
│
├── data/
│   └── mockData.ts          # Mock data for dashboard
│
├── App.tsx                  # Main app component with routing
├── main.tsx                 # Application entry point
└── index.css                # Global styles with Tailwind

```

## 👥 User Roles

The application supports 4 user roles:

1. **SuperAdmin** - Full access to all features (shares UI with Admin)
2. **Admin** - Full dashboard access with management capabilities
3. **TeamLead** - Team management and performance tracking
4. **Employee** - Personal task and performance tracking

## 🎨 Features

### Layout
- **Collapsible Sidebar**
  - Remains closed by default (80px width)
  - Expands on hover (256px width)
  - Smooth transition animations
  - Shows only icons when closed
  - Displays full menu labels when expanded
  - Logo at the top
  - Logout button at the bottom

- **Header**
  - Welcome message with user name
  - Calendar icon
  - Messaging icon (with notification badge)
  - Notification bell (with notification badge)
  - Profile icon

### Dashboard (Admin/SuperAdmin)
- **Key Metrics Cards**
  - Total Leads
  - Active Deals
  - Loan Applications
  - Pending Tasks
  - Conversion Rate
  - Each with trend indicators

- **Performance Chart**
  - Line chart showing Leads vs Closed Deals
  - Time range filters (Day, Week, Month, Year)
  - Interactive tooltips

- **Lead Sources Chart**
  - Donut/Pie chart showing lead distribution
  - Legend with percentages
  - Color-coded sources

- **Data Tables**
  - Recent Leads
  - Recent Loan Applications
  - Clean, sortable design

### Quick Actions
- Add New Member
- Add Lead
- Add Loan Application

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## 🔧 Configuration

### Changing User Role
To test different dashboards, edit `src/utils/auth.ts`:

```typescript
export const getCurrentUser = (): User => {
  return {
    id: '1',
    name: 'Tushar',
    email: 'tushar@bohraproperties.com',
    role: 'ADMIN', // Change to: SUPERADMIN, TEAMLEAD, or EMPLOYEE
  };
};
```

### Customizing Menu Items
Edit sidebar menu in `src/components/layout/Sidebar.tsx`:

```typescript
const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'],
  },
  // Add more items...
];
```

## 📦 Dependencies

- **react** - UI library
- **react-router-dom** - Routing
- **recharts** - Charts and data visualization
- **lucide-react** - Icon library
- **tailwindcss** - Utility-first CSS framework

## 🎯 Next Steps

1. Implement Team Lead dashboard UI
2. Implement Employee dashboard UI
3. Add authentication system
4. Connect to backend API
5. Add more interactive features
6. Implement real-time updates
7. Add data filtering and search
8. Create detail pages for each section

## 📝 Notes

- The application is currently static with mock data
- Role-based access is simulated client-side
- All dashboards use the same layout structure (Sidebar + Header)
- SuperAdmin and Admin share the same dashboard UI
- Charts and data are responsive and interactive

## 🎨 Design System

### Colors
- Primary: Blue (#0ea5e9)
- Secondary: Purple (#8b5cf6)
- Success: Green
- Warning: Yellow
- Danger: Red
- Gray scale for text and backgrounds

### Typography
- System font stack
- Consistent heading hierarchy
- Responsive font sizes

### Spacing
- 8px base unit
- Consistent padding and margins
- Responsive grid system

---

Built with ❤️ for Bohra Properties
