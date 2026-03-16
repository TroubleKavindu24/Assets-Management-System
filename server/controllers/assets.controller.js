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
    const {
      asset_type,
      serial_no,
      brand,
      os,
      purchase_date
    } = req.body;

    // Validation
    if (!asset_type || !serial_no) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Prevent duplicate serial numbers
    const existing = await Asset.findOne({ where: { serial_no } });
    if (existing) {
      return res.status(409).json({ message: "Asset already exists" });
    }

    const asset = await Asset.create({
      asset_type,
      serial_no,
      brand,
      os,
      purchase_date,
      status: "AVAILABLE"
    });

    return res.status(201).json({
      message: "Asset added successfully",
      data: asset
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
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

exports.asset_allocation = async (req, res) => {
  try {
    const {
      asset_id,
      department_id,
      allocated_by,
      allocated_date,
      return_date
    } = req.body;

    // Check asset
    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Asset not available" });
    }

    // Create allocation
    const allocation = await AssetAllocation.create({
      asset_id,
      department_id,
      allocated_by,
      allocated_date,
      return_date
    });

    // Update asset status
    asset.status = "ALLOCATED";
    await asset.save();

    return res.status(200).json({
      message: "Asset allocated successfully",
      data: allocation
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
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

exports.allocateAsset = async (req, res) => {
  try {
    const {
      asset_id,
      req_id,
      ip_address,
      department_id,
      allocated_by,
      allocated_date,
      return_date
    } = req.body;

    // Validate required fields
    if (!asset_id || !req_id || !department_id || !allocated_by || !ip_address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check department is valid
    if (!DEPARTMENTS.includes(department_id)) {
      return res.status(400).json({ message: `Invalid department. Choose one of: ${DEPARTMENTS.join(", ")}` });
    }

    // Check asset exists
    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check asset availability
    if (asset.status !== "AVAILABLE") {
      return res.status(400).json({ message: `Asset is not available. Current status: ${asset.status}` });
    }

    // Create allocation record
    const allocation = await AssetAllocation.create({
      asset_id,
      req_id,
      ip_address,
      department_id,
      allocated_by,
      allocated_date: allocated_date || new Date(),
      return_date
    });

    // Update asset status to ALLOCATED
    asset.status = "ALLOCATED";
    await asset.save();

    return res.status(200).json({
      message: "Asset allocated successfully",
      allocation
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 CREATE ASSET REQUEST (User submits request form)
*/
exports.createRequest = async (req, res) => {
  try {
    const {
      department_id,
      requested_by,
      asset_type,
      quantity,
      request_type,
      budget_type
    } = req.body;

    // 🔹 Validation
    if (
      !department_id ||
      !requested_by ||
      !asset_type ||
      !quantity
    ) {
      return res.status(400).json({
        message: "Required fields are missing"
      });
    }

    // 🔹 Validate department
    if (!DEPARTMENTS.includes(department_id)) {
      return res.status(400).json({
        message: "Invalid department"
      });
    }

    // 🔹 Validate asset type
    if (!ASSET_TYPES.includes(asset_type)) {
      return res.status(400).json({
        message: "Invalid asset type"
      });
    }

    // 🔹 Quantity check
    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    const request = await AssetRequest.create({
      department_id,
      requested_by,
      asset_type,
      quantity,
      request_type,
      budget_type,
      status: "PENDING"
    });

    return res.status(201).json({
      message: "Asset request submitted successfully",
      data: request
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * 2️⃣ GET ALL REQUESTS (Admin / IT)
 */
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await AssetRequest.findAll({
      order: [["request_date", "DESC"]]
    });

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 3️⃣ UPDATE REQUEST STATUS (Approve / Reject)
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const { req_id } = req.params;
    const { status } = req.body;

    // ✅ Allow ONLY these two statuses
    const ALLOWED_STATUS = ["APPROVED", "REJECTED"];

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        message: "Status must be APPROVED or REJECTED"
      });
    }

    // 🔍 Find request by ID
    const request = await AssetRequest.findOne({
      where: { req_id }
    });

    if (!request) {
      return res.status(404).json({
        message: "Asset request not found"
      });
    }

    // ❌ Prevent double approval/rejection
    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: `Request already ${request.status}`
      });
    }

    // ✅ Update ONLY status
    await request.update({ status });

    return res.status(200).json({
      message: `Request ${status.toLowerCase()} successfully`,
      data: {
        req_id: request.req_id,
        status: request.status
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};