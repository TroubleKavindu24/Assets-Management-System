const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const Branch = require("../models/Branch.js");
const Department = require("../models/Department.js");
const DisposedAsset = require("../models/DisposedAsset.js");

// Create Asset
const calculateWarrantyEndDate = (purchaseDate, warrantyPeriodMonths) => {
  if (!purchaseDate || !warrantyPeriodMonths) {
    return null;
  }
  const endDate = new Date(purchaseDate);
  endDate.setMonth(endDate.getMonth() + warrantyPeriodMonths);
  return endDate;
};

exports.add_asset = async (req, res) => {
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
      model,
      gen,
      warranty_period_months,
      accessories,
      status
    } = req.body;

    // Validation Rules
    const validationErrors = [];

    // Rule 1: If asset_type is "Laptop", accessories must be provided
    if (asset_type === "Laptop") {
      if (!accessories) {
        validationErrors.push("Accessories are required for Laptop type");
      }
    }

    // Rule 2: If asset_type is "Desktop PC" or "Laptop", spec section is required
    if (asset_type === "Desktop PC" || asset_type === "Laptop") {
      if (!ram_capacity || !hard_drive || !processor) {
        validationErrors.push("Spec section (RAM, Hard Drive, Processor) is required for Desktop PC and Laptop types");
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Calculate warranty end date
    let warranty_end_date = null;
    if (purchase_date && warranty_period_months) {
      warranty_end_date = calculateWarrantyEndDate(purchase_date, warranty_period_months);
    }

    // Create the asset
    const asset = await Asset.create({
      serial_no,
      asset_type,
      brand: brand || "N/A",
      os: os || "N/A",
      purchase_date: purchase_date || null,
      ram_capacity: (asset_type === "Desktop PC" || asset_type === "Laptop") ? ram_capacity : null,
      hard_drive: (asset_type === "Desktop PC" || asset_type === "Laptop") ? hard_drive : null,
      processor: (asset_type === "Desktop PC" || asset_type === "Laptop") ? processor : null,
      model: model || null,
      gen: gen || null,
      warranty_period_months: warranty_period_months || null,
      warranty_end_date,
      accessories: asset_type === "Laptop" ? accessories : null,
      status: status || "AVAILABLE"
    });

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset
    });

  } catch (error) {
    console.error("Error creating asset:", error);
    
    // Handle duplicate serial number
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Serial number already exists",
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating asset",
      error: error.message
    });
  }
};


exports.getAllAssets = async (req, res) => {
  try {
    const { asset_type, status, search } = req.query;
    let whereClause = {};

    if (asset_type) {
      whereClause.asset_type = asset_type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { serial_no: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
      ];
    }

    const assets = await Asset.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assets",
      error: error.message,
    });
  }
};


exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching asset",
      error: error.message,
    });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
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

    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Validation 1: If asset_type is Laptop, accessories required
    if (asset_type === "Laptop" && !accessories) {
      return res.status(400).json({
        success: false,
        message: "Accessories selection is required for Laptop",
      });
    }

    // Validation 2: If asset_type is Desktop PC or Laptop, specs required
    const requiresSpecs = asset_type === "Desktop PC" || asset_type === "Laptop";
    
    if (requiresSpecs && (!ram_capacity && !hard_drive && !processor)) {
      return res.status(400).json({
        success: false,
        message: "Specifications (RAM, Hard Drive, or Processor) are required for Desktop PC or Laptop",
      });
    }

    // Check duplicate serial number (excluding current asset)
    if (serial_no && serial_no !== asset.serial_no) {
      const existingAsset = await Asset.findOne({
        where: {
          serial_no,
          asset_id: { [Op.ne]: id },
        },
      });
      if (existingAsset) {
        return res.status(400).json({
          success: false,
          message: "Asset with this serial number already exists",
        });
      }
    }

    // Prepare update data
    const updateData = {
      serial_no: serial_no || asset.serial_no,
      asset_type: asset_type || asset.asset_type,
      brand: brand || asset.brand,
      os: os || asset.os,
      purchase_date: purchase_date || asset.purchase_date,
      warranty_period_months: warranty_period_months !== undefined ? warranty_period_months : asset.warranty_period_months,
      status: status || asset.status,
    };

    // Only include specs if required
    if (requiresSpecs) {
      updateData.ram_capacity = ram_capacity !== undefined ? ram_capacity : asset.ram_capacity;
      updateData.hard_drive = hard_drive !== undefined ? hard_drive : asset.hard_drive;
      updateData.processor = processor !== undefined ? processor : asset.processor;
    } else {
      updateData.ram_capacity = null;
      updateData.hard_drive = null;
      updateData.processor = null;
    }

    // Only include accessories if asset_type is Laptop
    if (asset_type === "Laptop") {
      updateData.accessories = accessories !== undefined ? accessories : asset.accessories;
    } else {
      updateData.accessories = null;
    }

    await asset.update(updateData);

    // Fetch updated asset
    const updatedAsset = await Asset.findByPk(id);

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: updatedAsset,
    });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({
      success: false,
      message: "Error updating asset",
      error: error.message,
    });
  }
};

exports.getAssetsWithExpiringWarranty = async (req, res) => {
  try {
    const { months = 3 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + parseInt(months));

    const assets = await Asset.findAll({
      where: {
        warranty_end_date: {
          [Op.ne]: null,
          [Op.between]: [today, futureDate],
        },
        status: {
          [Op.ne]: "RETIRED",
        },
      },
      order: [["warranty_end_date", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error("Error fetching expiring warranties:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiring warranties",
      error: error.message,
    });
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