const bcrypt = require("bcrypt");
const { sequelize } = require("../config/db");
const User = require("../models/User");

(async () => {
  await sequelize.sync();

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await User.create({
    user_name: "Super Admin",
    password: hashedPassword,
    role: "SUPER_ADMIN",
    department_name: "IT",
    is_active: true,
  });

  console.log("✅ SUPER_ADMIN created");
  process.exit();
})();