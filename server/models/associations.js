// models/associations.js
const Branch = require("./Branch");
const Department = require("./Department");
const User = require("./User");
const Asset = require("./Asset");
const AssetRequest = require("./AssetRequest");
const AssetAllocation = require("./AssetAllocation");
const HandoverRequest = require("./HandoverRequest");

function setupAssociations() {
  
  // Branch → Department (One-to-Many)
  Branch.hasMany(Department, { 
    foreignKey: "branch_id",
    as: "departments",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });
  Department.belongsTo(Branch, { 
    foreignKey: "branch_id",
    as: "branch",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  });

  // Department → User (One-to-Many)
  Department.hasMany(User, { 
    foreignKey: "department_id",
    as: "users",
    constraints: false
  });
  User.belongsTo(Department, { 
    foreignKey: "department_id",
    as: "department",
    constraints: false
  });

  // Department → AssetAllocation (One-to-Many)
  Department.hasMany(AssetAllocation, { 
    foreignKey: "department_id",
    as: "allocations",
    constraints: false
  });
  AssetAllocation.belongsTo(Department, { 
    foreignKey: "department_id",
    as: "department",
    constraints: false
  });

  // Branch → AssetAllocation (One-to-Many)
  Branch.hasMany(AssetAllocation, { 
    foreignKey: "branch_id",
    as: "allocations",
    constraints: false
  });
  AssetAllocation.belongsTo(Branch, { 
    foreignKey: "branch_id",
    as: "branch",
    constraints: false
  });

  // Asset → AssetAllocation (One-to-Many) for main asset
  Asset.hasMany(AssetAllocation, { 
    foreignKey: "asset_id",
    as: "allocations",
    constraints: false
  });
  AssetAllocation.belongsTo(Asset, { 
    foreignKey: "asset_id",
    as: "asset",  // Alias for the main asset
    constraints: false
  });

  // NEW: Asset → AssetAllocation for allocated monitor (Self-reference through AssetAllocation)
  // This allows AssetAllocation to have a relationship with Asset for the monitor
  Asset.hasMany(AssetAllocation, { 
    foreignKey: "allocated_monitor_id",
    as: "monitor_allocations",
    constraints: false
  });
  AssetAllocation.belongsTo(Asset, { 
    foreignKey: "allocated_monitor_id",
    as: "allocated_monitor",  // Alias for the monitor asset
    constraints: false
  });

  // Asset → HandoverRequest (One-to-Many)
  Asset.hasMany(HandoverRequest, { 
    foreignKey: "asset_id",
    as: "handovers",
    constraints: false
  });
  HandoverRequest.belongsTo(Asset, { 
    foreignKey: "asset_id",
    as: "asset",
    constraints: false
  });

  // AssetRequest associations (if needed)
  // User → AssetRequest
  User.hasMany(AssetRequest, {
    foreignKey: "requested_by",
    as: "asset_requests",
    constraints: false
  });
  AssetRequest.belongsTo(User, {
    foreignKey: "requested_by",
    as: "requester",
    constraints: false
  });

  // Asset → AssetRequest
  Asset.hasMany(AssetRequest, {
    foreignKey: "asset_id",
    as: "requests",
    constraints: false
  });
  AssetRequest.belongsTo(Asset, {
    foreignKey: "asset_id",
    as: "asset",
    constraints: false
  });

  // HandoverRequest associations
  // User → HandoverRequest (who requested handover)
  User.hasMany(HandoverRequest, {
    foreignKey: "requested_by",
    as: "handover_requests",
    constraints: false
  });
  HandoverRequest.belongsTo(User, {
    foreignKey: "requested_by",
    as: "requester",
    constraints: false
  });

  // User → HandoverRequest (who approved handover)
  User.hasMany(HandoverRequest, {
    foreignKey: "approved_by",
    as: "approved_handovers",
    constraints: false
  });
  HandoverRequest.belongsTo(User, {
    foreignKey: "approved_by",
    as: "approver",
    constraints: false
  });

  // AssetAllocation → HandoverRequest (One-to-One)
  AssetAllocation.hasOne(HandoverRequest, {
    foreignKey: "allocation_id",
    as: "handover_request",
    constraints: false
  });
  HandoverRequest.belongsTo(AssetAllocation, {
    foreignKey: "allocation_id",
    as: "allocation",
    constraints: false
  });
}

module.exports = setupAssociations;