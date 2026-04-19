const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assets.controller");
const disposedAssetController = require("../controllers/disposedAsset.controller");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkPermission } = require("../middlewares/permissionCheck");

// All asset routes require authentication
router.use(verifyToken);



router.post("/add-asset", checkPermission("ADD_ASSET"), assetController.add_asset);
router.post("/asset-allocation", checkPermission("ALLOCATE_ASSET"), assetController.allocateAsset);
router.get("/available/:type", checkPermission("VIEW_ASSETS_LIST"), assetController.getAvailableAssetsByType);
router.get("/asset/:id", checkPermission("VIEW_ASSETS_LIST"), assetController.getAssetById);
router.get("/assetsList", checkPermission("VIEW_ASSETS_LIST"), assetController.getAllAssets);
router.get("/getAllAllocations", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllAllocations);
router.get("/expiring-warranty", checkPermission("VIEW_ASSETS_LIST"), assetController.getAssetsWithExpiringWarranty);
router.get("/allocations/asset/:asset_id", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocationHistory);
router.get("/allocations/branch/:branch_id", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocationsByBranch);
router.get("/serial/:serial_no/history", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocationHistoryBySerialNo);
// router.post("/asset-handover/:allocation_id", checkPermission("MANAGE_HANDOVER"), assetController.asset_handover);

router.post("/asset-handover/:allocation_id", checkPermission("MANAGE_HANDOVER"), assetController.asset_handover);

router.get("/serial/:serialNo", assetController.getAssetBySerial);

// Disposal routes
router.post("/dispose", checkPermission("DISPOSE_ASSET"), disposedAssetController.disposeAsset);
router.post("/bulk-dispose", checkPermission("DISPOSE_ASSET"), disposedAssetController.bulkDisposeAssets);
router.get("/disposed", checkPermission("VIEW_DISPOSED_LIST"), disposedAssetController.getDisposedAssets);
router.get("/disposed/:id", checkPermission("VIEW_DISPOSED_LIST"), disposedAssetController.getDisposedAssetById);
router.get("/disposed/location/:location", checkPermission("VIEW_DISPOSED_LIST"), disposedAssetController.getDisposedAssetsByLocation);
router.get("/disposal-statistics", checkPermission("VIEW_REPORTS"), disposedAssetController.getDisposalStatistics);
router.post("/restore/:id", checkPermission("EDIT_ASSET"), disposedAssetController.restoreDisposedAsset);

router.get("/statistics/dashboard", checkPermission("VIEW_REPORTS"), assetController.getDashboardStatistics);



module.exports = router;