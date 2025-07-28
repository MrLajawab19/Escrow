'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add disputeId column
    await queryInterface.addColumn('orders', 'disputeId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'disputes', key: 'id' },
      onDelete: 'SET NULL',
    });
    // Update status ENUM to include 'DISPUTED'
    await queryInterface.sequelize.query(`ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'DISPUTED';`);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'disputeId');
    // Note: Removing ENUM values is not supported in Postgres, so this is a no-op
  },
}; 