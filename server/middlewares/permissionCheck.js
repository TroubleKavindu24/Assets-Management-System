const Permission = require("../models/Permission");
const { ROLE_DEFAULT_PERMISSIONS } = require("../constants/permissions.constants");

/**
 * Check if user has specific permission
 */
const hasPermission = async (userId, permissionType, userRole) => {
  try {
    if (userRole === "SUPER_ADMIN") return true;

    if (userRole === "ADMIN") {
      return ROLE_DEFAULT_PERMISSIONS.ADMIN.includes(permissionType);
    }

    const permission = await Permission.findOne({
      where: {
        user_id: userId,
        permission_type: permissionType,
        status: "ACTIVE"
      }
    });

    return !!permission;
  } catch (error) {
    console.error("hasPermission error:", error);
    return false;
  }
};

/**
 * Get user permissions
 */
const getUserPermissions = async (userId, userRole) => {
  try {
    if (userRole === "SUPER_ADMIN") return ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN;

    if (userRole === "ADMIN") return ROLE_DEFAULT_PERMISSIONS.ADMIN;

    const permissions = await Permission.findAll({
      where: {
        user_id: userId,
        status: "ACTIVE"
      },
      attributes: ["permission_type"]
    });

    return permissions.map(p => p.permission_type);
  } catch (error) {
    console.error("getUserPermissions error:", error);
    return [];
  }
};

/**
 * Middleware: check single permission
 */
const checkPermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const hasAccess = await hasPermission(
        req.user.user_id,
        permissionType,
        req.user.role
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied for ${permissionType}`
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
};

/**
 * Middleware: check multiple permissions
 */
const checkAnyPermission = (permissionTypes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (req.user.role === "SUPER_ADMIN") return next();

      if (req.user.role === "ADMIN") {
        const hasAny = permissionTypes.some(p =>
          ROLE_DEFAULT_PERMISSIONS.ADMIN.includes(p)
        );
        if (hasAny) return next();
      }

      for (const type of permissionTypes) {
        const hasAccess = await hasPermission(
          req.user.user_id,
          type,
          req.user.role
        );

        if (hasAccess) return next();
      }

      return res.status(403).json({
        success: false,
        message: "No required permissions"
      });

    } catch (error) {
      console.error("checkAnyPermission error:", error);
      res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
};

module.exports = {
  hasPermission,
  getUserPermissions,
  checkPermission,
  checkAnyPermission
};