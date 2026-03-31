'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('orders');
    if (!table.sellerAcceptedAt) {
      await queryInterface.addColumn('orders', 'sellerAcceptedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('orders');
    if (table.sellerAcceptedAt) {
      await queryInterface.removeColumn('orders', 'sellerAcceptedAt');
    }
  }
};
