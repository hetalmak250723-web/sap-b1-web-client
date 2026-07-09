const serviceArInvoiceService = require('../services/serviceArInvoiceService');

const getErrorPayload = (error, fallbackMessage) => ({
  message: error.message || fallbackMessage,
  detail: error.response?.data || null,
});

const getReferenceData = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getServiceARCreditMemoReferenceData(req.query.company_id));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/R Credit Memo reference data.'));
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getCustomerDetails(req.params.customerCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load customer details.'));
  }
};

const getCustomerFilterOptions = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getCustomerFilterOptions({
      query: req.query.query || '',
      customerCode: req.query.customerCode || '',
      customerName: req.query.customerName || '',
      top: req.query.top,
      display: req.query.display || 'code',
    }));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load customer options.'));
  }
};

const getServiceARCreditMemoList = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getServiceARCreditMemoList(req.query));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/R Credit Memos.'));
  }
};

const getServiceARCreditMemo = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getServiceARCreditMemo(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/R Credit Memo.'));
  }
};

const submitServiceARCreditMemo = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.submitServiceARCreditMemo(req.body));
  } catch (error) {
    res.status(error.response?.status || 500).json(getErrorPayload(error, 'Failed to submit Service A/R Credit Memo.'));
  }
};

const updateServiceARCreditMemo = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.updateServiceARCreditMemo(req.params.docEntry, req.body));
  } catch (error) {
    res.status(error.response?.status || 500).json(getErrorPayload(error, 'Failed to update Service A/R Credit Memo.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const result = await serviceArInvoiceService.getServiceARCreditMemoSeries(req.query.date || null);
    res.json({ series: Array.isArray(result) ? result : (result?.series || []) });
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getServiceARCreditMemoNextNumber(req.query.series));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load next number.'));
  }
};

const getOpenServiceARInvoices = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getOpenServiceARInvoices(req.query.customerCode || null));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load service A/R invoices.'));
  }
};

const getServiceARInvoiceForCreditMemoCopy = async (req, res) => {
  try {
    res.json(await serviceArInvoiceService.getServiceARInvoiceForCreditMemoCopy(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to copy service A/R invoice.'));
  }
};

module.exports = {
  getReferenceData,
  getCustomerDetails,
  getCustomerFilterOptions,
  getServiceARCreditMemoList,
  getServiceARCreditMemo,
  submitServiceARCreditMemo,
  updateServiceARCreditMemo,
  getDocumentSeries,
  getNextNumber,
  getOpenServiceARInvoices,
  getServiceARInvoiceForCreditMemoCopy,
};
