const express = require("express");
const router = express.Router();
const roleManagementController = require("../controllers/roleManagement.controller");
const {
  roleManagementAuth,
  sensitiveOperationLimit
} = require("../middlewares/authMiddleware");

// ✅ Apply auth first
router.use(roleManagementAuth);

// ✅ Then rate limiter
router.use(sensitiveOperationLimit(10, 60000));

// Routes
router.get("/users", roleManagementController.getAllManageableUsers);
router.get("/users/:userId", roleManagementController.getUserById);

router.put("/users/:userId/promote", roleManagementController.promoteToAdmin);
router.put("/users/:userId/demote", roleManagementController.demoteToStaff);

router.post("/users/:userId/deactivate", roleManagementController.deactivateUser);
router.post("/users/:userId/reactivate", roleManagementController.reactivateUser);

router.put("/users/:userId/department", roleManagementController.updateDepartment);

router.post("/users/bulk-update", roleManagementController.bulkRoleUpdate);

router.get("/stats", roleManagementController.getRoleChangeStats);

module.exports = router;