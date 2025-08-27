const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hostelhive',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully');
    
    // Check Users table structure
    const [results] = await sequelize.query('DESCRIBE Users;');
    console.log('\n📋 Users table structure:');
    
    results.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // Check for any warden_status related fields
    const wardenFields = results.filter(row => 
      row.Field.toLowerCase().includes('warden') || 
      row.Field.toLowerCase().includes('status')
    );
    
    if (wardenFields.length > 0) {
      console.log('\n⚠️  Found fields that might be warden_status related:');
      wardenFields.forEach(field => {
        console.log(`    - ${field.Field}: ${field.Type}`);
      });
      console.log('\n💡 You may want to manually remove these fields if they\'re not needed');
    } else {
      console.log('\n✅ No warden_status related fields found');
    }
    
    // Check if phone field already exists
    const phoneField = results.find(row => row.Field === 'phone');
    if (phoneField) {
      console.log('\n✅ Phone field already exists:', phoneField.Type);
    } else {
      console.log('\n❌ Phone field does not exist - ready for migration!');
    }
    
    console.log('\n🎯 Ready to run migration: npm run migrate');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
