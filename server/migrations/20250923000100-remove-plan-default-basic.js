"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop default 'basic' from plan_id; keep as nullable string
    await queryInterface.changeColumn("hostels", "plan_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore previous default if needed
    await queryInterface.changeColumn("hostels", "plan_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: "basic",
    });
  },
};
