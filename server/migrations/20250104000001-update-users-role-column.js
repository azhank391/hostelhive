'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the role column from ENUM to VARCHAR to support custom role names
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: 'Role name: can be system roles (owner, student, warden, superadmin) or custom role names'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to ENUM (this might fail if there are custom role names in the data)
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM("owner", "student", "warden", "superadmin"),
      allowNull: false,
      comment: 'All legacy roles supported'
    });
  }
};
