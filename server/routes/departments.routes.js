const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departments.controller");

// Branch and Department routes (new)
router.get("/branches", departmentController.getAllBranches);
router.get("/branches-with-departments", departmentController.getAllBranchesWithDepartments);
router.get("/departments", departmentController.getAllDepartments);
router.get("/departments/branch/:branch_id", departmentController.getDepartmentsByBranch);

module.exports = router;