const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Branch = sequelize.define("Branch", {
  branch_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  location: {
    type: DataTypes.ENUM("Avissawella", "Ampara", "Monaragala", "Chillaw", "Jaffna", "Kilinochci", "N/A"),
    defaultValue: "N/A",
    allowNull: false,
  },
}, {
  tableName: "branches",
  timestamps: true,
  underscored: true,
});

module.exports = Branch;