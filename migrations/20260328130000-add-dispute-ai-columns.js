'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('disputes');

    if (!tableDesc.ruleFlags) {
      await queryInterface.addColumn('disputes', 'ruleFlags', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }
    if (!tableDesc.aiAnalysis) {
      await queryInterface.addColumn('disputes', 'aiAnalysis', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }
    if (!tableDesc.evidenceResponses) {
      await queryInterface.addColumn('disputes', 'evidenceResponses', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    }
    if (!tableDesc.escalatedAt) {
      await queryInterface.addColumn('disputes', 'escalatedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tableDesc.autoFlaggedAt) {
      await queryInterface.addColumn('disputes', 'autoFlaggedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tableDesc.analyzedWordCount) {
      await queryInterface.addColumn('disputes', 'analyzedWordCount', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const cols = ['ruleFlags', 'aiAnalysis', 'evidenceResponses', 'escalatedAt', 'autoFlaggedAt', 'analyzedWordCount'];
    for (const col of cols) {
      try { await queryInterface.removeColumn('disputes', col); } catch (e) { /* ignore */ }
    }
  }
};
