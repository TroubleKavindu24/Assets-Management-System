const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const Branch = require("../models/Branch.js");
const Department = require("../models/Department.js");
const DisposedAsset = require("../models/DisposedAsset.js");

const createAsset = async (req, res) => {
  try {
    const {
      serial_no,
      asset_type,
      brand,
      os,
      purchase_date,
      ram_capacity,
      hard_drive,
      processor,
      warranty_period_months,
      accessories,
      status,
    } = req.body;

    // Validation 1: If asset_type is Laptop, show accessories selection
    if (asset_type === "Laptop" && !accessories) {
      return res.status(400).json({
        success: false,
        message: "Accessories selection is required for Laptop. Please select: Charger, Bag, or Mouse",
      });
    }

    // If asset_type is Laptop but accessories is provided, validate it's one of allowed values
    if (asset_type === "Laptop" && accessories) {
      const allowedAccessories = ["Charger", "Bag", "Mouse"];
      if (!allowedAccessories.includes(accessories)) {
        return res.status(400).json({
          success: false,
          message: "Invalid accessories selection. Allowed values: Charger, Bag, Mouse",
        });
      }
    }

    // Validation 2: If asset_type is Desktop PC or Laptop, show specs section
    const requiresSpecs = asset_type === "Desktop PC" || asset_type === "Laptop";
    
    if (requiresSpecs) {
      // Check if at least one spec field is provided
      if (!ram_capacity && !hard_drive && !processor) {
        return res.status(400).json({
          success: false,
          message: "Specifications (RAM, Hard Drive, or Processor) are required for Desktop PC or Laptop",
        });
      }
    }

    // Additional validation: If specs are provided for non-compatible asset types
    if (!requiresSpecs && (ram_capacity || hard_drive || processor)) {
      return res.status(400).json({
        success: false,
        message: "Specifications (RAM, Hard Drive, Processor) can only be added for Desktop PC or Laptop",
      });
    }

    // Validate warranty period for all asset types
    if (warranty_period_months) {
      if (warranty_period_months < 0 || warranty_period_months > 120) {
        return res.status(400).json({
          success: false,
          message: "Warranty period must be between 0 and 120 months",
        });
      }
      
      // Validate purchase_date exists for warranty calculation
      if (!purchase_date) {
        return res.status(400).json({
          success: false,
          message: "Purchase date is required when warranty period is specified",
        });
      }
    }

    // Check if serial number already exists
    const existingAsset = await Asset.findOne({ where: { serial_no } });
    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: "Asset with this serial number already exists",
      });
    }

    // Create asset (warranty_end_date will be auto-calculated by model hook)
    const asset = await Asset.create({
      serial_no,
      asset_type,
      brand: brand || "N/A",
      os: os || "N/A",
      purchase_date: purchase_date || null,
      ram_capacity: requiresSpecs ? ram_capacity : null,
      hard_drive: requiresSpecs ? hard_drive : null,
      processor: requiresSpecs ? processor : null,
      warranty_period_months: warranty_period_months || null,
      accessories: asset_type === "Laptop" ? accessories : null,
      status: status || "AVAILABLE",
    });

    // Fetch the created asset to get warranty_end_date
    const createdAsset = await Asset.findByPk(asset.asset_id);

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: createdAsset,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({
      success: false,
      message: "Error creating asset",
      error: error.message,
    });
  }
};


exports.getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.findAll({
      order: [["purchase_date", "DESC"]]
    });

    if (!assets || assets.length === 0) {
      return res.status(404).json({
        message: "No assets found"
      });
    }

    return res.status(200).json({
      message: "Assets retrieved successfully",
      count: assets.length,
      data: assets
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch assets",
      error: error.message
    });
  }
};

exports.getAvailableAssetsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ message: "Asset type is required" });
    }

    const assets = await Asset.findAll({
      where: {
        asset_type: type,
        status: "AVAILABLE"
      },
      attributes: ["asset_id", "serial_no", "brand", "os"]
    });

    return res.status(200).json({
      count: assets.length,
      data: assets
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.allocateAsset = async (req, res) => {
  try {
    const {
      serial_no,
      ip_address,
      branch_id,
      department_id,
      allocated_by,
      allocated_date,
      return_date
    } = req.body;

    // Validation
    if (!serial_no || !ip_address || !branch_id || !department_id || !allocated_by) {
      return res.status(400).json({
        message: "Missing required fields: serial_no, ip_address, branch_id, department_id, allocated_by"
      });
    }

    // Verify branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Verify department exists and belongs to the branch
    const department = await Department.findOne({
      where: { 
        department_id: department_id,
        branch_id: branch_id
      }
    });
    
    if (!department) {
      return res.status(404).json({ 
        message: "Department not found or does not belong to the selected branch" 
      });
    }

    // Find asset using serial_no
    const asset = await Asset.findOne({
      where: { serial_no }
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check availability
    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({
        message: `Asset is not AVAILABLE. Current status: ${asset.status}`
      });
    }

    // Create allocation with branch_id
    const allocation = await AssetAllocation.create({
      asset_id: asset.asset_id,
      serial_no: asset.serial_no,
      ip_address,
      branch_id,
      department_id,
      allocated_by,
      allocated_date: allocated_date || new Date(),
      return_date: return_date || null
    });

    // Update asset status
    asset.status = "ALLOCATED";
    await asset.save();

    return res.status(201).json({
      message: "Asset allocated successfully",
      data: {
        allocation,
        branch: branch.location,
        department: department.department_name
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.getAllAllocations = async (req, res) => {
  try {
    const allocations = await AssetAllocation.findAll({
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["branch_id", "location"]
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "department_name"]
        },
        {
          model: Asset,
          as: "asset",
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "os"]
        }
      ],
      order: [["allocated_date", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: error.message,
      message: "Failed to fetch allocations"
    });
  }
};

exports.getAllocationsByBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const allocations = await AssetAllocation.findAll({
      where: { branch_id },
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["location"]
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_name"]
        },
        {
          model: Asset,
          as: "asset",
          attributes: ["serial_no", "asset_type", "brand"]
        }
      ],
      order: [["allocated_date", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// exports.asset_handover = async (req, res) => {
//   try {
//     const {
//       asset_id,
//       department_id,
//       requested_by,
//       condition_note,
//       handover_date
//     } = req.body;

//     const asset = await Asset.findByPk(asset_id);
//     if (!asset) {
//       return res.status(404).json({ message: "Asset not found" });
//     }

//     if (asset.status !== "ALLOCATED") {
//       return res.status(400).json({ message: "Asset is not allocated" });
//     }

//     const handover = await HandoverRequest.create({
//       asset_id,
//       department_id,
//       requested_by,
//       condition_note,
//       handover_date: handover_date || new Date()
//     });

//     asset.status = "AVAILABLE";
//     await asset.save();

//     return res.status(200).json({
//       message: "Asset handed over successfully",
//       data: handover
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/assets.controller.js - Update handover function
exports.asset_handover = async (req, res) => {
  try {
    const {
      asset_id,
      department_id,
      requested_by,
      condition_note,
      handover_date
    } = req.body;

    // Check asset
    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "ALLOCATED") {
      return res.status(400).json({ message: "Asset is not allocated" });
    }

    // Find and update the allocation record (instead of creating new)
    const allocation = await AssetAllocation.findOne({
      where: { 
        asset_id: asset_id,
        return_date: null // Find active allocation
      }
    });

    if (allocation) {
      // Update existing allocation with return date
      allocation.return_date = handover_date || new Date();
      await allocation.save();
    }

    // Save handover record
    const handover = await HandoverRequest.create({
      asset_id,
      department_id,
      requested_by,
      condition_note,
      handover_date: handover_date || new Date(),
      status: "COMPLETED"
    });

    // Update asset status
    asset.status = "AVAILABLE";
    await asset.save();

    return res.status(200).json({
      message: "Asset handed over successfully",
      data: handover
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllocationHistoryBySerialNo = async (req, res) => {
  try {
    const { serial_no } = req.params;

    if (!serial_no) {
      return res.status(400).json({ message: "Serial number is required" });
    }

    const asset = await Asset.findOne({ where: { serial_no } });
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const allocations = await AssetAllocation.findAll({
      where: { asset_id: asset.asset_id },
      order: [["allocated_date", "DESC"]]
    });

    return res.status(200).json({
      asset: {
        asset_id: asset.asset_id,
        serial_no: asset.serial_no,
        asset_type: asset.asset_type,
        brand: asset.brand,
        status: asset.status
      },
      total_allocations: allocations.length,
      allocations: allocations
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// In assets.controller.js
exports.getAssetDetailsBySerialNo = async (req, res) => {
  try {
    const { serial_no } = req.params;

    if (!serial_no) {
      return res.status(400).json({ message: "Serial number is required" });
    }

    const asset = await Asset.findOne({ where: { serial_no } });
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (["AVAILABLE", "UNDER_REPAIR", "RETIRED"].includes(asset.status)) {
      return res.status(200).json({
        asset,
        status: asset.status,
        allocation: null
      });
    }

    if (asset.status === "ALLOCATED") {
      const allocation = await AssetAllocation.findOne({
        where: { asset_id: asset.asset_id },
        order: [["allocated_date", "DESC"]]
      });

      return res.status(200).json({
        asset,
        status: asset.status,
        allocation: allocation || null
      });
    }

    return res.status(200).json({
      asset,
      status: asset.status,
      allocation: null
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// Get allocated assets (active allocations with asset status ALLOCATED)
exports.getAllocatedAssets = async (req, res) => {
  try {
    // First, get all allocations
    const allocations = await AssetAllocation.findAll({
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["branch_id", "location"]
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "department_name"]
        },
        {
          model: Asset,
          as: "asset",
          where: { status: "ALLOCATED" }, // Only assets with ALLOCATED status
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "os", "status"]
        }
      ],
      order: [["allocated_date", "DESC"]]
    });

    // Filter to only include allocations where asset status is ALLOCATED
    const activeAllocations = allocations.filter(alloc => 
      alloc.asset && alloc.asset.status === "ALLOCATED"
    );

    return res.status(200).json({
      success: true,
      count: activeAllocations.length,
      data: activeAllocations
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch allocated assets",
      error: error.message
    });
  }
};

// controllers/assets.controller.js - Add this function

exports.disposeAsset = async (req, res) => {
  try {
    const {
      asset_id,
      serial_no,
      disposed_location,
      disposed_reason
    } = req.body;

    // Validation
    if (!asset_id || !serial_no || !disposed_location) {
      return res.status(400).json({
        message: "Missing required fields: asset_id, serial_no, disposed_location"
      });
    }

    // Validate location
    const validLocations = ["Boralla", "Location2", "Location3"];
    if (!validLocations.includes(disposed_location)) {
      return res.status(400).json({
        message: "Invalid disposal location. Allowed: Boralla, Location2, Location3"
      });
    }

    // Find the asset
    const asset = await Asset.findOne({
      where: { asset_id, serial_no }
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check if already disposed
    if (asset.status === "RETIRED") {
      return res.status(400).json({ message: "Asset has already been disposed" });
    }

    // Get disposed_by from request or default
    const disposed_by = req.body.disposed_by || "System Admin";

    // Create disposed asset record
    const disposedAsset = await DisposedAsset.create({
      asset_id: asset.asset_id,
      serial_no: asset.serial_no,
      asset_type: asset.asset_type,
      brand: asset.brand,
      os: asset.os,
      purchase_date: asset.purchase_date,
      disposed_location,
      disposed_by,
      disposed_date: new Date(),
      disposed_reason: disposed_reason || null
    });

    // If asset was allocated, update allocation with return date
    if (asset.status === "ALLOCATED") {
      const allocation = await AssetAllocation.findOne({
        where: {
          asset_id: asset.asset_id,
          return_date: null
        }
      });

      if (allocation) {
        allocation.return_date = new Date();
        await allocation.save();
      }
    }

    // Update asset status to RETIRED
    asset.status = "RETIRED";
    await asset.save();

    return res.status(200).json({
      message: "Asset disposed successfully",
      data: {
        disposed_asset: disposedAsset,
        asset_status: asset.status
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Get all disposed assets
exports.getDisposedAssets = async (req, res) => {
  try {
    const disposedAssets = await DisposedAsset.findAll({
      order: [["disposed_date", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      count: disposedAssets.length,
      data: disposedAssets
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch disposed assets",
      error: error.message
    });
  }
};