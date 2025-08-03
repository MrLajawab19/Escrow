'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to disputes table
    await queryInterface.addColumn('disputes', 'sellerId', {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: '00000000-0000-0000-0000-000000000000' // Temporary default
    });

    await queryInterface.addColumn('disputes', 'raisedBy', {
      type: Sequelize.ENUM('buyer', 'seller'),
      allowNull: false,
      defaultValue: 'buyer'
    });

    await queryInterface.addColumn('disputes', 'resolution', {
      type: Sequelize.ENUM('REFUND_BUYER', 'RELEASE_TO_SELLER', 'PARTIAL_REFUND', 'CONTINUE_WORK', 'CANCEL_ORDER'),
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'resolutionAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'resolutionNotes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'resolvedBy', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'resolvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'priority', {
      type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    });

    await queryInterface.addColumn('disputes', 'assignedTo', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'timeline', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('disputes', 'lastActivity', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Update status ENUM to include new statuses
    await queryInterface.sequelize.query(`ALTER TYPE "enum_disputes_status" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_disputes_status" ADD VALUE IF NOT EXISTS 'MEDIATION';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_disputes_status" ADD VALUE IF NOT EXISTS 'CLOSED';`);

    // Update reason ENUM to include new reasons
    await queryInterface.sequelize.query(`ALTER TYPE "enum_disputes_reason" ADD VALUE IF NOT EXISTS 'Communication Issue';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_disputes_reason" ADD VALUE IF NOT EXISTS 'Payment Issue';`);

    // Add indexes
    await queryInterface.addIndex('disputes', ['sellerId']);
    await queryInterface.addIndex('disputes', ['raisedBy']);
    await queryInterface.addIndex('disputes', ['assignedTo']);
    await queryInterface.addIndex('disputes', ['priority']);
    await queryInterface.addIndex('disputes', ['lastActivity']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('disputes', ['sellerId']);
    await queryInterface.removeIndex('disputes', ['raisedBy']);
    await queryInterface.removeIndex('disputes', ['assignedTo']);
    await queryInterface.removeIndex('disputes', ['priority']);
    await queryInterface.removeIndex('disputes', ['lastActivity']);

    // Remove columns
    await queryInterface.removeColumn('disputes', 'sellerId');
    await queryInterface.removeColumn('disputes', 'raisedBy');
    await queryInterface.removeColumn('disputes', 'resolution');
    await queryInterface.removeColumn('disputes', 'resolutionAmount');
    await queryInterface.removeColumn('disputes', 'resolutionNotes');
    await queryInterface.removeColumn('disputes', 'resolvedBy');
    await queryInterface.removeColumn('disputes', 'resolvedAt');
    await queryInterface.removeColumn('disputes', 'priority');
    await queryInterface.removeColumn('disputes', 'assignedTo');
    await queryInterface.removeColumn('disputes', 'timeline');
    await queryInterface.removeColumn('disputes', 'lastActivity');
  }
}; 