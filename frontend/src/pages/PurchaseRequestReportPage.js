import React from 'react';
import ReportLandingPage from '../components/reports/ReportLandingPage';

function PurchaseRequestReportPage() {
  return (
    <ReportLandingPage
      badge="Reports / Purchasing"
      title="Purchase Request Report"
      description="Use this report workspace to review purchase request activity before it moves into quotation or ordering stages."
      highlights={[
        {
          title: 'Request Visibility',
          description: 'Keep purchase request review separate from document creation so planners can focus on requisition activity.',
        },
        {
          title: 'Early Demand Review',
          description: 'Validate requested items, dates, and internal demand before procurement commits to vendors.',
        },
        {
          title: 'Faster Follow-up',
          description: 'Jump into the purchase request list directly from the report menu whenever you need a document-level check.',
        },
        {
          title: 'Better Navigation',
          description: 'This screen gives purchasing users a dedicated landing page under Reports for request-based review.',
        },
      ]}
      actions={[
        {
          to: '/purchase-request/find',
          label: 'Open Purchase Request List',
          description: 'Review all purchase requests and continue document follow-up.',
        },
        {
          to: '/purchase-request',
          label: 'Create Purchase Request',
          description: 'Go straight to the purchase request entry screen when a new requisition is needed.',
        },
      ]}
    />
  );
}

export default PurchaseRequestReportPage;
