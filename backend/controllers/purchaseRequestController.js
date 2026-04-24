const purchaseRequestService = require('../services/purchaseRequestService');

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
    const data = await purchaseRequestService.getReferenceData(req.query.company_id);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase request reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    const data = await purchaseRequestService.getVendorDetails(req.params.vendorCode);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getPurchaseRequests = async (req, res) => {
  try {
    const data = await purchaseRequestService.getPurchaseRequests();
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase requests.'));
  }
};

const getPurchaseRequestByDocEntry = async (req, res) => {
  try {
    const data = await purchaseRequestService.getPurchaseRequestByDocEntry(req.params.docEntry);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase request details.'));
  }
};

const getDocumentSeries = async (_req, res) => {
  try {
    const data = await purchaseRequestService.getDocumentSeries();
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    const data = await purchaseRequestService.getNextNumber(req.params.series);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromAddress = async (req, res) => {
  try {
    const data = await purchaseRequestService.getStateFromAddress(
      req.params.vendorCode,
      req.params.addressCode
    );
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to get state from address.'));
  }
};

const getStateFromWarehouse = async (req, res) => {
  try {
    const data = await purchaseRequestService.getStateFromWarehouse(req.params.whsCode);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to get state from warehouse.'));
  }
};

const getItemsForModal = async (_req, res) => {
  try {
    const data = await purchaseRequestService.getItemsForModal();
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    const data = await purchaseRequestService.getFreightCharges(req.query.docEntry);
    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

const submitPurchaseRequest = async (req, res) => {
  try {
    const result = await purchaseRequestService.submitPurchaseRequest(req.body);
    res.json(result);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to submit purchase request.'));
  }
};

const updatePurchaseRequest = async (req, res) => {
  try {
    const result = await purchaseRequestService.updatePurchaseRequest(req.params.docEntry, req.body);
    res.json(result);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(getErrorPayload(error, 'Failed to update purchase request.'));
  }
};

module.exports = {
  getReferenceData,
  getPurchaseRequests,
  getPurchaseRequestByDocEntry,
  getVendorDetails,
  getDocumentSeries,
  getNextNumber,
  getStateFromAddress,
  getStateFromWarehouse,
  getItemsForModal,
  submitPurchaseRequest,
  updatePurchaseRequest,
  getFreightCharges,
};
