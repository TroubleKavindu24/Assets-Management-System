const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // ✅ correct import

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM(
        "DEPARTMENT_USER",
        "DEPARTMENT_HOD",
        "IT_OFFICER",
        "IT_HOD",
        "ADMIN"
      ),
      allowNull: false,
    },

    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // ❗ FIXED (was allow_after)
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

module.exports = User;