"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔧 Ensuring canonical system roles exist...");

    // Define the canonical roles
    const canonicalRoles = [
      {
        name: "superadmin",
        description: "Full system access across all hostels",
        is_system_role: true,
      },
      {
        name: "owner",
        description: "Full hostel admin with subscription & billing",
        is_system_role: true,
      },
      {
        name: "warden",
        description: "Hostel operations manager",
        is_system_role: true,
      },
      {
        name: "student",
        description: "Resident student with limited access",
        is_system_role: true,
      },
    ];

    // Insert roles only if they don't exist (idempotent)
    for (const role of canonicalRoles) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = :name LIMIT 1`,
        {
          replacements: { name: role.name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existing) {
        await queryInterface.bulkInsert("Roles", [
          {
            ...role,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        console.log(`   ✅ Created role: ${role.name}`);
      } else {
        console.log(`   ℹ️ Role already exists: ${role.name}`);
      }
    }

    console.log("✅ Canonical roles ensured");
  },

  async down(queryInterface, Sequelize) {
    console.log("↩️ Removing canonical system roles (if safe)...");

    // Only remove if no users reference them
    const roleNames = ["superadmin", "owner", "warden", "student"];

    for (const name of roleNames) {
      const [role] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE name = :name LIMIT 1`,
        {
          replacements: { name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (role) {
        const [usageCheck] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM Users WHERE role_id = :roleId`,
          {
            replacements: { roleId: role.id },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );

        if (usageCheck.count === 0) {
          await queryInterface.sequelize.query(
            `DELETE FROM Roles WHERE id = :roleId`,
            {
              replacements: { roleId: role.id },
              type: queryInterface.sequelize.QueryTypes.DELETE,
            }
          );
          console.log(`   ✅ Removed role: ${name}`);
        } else {
          console.log(
            `   ⚠️ Role ${name} still in use (${usageCheck.count} users), skipping removal`
          );
        }
      }
    }
  },
};
