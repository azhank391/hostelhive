# 🎯 HOSTELHIVE PERMISSION MAPPING

## 📋 Complete Permission Database Mapping

This document provides a comprehensive mapping of all permissions that exist in the HostelHive database, organized by category and showing which roles have access to each permission.

---

## 📊 Summary Statistics

- **Total Permissions**: 58 permissions
- **Categories**: 13 categories
- **System Roles**: 4 roles (Owner, Student, Superadmin, Warden)
- **Operations**: Create, Read, Update, Delete

---

## 🏗️ Permission Categories & Operations

### 1. **COMPLAINTS** (6 permissions)
- `complaint_create` (create) - Create Complaint
- `complaint_delete` (delete) - Delete Complaint  
- `complaint_handle` (update) - Handle Complaint
- `complaint_read` (read) - View Complaint
- `complaint_stats_read` (read) - View Complaint Stats
- `complaint_update` (update) - Update Complaint

### 2. **DASHBOARD** (1 permission)
- `view_dashboard` (read) - View Dashboard

### 3. **HOSTEL** (6 permissions)
- `hostel_create` (create) - Create Hostel
- `hostel_delete` (delete) - Delete Hostel
- `hostel_read` (read) - View Hostel
- `hostel_settings_update` (update) - Update Hostel Settings
- `hostel_stats_read` (read) - View Hostel Stats
- `hostel_update` (update) - Update Hostel

### 4. **OWNER** (1 permission)
- `view_owner_hostels` (read) - View Owner Hostels

### 5. **PROFILE** (4 permissions)
- `profile_create` (create) - Create Profile
- `profile_delete` (delete) - Delete Profile
- `profile_read` (read) - View Profile
- `profile_update` (update) - Update Profile

### 6. **REPORTS** (4 permissions)
- `analytics_read` (read) - View Analytics
- `billing_read` (read) - View Billing
- `data_export` (read) - Export Data
- `report_read` (read) - View Reports

### 7. **ROLES** (6 permissions)
- `permission_manage` (update) - Manage Permissions
- `role_assign` (update) - Assign Role
- `role_create` (create) - Create Role
- `role_delete` (delete) - Delete Role
- `role_read` (read) - View Role
- `role_update` (update) - Update Role

### 8. **ROOMS** (6 permissions)
- `room_allocate` (create) - Allocate Room
- `room_create` (create) - Create Room
- `room_deallocate` (delete) - Deallocate Room
- `room_delete` (delete) - Delete Room
- `room_read` (read) - View Room
- `room_update` (update) - Update Room

### 9. **SETTINGS** (1 permission)
- `view_settings` (read) - View Settings

### 10. **STUDENTS** (6 permissions)
- `student_create` (create) - Create Student
- `student_delete` (delete) - Delete Student
- `student_export` (read) - Export Student Data
- `student_read` (read) - View Student
- `student_room_assign` (update) - Assign Student Room
- `student_update` (update) - Update Student

### 11. **SYSTEM** (5 permissions)
- `billing_manage` (update) - Manage Billing
- `hostel_global_manage` (update) - Manage All Hostels
- `owner_manage` (update) - Manage Owners
- `system_manage` (update) - Manage System
- `system_stats_read` (read) - View System Stats

### 12. **VISITORS** (7 permissions)
- `visitor_checkout` (update) - Checkout Visitor
- `visitor_create` (create) - Create Visitor
- `visitor_delete` (delete) - Delete Visitor
- `visitor_export` (read) - Export Visitor Data
- `visitor_read` (read) - View Visitor
- `visitor_stats_read` (read) - View Visitor Stats
- `visitor_update` (update) - Update Visitor

### 13. **WARDENS** (5 permissions)
- `warden_create` (create) - Create Warden
- `warden_delete` (delete) - Delete Warden
- `warden_read` (read) - View Warden
- `warden_role_assign` (update) - Assign Warden Role
- `warden_update` (update) - Update Warden

---

## 🔐 Role-Based Permission Assignment

### **SUPERADMIN** (58 permissions) - Complete Access
**All permissions across all categories**

#### Categories with Full Access:
- ✅ **COMPLAINTS**: All 6 permissions
- ✅ **DASHBOARD**: All 1 permission
- ✅ **HOSTEL**: All 6 permissions
- ✅ **OWNER**: All 1 permission
- ✅ **PROFILE**: All 4 permissions
- ✅ **REPORTS**: All 4 permissions
- ✅ **ROLES**: All 6 permissions
- ✅ **ROOMS**: All 6 permissions
- ✅ **SETTINGS**: All 1 permission
- ✅ **STUDENTS**: All 6 permissions
- ✅ **SYSTEM**: All 5 permissions
- ✅ **VISITORS**: All 7 permissions
- ✅ **WARDENS**: All 5 permissions

### **OWNER** (55 permissions) - Hostel Management
**Full hostel management except system-level operations**

#### Categories with Full Access:
- ✅ **COMPLAINTS**: All 6 permissions
- ✅ **DASHBOARD**: All 1 permission
- ✅ **HOSTEL**: All 6 permissions
- ✅ **OWNER**: All 1 permission
- ✅ **PROFILE**: All 4 permissions
- ✅ **REPORTS**: All 4 permissions
- ✅ **ROLES**: All 6 permissions
- ✅ **ROOMS**: All 6 permissions
- ✅ **SETTINGS**: All 1 permission
- ✅ **STUDENTS**: All 6 permissions
- ✅ **VISITORS**: All 7 permissions
- ✅ **WARDENS**: All 5 permissions

#### Limited Access:
- 🔒 **SYSTEM**: 2/5 permissions
  - ✅ `billing_manage` (update)
  - ✅ `system_stats_read` (read)
  - ❌ `hostel_global_manage` (update)
  - ❌ `owner_manage` (update)
  - ❌ `system_manage` (update)

### **WARDEN** (30 permissions) - Operational Management
**Day-to-day hostel operations without administrative privileges**

#### Categories with Full Access:
- ✅ **COMPLAINTS**: All 6 permissions
- ✅ **DASHBOARD**: All 1 permission
- ✅ **ROOMS**: All 6 permissions
- ✅ **STUDENTS**: All 6 permissions
- ✅ **VISITORS**: All 7 permissions

#### Limited Access:
- 🔒 **HOSTEL**: 2/6 permissions
  - ✅ `hostel_read` (read)
  - ✅ `hostel_stats_read` (read)
  - ❌ `hostel_create`, `hostel_delete`, `hostel_settings_update`, `hostel_update`

- 🔒 **PROFILE**: 2/4 permissions
  - ✅ `profile_read` (read)
  - ✅ `profile_update` (update)
  - ❌ `profile_create`, `profile_delete`

#### No Access:
- ❌ **OWNER**: 0/1 permissions
- ❌ **REPORTS**: 0/4 permissions
- ❌ **ROLES**: 0/6 permissions
- ❌ **SETTINGS**: 0/1 permissions
- ❌ **SYSTEM**: 0/5 permissions
- ❌ **WARDENS**: 0/5 permissions

### **STUDENT** (7 permissions) - Minimal Access
**Basic self-service and complaint functionality**

#### Limited Access:
- 🔒 **COMPLAINTS**: 2/6 permissions
  - ✅ `complaint_create` (create)
  - ✅ `complaint_read` (read)
  - ❌ `complaint_delete`, `complaint_handle`, `complaint_stats_read`, `complaint_update`

- 🔒 **DASHBOARD**: 1/1 permission
  - ✅ `view_dashboard` (read)

- 🔒 **PROFILE**: 2/4 permissions
  - ✅ `profile_read` (read)
  - ✅ `profile_update` (update)
  - ❌ `profile_create`, `profile_delete`

- 🔒 **VISITORS**: 2/7 permissions
  - ✅ `visitor_create` (create)
  - ✅ `visitor_read` (read)
  - ❌ `visitor_checkout`, `visitor_delete`, `visitor_export`, `visitor_stats_read`, `visitor_update`

#### No Access:
- ❌ **HOSTEL**: 0/6 permissions
- ❌ **OWNER**: 0/1 permissions
- ❌ **REPORTS**: 0/4 permissions
- ❌ **ROLES**: 0/6 permissions
- ❌ **ROOMS**: 0/6 permissions
- ❌ **SETTINGS**: 0/1 permissions
- ❌ **STUDENTS**: 0/6 permissions
- ❌ **SYSTEM**: 0/5 permissions
- ❌ **WARDENS**: 0/5 permissions

---

## 🎯 Permission Analysis

### **High-Privilege Permissions** (Destructive Operations)
These permissions allow permanent data deletion or system-wide changes:

#### Delete Operations:
- `complaint_delete` - Delete complaints
- `hostel_delete` - Delete hostels
- `profile_delete` - Delete profiles
- `role_delete` - Delete custom roles
- `room_delete` - Delete rooms
- `room_deallocate` - Remove room assignments
- `student_delete` - Delete student records
- `visitor_delete` - Delete visitor logs
- `warden_delete` - Delete warden records

#### System Management:
- `billing_manage` - Manage billing and payments
- `hostel_global_manage` - Manage all hostels in system
- `owner_manage` - Create and manage owners
- `system_manage` - System-wide management
- `permission_manage` - Manage permission assignments

### **Export/Reporting Permissions**
Data export and analytics capabilities:
- `data_export` - Export data in various formats
- `student_export` - Export student information
- `visitor_export` - Export visitor logs
- `analytics_read` - View analytics dashboards
- `billing_read` - View billing information

### **Statistics Permissions**
Analytics and reporting access:
- `complaint_stats_read` - View complaint analytics
- `hostel_stats_read` - View hostel statistics
- `system_stats_read` - View system-wide statistics
- `visitor_stats_read` - View visitor analytics

---

## 🔄 Recent Changes

### Migration: `20250116000004-add-warden-stats-permission`
- ✅ Added `hostel_stats_read` permission to warden roles
- **Impact**: Wardens can now view hostel statistics on dashboard

### Staff Deletion Behavior Update
- ✅ Custom roles are now **preserved** when deleting staff members
- ✅ Users assigned to deleted staff's custom roles are reassigned to default 'student' role
- **Impact**: Custom roles with permissions remain available for reassignment

---

## 📝 Notes for Development

1. **Permission Dependencies**: The system uses dependency resolution where action permissions automatically grant corresponding view permissions for sidebar visibility.

2. **Custom Roles**: In addition to system roles, the system supports custom roles that can be created by owners and assigned specific permissions.

3. **Hostel Context**: All permissions operate within the context of a specific hostel (except system-level permissions for superadmin).

4. **API Integration**: Permission checks are integrated throughout the API endpoints using middleware for access control.

5. **Frontend Integration**: Client-side permission checks use the same permission names for UI element visibility and functionality access.
