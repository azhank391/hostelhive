# 🔐 Frontend RBAC Integration Documentation

## 📊 **Overview**

This document provides comprehensive guidance on integrating the Role-Based Access Control (RBAC) system with the frontend React application. The integration includes permission contexts, components, and utilities for managing user access control.

---

## 🏗️ **Architecture Overview**

### **Core Components**
- **`PermissionContext`** - React context for managing user permissions
- **`PermissionGate`** - Component for conditional rendering based on permissions
- **`RoleManagement`** - Component for managing custom roles
- **Permission Hooks** - Custom hooks for easy permission checking

### **Integration Flow**
```
User Login → AuthContext → PermissionContext → Permission Gates → UI Components
```

---

## 🔧 **PermissionContext Integration**

### **Setup in App Layout**
```tsx
// app/layout.tsx
import { PermissionProvider } from '@/contexts/PermissionContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SubdomainProvider>
          <AuthProvider>
            <PermissionProvider>  {/* 🔐 RBAC Integration */}
              <HostelProvider>
                <main id="main-content">
                  {children}
                </main>
              </HostelProvider>
            </PermissionProvider>
          </AuthProvider>
        </SubdomainProvider>
      </body>
    </html>
  );
}
```

### **Context Features**
- ✅ **Automatic Permission Fetching** - Fetches user permissions on mount
- ✅ **Real-time Permission Checking** - Local and backend permission validation
- ✅ **Error Handling** - Comprehensive error states and recovery
- ✅ **Loading States** - Loading indicators during permission fetching
- ✅ **Permission Caching** - Efficient permission storage and retrieval

---

## 🎯 **Permission Hooks Usage**

### **Basic Permission Hooks**

#### **`usePermission(permissionName)`**
```tsx
import { usePermission } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const canManageHostel = usePermission('manage_hostel');
  
  return (
    <div>
      {canManageHostel && (
        <button>Manage Hostel</button>
      )}
    </div>
  );
};
```

#### **`useAnyPermission(permissionNames)`**
```tsx
import { useAnyPermission } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const canManageHostelOrStudents = useAnyPermission([
    'manage_hostel', 
    'manage_students'
  ]);
  
  return (
    <div>
      {canManageHostelOrStudents && (
        <div>You can manage hostels or students!</div>
      )}
    </div>
  );
};
```

#### **`useAllPermissions(permissionNames)`**
```tsx
import { useAllPermissions } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const canManageHostelAndStudents = useAllPermissions([
    'manage_hostel', 
    'manage_students'
  ]);
  
  return (
    <div>
      {canManageHostelAndStudents && (
        <div>You can manage both hostels and students!</div>
      )}
    </div>
  );
};
```

### **Role and Permission Hooks**

#### **`useUserRole()`**
```tsx
import { useUserRole } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const userRole = useUserRole();
  
  return (
    <div>
      <h2>Welcome, {userRole?.displayName}</h2>
      <p>Role: {userRole?.name}</p>
    </div>
  );
};
```

#### **`useUserPermissions()`**
```tsx
import { useUserPermissions } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const permissions = useUserPermissions();
  
  return (
    <div>
      <h3>Your Permissions ({permissions.length})</h3>
      {permissions.map(permission => (
        <div key={permission.id}>
          {permission.displayName} ({permission.category})
        </div>
      ))}
    </div>
  );
};
```

---

## 🚪 **PermissionGate Component Usage**

### **Basic Permission Gates**

#### **Single Permission Gate**
```tsx
import { PermissionGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <PermissionGate 
      permission="manage_hostel"
      fallback={<div>Access denied</div>}
    >
      <button>Manage Hostel</button>
    </PermissionGate>
  );
};
```

#### **Multiple Permission Gate (Any)**
```tsx
import { PermissionGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <PermissionGate 
      permissions={['view_students', 'manage_students']}
      fallback={<div>No student access</div>}
    >
      <StudentManagementPanel />
    </PermissionGate>
  );
};
```

#### **Multiple Permission Gate (All)**
```tsx
import { PermissionGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <PermissionGate 
      permissions={['manage_hostel', 'manage_students']}
      requireAll={true}
      fallback={<div>Full management access required</div>}
    >
      <FullManagementPanel />
    </PermissionGate>
  );
};
```

### **Specialized Permission Gates**

#### **Hostel Management Gate**
```tsx
import { HostelManagementGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <HostelManagementGate fallback={<div>No hostel access</div>}>
      <HostelManagementPanel />
    </HostelManagementGate>
  );
};
```

#### **Student Management Gate**
```tsx
import { StudentManagementGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <StudentManagementGate fallback={<div>No student access</div>}>
      <StudentManagementPanel />
    </StudentManagementGate>
  );
};
```

#### **Owner Gate**
```tsx
import { OwnerGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <OwnerGate fallback={<div>Owner access required</div>}>
      <OwnerPanel />
    </OwnerGate>
  );
};
```

### **Role-Based Gates**

#### **Role Gate**
```tsx
import { RoleGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <RoleGate 
      roles={['owner', 'warden']}
      fallback={<div>Owner or Warden access required</div>}
    >
      <ManagementPanel />
    </RoleGate>
  );
};
```

#### **Specific Role Gates**
```tsx
import { 
  OwnerRoleGate, 
  WardenRoleGate, 
  StudentRoleGate 
} from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <div>
      <OwnerRoleGate fallback={<div>Owner only</div>}>
        <OwnerPanel />
      </OwnerRoleGate>
      
      <WardenRoleGate fallback={<div>Warden only</div>}>
        <WardenPanel />
      </WardenRoleGate>
      
      <StudentRoleGate fallback={<div>Student only</div>}>
        <StudentPanel />
      </StudentRoleGate>
    </div>
  );
};
```

---

## 🔧 **Role Management Integration**

### **Role Management Component**
```tsx
import { RoleManagement } from '@/components/RoleManagement';
import { PermissionGate } from '@/components/PermissionGate';

const HostelSettingsPage = () => {
  const { currentHostel } = useHostel();
  
  return (
    <div>
      <h1>Hostel Settings</h1>
      
      <PermissionGate permission="manage_roles">
        <RoleManagement 
          hostelId={currentHostel.id}
          onRoleUpdate={() => {
            // Refresh permissions after role update
            window.location.reload();
          }}
        />
      </PermissionGate>
    </div>
  );
};
```

### **Role Management Features**
- ✅ **Create Custom Roles** - Define new roles with specific permissions
- ✅ **Edit Existing Roles** - Modify role permissions and descriptions
- ✅ **Delete Custom Roles** - Remove unused custom roles
- ✅ **Permission Selection** - Visual permission selection interface
- ✅ **Role Validation** - Ensure role names are unique and valid

---

## 🎨 **UI Integration Examples**

### **Navigation Menu with Permissions**
```tsx
import { usePermission, useAnyPermission } from '@/contexts/PermissionContext';

const NavigationMenu = () => {
  const canManageHostel = usePermission('manage_hostel');
  const canManageStudents = usePermission('manage_students');
  const canViewReports = usePermission('view_reports');
  const canManageRoles = usePermission('manage_roles');
  
  return (
    <nav>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        
        {canManageHostel && (
          <li><Link to="/hostel">Hostel Management</Link></li>
        )}
        
        {canManageStudents && (
          <li><Link to="/students">Student Management</Link></li>
        )}
        
        {canViewReports && (
          <li><Link to="/reports">Reports</Link></li>
        )}
        
        {canManageRoles && (
          <li><Link to="/roles">Role Management</Link></li>
        )}
      </ul>
    </nav>
  );
};
```

### **Dashboard with Permission-Based Widgets**
```tsx
import { 
  HostelManagementGate, 
  StudentManagementGate,
  ComplaintManagementGate 
} from '@/components/PermissionGate';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="widgets">
        <HostelManagementGate>
          <HostelStatsWidget />
        </HostelManagementGate>
        
        <StudentManagementGate>
          <StudentStatsWidget />
        </StudentManagementGate>
        
        <ComplaintManagementGate>
          <ComplaintStatsWidget />
        </ComplaintManagementGate>
      </div>
    </div>
  );
};
```

### **Form with Permission-Based Fields**
```tsx
import { usePermission } from '@/contexts/PermissionContext';

const StudentForm = () => {
  const canManageStudents = usePermission('manage_students');
  const canAllocateRooms = usePermission('allocate_rooms');
  
  return (
    <form>
      <input name="name" placeholder="Student Name" />
      <input name="email" placeholder="Email" />
      
      {canAllocateRooms && (
        <select name="roomId">
          <option value="">Select Room</option>
          {/* Room options */}
        </select>
      )}
      
      {canManageStudents && (
        <button type="submit">Save Student</button>
      )}
    </form>
  );
};
```

---

## 🔍 **Error Handling and Loading States**

### **Permission Loading States**
```tsx
import { usePermissionsLoading, usePermissionsError } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const loading = usePermissionsLoading();
  const error = usePermissionsError();
  
  if (loading) {
    return <div>Loading permissions...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  
  return <div>Content with permissions loaded</div>;
};
```

### **Permission Gate with Loading States**
```tsx
import { PermissionGate } from '@/components/PermissionGate';

const MyComponent = () => {
  return (
    <PermissionGate 
      permission="manage_hostel"
      showLoading={true}
      loadingComponent={<div>Checking permissions...</div>}
      errorComponent={<div>Permission error occurred</div>}
      fallback={<div>Access denied</div>}
    >
      <HostelManagementPanel />
    </PermissionGate>
  );
};
```

---

## 🚀 **Performance Optimization**

### **Permission Caching**
```tsx
import { useMemo } from 'react';
import { useUserPermissions } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const permissions = useUserPermissions();
  
  // Memoize permission checks for better performance
  const permissionMap = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      acc[permission.name] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [permissions]);
  
  const hasPermission = (name: string) => permissionMap[name] || false;
  
  return (
    <div>
      {hasPermission('manage_hostel') && (
        <button>Manage Hostel</button>
      )}
    </div>
  );
};
```

### **Conditional Rendering Optimization**
```tsx
import { usePermission } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const canManageHostel = usePermission('manage_hostel');
  
  // Only render expensive components when permission is granted
  return (
    <div>
      {canManageHostel && (
        <ExpensiveHostelManagementComponent />
      )}
    </div>
  );
};
```

---

## 🧪 **Testing Permission Components**

### **Testing Permission Hooks**
```tsx
import { renderHook } from '@testing-library/react';
import { PermissionProvider } from '@/contexts/PermissionContext';

const wrapper = ({ children }) => (
  <PermissionProvider>
    {children}
  </PermissionProvider>
);

test('usePermission hook', () => {
  const { result } = renderHook(() => usePermission('manage_hostel'), { wrapper });
  
  expect(result.current).toBe(true); // or false based on mock data
});
```

### **Testing Permission Gates**
```tsx
import { render, screen } from '@testing-library/react';
import { PermissionGate } from '@/components/PermissionGate';

test('PermissionGate renders content when permission is granted', () => {
  render(
    <PermissionProvider>
      <PermissionGate permission="manage_hostel">
        <div>Hostel Management</div>
      </PermissionGate>
    </PermissionProvider>
  );
  
  expect(screen.getByText('Hostel Management')).toBeInTheDocument();
});
```

---

## 📚 **Best Practices**

### **1. Use Permission Gates for UI Components**
```tsx
// ✅ Good - Use PermissionGate for conditional rendering
<PermissionGate permission="manage_hostel">
  <HostelManagementPanel />
</PermissionGate>

// ❌ Avoid - Manual permission checking in render
{hasPermission('manage_hostel') && <HostelManagementPanel />}
```

### **2. Use Hooks for Logic and State**
```tsx
// ✅ Good - Use hooks for component logic
const MyComponent = () => {
  const canManageHostel = usePermission('manage_hostel');
  
  const handleClick = () => {
    if (canManageHostel) {
      // Perform action
    }
  };
  
  return <button onClick={handleClick}>Manage</button>;
};
```

### **3. Provide Meaningful Fallbacks**
```tsx
// ✅ Good - Meaningful fallback content
<PermissionGate 
  permission="manage_hostel"
  fallback={
    <div className="text-gray-500">
      You don't have permission to manage hostels.
      Contact your administrator for access.
    </div>
  }
>
  <HostelManagementPanel />
</PermissionGate>
```

### **4. Handle Loading and Error States**
```tsx
// ✅ Good - Handle all states
const MyComponent = () => {
  const { loading, error, hasPermission } = usePermissions();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <PermissionGate permission="manage_hostel">
      <HostelManagementPanel />
    </PermissionGate>
  );
};
```

---

## 🔗 **Integration Checklist**

### **Backend Integration**
- [ ] RBAC routes are mounted in server.js
- [ ] Permission middleware is working
- [ ] Database migrations are applied
- [ ] User permissions are being fetched correctly

### **Frontend Integration**
- [ ] PermissionProvider is added to app layout
- [ ] PermissionContext is working
- [ ] Permission gates are rendering correctly
- [ ] Role management component is functional
- [ ] Error handling is implemented
- [ ] Loading states are working

### **Testing**
- [ ] Permission hooks are tested
- [ ] Permission gates are tested
- [ ] Role management is tested
- [ ] Error scenarios are tested

---

## 📚 **Related Documentation**

- `RBAC_CONTROLLER_DOCUMENTATION.md` - Backend RBAC controller
- `RBAC_SERVICE_DOCUMENTATION.md` - Backend RBAC service
- `PERMISSION_MIDDLEWARE_DOCUMENTATION.md` - Backend permission middleware
- `RBAC_COMPLETE_SUMMARY.md` - Complete RBAC system overview

**The Frontend RBAC Integration is now ready for comprehensive permission-based access control!** 🚀







