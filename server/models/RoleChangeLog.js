// models/RoleChangeLog.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RoleChangeLog = sequelize.define(
  "RoleChangeLog",
  {
    log_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_user_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    old_role: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    new_role: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "role_change_logs",
    timestamps: false,
  }
);

module.exports = RoleChangeLog;