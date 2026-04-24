import apiClient from './client';

const fetchPurchaseQuotationReferenceData = (companyId) =>
  apiClient.get('/purchase-quotation/reference-data', {
    params: { company_id: companyId },
  });

const fetchPurchaseQuotationVendorDetails = async (vendorCode) => {
  const res = await apiClient.get(
    `/purchase-quotation/vendors/${encodeURIComponent(vendorCode)}`
  );

  return res;
};

const fetchPurchaseQuotations = () =>
  apiClient.get('/purchase-quotation/list');

const fetchPurchaseQuotationByDocEntry = (docEntry) =>
  apiClient.get(`/purchase-quotation/${encodeURIComponent(docEntry)}`);

const submitPurchaseQuotation = (payload) =>
  apiClient.post('/purchase-quotation', payload);

const updatePurchaseQuotation = (docEntry, payload) =>
  apiClient.patch(`/purchase-quotation/${docEntry}`, payload);

const fetchDocumentSeries = () =>
  apiClient.get('/purchase-quotation/series');

const fetchNextNumber = (series) =>
  apiClient.get(`/purchase-quotation/series/${series}/next-number`);

const fetchStateFromAddress = (vendorCode, addressCode) =>
  apiClient.get(`/purchase-quotation/state/${encodeURIComponent(vendorCode)}/${encodeURIComponent(addressCode)}`);

const fetchStateFromWarehouse = (whsCode) =>
  apiClient.get(`/purchase-quotation/warehouse-state/${encodeURIComponent(whsCode)}`);

const fetchFreightCharges = (docEntry) =>
  apiClient.get('/purchase-quotation/freight-charges', { params: { docEntry } });

export {
  fetchPurchaseQuotationReferenceData,
  fetchPurchaseQuotationByDocEntry,
  fetchPurchaseQuotations,
  fetchPurchaseQuotationVendorDetails,
  submitPurchaseQuotation,
  updatePurchaseQuotation,
  fetchDocumentSeries,
  fetchNextNumber,
  fetchStateFromAddress,
  fetchStateFromWarehouse,
  fetchFreightCharges,
};
