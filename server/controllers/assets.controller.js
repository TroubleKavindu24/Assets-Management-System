const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const Branch = require("../models/Branch.js");
const Department = require("../models/Department.js");
const User = require("../models/User.js");

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

    // Validate asset type
    const validTypes = ["Laptop", "Machine", "Printer", "Other"];
    if (!validTypes.includes(asset_type)) {
      return res.status(400).json({ 
        message: "Invalid asset type. Allowed: Laptop, Machine, Printer, Other" 
      });
    }

    // Set defaults for brand and OS if empty
    const finalBrand = brand && brand !== "" ? brand : "N/A";
    const finalOS = os && os !== "" ? os : "N/A";

    // Prevent duplicate serial numbers
    const existing = await Asset.findOne({ where: { serial_no } });
    if (existing) {
      return res.status(409).json({ message: "Serial number already exists" });
    }

    const asset = await Asset.create({
      asset_type,
      serial_no,
      brand: finalBrand,
      os: finalOS,
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

exports.asset_handover = async (req, res) => {
  try {
    const {
      asset_id,
      department_id,
      requested_by,
      condition_note,
      handover_date
    } = req.body;

    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "ALLOCATED") {
      return res.status(400).json({ message: "Asset is not allocated" });
    }

    const handover = await HandoverRequest.create({
      asset_id,
      department_id,
      requested_by,
      condition_note,
      handover_date: handover_date || new Date()
    });

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
        status: asset.status
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
      status: asset.status
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
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