const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assets.controller");

router.post("/add-asset", assetController.add);
router.get("/assetsList", assetController.getAllAssets);

router.post("/asset-allocation", assetController.allocateAsset);
router.get("/asset-available/:type", assetController.getAvailableAssetsByType);

router.post("/asset-handover", assetController.asset_handover);
router.get("/serial/:serial_no", assetController.getAssetDetailsBySerialNo);
// router.post("/allocate-asset", assetController.allocateAsset);
router.get("/getAllAllocations", assetController.getAllAllocations);



module.exports = router;
