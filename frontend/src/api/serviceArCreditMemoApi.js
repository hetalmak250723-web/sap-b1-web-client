import client from './client';

const API_BASE = '/services/ar-credit-memo';

export const fetchServiceARCreditMemoReferenceData = (companyId) =>
  client.get(`${API_BASE}/reference-data`, { params: companyId ? { company_id: companyId } : {} });

export const fetchServiceARCreditMemoCustomerDetails = (customerCode) =>
  client.get(`${API_BASE}/customers/${encodeURIComponent(customerCode)}`);

export const fetchServiceARCreditMemoCustomerOptions = (params = {}) =>
  client.get(`${API_BASE}/customers/search`, { params });

export const fetchServiceARCreditMemoSeries = (date = '', transactionType = '') =>
  client.get(`${API_BASE}/series`, {
    params: {
      ...(date ? { date } : {}),
      ...(transactionType ? { transactionType } : {}),
    },
  });

export const fetchServiceARCreditMemoNextNumber = (series) =>
  client.get(`${API_BASE}/series/next`, { params: { series } });

export const fetchServiceARCreditMemoList = (params = {}) =>
  client.get(`${API_BASE}/list`, { params });

export const fetchServiceARCreditMemoByDocEntry = (docEntry) =>
  client.get(`${API_BASE}/${encodeURIComponent(docEntry)}`);

export const submitServiceARCreditMemo = (data) =>
  client.post(API_BASE, data);

export const updateServiceARCreditMemo = (docEntry, data) =>
  client.patch(`${API_BASE}/${encodeURIComponent(docEntry)}`, data);

export const fetchOpenServiceARInvoicesForCreditMemo = (customerCode = null) =>
  client.get(`${API_BASE}/open-invoices`, {
    params: customerCode ? { customerCode } : {},
  });

export const fetchServiceARInvoiceForCreditMemoCopy = (docEntry) =>
  client.get(`${API_BASE}/invoice/${encodeURIComponent(docEntry)}/copy`);
