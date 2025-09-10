"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // 🧩 Role belongs to a Hostel (for custom roles)
      Role.belongsTo(models.Hostel, {
        foreignKey: "hostelId",
        as: "hostel",
        onDelete: "CASCADE",
      });

      // 🧩 Role belongs to a User (creator)
      Role.belongsTo(models.User, {
        foreignKey: "createdBy",
        as: "creator",
        onDelete: "SET NULL",
      });

      // 🧩 Role has many Users (through role_id)
      Role.hasMany(models.User, {
        foreignKey: "roleId",
        as: "users",
        onDelete: "SET NULL",
      });

      // 🧩 Role has many Permissions (many-to-many)
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        foreignKey: "roleId",
        otherKey: "permissionId",
        as: "permissions",
        onDelete: "CASCADE",
      });
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Role name: owner, student, custom_warden, etc.",
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "display_name",
        comment: "Human-readable role name: Hostel Owner, Student, Warden",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Role description and purpose",
      },
      isSystemRole: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_system_role",
        comment: "TRUE for system roles (owner/student), FALSE for custom roles",
      },
      hostelId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "hostel_id",
        comment: "NULL for system roles, hostel_id for custom roles",
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "created_by",
        comment: "User who created this role (only for custom roles)",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        comment: "When this role was created",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        comment: "When this role was last updated",
      },
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "Roles",
      indexes: [
        {
          unique: true,
          fields: ["name", "hostelId"],
          name: "unique_custom_role",
        },
        {
          fields: ["isSystemRole"],
          name: "idx_roles_is_system_role",
        },
        {
          fields: ["hostelId"],
          name: "idx_roles_hostel_id",
        },
        {
          fields: ["createdBy"],
          name: "idx_roles_created_by",
        },
        {
          fields: ["isSystemRole", "hostelId"],
          name: "idx_roles_system_hostel",
        },
      ],
    }
  );

  return Role;
};

