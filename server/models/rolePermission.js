"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      // 🧩 RolePermission belongs to a Role
      RolePermission.belongsTo(models.Role, {
        foreignKey: "roleId",
        as: "role",
        onDelete: "CASCADE",
      });

      // 🧩 RolePermission belongs to a Permission
      RolePermission.belongsTo(models.Permission, {
        foreignKey: "permissionId",
        as: "permission",
        onDelete: "CASCADE",
      });
    }
  }

  RolePermission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "role_id",
        comment: "Reference to the role",
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "permission_id",
        comment: "Reference to the permission",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        comment: "When this role-permission mapping was created",
      },
    },
    {
      sequelize,
      modelName: "RolePermission",
      tableName: "rolepermissions", // match actual MySQL table name (all lowercase)
      timestamps: true, // Has created_at column
      createdAt: "created_at",
      updatedAt: false, // No updated_at column
      indexes: [
        {
          unique: true,
          fields: ["roleId", "permissionId"],
          name: "unique_role_permission",
        },
        {
          fields: ["roleId"],
          name: "idx_role_permissions_role_id",
        },
        {
          fields: ["permissionId"],
          name: "idx_role_permissions_permission_id",
        },
      ],
    }
  );

  return RolePermission;
};
