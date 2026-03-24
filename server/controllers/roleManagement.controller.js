// controllers/roleManagementController.js

const User = require("../models/User");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");

// Helper function to check if user exists and is manageable
const findAndValidateUser = async (userId, action) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  if (user.role === "SUPER_ADMIN") {
    throw new Error(`Cannot ${action} SUPER_ADMIN users`);
  }
  
  return user;
};

// Helper function to log role changes
const logRoleChange = async (changedBy, targetUser, oldRole, newRole, action) => {
  return {
    changed_by: changedBy.user_id,
    changed_by_name: changedBy.user_name,
    target_user_id: targetUser.user_id,
    target_user_name: targetUser.user_name,
    old_role: oldRole,
    new_role: newRole,
    action: action,
    timestamp: new Date()
  };
};

/**
 * Get all users (excluding SUPER_ADMIN) - for management interface
 * SUPER_ADMIN can see all ADMIN and STAFF users
 */
exports.getAllManageableUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    
    // Build where clause
    let whereClause = {
      role: ["ADMIN", "STAFF"]
    };
    
    // Filter by specific role if provided
    if (role && ["ADMIN", "STAFF"].includes(role)) {
      whereClause.role = role;
    }
    
    // Search by username or department
    if (search) {
      whereClause[Op.or] = [
        { user_name: { [Op.like]: `%${search}%` } },
        { department_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'createdAt', 'updatedAt'],
      order: [['role', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching manageable users:", error);
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

/**
 * Promote STAFF to ADMIN
 * Action: STAFF → ADMIN
 */
exports.promoteToAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const superAdmin = req.user;
    
    // Validate user exists and is STAFF
    const user = await findAndValidateUser(userId, "promote to ADMIN");
    
    if (user.role !== "STAFF") {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot promote user with role '${user.role}' to ADMIN. Only STAFF can be promoted.`
      });
    }
    
    // Store old role for logging
    const oldRole = user.role;
    
    // Update user role
    user.role = "ADMIN";
    await user.save({ transaction });
    
    // Log the role change
    const changeLog = await logRoleChange(superAdmin, user, oldRole, user.role, "PROMOTE_TO_ADMIN");
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${user.user_name} promoted from STAFF to ADMIN successfully`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          role: user.role,
          department_name: user.department_name,
          is_active: user.is_active
        },
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error promoting user to ADMIN:", error);
    
    if (error.message.includes("Cannot promote")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to promote user",
      error: error.message
    });
  }
};

/**
 * Demote ADMIN to STAFF
 * Action: ADMIN → STAFF
 */
exports.demoteToStaff = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const superAdmin = req.user;
    
    // Validate user exists and is ADMIN
    const user = await findAndValidateUser(userId, "demote to STAFF");
    
    if (user.role !== "ADMIN") {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot demote user with role '${user.role}' to STAFF. Only ADMIN can be demoted.`
      });
    }
    
    // Store old role for logging
    const oldRole = user.role;
    
    // Update user role
    user.role = "STAFF";
    await user.save({ transaction });
    
    // Log the role change
    const changeLog = await logRoleChange(superAdmin, user, oldRole, user.role, "DEMOTE_TO_STAFF");
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${user.user_name} demoted from ADMIN to STAFF successfully`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          role: user.role,
          department_name: user.department_name,
          is_active: user.is_active
        },
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error demoting user to STAFF:", error);
    
    if (error.message.includes("Cannot demote")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to demote user",
      error: error.message
    });
  }
};

/**
 * Remove/Delete a user (ADMIN or STAFF)
 * This will soft delete (set is_active to false)
 */
exports.removeUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const superAdmin = req.user;
    
    // Validate user exists and is not SUPER_ADMIN
    const user = await findAndValidateUser(userId, "remove");
    
    // Check if user is trying to remove themselves
    if (user.user_id === superAdmin.user_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "You cannot remove your own account" });
    }
    
    // Store user info for response
    const removedUser = {
      user_id: user.user_id,
      user_name: user.user_name,
      role: user.role,
      department_name: user.department_name
    };
    
    // Soft delete (set is_active to false)
    user.is_active = false;
    await user.save({ transaction });
    
    // Log the removal
    const changeLog = await logRoleChange(superAdmin, user, user.role, null, "REMOVE_USER");
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${removedUser.user_name} (${removedUser.role}) removed successfully`,
      data: {
        removed_user: removedUser,
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error removing user:", error);
    
    if (error.message.includes("Cannot remove")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to remove user",
      error: error.message
    });
  }
};

/**
 * Reactivate a deactivated user
 */
exports.reactivateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const superAdmin = req.user;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot reactivate SUPER_ADMIN users" });
    }
    
    if (user.is_active === true) {
      return res.status(400).json({ message: "User is already active" });
    }
    
    // Reactivate user
    user.is_active = true;
    await user.save({ transaction });
    
    // Log reactivation
    const changeLog = await logRoleChange(superAdmin, user, null, null, "REACTIVATE_USER");
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${user.user_name} reactivated successfully`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          role: user.role,
          department_name: user.department_name,
          is_active: user.is_active
        },
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error reactivating user:", error);
    return res.status(500).json({
      message: "Failed to reactivate user",
      error: error.message
    });
  }
};

exports.deactivateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const superAdmin = req.user;
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deactivating SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      await transaction.rollback();
      return res.status(403).json({ message: "Cannot deactivate SUPER_ADMIN users" });
    }
    
    // Check if user is trying to deactivate themselves
    if (user.user_id === superAdmin.user_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    
    // Check if user is already deactivated
    if (user.is_active === false) {
      await transaction.rollback();
      return res.status(400).json({ message: "User is already deactivated" });
    }
    
    // Store user info for response
    const deactivatedUser = {
      user_id: user.user_id,
      user_name: user.user_name,
      role: user.role,
      department_name: user.department_name
    };
    
    // Deactivate user
    user.is_active = false;
    await user.save({ transaction });
    
    // Log the deactivation
    const changeLog = {
      changed_by: superAdmin.user_id,
      changed_by_name: superAdmin.user_name,
      target_user_id: user.user_id,
      target_user_name: user.user_name,
      action: "DEACTIVATE_USER",
      timestamp: new Date()
    };
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${deactivatedUser.user_name} (${deactivatedUser.role}) deactivated successfully`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          role: user.role,
          department_name: user.department_name,
          is_active: user.is_active
        },
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error deactivating user:", error);
    return res.status(500).json({
      message: "Failed to deactivate user",
      error: error.message
    });
  }
};

/**
 * Bulk role update (for multiple users at once)
 */
exports.bulkRoleUpdate = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { updates } = req.body;
    const superAdmin = req.user;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Invalid updates data" });
    }
    
    const results = [];
    const errors = [];
    
    for (const update of updates) {
      try {
        const { userId, action } = update;
        
        if (!userId || !action) {
          errors.push({ userId, error: "Missing userId or action" });
          continue;
        }
        
        const user = await findAndValidateUser(userId, "update");
        
        let oldRole = user.role;
        let newRole = null;
        let actionType = null;
        
        if (action === 'promote' && user.role === 'STAFF') {
          newRole = 'ADMIN';
          actionType = 'PROMOTE_TO_ADMIN';
        } else if (action === 'demote' && user.role === 'ADMIN') {
          newRole = 'STAFF';
          actionType = 'DEMOTE_TO_STAFF';
        } else {
          errors.push({ userId, error: `Invalid action '${action}' for user with role '${user.role}'` });
          continue;
        }
        
        // Update user role
        user.role = newRole;
        await user.save({ transaction });
        
        // Log change
        const changeLog = await logRoleChange(superAdmin, user, oldRole, newRole, actionType);
        
        results.push({
          user_id: userId,
          user_name: user.user_name,
          old_role: oldRole,
          new_role: newRole,
          change_log: changeLog
        });
        
      } catch (error) {
        errors.push({ userId: update.userId, error: error.message });
      }
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: "Bulk role update completed",
      data: {
        successful: results,
        failed: errors,
        total_processed: updates.length,
        total_successful: results.length,
        total_failed: errors.length
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error in bulk role update:", error);
    return res.status(500).json({
      message: "Failed to perform bulk role update",
      error: error.message
    });
  }
};

/**
 * Get user by ID with details
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot view SUPER_ADMIN details" });
    }
    
    return res.status(200).json({
      message: "User retrieved successfully",
      data: user
    });
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      message: "Failed to fetch user",
      error: error.message
    });
  }
};

/**
 * Get role change statistics
 */
exports.getRoleChangeStats = async (req, res) => {
  try {
    // Get counts of users by role and status
    const staffCount = await User.count({ where: { role: "STAFF", is_active: true } });
    const adminCount = await User.count({ where: { role: "ADMIN", is_active: true } });
    const superAdminCount = await User.count({ where: { role: "SUPER_ADMIN", is_active: true } });
    const inactiveUsers = await User.count({ where: { is_active: false } });
    
    return res.status(200).json({
      message: "Role statistics retrieved",
      data: {
        active_users: {
          SUPER_ADMIN: superAdminCount,
          ADMIN: adminCount,
          STAFF: staffCount,
          total: staffCount + adminCount + superAdminCount
        },
        inactive_users: inactiveUsers,
        total_users: staffCount + adminCount + superAdminCount + inactiveUsers
      }
    });
    
  } catch (error) {
    console.error("Error fetching role stats:", error);
    return res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};

/**
 * Get all STAFF users (for ADMIN/SuperAdmin reference)
 */
exports.getAllStaffUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let whereClause = {
      role: "STAFF",
      is_active: true
    };
    
    if (search) {
      whereClause.user_name = { [Op.like]: `%${search}%` };
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: staffUsers } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['user_id', 'user_name', 'department_name', 'createdAt'],
      order: [['user_name', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    return res.status(200).json({
      message: "Staff users retrieved successfully",
      data: {
        users: staffUsers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching staff users:", error);
    return res.status(500).json({
      message: "Failed to fetch staff users",
      error: error.message
    });
  }
};

/**
 * Get all ADMIN users (for SuperAdmin reference)
 */
exports.getAllAdminUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let whereClause = {
      role: "ADMIN",
      is_active: true
    };
    
    if (search) {
      whereClause.user_name = { [Op.like]: `%${search}%` };
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: adminUsers } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['user_id', 'user_name', 'department_name', 'createdAt'],
      order: [['user_name', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    return res.status(200).json({
      message: "Admin users retrieved successfully",
      data: {
        users: adminUsers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return res.status(500).json({
      message: "Failed to fetch admin users",
      error: error.message
    });
  }
};

/**
 * Update user department
 */
exports.updateUserDepartment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const { department_name } = req.body;
    const superAdmin = req.user;
    
    if (!department_name) {
      return res.status(400).json({ message: "Department name is required" });
    }
    
    const user = await findAndValidateUser(userId, "update department");
    
    const oldDepartment = user.department_name;
    user.department_name = department_name;
    await user.save({ transaction });
    
    const changeLog = await logRoleChange(superAdmin, user, null, null, "UPDATE_DEPARTMENT");
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `User ${user.user_name} department updated from ${oldDepartment} to ${department_name}`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name,
          role: user.role,
          department_name: user.department_name,
          is_active: user.is_active
        },
        change_log: changeLog
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating user department:", error);
    return res.status(500).json({
      message: "Failed to update user department",
      error: error.message
    });
  }
};