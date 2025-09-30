"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Add resolution column if it doesn't exist
      await queryInterface.addColumn("Complaints", "resolution", {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Main resolution text when complaint is resolved'
      });
      console.log('Resolution column added successfully');
    } catch (error) {
      console.log('Resolution column already exists or error:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove the resolution column
      await queryInterface.removeColumn("Complaints", "resolution");
      console.log('Resolution column removed successfully');
    } catch (error) {
      console.log('Error removing resolution column:', error.message);
    }
  },
};
