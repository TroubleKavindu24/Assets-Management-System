const { DataTypes } = require("sequelize");
const {sequelize} = require("../config/db");

const Department = sequelize.define("Department", {
  department_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  department_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "departments",
  timestamps: false,
  underscored: true,
});

module.exports = Department;