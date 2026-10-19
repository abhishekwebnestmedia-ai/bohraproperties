# Customization Guide

## How to Change User Role

To test different dashboards, edit **`src/utils/auth.ts`**:

```typescript
export const getCurrentUser = (): User => {
  return {
    id: '1',
    name: 'Tushar',  // Change this name
    email: 'tushar@bohraproperties.com',
    role: 'ADMIN', // Change to: 'SUPERADMIN', 'TEAMLEAD', or 'EMPLOYEE'
  };
};
```

## How to Add a New Menu Item

Edit **`src/components/layout/Sidebar.tsx`**:

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  {
    icon: YourIcon, // Import from lucide-react
    label: 'Your New Page',
    path: '/your-page',
    roles: ['SUPERADMIN', 'ADMIN'], // Which roles can see it
  },
];
```

## How to Change Colors

Edit **`tailwind.config.js`**:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#0ea5e9', // Change your primary color
        600: '#0284c7',
      },
    },
  },
},
```

## How to Update Mock Data

Edit **`src/data/mockData.ts`** to change:
- Dashboard statistics
- Chart data
- Table entries

Example:
```typescript
export const dashboardStats: DashboardStats = {
  totalLeads: 300, // Change numbers
  activeDeals: 250,
  // ... other stats
};
```

## How to Add a New Metric Card

In your dashboard page:

```typescript
<StatCard
  title="Your Metric"
  value={123}
  change={15}
  icon={YourIcon}
  iconBgColor="bg-purple-100"
  iconColor="text-purple-600"
/>
```

## Component Props Reference

### StatCard
```typescript
{
  title: string;           // Card title
  value: string | number;  // Main value to display
  change: number;          // Percentage change (+/-)
  icon?: LucideIcon;       // Optional icon
  iconBgColor?: string;    // Background color class
  iconColor?: string;      // Icon color class
}
```

### PerformanceChart
- Uses data from `mockData.ts`
- Automatically responsive
- Time range filters included

### LeadSourceChart
- Donut/Pie chart
- Shows percentages automatically
- Color-coded legend

## Sidebar Animation Settings

In **`src/components/layout/Sidebar.tsx`**, modify:

```typescript
// Change collapsed width
const collapsedWidth = 'w-20'; // Default: 80px

// Change expanded width
const expandedWidth = 'w-64'; // Default: 256px

// Change transition speed in tailwind.config.js
// Currently: 300ms (duration-300)
```

## Adding New Pages

1. **Create the page** in appropriate folder:
   ```
   src/pages/shared/YourPage.tsx
   ```

2. **Add route** in `src/App.tsx`:
   ```typescript
   <Route path="/your-page" element={<YourPage />} />
   ```

3. **Add menu item** in Sidebar (see above)

## Chart Customization

### Change Chart Colors
In component files:

**PerformanceChart.tsx:**
```typescript
<Line stroke="#3b82f6" /> // Change line colors
```

**LeadSourceChart.tsx:**
```typescript
const COLORS = ['#FFC107', '#9C27B0', '#E0BBE4', '#5B9BD5'];
// Add/change colors
```

### Change Chart Size
```typescript
<div style={{ height: '400px' }}> // Adjust height
  <ResponsiveContainer width="100%" height="100%">
    {/* Chart */}
  </ResponsiveContainer>
</div>
```

## Responsive Breakpoints

Tailwind breakpoints used:
- `md:` - 768px and up
- `lg:` - 1024px and up

Example:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
  // 1 col mobile, 2 cols tablet, 5 cols desktop
</div>
```

## Adding Notification Counts

In **`src/components/layout/Header.tsx`**:

```typescript
{/* Add dynamic count */}
<button className="relative">
  <Bell className="w-5 h-5" />
  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
    5  {/* Dynamic count */}
  </span>
</button>
```

## TypeScript Types

All types are in **`src/types/index.ts`**.

To add a new type:
```typescript
export interface YourNewType {
  id: string;
  name: string;
  // ... properties
}
```

## Common Tasks

### Change Company Logo
Edit the logo section in `Sidebar.tsx`:
```typescript
<div className="w-10 h-10 ...">
  <Building2 className="..." /> {/* Replace with your logo */}
</div>
```

### Change Page Title
In each page component:
```typescript
<h1 className="text-2xl font-bold">Your Title</h1>
<p className="text-sm text-gray-500">Your subtitle</p>
```

### Add Loading States
```typescript
{isLoading ? (
  <div>Loading...</div>
) : (
  <YourComponent />
)}
```

### Add Error Handling
```typescript
{error ? (
  <div className="text-red-500">{error}</div>
) : (
  <YourComponent />
)}
```

## Best Practices

1. **Keep components small and focused**
2. **Use TypeScript types for all props**
3. **Follow the existing folder structure**
4. **Use Tailwind classes consistently**
5. **Make components reusable**
6. **Add proper error boundaries**
7. **Test on different screen sizes**

## Testing Different Roles

Quick test script:

1. Change role in `src/utils/auth.ts`
2. Refresh browser
3. Check which menu items appear
4. Verify dashboard content

Test each role:
- ✅ SUPERADMIN - Should see all features
- ✅ ADMIN - Should see all features
- 🔄 TEAMLEAD - Should see limited features
- 🔄 EMPLOYEE - Should see basic features

## Need Help?

Check these files:
- `DASHBOARD_README.md` - Overview & features
- `STRUCTURE.md` - Folder structure
- `README.md` - Project setup

---

Happy Coding! 🚀
