"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // 🧩 Permission belongs to many Roles (many-to-many)
      Permission.belongsToMany(models.Role, {
        through: models.RolePermission,
        foreignKey: "permissionId",
        otherKey: "roleId",
        as: "roles",
        onDelete: "CASCADE",
      });

      // 🧩 Permission dependencies (many-to-many self-referential)
      Permission.belongsToMany(models.Permission, {
        through: models.PermissionDependency,
        foreignKey: "parent_permission_id",
        otherKey: "required_permission_id",
        as: "requiredPermissions",
        onDelete: "CASCADE",
      });

      Permission.belongsToMany(models.Permission, {
        through: models.PermissionDependency,
        foreignKey: "required_permission_id",
        otherKey: "parent_permission_id",
        as: "parentPermissions",
        onDelete: "CASCADE",
      });
    }
  }

  Permission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Permission name: manage_rooms, view_students, handle_complaints",
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "display_name",
        comment: "Human-readable permission name: Manage Rooms, View Students",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Permission description and scope",
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Permission category: rooms, students, complaints, visitors, reports, roles",
      },
      operation: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "CRUD operation: create, read, update, delete",
      },
      isSystemPermission: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_system_permission",
        comment: "All permissions are predefined system permissions",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        comment: "When this permission was created",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        comment: "When this permission was last updated",
      },
    },
    {
      sequelize,
      modelName: "Permission",
      tableName: "Permissions",
      indexes: [
        {
          fields: ["category"],
          name: "idx_permissions_category",
        },
        {
          fields: ["isSystemPermission"],
          name: "idx_permissions_is_system",
        },
        {
          fields: ["category", "isSystemPermission"],
          name: "idx_permissions_category_system",
        },
      ],
    }
  );

  return Permission;
};

