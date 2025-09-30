"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("RoomAllocations", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      hostelId: {
        type: Sequelize.UUID,
        references: {
          model: 'Hostels',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users', // Assuming you have a Users table
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      roomId: {
        type: Sequelize.UUID,
        references: {
          model: 'Rooms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      allocationDate: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('active', 'left'),
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
    await queryInterface.dropTable("RoomAllocations");
  },
};
