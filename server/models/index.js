const Branch = require("./Branch");
const Department = require("./Department");
const User = require("./User");
const Asset = require("./Asset");
const AssetRequest = require("./AssetRequest");
const AssetAllocation = require("./AssetAllocation");
const HandoverRequest = require("./HandoverRequest");

/* Branch → Department */
Branch.hasMany(Department, { foreignKey: "branch_id" });
Department.belongsTo(Branch, { foreignKey: "branch_id" });

/* Department → User */
Department.hasMany(User, { foreignKey: "department_id" });
User.belongsTo(Department, { foreignKey: "department_id" });

/* Department → AssetRequest */
Department.hasMany(AssetRequest, { foreignKey: "department_id" });

/* Asset → Allocation */
Asset.hasMany(AssetAllocation, { foreignKey: "asset_id" });

/* AssetRequest → Allocation */
AssetRequest.hasMany(AssetAllocation, { foreignKey: "req_id" });

/* Asset → Handover */
Asset.hasMany(HandoverRequest, { foreignKey: "asset_id" });

module.exports = {
  Branch,
  Department,
  User,
  Asset,
  AssetRequest,
  AssetAllocation,
  HandoverRequest,
};