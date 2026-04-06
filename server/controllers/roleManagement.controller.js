const User = require("../models/User");
const { Op } = require("sequelize");

// Get all manageable users (ADMIN and STAFF) - SUPER_ADMIN can see all except other SUPER_ADMINs
exports.getAllManageableUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    let whereClause = {
      role: {
        [Op.ne]: 'SUPER_ADMIN' // Don't show other SUPER_ADMINs
      }
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { user_name: { [Op.like]: `%${search}%` } },
        { department_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add role filter
    if (role !== 'all') {
      whereClause.role = role;
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
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Get user by ID
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

    // Prevent SUPER_ADMIN from viewing other SUPER_ADMIN details
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
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message
    });
  }
};

// Promote STAFF to ADMIN
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== 'STAFF') {
      return res.status(400).json({
        success: false,
        message: "Only STAFF users can be promoted to ADMIN"
      });
    }

    await user.update({
      role: 'ADMIN'
    });

    res.status(200).json({
      success: true,
      message: "User promoted to ADMIN successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        new_role: user.role
      }
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to promote user",
      error: error.message
    });
  }
};

// Demote ADMIN to STAFF
exports.demoteToStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: "Only ADMIN users can be demoted to STAFF"
      });
    }

    await user.update({
      role: 'STAFF'
    });

    res.status(200).json({
      success: true,
      message: "User demoted to STAFF successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        new_role: user.role
      }
    });
  } catch (error) {
    console.error("Error demoting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to demote user",
      error: error.message
    });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deactivating SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate SUPER_ADMIN user"
      });
    }

    await user.update({
      is_active: false
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message
    });
  }
};

// Reactivate user
exports.reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.update({
      is_active: true
    });

    res.status(200).json({
      success: true,
      message: "User reactivated successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate user",
      error: error.message
    });
  }
};

// Update user department
exports.updateDepartment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { department_name, password } = req.body;

    // Validate required fields
    if (!department_name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required"
      });
    }

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent updating SUPER_ADMIN department
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Cannot update SUPER_ADMIN department"
      });
    }

    // List of valid departments (based on your ENUM in User model)
    const validDepartments = [
      "IT", "Finance", "Legal", "Treasury", 
      "Gold Loan", "Fixed Deposit", "N/A"
    ];

    // Validate department name
    if (!validDepartments.includes(department_name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Valid departments: ${validDepartments.join(", ")}`
      });
    }

    // Update department
    await user.update({
      department_name: department_name
    });

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        department_name: user.department_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message
    });
  }
};

// Bulk role update
exports.bulkRoleUpdate = async (req, res) => {
  try {
    const { updates, password } = req.body;

    // Verify SUPER_ADMIN password
    const superAdmin = await User.findByPk(req.user.user_id);
    if (superAdmin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid SUPER_ADMIN password"
      });
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updates provided"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const user = await User.findByPk(update.userId);
        
        if (!user) {
          results.failed.push({ userId: update.userId, reason: "User not found" });
          continue;
        }

        if (user.role === 'SUPER_ADMIN') {
          results.failed.push({ userId: update.userId, reason: "Cannot modify SUPER_ADMIN" });
          continue;
        }

        if (update.action === 'promote' && user.role === 'STAFF') {
          await user.update({ role: 'ADMIN' });
          results.successful.push({ userId: update.userId, new_role: 'ADMIN' });
        } 
        else if (update.action === 'demote' && user.role === 'ADMIN') {
          await user.update({ role: 'STAFF' });
          results.successful.push({ userId: update.userId, new_role: 'STAFF' });
        }
        else {
          results.failed.push({ 
            userId: update.userId, 
            reason: `Cannot ${update.action} user with role ${user.role}` 
          });
        }
      } catch (error) {
        results.failed.push({ userId: update.userId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk update",
      error: error.message
    });
  }
};

// Get role change statistics
exports.getRoleChangeStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    
    const activeUsers = {
      SUPER_ADMIN: await User.count({ where: { role: 'SUPER_ADMIN', is_active: true } }),
      ADMIN: await User.count({ where: { role: 'ADMIN', is_active: true } }),
      STAFF: await User.count({ where: { role: 'STAFF', is_active: true } })
    };
    
    const inactiveUsers = await User.count({ where: { is_active: false } });

    // Get department distribution
    const departmentStats = await User.findAll({
      where: {
        role: { [Op.ne]: 'SUPER_ADMIN' }
      },
      attributes: [
        'department_name',
        [User.sequelize.fn('COUNT', User.sequelize.col('user_id')), 'count']
      ],
      group: ['department_name']
    });

    res.status(200).json({
      success: true,
      message: "Statistics fetched successfully",
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        department_distribution: departmentStats
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};