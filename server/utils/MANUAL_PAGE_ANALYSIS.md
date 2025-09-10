# 📊 MANUAL PAGE ANALYSIS - COMPREHENSIVE API MAPPING

## 🎯 **ANALYSIS STRATEGY: Option A - Manual Page Analysis**

Based on the sidebar structure and your request, I'm analyzing each page systematically to map out all API calls and dependencies.

---

## 📋 **SIDEBAR STRUCTURE ANALYSIS**

From the sidebar image, I can see these main sections:

### **GENERAL Section:**
- ✅ **Dashboard** (Currently selected)
- ✅ **My Hostels**

### **OPERATIONS Section:**
- ✅ **Room Management**
- ✅ **Students** 
- ✅ **Staff Management**
- ✅ **Complaints**
- ✅ **Visitor Management**
- ✅ **Billing**
- ✅ **Reports**

---

## 🔍 **DETAILED PAGE ANALYSIS**

### **1. DASHBOARD PAGE** (`/dashboard/page.tsx`)
**Purpose**: Main routing page that redirects users based on their role
**APIs Called**: 
- ❌ **No direct API calls** - This is a routing component
- 🔄 **Uses Context APIs**: 
  - `useAuth()` - Gets user authentication data
  - `useHostel()` - Gets hostel context data
- 🎯 **Routing Logic**: Redirects to appropriate dashboard based on user role

**Dependencies**:
- Authentication context
- Hostel context
- Router navigation

---

### **2. MY HOSTELS PAGE** (`/dashboard/owner/hostels/page.tsx`)
**Purpose**: Owner's hostel management page
**Component**: `HostelManagement`
**APIs Called**:
- `GET /api/auth/hostels` - Get owner's hostels
- `GET /api/superadmin/hostels` - Get all hostels (for superadmin)
- `POST /api/hostels` - Create new hostel
- `PUT /api/hostels/:id` - Update hostel
- `DELETE /api/hostels/:id` - Delete hostel
- `GET /api/hostels/:id/stats` - Get hostel statistics

**Required Permissions**:
- `view_hostel` or `hostel_read`
- `hostel_create` (for creating hostels)
- `hostel_update` (for updating hostels)
- `hostel_delete` (for deleting hostels)
- `hostel_settings_update` (for managing settings)

---

### **3. ROOM MANAGEMENT PAGE** (`/dashboard/hostels/[hostelId]/rooms/page.tsx`)
**Purpose**: Manage rooms for a specific hostel
**APIs Called**:
- `GET /api/hostels/:hostelId/rooms` - Get all rooms
- `POST /api/hostels/:hostelId/rooms` - Create new room
- `PUT /api/hostels/:hostelId/rooms/:roomId` - Update room
- `DELETE /api/hostels/:hostelId/rooms/:roomId` - Delete room
- `GET /api/hostels/:hostelId/rooms/:roomId/students` - Get students in room
- `DELETE /api/hostels/:hostelId/room-allocations/:studentId` - Remove student from room

**Required Permissions**:
- `view_rooms` - View rooms list
- `manage_rooms` - CRUD operations on rooms
- `view_room_allocations` - See students in rooms
- `deallocate_rooms` - Remove students from rooms
- `view_hostel` - Universal dependency

---

### **4. STUDENTS PAGE** (`/dashboard/hostels/[hostelId]/students/page.tsx`)
**Purpose**: Manage students for a specific hostel
**APIs Called**:
- `GET /api/hostels/:hostelId/students` - Get all students
- `POST /api/hostels/:hostelId/students` - Create new student
- `PUT /api/hostels/:hostelId/students/:studentId` - Update student
- `DELETE /api/hostels/:hostelId/students/:studentId` - Delete student
- `GET /api/hostels/:hostelId/rooms` - Get rooms for allocation dropdown
- `POST /api/hostels/:hostelId/room-allocations` - Allocate room to student
- `DELETE /api/hostels/:hostelId/room-allocations/:allocationId` - Deallocate room

**Required Permissions**:
- `view_students` - View students list
- `manage_students` - CRUD operations on students
- `view_rooms` - See available rooms for allocation
- `allocate_rooms` - Allocate rooms to students
- `deallocate_rooms` - Remove room allocations
- `view_hostel` - Universal dependency

---

### **5. STAFF MANAGEMENT PAGE** (`/dashboard/hostels/[hostelId]/staff/page.tsx`)
**Purpose**: Manage staff and roles for a specific hostel
**Component**: `StaffManagement`
**APIs Called**:
- `GET /api/hostels/:hostelId/staff` - Get all staff
- `POST /api/hostels/:hostelId/staff` - Create new staff
- `PUT /api/hostels/:hostelId/staff/:staffId` - Update staff
- `DELETE /api/hostels/:hostelId/staff/:staffId` - Delete staff
- `PATCH /api/hostels/:hostelId/staff/:staffId/status` - Toggle staff status
- `GET /api/rbac/hostels/:hostelId/roles` - Get available roles
- `POST /api/rbac/hostels/:hostelId/roles` - Create custom role
- `PUT /api/rbac/hostels/:hostelId/roles/:roleId` - Update role
- `DELETE /api/rbac/hostels/:hostelId/roles/:roleId` - Delete role
- `GET /api/rbac/permissions` - Get available permissions
- `POST /api/rbac/hostels/:hostelId/users/:userId/assign-role` - Assign role to user

**Required Permissions**:
- `view_roles` - View staff list
- `manage_roles` - CRUD operations on staff and roles
- `view_hostel` - Universal dependency

---

### **6. COMPLAINTS PAGE** (`/dashboard/hostels/[hostelId]/complaints/page.tsx`)
**Purpose**: Manage complaints for a specific hostel
**APIs Called**:
- `GET /api/hostels/:hostelId/complaints` - Get all complaints
- `PUT /api/hostels/:hostelId/complaints/:complaintId/status` - Update complaint status
- `POST /api/hostels/:hostelId/complaints/:complaintId/resolve` - Resolve complaint
- `DELETE /api/hostels/:hostelId/complaints/:complaintId` - Delete complaint

**Required Permissions**:
- `view_complaints` - View complaints list
- `handle_complaints` - Update status/resolve complaints
- `delete_complaints` - Delete complaints
- `view_hostel` - Universal dependency

---

### **7. VISITOR MANAGEMENT PAGE** (`/dashboard/hostels/[hostelId]/visitors/page.tsx`)
**Purpose**: Manage visitors for a specific hostel
**APIs Called**:
- `GET /api/hostels/:hostelId/visitors` - Get all visitors
- `POST /api/hostels/:hostelId/visitors` - Create new visitor
- `PUT /api/hostels/:hostelId/visitors/:visitorId` - Update visitor
- `DELETE /api/hostels/:hostelId/visitors/:visitorId` - Delete visitor
- `POST /api/hostels/:hostelId/visitors/:visitorId/checkout` - Checkout visitor
- `GET /api/hostels/:hostelId/students` - Get students for host selection

**Required Permissions**:
- `view_visitors` - View visitors list
- `create_visitors` - Create new visitors
- `manage_visitors` - Update/delete visitors
- `checkout_visitors` - Check out visitors
- `view_students` - See students for host selection
- `view_hostel` - Universal dependency

---

### **8. BILLING PAGE** (`/dashboard/superadmin/billing/page.tsx`)
**Purpose**: Superadmin billing overview and management
**Component**: `SuperadminBillingPage`
**APIs Called**:
- ❌ **Currently TODO** - No API calls implemented yet
- 🔄 **Planned APIs**:
  - `GET /api/superadmin/billing/overview` - Get billing overview
  - `GET /api/superadmin/billing/revenue` - Get revenue data
  - `GET /api/superadmin/billing/subscriptions` - Get subscription data
  - `POST /api/superadmin/billing/generate-report` - Generate billing report

**Required Permissions**:
- `superadmin_billing_read` - View billing data
- `superadmin_billing_manage` - Manage billing operations
- `superadmin_reports_generate` - Generate reports

---

### **9. REPORTS PAGE** (`/dashboard/superadmin/analytics/page.tsx`)
**Purpose**: Superadmin analytics and reports
**Component**: `SuperadminAnalyticsPage`
**APIs Called**:
- ❌ **Currently TODO** - No API calls implemented yet
- 🔄 **Planned APIs**:
  - `GET /api/superadmin/analytics/user-growth` - Get user growth data
  - `GET /api/superadmin/analytics/hostel-growth` - Get hostel growth data
  - `GET /api/superadmin/analytics/regional-distribution` - Get regional data
  - `GET /api/superadmin/analytics/plan-distribution` - Get plan distribution
  - `POST /api/superadmin/analytics/export-report` - Export analytics report

**Required Permissions**:
- `superadmin_analytics_read` - View analytics data
- `superadmin_reports_generate` - Generate reports
- `superadmin_data_export` - Export data

---

## 🎯 **CROSS-PAGE DEPENDENCIES**

### **Students ↔ Rooms**:
- Students page needs room data for allocation
- Rooms page needs student data for room details

### **Visitors ↔ Students**:
- Visitors page needs student data for host selection
- Students page might need visitor data for student details

### **All Pages ↔ Hostel**:
- All pages need `view_hostel` permission
- All pages need hostel context for API calls

---

## 📊 **PERMISSION BREAKDOWN BY PAGE**

| Page | View Permissions | Manage Permissions | Action Permissions | Total |
|------|------------------|-------------------|-------------------|-------|
| Dashboard | 0 | 0 | 0 | 0 |
| My Hostels | 1 | 4 | 0 | 5 |
| Room Management | 2 | 1 | 1 | 4 |
| Students | 2 | 1 | 2 | 5 |
| Staff Management | 1 | 1 | 0 | 2 |
| Complaints | 1 | 1 | 1 | 3 |
| Visitor Management | 2 | 1 | 1 | 4 |
| Billing | 1 | 1 | 1 | 3 |
| Reports | 1 | 0 | 2 | 3 |

---

## 🚀 **NEXT STEPS**

1. ✅ **Complete API Implementation** for Billing and Reports pages
2. ✅ **Update PagePermissionResolver** with new page mappings
3. ✅ **Test Role Scenarios** with all pages
4. ✅ **Optimize Dependencies** based on real usage patterns

---

## 🎯 **KEY INSIGHTS**

1. **Dashboard page** is purely routing - no API dependencies
2. **Students page** has the most complex dependencies (room allocation)
3. **Staff Management** has the most APIs (11 total)
4. **Billing and Reports** need API implementation
5. **All pages** require `view_hostel` as universal dependency

This analysis provides the foundation for intelligent permission resolution and role-based access control! 🎉
