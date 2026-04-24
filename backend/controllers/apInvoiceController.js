const apInvoiceService = require('../services/apInvoiceService');

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
    res.json(await apInvoiceService.getReferenceData(req.query.company_id));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Invoice reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    res.json(await apInvoiceService.getVendorDetails(req.params.vendorCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getAPInvoices = async (_req, res) => {
  try {
    res.json(await apInvoiceService.getAPInvoiceList());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Invoices.'));
  }
};

const getAPInvoiceByDocEntry = async (req, res) => {
  try {
    res.json(await apInvoiceService.getAPInvoice(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load A/P Invoice details.'));
  }
};

const submitAPInvoice = async (req, res) => {
  try {
    res.json(await apInvoiceService.submitAPInvoice(req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...getErrorPayload(error, 'Failed to submit A/P Invoice.'),
      validation: error.validation || null,
    });
  }
};

const updateAPInvoice = async (req, res) => {
  try {
    res.json(await apInvoiceService.updateAPInvoice(req.params.docEntry, req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ...getErrorPayload(error, 'Failed to update A/P Invoice.'),
      validation: error.validation || null,
    });
  }
};

const getDocumentSeries = async (_req, res) => {
  try {
    res.json(await apInvoiceService.getDocumentSeries());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    res.json(await apInvoiceService.getNextNumber(req.params.series));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromWarehouse = async (req, res) => {
  try {
    res.json(await apInvoiceService.getStateFromWarehouse(req.params.whsCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from warehouse.'));
  }
};

const getOpenGRPO = async (req, res) => {
  try {
    res.json(await apInvoiceService.getOpenGRPO(req.query.vendorCode || req.query.vendor || null));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load open GRPOs.'));
  }
};

const getGRPOForCopy = async (req, res) => {
  try {
    res.json(await apInvoiceService.getGRPOForCopy(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load GRPO.'));
  }
};

const getItemsForModal = async (req, res) => {
  try {
    res.json(await apInvoiceService.getItemsForModal());
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    res.json(await apInvoiceService.getFreightCharges(req.query.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

module.exports = {
  getReferenceData,
  getVendorDetails,
  getAPInvoices,
  getAPInvoiceByDocEntry,
  submitAPInvoice,
  updateAPInvoice,
  getDocumentSeries,
  getNextNumber,
  getStateFromWarehouse,
  getOpenGRPO,
  getGRPOForCopy,
  getItemsForModal,
  getFreightCharges,
};
