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
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active in database
    const user = await User.findByPk(decoded.user_id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User no longer exists" 
      });
    }
    
    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({ 
        success: false,
        message: "Account is deactivated. Please contact SUPER_ADMIN." 
      });
    }
    
    // Attach full user object to request
    req.user = {
      user_id: decoded.user_id,
      user_name: user.user_name,
      role: user.role,
      department_name: user.department_name,
      is_active: user.is_active,
      ...decoded
    };
    
    // Attach the raw user model if needed
    req.userModel = user;
    
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        message: "Token expired. Please login again." 
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: "Authentication failed" 
    });
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
      return res.status(403).json({ 
        success: false,
        message: "Access denied: No role information" 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
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
      success: false,
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
      success: false,
      message: "Access denied. ADMIN or SUPER_ADMIN privileges required." 
    });
  }
  next();
};

/**
 * ADMIN, MANAGER, or SUPER_ADMIN only middleware
 * For asset management routes
 */
exports.allowAssetManagement = (req, res, next) => {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "manager"];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: "Access denied. Only ADMIN, Manager, or SUPER_ADMIN can perform this action." 
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
  
  // For STAFF and manager, check if they're accessing their own department
  const targetDepartmentId = req.params.departmentId || req.body.department_id || req.query.department_id;
  
  if (targetDepartmentId && req.user.department_name !== targetDepartmentId) {
    return res.status(403).json({ 
      success: false,
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
    
    // For STAFF and manager, check if they own the resource
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.user_id !== resourceUserId) {
        return res.status(403).json({ 
          success: false,
          message: "Access denied. You can only access your own resources." 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Error checking resource ownership" 
      });
    }
  };
};

/**
 * Permission-based access control (more granular than roles)
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
          'view_reports', 'export_data', 'system_config',
          'manage_departments', 'view_all_departments'
        ],
        ADMIN: [
          'view_users', 'create_users', 'update_users',
          'view_assets', 'create_assets', 'update_assets',
          'allocate_assets', 'view_allocations', 'manage_allocations',
          'view_reports', 'view_department_assets'
        ],
        manager: [
          'view_assets', 'create_assets', 'update_assets',
          'allocate_assets', 'view_allocations',
          'view_department_reports'
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
          success: false,
          message: `Access denied. Required permissions: ${requiredPermissions.join(", ")}` 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        message: "Error checking permissions" 
      });
    }
  };
};

/**
 * Log user actions middleware
 * For audit trails and activity logging
 */
exports.logUserAction = (actionType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json;
    
    // Capture response data
    res.json = function(data) {
      res.responseData = data;
      return originalJson.call(this, data);
    };
    
    // Store original end function to capture response
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      
      // Log the action (you can save to database or file)
      const logEntry = {
        timestamp: new Date().toISOString(),
        user_id: req.user?.user_id,
        user_name: req.user?.user_name,
        role: req.user?.role,
        department: req.user?.department_name,
        action: actionType,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        requestBody: req.method !== 'GET' ? req.body : undefined,
        responseStatus: res.responseData?.success ? 'SUCCESS' : 'FAILED'
      };
      
      // Log to console (in production, save to database)
      console.log(JSON.stringify(logEntry));
      
      originalEnd.apply(this, args);
    };
    
    next();
  };
};

/**
 * Optional: Rate limiting middleware for sensitive operations
 * This is a simple implementation - consider using express-rate-limit for production
 */
const operationCounts = new Map();

exports.sensitiveOperationLimit = (limit = 5, windowMs = 60000) => {
  return (req, res, next) => {
    const key = `${req.user?.user_id}:${req.path}`;
    const now = Date.now();
    
    if (!operationCounts.has(key)) {
      operationCounts.set(key, []);
    }
    
    const timestamps = operationCounts.get(key).filter(t => now - t < windowMs);
    
    if (timestamps.length >= limit) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${windowMs / 1000} seconds before trying again.`
      });
    }
    
    timestamps.push(now);
    operationCounts.set(key, timestamps);
    next();
  };
};

/**
 * Optional: Check if user has specific role or higher
 */
exports.hasMinRole = (minRole) => {
  const roleHierarchy = {
    'STAFF': 1,
    'manager': 2,
    'ADMIN': 3,
    'SUPER_ADMIN': 4
  };
  
  return (req, res, next) => {
    const userRoleLevel = roleHierarchy[req.user?.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;
    
    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum required role: ${minRole}`
      });
    }
    
    next();
  };
};

/**
 * Combined middleware for role management routes
 * Ensures user is SUPER_ADMIN and logs all actions
 */
exports.roleManagementAuth = [
  exports.verifyToken,
  exports.allowSuperAdmin,
  exports.logUserAction('ROLE_MANAGEMENT')
];

/**
 * Combined middleware for asset management routes
 * Allows ADMIN, MANAGER, and SUPER_ADMIN
 */
exports.assetManagementAuth = [
  exports.verifyToken,
  exports.allowAssetManagement,
  exports.logUserAction('ASSET_MANAGEMENT')
];

/**
 * Combined middleware for allocation routes
 */
exports.allocationAuth = [
  exports.verifyToken,
  exports.allowAdminOrSuperAdmin,
  exports.logUserAction('ALLOCATION_MANAGEMENT')
];