'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🌱 Starting superadmin seeder...');
      
      // Check if superadmin already exists
      const existingSuperadmin = await queryInterface.sequelize.query(
        'SELECT id FROM Superadmins WHERE email = :email',
        {
          replacements: { email: 'admin@hostelhive.com' },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existingSuperadmin.length > 0) {
        console.log('⚠️  Superadmin already exists, skipping...');
        return;
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Create superadmin data
      const superadminData = {
        id: Sequelize.literal('UUID()'), // Generate UUID
        name: 'System Administrator',
        email: 'admin@hostelhive.com',
        password: hashedPassword,
        role: 'superadmin',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert superadmin
      await queryInterface.bulkInsert('Superadmins', [superadminData]);
      
      console.log('✅ Superadmin seeded successfully!');
      console.log('📧 Email: admin@hostelhive.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
      
    } catch (error) {
      console.error('❌ Error seeding superadmin:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🗑️  Removing superadmin...');
      
      // Remove the seeded superadmin
      await queryInterface.bulkDelete('Superadmins', {
        email: 'admin@hostelhive.com'
      });
      
      console.log('✅ Superadmin removed successfully!');
      
    } catch (error) {
      console.error('❌ Error removing superadmin:', error);
      throw error;
    }
  }
};
