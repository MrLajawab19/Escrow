'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new statuses to the ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'ACCEPTED';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'REJECTED';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing ENUM values easily
    // This is a limitation - we can't easily rollback ENUM additions
    console.log('Warning: Cannot remove ENUM values in PostgreSQL');
  }
}; 