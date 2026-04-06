// middleware/permissionCheck.js
const Permission = require("../models/Permission");
const { ROLE_DEFAULT_PERMISSIONS } = require("../constants/permissions.constants");

/**
 * Check if user has specific permission
 */
const hasPermission = async (userId, permissionType, userRole) => {
  // SUPER_ADMIN has all permissions
  if (userRole === "SUPER_ADMIN") {
    return true;
  }
  
  // ADMIN has all asset management permissions by default
  if (userRole === "ADMIN") {
    const adminPermissions = ROLE_DEFAULT_PERMISSIONS.ADMIN;
    return adminPermissions.includes(permissionType);
  }
  
  // Check custom permissions for STAFF
  const permission = await Permission.findOne({
    where: {
      user_id: userId,
      permission_type: permissionType,
      status: "ACTIVE"
    }
  });
  
  return !!permission;
};

/**
 * Get user's effective permissions
 */
const getUserPermissions = async (userId, userRole) => {
  if (userRole === "SUPER_ADMIN") {
    return ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN;
  }
  
  if (userRole === "ADMIN") {
    return ROLE_DEFAULT_PERMISSIONS.ADMIN;
  }
  
  // Get STAFF custom permissions
  const permissions = await Permission.findAll({
    where: {
      user_id: userId,
      status: "ACTIVE"
    },
    attributes: ["permission_type"]
  });
  
  return permissions.map(p => p.permission_type);
};

/**
 * Middleware to check permission for routes
 */
const checkPermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const userRole = req.user.role;
      
      const hasAccess = await hasPermission(userId, permissionType, userRole);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have permission to ${permissionType.replace(/_/g, ' ').toLowerCase()}`,
          required_permission: permissionType
        });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Permission check failed",
        error: error.message 
      });
    }
  };
};

/**
 * Check if user has any of the listed permissions
 */
const checkAnyPermission = (permissionTypes) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const userRole = req.user.role;
      
      // SUPER_ADMIN has all permissions
      if (userRole === "SUPER_ADMIN") {
        return next();
      }
      
      // ADMIN has all asset management permissions
      if (userRole === "ADMIN") {
        const adminPermissions = ROLE_DEFAULT_PERMISSIONS.ADMIN;
        const hasAny = permissionTypes.some(p => adminPermissions.includes(p));
        if (hasAny) return next();
      }
      
      // Check STAFF custom permissions
      for (const permissionType of permissionTypes) {
        const hasAccess = await hasPermission(userId, permissionType, userRole);
        if (hasAccess) {
          return next();
        }
      }
      
      return res.status(403).json({
        success: false,
        message: `Access denied. You need at least one of these permissions: ${permissionTypes.join(", ")}`
      });
      
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Permission check failed",
        error: error.message 
      });
    }
  };
};

// Export all functions
module.exports = {
  hasPermission,
  getUserPermissions,
  checkPermission,
  checkAnyPermission
};