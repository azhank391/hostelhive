"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🏗️ Inserting canonical roles with fixed UUIDs...");

    const roles = [
      {
        id: "02bc31c5-3872-44e4-bd27-c95c1dc6325e",
        name: "student",
        display_name: "Student",
        description: "Basic student access for viewing personal information and creating complaints",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date("2025-09-15T17:27:37Z"),
        updated_at: new Date("2025-09-15T17:27:37Z"),
      },
      {
        id: "3d4b3972-73c2-4c8f-a314-f5739d5d7089",
        name: "custom_maintinance_manager",
        display_name: "Maintinance Manager",
        description: "Maintain any complaints related to the hostel.",
        is_system_role: false,
        hostel_id: "49ee1c0b-8073-4c44-a503-ab1949df394a",
        created_by: "db336c4c-e65b-4d64-afde-69069520e589",
        created_at: new Date("2025-09-13T19:36:49Z"),
        updated_at: new Date("2025-09-13T19:36:49Z"),
      },
      {
        id: "5c7b5e6a-56a9-45e3-8d9c-1469397611ba",
        name: "superadmin",
        display_name: "Super Admin",
        description: "System-wide administrative access across all hostels",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date("2025-09-15T17:27:37Z"),
        updated_at: new Date("2025-09-15T17:27:37Z"),
      },
      {
        id: "982161d2-9426-417e-99ba-57501864838b",
        name: "warden",
        display_name: "Warden",
        description: "Hostel management permissions for wardens (rooms, students, complaints)",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date("2025-09-15T17:27:37Z"),
        updated_at: new Date("2025-09-15T17:27:37Z"),
      },
      {
        id: "ea634e91-ff38-4983-919d-6445e5a00047",
        name: "owner",
        display_name: "Owner",
        description: "Full hostel management access with financial and administrative control",
        is_system_role: true,
        hostel_id: null,
        created_by: null,
        created_at: new Date("2025-09-15T17:27:37Z"),
        updated_at: new Date("2025-09-15T17:27:37Z"),
      },
    ];

    // Insert roles with ON DUPLICATE KEY UPDATE to avoid duplicates
    for (const role of roles) {
      await queryInterface.sequelize.query(
        `INSERT INTO Roles (id, name, display_name, description, is_system_role, hostel_id, created_by, created_at, updated_at)
         VALUES (:id, :name, :display_name, :description, :is_system_role, :hostel_id, :created_by, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           display_name = VALUES(display_name),
           description = VALUES(description)`,
        {
          replacements: role,
          type: queryInterface.sequelize.QueryTypes.INSERT
        }
      );
    }

    console.log("✅ Canonical roles inserted successfully!");
  },

  async down(queryInterface, Sequelize) {
    console.log("🗑️ Removing canonical roles...");
    
    const ids = [
      "02bc31c5-3872-44e4-bd27-c95c1dc6325e",
      "3d4b3972-73c2-4c8f-a314-f5739d5d7089",
      "5c7b5e6a-56a9-45e3-8d9c-1469397611ba",
      "982161d2-9426-417e-99ba-57501864838b",
      "ea634e91-ff38-4983-919d-6445e5a00047",
    ];
    
    await queryInterface.bulkDelete("Roles", { id: ids });
    console.log("✅ Canonical roles removed successfully!");
  },
};