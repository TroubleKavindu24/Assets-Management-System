const express = require("express");
const router = express.Router();
const roleManagementController = require("../controllers/roleManagement.controller");
const { roleManagementAuth, sensitiveOperationLimit } = require("../middlewares/authMiddleware");

// All routes use the combined roleManagementAuth middleware
router.use(roleManagementAuth);

// Apply rate limiting for sensitive operations
router.use(sensitiveOperationLimit(10, 60000));

// Get all users (ADMIN and STAFF)
router.get("/users", roleManagementController.getAllManageableUsers);

// Get user by ID
router.get("/users/:userId", roleManagementController.getUserById);

// Promote STAFF to ADMIN (sensitive operation)
router.put("/users/:userId/promote", roleManagementController.promoteToAdmin);

// Demote ADMIN to STAFF (sensitive operation)
router.put("/users/:userId/demote", roleManagementController.demoteToStaff);

// Deactivate user (sensitive operation)
router.post("/users/:userId/deactivate", roleManagementController.deactivateUser);

// Reactivate user (sensitive operation)
router.post("/users/:userId/reactivate", roleManagementController.reactivateUser);

// Update user department
// router.put("/users/:userId/department", roleManagementController.updateDepartment);

// Bulk role update (sensitive operation)
router.post("/users/bulk-update", roleManagementController.bulkRoleUpdate);

// Get statistics
router.get("/stats", roleManagementController.getRoleChangeStats);

module.exports = router;