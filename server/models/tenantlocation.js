'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TenantLocation extends Model {
    static associate(models) {
      // 🧩 Each TenantLocation belongs to a Hostel
      TenantLocation.belongsTo(models.Hostel, {
        foreignKey: 'hostelId',
        as: 'hostel',
        onDelete: 'CASCADE'
      });
    }
  }

  TenantLocation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    hostelId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    address: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TenantLocation',
  });

  return TenantLocation;
};
