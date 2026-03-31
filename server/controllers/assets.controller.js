const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const AssetRequest = require("../models/AssetRequest.js");
const Department = require("../models/Department.js");
const User = require("../models/User.js");
const constants = require("../constants/app.constants.js");

// Make sure associations are loaded
require("../models/associations/index.js");

exports.add = async (req, res) => {
  try {
    let {
      asset_type,
      serial_no,
      brand,
      os,
      purchase_date
    } = req.body;

    // Trim inputs
    serial_no = serial_no?.trim();
    brand = brand?.trim();
    os = os?.trim();

    // Required validation
    if (!asset_type || !serial_no) {
      return res.status(400).json({ message: "Asset type and serial number are required" });
    }

    // Validate asset type using constants
    if (!constants.ASSET_TYPES.includes(asset_type)) {
      return res.status(400).json({ 
        message: `Invalid asset type. Allowed: ${constants.ASSET_TYPES.join(", ")}` 
      });
    }

    // Validate brand using constants
    if (brand && !constants.ASSET_BRANDS.includes(brand)) {
      return res.status(400).json({ 
        message: `Invalid brand. Allowed: ${constants.ASSET_BRANDS.join(", ")}` 
      });
    }

    // Validate OS using constants
    if (os && !constants.ASSET_OS.includes(os)) {
      return res.status(400).json({ 
        message: `Invalid operating system. Allowed: ${constants.ASSET_OS.join(", ")}` 
      });
    }

    // Prevent duplicate serial numbers
    const existing = await Asset.findOne({ where: { serial_no } });
    if (existing) {
      return res.status(409).json({ message: "Serial number already exists" });
    }

    const asset = await Asset.create({
      asset_type,
      serial_no,
      brand: brand || "N/A",
      os: os || "N/A",
      purchase_date: purchase_date || null,
      status: "AVAILABLE"
    });

    return res.status(201).json({
      message: "Asset added successfully",
      data: asset
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    console.log("BODY:", req.body);

    const {
      serial_no,
      ip_address,
      department_id,
      allocated_by,
      allocated_date,
      return_date
    } = req.body;

    // Validation
    if (!serial_no || !ip_address || !department_id || !allocated_by) {
      return res.status(400).json({
        message: "Missing required fields: serial_no, ip_address, department_id, allocated_by"
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

    // Create allocation
    const allocation = await AssetAllocation.create({
      asset_id: asset.asset_id,
      serial_no: asset.serial_no,
      ip_address,
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
      data: allocation
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
      order: [["allocation_id", "DESC"]],
      include: [
        { 
          model: Asset, 
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "os"]
        },
        {
          model: Department,
          attributes: ["department_id", "department_name"]
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
      return res.status(400).json({ 
        message: `Asset is not allocated. Current status: ${asset.status}` 
      });
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

/**
 * Get asset details by serial number with complete allocation/handover history
 * This is the fixed implementation
 */
exports.getAssetDetailsBySerialNo = async (req, res) => {
  try {
    const { serial_no } = req.params;

    if (!serial_no) {
      return res.status(400).json({ message: "Serial number is required" });
    }

    // Find asset by serial number
    const asset = await Asset.findOne({ 
      where: { serial_no },
      attributes: ["asset_id", "serial_no", "asset_type", "brand", "os", "purchase_date", "status", "created_at", "updated_at"]
    });
    
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Prepare response object
    const response = {
      asset: asset,
      status: asset.status
    };

    // If asset is AVAILABLE, UNDER_REPAIR or RETIRED → just show details
    if (["AVAILABLE", "UNDER_REPAIR", "RETIRED"].includes(asset.status)) {
      return res.status(200).json(response);
    }

    // If asset is ALLOCATED → get current allocation info
    if (asset.status === "ALLOCATED") {
      // Find the current active allocation (where return_date is null or in future)
      const currentAllocation = await AssetAllocation.findOne({
        where: { 
          asset_id: asset.asset_id,
          // Optionally filter for active allocations
          // return_date: null // Uncomment if you track return_date for completed allocations
        },
        include: [
          { 
            model: Department, 
            attributes: ["department_id", "department_name"]
          }
        ],
        order: [["allocated_date", "DESC"]],
        limit: 1
      });

      if (!currentAllocation) {
        // This should not happen if asset is marked ALLOCATED
        return res.status(500).json({ 
          message: "Asset marked as ALLOCATED but no allocation record found",
          asset: asset
        });
      }

      response.current_allocation = {
        allocation_id: currentAllocation.allocation_id,
        ip_address: currentAllocation.ip_address,
        department: currentAllocation.Department,
        allocated_by: currentAllocation.allocated_by,
        allocated_date: currentAllocation.allocated_date,
        return_date: currentAllocation.return_date
      };

      // Optional: Get allocation history
      const allocationHistory = await AssetAllocation.findAll({
        where: { asset_id: asset.asset_id },
        include: [
          { 
            model: Department, 
            attributes: ["department_id", "department_name"]
          }
        ],
        order: [["allocated_date", "DESC"]],
        limit: 5 // Get last 5 allocations
      });

      if (allocationHistory.length > 1) {
        response.allocation_history = allocationHistory.map(alloc => ({
          allocation_id: alloc.allocation_id,
          department: alloc.Department,
          allocated_by: alloc.allocated_by,
          allocated_date: alloc.allocated_date,
          return_date: alloc.return_date
        }));
      }

      return res.status(200).json(response);
    }

    // If asset is in other status
    return res.status(200).json({
      asset: asset,
      status: asset.status,
      message: `Asset is currently ${asset.status}`
    });

  } catch (error) {
    console.error("Error in getAssetDetailsBySerialNo:", error);
    return res.status(500).json({ 
      error: error.message,
      message: "Failed to fetch asset details"
    });
  }
};

/**
 * Get asset allocation history by serial number
 */
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
      include: [
        { 
          model: Department, 
          attributes: ["department_id", "department_name"],
          as: "department" // Add alias if you set one in associations
        },
        // Remove Asset include if it causes issues
        // {
        //   model: Asset,
        //   attributes: ["serial_no", "asset_type", "brand"],
        //   as: "asset"
        // }
      ],
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
    console.error("Error in getAllocationHistoryBySerialNo:", error);
    return res.status(500).json({ 
      error: error.message,
      message: "Failed to fetch allocation history"
    });
  }
};