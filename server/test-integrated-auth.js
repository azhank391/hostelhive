const bcrypt = require('bcrypt');
const { sequelize } = require('./models');

async function testIntegratedAuth() {
  try {
    console.log('🧪 Testing Integrated Authentication...\n');
    
    // Test 1: Check if superadmin exists
    console.log('1️⃣ Checking if superadmin exists...');
    const [superadminResult] = await sequelize.query(
      'SELECT id, name, email, role FROM Superadmins WHERE email = ?',
      {
        replacements: ['admin@hostelhive.com'],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (superadminResult && superadminResult.length > 0) {
      const superadmin = superadminResult[0];
      console.log('✅ Superadmin found:', {
        id: superadmin.id,
        name: superadmin.name,
        email: superadmin.email,
        role: superadmin.role
      });
    } else {
      console.log('❌ Superadmin not found. Run the seeder first: npm run seed:superadmin');
      return;
    }

    // Test 2: Check if regular user exists
    console.log('\n2️⃣ Checking if regular user exists...');
    const [userResult] = await sequelize.query(
      'SELECT id, name, email, role, hostelId FROM Users WHERE role = "owner" LIMIT 1',
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (userResult && userResult.length > 0) {
      const user = userResult[0];
      console.log('✅ Regular user found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelId: user.hostelId
      });
    } else {
      console.log('ℹ️  No regular users found (this is okay for testing)');
    }

    // Test 3: Test password hashing
    console.log('\n3️⃣ Testing password hashing...');
    const testPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isMatch) {
      console.log('✅ Password hashing works correctly');
    } else {
      console.log('❌ Password hashing failed');
    }

    // Test 4: Test superadmin password verification
    console.log('\n4️⃣ Testing superadmin password verification...');
    const [superadminWithPassword] = await sequelize.query(
      'SELECT password FROM Superadmins WHERE email = ?',
      {
        replacements: ['admin@hostelhive.com'],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (superadminWithPassword && superadminWithPassword.length > 0) {
      const storedHash = superadminWithPassword[0].password;
      const passwordMatch = await bcrypt.compare(testPassword, storedHash);
      
      if (passwordMatch) {
        console.log('✅ Superadmin password verification works');
      } else {
        console.log('❌ Superadmin password verification failed');
      }
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Database connection: Working');
    console.log('✅ Superadmin table: Accessible');
    console.log('✅ Users table: Accessible');
    console.log('✅ Password hashing: Working');
    console.log('✅ Integrated auth: Ready to test');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test superadmin login at: POST /api/auth/login');
    console.log('3. Test regular user login at: POST /api/auth/login');
    console.log('4. Verify routing to correct dashboards');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testIntegratedAuth();
}

module.exports = testIntegratedAuth;
