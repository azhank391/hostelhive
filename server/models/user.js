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

      // 🧩 RBAC: User belongs to a Role (new RBAC system)
      User.belongsTo(models.Role, {
        foreignKey: "roleId",
        as: "rbacRole",
        onDelete: "SET NULL",
      });

      // 🧩 RBAC: User can create many Roles (for owners creating custom roles)
      User.hasMany(models.Role, {
        foreignKey: "createdBy",
        as: "createdRoles",
        onDelete: "SET NULL",
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
      role: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Role name: can be system roles (owner, student, warden, superadmin) or custom role names'
      },
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
      },
      // 🧩 RBAC: New role system (keeps existing 'role' column for backward compatibility)
      roleId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "role_id",
        comment: "Reference to the new RBAC role system",
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
        // 🧩 RBAC: New indexes for role system
        {
          fields: ["roleId"],
          name: "idx_users_role_id",
        },
        {
          fields: ["roleId", "hostelId"],
          name: "idx_users_role_hostel",
        },
        {
          fields: ["role", "roleId"],
          name: "idx_users_legacy_new_role",
        },
      ],
    }
  );

  return User;
};
