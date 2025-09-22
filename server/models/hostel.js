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
      isActive: DataTypes.BOOLEAN,
      isPaid: DataTypes.BOOLEAN,
      // Stripe subscription fields
      stripe_customer_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripe_subscription_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Use STRING to avoid enum mismatch across environments
      subscription_status: {
        type: DataTypes.STRING(20), // e.g., active, trialing, past_due, unpaid, canceled
        allowNull: true,
      },
      current_period_start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      current_period_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trial_end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Logical plan identifier in our system (basic, pro, etc.)
      plan_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
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
        {
          fields: ["stripe_customer_id"],
        },
        {
          fields: ["stripe_subscription_id"],
        },
        {
          fields: ["subscription_status"],
        },
      ],
    }
  );

  return Hostel;
};
