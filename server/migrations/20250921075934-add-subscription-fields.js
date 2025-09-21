"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 🏨 Add subscription fields to hostels table
    await queryInterface.addColumn("hostels", "stripe_customer_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("hostels", "stripe_subscription_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("hostels", "subscription_status", {
      type: Sequelize.ENUM(
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "trialing"
      ),
      defaultValue: "trialing",
    });

    await queryInterface.addColumn("hostels", "current_period_start", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("hostels", "current_period_end", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("hostels", "trial_end", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("hostels", "plan_id", {
      type: Sequelize.STRING(50),
      defaultValue: "basic",
    });

    // 📦 Create subscription_plans table
    await queryInterface.createTable("subscription_plans", {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      price_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      max_students: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_staff: {
        type: Sequelize.INTEGER, // ✅ replaced max_wardens
        allowNull: true,
      },
      max_rooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      stripe_price_id_monthly: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stripe_price_id_yearly: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // 🔄 Rollback changes

    await queryInterface.removeColumn("hostels", "stripe_customer_id");
    await queryInterface.removeColumn("hostels", "stripe_subscription_id");
    await queryInterface.removeColumn("hostels", "subscription_status");
    await queryInterface.removeColumn("hostels", "current_period_start");
    await queryInterface.removeColumn("hostels", "current_period_end");
    await queryInterface.removeColumn("hostels", "trial_end");
    await queryInterface.removeColumn("hostels", "plan_id");

    await queryInterface.dropTable("subscription_plans");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_hostels_subscription_status";'
    );
  },
};
