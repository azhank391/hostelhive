"use strict";

/**
 * Adds missing RBAC structures required by later migrations:
 * - operation column on Permissions (used to classify CRUD/other ops)
 * - PermissionDependencies table to model permission prerequisites
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🛠️ Adding Permissions.operation column and PermissionDependencies table...");

    // 1) Add `operation` column to Permissions if it doesn't exist
    const table = await queryInterface.describeTable("Permissions");
    if (!table.operation) {
      await queryInterface.addColumn("Permissions", "operation", {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Operation classification: create, read, update, delete, manage, etc.",
      });
      console.log("✅ Added Permissions.operation column");
    } else {
      console.log("ℹ️ Permissions.operation column already exists — skipping");
    }

    // 2) Create PermissionDependencies table if it doesn't exist
    //    Note: Some previous migrations reference this table via raw SQL.
    const tables = await queryInterface.showAllTables();
    const hasDeps = tables
      .map((t) => (typeof t === "string" ? t : t.tableName))
      .some((name) => name.toLowerCase() === "permissiondependencies");

    if (!hasDeps) {
      await queryInterface.createTable("PermissionDependencies", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        parent_permission_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "Permissions",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          comment: "The permission that requires another permission",
        },
        required_permission_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "Permissions",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          comment: "The permission that is required by the parent",
        },
        is_automatic: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: "If true, assigning parent auto-assigns required",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      // Unique constraint to prevent duplicate entries
      await queryInterface.addIndex(
        "PermissionDependencies",
        ["parent_permission_id", "required_permission_id"],
        {
          unique: true,
          name: "unique_permission_dependency",
        }
      );

      // Helpful lookup indexes
      await queryInterface.addIndex("PermissionDependencies", ["parent_permission_id"], {
        name: "idx_permdeps_parent",
      });
      await queryInterface.addIndex("PermissionDependencies", ["required_permission_id"], {
        name: "idx_permdeps_required",
      });

      console.log("✅ Created PermissionDependencies table with indexes");
    } else {
      console.log("ℹ️ PermissionDependencies table already exists — skipping");
    }

    console.log("🎉 RBAC prerequisites added successfully");
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Reverting RBAC prerequisites...");

    // Drop PermissionDependencies if present
    const tables = await queryInterface.showAllTables();
    const hasDeps = tables
      .map((t) => (typeof t === "string" ? t : t.tableName))
      .some((name) => name.toLowerCase() === "permissiondependencies");
    if (hasDeps) {
      await queryInterface.removeIndex(
        "PermissionDependencies",
        "unique_permission_dependency"
      ).catch(() => {});
      await queryInterface.removeIndex("PermissionDependencies", "idx_permdeps_parent").catch(() => {});
      await queryInterface.removeIndex("PermissionDependencies", "idx_permdeps_required").catch(() => {});
      await queryInterface.dropTable("PermissionDependencies");
      console.log("✅ Dropped PermissionDependencies table");
    } else {
      console.log("ℹ️ PermissionDependencies table not found — skipping drop");
    }

    // Remove operation column if present
    const table = await queryInterface.describeTable("Permissions").catch(() => null);
    if (table && table.operation) {
      await queryInterface.removeColumn("Permissions", "operation");
      console.log("✅ Removed Permissions.operation column");
    } else {
      console.log("ℹ️ Permissions.operation column not found — skipping remove");
    }

    console.log("🔚 RBAC prerequisites reverted");
  },
};
