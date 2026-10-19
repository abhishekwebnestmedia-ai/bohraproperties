import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './hooks/useAuth';
import { NotificationsProvider } from './providers/NotificationsProvider';
import ReminderAlarmOverlay from './components/notifications/ReminderAlarmOverlay';
import ToastStack from './components/notifications/ToastStack';
import { Toaster } from 'react-hot-toast';

// ── Lazy-loaded page components ──────────────────────────────────────────────
const DashboardRouter      = lazy(() => import('./routes/DashboardRouter'));
const LeadsPage            = lazy(() => import('./pages/shared/LeadsPage'));
const LeadDetailPage       = lazy(() => import('./pages/leads/LeadDetailPage'));
const ApplicationsPage     = lazy(() => import('./pages/shared/ApplicationsPage'));
const PropertiesPage       = lazy(() => import('./pages/shared/PropertiesPage'));
const FinancePage          = lazy(() => import('./pages/shared/FinancePage'));
const InventoryPage        = lazy(() => import('./pages/shared/InventoryPage'));
const AddInventoryPage     = lazy(() => import('./pages/inventory/AddInventoryPage'));
const InventoryDetailPage  = lazy(() => import('./pages/inventory/InventoryDetailPage'));
const TeamPage             = lazy(() => import('./pages/shared/TeamPage'));
const UserDetailPage       = lazy(() => import('./pages/team/UserDetailPage'));
const EmployeeLeadsPage    = lazy(() => import('./pages/team/EmployeeLeadsPage'));
const SettingsPage         = lazy(() => import('./pages/shared/SettingsPage'));
const ProfilePage          = lazy(() => import('./pages/shared/ProfilePage'));
const HelpPage             = lazy(() => import('./pages/shared/HelpPage'));
const OperationsPage       = lazy(() => import('./pages/operations/OperationsPage'));
const SpendingPage         = lazy(() => import('./pages/operations/SpendingPage'));
const LoginPage            = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage   = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage    = lazy(() => import('./pages/auth/ResetPasswordPage'));

// ── Minimal page-level loading skeleton ─────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
  </div>
);

// Guard routes that require a specific domain.
// SUPERADMIN and ADMIN bypass the check; TEAMLEAD/EMPLOYEE must match.
const DomainRoute = ({ children, allowedDomains }: { children: React.ReactNode; allowedDomains: string[] }) => {
  const { user } = useAuth();
  if (!user) return null;

  const normalizedRole = String(user.role || '').trim().toUpperCase();
  const normalizedDomain = String(user.domain || '').trim().toLowerCase();
  const normalizedAllowedDomains = allowedDomains.map((domain) => String(domain).trim().toLowerCase());

  if (normalizedRole === 'SUPERADMIN' || normalizedRole === 'ADMIN') return <>{children}</>;
  if (!normalizedDomain || !normalizedAllowedDomains.includes(normalizedDomain)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        
        {/* Main Layout with nested protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardRouter />} />
                    <Route path="/operation" element={<OperationsPage />} />
                    <Route path="/operation/spendings" element={<SpendingPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/leads/:id" element={<LeadDetailPage />} />
                    <Route path="/applications" element={<ApplicationsPage />} />
                    <Route path="/properties" element={<DomainRoute allowedDomains={['property']}><PropertiesPage /></DomainRoute>} />
                    <Route path="/finance" element={<DomainRoute allowedDomains={['finance']}><FinancePage /></DomainRoute>} />
                    <Route path="/inventory" element={<DomainRoute allowedDomains={['property']}><InventoryPage /></DomainRoute>} />
                    <Route path="/inventory/add" element={<DomainRoute allowedDomains={['property']}><AddInventoryPage /></DomainRoute>} />
                    <Route path="/inventory/:id" element={<DomainRoute allowedDomains={['property']}><InventoryDetailPage /></DomainRoute>} />
                    <Route path="/team" element={<TeamPage />} />
                    <Route path="/team/:id" element={<UserDetailPage />} />
                    <Route path="/team/:id/leads" element={<EmployeeLeadsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/help" element={<HelpPage />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <NotificationsProvider>
          <AppRoutes />
          <ReminderAlarmOverlay />
          <ToastStack />
          <Toaster
            position="top-right"
            gutter={10}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#111827',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                fontSize: '13px',
                fontWeight: 500,
                padding: '10px 14px',
                maxWidth: '360px',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#fff' },
              },
              error: {
                duration: 8000,
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </NotificationsProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
