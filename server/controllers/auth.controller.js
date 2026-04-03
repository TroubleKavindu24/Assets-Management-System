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

// Register new user (SUPER_ADMIN only)
exports.register = async (req, res) => {
  try {
    const { user_name, password, role, department_name } = req.body;

    if (!user_name || !password || !role || !department_name) {
      return res.status(400).json({ 
        success: false,
        message: "All fields required" 
      });
    }

    // Prevent creating SUPER_ADMIN via API
    if (role === "SUPER_ADMIN") {
      return res.status(403).json({ 
        success: false,
        message: "Cannot create SUPER_ADMIN via API" 
      });
    }

    // Allow only ADMIN & STAFF
    const allowedRoles = ["ADMIN", "STAFF"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role. Allowed: ADMIN, STAFF" 
      });
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
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        user_id: newUser.user_id,
        user_name: newUser.user_name,
        role: newUser.role,
        department_name: newUser.department_name,
        is_active: newUser.is_active
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all users (SUPER_ADMIN only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Get user by ID (SUPER_ADMIN only)
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message
    });
  }
};

// Update user (SUPER_ADMIN only)
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { user_name, role, department_name, is_active, password } = req.body;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Prevent modifying SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify SUPER_ADMIN user"
      });
    }
    
    // Update fields
    if (user_name) user.user_name = user_name;
    if (role && role !== "SUPER_ADMIN") user.role = role;
    if (department_name) user.department_name = department_name;
    if (is_active !== undefined) user.is_active = is_active;
    if (password) user.password = password;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
        department_name: user.department_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};

// Delete user (SUPER_ADMIN only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Prevent deleting SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete SUPER_ADMIN user"
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};