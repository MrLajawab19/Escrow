'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraints for orders table
    await queryInterface.addConstraint('orders', {
      fields: ['buyerId'],
      type: 'foreign key',
      name: 'fk_orders_buyer_id',
      references: {
        table: 'buyers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('orders', {
      fields: ['sellerId'],
      type: 'foreign key',
      name: 'fk_orders_seller_id',
      references: {
        table: 'sellers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add foreign key constraint for disputeId in orders (optional reference)
    await queryInterface.addConstraint('orders', {
      fields: ['disputeId'],
      type: 'foreign key',
      name: 'fk_orders_dispute_id',
      references: {
        table: 'disputes',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add foreign key constraints for disputes table
    await queryInterface.addConstraint('disputes', {
      fields: ['orderId'],
      type: 'foreign key',
      name: 'fk_disputes_order_id',
      references: {
        table: 'orders',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('disputes', {
      fields: ['buyerId'],
      type: 'foreign key',
      name: 'fk_disputes_buyer_id',
      references: {
        table: 'buyers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('disputes', {
      fields: ['sellerId'],
      type: 'foreign key',
      name: 'fk_disputes_seller_id',
      references: {
        table: 'sellers',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('disputes', {
      fields: ['resolvedBy'],
      type: 'foreign key',
      name: 'fk_disputes_resolved_by',
      references: {
        table: 'buyers',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('disputes', {
      fields: ['assignedTo'],
      type: 'foreign key',
      name: 'fk_disputes_assigned_to',
      references: {
        table: 'buyers',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('orders', 'fk_orders_buyer_id');
    await queryInterface.removeConstraint('orders', 'fk_orders_seller_id');
    await queryInterface.removeConstraint('orders', 'fk_orders_dispute_id');
    await queryInterface.removeConstraint('disputes', 'fk_disputes_order_id');
    await queryInterface.removeConstraint('disputes', 'fk_disputes_buyer_id');
    await queryInterface.removeConstraint('disputes', 'fk_disputes_seller_id');
    await queryInterface.removeConstraint('disputes', 'fk_disputes_resolved_by');
    await queryInterface.removeConstraint('disputes', 'fk_disputes_assigned_to');
  }
};
