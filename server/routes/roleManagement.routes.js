const express = require("express");
const router = express.Router();
const roleManagementController = require("../controllers/roleManagement.controller");
const { verifyToken, allowSuperAdmin, logUserAction } = require("../middlewares/authMiddleware");

// All routes require authentication and SUPER_ADMIN role
router.use(verifyToken);
router.use(allowSuperAdmin);

// Optional: Add logging for all role management actions
router.use(logUserAction("ROLE_MANAGEMENT"));

// Get all manageable users (ADMIN and STAFF) with optional filters
router.get("/users", roleManagementController.getAllManageableUsers);

// Get user by ID
router.get("/users/:userId", roleManagementController.getUserById);

// Promote STAFF to ADMIN
router.put("/users/:userId/promote", roleManagementController.promoteToAdmin);

// Demote ADMIN to STAFF
router.put("/users/:userId/demote", roleManagementController.demoteToStaff);

// Remove user (ADMIN or STAFF) - soft delete
router.delete("/users/:userId", roleManagementController.removeUser);

// Reactivate a deactivated user
router.post("/users/:userId/reactivate", roleManagementController.reactivateUser);

router.post("/users/:userId/deactivateUser", roleManagementController.deactivateUser);

// Bulk role update
router.post("/users/bulk-update", roleManagementController.bulkRoleUpdate);

// Get role statistics
router.get("/stats", roleManagementController.getRoleChangeStats);

module.exports = router;