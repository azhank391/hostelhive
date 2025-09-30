"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "phone", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Optional phone number for users'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "phone");
  },
};
