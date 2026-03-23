const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔐 LOGIN
exports.login = async (req, res) => {
  try {
    const { user_name, password } = req.body;

    if (!user_name || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await User.findOne({ where: { user_name } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Plain password check (as per your requirement)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
      },
    });
  } catch (error) {
      console.error("ERROR:", error); // 👈 THIS LINE
      res.status(500).json({
      message: "Server error",
      error: error.message, // 👈 show actual error
  });
}
};

// 📝 REGISTER (ONLY SUPER_ADMIN)
exports.register = async (req, res) => {
  try {
    const { user_name, password, role, department_name } = req.body;

    if (!user_name || !password || !role || !department_name) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ❌ Prevent creating SUPER_ADMIN
    if (role === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot create SUPER_ADMIN via API" });
    }

    // ✅ Allow only ADMIN & STAFF
    const allowedRoles = ["ADMIN", "STAFF"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check existing user
    const existingUser = await User.findOne({ where: { user_name } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      user_name,
      password, // plain text (your requirement)
      role,
      department_name,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};