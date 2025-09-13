"use strict";

/**
 * Migration: Remove staff-related permissions from warden role per revised spec.
 * Warden should NOT have: staff_create, staff_update, staff_delete, role_assign, export_staff_data
 * Retains: staff_read (for visibility if needed) – if that is also to be removed, adjust below.
 */

const REMOVE = ['staff_create','staff_update','staff_delete','role_assign','export_staff_data'];
const KEEP = ['staff_read'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const [roles] = await queryInterface.sequelize.query("SELECT id FROM Roles WHERE name = 'warden'");
    if (!roles.length) return;
    const wardenId = roles[0].id;
    const [perms] = await queryInterface.sequelize.query("SELECT id, name FROM Permissions WHERE name IN (:names)", { replacements: { names: REMOVE } });
    if (!perms.length) return;
    const permIds = perms.map(p => p.id);
    await queryInterface.bulkDelete('RolePermissions', { role_id: wardenId, permission_id: { [Sequelize.Op.in]: permIds } });
  },
  async down(queryInterface, Sequelize) {
    // Best-effort restore: re-add removed permissions if they exist
    const [roles] = await queryInterface.sequelize.query("SELECT id FROM Roles WHERE name = 'warden'");
    if (!roles.length) return;
    const wardenId = roles[0].id;
    const [perms] = await queryInterface.sequelize.query("SELECT id, name FROM Permissions WHERE name IN (:names)", { replacements: { names: REMOVE } });
    if (!perms.length) return;
    const rows = perms.map(p => ({ id: require('crypto').randomUUID(), role_id: wardenId, permission_id: p.id, created_at: new Date() }));
    await queryInterface.bulkInsert('RolePermissions', rows);
  }
};
