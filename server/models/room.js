'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      // 🧩 Room belongs to a Hostel
      Room.belongsTo(models.Hostel, {
        foreignKey: 'hostelId',
        as: 'hostel',
        onDelete: 'CASCADE'
      });

      // 🧩 Room has many Room Allocations
      Room.hasMany(models.RoomAllocation, {
        foreignKey: 'roomId',
        as: 'allocations',
        onDelete: 'CASCADE'  // Only applies when room is DELETED, not when UPDATED
      });
    }
  }

  Room.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostelId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    roomNumber: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    occupied: DataTypes.INTEGER,
    block: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Room',
  });

  return Room;
};
