import ServiceAPInvoicePage from '../modules/services-ap-invoice/ServiceAPInvoicePage';
import {
  fetchOpenServiceAPInvoicesForCreditMemo,
  fetchServiceAPCreditMemoByDocEntry,
  fetchServiceAPCreditMemoNextNumber,
  fetchServiceAPCreditMemoReferenceData,
  fetchServiceAPCreditMemoSeries,
  fetchServiceAPCreditMemoVendorDetails,
  fetchServiceAPInvoiceForCreditMemoCopy,
  submitServiceAPCreditMemo,
  updateServiceAPCreditMemo,
} from '../api/serviceApCreditMemoApi';

const SERVICE_AP_CREDIT_MEMO_CONFIG = {
  label: 'Service A/P Credit Memo',
  pluralLabel: 'Service A/P Credit Memos',
  objectType: 19,
  documentType: 'serviceApCreditMemo',
  routePath: '/services/ap-credit-memo',
  findPath: '/services/ap-credit-memo/find',
  stateKey: 'serviceAPCreditMemoDocEntry',
  responseKey: 'service_ap_credit_memo',
  vendorDatalistId: 'service-ap-credit-memo-vendors',
  accountDatalistId: 'service-ap-credit-memo-accounts',
  copyFromOptions: [
    { key: 'apInvoice', label: 'A/P Invoices' },
  ],
  copyTo: {
    enabled: false,
    sourceDocType: 'serviceApCreditMemo',
    targetType: '',
  },
  api: {
    fetchReferenceData: fetchServiceAPCreditMemoReferenceData,
    fetchSeries: fetchServiceAPCreditMemoSeries,
    fetchNextNumber: fetchServiceAPCreditMemoNextNumber,
    fetchByDocEntry: fetchServiceAPCreditMemoByDocEntry,
    fetchVendorDetails: fetchServiceAPCreditMemoVendorDetails,
    submit: submitServiceAPCreditMemo,
    update: updateServiceAPCreditMemo,
    generateJournalEntry: null,
    copyFromFetchers: {
      apInvoice: fetchOpenServiceAPInvoicesForCreditMemo,
    },
    copyFromDetailFetchers: {
      apInvoice: fetchServiceAPInvoiceForCreditMemoCopy,
    },
  },
};

function ServiceAPCreditMemoPage() {
  return <ServiceAPInvoicePage documentConfig={SERVICE_AP_CREDIT_MEMO_CONFIG} />;
}

export default ServiceAPCreditMemoPage;
