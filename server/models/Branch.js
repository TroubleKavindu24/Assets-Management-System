const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Branch = sequelize.define("Branch", {
  branch_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: "branches",
  timestamps: false,
  underscored: true,
});

module.exports = Branch;