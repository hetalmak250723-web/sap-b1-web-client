const serviceApInvoiceService = require('../services/serviceApInvoiceService');

const getErrorPayload = (error, fallbackMessage) => ({
  message: error.message || fallbackMessage,
  detail: error.response?.data || null,
});

const getReferenceData = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getServiceAPCreditMemoReferenceData(req.query.company_id));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/P Credit Memo reference data.'));
  }
};

const getVendorDetails = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getVendorDetails(req.params.vendorCode));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor details.'));
  }
};

const getVendorFilterOptions = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getVendorFilterOptions({
      query: req.query.query || '',
      vendorCode: req.query.vendorCode || '',
      vendorName: req.query.vendorName || '',
      top: req.query.top,
      display: req.query.display || 'code',
    }));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load vendor options.'));
  }
};

const getServiceAPCreditMemoList = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getServiceAPCreditMemoList(req.query));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/P Credit Memos.'));
  }
};

const getServiceAPCreditMemo = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getServiceAPCreditMemo(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load Service A/P Credit Memo.'));
  }
};

const submitServiceAPCreditMemo = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.submitServiceAPCreditMemo(req.body));
  } catch (error) {
    res.status(error.response?.status || 500).json(getErrorPayload(error, 'Failed to submit Service A/P Credit Memo.'));
  }
};

const updateServiceAPCreditMemo = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.updateServiceAPCreditMemo(req.params.docEntry, req.body));
  } catch (error) {
    res.status(error.response?.status || 500).json(getErrorPayload(error, 'Failed to update Service A/P Credit Memo.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const result = await serviceApInvoiceService.getServiceAPCreditMemoSeries(req.query.date || null);
    res.json({ series: Array.isArray(result) ? result : (result?.series || []) });
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getServiceAPCreditMemoNextNumber(req.query.series));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load next number.'));
  }
};

const getOpenServiceAPInvoices = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getOpenServiceAPInvoices(req.query.vendorCode || null));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load service A/P invoices.'));
  }
};

const getServiceAPInvoiceForCreditMemoCopy = async (req, res) => {
  try {
    res.json(await serviceApInvoiceService.getServiceAPInvoiceForCreditMemoCopy(req.params.docEntry));
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to copy service A/P invoice.'));
  }
};

module.exports = {
  getReferenceData,
  getVendorDetails,
  getVendorFilterOptions,
  getServiceAPCreditMemoList,
  getServiceAPCreditMemo,
  submitServiceAPCreditMemo,
  updateServiceAPCreditMemo,
  getDocumentSeries,
  getNextNumber,
  getOpenServiceAPInvoices,
  getServiceAPInvoiceForCreditMemoCopy,
};
