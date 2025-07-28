const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('escrowx_dev', 'postgres', 'ayush19$', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function addColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Add new columns
    await sequelize.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS "buyerName" VARCHAR(255) NOT NULL DEFAULT 'Unknown Buyer',
      ADD COLUMN IF NOT EXISTS "platform" VARCHAR(255) NOT NULL DEFAULT 'Other',
      ADD COLUMN IF NOT EXISTS "productLink" VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "country" VARCHAR(255) NOT NULL DEFAULT 'Other',
      ADD COLUMN IF NOT EXISTS "currency" VARCHAR(255) NOT NULL DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "sellerContact" VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "escrowLink" VARCHAR(255) NOT NULL DEFAULT '';
    `);

    console.log('✅ New columns added successfully!');
    
    // Mark migrations as completed
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) VALUES 
      ('20250728095000-add-disputeid-to-orders.js'),
      ('20250728122656-add-new-order-fields.js')
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('✅ Migrations marked as completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addColumns(); 