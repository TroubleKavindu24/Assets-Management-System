const express = require("express");
const router = express.Router();
const userController = require("../controllers/auth.controller");
const { verifyToken, allowSuperAdmin } = require("../middlewares/authMiddleware");

// Public
router.post("/login", userController.login);

// Protected (ONLY SUPER_ADMIN can register users)
router.post("/register", verifyToken, allowSuperAdmin, userController.register);

// Get all users (SUPER_ADMIN only)
router.get("/users", verifyToken, allowSuperAdmin, userController.getAllUsers);

// Get user by ID (SUPER_ADMIN only)
router.get("/users/:userId", verifyToken, allowSuperAdmin, userController.getUserById);

// Update user (SUPER_ADMIN only)
router.put("/users/:userId", verifyToken, allowSuperAdmin, userController.updateUser);

// Delete user (SUPER_ADMIN only)
router.delete("/users/:userId", verifyToken, allowSuperAdmin, userController.deleteUser);

module.exports = router;