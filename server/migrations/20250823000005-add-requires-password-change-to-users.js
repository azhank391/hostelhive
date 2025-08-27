"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Add requiresPasswordChange field to Users table
      await queryInterface.addColumn('Users', 'requiresPasswordChange', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the user needs to change their password on next login (only for students/wardens)'
      });
      
      // Set requiresPasswordChange to true for existing students and wardens
      // This ensures they get prompted to change their passwords
      await queryInterface.sequelize.query(`
        UPDATE Users 
        SET requiresPasswordChange = true 
        WHERE role IN ('student', 'warden')
      `);
      
      console.log('✅ Successfully added requiresPasswordChange field to Users table');
      console.log('✅ Set requiresPasswordChange to true for existing students and wardens');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove requiresPasswordChange field from Users table
      await queryInterface.removeColumn('Users', 'requiresPasswordChange');
      
      console.log('✅ Successfully removed requiresPasswordChange field from Users table');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
