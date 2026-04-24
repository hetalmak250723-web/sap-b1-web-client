import apiClient from './client';

export const fetchAPCreditMemoReferenceData = (companyId) =>
  apiClient.get('/ap-credit-memo/reference-data', {
    params: { company_id: companyId }
  });

export const fetchAPCreditMemoVendorDetails = (cardCode) =>
  apiClient.get(`/ap-credit-memo/vendors/${cardCode}`);

export const fetchItemsForModal = () =>
  apiClient.get('/ap-credit-memo/items-modal');

export const submitAPCreditMemo = (payload) =>
  apiClient.post('/ap-credit-memo', payload);

export const updateAPCreditMemo = (docEntry, payload) =>
  apiClient.patch(`/ap-credit-memo/${docEntry}`, payload);

export const fetchAPCreditMemoByDocEntry = (docEntry) =>
  apiClient.get(`/ap-credit-memo/${docEntry}`);

export const fetchAPCreditMemoSeries = () =>
  apiClient.get('/ap-credit-memo/series');

export const fetchAPCreditMemoNextNumber = (series) =>
  apiClient.get(`/ap-credit-memo/series/${series}/next-number`);

export const fetchAPCreditMemoStateFromWarehouse = (whsCode) =>
  apiClient.get(`/ap-credit-memo/warehouse-state/${encodeURIComponent(whsCode)}`);

export const fetchAPCreditMemoOpenGRPO = (vendor) =>
  apiClient.get('/ap-credit-memo/open-grpo', {
    params: vendor ? { vendorCode: vendor } : {}
  });

export const fetchAPCreditMemoGRPOForCopy = (docEntry) =>
  apiClient.get(`/ap-credit-memo/grpo/${docEntry}`);

export const fetchAPCreditMemos = () =>
  apiClient.get('/ap-credit-memo/list');

export const fetchFreightCharges = (docEntry) =>
  apiClient.get('/ap-credit-memo/freight-charges', { params: { docEntry } });
