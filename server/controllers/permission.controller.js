// controllers/permissionController.js

const User = require("../models/User");
const Permission = require("../models/Permission");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");

// Available permissions list
const AVAILABLE_PERMISSIONS = [
  { id: "ADD_ASSETS", label: "Add Assets", description: "Can add new assets to the system" },
  { id: "ALLOCATE_ASSETS", label: "Allocate Assets", description: "Can allocate assets to departments" },
  { id: "VIEW_ASSETS_LIST", label: "View Assets List", description: "Can view all assets" },
  { id: "VIEW_ALLOCATIONS_LIST", label: "View Allocations List", description: "Can view all asset allocations" },
  { id: "MANAGE_HANDOVER", label: "Manage Handover", description: "Can manage asset handovers" },
  { id: "VIEW_REPORTS", label: "View Reports", description: "Can view system reports" },
  { id: "MANAGE_USERS", label: "Manage Users", description: "Can manage users" }
];

// Helper function to verify SUPER_ADMIN password
const verifySuperAdminPassword = async (superAdminId, password) => {
  const superAdmin = await User.findByPk(superAdminId);
  
  if (!superAdmin) {
    throw new Error("Super Admin not found");
  }
  
  if (superAdmin.role !== "SUPER_ADMIN") {
    throw new Error("User is not SUPER_ADMIN");
  }
  
  if (superAdmin.password !== password) {
    throw new Error("Invalid password");
  }
  
  return superAdmin;
};

/**
 * Get all users with their current active permissions
 */
exports.getAllUsersWithPermissions = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    let whereClause = {
      role: { [Op.ne]: "SUPER_ADMIN" }
    };
    
    if (search) {
      whereClause[Op.or] = [
        { user_name: { [Op.like]: `%${search}%` } },
        { department_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Get active permissions for each user
    const usersWithPermissions = await Promise.all(users.map(async (user) => {
      const permissions = await Permission.findAll({
        where: { 
          user_id: user.user_id, 
          status: "ACTIVE" 
        },
        attributes: ['permission_type', 'granted_at', 'granted_by'],
        order: [['granted_at', 'DESC']]
      });
      
      return {
        ...user.toJSON(),
        permissions: permissions.map(p => ({
          type: p.permission_type,
          granted_at: p.granted_at
        }))
      };
    }));
    
    return res.status(200).json({
      message: "Users retrieved successfully",
      data: {
        users: usersWithPermissions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

/**
 * Get available permissions list
 */
exports.getAvailablePermissions = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Available permissions retrieved",
      data: AVAILABLE_PERMISSIONS
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch permissions",
      error: error.message
    });
  }
};

/**
 * Get user's permission history and current permissions
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'user_name', 'role', 'department_name', 'is_active']
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get current active permissions
    const activePermissions = await Permission.findAll({
      where: { 
        user_id: userId, 
        status: "ACTIVE" 
      },
      attributes: ['permission_type', 'granted_at', 'granted_by'],
      order: [['granted_at', 'DESC']]
    });
    
    // Get permission history (all records)
    const permissionHistory = await Permission.findAll({
      where: { user_id: userId },
      attributes: ['permission_type', 'action', 'status', 'granted_at', 'revoked_at', 'granted_by', 'revoked_by', 'remarks'],
      order: [['granted_at', 'DESC']],
      limit: 50
    });
    
    return res.status(200).json({
      message: "User permissions retrieved",
      data: {
        user,
        active_permissions: activePermissions.map(p => p.permission_type),
        permission_history: permissionHistory,
        available_permissions: AVAILABLE_PERMISSIONS
      }
    });
    
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return res.status(500).json({
      message: "Failed to fetch permissions",
      error: error.message
    });
  }
};

/**
 * Grant permission to user (creates new record)
 */
exports.grantPermission = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const { permission_type, remarks, password } = req.body;
    const superAdmin = req.user;
    
    // Verify SUPER_ADMIN password
    if (!password) {
      return res.status(400).json({ message: "Password is required for this action" });
    }
    
    await verifySuperAdminPassword(superAdmin.user_id, password);
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role === "SUPER_ADMIN") {
      await transaction.rollback();
      return res.status(403).json({ message: "Cannot modify SUPER_ADMIN permissions" });
    }
    
    // Validate permission type
    const validPermissions = AVAILABLE_PERMISSIONS.map(p => p.id);
    if (!validPermissions.includes(permission_type)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid permission type" });
    }
    
    // Check if permission already active
    const existingPermission = await Permission.findOne({
      where: {
        user_id: userId,
        permission_type: permission_type,
        status: "ACTIVE"
      }
    });
    
    if (existingPermission) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `User already has active permission: ${permission_type}` 
      });
    }
    
    // Create new permission record (GRANT)
    const newPermission = await Permission.create({
      user_id: userId,
      permission_type: permission_type,
      action: "GRANT",
      status: "ACTIVE",
      granted_by: superAdmin.user_id,
      granted_at: new Date(),
      remarks: remarks || `Granted by ${superAdmin.user_name}`
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `Permission ${permission_type} granted to ${user.user_name} successfully`,
      data: {
        permission: {
          permission_id: newPermission.permission_id,
          user_id: userId,
          user_name: user.user_name,
          permission_type: permission_type,
          action: "GRANT",
          status: "ACTIVE",
          granted_at: newPermission.granted_at,
          remarks: newPermission.remarks
        }
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error granting permission:", error);
    
    if (error.message.includes("Invalid password")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to grant permission",
      error: error.message
    });
  }
};

/**
 * Revoke permission from user (creates new record)
 */
exports.revokePermission = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId, permissionType } = req.params;
    const { remarks, password } = req.body;
    const superAdmin = req.user;
    
    // Verify SUPER_ADMIN password
    if (!password) {
      return res.status(400).json({ message: "Password is required for this action" });
    }
    
    await verifySuperAdminPassword(superAdmin.user_id, password);
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find active permission
    const activePermission = await Permission.findOne({
      where: {
        user_id: userId,
        permission_type: permissionType,
        status: "ACTIVE"
      }
    });
    
    if (!activePermission) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: `No active permission found for: ${permissionType}` 
      });
    }
    
    // Update the existing record to REVOKED
    activePermission.status = "REVOKED";
    activePermission.revoked_at = new Date();
    activePermission.revoked_by = superAdmin.user_id;
    activePermission.remarks = remarks || `Revoked by ${superAdmin.user_name}`;
    await activePermission.save({ transaction });
    
    // Create a new record for REVOKE action
    const revokeRecord = await Permission.create({
      user_id: userId,
      permission_type: permissionType,
      action: "REVOKE",
      status: "REVOKED",
      granted_by: superAdmin.user_id,
      granted_at: new Date(),
      revoked_at: new Date(),
      revoked_by: superAdmin.user_id,
      remarks: remarks || `Revoked by ${superAdmin.user_name}`
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `Permission ${permissionType} revoked from ${user.user_name} successfully`,
      data: {
        permission: {
          permission_id: revokeRecord.permission_id,
          user_id: userId,
          user_name: user.user_name,
          permission_type: permissionType,
          action: "REVOKE",
          status: "REVOKED",
          revoked_at: revokeRecord.revoked_at,
          remarks: revokeRecord.remarks
        }
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error revoking permission:", error);
    
    if (error.message.includes("Invalid password")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to revoke permission",
      error: error.message
    });
  }
};

/**
 * Grant multiple permissions at once
 */
exports.grantMultiplePermissions = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId } = req.params;
    const { permissions, remarks, password } = req.body;
    const superAdmin = req.user;
    
    // Verify SUPER_ADMIN password
    if (!password) {
      return res.status(400).json({ message: "Password is required for this action" });
    }
    
    await verifySuperAdminPassword(superAdmin.user_id, password);
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Permissions must be a non-empty array" });
    }
    
    const validPermissions = AVAILABLE_PERMISSIONS.map(p => p.id);
    const results = [];
    const errors = [];
    
    for (const permissionType of permissions) {
      try {
        // Validate permission
        if (!validPermissions.includes(permissionType)) {
          errors.push({ permission: permissionType, error: "Invalid permission type" });
          continue;
        }
        
        // Check if already active
        const existing = await Permission.findOne({
          where: {
            user_id: userId,
            permission_type: permissionType,
            status: "ACTIVE"
          }
        });
        
        if (existing) {
          errors.push({ permission: permissionType, error: "Already active" });
          continue;
        }
        
        // Grant permission
        const newPermission = await Permission.create({
          user_id: userId,
          permission_type: permissionType,
          action: "GRANT",
          status: "ACTIVE",
          granted_by: superAdmin.user_id,
          granted_at: new Date(),
          remarks: remarks || `Granted by ${superAdmin.user_name}`
        }, { transaction });
        
        results.push({
          permission: permissionType,
          status: "GRANTED",
          permission_id: newPermission.permission_id
        });
        
      } catch (error) {
        errors.push({ permission: permissionType, error: error.message });
      }
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      message: `Granted ${results.length} permissions to ${user.user_name}`,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name
        },
        successful: results,
        failed: errors,
        total: permissions.length,
        granted: results.length,
        failed_count: errors.length
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error("Error granting multiple permissions:", error);
    
    if (error.message.includes("Invalid password")) {
      return res.status(400).json({ message: error.message });
    }
    
    return res.status(500).json({
      message: "Failed to grant permissions",
      error: error.message
    });
  }
};

/**
 * Get permission history for a user
 */
exports.getPermissionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: history } = await Permission.findAndCountAll({
      where: { user_id: userId },
      attributes: ['permission_id', 'permission_type', 'action', 'status', 'granted_at', 'revoked_at', 'granted_by', 'revoked_by', 'remarks'],
      order: [['granted_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Get grantor names
    const historyWithNames = await Promise.all(history.map(async (record) => {
      const grantor = await User.findByPk(record.granted_by, {
        attributes: ['user_name']
      });
      
      let revoker = null;
      if (record.revoked_by) {
        revoker = await User.findByPk(record.revoked_by, {
          attributes: ['user_name']
        });
      }
      
      return {
        ...record.toJSON(),
        granted_by_name: grantor ? grantor.user_name : 'Unknown',
        revoked_by_name: revoker ? revoker.user_name : null
      };
    }));
    
    return res.status(200).json({
      message: "Permission history retrieved",
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name
        },
        history: historyWithNames,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching permission history:", error);
    return res.status(500).json({
      message: "Failed to fetch permission history",
      error: error.message
    });
  }
};

/**
 * Get all active permissions for a user (for permission checking)
 */
exports.getActivePermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activePermissions = await Permission.findAll({
      where: {
        user_id: userId,
        status: "ACTIVE"
      },
      attributes: ['permission_type', 'granted_at'],
      order: [['granted_at', 'ASC']]
    });
    
    return res.status(200).json({
      message: "Active permissions retrieved",
      data: {
        user_id: userId,
        permissions: activePermissions.map(p => p.permission_type),
        count: activePermissions.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching active permissions:", error);
    return res.status(500).json({
      message: "Failed to fetch active permissions",
      error: error.message
    });
  }
};