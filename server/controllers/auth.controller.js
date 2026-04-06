const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

// Register User (SUPER_ADMIN or ADMIN)
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

    // Check permissions based on role
    if (authUser.role === "SUPER_ADMIN") {
      const allowedRoles = ["ADMIN", "manager", "user"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid role for SUPER_ADMIN to create" 
        });
      }
    } 
    else if (authUser.role === "ADMIN") {
      const allowedRoles = ["manager", "user"];
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ 
          success: false,
          message: "ADMIN can only create manager or user roles" 
        });
      }
    }
    else {
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to register users" 
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
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        user_id: newUser.user_id,
        user_name: newUser.user_name,
        role: newUser.role,
        department_name: newUser.department_name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};