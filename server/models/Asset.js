const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/db");

const Asset = sequelize.define(
  "Asset", 
  {
  asset_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  serial_no: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  asset_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING(50),
  },
  os: {
    type: DataTypes.STRING(50),
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
  timestamps: false,
  underscored: true,
});

module.exports = Asset;