const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assets.controller");


//Asset CRUD
router.post("/add-asset", assetController.add);
router.get("/assetsList", assetController.getAllAssets);
router.get("/asset-available/:type", assetController.getAvailableAssetsByType);

// Allocation routes
router.post("/asset-allocation", assetController.allocateAsset);
router.get("/getAllAllocations", assetController.getAllAllocations);
router.get("/allocations/branch/:branch_id", assetController.getAllocationsByBranch);

// Handover routes
router.post("/asset-handover", assetController.asset_handover);

// Asset details
router.get("/serial/:serial_no", assetController.getAssetDetailsBySerialNo);
router.get("/serial/:serial_no/history", assetController.getAllocationHistoryBySerialNo);


module.exports = router;