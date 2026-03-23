const express = require("express");
const router = express.Router();
const userController = require("../controllers/auth.controller");
const { verifyToken, allowRoles } = require("../middlewares/authMiddleware");

// Public
router.post("/login", userController.login);

// Protected (ONLY SUPER_ADMIN)
router.post("/register", verifyToken, allowRoles("SUPER_ADMIN"), userController.register);

module.exports = router;