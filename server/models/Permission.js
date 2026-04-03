const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Permission = sequelize.define("Permission", {
  permission_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permission_type: {
    type: DataTypes.ENUM(
      "ADD_ASSET",
      "VIEW_ASSETS_LIST",
      "ALLOCATE_ASSET",
      "VIEW_ALLOCATIONS_LIST",
      "MANAGE_HANDOVER",
      "DISPOSE_ASSET",
      "VIEW_DISPOSED_LIST"
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
  },
  granted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  revoked_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "permissions",
  timestamps: false,
});

module.exports = Permission;