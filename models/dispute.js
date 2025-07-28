const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Dispute extends Model {
    static associate(models) {
      Dispute.belongsTo(models.Order, { foreignKey: 'orderId' });
      // Optionally: Dispute.belongsTo(models.User, { foreignKey: 'buyerId' });
    }
  }
  Dispute.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM('Quality Issue', 'Fake Delivery', 'Deadline Missed', 'Incomplete Work', 'Other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    evidenceUrls: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
    },
    requestedResolution: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'RESPONDED', 'RESOLVED'),
      allowNull: false,
      defaultValue: 'OPEN',
    },
  }, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'disputes',
    timestamps: true,
  });
  return Dispute;
};