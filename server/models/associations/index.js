// models/associations/index.js
const Branch = require("../Branch");
const Department = require("../Department");
const User = require("../User");
const Asset = require("../Asset");
const AssetRequest = require("../AssetRequest");
const AssetAllocation = require("../AssetAllocation");
const HandoverRequest = require("../HandoverRequest");

/* Branch → Department */
Branch.hasMany(Department, { foreignKey: "branch_id" });
Department.belongsTo(Branch, { foreignKey: "branch_id" });

/* Department → User */
Department.hasMany(User, { foreignKey: "department_id" });
User.belongsTo(Department, { foreignKey: "department_id" });

/* Department → AssetRequest */
Department.hasMany(AssetRequest, { foreignKey: "department_id" });
AssetRequest.belongsTo(Department, { foreignKey: "department_id" });

/* Department → AssetAllocation */
Department.hasMany(AssetAllocation, { foreignKey: "department_id" });
AssetAllocation.belongsTo(Department, { foreignKey: "department_id" });

/* Asset → Allocation */
Asset.hasMany(AssetAllocation, { foreignKey: "asset_id" });
AssetAllocation.belongsTo(Asset, { foreignKey: "asset_id" });

/* AssetRequest → Allocation */
// AssetRequest.hasMany(AssetAllocation, { foreignKey: "req_id" });
// AssetAllocation.belongsTo(AssetRequest, { foreignKey: "req_id" });

/* Asset → Handover */
Asset.hasMany(HandoverRequest, { foreignKey: "asset_id" });
HandoverRequest.belongsTo(Asset, { foreignKey: "asset_id" });

/* User → AssetAllocation (for allocated_by) */
User.hasMany(AssetAllocation, { foreignKey: "allocated_by", as: "allocations" });
AssetAllocation.belongsTo(User, { foreignKey: "allocated_by", as: "allocator" });

/* User → HandoverRequest (for requested_by) */
User.hasMany(HandoverRequest, { foreignKey: "requested_by", as: "handovers" });
HandoverRequest.belongsTo(User, { foreignKey: "requested_by", as: "requester" });

module.exports = {
  Branch,
  Department,
  User,
  Asset,
  AssetRequest,
  AssetAllocation,
  HandoverRequest,
};