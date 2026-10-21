# Authentication Integration Guide

## Overview

This project has been integrated with the Bohra Properties CRM backend API. The authentication system uses JWT tokens and React Query for efficient data fetching and caching.

## Architecture

### Service Layer (`src/services/`)
- **`api.ts`** - Axios instance with request/response interceptors
- **`authService.ts`** - Authentication API methods (login, logout, register, etc.)

### Hooks (`src/hooks/`)
- **`useAuth.ts`** - Custom React Query hooks for authentication
  - `useLogin()` - Login user
  - `useLogout()` - Logout user
  - `useRegister()` - Register new user
  - `useCurrentUser()` - Get current user data
  - `useUsers()` - Get all users
  - `useChangeUserRole()` - Change user role
  - `useDeleteUser()` - Delete user
  - `useForgotPassword()` - Request password reset
  - `useResetPassword()` - Reset password
  - `useAuth()` - Get authentication status

### Components
- **`LoginPage`** - User login interface
- **`ForgotPasswordPage`** - Password recovery interface
- **`ProtectedRoute`** - Route wrapper for authenticated access

## Usage

### Login Flow

```tsx
import { useLogin } from '../hooks/useAuth';

function LoginComponent() {
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ 
      email: 'admin@bohra.com', 
      password: 'password123' 
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Logout Flow

```tsx
import { useLogout } from '../hooks/useAuth';

function LogoutButton() {
  const { mutate: logout } = useLogout();

  return (
    <button onClick={() => logout()}>
      Logout
    </button>
  );
}
```

### Get Current User

```tsx
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { isAuthenticated, user, role } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {role}</p>
    </div>
  );
}
```

### Protected Routes

```tsx
import ProtectedRoute from './components/auth/ProtectedRoute';

// Protect entire route
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Protect with role-based access
<Route 
  path="/admin" 
  element={
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

### Register New User (Admin/Superadmin)

```tsx
import { useRegister } from '../hooks/useAuth';

function RegisterForm() {
  const { mutate: register, isPending, error, isSuccess } = useRegister();

  const handleSubmit = (formData) => {
    register({
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phone,
      address: formData.address,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: 'employee',
      domain: 'property',
      designation: 'employee',
      employeeId: 'EMP001',
      teamleadName: 'John Doe'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## API Endpoints

### Base URL
```
https://darkorchid-kudu-454380.hostingersite.com/api
```

### Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/login` | POST | ❌ | Login user |
| `/auth/logout` | POST | ✅ | Logout user |
| `/auth/register` | POST | ✅ Admin | Register new user |
| `/auth/users` | GET | ✅ Admin | Get all users |
| `/auth/change-role/:userId` | PUT | ✅ Superadmin | Change user role |
| `/auth/delete-user/:userId` | DELETE | ✅ Admin | Delete user |
| `/auth/forgot-password` | POST | ❌ | Request password reset |
| `/auth/reset-password` | POST | ❌ | Reset password |
| `/auth/approve-user/:token` | GET | ❌ | Approve user via email |

## Local Storage

The authentication system stores data in localStorage:

- **`authToken`** - JWT token for API authentication
- **`user`** - User object (name, email, role, etc.)

These are automatically managed by the auth service and cleared on logout or token expiration.

## Error Handling

The API layer includes automatic error handling:

- **401 Unauthorized** - Automatically redirects to login and clears auth data
- **Network Errors** - Displays user-friendly error messages
- **API Errors** - Shows error messages from backend

## Role-Based Access

Roles in the system:
- **superadmin** - Full system access
- **admin** - Can manage users and assign roles
- **teamlead** - Team management capabilities
- **employee** - Standard user access

Role mapping from backend (lowercase) to frontend (uppercase) is handled automatically.

## Next Steps

### To Add Property Leads Integration:
1. Create `src/services/propertyLeadsService.ts`
2. Create `src/hooks/usePropertyLeads.ts`
3. Update LeadsPage to use the hooks

### To Add Finance Leads Integration:
1. Create `src/services/financeLeadsService.ts`
2. Create `src/hooks/useFinanceLeads.ts`
3. Update FinancePage to use the hooks

### To Add Operations Integration:
1. Create `src/services/operationsService.ts`
2. Create `src/hooks/useOperations.ts`
3. Update OperationsPage to use the hooks

## Example Service Template

```typescript
import api from './api';

export interface LeadData {
  // Define your lead interface
}

class LeadsService {
  async getAll(params?: any) {
    const response = await api.get('/pleads', { params });
    return response.data;
  }

  async getById(id: string) {
    const response = await api.get(`/pleads/${id}`);
    return response.data;
  }

  async create(data: LeadData) {
    const response = await api.post('/pleads', data);
    return response.data;
  }

  async update(id: string, data: Partial<LeadData>) {
    const response = await api.put(`/pleads/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`/pleads/${id}`);
    return response.data;
  }
}

export const leadsService = new LeadsService();
```

## Example Hook Template

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService } from '../services/leadsService';

export const useLeads = (params?: any) => {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsService.getAll(params),
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => leadsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
```

## Best Practices

1. **Always use hooks for API calls** - Don't call services directly in components
2. **Leverage React Query caching** - Data is cached and automatically refetched when stale
3. **Handle loading and error states** - Use `isPending` and `error` from hooks
4. **Invalidate queries on mutations** - Ensure data stays fresh after updates
5. **Use optimistic updates** - For better UX on mutations
6. **Protect sensitive routes** - Wrap with `ProtectedRoute` component
7. **Check roles in components** - Use `useAuth()` to conditionally render based on role

## Testing Login

Use these credentials to test:

```
Email: admin@bohra.com
Password: password123
```

Or create your own user via the registration flow (requires admin access).
