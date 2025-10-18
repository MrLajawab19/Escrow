'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Order belongs to Buyer
      Order.belongsTo(models.Buyer, {
        foreignKey: 'buyerId',
        as: 'buyer'
      });
      
      // Order belongs to Seller
      Order.belongsTo(models.Seller, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
      
      // Order has one dispute (optional)
      Order.hasOne(models.Dispute, {
        foreignKey: 'orderId',
        as: 'dispute'
      });
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
    buyerName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    buyerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    productLink: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    sellerContact: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    escrowLink: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    orderTrackingLink: {
      type: DataTypes.STRING,
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
        isValidXBox(value) {
          // Basic required fields for all services
          const basicRequiredFields = ['title', 'productType', 'productLink', 'description', 'deadline', 'price'];
          
          for (const field of basicRequiredFields) {
            if (!value[field]) {
              throw new Error(`Missing required XBox field: ${field}`);
            }
          }

          // Service-specific validation
          const serviceType = value.productType;
          const servicesWithoutCondition = [
            'Logo design', 'Poster/flyer/banner design', 'Social media post creation', 
            'Video editing', 'Motion graphics', 'NFT art creation', 'Illustration / Comics',
            '3D modeling / rendering', 'Website development', 'Gaming account sales'
          ];
          
          // For services that require condition field
          if (!servicesWithoutCondition.includes(serviceType) && !value.condition) {
            throw new Error(`Missing required XBox field for ${serviceType}: condition`);
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'PLACED',
        'ESCROW_FUNDED', 
        'ACCEPTED',
        'REJECTED',
        'CHANGES_REQUESTED',
        'IN_PROGRESS',
        'SUBMITTED',
        'APPROVED',
        'COMPLETED',
        'DISPUTED',
        'RELEASED',
        'REFUNDED',
        'CANCELLED'
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
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidLogs(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Order logs must be an array');
          }
          if (value) {
            for (const log of value) {
              if (!log.event || !log.byUserId || !log.timestamp) {
                throw new Error('Each log must contain event, byUserId, and timestamp');
              }
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