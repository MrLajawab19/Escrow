'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'buyerName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Unknown Buyer'
    });

    await queryInterface.addColumn('orders', 'platform', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Other'
    });

    await queryInterface.addColumn('orders', 'productLink', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.addColumn('orders', 'country', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Other'
    });

    await queryInterface.addColumn('orders', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'USD'
    });

    await queryInterface.addColumn('orders', 'sellerContact', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.addColumn('orders', 'escrowLink', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'buyerName');
    await queryInterface.removeColumn('orders', 'platform');
    await queryInterface.removeColumn('orders', 'productLink');
    await queryInterface.removeColumn('orders', 'country');
    await queryInterface.removeColumn('orders', 'currency');
    await queryInterface.removeColumn('orders', 'sellerContact');
    await queryInterface.removeColumn('orders', 'escrowLink');
  }
};
