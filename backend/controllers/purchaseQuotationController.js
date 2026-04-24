const purchaseQuotationService = require('../services/purchaseQuotationService');

const getErrorPayload = (error, fallbackMessage) => ({
  detail:
    error.response?.data?.error?.message?.value ||
    error.response?.data?.error?.message ||
    error.response?.data ||
    error.message ||
    fallbackMessage,
});

const getReferenceData = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getReferenceData(req.query.company_id);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase quotation reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getVendorDetails(req.params.vendorCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getPurchaseQuotations = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getPurchaseQuotationList();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase quotations.'));
  }
};

const getPurchaseQuotationByDocEntry = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getPurchaseQuotation(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase quotation details.'));
  }
};

const submitPurchaseQuotation = async (req, res) => {
  try {
    const result = await purchaseQuotationService.submitPurchaseQuotation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to submit purchase quotation.'));
  }
};

const updatePurchaseQuotation = async (req, res) => {
  try {
    const result = await purchaseQuotationService.updatePurchaseQuotation(req.params.docEntry, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to update purchase quotation.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getDocumentSeries();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    const data = await purchaseQuotationService.getNextNumber(req.params.series);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromAddress = async (req, res) => {
  try {
    const { vendorCode, addressCode } = req.params;
    const data = await purchaseQuotationService.getStateFromAddress(vendorCode, addressCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from address.'));
  }
};

const getStateFromWarehouse = async (req, res) => {
  try {
    const { whsCode } = req.params;
    const data = await purchaseQuotationService.getStateFromWarehouse(whsCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from warehouse.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    res.json(await purchaseQuotationService.getFreightCharges(req.query.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

module.exports = {
  getReferenceData,
  getPurchaseQuotations,
  getPurchaseQuotationByDocEntry,
  getVendorDetails,
  submitPurchaseQuotation,
  updatePurchaseQuotation,
  getDocumentSeries,
  getNextNumber,
  getStateFromAddress,
  getStateFromWarehouse,
  getFreightCharges,
};
