const express = require("express");
const salesController = require("../controllers/reports/salesAnalysis.controller");
const purchaseController = require("../controllers/reports/purchaseAnalysis.controller");

const router = express.Router();

router.get("/customers", salesController.lookupCustomers);
router.get("/items", salesController.lookupItems);
router.get("/sales-employees", salesController.lookupSalesEmployees);
router.get("/customer-groups", salesController.lookupCustomerGroups);
router.get("/item-groups", salesController.lookupItemGroups);
router.get("/customer-properties", salesController.lookupCustomerProperties);
router.get("/item-properties", salesController.lookupItemProperties);

router.get("/purchase-vendors", purchaseController.lookupVendors);
router.get("/purchase-items", purchaseController.lookupItems);
router.get("/purchasing-employees", purchaseController.lookupPurchasingEmployees);
router.get("/purchase-vendor-groups", purchaseController.lookupVendorGroups);
router.get("/purchase-item-groups", purchaseController.lookupItemGroups);
router.get("/purchase-vendor-properties", purchaseController.lookupVendorProperties);
router.get("/purchase-item-properties", purchaseController.lookupItemProperties);

module.exports = router;
