// controllers/assetController.js
const { Op } = require("sequelize");
const Asset = require("../models/Asset.js");
const AssetAllocation = require("../models/AssetAllocation.js");
const HandoverRequest = require("../models/HandoverRequest.js");
const Branch = require("../models/Branch.js");
const Department = require("../models/Department.js");
const DisposedAsset = require("../models/DisposedAsset.js");

// Helper function to calculate warranty end date
const calculateWarrantyEndDate = (purchaseDate, warrantyPeriodMonths) => {
  if (!purchaseDate || !warrantyPeriodMonths) {
    return null;
  }
  const endDate = new Date(purchaseDate);
  endDate.setMonth(endDate.getMonth() + warrantyPeriodMonths);
  return endDate;
};
const validateDisposedLocation = (location) => {
  const validLocations = ["Borella", "Location 1", "Location 2"];
  return validLocations.includes(location);
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
      status
    } = req.body;

    // Validation Rules
    const validationErrors = [];

    // Rule 1: If asset_type is "Laptop" or "Desktop PC", spec section is required
    if (asset_type === "Desktop PC" || asset_type === "Laptop") {
      if (!ram_capacity || !hard_drive || !processor) {
        validationErrors.push("Spec section (RAM, Hard Drive, Processor) is required for Desktop PC and Laptop types");
      }
    }

    // REMOVED: Accessories validation from asset creation

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
      // REMOVED: accessories field
      status: status || "AVAILABLE"
    });

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset
    });

  } catch (error) {
    console.error("Error creating asset:", error);
    
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

exports.allocateAsset = async (req, res) => {
  const transaction = await Asset.sequelize.transaction();
  
  try {
    const {
      asset_id,
      ip_address,
      branch_id,
      department_id,
      allocated_by,
      allocated_date,
      asset_type,
      // Desktop PC fields
      allocated_monitor_id,
      desktop_allocated_mouse,
      desktop_allocated_keyboard,
      // Laptop fields
      allocated_charger,
      allocated_bag,
      allocated_mouse,
      allocated_keyboard,
    } = req.body;

    // Find the asset
    const asset = await Asset.findByPk(asset_id);
    
    if (!asset) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Check if asset is available
    if (asset.status !== "AVAILABLE") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Asset is not available for allocation. Current status: ${asset.status}`,
      });
    }

    // Validation based on asset type
    const validationErrors = [];

    // Common validation for all asset types
    if (!ip_address) validationErrors.push("IP Address is required");
    if (!branch_id) validationErrors.push("Branch is required");
    if (!department_id) validationErrors.push("Department is required");
    if (!allocated_by) validationErrors.push("Allocated by user is required");

    // Desktop PC specific validations
    if (asset.asset_type === "Desktop PC") {
      if (allocated_monitor_id) {
        const monitor = await Asset.findOne({
          where: {
            asset_id: allocated_monitor_id,
            asset_type: "Monitor",
            status: "AVAILABLE",
          },
        });
        
        if (!monitor) {
          validationErrors.push("Selected monitor is not available or does not exist");
        }
      }
    }

    // Laptop accessories validation - at least one accessory required
    if (asset.asset_type === "Laptop") {
      const hasAccessory = allocated_charger || allocated_bag || allocated_mouse || allocated_keyboard;
      if (!hasAccessory) {
        validationErrors.push("At least one accessory (Charger, Bag, Mouse, or Keyboard) is required for Laptop allocation");
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Prepare allocation data
    const allocationData = {
      asset_id: asset.asset_id,
      serial_no: asset.serial_no,
      ip_address,
      branch_id,
      department_id,
      allocated_by,
      allocated_date: allocated_date || new Date(),
    };

    // Add Desktop PC specific fields
    if (asset.asset_type === "Desktop PC") {
      allocationData.allocated_monitor_id = allocated_monitor_id || null;
      allocationData.desktop_allocated_mouse = desktop_allocated_mouse || false;
      allocationData.desktop_allocated_keyboard = desktop_allocated_keyboard || false;
    }

    // Add Laptop specific fields
    if (asset.asset_type === "Laptop") {
      allocationData.allocated_charger = allocated_charger || false;
      allocationData.allocated_bag = allocated_bag || false;
      allocationData.allocated_mouse = allocated_mouse || false;
      allocationData.allocated_keyboard = allocated_keyboard || false;
    }

    // Create allocation record
    const allocation = await AssetAllocation.create(allocationData, { transaction });

    // Update asset status to ALLOCATED
    await asset.update({ status: "ALLOCATED" }, { transaction });

    // If monitor is allocated for Desktop PC, update its status
    if (allocated_monitor_id && asset.asset_type === "Desktop PC") {
      const monitor = await Asset.findByPk(allocated_monitor_id);
      if (monitor) {
        await monitor.update({ status: "ALLOCATED" }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch complete allocation details
    const completeAllocation = await AssetAllocation.findByPk(allocation.allocation_id, {
      include: [
        {
          model: Asset,
          as: "asset",
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "model", "ram_capacity", "hard_drive", "processor", "os", "status"],
        },
        {
          model: Asset,
          as: "allocated_monitor",
          attributes: ["asset_id", "serial_no", "brand", "model"],
          required: false,
        },
      ],
    });

    // Prepare response message with accessories info
    let accessoriesMessage = "";
    if (asset.asset_type === "Laptop") {
      const selectedAccessories = [];
      if (allocated_charger) selectedAccessories.push("Charger");
      if (allocated_bag) selectedAccessories.push("Bag");
      if (allocated_mouse) selectedAccessories.push("Mouse");
      if (allocated_keyboard) selectedAccessories.push("Keyboard");
      accessoriesMessage = ` with accessories: ${selectedAccessories.join(", ")}`;
    } else if (asset.asset_type === "Desktop PC") {
      const selectedAccessories = [];
      if (desktop_allocated_mouse) selectedAccessories.push("Mouse");
      if (desktop_allocated_keyboard) selectedAccessories.push("Keyboard");
      if (allocated_monitor_id) selectedAccessories.push("Monitor");
      if (selectedAccessories.length > 0) {
        accessoriesMessage = ` with accessories: ${selectedAccessories.join(", ")}`;
      }
    }

    return res.status(201).json({
      success: true,
      message: `Asset allocated successfully${accessoriesMessage}`,
      data: completeAllocation,
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error("Error allocating asset:", error);
    return res.status(500).json({
      success: false,
      message: "Error allocating asset",
      error: error.message,
    });
  }
};

exports.getAvailableAssetsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    console.log("Request params:", req.params);
    console.log("Requested asset type:", type);
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Asset type is required",
      });
    }

    // Define valid asset types matching your model ENUM
    const validAssetTypes = ["Laptop", "Desktop PC", "Monitor", "Printer", "Other"];
    
    // Check if the requested type is valid
    if (!validAssetTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset type: "${type}". Valid types are: ${validAssetTypes.join(", ")}`,
      });
    }

    // Build attributes based on asset type
    let attributes = ["asset_id", "serial_no", "asset_type", "brand", "model", "status"];
    
    if (type === "Laptop" || type === "Desktop PC") {
      attributes.push("ram_capacity", "hard_drive", "processor", "os");
    }

    // Query for available assets
    const assets = await Asset.findAll({
      where: {
        asset_type: type,  // Filter by asset_type from Asset model
        status: "AVAILABLE"  // Filter by status from Asset model
      },
      order: [["brand", "ASC"], ["model", "ASC"]],
      attributes: attributes,
    });

    console.log(`Found ${assets.length} available ${type}(s)`);

    // Format response with specs
    const formattedAssets = assets.map(asset => {
      const assetData = asset.toJSON();
      
      // Add display name for dropdown
      assetData.display_name = `${assetData.brand} ${assetData.model || ''} - ${assetData.serial_no}`.trim();
      
      if (type === "Desktop PC" || type === "Laptop") {
        assetData.specifications = {
          ram: assetData.ram_capacity || 'N/A',
          storage: assetData.hard_drive || 'N/A',
          processor: assetData.processor || 'N/A',
          os: assetData.os || 'N/A',
        };
        
        // Add formatted specs string
        assetData.specs_text = `${assetData.ram_capacity || 'N/A'} RAM, ${assetData.hard_drive || 'N/A'} Storage, ${assetData.processor || 'N/A'} Processor`;
      }
      
      return assetData;
    });

    res.status(200).json({
      success: true,
      message: `Found ${formattedAssets.length} available ${type}(s)`,
      count: formattedAssets.length,
      asset_type: type,
      data: formattedAssets,
    });

  } catch (error) {
    console.error("Error fetching available assets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available assets",
      error: error.message,
    });
  }
};
exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset ID provided",
      });
    }

    const asset = await Asset.findByPk(id, {
      attributes: ["asset_id", "serial_no", "asset_type", "brand", "model", "os", 
                   "ram_capacity", "hard_drive", "processor", "status", 
                   "purchase_date", "warranty_end_date"],
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Format response
    const assetData = asset.toJSON();
    
    if (assetData.asset_type === "Laptop" || assetData.asset_type === "Desktop PC") {
      assetData.specifications = {
        ram: assetData.ram_capacity || 'N/A',
        storage: assetData.hard_drive || 'N/A',
        processor: assetData.processor || 'N/A',
        os: assetData.os || 'N/A',
      };
    }

    res.status(200).json({
      success: true,
      data: assetData,
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
exports.getAllAssets = async (req, res) => {
  try {
    const { 
      asset_type, 
      status, 
      search, 
      brand,
      page = 1, 
      limit = 10,
      sort_by = "createdAt",
      sort_order = "DESC",
      start_date,
      end_date,
      warranty_status
    } = req.query;
    
    let whereClause = {};

    // Filter by asset_type
    if (asset_type) {
      whereClause.asset_type = asset_type;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by brand
    if (brand) {
      whereClause.brand = brand;
    }

    // Search functionality (enhanced)
    if (search) {
      whereClause[Op.or] = [
        { serial_no: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { processor: { [Op.like]: `%${search}%` } },
        { asset_type: { [Op.like]: `%${search}%` } },
        { os: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by purchase date range
    if (start_date || end_date) {
      whereClause.purchase_date = {};
      if (start_date) {
        whereClause.purchase_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.purchase_date[Op.lte] = new Date(end_date);
      }
    }

    // Filter by warranty status
    if (warranty_status) {
      const today = new Date();
      if (warranty_status === "active") {
        whereClause.warranty_end_date = { [Op.gt]: today };
        whereClause.warranty_end_date = { [Op.ne]: null };
      } else if (warranty_status === "expired") {
        whereClause.warranty_end_date = { [Op.lt]: today };
      } else if (warranty_status === "no_warranty") {
        whereClause.warranty_end_date = null;
      }
    }

    // Pagination
    const offset = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    // Validate sort column to prevent SQL injection
    const validSortColumns = ["asset_id", "serial_no", "asset_type", "brand", "model", "status", "createdAt", "updatedAt", "purchase_date", "warranty_end_date"];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "createdAt";
    const sortDirection = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Get assets with pagination
    const { count, rows } = await Asset.findAndCountAll({
      where: whereClause,
      order: [[sortColumn, sortDirection]],
      limit: parsedLimit,
      offset: parsedOffset,
      attributes: [
        "asset_id",
        "serial_no",
        "asset_type",
        "brand",
        "os",
        "model",
        "gen",
        "ram_capacity",
        "hard_drive",
        "processor",
        "purchase_date",
        "warranty_period_months",
        "warranty_end_date",
        "status",
        "createdAt",
        "updatedAt"
      ]
    });

    // Add warranty status and days remaining to each asset
    const enrichedRows = rows.map(asset => {
      const assetData = asset.toJSON();
      const today = new Date();
      
      // Calculate warranty status
      if (assetData.warranty_end_date) {
        const warrantyEnd = new Date(assetData.warranty_end_date);
        const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
        
        if (warrantyEnd < today) {
          assetData.warranty_info = {
            status: "Expired",
            days_remaining: 0,
            end_date: assetData.warranty_end_date
          };
        } else {
          assetData.warranty_info = {
            status: "Active",
            days_remaining: daysRemaining,
            end_date: assetData.warranty_end_date
          };
        }
      } else {
        assetData.warranty_info = {
          status: "No Warranty",
          days_remaining: null,
          end_date: null
        };
      }
      
      // Add formatted specs for display
      if (assetData.asset_type === "Laptop" || assetData.asset_type === "Desktop PC") {
        assetData.specifications = {
          ram: assetData.ram_capacity || "N/A",
          storage: assetData.hard_drive || "N/A",
          processor: assetData.processor || "N/A",
          os: assetData.os || "N/A"
        };
      }
      
      return assetData;
    });

    // Calculate summary statistics
    const summary = {
      total: count,
      by_status: {
        available: rows.filter(a => a.status === "AVAILABLE").length,
        allocated: rows.filter(a => a.status === "ALLOCATED").length,
        under_repair: rows.filter(a => a.status === "UNDER_REPAIR").length,
        retired: rows.filter(a => a.status === "RETIRED").length
      },
      by_type: {
        laptop: rows.filter(a => a.asset_type === "Laptop").length,
        desktop: rows.filter(a => a.asset_type === "Desktop PC").length,
        monitor: rows.filter(a => a.asset_type === "Monitor").length,
        printer: rows.filter(a => a.asset_type === "Printer").length,
        other: rows.filter(a => a.asset_type === "Other").length
      },
      warranty_summary: {
        active: enrichedRows.filter(a => a.warranty_info.status === "Active").length,
        expired: enrichedRows.filter(a => a.warranty_info.status === "Expired").length,
        no_warranty: enrichedRows.filter(a => a.warranty_info.status === "No Warranty").length
      }
    };

    res.status(200).json({
      success: true,
      message: `Found ${count} assets`,
      pagination: {
        current_page: parseInt(page),
        per_page: parsedLimit,
        total_items: count,
        total_pages: Math.ceil(count / parsedLimit),
        has_next: parseInt(page) < Math.ceil(count / parsedLimit),
        has_prev: parseInt(page) > 1
      },
      summary: summary,
      data: enrichedRows,
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
          as: "asset",  // Add this alias
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "os", "model"]
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
      success: false,
      error: error.message,
      message: "Failed to fetch allocations"
    });
  }
};
exports.getAllocationHistory = async (req, res) => {
  try {
    const { asset_id } = req.params;

    // Validate asset_id
    if (!asset_id || isNaN(asset_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset ID provided",
      });
    }

    // First check if asset exists
    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const allocations = await AssetAllocation.findAll({
      where: { asset_id },
      include: [
        { 
          model: Asset, 
          as: "asset",  // Alias for main asset
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "model", "status"]
        },
        { 
          model: Asset, 
          as: "allocated_monitor",  // Alias for monitor (if you want to include monitor details)
          attributes: ["asset_id", "serial_no", "brand", "model"],
          required: false  // LEFT JOIN - some allocations may not have monitor
        },
        { 
          model: Branch, 
          as: "branch",
          attributes: ["branch_id", "location"],
          required: false
        },
        { 
          model: Department, 
          as: "department",
          attributes: ["department_id", "department_name"],
          required: false
        }
      ],
      order: [["allocated_date", "DESC"]],
    });

    // Calculate additional info for each allocation
    const enrichedAllocations = allocations.map(allocation => {
      const allocData = allocation.toJSON();
      
      // Add duration if returned
      if (allocData.allocated_date && allocData.return_date) {
        const allocated = new Date(allocData.allocated_date);
        const returned = new Date(allocData.return_date);
        const durationDays = Math.ceil((returned - allocated) / (1000 * 60 * 60 * 24));
        allocData.duration_days = durationDays;
      }
      
      // Check if currently active
      allocData.is_active = !allocData.return_date;
      
      return allocData;
    });

    res.status(200).json({
      success: true,
      message: `Found ${enrichedAllocations.length} allocation records for asset ${asset.serial_no}`,
      asset_info: {
        asset_id: asset.asset_id,
        serial_no: asset.serial_no,
        asset_type: asset.asset_type,
        brand: asset.brand,
        model: asset.model,
        current_status: asset.status
      },
      total_allocations: enrichedAllocations.length,
      active_allocations: enrichedAllocations.filter(a => a.is_active).length,
      completed_allocations: enrichedAllocations.filter(a => !a.is_active).length,
      data: enrichedAllocations,
    });

  } catch (error) {
    console.error("Error fetching allocation history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching allocation history",
      error: error.message,
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
          as: "asset",  // Add this alias
          attributes: ["serial_no", "asset_type", "brand", "model"]
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
      success: false,
      error: error.message 
    });
  }
};
exports.getAllocationHistoryBySerialNo = async (req, res) => {
  try {
    const { serial_no } = req.params;

    if (!serial_no) {
      return res.status(400).json({ 
        success: false,
        message: "Serial number is required" 
      });
    }

    const asset = await Asset.findOne({ where: { serial_no } });
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Asset not found" 
      });
    }

    const allocations = await AssetAllocation.findAll({
      where: { asset_id: asset.asset_id },
      include: [
        {
          model: Asset,
          as: "asset",  // Add this alias
          attributes: ["asset_id", "serial_no", "asset_type", "brand", "model"]
        },
        {
          model: Branch,
          as: "branch",
          attributes: ["location"]
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_name"]
        }
      ],
      order: [["allocated_date", "DESC"]]
    });

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
exports.asset_handover = async (req, res) => {
  try {
    const { allocation_id } = req.params;
    const { return_date, return_condition, remarks } = req.body;

    // Validate allocation_id
    if (!allocation_id || isNaN(allocation_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid allocation ID provided",
      });
    }

    // Find allocation with proper alias
    const allocation = await AssetAllocation.findByPk(allocation_id, {
      include: [
        { 
          model: Asset, 
          as: "asset"  // FIXED: Added 'as' alias
        }
      ],
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Allocation record not found",
      });
    }

    // Check if already returned
    if (allocation.return_date) {
      return res.status(400).json({
        success: false,
        message: "Asset already returned",
        data: {
          allocation_id: allocation.allocation_id,
          return_date: allocation.return_date,
          return_condition: allocation.return_condition
        }
      });
    }

    const transaction = await Asset.sequelize.transaction();

    try {
      // Update allocation with return date
      const updateData = {
        return_date: return_date || new Date(),
        return_condition: return_condition || "Good",
        return_remarks: remarks || null,
      };
      
      await allocation.update(updateData, { transaction });

      // Update asset status back to AVAILABLE
      if (allocation.asset) {
        await allocation.asset.update({ status: "AVAILABLE" }, { transaction });
      }

      // If monitor was allocated, return it too
      if (allocation.allocated_monitor_id) {
        const monitor = await Asset.findByPk(allocation.allocated_monitor_id);
        if (monitor && monitor.status === "ALLOCATED") {
          await monitor.update({ status: "AVAILABLE" }, { transaction });
        }
      }

      // Commit the transaction
      await transaction.commit();

      // Fetch updated allocation with all details
      const updatedAllocation = await AssetAllocation.findByPk(allocation_id, {
        include: [
          { 
            model: Asset, 
            as: "asset",
            attributes: ["asset_id", "serial_no", "asset_type", "brand", "model", "status"]
          },
          { 
            model: Asset, 
            as: "allocated_monitor",
            attributes: ["asset_id", "serial_no", "brand", "model"],
            required: false
          },
          { 
            model: Branch, 
            as: "branch",
            attributes: ["branch_id", "location"],
            required: false
          },
          { 
            model: Department, 
            as: "department",
            attributes: ["department_id", "department_name"],
            required: false
          }
        ],
      });

      res.status(200).json({
        success: true,
        message: "Asset returned successfully. Status updated to AVAILABLE",
        data: {
          allocation: updatedAllocation,
          asset_status: "AVAILABLE",
          return_details: updateData
        },
      });

    } catch (error) {
      // Only rollback if transaction is not already finished
      if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      console.error("Transaction error:", error);
      throw error;
    }

  } catch (error) {
    console.error("Error returning asset:", error);
    res.status(500).json({
      success: false,
      message: "Error returning asset",
      error: error.message,
    });
  }
};

exports.disposeAsset = async (req, res) => {
  const transaction = await Asset.sequelize.transaction();
  
  try {
    const {
      asset_id,
      serial_no,
      disposed_location,
      disposed_reason,
      disposed_by
    } = req.body;

    // Validation - Check required fields
    if (!asset_id || !serial_no || !disposed_location) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: asset_id, serial_no, disposed_location"
      });
    }

    // Validate disposed location
    if (!validateDisposedLocation(disposed_location)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid disposal location. Valid locations are: Borella, Location 1, Location 2`
      });
    }

    // Find the asset
    const asset = await Asset.findOne({
      where: { 
        asset_id: asset_id,
        serial_no: serial_no 
      },
      transaction
    });

    if (!asset) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Asset not found with the provided asset_id and serial_no"
      });
    }

    // Check if asset is already disposed
    if (asset.status === "RETIRED") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Asset has already been disposed",
        data: {
          asset_id: asset.asset_id,
          serial_no: asset.serial_no,
          current_status: asset.status
        }
      });
    }

    // Check if asset is currently allocated
    let activeAllocation = null;
    if (asset.status === "ALLOCATED") {
      activeAllocation = await AssetAllocation.findOne({
        where: {
          asset_id: asset.asset_id,
          return_date: null
        },
        transaction
      });
    }

    // Get disposed_by from request or default
    const disposedByName = disposed_by || req.user?.username || "System Admin";

    // Create disposed asset record
    const disposedAsset = await DisposedAsset.create({
      asset_id: asset.asset_id,
      serial_no: asset.serial_no,
      asset_type: asset.asset_type,
      brand: asset.brand,
      os: asset.os,
      purchase_date: asset.purchase_date,
      disposed_location: disposed_location,
      disposed_by: disposedByName,
      disposed_date: new Date(),
      disposed_reason: disposed_reason || null
    }, { transaction });

    // If asset was allocated, close the allocation
    if (activeAllocation) {
      await activeAllocation.update({
        return_date: new Date(),
        return_remarks: `DISPOSED: ${disposed_reason || 'Asset disposed'}`
      }, { transaction });
    }

    // If monitor was allocated with Desktop PC, also dispose or return it
    if (activeAllocation && activeAllocation.allocated_monitor_id) {
      const monitor = await Asset.findByPk(activeAllocation.allocated_monitor_id, { transaction });
      if (monitor && monitor.status === "ALLOCATED") {
        await monitor.update({ status: "AVAILABLE" }, { transaction });
      }
    }

    // Update asset status to RETIRED
    await asset.update({ 
      status: "RETIRED"
    }, { transaction });

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Asset disposed successfully",
      data: {
        disposed_asset: disposedAsset,
        asset_status: "RETIRED",
        previous_status: asset.status,
        allocation_closed: !!activeAllocation
      }
    });

  } catch (error) {
    // Rollback transaction on error
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error("Error disposing asset:", error);
    res.status(500).json({
      success: false,
      message: "Error disposing asset",
      error: error.message
    });
  }
};
exports.bulkDisposeAssets = async (req, res) => {
  const transaction = await Asset.sequelize.transaction();
  
  try {
    const { assets, disposed_location, disposed_reason, disposed_by } = req.body;

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide an array of assets to dispose"
      });
    }

    if (!disposed_location) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Disposed location is required for all assets"
      });
    }

    if (!validateDisposedLocation(disposed_location)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid disposal location. Valid locations are: Borella, Location 1, Location 2`
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    const disposedByName = disposed_by || req.user?.username || "System Admin";

    for (const item of assets) {
      try {
        const { asset_id, serial_no, disposed_reason: itemReason } = item;
        const reason = itemReason || disposed_reason;

        // Find the asset
        const asset = await Asset.findOne({
          where: { asset_id, serial_no },
          transaction
        });

        if (!asset) {
          results.failed.push({
            asset_id,
            serial_no,
            error: "Asset not found"
          });
          continue;
        }

        if (asset.status === "RETIRED") {
          results.failed.push({
            asset_id,
            serial_no,
            error: "Asset already disposed"
          });
          continue;
        }

        // Check for active allocation
        let activeAllocation = null;
        if (asset.status === "ALLOCATED") {
          activeAllocation = await AssetAllocation.findOne({
            where: {
              asset_id: asset.asset_id,
              return_date: null
            },
            transaction
          });
        }

        // Create disposed asset record
        await DisposedAsset.create({
          asset_id: asset.asset_id,
          serial_no: asset.serial_no,
          asset_type: asset.asset_type,
          brand: asset.brand,
          os: asset.os,
          purchase_date: asset.purchase_date,
          disposed_location: disposed_location,
          disposed_by: disposedByName,
          disposed_date: new Date(),
          disposed_reason: reason || null
        }, { transaction });

        // Close allocation if exists
        if (activeAllocation) {
          await activeAllocation.update({
            return_date: new Date(),
            return_remarks: `BULK DISPOSED: ${reason || 'Asset disposed'}`
          }, { transaction });
        }

        // Update asset status
        await asset.update({ status: "RETIRED" }, { transaction });

        results.successful.push({
          asset_id: asset.asset_id,
          serial_no: asset.serial_no,
          asset_type: asset.asset_type,
          status: "RETIRED"
        });

      } catch (error) {
        results.failed.push({
          asset_id: item.asset_id,
          serial_no: item.serial_no,
          error: error.message
        });
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Successfully disposed ${results.successful.length} out of ${assets.length} assets`,
      data: {
        total_requested: assets.length,
        total_disposed: results.successful.length,
        total_failed: results.failed.length,
        successful: results.successful,
        failed: results.failed
      }
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error("Error bulk disposing assets:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk disposing assets",
      error: error.message
    });
  }
};
exports.getDisposedAssets = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      location, 
      asset_type,
      page = 1, 
      limit = 20 
    } = req.query;

    let whereClause = {};

    // Filter by disposed date range
    if (start_date || end_date) {
      whereClause.disposed_date = {};
      if (start_date) {
        whereClause.disposed_date[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.disposed_date[Op.lte] = new Date(end_date);
      }
    }

    // Filter by disposed location
    if (location) {
      whereClause.disposed_location = location;
    }

    // Filter by asset type
    if (asset_type) {
      whereClause.asset_type = asset_type;
    }

    // Pagination
    const offset = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    const { count, rows } = await DisposedAsset.findAndCountAll({
      where: whereClause,
      order: [["disposed_date", "DESC"]],
      limit: parsedLimit,
      offset: parsedOffset
    });

    // Calculate summary
    const summary = {
      total_disposed: count,
      by_location: {
        Borella: rows.filter(a => a.disposed_location === "Borella").length,
        "Location 1": rows.filter(a => a.disposed_location === "Location 1").length,
        "Location 2": rows.filter(a => a.disposed_location === "Location 2").length
      },
      by_asset_type: {
        Laptop: rows.filter(a => a.asset_type === "Laptop").length,
        "Desktop PC": rows.filter(a => a.asset_type === "Desktop PC").length,
        Monitor: rows.filter(a => a.asset_type === "Monitor").length,
        Printer: rows.filter(a => a.asset_type === "Printer").length,
        Other: rows.filter(a => a.asset_type === "Other").length
      }
    };

    res.status(200).json({
      success: true,
      message: `Found ${count} disposed assets`,
      pagination: {
        current_page: parseInt(page),
        per_page: parsedLimit,
        total_items: count,
        total_pages: Math.ceil(count / parsedLimit)
      },
      summary: summary,
      data: rows
    });

  } catch (error) {
    console.error("Error fetching disposed assets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disposed assets",
      error: error.message
    });
  }
};
exports.getDisposedAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid disposed asset ID"
      });
    }

    const disposedAsset = await DisposedAsset.findByPk(id);

    if (!disposedAsset) {
      return res.status(404).json({
        success: false,
        message: "Disposed asset not found"
      });
    }

    res.status(200).json({
      success: true,
      data: disposedAsset
    });

  } catch (error) {
    console.error("Error fetching disposed asset:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disposed asset",
      error: error.message
    });
  }
};
exports.getDisposedAssetsByLocation = async (req, res) => {
  try {
    const { location } = req.params;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location is required"
      });
    }

    if (!validateDisposedLocation(location)) {
      return res.status(400).json({
        success: false,
        message: `Invalid location. Valid locations are: Borella, Location 1, Location 2`
      });
    }

    const disposedAssets = await DisposedAsset.findAll({
      where: { disposed_location: location },
      order: [["disposed_date", "DESC"]]
    });

    res.status(200).json({
      success: true,
      count: disposedAssets.length,
      location: location,
      data: disposedAssets
    });

  } catch (error) {
    console.error("Error fetching disposed assets by location:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disposed assets",
      error: error.message
    });
  }
};
exports.getDisposalStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Get all disposed assets
    const disposedAssets = await DisposedAsset.findAll({
      where: {
        disposed_date: {
          [Op.between]: [
            new Date(`${currentYear}-01-01`),
            new Date(`${currentYear}-12-31`)
          ]
        }
      }
    });

    // Monthly breakdown
    const monthlyBreakdown = {};
    for (let i = 1; i <= 12; i++) {
      monthlyBreakdown[i] = 0;
    }

    disposedAssets.forEach(asset => {
      const month = new Date(asset.disposed_date).getMonth() + 1;
      monthlyBreakdown[month]++;
    });

    // Statistics by reason
    const reasonsBreakdown = {};
    disposedAssets.forEach(asset => {
      const reason = asset.disposed_reason || "No reason provided";
      reasonsBreakdown[reason] = (reasonsBreakdown[reason] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      year: currentYear,
      statistics: {
        total_disposed: disposedAssets.length,
        monthly_breakdown: monthlyBreakdown,
        by_location: {
          Borella: disposedAssets.filter(a => a.disposed_location === "Borella").length,
          "Location 1": disposedAssets.filter(a => a.disposed_location === "Location 1").length,
          "Location 2": disposedAssets.filter(a => a.disposed_location === "Location 2").length
        },
        by_asset_type: {
          Laptop: disposedAssets.filter(a => a.asset_type === "Laptop").length,
          "Desktop PC": disposedAssets.filter(a => a.asset_type === "Desktop PC").length,
          Monitor: disposedAssets.filter(a => a.asset_type === "Monitor").length,
          Printer: disposedAssets.filter(a => a.asset_type === "Printer").length,
          Other: disposedAssets.filter(a => a.asset_type === "Other").length
        },
        by_reason: reasonsBreakdown
      }
    });

  } catch (error) {
    console.error("Error fetching disposal statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching disposal statistics",
      error: error.message
    });
  }
};
exports.restoreDisposedAsset = async (req, res) => {
  const transaction = await Asset.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { restore_reason } = req.body;

    // Find disposed asset record
    const disposedAsset = await DisposedAsset.findByPk(id, { transaction });

    if (!disposedAsset) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Disposed asset record not found"
      });
    }

    // Find the original asset
    const asset = await Asset.findByPk(disposedAsset.asset_id, { transaction });

    if (!asset) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Original asset not found"
      });
    }

    // Check if asset can be restored
    if (asset.status !== "RETIRED") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot restore asset with status: ${asset.status}. Only RETIRED assets can be restored.`
      });
    }

    // Update asset status back to AVAILABLE
    await asset.update({
      status: "AVAILABLE"
    }, { transaction });

    // Delete or mark the disposed record
    await disposedAsset.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Asset restored successfully from disposal",
      data: {
        asset: asset,
        restore_reason: restore_reason || "Restored from disposal",
        restored_date: new Date()
      }
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    console.error("Error restoring disposed asset:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring disposed asset",
      error: error.message
    });
  }
};










































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
        success: false,
        message: "Missing required fields: asset_id, serial_no, disposed_location"
      });
    }

    // Validate location (update with your actual locations)
    const validLocations = ["Boralla", "Colombo", "Kandy", "Galle"];
    if (!validLocations.includes(disposed_location)) {
      return res.status(400).json({
        success: false,
        message: `Invalid disposal location. Allowed: ${validLocations.join(", ")}`
      });
    }

    // Find the asset
    const asset = await Asset.findOne({
      where: { asset_id, serial_no }
    });

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Asset not found" 
      });
    }

    // Check if already disposed
    if (asset.status === "RETIRED") {
      return res.status(400).json({ 
        success: false,
        message: "Asset has already been disposed" 
      });
    }

    // Get disposed_by from request or default
    const disposed_by = req.body.disposed_by || "System Admin";

    // Start transaction
    const transaction = await Asset.sequelize.transaction();

    try {
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
      }, { transaction });

      // If asset was allocated, update allocation with return date
      if (asset.status === "ALLOCATED") {
        const allocation = await AssetAllocation.findOne({
          where: {
            asset_id: asset.asset_id,
            return_date: null
          },
          transaction
        });

        if (allocation) {
          await allocation.update({
            return_date: new Date(),
            return_remarks: `DISPOSED: ${disposed_reason || 'No reason provided'}`
          }, { transaction });
        }
      }

      // Update asset status to RETIRED
      await asset.update({ 
        status: "RETIRED" 
      }, { transaction });

      // Commit the transaction
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Asset disposed successfully",
        data: {
          disposed_asset: disposedAsset,
          asset_status: asset.status
        }
      });

    } catch (error) {
      // Only rollback if transaction is not already finished
      if (transaction && transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
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
      success: false,
      message: "Failed to fetch disposed assets",
      error: error.message
    });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Check duplicate serial number if being updated
    if (updateData.serial_no && updateData.serial_no !== asset.serial_no) {
      const existingAsset = await Asset.findOne({
        where: {
          serial_no: updateData.serial_no,
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

    // Recalculate warranty end date if purchase_date or warranty_period_months changed
    if (updateData.purchase_date || updateData.warranty_period_months) {
      const purchaseDate = updateData.purchase_date || asset.purchase_date;
      const warrantyPeriod = updateData.warranty_period_months || asset.warranty_period_months;
      
      if (purchaseDate && warrantyPeriod) {
        updateData.warranty_end_date = calculateWarrantyEndDate(purchaseDate, warrantyPeriod);
      }
    }

    await asset.update(updateData);

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
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
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Check if asset is allocated
    if (asset.status === "ALLOCATED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete allocated asset. Please return the asset first.",
      });
    }

    // Soft delete - update status to RETIRED
    await asset.update({ status: "RETIRED" });

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: asset,
    });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting asset",
      error: error.message,
    });
  }
};


exports.bulkDisposeAssets = async (req, res) => {
  const transaction = await Asset.sequelize.transaction();
  
  try {
    const { asset_ids, disposed_location, disposed_reason, disposed_by } = req.body;

    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide an array of asset IDs to dispose",
      });
    }

    const validLocations = ["Boralla", "Colombo", "Kandy", "Galle"];
    if (!validLocations.includes(disposed_location)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid disposal location. Allowed: ${validLocations.join(", ")}`,
      });
    }

    const results = [];
    const errors = [];

    for (const asset_id of asset_ids) {
      try {
        const asset = await Asset.findByPk(asset_id, { transaction });
        
        if (!asset) {
          errors.push({ asset_id, error: "Asset not found" });
          continue;
        }

        if (asset.status === "RETIRED") {
          errors.push({ asset_id, error: "Asset already disposed" });
          continue;
        }

        // Create disposed asset record
        await DisposedAsset.create({
          asset_id: asset.asset_id,
          serial_no: asset.serial_no,
          asset_type: asset.asset_type,
          brand: asset.brand,
          os: asset.os,
          purchase_date: asset.purchase_date,
          disposed_location,
          disposed_by: disposed_by || "System Admin",
          disposed_date: new Date(),
          disposed_reason: disposed_reason || null,
        }, { transaction });

        // If asset was allocated, update allocation
        if (asset.status === "ALLOCATED") {
          const allocation = await AssetAllocation.findOne({
            where: {
              asset_id: asset.asset_id,
              return_date: null,
            },
            transaction,
          });

          if (allocation) {
            await allocation.update({
              return_date: new Date(),
              return_remarks: `BULK DISPOSED: ${disposed_reason || "No reason provided"}`,
            }, { transaction });
          }
        }

        // Update asset status
        await asset.update({ status: "RETIRED" }, { transaction });
        
        results.push({
          asset_id: asset.asset_id,
          serial_no: asset.serial_no,
          status: "RETIRED",
        });

      } catch (error) {
        errors.push({ asset_id, error: error.message });
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Successfully disposed ${results.length} assets`,
      data: {
        disposed: results,
        errors: errors,
        total_requested: asset_ids.length,
        total_disposed: results.length,
        total_errors: errors.length,
      },
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error bulk disposing assets:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk disposing assets",
      error: error.message,
    });
  }
};

// Restore asset from disposed status
exports.restoreAsset = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const { restore_reason } = req.body;

    const asset = await Asset.findByPk(asset_id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    if (asset.status !== "RETIRED") {
      return res.status(400).json({
        success: false,
        message: `Cannot restore asset with status: ${asset.status}. Only RETIRED assets can be restored.`,
      });
    }

    await asset.update({
      status: "AVAILABLE",
      disposal_reason: null,
      disposal_date: null,
      disposal_method: null,
      disposal_remarks: null,
      restoration_reason: restore_reason,
      restoration_date: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Asset restored successfully",
      data: asset,
    });

  } catch (error) {
    console.error("Error restoring asset:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring asset",
      error: error.message,
    });
  }
};

// Get dashboard statistics
exports.getDashboardStatistics = async (req, res) => {
  try {
    const totalAssets = await Asset.count();
    const availableAssets = await Asset.count({ where: { status: "AVAILABLE" } });
    const allocatedAssets = await Asset.count({ where: { status: "ALLOCATED" } });
    const underRepairAssets = await Asset.count({ where: { status: "UNDER_REPAIR" } });
    const retiredAssets = await Asset.count({ where: { status: "RETIRED" } });
    
    const laptops = await Asset.count({ where: { asset_type: "Laptop" } });
    const desktops = await Asset.count({ where: { asset_type: "Desktop PC" } });
    const monitors = await Asset.count({ where: { asset_type: "Monitor" } });
    const printers = await Asset.count({ where: { asset_type: "Printer" } });
    
    const activeAllocations = await AssetAllocation.count({
      where: { return_date: null },
    });
    
    const expiringWarranty = await Asset.count({
      where: {
        warranty_end_date: {
          [Op.ne]: null,
          [Op.between]: [new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)],
        },
        status: { [Op.ne]: "RETIRED" },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        total_assets: totalAssets,
        available_assets: availableAssets,
        allocated_assets: allocatedAssets,
        under_repair_assets: underRepairAssets,
        retired_assets: retiredAssets,
        assets_by_type: {
          laptop: laptops,
          desktop: desktops,
          monitor: monitors,
          printer: printers,
        },
        active_allocations: activeAllocations,
        expiring_warranty_count: expiringWarranty,
      },
    });

  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// Get assets by type report
exports.getAssetsByTypeReport = async (req, res) => {
  try {
    const assetTypes = ["Laptop", "Desktop PC", "Monitor", "Printer", "Other"];
    const report = [];

    for (const type of assetTypes) {
      const total = await Asset.count({ where: { asset_type: type } });
      const available = await Asset.count({ where: { asset_type: type, status: "AVAILABLE" } });
      const allocated = await Asset.count({ where: { asset_type: type, status: "ALLOCATED" } });
      
      report.push({
        asset_type: type,
        total: total,
        available: available,
        allocated: allocated,
        utilization_rate: total > 0 ? ((allocated / total) * 100).toFixed(2) : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error("Error generating asset type report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: error.message,
    });
  }
};

// Get assets by status report
exports.getAssetsByStatusReport = async (req, res) => {
  try {
    const statuses = ["AVAILABLE", "ALLOCATED", "UNDER_REPAIR", "RETIRED"];
    const report = [];

    for (const status of statuses) {
      const count = await Asset.count({ where: { status } });
      report.push({
        status: status,
        count: count,
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error("Error generating status report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: error.message,
    });
  }
};
exports.getAllocationSummary = async (req, res) => {
  try {
    const totalAllocations = await AssetAllocation.count();
    const activeAllocations = await AssetAllocation.count({ where: { return_date: null } });
    const completedAllocations = await AssetAllocation.count({ where: { return_date: { [Op.ne]: null } } });
    
    const allocationsByBranch = await AssetAllocation.findAll({
      attributes: [
        [sequelize.col('branch.location'), 'branch_name'],
        [sequelize.fn('COUNT', sequelize.col('AssetAllocation.allocation_id')), 'count'],
      ],
      include: [{ model: Branch, as: 'branch', attributes: [] }],
      where: { return_date: null },
      group: ['branch.branch_id', 'branch.location'],
      raw: true,
    });

    const recentAllocations = await AssetAllocation.findAll({
      limit: 10,
      order: [["allocated_date", "DESC"]],
      include: [
        { model: Asset, as: "asset", attributes: ["serial_no", "asset_type", "brand"] },
        { model: Branch, as: "branch", attributes: ["location"] },
        { model: Department, as: "department", attributes: ["department_name"] },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        total_allocations: totalAllocations,
        active_allocations: activeAllocations,
        completed_allocations: completedAllocations,
        allocations_by_branch: allocationsByBranch,
        recent_allocations: recentAllocations,
      },
    });

  } catch (error) {
    console.error("Error fetching allocation summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching allocation summary",
      error: error.message,
    });
  }
};

// Get dashboard statistics
exports.getDashboardStatistics = async (req, res) => {
  try {
    // Get all assets
    const allAssets = await Asset.findAll();
    
    // Calculate total assets by status
    const totalAssets = allAssets.length;
    const availableAssets = allAssets.filter(a => a.status === "AVAILABLE").length;
    const allocatedAssets = allAssets.filter(a => a.status === "ALLOCATED").length;
    const underRepairAssets = allAssets.filter(a => a.status === "UNDER_REPAIR").length;
    const retiredAssets = allAssets.filter(a => a.status === "RETIRED").length;
    
    // Calculate assets by type
    const assetsByType = {
      laptop: allAssets.filter(a => a.asset_type === "Laptop").length,
      desktop: allAssets.filter(a => a.asset_type === "Desktop PC").length,
      monitor: allAssets.filter(a => a.asset_type === "Monitor").length,
      printer: allAssets.filter(a => a.asset_type === "Printer").length,
      other: allAssets.filter(a => a.asset_type === "Other").length
    };
    
    // Get allocation statistics
    const totalAllocations = await AssetAllocation.count();
    const activeAllocations = await AssetAllocation.count({ 
      where: { return_date: null } 
    });
    const completedAllocations = await AssetAllocation.count({ 
      where: { return_date: { [Op.ne]: null } } 
    });
    
    // Get assets with expiring warranty (next 3 months)
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    const expiringWarrantyAssets = await Asset.findAll({
      where: {
        warranty_end_date: {
          [Op.ne]: null,
          [Op.between]: [today, threeMonthsLater]
        },
        status: {
          [Op.ne]: "RETIRED"
        }
      },
      attributes: ["asset_id", "serial_no", "asset_type", "brand", "model", "warranty_end_date"]
    });
    
    // Get recent allocations (last 5)
    const recentAllocations = await AssetAllocation.findAll({
      limit: 5,
      order: [["allocated_date", "DESC"]],
      include: [
        { model: Asset, as: "asset", attributes: ["brand", "model", "asset_type"] },
        { model: Branch, as: "branch", attributes: ["location"] },
        { model: Department, as: "department", attributes: ["department_name"] }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        total_assets: totalAssets,
        available_assets: availableAssets,
        allocated_assets: allocatedAssets,
        under_repair_assets: underRepairAssets,
        retired_assets: retiredAssets,
        assets_by_type: assetsByType,
        total_allocations: totalAllocations,
        active_allocations: activeAllocations,
        completed_allocations: completedAllocations,
        expiring_warranty_count: expiringWarrantyAssets.length,
        expiring_warranty_assets: expiringWarrantyAssets,
        recent_allocations: recentAllocations
      }
    });
    
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
};