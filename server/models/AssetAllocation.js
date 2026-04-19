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

  // ✅ FIXED HERE
  allocated_by: {
    type: DataTypes.INTEGER, // changed from STRING → INTEGER
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

  // Laptop
  allocated_charger: { type: DataTypes.BOOLEAN, defaultValue: false },
  allocated_bag: { type: DataTypes.BOOLEAN, defaultValue: false },
  allocated_mouse: { type: DataTypes.BOOLEAN, defaultValue: false },
  allocated_keyboard: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Desktop
  allocated_monitor_id: { type: DataTypes.INTEGER, allowNull: true },
  desktop_allocated_mouse: { type: DataTypes.BOOLEAN, defaultValue: false },
  desktop_allocated_keyboard: { type: DataTypes.BOOLEAN, defaultValue: false },

}, {
  tableName: "asset_allocations",
  timestamps: true,
  underscored: true,
});

module.exports = AssetAllocation;