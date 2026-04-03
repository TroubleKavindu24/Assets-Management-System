// seeders/20250101000000-initial-data.js
const { sequelize } = require("../config/db");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Department = require("../models/Department");
const { BRANCH_LOCATIONS, DEPARTMENT_NAMES } = require("../constants/app.constants");

module.exports = {
  async up() {
    try {
      // Create SUPER_ADMIN user
      const superAdminExists = await User.findOne({ 
        where: { role: "SUPER_ADMIN" } 
      });
      
      if (!superAdminExists) {
        await User.create({
          user_name: "superadmin",
          password: "SuperAdmin@123",
          role: "SUPER_ADMIN",
          department_name: "IT",
          is_active: true
        });
        console.log("✅ SUPER_ADMIN created");
      }

      // Create branches
      for (const location of BRANCH_LOCATIONS) {
        const existing = await Branch.findOne({ where: { location } });
        if (!existing) {
          await Branch.create({ location });
        }
      }
      console.log("✅ Branches seeded");

      // Create departments
      for (const deptName of DEPARTMENT_NAMES) {
        const existing = await Department.findOne({ where: { department_name: deptName } });
        if (!existing) {
          await Department.create({ 
            department_name: deptName,
            branch_id: 1 // Default branch
          });
        }
      }
      console.log("✅ Departments seeded");

      console.log("✅ All seed data inserted successfully");
    } catch (error) {
      console.error("❌ Seeding error:", error);
    }
  },

  async down() {
    await User.destroy({ where: {} });
    await Branch.destroy({ where: {} });
    await Department.destroy({ where: {} });
  }
};