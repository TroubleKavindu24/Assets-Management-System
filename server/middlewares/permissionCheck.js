// middleware/permissionCheck.js

const Permission = require("../models/Permission");

/**
 * Check if user has specific permission
 */
const hasPermission = async (userId, permissionType) => {
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
 * Middleware to check permission for routes
 */
exports.checkPermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const userRole = req.user.role;
      
      // SUPER_ADMIN has all permissions
      if (userRole === "SUPER_ADMIN") {
        return next();
      }
      
      // ADMIN has all permissions by default
      if (userRole === "ADMIN") {
        return next();
      }
      
      // Check custom permissions for STAFF
      const hasAccess = await hasPermission(userId, permissionType);
      
      if (!hasAccess) {
        return res.status(403).json({
          message: `Access denied. You don't have permission to ${permissionType.replace(/_/g, ' ').toLowerCase()}`
        });
      }
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
};

/**
 * Check if user has any of the listed permissions
 */
exports.checkAnyPermission = (permissionTypes) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const userRole = req.user.role;
      
      // SUPER_ADMIN has all permissions
      if (userRole === "SUPER_ADMIN") {
        return next();
      }
      
      // ADMIN has all permissions
      if (userRole === "ADMIN") {
        return next();
      }
      
      // Check if user has any of the required permissions
      for (const permissionType of permissionTypes) {
        const hasAccess = await hasPermission(userId, permissionType);
        if (hasAccess) {
          return next();
        }
      }
      
      return res.status(403).json({
        message: `Access denied. You need at least one of these permissions: ${permissionTypes.join(", ")}`
      });
      
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
};