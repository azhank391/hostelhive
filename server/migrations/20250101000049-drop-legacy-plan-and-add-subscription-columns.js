"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Normalize table name casing if needed
    const tableName = (await queryInterface
      .describeTable("hostels")
      .catch(() => null))
      ? "hostels"
      : "Hostels";

    // 1) Add subscription fields if they don't exist (idempotent-ish pattern)
    const desc = await queryInterface.describeTable(tableName);

    const ensureColumn = async (name, spec) => {
      if (!desc[name]) {
        await queryInterface.addColumn(tableName, name, spec);
      }
    };

    await ensureColumn("stripe_customer_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await ensureColumn("stripe_subscription_id", {
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
        allowNull: true,
        defaultValue: "trialing",
      });
    }
    await ensureColumn("current_period_start", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await ensureColumn("current_period_end", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await ensureColumn("trial_end", { type: Sequelize.DATE, allowNull: true });
    await ensureColumn("plan_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: "basic",
    });

    // 2) Drop legacy columns if present
    if (desc["plan"]) {
      await queryInterface.removeColumn(tableName, "plan");
      // Clean up enum type in Postgres-like DBs
      if (queryInterface.sequelize.getDialect() === "postgres") {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_' + tableName + '_plan";'
        );
      }
    }

    if (desc["isPaid"]) {
      // Keep isPaid if still used; comment out to drop
      // await queryInterface.removeColumn(tableName, 'isPaid');
    }

    // 3) Helpful indexes
    try {
      await queryInterface.addIndex(tableName, ["stripe_customer_id"]);
    } catch {}
    try {
      await queryInterface.addIndex(tableName, ["stripe_subscription_id"]);
    } catch {}
    try {
      await queryInterface.addIndex(tableName, ["subscription_status"]);
    } catch {}
  },

  async down(queryInterface, Sequelize) {
    const tableName = (await queryInterface
      .describeTable("hostels")
      .catch(() => null))
      ? "hostels"
      : "Hostels";

    // Recreate legacy plan enum/column
    await queryInterface.addColumn(tableName, "plan", {
      type: Sequelize.ENUM("free", "pro", "enterprise"),
      allowNull: true,
    });

    // Remove subscription-related columns
    const dropIfExists = async (name) => {
      try {
        await queryInterface.removeColumn(tableName, name);
      } catch {}
    };

    await dropIfExists("stripe_customer_id");
    await dropIfExists("stripe_subscription_id");
    await dropIfExists("subscription_status");
    await dropIfExists("current_period_start");
    await dropIfExists("current_period_end");
    await dropIfExists("trial_end");
    await dropIfExists("plan_id");

    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_' + tableName + '_subscription_status";'
      );
    }
  },
};
