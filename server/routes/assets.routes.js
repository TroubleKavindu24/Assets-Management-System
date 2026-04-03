const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assets.controller");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkPermission } = require("../middlewares/permissionCheck");

// All asset routes require authentication
router.use(verifyToken);

// Asset CRUD with permission checks
router.post("/add-asset", checkPermission("ADD_ASSET"), assetController.add);
router.get("/assetsList", checkPermission("VIEW_ASSETS_LIST"), assetController.getAllAssets);
router.get("/asset-available/:type", checkPermission("VIEW_ASSETS_LIST"), assetController.getAvailableAssetsByType);

// Allocation routes with permission checks
router.post("/asset-allocation", checkPermission("ALLOCATE_ASSET"), assetController.allocateAsset);
router.get("/getAllAllocations", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllAllocations);
router.get("/allocations/branch/:branch_id", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocationsByBranch);

// Handover routes with permission checks
router.post("/asset-handover", checkPermission("MANAGE_HANDOVER"), assetController.asset_handover);

// Asset details (view only - lower permission)
router.get("/serial/:serial_no", checkPermission("VIEW_ASSETS_LIST"), assetController.getAssetDetailsBySerialNo);
router.get("/serial/:serial_no/history", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocationHistoryBySerialNo);
router.get("/allocated-assets", checkPermission("VIEW_ALLOCATIONS_LIST"), assetController.getAllocatedAssets);

// Dispose routes with permission checks
router.post("/asset-dispose", checkPermission("DISPOSE_ASSET"), assetController.disposeAsset);
router.get("/disposed-assets", checkPermission("VIEW_DISPOSED_LIST"), assetController.getDisposedAssets);

module.exports = router;