"use strict";

/**
 * Realign role permissions to FINAL spec (2025-09-13)
 * Changes vs previous alignment:
 *  - Ensure room_allocation_* perms assigned to owner/warden/superadmin
 *  - Warden now has full CRUD for students, rooms (including create/delete), staff (including create/delete & role_assign), complaints (full CRUD + exports), visitors (full CRUD + export), and exports for rooms/students/staff/complaints/visitors
 *  - Warden still excluded from hostel CRUD & hostel settings, system-level, billing_view (keeps view_reports/view_analytics) and manage_system namespaces
 *  - Owner unchanged (no system-level)
 *  - Student unchanged
 *  - Superadmin = all permissions
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    const [roles] = await queryInterface.sequelize.query('SELECT id, name FROM Roles WHERE name IN ("owner","warden","student","superadmin")');
    const roleId = Object.fromEntries(roles.map(r => [r.name, r.id]));

    const [perms] = await queryInterface.sequelize.query('SELECT id, name FROM Permissions');
    const permId = Object.fromEntries(perms.map(p => [p.name, p.id]));

    const has = (name) => !!permId[name];
    const map = (list) => list.filter(has).map(n => ({ id: require('crypto').randomUUID(), role_id: roleId[currentRole], permission_id: permId[n], created_at: new Date() }));

    // Build target sets
    const COMMON_PROFILE = ['manage_profile','view_profile','change_password','view_own_data'];
    const HOSTEL_CORE = ['hostel_create','hostel_read','hostel_update','hostel_delete','hostel_settings_update','view_hostel_stats'];
    const ROOMS = ['room_read','room_create','room_update','room_delete','room_allocation_read','room_allocation_create','room_allocation_update','room_allocation_delete','export_room_data'];
    const STUDENTS = ['student_read','student_create','student_update','student_delete','manage_student_rooms','view_student_rooms','export_student_data'];
    const STAFF = ['staff_read','staff_create','staff_update','staff_delete','role_assign','export_staff_data'];
    const VISITORS = ['visitor_read','visitor_create','visitor_update','visitor_delete','export_visitor_data'];
    const COMPLAINTS = ['complaint_read','complaint_create','complaint_update','complaint_delete','view_complaint_stats','export_complaint_data'];
    const REPORTING = ['view_reports','view_analytics','view_billing'];
    const REPORTING_WARDEN = ['view_reports','view_analytics'];
    const SYSTEM = ['manage_system','manage_all_hostels','view_system_stats','manage_billing','manage_owners'];

    const OWNER_SET = [...HOSTEL_CORE, ...ROOMS, ...STUDENTS, ...STAFF, ...VISITORS, ...COMPLAINTS, ...REPORTING, ...COMMON_PROFILE];

    // Updated Warden: full CRUD & exports for non-hostel domains, but no hostel create/update/delete/settings, no billing view, no system perms
    const WARDEN_SET = [
      'hostel_read','view_hostel_stats',
      ...ROOMS,
      ...STUDENTS,
      ...STAFF,
      ...VISITORS,
      ...COMPLAINTS,
      ...REPORTING_WARDEN,
      ...COMMON_PROFILE
    ];

    const STUDENT_SET = [...COMMON_PROFILE,'complaint_create','complaint_read','visitor_create','visitor_read'];
    const SUPERADMIN_SET = perms.map(p => p.name); // full set

    const matrix = [
      { role: 'owner', set: OWNER_SET },
      { role: 'warden', set: WARDEN_SET },
      { role: 'student', set: STUDENT_SET },
      { role: 'superadmin', set: SUPERADMIN_SET }
    ];

    for (const { role, set } of matrix) {
      if (!roleId[role]) continue;
      await queryInterface.bulkDelete('RolePermissions', { role_id: roleId[role] });
      let currentRole = role; // for map closure
      const rows = set.filter(has).map(n => ({ id: require('crypto').randomUUID(), role_id: roleId[role], permission_id: permId[n], created_at: new Date() }));
      if (rows.length) await queryInterface.bulkInsert('RolePermissions', rows);
    }
  },

  async down(queryInterface, Sequelize) {
    // Down: no-op (role assignments are mutable operational data). Could re-run previous alignment if needed.
  }
};
