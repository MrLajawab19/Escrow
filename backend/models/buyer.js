'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Buyer extends Model {
    static associate(models) {
      // Buyer has many orders
      Buyer.hasMany(models.Order, {
        foreignKey: 'buyerId',
        as: 'orders'
      });
      
      // Buyer has many disputes
      Buyer.hasMany(models.Dispute, {
        foreignKey: 'buyerId',
        as: 'disputes'
      });
      
      // Buyer can resolve disputes
      Buyer.hasMany(models.Dispute, {
        foreignKey: 'resolvedBy',
        as: 'resolvedDisputes'
      });
      
      // Buyer can be assigned disputes
      Buyer.hasMany(models.Dispute, {
        foreignKey: 'assignedTo',
        as: 'assignedDisputes'
      });
    }
  }
  
  Buyer.init({
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
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Buyer',
    tableName: 'buyers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['status']
      }
    ]
  });
  
  return Buyer;
}; 