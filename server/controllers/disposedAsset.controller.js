const { Op } = require("sequelize");
const Asset = require("../models/Asset");
const AssetAllocation = require("../models/AssetAllocation");
const DisposedAsset = require("../models/DisposedAsset");

// Helper function to validate disposed location
const validateDisposedLocation = (location) => {
  const validLocations = ["Borella", "Location 1", "Location 2"];
  return validLocations.includes(location);
};

// Dispose a single asset
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

// Bulk dispose multiple assets
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

// Get all disposed assets
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

// Get disposed asset by ID
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

// Get disposed assets by location
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

// Get disposal statistics/report
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

// Restore asset from disposed (undo disposal)
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