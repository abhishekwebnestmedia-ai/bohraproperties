import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import TeamLeadDashboard from '../pages/teamlead/TeamLeadDashboard';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';

const DashboardRouter = () => {
  const user = getCurrentUser();

  // Route to appropriate dashboard based on user role
  // Backend roles are lowercase, frontend expects uppercase
  const role = user.role.toUpperCase();
  
  switch (role) {
    case 'SUPERADMIN':
      return <SuperAdminDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEAMLEAD':
      return <TeamLeadDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default DashboardRouter;
