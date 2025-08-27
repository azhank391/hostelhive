"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hostel extends Model {
    static associate(models) {
      // A Hostel belongs to an Owner (User)
      Hostel.belongsTo(models.User, {
        foreignKey: "ownerId",
        as: "owner",
        onDelete: "SET NULL",
      });

      // A Hostel has many Users
      Hostel.hasMany(models.User, {
        foreignKey: "hostelId",
        as: "users",
        onDelete: "CASCADE",
      });

      Hostel.hasMany(models.Room, {
        foreignKey: "hostelId",
        as: "rooms",
        onDelete: "CASCADE",
      });

      Hostel.hasMany(models.RoomAllocation, {
        foreignKey: "hostelId",
        as: "allocations",
        onDelete: "CASCADE",
      });

      Hostel.hasMany(models.Complaint, {
        foreignKey: "hostelId",
        as: "complaints",
        onDelete: "CASCADE",
      });

      Hostel.hasMany(models.VisitorLog, {
        foreignKey: "hostelId",
        as: "visitorLogs",
        onDelete: "CASCADE",
      });

      Hostel.hasOne(models.TenantLocation, {
        foreignKey: "hostelId",
        as: "location",
        onDelete: "CASCADE",
      });
    }
  }

  Hostel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null initially
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      subdomain: DataTypes.STRING,
      plan: DataTypes.ENUM("free", "pro", "enterprise"),
      isActive: DataTypes.BOOLEAN,
      isPaid: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Hostel",
      indexes: [
        {
          unique: true,
          fields: ["subdomain"],
        },
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["ownerId"],
        },
        {
          fields: ["isActive"],
        },
      ],
    }
  );

  return Hostel;
};
