const grpoService = require('../services/grpoService');

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
    const data = await grpoService.getReferenceData(req.query.company_id);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load GRPO reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    const data = await grpoService.getVendorDetails(req.params.vendorCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getGRPOs = async (req, res) => {
  try {
    const data = await grpoService.getGRPOList();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load GRPOs.'));
  }
};

const getGRPOByDocEntry = async (req, res) => {
  try {
    const data = await grpoService.getGRPO(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load GRPO details.'));
  }
};

const submitGRPO = async (req, res) => {
  try {
    const result = await grpoService.submitGRPO(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to submit GRPO.'));
  }
};

const updateGRPO = async (req, res) => {
  try {
    const result = await grpoService.updateGRPO(req.params.docEntry, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to update GRPO.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const data = await grpoService.getDocumentSeries();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    const data = await grpoService.getNextNumber(req.params.series);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromWarehouse = async (req, res) => {
  try {
    const { whsCode } = req.params;
    const data = await grpoService.getStateFromWarehouse(whsCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from warehouse.'));
  }
};

const getOpenPurchaseOrders = async (req, res) => {
  try {
    const { vendorCode } = req.query;
    const data = await grpoService.getOpenPurchaseOrders(vendorCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load open purchase orders.'));
  }
};

const getPurchaseOrderForCopy = async (req, res) => {
  try {
    const data = await grpoService.getPurchaseOrderForCopy(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load purchase order.'));
  }
};

const getBatchesByItem = async (req, res) => {
  try {
    const { itemCode, whsCode } = req.query;
    const data = await grpoService.getBatchesByItem(itemCode, whsCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load batches.'));
  }
};

const getItemsForModal = async (req, res) => {
  try {
    res.json(await grpoService.getItemsForModal());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    res.json(await grpoService.getFreightCharges(req.query.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

module.exports = {
  getReferenceData,
  getGRPOs,
  getGRPOByDocEntry,
  getVendorDetails,
  submitGRPO,
  updateGRPO,
  getDocumentSeries,
  getNextNumber,
  getStateFromWarehouse,
  getOpenPurchaseOrders,
  getPurchaseOrderForCopy,
  getBatchesByItem,
  getItemsForModal,
  getFreightCharges,
};
