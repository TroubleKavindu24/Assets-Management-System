// models/Asset.js (with ENUM for brand and OS)
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

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
  },
  asset_type: {
    type: DataTypes.ENUM("Laptop", "Machine", "Printer", "Other"),
    allowNull: false,
  },
  brand: {
    type: DataTypes.ENUM("HP", "DELL", "TOSHIBA", "Lenovo", "Apple", "N/A"),
    defaultValue: "N/A",
  },
  os: {
    type: DataTypes.ENUM("Windows 10", "Windows 11", "macOS", "N/A"),
    defaultValue: "N/A",
  },
  ram_capacity: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  hard_drive: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  processor: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  warranty_period: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  purchase_date: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM("AVAILABLE", "ALLOCATED", "UNDER_REPAIR", "RETIRED"),
    defaultValue: "AVAILABLE",
  },
}, {
  tableName: "assets",
  timestamps: true,
  underscored: true,
});

module.exports = Asset;