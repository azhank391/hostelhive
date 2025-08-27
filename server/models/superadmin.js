'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Superadmin extends Model {
    static associate(models) {
      // No associations — global control over tenants
    }
  }

  Superadmin.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    role: DataTypes.ENUM('superadmin')
  }, {
    sequelize,
    modelName: 'Superadmin',
  });

  return Superadmin;
};
