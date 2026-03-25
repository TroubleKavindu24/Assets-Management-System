// models/Permission.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    permission_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    permission_type: {
      type: DataTypes.ENUM(
        "ADD_ASSETS",
        "ALLOCATE_ASSETS",
        "VIEW_ASSETS_LIST",
        "VIEW_ALLOCATIONS_LIST",
        "MANAGE_HANDOVER",
        "VIEW_REPORTS",
        "MANAGE_USERS"
      ),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("GRANT", "REVOKE"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "REVOKED"),
      defaultValue: "ACTIVE",
    },
    granted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    granted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "permissions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Permission;