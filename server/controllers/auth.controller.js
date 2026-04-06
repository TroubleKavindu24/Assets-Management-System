const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Op } = require("sequelize");

// User login
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
      process.env.JWT_SECRET || "your-secret-key",
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
    console.error("Login Error:", error);
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
        message: "All fields are required"
      });
    }

    // Validate role (prevent creating SUPER_ADMIN)
    const allowedRoles = ["ADMIN", "manager", "user"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: ADMIN, manager, user"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { user_name } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    // Create new user
    const newUser = await User.create({
      user_name,
      password, // Plain text as per your requirement
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
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
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
    const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    let whereClause = {};

    // Exclude SUPER_ADMIN from the list (optional)
    if (role === 'all') {
      whereClause.role = { [Op.ne]: 'SUPER_ADMIN' };
    } else if (role !== 'all') {
      whereClause.role = role;
    }

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { user_name: { [Op.like]: `%${search}%` } },
        { department_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Fetch users with pagination
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
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
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'created_at', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent viewing SUPER_ADMIN details (optional security)
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
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

    // Prevent updating SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot update SUPER_ADMIN user"
      });
    }

    // Update user fields
    if (user_name) user.user_name = user_name;
    if (role) {
      // Validate role (prevent setting to SUPER_ADMIN)
      const allowedRoles = ["ADMIN", "manager", "user"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Allowed roles: ADMIN, manager, user"
        });
      }
      user.role = role;
    }
    if (department_name) user.department_name = department_name;
    if (is_active !== undefined) user.is_active = is_active;
    if (password) user.password = password; // Plain text

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
        department_name: user.department_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};

// Delete user (SUPER_ADMIN only) - Soft delete
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.query;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deleting SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete SUPER_ADMIN user"
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      await user.destroy();
      res.status(200).json({
        success: true,
        message: "User permanently deleted successfully"
      });
    } else {
      // Soft delete (deactivate)
      user.is_active = false;
      await user.save();
      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
        data: {
          user_id: user.user_id,
          user_name: user.user_name,
          is_active: user.is_active
        }
      });
    }
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

// Change user password (SUPER_ADMIN only)
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required"
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent changing SUPER_ADMIN password (optional)
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot change SUPER_ADMIN password through this endpoint"
      });
    }

    user.password = new_password;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
};

// Get user statistics (SUPER_ADMIN only)
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const inactiveUsers = await User.count({ where: { is_active: false } });
    
    const roleStats = {
      SUPER_ADMIN: await User.count({ where: { role: 'SUPER_ADMIN' } }),
      ADMIN: await User.count({ where: { role: 'ADMIN' } }),
      manager: await User.count({ where: { role: 'manager' } }),
      user: await User.count({ where: { role: 'user' } })
    };

    res.status(200).json({
      success: true,
      message: "User statistics fetched successfully",
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        role_distribution: roleStats
      }
    });
  } catch (error) {
    console.error("Get User Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
      error: error.message
    });
  }
};

// Bulk create users (SUPER_ADMIN only)
exports.bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Users array is required"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const userData of users) {
      try {
        const { user_name, password, role, department_name } = userData;

        // Validate required fields
        if (!user_name || !password || !role || !department_name) {
          results.failed.push({
            user_name: user_name || 'unknown',
            reason: "Missing required fields"
          });
          continue;
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { user_name } });
        if (existingUser) {
          results.failed.push({
            user_name,
            reason: "Username already exists"
          });
          continue;
        }

        // Create user
        const newUser = await User.create({
          user_name,
          password,
          role,
          department_name,
          is_active: true
        });

        results.successful.push({
          user_id: newUser.user_id,
          user_name: newUser.user_name,
          role: newUser.role
        });
      } catch (error) {
        results.failed.push({
          user_name: userData.user_name || 'unknown',
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk creation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error("Bulk Create Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk create users",
      error: error.message
    });
  }
};