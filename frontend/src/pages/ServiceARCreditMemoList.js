import DocumentFindPage from '../components/DocumentFindPage';
import {
  fetchServiceARCreditMemoCustomerOptions,
  fetchServiceARCreditMemoList,
} from '../api/serviceArCreditMemoApi';

function ServiceARCreditMemoListPage() {
  return (
    <DocumentFindPage
      title="Service A/R Credit Memos"
      backPath="/services/ar-credit-memo"
      partnerLabel="Customer"
      partnerParamPrefix="customer"
      resultKey="service_ar_credit_memos"
      emptyLabel="service A/R credit memos"
      loadingLabel="Loading service A/R credit memos..."
      fetchDocuments={fetchServiceARCreditMemoList}
      fetchPartnerOptions={fetchServiceARCreditMemoCustomerOptions}
      editPath="/services/ar-credit-memo"
      editStateKey="serviceARCreditMemoDocEntry"
      codeField="customer_code"
      nameField="customer_name"
    />
  );
}

export default ServiceARCreditMemoListPage;
