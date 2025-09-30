"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove global email unique constraint if it exists and add hostel-scoped constraint

    // 1. Remove existing global unique constraint on Users.email (if it exists)
    try {
      await queryInterface.removeIndex("Users", "users_email_key");
    } catch (error) {
      // Index might not exist, continue
      console.log("Global email unique constraint not found, continuing...");
    }

    // 2. Add composite unique constraint on (email, hostelId) to allow same email across different hostels
    await queryInterface.addConstraint("Users", {
      fields: ["email", "hostelId"],
      type: "unique",
      name: "users_email_hostel_id_unique",
    });

    // 3. Add unique constraint on Hostels.subdomain (if not already exists)
    try {
      await queryInterface.addConstraint("Hostels", {
        fields: ["subdomain"],
        type: "unique",
        name: "hostels_subdomain_unique",
      });
    } catch (error) {
      // Constraint might already exist from index migration
      console.log("Subdomain unique constraint already exists, continuing...");
    }

    // 4. Add unique constraint on Hostels.email for global hostel email uniqueness
    await queryInterface.addConstraint("Hostels", {
      fields: ["email"],
      type: "unique",
      name: "hostels_email_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the constraints
    await queryInterface.removeConstraint("Hostels", "hostels_email_unique");

    try {
      await queryInterface.removeConstraint(
        "Hostels",
        "hostels_subdomain_unique"
      );
    } catch (error) {
      console.log("Subdomain constraint removal skipped");
    }

    await queryInterface.removeConstraint(
      "Users",
      "users_email_hostel_id_unique"
    );

    // Restore global email unique constraint
    await queryInterface.addIndex("Users", ["email"], {
      unique: true,
      name: "users_email_key",
    });
  },
};
