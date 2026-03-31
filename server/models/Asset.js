// models/Asset.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const constants = require("../constants/app.constants");

const Asset = sequelize.define("Asset", {
  asset_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  serial_no: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  asset_type: {
    type: DataTypes.ENUM(...constants.ASSET_TYPES),
    allowNull: false,
  },
  brand: {
    type: DataTypes.ENUM(...constants.ASSET_BRANDS),
    defaultValue: "N/A",
  },
  os: {
    type: DataTypes.ENUM(...constants.ASSET_OS),
    defaultValue: "N/A",
  },
  purchase_date: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM(...constants.ASSET_STATUS),
    defaultValue: "AVAILABLE",
  },
}, {
  tableName: "assets",
  timestamps: true,
  underscored: true,
});

module.exports = Asset;