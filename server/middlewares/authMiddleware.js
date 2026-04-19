const jwt = require("jsonwebtoken");

// ================= VERIFY TOKEN =================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  console.log("AUTH HEADER:", authHeader);

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// ================= ROLE CHECK =================
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};

// ================= SUPER ADMIN ONLY =================
const allowSuperAdmin = allowRoles("SUPER_ADMIN");

// ================= ROLE MANAGEMENT AUTH =================
const roleManagementAuth = (req, res, next) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
  next();
};

// ================= SIMPLE RATE LIMIT =================
const sensitiveOperationLimit = (maxRequests, windowMs) => {
  let requests = {};

  return (req, res, next) => {
    const userId = req.user.user_id;
    const now = Date.now();

    if (!requests[userId]) {
      requests[userId] = [];
    }

    requests[userId] = requests[userId].filter(
      (time) => now - time < windowMs
    );

    if (requests[userId].length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    }

    requests[userId].push(now);
    next();
  };
};

module.exports = {
  verifyToken,
  allowRoles,
  allowSuperAdmin,
  roleManagementAuth,
  sensitiveOperationLimit,
};