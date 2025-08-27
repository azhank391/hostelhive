'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    static associate(models) {
      // 🧩 Complaint belongs to a User
      Complaint.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });

      // 🧩 Complaint belongs to a Hostel
      Complaint.belongsTo(models.Hostel, {
        foreignKey: 'hostelId',
        as: 'hostel',
        onDelete: 'CASCADE'
      });
    }
  }

  Complaint.init({
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
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.ENUM('pending', 'resolved')
  }, {
    sequelize,
    modelName: 'Complaint',
  });

  return Complaint;
};
