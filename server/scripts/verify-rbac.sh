#!/bin/bash

# Script to verify and fix RBAC permissions
# Run this on EC2 to check if permissions are properly seeded

echo "🔍 Checking RBAC setup..."

cd /var/www/hostelhive/server

# Check if migrations have run
echo ""
echo "📋 Migration status:"
npx sequelize-cli db:migrate:status | tail -10

# Check roles
echo ""
echo "👥 Checking Roles table:"
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT id, name, is_system_role, created_at FROM Roles WHERE is_system_role = true;"

# Check permissions count
echo ""
echo "🔐 Checking Permissions count:"
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) as total_permissions FROM Permissions;"

# Check role-permission mappings for owner
echo ""
echo "🔗 Checking Owner role permissions:"
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
SELECT COUNT(*) as owner_permissions_count 
FROM RolePermissions rp 
JOIN Roles r ON rp.role_id = r.id 
WHERE r.name = 'owner' AND r.is_system_role = true;
"

# Get specific owner permissions
echo ""
echo "📜 Owner permissions list:"
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
SELECT p.name as permission_name 
FROM RolePermissions rp 
JOIN Roles r ON rp.role_id = r.id 
JOIN Permissions p ON rp.permission_id = p.id 
WHERE r.name = 'owner' AND r.is_system_role = true
ORDER BY p.name
LIMIT 20;
"

echo ""
echo "✅ RBAC verification complete!"
echo ""
echo "Expected counts:"
echo "  - Total Permissions: 58"
echo "  - Owner Permissions: 43"
echo "  - Warden Permissions: 20"
echo "  - Student Permissions: 8"
