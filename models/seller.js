'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Seller extends Model {
    static associate(models) {
      // Define associations here
    }
  }
  
  Seller.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'inactive', 'suspended'),
      defaultValue: 'pending'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completedOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Seller',
    tableName: 'sellers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['rating']
      }
    ]
  });
  
  return Seller;
}; 