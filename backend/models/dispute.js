const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Dispute = sequelize.define('Dispute', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'buyers',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'id'
      }
    },
    raisedBy: {
      type: DataTypes.ENUM('buyer', 'seller'),
      allowNull: false
    },
    reason: {
      type: DataTypes.ENUM(
        'Quality Issue',
        'Delivery Delay',
        'Payment Issue',
        'Communication Problem',
        'Scope Creep',
        'Technical Issue',
        'Other'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    evidenceUrls: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    requestedResolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'OPEN',
        'UNDER_REVIEW',
        'RESPONDED',
        'MEDIATION',
        'RESOLVED',
        'CLOSED'
      ),
      defaultValue: 'OPEN'
    },
    resolution: {
      type: DataTypes.ENUM(
        'REFUND_BUYER',
        'RELEASE_TO_SELLER',
        'PARTIAL_REFUND',
        'CONTINUE_WORK',
        'CANCEL_ORDER'
      ),
      allowNull: true
    },
    resolutionAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'buyers',
        key: 'id'
      }
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      defaultValue: 'MEDIUM'
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'buyers',
        key: 'id'
      }
    },
    timeline: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'disputes',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
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
        fields: ['priority']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Define associations
  Dispute.associate = (models) => {
    // Dispute belongs to Order
    Dispute.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });

    // Dispute belongs to Buyer
    Dispute.belongsTo(models.Buyer, {
      foreignKey: 'buyerId',
      as: 'buyer'
    });

    // Dispute belongs to Seller
    Dispute.belongsTo(models.Seller, {
      foreignKey: 'sellerId',
      as: 'seller'
    });

    // Dispute can be resolved by a Buyer (admin)
    Dispute.belongsTo(models.Buyer, {
      foreignKey: 'resolvedBy',
      as: 'resolver'
    });

    // Dispute can be assigned to a Buyer (admin)
    Dispute.belongsTo(models.Buyer, {
      foreignKey: 'assignedTo',
      as: 'assignee'
    });
  };

  return Dispute;
};