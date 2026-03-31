require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('./backend/config/config.json');

async function runMigration() {
  const sequelize = new Sequelize(config.development);
  try {
    await sequelize.query(`
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "ruleFlags" JSONB;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "aiAnalysis" JSONB;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "evidenceResponses" JSONB DEFAULT '{}';
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "autoFlaggedAt" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE disputes ADD COLUMN IF NOT EXISTS "analyzedWordCount" INTEGER;
    `);
    console.log('✅ Migration complete — dispute AI columns added');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
  } finally {
    await sequelize.close();
  }
}

runMigration();
