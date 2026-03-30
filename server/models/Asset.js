const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/db");

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
    validate: {
      notEmpty: true,
    },
  },
  asset_type: {
    type: DataTypes.ENUM("Laptop", "Machine", "Printer", "Other"), // Added "Other"
    allowNull: false,
  },
  brand: {
    type: DataTypes.ENUM("HP", "DELL", "TOSHIBA", "N/A"), // ✅ Added 'N/A' to ENUM
    defaultValue: "N/A",
  },
  os: {
    type: DataTypes.ENUM("Windows 10", "Windows 7", "Windows 11", "N/A"), // ✅ Added 'N/A' to ENUM
    defaultValue: "N/A",
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
  timestamps: true,
  underscored: true,
});

module.exports = Asset;