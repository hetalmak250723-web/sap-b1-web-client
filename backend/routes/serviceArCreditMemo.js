const express = require('express');
const controller = require('../controllers/serviceArCreditMemoController');

const router = express.Router();

router.get('/reference-data', controller.getReferenceData);
router.get('/list', controller.getServiceARCreditMemoList);
router.get('/series', controller.getDocumentSeries);
router.get('/series/next', controller.getNextNumber);
router.get('/customers/search', controller.getCustomerFilterOptions);
router.get('/customers/:customerCode', controller.getCustomerDetails);

router.get('/open-invoices', controller.getOpenServiceARInvoices);
router.get('/invoice/:docEntry/copy', controller.getServiceARInvoiceForCreditMemoCopy);

router.get('/:docEntry', controller.getServiceARCreditMemo);
router.post('/', controller.submitServiceARCreditMemo);
router.patch('/:docEntry', controller.updateServiceARCreditMemo);

module.exports = router;
