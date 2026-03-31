const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const HandoverRequest = sequelize.define("HandoverRequest", {
  handover_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  asset_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requested_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  condition_note: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  handover_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: "PENDING",
  },
}, {
  tableName: "handover_requests",
  timestamps: false,
  underscored: true,
});

module.exports = HandoverRequest;