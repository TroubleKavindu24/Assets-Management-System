// routes/permissionRoutes.js
const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");
const { verifyToken, allowSuperAdmin } = require("../middlewares/authMiddleware");

// All routes require authentication and SUPER_ADMIN role
router.use(verifyToken);
router.use(allowSuperAdmin);

// Get all users with their permissions
router.get("/users", permissionController.getAllUsersWithPermissions);

// Get available permissions list
router.get("/list", permissionController.getAvailablePermissions);

// Get user's current active permissions
router.get("/users/:userId/permissions/active", permissionController.getActivePermissions);

// Get user's permission history
router.get("/users/:userId/permissions/history", permissionController.getPermissionHistory);

// Get user's complete permission details
router.get("/users/:userId/permissions", permissionController.getUserPermissions);

// Grant single permission to STAFF user (requires password)
router.post("/users/:userId/permissions/:permissionType/grant", permissionController.grantPermission);

// Revoke permission from STAFF user (requires password)
router.delete("/users/:userId/permissions/:permissionType/revoke", permissionController.revokePermission);

// Grant multiple permissions at once (requires password)
router.post("/users/:userId/permissions/bulk-grant", permissionController.grantMultiplePermissions);

module.exports = router;