"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PermissionDependency extends Model {
    static associate(models) {
      // 🧩 PermissionDependency belongs to a Permission (parent)
      PermissionDependency.belongsTo(models.Permission, {
        foreignKey: "parentPermissionId",
        as: "parentPermission",
        onDelete: "CASCADE",
      });

      // 🧩 PermissionDependency belongs to a Permission (required)
      PermissionDependency.belongsTo(models.Permission, {
        foreignKey: "requiredPermissionId",
        as: "requiredPermission",
        onDelete: "CASCADE",
      });
    }
  }

  PermissionDependency.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentPermissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "parent_permission_id",
        comment: "The permission that requires other permissions",
      },
      requiredPermissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "required_permission_id",
        comment: "The permission that is required by the parent",
      },
      isAutomatic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_automatic",
        comment: "Whether this dependency is automatically assigned",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        comment: "When this dependency was created",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        comment: "When this dependency was last updated",
      },
    },
    {
      sequelize,
      modelName: "PermissionDependency",
      tableName: "PermissionDependencies",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["parentPermissionId", "requiredPermissionId"],
          name: "unique_permission_dependency",
        },
        {
          fields: ["parentPermissionId"],
          name: "idx_permission_dependencies_parent",
        },
        {
          fields: ["requiredPermissionId"],
          name: "idx_permission_dependencies_required",
        },
        {
          fields: ["isAutomatic"],
          name: "idx_permission_dependencies_automatic",
        },
      ],
    }
  );

  return PermissionDependency;
};

