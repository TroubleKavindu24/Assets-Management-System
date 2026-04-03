const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const DisposedAsset = sequelize.define("DisposedAsset", {
  disposed_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  os: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  purchase_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  disposed_location: {
    type: DataTypes.STRING(100),
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
    allowNull: true,
  },
}, {
  tableName: "disposed_assets",
  timestamps: false,
});

module.exports = DisposedAsset;