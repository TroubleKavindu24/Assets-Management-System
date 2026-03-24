const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const AssetRequest = require("../models/AssetRequest.js");
const Department = require("../models/Department.js");
const User = require("../models/User.js")

const DEPARTMENTS = [
  "IT",
  "HR",
  "FINANCE",
  "OPERATIONS",
  "ADMIN"
];

const ASSET_TYPES = [
  "Laptop",
  "Machine",
  "Printer",
  "Other"
];


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
      return res.status(400).json({ message: "Invalid asset type" });
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

    // ✅ Validation
    if (!serial_no || !ip_address || !department_id || !allocated_by) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // ✅ Find asset using serial_no
    const asset = await Asset.findOne({
      where: { serial_no }
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // ✅ Check availability
    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "Asset is not AVAILABLE"
      });
    }

    // ✅ Create allocation
    const allocation = await AssetAllocation.create({
      asset_id: asset.asset_id, // still store internally
      serial_no: asset.serial_no,
      ip_address,
      department_id,
      allocated_by,
      allocated_date: allocated_date || new Date(),
      return_date: return_date || null
    });

    // ✅ Update asset status
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
    const requests = await AssetAllocation.findAll({
      order: [["allocation_id", "DESC"]]
    });

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.asset_handover = async (req, res) => {
  try {
    const {
      asset_id,
      department_id,
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

    // Save handover record
    const handover = await HandoverRequest.create({
      asset_id,
      department_id,
      condition_note,
      handover_date
    });

    // Update asset status
    asset.status = "AVAILABLE";
    await asset.save();

    return res.status(200).json({
      message: "Asset handed over successfully",
      data: handover
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssetDetailsBySerialNo = async (req, res) => {
  try {
    const { serial_no } = req.params; // pass serial number in URL

    if (!serial_no) {
      return res.status(400).json({ message: "Serial number is required" });
    }

    // Find asset by serial number
    const asset = await Asset.findOne({ where: { serial_no } });
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // If asset is AVAILABLE, UNDER_REPAIR or RETIRED → just show details
    if (["AVAILABLE", "UNDER_REPAIR", "RETIRED"].includes(asset.status)) {
      return res.status(200).json({
        asset,
        status: asset.status
      });
    }

    // If asset is ALLOCATED → get allocation info
    if (asset.status === "ALLOCATED") {
      const allocation = await AssetAllocation.findOne({
        where: { asset_id: asset.id },
        include: [
          { model: Department, attributes: ["id", "name"] },
          { model: User, attributes: ["id", "name", "email"] }
        ],
        order: [["allocated_date", "DESC"]] // get latest allocation
      });

      if (!allocation) {
        // This should not happen if asset is marked ALLOCATED
        return res.status(500).json({ message: "Allocation info not found" });
      }

      return res.status(200).json({
        asset,
        status: asset.status,
        allocated_to: {
          department: allocation.Department,
          user: allocation.User,
          allocated_date: allocation.allocated_date,
          return_date: allocation.return_date
        }
      });
    }

    // fallback
    return res.status(400).json({ message: "Unknown asset status" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

