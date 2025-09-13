"use strict";

/**
 * Migration: Add missing canonical permissions & remove orphaned legacy ones
 * Derived from automated permission audit report.
 * Missing canonical: room_allocation_create, room_allocation_update, room_allocation_delete,
 *   export_room_data, export_staff_data, export_complaint_data
 * Orphaned legacy: room_allocate, room_deallocate, view_visitor_stats, visitor_checkout
 */

const CANONICAL_TO_ADD = [
  { name: 'room_allocation_create', display_name: 'Allocate Rooms', category: 'rooms' },
  { name: 'room_allocation_update', display_name: 'Update Room Allocation', category: 'rooms' },
  { name: 'room_allocation_delete', display_name: 'Deallocate Rooms', category: 'rooms' },
  { name: 'export_room_data', display_name: 'Export Room Data', category: 'rooms' },
  { name: 'export_staff_data', display_name: 'Export Staff Data', category: 'staff' },
  { name: 'export_complaint_data', display_name: 'Export Complaint Data', category: 'complaints' }
];

const LEGACY_TO_REMOVE = [
  'room_allocate',
  'room_deallocate',
  'view_visitor_stats',
  'visitor_checkout'
];

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch existing permissions
      const [existing] = await queryInterface.sequelize.query("SELECT name FROM Permissions", { transaction });
      const existingNames = new Set(existing.map(r => r.name));

      // Insert missing canonical permissions
      for (const perm of CANONICAL_TO_ADD) {
        if (!existingNames.has(perm.name)) {
          await queryInterface.bulkInsert('Permissions', [{
            id: Sequelize.literal('UUID()'),
            name: perm.name,
            display_name: perm.display_name,
            category: perm.category,
            created_at: new Date(),
            updated_at: new Date()
          }], { transaction });
        }
      }

      // Remove legacy orphaned permissions if they still exist
      for (const legacy of LEGACY_TO_REMOVE) {
        if (existingNames.has(legacy)) {
          await queryInterface.bulkDelete('Permissions', { name: legacy }, { transaction });
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove the permissions we inserted
      await queryInterface.bulkDelete('Permissions', { name: CANONICAL_TO_ADD.map(p => p.name) }, { transaction });

      // Recreate legacy permissions (minimal) so rollback is not destructive
      for (const legacy of LEGACY_TO_REMOVE) {
        // Recreate with generic display name if missing
        const [rows] = await queryInterface.sequelize.query('SELECT name FROM Permissions WHERE name = :name', { replacements: { name: legacy }, transaction });
        if (rows.length === 0) {
          await queryInterface.bulkInsert('Permissions', [{
            id: Sequelize.literal('UUID()'),
            name: legacy,
            display_name: legacy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            category: 'legacy',
            created_at: new Date(),
            updated_at: new Date()
          }], { transaction });
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
