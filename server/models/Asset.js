// models/Asset.js (with ENUM for brand and OS and new attributes)
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

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
    type: DataTypes.ENUM("Laptop", "Desktop PC", "Monitor", "Printer", "Other"),
    allowNull: false,
  },
  brand: {
    type: DataTypes.ENUM("HP", "DELL", "TOSHIBA", "Lenovo", "Apple", "N/A"),
    defaultValue: "N/A",
  },
  os: {
    type: DataTypes.ENUM("Windows 10", "Windows 11", "macOS", "N/A"),
    defaultValue: "N/A",
  },
  purchase_date: {
    type: DataTypes.DATE,
  },
  
  ram_capacity: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "e.g., 8GB, 16GB, 32GB",
  },
  hard_drive: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "e.g., 256GB SSD, 1TB HDD",
  },
  processor: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "e.g., Intel i5, AMD Ryzen 7",
  },

  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "e.g., PRO BOOK",
  },

  gen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "e.g., 11 gen",
  },
  
  warranty_period_months: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 120,
    },
    comment: "Warranty period in months",
  },
  warranty_end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Automatically calculated based on purchase_date + warranty_period_months",
  },
  
  accessories: {
    type: DataTypes.ENUM("Charger", "Bag", "Mouse"),
    allowNull: true,
  },
  
  status: {
    type: DataTypes.ENUM("AVAILABLE", "ALLOCATED", "UNDER_REPAIR", "RETIRED"),
    defaultValue: "AVAILABLE",
  },
}, {
  tableName: "assets",
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (asset) => {
      if (asset.purchase_date && asset.warranty_period_months) {
        const warrantyEndDate = new Date(asset.purchase_date);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + asset.warranty_period_months);
        asset.warranty_end_date = warrantyEndDate;
      }
    },
    beforeUpdate: async (asset) => {
      if (asset.changed('purchase_date') || asset.changed('warranty_period_months')) {
        if (asset.purchase_date && asset.warranty_period_months) {
          const warrantyEndDate = new Date(asset.purchase_date);
          warrantyEndDate.setMonth(warrantyEndDate.getMonth() + asset.warranty_period_months);
          asset.warranty_end_date = warrantyEndDate;
        } else {
          asset.warranty_end_date = null;
        }
      }
    },
  },
});

module.exports = Asset;