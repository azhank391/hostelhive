# 🔐 RBAC Routes Documentation

## 📊 **Overview**

The RBAC Routes (`rbac.js`) provide comprehensive API endpoints for managing Role-Based Access Control operations in the HostelHive application. These routes handle user permissions, role management, and permission checking functionality.

---

## 🏗️ **Route Architecture**

### **Dependencies**
- `express.Router()` - Express.js routing
- `verifyToken` - JWT authentication middleware
- `requirePermission` - Permission-based access control
- `rbacController` - RBAC business logic

### **Key Features**
- ✅ **User Permission Management** - Get user roles and permissions
- ✅ **Permission Checking** - Check specific, any, or all permissions
- ✅ **Role Management** - Create, read, update, delete custom roles
- ✅ **System Role Access** - Get all system roles
- ✅ **User Role Assignment** - Assign roles to users
- ✅ **Comprehensive Route Protection** - Permission-based access control

---

## 🔐 **Route Endpoints**

### **User Permission Routes**

#### **GET /api/rbac/user-permissions**
**Purpose**: Get user's role and permissions for UI rendering
**Access**: All authenticated users
**Middleware**: `verifyToken`

```javascript
// Request
GET /api/rbac/user-permissions
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "role": {
      "id": "uuid",
      "name": "owner",
      "displayName": "Hostel Owner",
      "isSystemRole": true
    },
    "permissions": [
      {
        "id": "uuid",
        "name": "manage_hostel",
        "displayName": "Manage Hostel",
        "category": "hostel"
      }
    ]
  }
}
```

#### **POST /api/rbac/check-permission**
**Purpose**: Check if user has specific permission
**Access**: All authenticated users
**Middleware**: `verifyToken`

```javascript
// Request
POST /api/rbac/check-permission
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionName": "manage_hostel"
}

// Response
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permissionName": "manage_hostel",
    "userId": "uuid"
  }
}
```

#### **POST /api/rbac/check-any-permission**
**Purpose**: Check if user has any of the specified permissions
**Access**: All authenticated users
**Middleware**: `verifyToken`

```javascript
// Request
POST /api/rbac/check-any-permission
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionNames": ["manage_hostel", "view_hostel"]
}

// Response
{
  "success": true,
  "data": {
    "hasAnyPermission": true,
    "permissionNames": ["manage_hostel", "view_hostel"],
    "userId": "uuid"
  }
}
```

#### **POST /api/rbac/check-all-permissions**
**Purpose**: Check if user has all of the specified permissions
**Access**: All authenticated users
**Middleware**: `verifyToken`

```javascript
// Request
POST /api/rbac/check-all-permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionNames": ["manage_hostel", "view_hostel"]
}

// Response
{
  "success": true,
  "data": {
    "hasAllPermissions": true,
    "permissionNames": ["manage_hostel", "view_hostel"],
    "userId": "uuid"
  }
}
```

---

### **Permission Management Routes**

#### **GET /api/rbac/permissions**
**Purpose**: Get all permissions grouped by category
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
GET /api/rbac/permissions
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "hostel": [
      {
        "id": "uuid",
        "name": "manage_hostel",
        "displayName": "Manage Hostel",
        "description": "Full access to hostel management"
      }
    ],
    "student": [
      {
        "id": "uuid",
        "name": "manage_students",
        "displayName": "Manage Students",
        "description": "Create, update, delete students"
      }
    ]
  }
}
```

---

### **System Role Routes**

#### **GET /api/rbac/system-roles**
**Purpose**: Get all system roles with their permissions
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
GET /api/rbac/system-roles
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "owner",
      "displayName": "Hostel Owner",
      "description": "Full access to all hostel operations",
      "permissions": [
        {
          "id": "uuid",
          "name": "manage_hostel",
          "displayName": "Manage Hostel",
          "category": "hostel"
        }
      ]
    }
  ]
}
```

---

### **Hostel-Specific Role Routes**

#### **GET /api/hostels/:hostelId/roles**
**Purpose**: Get all custom roles for a hostel
**Access**: Users with `view_roles` permission
**Middleware**: `verifyToken`, `requirePermission('view_roles')`

```javascript
// Request
GET /api/hostels/123/roles
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "custom_warden",
      "displayName": "Custom Warden",
      "description": "Limited warden access",
      "permissions": [
        {
          "id": "uuid",
          "name": "view_students",
          "displayName": "View Students",
          "category": "student"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### **POST /api/hostels/:hostelId/roles**
**Purpose**: Create a new custom role for a hostel
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
POST /api/hostels/123/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "custom_warden",
  "displayName": "Custom Warden",
  "description": "Limited warden access",
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}

// Response
{
  "success": true,
  "message": "Custom role created successfully",
  "data": {
    "id": "uuid",
    "name": "custom_warden",
    "display_name": "Custom Warden",
    "description": "Limited warden access",
    "is_system_role": false,
    "hostel_id": "123",
    "created_by": "uuid"
  }
}
```

#### **PUT /api/hostels/:hostelId/roles/:roleId**
**Purpose**: Update an existing custom role
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
PUT /api/hostels/123/roles/456
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Custom Warden",
  "description": "Updated description",
  "permissionIds": ["uuid1", "uuid2", "uuid4"]
}

// Response
{
  "success": true,
  "message": "Custom role updated successfully",
  "data": {
    "id": "456",
    "name": "custom_warden",
    "display_name": "Updated Custom Warden",
    "description": "Updated description",
    "is_system_role": false,
    "hostel_id": "123",
    "created_by": "uuid"
  }
}
```

#### **DELETE /api/hostels/:hostelId/roles/:roleId**
**Purpose**: Delete a custom role
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
DELETE /api/hostels/123/roles/456
Authorization: Bearer <token>

// Response
{
  "success": true,
  "message": "Custom role deleted successfully"
}
```

---

### **User Role Assignment Routes**

#### **POST /api/hostels/:hostelId/users/:userId/assign-role**
**Purpose**: Assign a role to a user
**Access**: Users with `manage_roles` permission
**Middleware**: `verifyToken`, `requirePermission('manage_roles')`

```javascript
// Request
POST /api/hostels/123/users/789/assign-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "456"
}

// Response
{
  "success": true,
  "message": "Role assigned to user successfully",
  "data": {
    "userId": "789",
    "roleId": "456",
    "role": "custom_warden"
  }
}
```

---

## 🛡️ **Route Protection**

### **Middleware Stack**
```javascript
// Applied to all RBAC routes
router.use(verifyToken);                    // 1. Authenticate user
router.use(requirePermission('...'));       // 2. Check specific permissions
```

### **Permission Requirements**

| Route | Permission Required | Description |
|-------|-------------------|-------------|
| `/api/rbac/user-permissions` | None | All authenticated users |
| `/api/rbac/check-permission` | None | All authenticated users |
| `/api/rbac/check-any-permission` | None | All authenticated users |
| `/api/rbac/check-all-permissions` | None | All authenticated users |
| `/api/rbac/permissions` | `manage_roles` | Role management access |
| `/api/rbac/system-roles` | `manage_roles` | Role management access |
| `/api/hostels/:hostelId/roles` | `view_roles` | View custom roles |
| `POST /api/hostels/:hostelId/roles` | `manage_roles` | Create custom roles |
| `PUT /api/hostels/:hostelId/roles/:roleId` | `manage_roles` | Update custom roles |
| `DELETE /api/hostels/:hostelId/roles/:roleId` | `manage_roles` | Delete custom roles |
| `POST /api/hostels/:hostelId/users/:userId/assign-role` | `manage_roles` | Assign roles to users |

---

## 🔍 **Error Handling**

### **Error Response Format**
All routes return consistent error responses:

```javascript
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error message (development only)"
}
```

### **HTTP Status Codes**
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error (server errors)

---

## 📝 **Usage Examples**

### **Frontend Integration**
```javascript
// Get user permissions for sidebar rendering
const getUserPermissions = async () => {
  try {
    const response = await fetch('/api/rbac/user-permissions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      // Render sidebar based on permissions
      renderSidebar(data.data.permissions);
    }
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
  }
};

// Check specific permission
const checkPermission = async (permissionName) => {
  try {
    const response = await fetch('/api/rbac/check-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ permissionName })
    });
    const data = await response.json();
    
    return data.success && data.data.hasPermission;
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
};

// Create custom role
const createCustomRole = async (hostelId, roleData) => {
  try {
    const response = await fetch(`/api/hostels/${hostelId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(roleData)
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('Custom role created:', data.data);
    }
  } catch (error) {
    console.error('Failed to create custom role:', error);
  }
};
```

### **Testing with cURL**
```bash
# Get user permissions
curl -X GET "http://localhost:5000/api/rbac/user-permissions" \
  -H "Authorization: Bearer <token>"

# Check permission
curl -X POST "http://localhost:5000/api/rbac/check-permission" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"permissionName": "manage_hostel"}'

# Create custom role
curl -X POST "http://localhost:5000/api/hostels/123/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "custom_warden",
    "displayName": "Custom Warden",
    "description": "Limited warden access",
    "permissionIds": ["uuid1", "uuid2", "uuid3"]
  }'
```

---

## 🎯 **Performance Considerations**

### **Caching Strategy**
- Consider caching user permissions for frequently accessed users
- Implement Redis caching for permission checks in production
- Cache system roles and permissions for role creation forms

### **Rate Limiting**
- Consider implementing rate limiting for permission check endpoints
- Limit role creation/update operations to prevent abuse

### **Database Optimization**
- All operations use the RBAC service which is optimized
- Efficient database queries with proper indexing
- Minimal data fetching for permission checks

---

## 📚 **Related Documentation**

- `RBAC_CONTROLLER_DOCUMENTATION.md` - RBAC controller documentation
- `RBAC_SERVICE_DOCUMENTATION.md` - RBAC service layer documentation
- `PERMISSION_MIDDLEWARE_DOCUMENTATION.md` - Permission middleware documentation
- `RBAC_COMPLETE_SUMMARY.md` - Complete RBAC system overview

**The RBAC Routes are now ready for comprehensive role and permission management!** 🚀







