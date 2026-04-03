const Branch = require("../Branch");
const Department = require("../Department");
const User = require("../User");
const Asset = require("../Asset");
const AssetAllocation = require("../AssetAllocation");
const HandoverRequest = require("../HandoverRequest");
const Permission = require("../Permission");
const DisposedAsset = require("../DisposedAsset");

// Branch → Department
Branch.hasMany(Department, { foreignKey: "branch_id" });
Department.belongsTo(Branch, { foreignKey: "branch_id" });

// Department → User
Department.hasMany(User, { foreignKey: "department_id" });
User.belongsTo(Department, { foreignKey: "department_id" });

// Department → AssetAllocation
Department.hasMany(AssetAllocation, { foreignKey: "department_id" });
AssetAllocation.belongsTo(Department, { foreignKey: "department_id" });

// Asset → Allocation
Asset.hasMany(AssetAllocation, { foreignKey: "asset_id" });
AssetAllocation.belongsTo(Asset, { foreignKey: "asset_id" });

// Asset → Handover
Asset.hasMany(HandoverRequest, { foreignKey: "asset_id" });
HandoverRequest.belongsTo(Asset, { foreignKey: "asset_id" });

// User → AssetAllocation (for allocated_by)
User.hasMany(AssetAllocation, { foreignKey: "allocated_by", as: "allocations" });
AssetAllocation.belongsTo(User, { foreignKey: "allocated_by", as: "allocator" });

// User → HandoverRequest (for requested_by)
User.hasMany(HandoverRequest, { foreignKey: "requested_by", as: "handovers" });
HandoverRequest.belongsTo(User, { foreignKey: "requested_by", as: "requester" });

// User → Permission
User.hasMany(Permission, { foreignKey: "user_id" });
Permission.belongsTo(User, { foreignKey: "user_id" });

// Permission → Granted By User
Permission.belongsTo(User, { foreignKey: "granted_by", as: "grantor" });
Permission.belongsTo(User, { foreignKey: "revoked_by", as: "revoker" });

// Asset → DisposedAsset
Asset.hasOne(DisposedAsset, { foreignKey: "asset_id" });
DisposedAsset.belongsTo(Asset, { foreignKey: "asset_id" });

module.exports = {
  Branch,
  Department,
  User,
  Asset,
  AssetAllocation,
  HandoverRequest,
  Permission,
  DisposedAsset,
};