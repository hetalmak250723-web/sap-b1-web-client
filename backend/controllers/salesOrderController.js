const salesOrderService = require('../services/salesOrderService');

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
    const data = await salesOrderService.getReferenceData(req.query.company_id);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales order reference data.'));
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const data = await salesOrderService.getCustomerDetails(req.params.customerCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load customer details.'));
  }
};

const getSalesOrderList = async (req, res) => {
  try {
    const data = await salesOrderService.getSalesOrderList();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales orders.'));
  }
};

const getSalesOrder = async (req, res) => {
  try {
    const data = await salesOrderService.getSalesOrder(req.params.docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load sales order details.'));
  }
};

const submitSalesOrder = async (req, res) => {
  try {
    const result = await salesOrderService.submitSalesOrder(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to submit sales order.'));
  }
};

const updateSalesOrder = async (req, res) => {
  try {
    const result = await salesOrderService.updateSalesOrder(req.params.docEntry, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to update sales order.'));
  }
};

const getDocumentSeries = async (req, res) => {
  try {
    const data = await salesOrderService.getDocumentSeries();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load document series.'));
  }
};

const getNextNumber = async (req, res) => {
  try {
    const data = await salesOrderService.getNextNumber(req.query.series);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get next number.'));
  }
};

const getStateFromAddress = async (req, res) => {
  try {
    const { cardCode, addressCode } = req.query;
    const data = await salesOrderService.getStateFromAddress(cardCode, addressCode);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to get state from address.'));
  }
};

const getItemsForModal = async (req, res) => {
  try {
    const data = await salesOrderService.getItemsForModal();
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load items.'));
  }
};

const getFreightCharges = async (req, res) => {
  try {
    const { docEntry } = req.query;
    const data = await salesOrderService.getFreightCharges(docEntry);
    res.json(data);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to load freight charges.'));
  }
};

const createLookupValue = async (req, res) => {
  try {
    const result = await salesOrderService.createLookupValue(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(500).json(getErrorPayload(error, 'Failed to create lookup value.'));
  }
};

module.exports = {
  getReferenceData,
  getCustomerDetails,
  getSalesOrderList,
  getSalesOrder,
  submitSalesOrder,
  updateSalesOrder,
  getDocumentSeries,
  getNextNumber,
  getStateFromAddress,
  getItemsForModal,
  getFreightCharges,
  createLookupValue,
  getOpenSalesOrders:          async (req, res) => { try { res.json(await salesOrderService.getOpenSalesOrders()); } catch(e) { res.status(500).json(getErrorPayload(e, 'Failed.')); } },
  getSalesOrderForCopy:        async (req, res) => { try { res.json(await salesOrderService.getSalesOrderForCopy(req.params.docEntry)); } catch(e) { res.status(500).json(getErrorPayload(e, 'Failed.')); } },
  getOpenSalesQuotations:      async (req, res) => { try { res.json(await salesOrderService.getOpenSalesQuotations()); } catch(e) { res.status(500).json(getErrorPayload(e, 'Failed.')); } },
  getSalesQuotationForCopy:    async (req, res) => { try { res.json(await salesOrderService.getSalesQuotationForCopy(req.params.docEntry)); } catch(e) { res.status(500).json(getErrorPayload(e, 'Failed.')); } },
  getOpenBlanketAgreements:    async (req, res) => { try { res.json({ documents: [] }); } catch(e) { res.status(500).json(getErrorPayload(e, 'Failed.')); } },
  getBlanketAgreementForCopy:  async (req, res) => { res.status(404).json({ detail: 'Blanket agreements not yet implemented.' }); },
};
