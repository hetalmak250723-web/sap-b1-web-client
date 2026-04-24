const apCreditMemoService = require('../services/apCreditMemoService');

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
    res.json(await apCreditMemoService.getReferenceData(req.query.company_id));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Credit Memo reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getVendorDetails(req.params.vendorCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getAPCreditMemos = async (_req, res) => {
  try {
    res.json(await apCreditMemoService.getAPCreditMemoList());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Credit Memos.'));
  }
};

const getAPCreditMemoByDocEntry = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getAPCreditMemo(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Credit Memo details.'));
  }
};

const submitAPCreditMemo = async (req, res) => {
  try {
    res.json(await apCreditMemoService.submitAPCreditMemo(req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...getErrorPayload(error, 'Failed to submit A/P Credit Memo.'),
      validation: error.validation || null,
    });
  }
};

const updateAPCreditMemo = async (req, res) => {
  try {
    res.json(await apCreditMemoService.updateAPCreditMemo(req.params.docEntry, req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...getErrorPayload(error, 'Failed to update A/P Credit Memo.'),
      validation: error.validation || null,
    });
  }
};

const getDocumentSeries = async (_req, res) => {
  try {
    res.json(await apCreditMemoService.getDocumentSeries());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getNextNumber(req.params.series));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromWarehouse = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getStateFromWarehouse(req.params.whsCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from warehouse.'));
  }
};

const getOpenGRPO = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getOpenGRPO(req.query.vendorCode || req.query.vendor || null));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load open GRPOs.'));
  }
};

const getGRPOForCopy = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getGRPOForCopy(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load GRPO.'));
  }
};

const getItemsForModal = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getItemsForModal());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    res.json(await apCreditMemoService.getFreightCharges(req.query.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

module.exports = {
  getReferenceData,
  getVendorDetails,
  getAPCreditMemos,
  getAPCreditMemoByDocEntry,
  submitAPCreditMemo,
  updateAPCreditMemo,
  getDocumentSeries,
  getNextNumber,
  getStateFromWarehouse,
  getOpenGRPO,
  getGRPOForCopy,
  getItemsForModal,
  getFreightCharges,
};
