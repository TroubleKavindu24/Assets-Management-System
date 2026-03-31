const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetRequest = sequelize.define("AssetRequest", {
  req_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requested_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  asset_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  request_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  budget_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: "PENDING",
  },
  request_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "asset_requests",
  timestamps: false,
  underscored: true,
});

module.exports = AssetRequest;