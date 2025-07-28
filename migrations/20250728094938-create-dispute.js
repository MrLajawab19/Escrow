'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('disputes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      buyerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      reason: {
        type: Sequelize.ENUM('Quality Issue', 'Fake Delivery', 'Deadline Missed', 'Incomplete Work', 'Other'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      evidenceUrls: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      requestedResolution: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('OPEN', 'RESPONDED', 'RESOLVED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('disputes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_disputes_reason";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_disputes_status";');
  },
};