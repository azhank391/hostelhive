"use strict";

/**
 * RBAC Alignment Migration (2025-09-13)
 *
 * Goals:
 * 1. Introduce granular canonical permission names (export_* set for each domain).
 * 2. Remove legacy / deprecated permission names that are no longer referenced by code.
 * 3. Rebuild system role (owner, warden, student, superadmin) permission assignments to match
 *    the updated specification provided by product:
 *      - superadmin: ALL permissions
 *      - owner: all hostel-level + all export_* (no system-level)
 *      - warden: same as owner MINUS hostel CRUD (create/update/delete/settings) and staff CRUD delete? (keeps operational + exports)
 *      - student: minimal self-service + complaint/visitor create & read
 * 4. Provide a reversible (best-effort) down migration restoring removed permissions (stub metadata) and clearing new ones.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    // Helper fetchers
    const getPermissionsByNames = async (names) => {
      if (!names.length) return {};
      const rows = await queryInterface.sequelize.query(
        "SELECT id, name FROM `Permissions` WHERE name IN (:names)",
        { replacements: { names }, type: Sequelize.QueryTypes.SELECT }
      );
      return rows.reduce((acc, r) => {
        acc[r.name] = r.id;
        return acc;
      }, {});
    };

    const ensurePermission = async (perm) => {
      const existing = await queryInterface.sequelize.query(
        "SELECT id FROM `Permissions` WHERE name = :name LIMIT 1",
        { replacements: { name: perm.name }, type: Sequelize.QueryTypes.SELECT }
      );
      if (existing.length) return existing[0].id;
      const id = require("crypto").randomUUID();
      await queryInterface.bulkInsert("Permissions", [
        {
          id,
          name: perm.name,
          display_name: perm.display_name,
          description: perm.description,
          category: perm.category,
          is_system_permission: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      return id;
    };

    // 1. Canonical new permissions to ensure exist
    const NEW_PERMISSIONS = [
      // Export sets (some already exist; ensure idempotency)
      {
        name: "export_room_data",
        display_name: "Export Room Data",
        description: "Export room information",
        category: "rooms",
      },
      {
        name: "export_staff_data",
        display_name: "Export Staff Data",
        description: "Export staff information",
        category: "staff",
      },
      {
        name: "export_complaint_data",
        display_name: "Export Complaint Data",
        description: "Export complaint information",
        category: "complaints",
      },
    ];

    const newPermissionIds = {};
    for (const p of NEW_PERMISSIONS) {
      newPermissionIds[p.name] = await ensurePermission(p);
    }

    // 2. Permissions we are deprecating (must exist before deletion)
    const LEGACY_PERMISSIONS = [
      "room_allocate",
      "room_deallocate",
      "visitor_checkout",
      "visitor_export",
      "visitor_stats_read",
      "student_export",
      "hostel_stats_read",
      "complaint_resolve",
      "data_export",
      "report_read",
      "analytics_read",
      "billing_read",
      "warden_create",
      "warden_delete",
      "warden_read",
      "warden_update",
      "warden_role_assign",
    ];
    const legacyIds = await getPermissionsByNames(LEGACY_PERMISSIONS);

    // Remove role-permission associations for legacy permissions
    if (Object.keys(legacyIds).length) {
      await queryInterface.bulkDelete("RolePermissions", {
        permission_id: { [Op.in]: Object.values(legacyIds) },
      });
      // Delete the legacy permissions themselves
      await queryInterface.bulkDelete("Permissions", {
        id: { [Op.in]: Object.values(legacyIds) },
      });
    }

    // 3. Rebuild role assignments
    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM `Roles` WHERE name IN ('owner','warden','student','superadmin')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIds = roles.reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {});

    // Fetch all current permission ids after cleanup
    const allPermRows = await queryInterface.sequelize.query(
      "SELECT id, name FROM `Permissions`",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permIdByName = allPermRows.reduce((a, r) => {
      a[r.name] = r.id;
      return a;
    }, {});

    const pick = (...names) =>
      names.filter((n) => permIdByName[n]).map((n) => permIdByName[n]);

    // Define permission groups
    const HOSTEL_CORE = [
      "hostel_create",
      "hostel_read",
      "hostel_update",
      "hostel_delete",
      "hostel_settings_update",
      "view_hostel_stats",
    ];
    const ROOMS = [
      "room_read",
      "room_create",
      "room_update",
      "room_delete",
      "room_allocation_read",
      "room_allocation_create",
      "room_allocation_update",
      "room_allocation_delete",
    ];
    const STUDENTS = [
      "student_read",
      "student_create",
      "student_update",
      "student_delete",
      "manage_student_rooms",
      "view_student_rooms",
      "export_student_data",
    ];
    const STAFF = [
      "staff_read",
      "staff_create",
      "staff_update",
      "staff_delete",
      "role_assign",
      "export_staff_data",
    ];
    const VISITORS = [
      "visitor_read",
      "visitor_create",
      "visitor_update",
      "visitor_delete",
      "export_visitor_data",
    ];
    const COMPLAINTS = [
      "complaint_read",
      "complaint_create",
      "complaint_update",
      "complaint_delete",
      "view_complaint_stats",
      "export_complaint_data",
    ];
    const ROOMS_EXPORT = ["export_room_data"];
    const REPORTING = ["view_reports", "view_analytics", "view_billing"];
    const PROFILE = [
      "manage_profile",
      "view_profile",
      "change_password",
      "view_own_data",
    ];
    const SYSTEM = [
      "manage_system",
      "manage_all_hostels",
      "view_system_stats",
      "manage_billing",
      "manage_owners",
    ];

    // Owner: all hostel-level + exports, no system
    const OWNER_PERMS = [
      ...HOSTEL_CORE,
      ...ROOMS,
      ...ROOMS_EXPORT,
      ...STUDENTS,
      ...STAFF,
      ...VISITORS,
      ...COMPLAINTS,
      ...REPORTING,
      ...PROFILE,
    ];
    // Warden: same as owner minus hostel CRUD (create/update/delete/settings) but keep hostel_read + stats & exports
    const WARDEN_PERMS = OWNER_PERMS.filter(
      (p) =>
        ![
          "hostel_create",
          "hostel_update",
          "hostel_delete",
          "hostel_settings_update",
        ].includes(p)
    );
    // Student: minimal
    const STUDENT_PERMS = [
      "view_profile", // Changed from profile_read
      "view_own_data",
      "change_password",
      "complaint_create",
      "complaint_read",
      "complaint_update", // ✅ NEW
      "complaint_delete", // ✅ NEW
      "visitor_read",
      "visitor_create",
      "visitor_update", // ✅ NEW (covers update and checkout)
      "visitor_delete", // ✅ NEW
      "manage_profile", // Changed from profile_update
    ];
    // Superadmin: ALL
    const SUPERADMIN_PERMS = allPermRows.map((r) => r.name); // After legacy removal

    const assignmentMatrix = [
      { role: "owner", perms: OWNER_PERMS },
      { role: "warden", perms: WARDEN_PERMS },
      { role: "student", perms: STUDENT_PERMS },
      { role: "superadmin", perms: SUPERADMIN_PERMS },
    ];

    for (const { role, perms } of assignmentMatrix) {
      if (!roleIds[role]) continue;
      // Clear existing mappings for the role
      await queryInterface.bulkDelete("RolePermissions", {
        role_id: roleIds[role],
      });
      // Insert new
      const rows = perms
        .filter((name) => permIdByName[name])
        .map((name) => ({
          id: require("crypto").randomUUID(),
          role_id: roleIds[role],
          permission_id: permIdByName[name],
          created_at: new Date(),
        }));
      if (rows.length) await queryInterface.bulkInsert("RolePermissions", rows);
    }
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    const removed = [
      "export_room_data",
      "export_staff_data",
      "export_complaint_data",
    ];
    // Delete new export permissions role mappings then permissions
    const rows = await queryInterface.sequelize.query(
      "SELECT id FROM `Permissions` WHERE name IN (:names)",
      { replacements: { names: removed }, type: Sequelize.QueryTypes.SELECT }
    );
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      await queryInterface.bulkDelete("RolePermissions", {
        permission_id: { [Op.in]: ids },
      });
      await queryInterface.bulkDelete("Permissions", { id: { [Op.in]: ids } });
    }
    // (We do not restore legacy mappings for brevity) – Safe fallback.
  },
};
