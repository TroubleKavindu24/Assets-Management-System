// models/associations.js
const Department = require("./Department");
const User = require("./User");
const Asset = require("./Asset");
const AssetAllocation = require("./AssetAllocation");
const HandoverRequest = require("./HandoverRequest");

// Define associations
function setupAssociations() {
  // Asset → AssetAllocation
  Asset.hasMany(AssetAllocation, { 
    foreignKey: "asset_id",
    as: "allocations"
  });
  AssetAllocation.belongsTo(Asset, { 
    foreignKey: "asset_id",
    as: "asset"
  });

  // Department → AssetAllocation
  Department.hasMany(AssetAllocation, { 
    foreignKey: "department_id",
    as: "allocations"
  });
  AssetAllocation.belongsTo(Department, { 
    foreignKey: "department_id",
    as: "department"
  });

  // Department → User
  Department.hasMany(User, { 
    foreignKey: "department_id",
    as: "users"
  });
  User.belongsTo(Department, { 
    foreignKey: "department_id",
    as: "department"
  });

  // Asset → HandoverRequest
  Asset.hasMany(HandoverRequest, { 
    foreignKey: "asset_id",
    as: "handovers"
  });
  HandoverRequest.belongsTo(Asset, { 
    foreignKey: "asset_id",
    as: "asset"
  });
}

module.exports = setupAssociations;