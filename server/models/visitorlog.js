'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VisitorLog extends Model {
    static associate(models) {
      // 🧩 VisitorLog belongs to a Hostel
      VisitorLog.belongsTo(models.Hostel, {
        foreignKey: 'hostelId',
        as: 'hostel',
        onDelete: 'CASCADE'
      });

      // 🧩 VisitorLog belongs to a User (the student)
      VisitorLog.belongsTo(models.User, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE'
      });
    }
  }

  VisitorLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostelId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    visitorName: DataTypes.STRING,
    relation: DataTypes.STRING,
    checkIn: DataTypes.DATE,
    checkOut: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'VisitorLog',
  });

  return VisitorLog;
};
