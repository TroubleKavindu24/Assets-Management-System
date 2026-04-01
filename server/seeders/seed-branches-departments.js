// server/seeders/seed-branches-departments.js
const { sequelize } = require("../config/db");
const Branch = require("../models/Branch");
const Department = require("../models/Department");

async function seedBranchesAndDepartments() {
  try {
    await sequelize.authenticate();
    console.log("📦 Database connected...");

    // Check if branches already exist
    const existingBranches = await Branch.count();
    if (existingBranches > 0) {
      console.log(`✅ Branches already exist (${existingBranches} branches). Skipping seed.`);
      return;
    }

    console.log("🌱 Seeding branches and departments...");

    const branchLocations = [
      "Avissawella", 
      "Ampara", 
      "Monaragala", 
      "Chillaw", 
      "Jaffna", 
      "Kilinochci"
    ];
    
    const departmentNames = [
      "IT", 
      "Finance", 
      "Legal", 
      "Treasury", 
      "Gold Loan", 
      "Fixed Deposit"
    ];

    // Create branches
    const branches = [];
    for (const location of branchLocations) {
      const branch = await Branch.create({ location });
      branches.push(branch);
      console.log(`  ✓ Created branch: ${location}`);
    }

    // Create departments for each branch
    for (const branch of branches) {
      for (const deptName of departmentNames) {
        await Department.create({
          department_name: deptName,
          branch_id: branch.branch_id
        });
      }
      console.log(`  ✓ Created ${departmentNames.length} departments for ${branch.location}`);
    }

    console.log("\n✅ Database seeded successfully!");
    console.log(`📊 Summary: ${branches.length} branches, ${branches.length * departmentNames.length} departments`);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    console.error(error.message);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedBranchesAndDepartments();
}

module.exports = seedBranchesAndDepartments;