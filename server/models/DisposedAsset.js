// models/DisposedAsset.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DisposedAsset = sequelize.define("DisposedAsset", {
  disposed_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  asset_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serial_no: {
    type: DataTypes.STRING(100),
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
  disposed_location: {
    type: DataTypes.ENUM("Boralla", "Location2", "Location3"),
    allowNull: false,
  },
  disposed_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  disposed_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  disposed_reason: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "disposed_assets",
  timestamps: true,
  underscored: true,
});

module.exports = DisposedAsset;