"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("VisitorLogs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      hostelId: {
        type: Sequelize.UUID,
        references: {
          model: 'Hostels', // Assuming you have a Hostels table
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      studentId: {
        type: Sequelize.UUID,
      },
      visitorName: {
        type: Sequelize.STRING,
      },
      relation: {
        type: Sequelize.STRING,
      },
      checkIn: {
        type: Sequelize.DATE,
      },
      checkOut: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("VisitorLogs");
  },
};
