const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assets.controller");

router.post("/add-asset", assetController.add);
router.get("/assetsList", assetController.getAllAssets);

router.post("/asset-allocation", assetController.asset_allocation);
router.post("/asset-handover", assetController.asset_handover);
router.get("/serial/:serial_no", assetController.getAssetDetailsBySerialNo);
router.post("/allocate-asset", assetController.allocateAsset);
router.get("/getAllAllocations", assetController.getAllAllocations);

router.post("/createRequest", assetController.createRequest);
router.get("/getAllRequests", assetController.getAllRequests);
router.put("/:req_id/status", assetController.updateRequestStatus);

module.exports = router;
