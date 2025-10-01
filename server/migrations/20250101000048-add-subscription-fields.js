"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "Hostels";
    
    // Get current table structure
    const desc = await queryInterface.describeTable(tableName);
    
    // Helper to add column only if it doesn't exist
    const addColumnIfNotExists = async (name, spec) => {
      if (!desc[name]) {
        await queryInterface.addColumn(tableName, name, spec);
        console.log(`   ✅ Added column: ${name}`);
      } else {
        console.log(`   ℹ️ Column already exists: ${name}`);
      }
    };

    // 🏨 Add subscription fields to Hostels table (idempotent)
    await addColumnIfNotExists("stripe_customer_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addColumnIfNotExists("stripe_subscription_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    if (!desc["subscription_status"]) {
      await queryInterface.addColumn(tableName, "subscription_status", {
        type: Sequelize.ENUM(
          "active",
          "canceled",
          "past_due",
          "unpaid",
          "trialing"
        ),
        defaultValue: "trialing",
      });
      console.log(`   ✅ Added column: subscription_status`);
    } else {
      console.log(`   ℹ️ Column already exists: subscription_status`);
    }

    await addColumnIfNotExists("current_period_start", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await addColumnIfNotExists("current_period_end", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await addColumnIfNotExists("trial_end", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await addColumnIfNotExists("plan_id", {
      type: Sequelize.STRING(50),
      defaultValue: "basic",
    });

    // 📦 Create subscription_plans table (idempotent)
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("subscription_plans")) {
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
          type: Sequelize.INTEGER,
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
      console.log(`   ✅ Created table: subscription_plans`);
    } else {
      console.log(`   ℹ️ Table already exists: subscription_plans`);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = "Hostels";
    
    // Helper to safely remove columns
    const removeColumnSafe = async (name) => {
      try {
        const desc = await queryInterface.describeTable(tableName);
        if (desc[name]) {
          await queryInterface.removeColumn(tableName, name);
        }
      } catch (e) {
        // Table or column doesn't exist, skip
      }
    };

    // 🔄 Rollback changes
    await removeColumnSafe("stripe_customer_id");
    await removeColumnSafe("stripe_subscription_id");
    await removeColumnSafe("subscription_status");
    await removeColumnSafe("current_period_start");
    await removeColumnSafe("current_period_end");
    await removeColumnSafe("trial_end");
    await removeColumnSafe("plan_id");

    try {
      const tables = await queryInterface.showAllTables();
      if (tables.includes("subscription_plans")) {
        await queryInterface.dropTable("subscription_plans");
      }
    } catch (e) {
      // Ignore if table doesn't exist
    }

    try {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Hostels_subscription_status";'
      );
    } catch (e) {
      // Ignore if enum doesn't exist
    }
  },
};
