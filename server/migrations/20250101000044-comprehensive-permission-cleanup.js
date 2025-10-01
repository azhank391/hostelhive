'use strict';

/**
 * This migration intentionally performs no destructive actions.
 * It exists to keep the sequence consistent and to unblock pipelines
 * that referenced a planned "comprehensive permission cleanup" step.
 *
 * If future cleanup is needed, implement it here with idempotent logic
 * and ensure it does not remove permissions still referenced by code.
 */

module.exports = {
	async up(queryInterface, Sequelize) {
		// No-op by design; logs for traceability
		console.log('✅ 20250101000044-comprehensive-permission-cleanup: no-op (safe)');
	},

	async down(queryInterface, Sequelize) {
		// No-op rollback
		console.log('↩️ 20250101000044-comprehensive-permission-cleanup (down): no-op');
	},
};

