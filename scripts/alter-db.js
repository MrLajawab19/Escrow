const db = require('../backend/models/index');

async function alterDatabase() {
  try {
    console.log('Synchronizing database schema (alter: true)...');
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database schema updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update database schema:', error);
    process.exit(1);
  }
}

alterDatabase();
