const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetAllocation = sequelize.define("AssetAllocation", {
  allocation_id: {
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
  ip_address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  allocated_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  allocated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  return_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "asset_allocations",
  timestamps: true,
  underscored: true,
});

module.exports = AssetAllocation;