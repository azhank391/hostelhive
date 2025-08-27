"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if ownerId column already exists before adding it
    const tableInfo = await queryInterface.describeTable("Hostels");

    if (!tableInfo.ownerId) {
      // 1. Add ownerId to Hostels table only if it doesn't exist
      await queryInterface.addColumn("Hostels", "ownerId", {
        type: Sequelize.UUID,
        allowNull: true, // Can be null initially, will be updated later
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "SET NULL",
      });
    }

    // 2. Update User role enum to include 'owner' and remove 'admin'
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("owner", "student", "warden"),
      allowNull: false,
    });

    // 3. Make User.hostelId nullable for owners who can manage multiple hostels
    await queryInterface.changeColumn("Users", "hostelId", {
      type: Sequelize.UUID,
      allowNull: true, // Allow null for owners
      references: {
        model: "Hostels",
        key: "id",
        onDelete: "CASCADE",
      },
    });

    // 4. Update any existing 'admin' roles to 'owner'
    await queryInterface.sequelize.query(
      "UPDATE Users SET role = 'owner' WHERE role = 'admin'"
    );
  },

  async down(queryInterface, Sequelize) {
    // Reverse the changes
    // 1. Remove ownerId from Hostels only if it exists
    const tableInfo = await queryInterface.describeTable("Hostels");
    if (tableInfo.ownerId) {
      await queryInterface.removeColumn("Hostels", "ownerId");
    }

    // 2. Revert User role enum
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("admin", "student", "warden"),
      allowNull: false,
    });

    // 3. Make User.hostelId non-nullable again
    await queryInterface.changeColumn("Users", "hostelId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Hostels",
        key: "id",
        onDelete: "CASCADE",
      },
    });

    // 4. Update 'owner' roles back to 'admin'
    await queryInterface.sequelize.query(
      "UPDATE Users SET role = 'admin' WHERE role = 'owner'"
    );
  },
};
