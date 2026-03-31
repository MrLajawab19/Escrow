/**
 * Migration: Add missing columns to disputes table and fix enums.
 * Run once: node scripts/migrate-disputes.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');
const config = require(path.join(__dirname, '..', 'backend', 'config', 'config.json'));

const sequelize = new Sequelize(config.development);

async function migrate() {
  const qi = sequelize.getQueryInterface();

  try {
    console.log('Starting dispute table migration...');

    // ── Add missing JSONB columns ─────────────────────────────────────────────
    const cols = await qi.describeTable('disputes');

    if (!cols.ruleFlags) {
      await qi.addColumn('disputes', 'ruleFlags', { type: Sequelize.JSONB, allowNull: true });
      console.log('  ✅ Added: ruleFlags');
    } else { console.log('  ⏭  Skip: ruleFlags (exists)'); }

    if (!cols.aiAnalysis) {
      await qi.addColumn('disputes', 'aiAnalysis', { type: Sequelize.JSONB, allowNull: true });
      console.log('  ✅ Added: aiAnalysis');
    } else { console.log('  ⏭  Skip: aiAnalysis (exists)'); }

    if (!cols.evidenceResponses) {
      await qi.addColumn('disputes', 'evidenceResponses', { type: Sequelize.JSONB, allowNull: true, defaultValue: {} });
      console.log('  ✅ Added: evidenceResponses');
    } else { console.log('  ⏭  Skip: evidenceResponses (exists)'); }

    if (!cols.analyzedWordCount) {
      await qi.addColumn('disputes', 'analyzedWordCount', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 });
      console.log('  ✅ Added: analyzedWordCount');
    } else { console.log('  ⏭  Skip: analyzedWordCount (exists)'); }

    if (!cols.autoFlaggedAt) {
      await qi.addColumn('disputes', 'autoFlaggedAt', { type: Sequelize.DATE, allowNull: true });
      console.log('  ✅ Added: autoFlaggedAt');
    } else { console.log('  ⏭  Skip: autoFlaggedAt (exists)'); }

    if (!cols.escalatedAt) {
      await qi.addColumn('disputes', 'escalatedAt', { type: Sequelize.DATE, allowNull: true });
      console.log('  ✅ Added: escalatedAt');
    } else { console.log('  ⏭  Skip: escalatedAt (exists)'); }

    // ── Fix reason ENUM: add new values if not present ────────────────────────
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL,
    // so we run each outside any transaction.
    const newReasonValues = [
      'QUALITY_ISSUE', 'DEADLINE_MISSED', 'FAKE_DELIVERY',
      'INCOMPLETE_WORK', 'COMMUNICATION_ISSUE', 'SCOPE_CREEP',
      'PAYMENT_ISSUE', 'OTHER'
    ];
    for (const val of newReasonValues) {
      try {
        await sequelize.query(
          `ALTER TYPE "enum_disputes_reason" ADD VALUE IF NOT EXISTS '${val}'`
        );
        console.log(`  ✅ Enum reason: ${val}`);
      } catch (e) {
        console.log(`  ⏭  Enum reason ${val}: ${e.message.split('\n')[0]}`);
      }
    }

    // ── Fix status ENUM: add MEDIATION and RESPONDED if not present ───────────
    for (const val of ['MEDIATION', 'RESPONDED']) {
      try {
        await sequelize.query(
          `ALTER TYPE "enum_disputes_status" ADD VALUE IF NOT EXISTS '${val}'`
        );
        console.log(`  ✅ Enum status: ${val}`);
      } catch (e) {
        console.log(`  ⏭  Enum status ${val}: ${e.message.split('\n')[0]}`);
      }
    }

    // ── Fix resolution ENUM: add PARTIAL_REFUND etc ───────────────────────────
    for (const val of ['PARTIAL_REFUND', 'REFUND_BUYER', 'RELEASE_TO_SELLER', 'CONTINUE_WORK', 'CANCEL_ORDER']) {
      try {
        await sequelize.query(
          `ALTER TYPE "enum_disputes_resolution" ADD VALUE IF NOT EXISTS '${val}'`
        );
        console.log(`  ✅ Enum resolution: ${val}`);
      } catch (e) {
        console.log(`  ⏭  Enum resolution ${val}: ${e.message.split('\n')[0]}`);
      }
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
