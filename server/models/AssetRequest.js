// models/AssetRequest.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const constants = require("../constants/app.constants");

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
    type: DataTypes.ENUM(...constants.ASSET_TYPES),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  request_type: {
    type: DataTypes.ENUM(...constants.REQUEST_TYPES),
    allowNull: true,
  },
  budget_type: {
    type: DataTypes.ENUM(...constants.BUDGET_TYPES),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...constants.REQUEST_STATUS),
    defaultValue: "PENDING",
  },
  request_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "asset_requests",
  timestamps: true,
  underscored: true,
});

module.exports = AssetRequest;