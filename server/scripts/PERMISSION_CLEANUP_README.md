# Permission Cleanup Instructions

This document provides instructions for cleaning up redundant permissions from the HostelHive system.

## Overview

The following permissions have been identified as redundant and should be removed:

- `change_password` - Should be handled by authentication system, not permission-based
- `view_complaint_stats` - Redundant, complaint stats should be part of view_dashboard or complaint_read
- `manage_student_rooms` - Redundant with room_allocation_* permissions
- `view_own_data` - Student-only permission, not needed for role-based system
- `view_analytics` - Redundant for owners who should have dashboard access
- `view_reports` - Redundant for owners, reports section is superadmin-only
- `view_hostel_stats` - Redundant with view_dashboard
- `manage_profile` - Should not exist for custom roles (profile management is user-specific)

## Files Updated

### 1. Frontend Changes ✅ COMPLETED
- `client/src/components/StaffManagement/StaffManagement.tsx` - Removed redundant permissions from PERMISSION_GROUPS
- `client/src/components/layout/Sidebar.tsx` - Updated billing section to be permission-based (not superadmin-only), removed reports section

### 2. Seeder File Cleanup ✅ COMPLETED
- `server/seeders/20250115000006-seed-rbac-data.js` - Removed redundant permission definitions and assignments
- Backup created: `20250115000006-seed-rbac-data.js.backup.[timestamp]`

### 3. Database Cleanup Script
- `server/scripts/cleanup-redundant-permissions.sql` - SQL script to safely remove permissions from database

## Database Cleanup Instructions

### Prerequisites
- Database backup (recommended)
- Access to PostgreSQL/MySQL database
- Admin privileges

### Steps

1. **Backup your database** (IMPORTANT):
   ```bash
   # PostgreSQL
   pg_dump -h localhost -U username -d hostelhive > backup_before_permission_cleanup.sql
   
   # MySQL
   mysqldump -u username -p hostelhive > backup_before_permission_cleanup.sql
   ```

2. **Run the cleanup script**:
   ```bash
   # PostgreSQL
   psql -h localhost -U username -d hostelhive -f server/scripts/cleanup-redundant-permissions.sql
   
   # MySQL
   mysql -u username -p hostelhive < server/scripts/cleanup-redundant-permissions.sql
   ```

3. **Verify the cleanup**:
   ```sql
   -- Check if permissions were removed
   SELECT name FROM permissions 
   WHERE name IN (
     'change_password', 'view_complaint_stats', 'manage_student_rooms',
     'view_own_data', 'view_analytics', 'view_reports', 
     'view_hostel_stats', 'manage_profile'
   );
   -- Should return 0 rows
   
   -- Check total permissions count
   SELECT COUNT(*) FROM permissions;
   
   -- Check backup table was created
   SELECT COUNT(*) FROM permission_cleanup_backup_20250914;
   ```

## Rollback Instructions

If you need to rollback the changes:

```sql
-- Restore permissions (run manually if needed)
INSERT INTO permissions (name, description, created_at, updated_at)
SELECT name, description, created_at, updated_at 
FROM permission_cleanup_backup_20250914;

-- Note: Role assignments would need to be manually restored
-- based on your system's requirements
```

## New Billing Section

### Changes Made:
- **Billing** is now accessible to users with `view_billing` permission (not just superadmin)
- **Reports** section removed (was redundant, superadmin has separate analytics section)

### Billing Access:
- **Superadmin**: `/dashboard/superadmin/billing` (global billing overview)
- **Hostel Staff**: `/dashboard/hostels/[hostelId]/billing` (hostel-specific billing)

## Testing Checklist

After running the cleanup:

- [ ] Staff management permission assignment UI works correctly
- [ ] No references to removed permissions in logs/errors
- [ ] Billing section appears for users with `view_billing` permission
- [ ] Reports section is not visible (removed)
- [ ] All CRUD operations work with remaining permissions
- [ ] Export functionality works with proper permission checks

## Impact Assessment

### ✅ No Impact Expected:
- Core CRUD operations (students, rooms, staff, complaints, visitors)
- Export functionality
- Permission-based UI rendering
- Role assignment functionality

### ⚠️ Potential Impact:
- Users who had removed permissions may lose some UI elements
- Custom roles with removed permissions will be automatically cleaned up
- Any hardcoded checks for removed permissions would need manual review

## Support

If you encounter issues:

1. Check the backup tables were created
2. Review application logs for permission-related errors
3. Use the rollback instructions if needed
4. Contact system administrator for assistance