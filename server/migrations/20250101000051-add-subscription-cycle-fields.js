"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "Hostels";
    const desc = await queryInterface.describeTable(table);

      if (!desc["canceled_at"]) {
      await queryInterface.addColumn(table, "canceled_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!desc["cancel_at_period_end"]) {
      await queryInterface.addColumn(table, "cancel_at_period_end", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!desc["billing_cycle_anchor"]) {
      await queryInterface.addColumn(table, "billing_cycle_anchor", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = "Hostels";
    const dropIfExists = async (name) => {
      try { await queryInterface.removeColumn(table, name); } catch {}
    };
      await dropIfExists("canceled_at");
    await dropIfExists("cancel_at_period_end");
    await dropIfExists("billing_cycle_anchor");
  },
};
