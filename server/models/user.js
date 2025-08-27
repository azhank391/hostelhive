"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // 🧩 User belongs to a Hostel (for students and wardens)
      User.belongsTo(models.Hostel, {
        foreignKey: "hostelId",
        as: "hostel",
        onDelete: "CASCADE",
      });

      // 🧩 User can own many Hostels (for owners)
      User.hasMany(models.Hostel, {
        foreignKey: "ownerId",
        as: "ownedHostels",
        onDelete: "SET NULL",
      });

      // 🧩 User can file many Complaints
      User.hasMany(models.Complaint, {
        foreignKey: "userId",
        as: "complaints",
        onDelete: "CASCADE",
      });

      // 🧩 User can have many Room Allocations
      User.hasMany(models.RoomAllocation, {
        foreignKey: "userId",
        as: "allocations",
        onDelete: "CASCADE",
      });

      // 🧩 User (if student) can have many Visitor Logs
      User.hasMany(models.VisitorLog, {
        foreignKey: "studentId",
        as: "visitorLogs",
        onDelete: "CASCADE",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      hostelId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null for owners who can manage multiple hostels
      },
      name: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        // Note: Unique constraint is composite (email + hostelId) at database level
      },
      password: DataTypes.STRING,
      role: DataTypes.ENUM("owner", "student", "warden"), // Fixed: owner instead of admin
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional phone number for users'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the user account is active'
      },
      requiresPasswordChange: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the user needs to change their password on next login (only for students/wardens)'
      }
    },
    {
      sequelize,
      modelName: "User",
      indexes: [
        {
          fields: ["hostelId"],
        },
        {
          fields: ["role", "hostelId"],
        },
        {
          unique: true,
          fields: ["email", "hostelId"],
          name: "users_email_hostel_id_unique",
        },
      ],
    }
  );

  return User;
};
