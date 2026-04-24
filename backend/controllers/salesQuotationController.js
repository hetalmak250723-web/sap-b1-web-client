const salesQuotationService = require('../services/salesQuotationService');

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
    const data = await salesQuotationService.getReferenceData(req.query.company_id);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales quotation reference data.'));
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const data = await salesQuotationService.getCustomerDetails(req.params.customerCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load customer details.'));
  }
};

const getSalesQuotationList = async (req, res) => {
  try {
    const data = await salesQuotationService.getSalesQuotationList();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales quotations.'));
  }
};

const getSalesQuotation = async (req, res) => {
  try {
    const data = await salesQuotationService.getSalesQuotation(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales quotation details.'));
  }
};

const submitSalesQuotation = async (req, res) => {
  try {
    const result = await salesQuotationService.submitSalesQuotation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to submit sales quotation.'));
  }
};

const updateSalesQuotation = async (req, res) => {
  try {
    const result = await salesQuotationService.updateSalesQuotation(req.params.docEntry, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to update sales quotation.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const data = await salesQuotationService.getDocumentSeries();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    const data = await salesQuotationService.getNextNumber(req.query.series);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromAddress = async (req, res) => {
  try {
    const { cardCode, addressCode } = req.query;
    const data = await salesQuotationService.getStateFromAddress(cardCode, addressCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from address.'));
  }
};

const getItemsForModal = async (req, res) => {
  try {
    const data = await salesQuotationService.getItemsForModal();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    const { docEntry } = req.query;
    const data = await salesQuotationService.getFreightCharges(docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

const getOpenSalesQuotations = async (req, res) => {
  try {
    const data = await salesQuotationService.getOpenSalesQuotations();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load open sales quotations.'));
  }
};

const getSalesQuotationForCopy = async (req, res) => {
  try {
    const data = await salesQuotationService.getSalesQuotationForCopy(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales quotation for copy.'));
  }
};

module.exports = {
  getReferenceData,
  getCustomerDetails,
  getSalesQuotationList,
  getSalesQuotation,
  submitSalesQuotation,
  updateSalesQuotation,
  getDocumentSeries,
  getNextNumber,
  getStateFromAddress,
  getItemsForModal,
  getFreightCharges,
  getOpenSalesQuotations,
  getSalesQuotationForCopy,
};
