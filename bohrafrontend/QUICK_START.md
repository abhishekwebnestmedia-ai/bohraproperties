# 🚀 Quick Start Guide

## Authentication is Now Live! 

Your Bohra Properties CRM now has full authentication integration with the backend API.

## Start the Application

```bash
npm run dev
```

The app will start on `http://localhost:5173`

## Test Login

When you navigate to the app, you'll be automatically redirected to the login page.

**Test Credentials:**
```
Email: admin@bohra.com
Password: password123
```

After login, you'll be redirected to your role-based dashboard.

## What's Working

✅ **Authentication**
- Login with JWT tokens
- Auto-redirect to dashboard on successful login
- Auto-redirect to login when token expires (401)
- Logout from header dropdown

✅ **Protected Routes**
- All app routes require authentication
- Role-based dashboard routing
- Automatic redirection for unauthorized access

✅ **User Management (Coming Soon)**
- Hooks are ready: `useRegister()`, `useUsers()`, `useDeleteUser()`
- See `EXAMPLE_REGISTRATION_FORM.tsx` for implementation guide

## File Structure

```
src/
├── services/           # API layer
│   ├── api.ts         # Axios config + interceptors
│   └── authService.ts # Auth API methods
├── hooks/             # React Query hooks
│   └── useAuth.ts     # All auth hooks
├── pages/
│   └── auth/          # Login & forgot password
├── components/
│   └── auth/          # ProtectedRoute
└── providers/         # React Query provider
```

## Key Features

### 1. Login Page
- Modern gradient UI
- Email + password validation
- Show/hide password toggle
- Error handling with messages
- Loading states

### 2. Header with Logout
- User profile dropdown (top right)
- Click profile icon to see email
- Logout button with icon
- Auto-redirects to login

### 3. Role-Based Dashboards
- **superadmin** → SuperAdminDashboard
- **admin** → AdminDashboard  
- **teamlead** → TeamLeadDashboard
- **employee** → EmployeeDashboard

Backend roles (lowercase) automatically mapped to frontend (uppercase).

## API Integration Pattern

All future API integrations should follow this pattern:

1. **Create Service** (`src/services/XService.ts`)
```typescript
import api from './api';

class XService {
  async getAll() {
    const response = await api.get('/endpoint');
    return response.data;
  }
}

export const xService = new XService();
```

2. **Create Hook** (`src/hooks/useX.ts`)
```typescript
import { useQuery } from '@tanstack/react-query';
import { xService } from '../services/xService';

export const useX = () => {
  return useQuery({
    queryKey: ['x'],
    queryFn: () => xService.getAll(),
  });
};
```

3. **Use in Component**
```typescript
import { useX } from '../hooks/useX';

const { data, isLoading, error } = useX();
```

## Next Steps to Complete CRM

### 1. Add User Registration in Team Page
- Import and use `useRegister()` hook
- See `EXAMPLE_REGISTRATION_FORM.tsx` for full code
- Add "Add User" button (admin/superadmin only)

### 2. Integrate Property Leads
- Create `src/services/propertyLeadsService.ts`
- Create `src/hooks/usePropertyLeads.ts`
- Update `src/pages/shared/LeadsPage.tsx`

### 3. Integrate Finance Leads
- Create `src/services/financeLeadsService.ts`
- Create `src/hooks/useFinanceLeads.ts`
- Update `src/pages/shared/FinancePage.tsx`

### 4. Add Operations/Spending
- Create `src/services/operationsService.ts`
- Create `src/hooks/useOperations.ts`
- Update `src/pages/operations/OperationsPage.tsx`

### 5. Add Notifications
- Create `src/services/notificationsService.ts`
- Update Header to show real notifications
- Add notification panel

## Documentation Files

📖 **Read These:**
- `INTEGRATION_SUMMARY.md` - What was implemented
- `AUTHENTICATION_GUIDE.md` - Complete auth documentation
- `EXAMPLE_REGISTRATION_FORM.tsx` - Registration form example
- `README.md` - Original project README

## API Endpoints Available

Base: `https://backend.bohraproperty.com/api`

**Auth:**
- POST `/auth/login` - Login
- POST `/auth/logout` - Logout
- POST `/auth/register` - Register user (admin only)
- GET `/auth/users` - Get all users

**Property Leads:**
- All CRUD operations at `/pleads`
- Dashboard, bulk upload, transfer, etc.

**Finance Leads:**
- All CRUD operations at `/fleads`
- Dashboard, bulk upload, transfer, etc.

**Operations:**
- `/opera/spending` - Spending management
- `/opera/dashboard` - Operations analytics

See full API docs in the user's original message.

## Troubleshooting

### Can't Login?
- Check network tab in DevTools
- Verify API is running at `https://backend.bohraproperty.com/api`
- Check credentials are correct

### Token Expired?
- Will auto-redirect to login
- Token stored in localStorage as `authToken`

### Need to Clear Everything?
```javascript
localStorage.clear()
```

Then refresh the page.

## Best Practices

✅ **DO:**
- Use React Query hooks for all API calls
- Handle loading and error states
- Protect routes with `<ProtectedRoute>`
- Check roles before showing UI elements
- Invalidate queries after mutations

❌ **DON'T:**
- Call services directly from components
- Store sensitive data in state
- Forget to handle errors
- Hardcode API URLs

## Technology Stack

- **React 19** + TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **TanStack Query** (React Query) for data fetching
- **Axios** for HTTP requests
- **Tailwind CSS** for styling
- **Lucide React** for icons

---

**Ready to rock!** 🎸

Run `npm run dev` and open `http://localhost:5173` to see your authenticated CRM!
