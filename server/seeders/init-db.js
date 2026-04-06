// seeders/init-db.js
const { sequelize } = require("../config/db");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Department = require("../models/Department");

const BRANCH_LOCATIONS = [
  "Avissawella",
  "Ampara", 
  "Monaragala",
  "Chillaw",
  "Jaffna",
  "Kilinochci",
  "N/A"
];

const DEPARTMENT_NAMES = [
  "IT",
  "Finance", 
  "Legal",
  "Treasury",
  "Gold Loan",
  "Fixed Deposit",
  "N/A"
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

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
      console.log("✅ SUPER_ADMIN created (username: superadmin, password: SuperAdmin@123)");
    } else {
      console.log("⚠️ SUPER_ADMIN already exists");
    }

    // Create branches
    for (const location of BRANCH_LOCATIONS) {
      const existing = await Branch.findOne({ where: { location } });
      if (!existing) {
        await Branch.create({ location });
        console.log(`✅ Branch created: ${location}`);
      }
    }

    // Create departments
    for (const deptName of DEPARTMENT_NAMES) {
      const existing = await Department.findOne({ where: { department_name: deptName } });
      if (!existing) {
        await Department.create({ 
          department_name: deptName,
          branch_id: 1 // Default to first branch
        });
        console.log(`✅ Department created: ${deptName}`);
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();