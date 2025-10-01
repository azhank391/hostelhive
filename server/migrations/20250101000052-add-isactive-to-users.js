"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if isActive column already exists
      const tableDescription = await queryInterface.describeTable('Users');
      
      if (!tableDescription.isActive) {
        await queryInterface.addColumn('Users', 'isActive', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Whether the user account is active'
        });
        console.log('✅ Successfully added isActive column to Users table');
      } else {
        console.log('ℹ️  isActive column already exists in Users table');
      }
    } catch (error) {
      console.error('❌ Error adding isActive column:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('Users');
      
      if (tableDescription.isActive) {
        await queryInterface.removeColumn('Users', 'isActive');
        console.log('✅ Successfully removed isActive column from Users table');
      }
    } catch (error) {
      console.error('❌ Error removing isActive column:', error);
      throw error;
    }
  },
};
