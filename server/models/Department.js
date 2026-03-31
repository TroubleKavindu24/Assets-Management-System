// models/Department.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Department = sequelize.define("Department", {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_name: {
    type: DataTypes.ENUM("IT", "Finance", "Legal", "Treasury", "Gold Loan", "Fixed Deposit", "N/A"),
    defaultValue: "N/A",
    allowNull: false,
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'branch_id'
    }
  },
}, {
  tableName: "departments",
  timestamps: true, // Add timestamps
  underscored: true,
});

module.exports = Department;