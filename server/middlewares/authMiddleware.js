// middleware/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT Token Middleware
 * Extracts and verifies the JWT token from Authorization header
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Check if user still exists and is active in database
    // This adds an extra layer of security - if user was deleted/deactivated after token was issued
    const user = await User.findByPk(decoded.user_id);
    
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    
    // Check if user is active (if you have is_active field)
    if (user.is_active === false) {
      return res.status(401).json({ message: "Account is deactivated" });
    }
    
    // Attach full user object to request for convenience
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
      user_name: user.user_name,
      department_name: user.department_name,
      ...decoded // Keep any additional fields from token
    };
    
    // Also attach the raw user model if needed
    req.userModel = user;
    
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
};

/**
 * Role-based access control middleware
 * Checks if user's role is in the allowed roles list
 * 
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied: No role information" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(", ")}. Your role: ${req.user.role}` 
      });
    }
    next();
  };
};

/**
 * SUPER_ADMIN only middleware
 * Convenience middleware for SUPER_ADMIN only routes
 */
exports.allowSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ 
      message: "Access denied. SUPER_ADMIN privileges required." 
    });
  }
  next();
};

/**
 * ADMIN or SUPER_ADMIN only middleware
 * For routes that can be accessed by both ADMIN and SUPER_ADMIN
 */
exports.allowAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    return res.status(403).json({ 
      message: "Access denied. ADMIN or SUPER_ADMIN privileges required." 
    });
  }
  next();
};

/**
 * Department-based access control
 * Checks if user belongs to the same department (for STAFF users)
 * ADMIN and SUPER_ADMIN can access all departments
 */
exports.allowSameDepartment = (req, res, next) => {
  // SUPER_ADMIN and ADMIN can access all departments
  if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
    return next();
  }
  
  // For STAFF, check if they're accessing their own department
  const targetDepartmentId = req.params.departmentId || req.body.department_id;
  
  if (targetDepartmentId && req.user.department_id !== targetDepartmentId) {
    return res.status(403).json({ 
      message: "Access denied. You can only access your own department resources." 
    });
  }
  
  next();
};

/**
 * Resource ownership check middleware
 * For checking if user owns the resource they're trying to access/modify
 */
exports.allowOwnResource = (getResourceUserId) => {
  return async (req, res, next) => {
    // SUPER_ADMIN and ADMIN can access any resource
    if (req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN") {
      return next();
    }
    
    // For STAFF, check if they own the resource
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.user_id !== resourceUserId) {
        return res.status(403).json({ 
          message: "Access denied. You can only access your own resources." 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: "Error checking resource ownership" });
    }
  };
};

/**
 * Optional: Permission-based access control (more granular than roles)
 * You can define permissions like: 'manage_users', 'view_assets', 'allocate_assets', etc.
 */
exports.allowPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Define role-based permissions mapping
      const rolePermissions = {
        SUPER_ADMIN: [
          'manage_users', 'view_users', 'create_users', 'update_users', 'delete_users',
          'manage_roles', 'view_roles', 'update_roles',
          'manage_assets', 'view_assets', 'create_assets', 'update_assets', 'delete_assets',
          'allocate_assets', 'view_allocations', 'manage_allocations',
          'view_reports', 'export_data', 'system_config'
        ],
        ADMIN: [
          'view_users', 'create_users', 'update_users',
          'view_assets', 'create_assets', 'update_assets',
          'allocate_assets', 'view_allocations',
          'view_reports'
        ],
        STAFF: [
          'view_assets', 'request_assets', 'view_my_allocations'
        ]
      };
      
      const userPermissions = rolePermissions[req.user.role] || [];
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Access denied. Required permissions: ${requiredPermissions.join(", ")}` 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: "Error checking permissions" });
    }
  };
};

/**
 * Rate limiting middleware for sensitive operations
 * You can implement this with express-rate-limit or similar
 */
exports.sensitiveOperationLimit = (req, res, next) => {
  // This is a placeholder - implement actual rate limiting as needed
  // You might want to use express-rate-limit package
  next();
};

/**
 * Log user actions middleware (optional)
 * Useful for audit trails
 */
exports.logUserAction = (actionType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      
      // Log the action (you can save to database or file)
      console.log({
        timestamp: new Date().toISOString(),
        user_id: req.user?.user_id,
        user_name: req.user?.user_name,
        role: req.user?.role,
        action: actionType,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
};