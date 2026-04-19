const User = require("../models/User");
const RoleChangeLog = require("../models/RoleChangeLog");

/**
 * Get all users (ADMIN + STAFF)
 */
exports.getAllManageableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: ["ADMIN", "STAFF"]
      },
      attributes: { exclude: ["password"] }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Promote STAFF → ADMIN
 */
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const superAdmin = await User.findByPk(req.user.user_id);

    if (!password || superAdmin.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role !== "STAFF") {
      return res.status(400).json({ success: false, message: "Only STAFF can be promoted" });
    }

    const oldRole = user.role;

    await user.update({ role: "ADMIN" });

    await RoleChangeLog.create({
      changed_by: req.user.user_id,
      target_user_id: user.user_id,
      target_user_name: user.user_name,
      old_role: oldRole,
      new_role: "ADMIN",
      action: "PROMOTE"
    });

    res.json({
      success: true,
      message: "User promoted to ADMIN",
      data: user
    });

  } catch (error) {
    console.error("Promote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Demote ADMIN → STAFF
 */
exports.demoteToStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    const superAdmin = await User.findByPk(req.user.user_id);

    if (!password || superAdmin.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role !== "ADMIN") {
      return res.status(400).json({ success: false, message: "Only ADMIN can be demoted" });
    }

    const oldRole = user.role;

    await user.update({ role: "STAFF" });

    await RoleChangeLog.create({
      changed_by: req.user.user_id,
      target_user_id: user.user_id,
      target_user_name: user.user_name,
      old_role: oldRole,
      new_role: "STAFF",
      action: "DEMOTE"
    });

    res.json({
      success: true,
      message: "User demoted to STAFF",
      data: user
    });

  } catch (error) {
    console.error("Demote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Deactivate user
 */
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.update({ is_active: false });

    res.json({ success: true, message: "User deactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reactivate user
 */
exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.update({ is_active: true });

    res.json({ success: true, message: "User reactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update department
 */
exports.updateDepartment = async (req, res) => {
  try {
    const { department } = req.body;

    const user = await User.findByPk(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.update({ department });

    res.json({ success: true, message: "Department updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk role update
 */
exports.bulkRoleUpdate = async (req, res) => {
  try {
    const { users } = req.body;

    for (const u of users) {
      const user = await User.findByPk(u.userId);
      if (user) {
        const oldRole = user.role;

        await user.update({ role: u.role });

        await RoleChangeLog.create({
          changed_by: req.user.user_id,
          target_user_id: user.user_id,
          target_user_name: user.user_name,
          old_role: oldRole,
          new_role: u.role,
          action: "BULK_UPDATE"
        });
      }
    }

    res.json({ success: true, message: "Bulk update completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get role change statistics
 */
exports.getRoleChangeStats = async (req, res) => {
  try {
    const logs = await RoleChangeLog.findAll();

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};