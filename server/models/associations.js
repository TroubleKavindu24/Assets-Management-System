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

  // Department → User
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

  // Department → AssetAllocation
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

  // Branch → AssetAllocation
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

  // Asset → AssetAllocation
  Asset.hasMany(AssetAllocation, { 
    foreignKey: "asset_id",
    as: "allocations",
    constraints: false
  });
  AssetAllocation.belongsTo(Asset, { 
    foreignKey: "asset_id",
    as: "asset",
    constraints: false
  });

  // Asset → HandoverRequest
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
}

module.exports = setupAssociations;