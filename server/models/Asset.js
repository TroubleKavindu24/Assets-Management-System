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
    type: DataTypes.STRING(50),
    defaultValue: "N/A",
    allowNull: true,
  },
  os: {
    type: DataTypes.STRING(50),
    defaultValue: "N/A",
    allowNull: true,
  },
  purchase_date: {
    type: DataTypes.DATE,
    allowNull: true,
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