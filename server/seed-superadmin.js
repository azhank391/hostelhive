const bcrypt = require('bcrypt');
const { sequelize } = require('./models');

async function seedSuperadmin() {
  try {
    console.log('🌱 Starting manual superadmin seeder...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if superadmin already exists
    const [existingSuperadmin] = await sequelize.query(
      'SELECT id FROM Superadmins WHERE email = ?',
      {
        replacements: ['admin@hostelhive.com'],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingSuperadmin && existingSuperadmin.length > 0) {
      console.log('⚠️  Superadmin already exists, skipping...');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Create superadmin data
    const superadminData = {
      id: require('crypto').randomUUID(), // Generate UUID
      name: 'System Administrator',
      email: 'admin@hostelhive.com',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert superadmin
    await sequelize.query(
      'INSERT INTO Superadmins (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: [
          superadminData.id,
          superadminData.name,
          superadminData.email,
          superadminData.password,
          superadminData.role,
          superadminData.createdAt,
          superadminData.updatedAt
        ]
      }
    );
    
    console.log('✅ Superadmin seeded successfully!');
    console.log('📧 Email: admin@hostelhive.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', superadminData.id);
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedSuperadmin();
}

module.exports = seedSuperadmin;
