'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sellers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'inactive', 'suspended'),
        defaultValue: 'pending'
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      profileImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      businessDetails: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      totalOrders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completedOrders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Add indexes as defined in the model
    await queryInterface.addIndex('sellers', ['email']);
    await queryInterface.addIndex('sellers', ['status']);
    await queryInterface.addIndex('sellers', ['rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sellers');
  }
};
