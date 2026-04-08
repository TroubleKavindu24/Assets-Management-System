// models/AssetAllocation.js
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
  branch_id: {
    type: DataTypes.INTEGER,
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
  return_condition: {
    type: DataTypes.ENUM("Good", "Damaged", "Need Repair", "Excellent"),
    allowNull: true,
  },
  return_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  // MOVED FROM ASSET MODEL: Accessories for Laptop
  accessories: {
    type: DataTypes.ENUM("Charger", "Bag", "Mouse"),
    allowNull: true,
    comment: "Accessories allocated with the asset (primarily for Laptops)",
  },
  
  // Desktop PC specific fields
  allocated_monitor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Asset ID of allocated monitor for Desktop PC",
  },
  allocated_mouse: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Whether mouse is allocated with Desktop PC",
  },
  allocated_keyboard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Whether keyboard is allocated with Desktop PC",
  },
}, {
  tableName: "asset_allocations",
  timestamps: true,
  underscored: true,
});

module.exports = AssetAllocation;