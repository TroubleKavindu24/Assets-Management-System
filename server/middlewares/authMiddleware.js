const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT Token
exports.verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains user_id, role, department_id
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Check for roles
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};