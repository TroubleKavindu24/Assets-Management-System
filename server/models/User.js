const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  department_name: {
    type: DataTypes.ENUM("IT", "Finance", "Legal", "Treasury", "Gold Loan", "Fixed Deposit", "N/A"),
    defaultValue: "N/A",
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "user", "manager"),
    defaultValue: "user",
  },
}, {
  tableName: "users",
  timestamps: true,
  underscored: true,
});

module.exports = User;