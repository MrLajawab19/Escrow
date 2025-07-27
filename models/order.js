'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Define associations here
    }
  }
  
  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    scopeBox: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        notEmpty: true,
        isValidScopeBox(value) {
          if (!value.title || !value.description || !value.deliverables || !value.deadline || !value.price) {
            throw new Error('Scope box must contain title, description, deliverables, deadline, and price');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
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
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      allowNull: false
    },
    disputeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    orderLogs: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: [],
      allowNull: false,
      validate: {
        isValidLogs(value) {
          if (!Array.isArray(value)) {
            throw new Error('Order logs must be an array');
          }
          for (const log of value) {
            if (!log.event || !log.byUserId || !log.timestamp) {
              throw new Error('Each log must contain event, byUserId, and timestamp');
            }
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['buyerId']
      },
      {
        fields: ['sellerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['disputeId']
      }
    ]
  });
  
  return Order;
}; 