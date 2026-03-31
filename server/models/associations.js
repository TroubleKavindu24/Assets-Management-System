// models/associations.js
// This file defines relationships WITHOUT foreign key constraints to avoid compatibility issues

const Branch = require("./Branch");
const Department = require("./Department");
const User = require("./User");
const Asset = require("./Asset");
const AssetRequest = require("./AssetRequest");
const AssetAllocation = require("./AssetAllocation");
const HandoverRequest = require("./HandoverRequest");

function setupAssociations() {
  
  // Branch - Department (without foreign key constraints)
  Branch.hasMany(Department, { 
    foreignKey: "branch_id",
    constraints: false  // ✅ No foreign key constraint
  });
  Department.belongsTo(Branch, { 
    foreignKey: "branch_id",
    constraints: false  // ✅ No foreign key constraint
  });

  // Department - User
  Department.hasMany(User, { 
    foreignKey: "department_id",
    constraints: false
  });
  User.belongsTo(Department, { 
    foreignKey: "department_id",
    constraints: false
  });

  // Department - AssetRequest
  Department.hasMany(AssetRequest, { 
    foreignKey: "department_id",
    constraints: false
  });
  AssetRequest.belongsTo(Department, { 
    foreignKey: "department_id",
    constraints: false
  });

  // Department - AssetAllocation
  Department.hasMany(AssetAllocation, { 
    foreignKey: "department_id",
    constraints: false
  });
  AssetAllocation.belongsTo(Department, { 
    foreignKey: "department_id",
    constraints: false
  });

  // Asset - AssetAllocation
  Asset.hasMany(AssetAllocation, { 
    foreignKey: "asset_id",
    constraints: false
  });
  AssetAllocation.belongsTo(Asset, { 
    foreignKey: "asset_id",
    constraints: false
  });

  // Asset - HandoverRequest
  Asset.hasMany(HandoverRequest, { 
    foreignKey: "asset_id",
    constraints: false
  });
  HandoverRequest.belongsTo(Asset, { 
    foreignKey: "asset_id",
    constraints: false
  });

  // AssetRequest - AssetAllocation (optional)
  AssetRequest.hasMany(AssetAllocation, { 
    foreignKey: "req_id",
    constraints: false
  });
  AssetAllocation.belongsTo(AssetRequest, { 
    foreignKey: "req_id",
    constraints: false
  });
}

module.exports = setupAssociations;