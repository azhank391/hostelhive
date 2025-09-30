"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "🔄 Updating existing users with role_id based on legacy role strings..."
    );

    // Map legacy role strings to canonical role names
    const roleMap = {
      owner: "owner",
      student: "student",
      warden: "warden",
      superadmin: "superadmin",
    };

    // Get all system roles that were just created
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM Roles WHERE is_system_role = true`
    );

    const roleIdByName = {};
    for (const role of roles) {
      roleIdByName[role.name] = role.id;
    }

    console.log("📊 Found roles:", Object.keys(roleIdByName));

    // Update users for each role mapping
    let totalUpdated = 0;

    for (const [legacyRole, canonicalRole] of Object.entries(roleMap)) {
      const roleId = roleIdByName[canonicalRole];

      if (roleId) {
        const [results] = await queryInterface.sequelize.query(
          `UPDATE Users 
           SET role_id = :roleId 
           WHERE role = :legacyRole 
           AND (role_id IS NULL OR role_id = '')`,
          {
            replacements: { roleId, legacyRole },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
          }
        );

        const updatedCount = results || 0;
        totalUpdated += updatedCount;
        console.log(
          `   - Updated ${updatedCount} users with role '${legacyRole}' to role_id '${roleId}'`
        );
      } else {
        console.log(
          `   - ⚠️ Role '${canonicalRole}' not found, skipping '${legacyRole}' updates`
        );
      }
    }

    // Handle custom roles (non-system roles) - they might already have role_id set
    const [customRoleResults] = await queryInterface.sequelize.query(
      `UPDATE Users 
       SET role_id = (
         SELECT r.id 
         FROM Roles r 
         WHERE r.name = Users.role 
         AND r.is_system_role = false
       )
       WHERE Users.role_id IS NULL 
       AND EXISTS (
         SELECT 1 FROM Roles r 
         WHERE r.name = Users.role 
         AND r.is_system_role = false
       )`,
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );

    const customUpdated = customRoleResults || 0;
    totalUpdated += customUpdated;
    console.log(`   - Updated ${customUpdated} users with custom roles`);

    console.log(
      `✅ Legacy user migration completed! Total users updated: ${totalUpdated}`
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Reverting role_id assignments for legacy users...");

    await queryInterface.sequelize.query(
      `UPDATE Users SET role_id = NULL WHERE role_id IS NOT NULL`,
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );

    console.log("✅ All role_id assignments reverted successfully!");
  },
};
