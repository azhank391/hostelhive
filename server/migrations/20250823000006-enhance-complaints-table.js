"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Add priority column if it doesn't exist
      await queryInterface.addColumn("Complaints", "priority", {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        allowNull: false,
      });
    } catch (error) {
      console.log('Priority column already exists or error:', error.message);
    }

    try {
      // Add resolutionNotes column if it doesn't exist
      await queryInterface.addColumn("Complaints", "resolutionNotes", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      console.log('ResolutionNotes column already exists or error:', error.message);
    }

    try {
      // Add resolvedAt column if it doesn't exist
      await queryInterface.addColumn("Complaints", "resolvedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    } catch (error) {
      console.log('ResolvedAt column already exists or error:', error.message);
    }

    try {
      // Update the status enum to include new values
      await queryInterface.changeColumn("Complaints", "status", {
        type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      });
    } catch (error) {
      console.log('Status enum update error:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove the new columns
      await queryInterface.removeColumn("Complaints", "priority");
    } catch (error) {
      console.log('Error removing priority column:', error.message);
    }

    try {
      await queryInterface.removeColumn("Complaints", "resolutionNotes");
    } catch (error) {
      console.log('Error removing resolutionNotes column:', error.message);
    }

    try {
      await queryInterface.removeColumn("Complaints", "resolvedAt");
    } catch (error) {
      console.log('Error removing resolvedAt column:', error.message);
    }

    try {
      // Revert status enum to original values
      await queryInterface.changeColumn("Complaints", "status", {
        type: Sequelize.ENUM('pending', 'resolved'),
        defaultValue: 'pending',
        allowNull: false,
      });
    } catch (error) {
      console.log('Error reverting status enum:', error.message);
    }
  },
};
