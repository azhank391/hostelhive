'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RoomAllocation extends Model {
    static associate(models) {
      // 🧩 Allocation belongs to a Hostel
      RoomAllocation.belongsTo(models.Hostel, {
        foreignKey: 'hostelId',
        as: 'hostel',
        onDelete: 'CASCADE'
      });

      // 🧩 Allocation belongs to a User
      RoomAllocation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });

      // 🧩 Allocation belongs to a Room
      RoomAllocation.belongsTo(models.Room, {
        foreignKey: 'roomId',
        as: 'room',
        onDelete: 'CASCADE'
      });
    }
  }

  RoomAllocation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostelId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    roomId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    allocationDate: DataTypes.DATE,
    status: DataTypes.ENUM('active', 'left')
  }, {
    sequelize,
    modelName: 'RoomAllocation',
  });

  return RoomAllocation;
};
