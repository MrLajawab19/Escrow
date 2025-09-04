'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if buyerEmail column exists before adding
    const tableDescription = await queryInterface.describeTable('orders');
    
    if (!tableDescription.buyerEmail) {
      await queryInterface.addColumn('orders', 'buyerEmail', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'unknown@example.com'
      });
    }

    if (!tableDescription.orderTrackingLink) {
      await queryInterface.addColumn('orders', 'orderTrackingLink', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      });
    }

    // Update orderLogs to match model (JSONB instead of ARRAY)
    // First drop the column and recreate it due to type incompatibility
    await queryInterface.removeColumn('orders', 'orderLogs');
    await queryInterface.addColumn('orders', 'orderLogs', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    // Update status enum to include all values from model
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'ACCEPTED';
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'REJECTED';
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'COMPLETED';
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
    `);
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('orders');
    
    if (tableDescription.buyerEmail) {
      await queryInterface.removeColumn('orders', 'buyerEmail');
    }
    
    if (tableDescription.orderTrackingLink) {
      await queryInterface.removeColumn('orders', 'orderTrackingLink');
    }
    
    // Revert orderLogs back to ARRAY
    await queryInterface.removeColumn('orders', 'orderLogs');
    await queryInterface.addColumn('orders', 'orderLogs', {
      type: Sequelize.ARRAY(Sequelize.JSONB),
      defaultValue: [],
      allowNull: false
    });
  }
};
