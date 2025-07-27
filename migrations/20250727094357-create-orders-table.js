'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      buyerId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      sellerId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      scopeBox: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'PLACED',
          'ESCROW_FUNDED',
          'IN_PROGRESS',
          'SUBMITTED',
          'APPROVED',
          'DISPUTED',
          'RELEASED',
          'REFUNDED'
        ),
        defaultValue: 'PLACED',
        allowNull: false
      },
      deliveryFiles: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: [],
        allowNull: false
      },
      disputeId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      orderLogs: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create indexes
    await queryInterface.addIndex('orders', ['buyerId']);
    await queryInterface.addIndex('orders', ['sellerId']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['disputeId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};
