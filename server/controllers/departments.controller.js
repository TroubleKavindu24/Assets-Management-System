const Department = require("../models/Department");
const Branch = require("../models/Branch");

// Add this to your assets.controller.js
exports.getAllBranchesWithDepartments = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [
        {
          model: Department,
          as: "departments",
          attributes: ["department_id", "department_name"]
        }
      ],
      order: [["location", "ASC"]]
    });

    return res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch branches",
      error: error.message
    });
  }
};

// Get all branches (simple list)
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      attributes: ["branch_id", "location"],
      order: [["location", "ASC"]]
    });

    return res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch branches",
      error: error.message
    });
  }
};

// Get departments by branch ID
exports.getDepartmentsByBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const departments = await Department.findAll({
      where: { branch_id },
      attributes: ["department_id", "department_name"],
      order: [["department_name", "ASC"]]
    });

    return res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};

// Get all departments (for backward compatibility)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["branch_id", "location"]
        }
      ],
      attributes: ["department_id", "department_name", "branch_id"],
      order: [["department_name", "ASC"]]
    });

    return res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};