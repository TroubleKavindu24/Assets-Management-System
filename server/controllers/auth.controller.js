const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");

exports.login = async (req, res) => {
  try {
    const { user_name, password } = req.body;

    if (!user_name || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username and password required" 
      });
    }

    const user = await User.findOne({ where: { user_name } });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        message: "Account is deactivated. Please contact SUPER_ADMIN." 
      });
    }

    // Plain password check
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
        department_name: user.department_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
        department_name: user.department_name,
        is_active: user.is_active
      },
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// 📝 REGISTER (ONLY SUPER_ADMIN)
exports.register = async (req, res) => {
  try {
    const { user_name, password, role, department_name } = req.body;
    
    // Get the authenticated user from token
    const authUser = req.user;

    if (!user_name || !password || !role || !department_name) {
      return res.status(400).json({ 
        success: false,
        message: "All fields required" 
      });
    }

    // ❌ Prevent creating SUPER_ADMIN
    if (role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot create SUPER_ADMIN via API" });
    }

    // ✅ Allow only ADMIN & STAFF
    const allowedRoles = ["ADMIN", "STAFF"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check existing user
    const existingUser = await User.findOne({ where: { user_name } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    const newUser = await User.create({
      user_name,
      password,
      role,
      department_name,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

