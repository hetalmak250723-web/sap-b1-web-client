import ServiceARInvoicePage from '../modules/services-ar-invoice/ServiceARInvoicePage';
import {
  fetchOpenServiceARInvoicesForCreditMemo,
  fetchServiceARCreditMemoByDocEntry,
  fetchServiceARCreditMemoCustomerDetails,
  fetchServiceARCreditMemoNextNumber,
  fetchServiceARCreditMemoReferenceData,
  fetchServiceARCreditMemoSeries,
  fetchServiceARInvoiceForCreditMemoCopy,
  submitServiceARCreditMemo,
  updateServiceARCreditMemo,
} from '../api/serviceArCreditMemoApi';

const SERVICE_AR_CREDIT_MEMO_CONFIG = {
  label: 'Service A/R Credit Memo',
  pluralLabel: 'Service A/R Credit Memos',
  objectType: 14,
  documentType: 'serviceArCreditMemo',
  routePath: '/services/ar-credit-memo',
  findPath: '/services/ar-credit-memo/find',
  stateKey: 'serviceARCreditMemoDocEntry',
  responseKey: 'service_ar_credit_memo',
  customerDatalistId: 'service-ar-credit-memo-customers',
  accountDatalistId: 'service-ar-credit-memo-accounts',
  copyFromOptions: [
    { key: 'invoice', label: 'A/R Invoices' },
  ],
  copyTo: {
    enabled: false,
    sourceDocType: 'serviceArCreditMemo',
    targetType: '',
  },
  api: {
    fetchReferenceData: fetchServiceARCreditMemoReferenceData,
    fetchSeries: fetchServiceARCreditMemoSeries,
    fetchNextNumber: fetchServiceARCreditMemoNextNumber,
    fetchByDocEntry: fetchServiceARCreditMemoByDocEntry,
    fetchCustomerDetails: fetchServiceARCreditMemoCustomerDetails,
    submit: submitServiceARCreditMemo,
    update: updateServiceARCreditMemo,
    generateJournalEntry: null,
    copyFromFetchers: {
      invoice: fetchOpenServiceARInvoicesForCreditMemo,
    },
    copyFromDetailFetchers: {
      invoice: fetchServiceARInvoiceForCreditMemoCopy,
    },
  },
};

function ServiceARCreditMemoPage() {
  return <ServiceARInvoicePage documentConfig={SERVICE_AR_CREDIT_MEMO_CONFIG} />;
}

export default ServiceARCreditMemoPage;
