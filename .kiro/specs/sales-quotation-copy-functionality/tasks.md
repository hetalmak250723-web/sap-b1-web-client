# Tasks: Sales Quotation Copy From/Copy To Functionality

## Phase 1: Backend Infrastructure

### 1.1 Database Schema Setup

- [ ] Create OQUT table for quotation headers
- [ ] Create QUT1 table for quotation lines
- [ ] Create indexes on OQUT.CardCode, OQUT.DocStatus
- [ ] Create indexes on QUT1.DocEntry, QUT1.ItemCode
- [ ] Define foreign keys for referential integrity
- [ ] Define constraints for data validation
- [ ] Verify schema compatibility with SAP B1

### 1.2 Backend Service Layer

- [ ] Create salesQuotationDbService.js with ODBC queries
- [ ] Implement getReferenceData() function
- [ ] Implement getCustomerDetails() function
- [ ] Implement getSalesQuotationList() function
- [ ] Implement getSalesQuotation() function
- [ ] Implement getDocumentSeries() function
- [ ] Implement getNextNumber() function
- [ ] Implement getStateFromAddress() function
- [ ] Implement getWarehouseState() function
- [ ] Implement getFreightCharges() function
- [ ] Implement getItemsForModal() function
- [ ] Implement getBatchesByItem() function
- [ ] Implement getUomConversionFactor() function

### 1.3 Backend Business Logic

- [ ] Create salesQuotationService.js with business logic
- [ ] Implement getReferenceData() service function
- [ ] Implement getCustomerDetails() service function
- [ ] Implement getSalesQuotationList() service function
- [ ] Implement getSalesQuotation() service function
- [ ] Implement submitSalesQuotation() service function
- [ ] Implement updateSalesQuotation() service function
- [ ] Implement deleteSalesQuotation() service function
- [ ] Implement getDocumentSeries() service function
- [ ] Implement getNextNumber() service function
- [ ] Implement getStateFromAddress() service function
- [ ] Implement getWarehouseState() service function
- [ ] Implement getFreightCharges() service function
- [ ] Implement getItemsForModal() service function
- [ ] Implement getBatchesByItem() service function
- [ ] Implement getUomConversionFactor() service function

### 1.4 Backend Controllers

- [ ] Create salesQuotationController.js
- [ ] Implement getReferenceData() controller endpoint
- [ ] Implement getCustomerDetails() controller endpoint
- [ ] Implement getSalesQuotationList() controller endpoint
- [ ] Implement getSalesQuotation() controller endpoint
- [ ] Implement submitSalesQuotation() controller endpoint
- [ ] Implement updateSalesQuotation() controller endpoint
- [ ] Implement deleteSalesQuotation() controller endpoint
- [ ] Implement getDocumentSeries() controller endpoint
- [ ] Implement getNextNumber() controller endpoint
- [ ] Implement getStateFromAddress() controller endpoint
- [ ] Implement getWarehouseState() controller endpoint
- [ ] Implement getFreightCharges() controller endpoint
- [ ] Implement getItemsForModal() controller endpoint
- [ ] Implement getBatchesByItem() controller endpoint
- [ ] Implement getUomConversionFactor() controller endpoint

### 1.5 Backend Routes

- [ ] Create routes for Sales Quotation endpoints
- [ ] Register GET /api/sales/quotation/reference-data route
- [ ] Register GET /api/sales/quotation/list route
- [ ] Register GET /api/sales/quotation/:docEntry route
- [ ] Register POST /api/sales/quotation route
- [ ] Register PATCH /api/sales/quotation/:docEntry route
- [ ] Register DELETE /api/sales/quotation/:docEntry route
- [ ] Register GET /api/sales/quotation/customer/:cardCode route
- [ ] Register GET /api/sales/quotation/series route
- [ ] Register GET /api/sales/quotation/next-number route
- [ ] Register GET /api/sales/quotation/state-from-address route
- [ ] Register GET /api/sales/quotation/warehouse-state route
- [ ] Register GET /api/sales/quotation/freight-charges route
- [ ] Register GET /api/sales/quotation/items-for-modal route
- [ ] Register GET /api/sales/quotation/batches-by-item route
- [ ] Register GET /api/sales/quotation/uom-conversion-factor route

## Phase 2: Copy From Functionality

### 2.1 Copy From Backend APIs

- [ ] Create salesQuotationCopyFromService.js
- [ ] Implement fetchOpenDocuments() function
- [ ] Implement fetchDocumentLines() function
- [ ] Implement validateBaseReference() function
- [ ] Implement transformSourceLines() function
- [ ] Create salesQuotationCopyFromController.js
- [ ] Implement GET /api/sales/quotation/copy-from endpoint
- [ ] Implement GET /api/sales/quotation/document-lines endpoint
- [ ] Add error handling for missing documents
- [ ] Add error handling for no open lines
- [ ] Add error handling for customer mismatch

### 2.2 Copy From Frontend Components

- [ ] Create CopyFromModal.jsx component
- [ ] Implement document type selection
- [ ] Implement document list display
- [ ] Implement document selection
- [ ] Implement line items display
- [ ] Implement line selection
- [ ] Implement copy action
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

### 2.3 Copy From Integration

- [ ] Integrate CopyFromModal with SalesQuotation page
- [ ] Implement Copy From button
- [ ] Implement modal open/close logic
- [ ] Implement line population logic
- [ ] Implement base reference assignment
- [ ] Implement batch detection
- [ ] Implement totals recalculation
- [ ] Test Copy From workflow end-to-end

## Phase 3: Copy To Functionality

### 3.1 Copy To Backend APIs

- [ ] Create salesQuotationCopyToService.js
- [ ] Implement fetchTargetDocuments() function
- [ ] Implement createReverseTransaction() function
- [ ] Implement validateCopyToEligibility() function
- [ ] Create salesQuotationCopyToController.js
- [ ] Implement POST /api/sales/quotation/copy-to endpoint
- [ ] Add error handling for unsaved quotation
- [ ] Add error handling for invalid target type
- [ ] Add error handling for copy to failure

### 3.2 Copy To Frontend Components

- [ ] Create CopyToModal.jsx component
- [ ] Implement target document type selection
- [ ] Implement target document list display
- [ ] Implement copy action
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

### 3.3 Copy To Integration

- [ ] Integrate CopyToModal with SalesQuotation page
- [ ] Implement Copy To button
- [ ] Implement modal open/close logic
- [ ] Implement reverse transaction creation
- [ ] Implement base reference tracking
- [ ] Test Copy To workflow end-to-end

## Phase 4: Frontend Components

### 4.1 Main Page Component

- [ ] Create SalesQuotation.jsx main component
- [ ] Implement Create mode
- [ ] Implement Edit mode
- [ ] Implement View mode
- [ ] Implement form state management
- [ ] Implement form validation
- [ ] Implement save functionality
- [ ] Implement cancel functionality
- [ ] Implement error handling
- [ ] Implement loading states

### 4.2 Header Fields Component

- [ ] Create HeaderFields.jsx component
- [ ] Implement Customer field
- [ ] Implement Contact Person field
- [ ] Implement Branch field
- [ ] Implement Warehouse field
- [ ] Implement Payment Terms field
- [ ] Implement Posting Date field
- [ ] Implement Delivery Date field
- [ ] Implement Document Date field
- [ ] Implement Journal Remark field
- [ ] Implement Other Instruction field
- [ ] Implement Discount field
- [ ] Implement Freight field
- [ ] Implement Sales Employee field
- [ ] Add field validation
- [ ] Add field dependencies

### 4.3 Contents Tab Component

- [ ] Create ContentsTab.jsx component
- [ ] Implement item matrix display
- [ ] Implement Add Line button
- [ ] Implement Delete Line button
- [ ] Implement Edit Line functionality
- [ ] Implement line validation
- [ ] Implement totals calculation
- [ ] Implement tax calculation
- [ ] Implement batch detection
- [ ] Add loading states
- [ ] Add error handling

### 4.4 Logistics Tab Component

- [ ] Create LogisticsTab.jsx component
- [ ] Implement Shipping Type field
- [ ] Implement Delivery Date field
- [ ] Implement Shipping Address field
- [ ] Implement Billing Address field
- [ ] Implement Ship To Address field
- [ ] Implement Pay To Address field
- [ ] Implement Freight Charges section
- [ ] Add field validation
- [ ] Add field dependencies

### 4.5 Accounting Tab Component

- [ ] Create AccountingTab.jsx component
- [ ] Implement Payment Terms field
- [ ] Implement Payment Method field
- [ ] Implement Owner field
- [ ] Implement Purchaser field
- [ ] Implement Branch field
- [ ] Implement Warehouse field
- [ ] Add field validation
- [ ] Add field dependencies

### 4.6 Tax Tab Component

- [ ] Create TaxTab.jsx component
- [ ] Implement Tax Code field
- [ ] Implement GST Type display
- [ ] Implement IGST calculation
- [ ] Implement CGST calculation
- [ ] Implement SGST calculation
- [ ] Implement Total Tax display
- [ ] Add tax recalculation on line change
- [ ] Add tax recalculation on tax code change

### 4.7 Electronic Documents Tab Component

- [ ] Create ElectronicDocumentsTab.jsx component
- [ ] Implement E-invoice Status display
- [ ] Implement E-invoice Number display
- [ ] Implement E-way Bill Status display
- [ ] Implement E-way Bill Number display
- [ ] Implement E-document generation trigger
- [ ] Add loading states
- [ ] Add error handling

### 4.8 Attachments Tab Component

- [ ] Create AttachmentsTab.jsx component
- [ ] Implement Attachments list display
- [ ] Implement Add Attachment button
- [ ] Implement Delete Attachment button
- [ ] Implement file upload functionality
- [ ] Implement file download functionality
- [ ] Add file type validation
- [ ] Add file size validation
- [ ] Add loading states
- [ ] Add error handling

### 4.9 Item Selection Modal Component

- [ ] Create ItemSelectionModal.jsx component
- [ ] Implement item list display
- [ ] Implement item search functionality
- [ ] Implement item selection
- [ ] Implement item details display
- [ ] Add pagination
- [ ] Add loading states
- [ ] Add error handling

### 4.10 Batch Allocation Modal Component

- [ ] Create BatchAllocationModal.jsx component
- [ ] Implement batch list display
- [ ] Implement batch selection
- [ ] Implement quantity allocation
- [ ] Implement quantity validation
- [ ] Implement batch details display
- [ ] Add loading states
- [ ] Add error handling

## Phase 5: API Integration

### 5.1 API Client Setup

- [ ] Create salesQuotationApi.js
- [ ] Implement getReferenceData() API call
- [ ] Implement getCustomerDetails() API call
- [ ] Implement getSalesQuotationList() API call
- [ ] Implement getSalesQuotation() API call
- [ ] Implement submitSalesQuotation() API call
- [ ] Implement updateSalesQuotation() API call
- [ ] Implement deleteSalesQuotation() API call
- [ ] Implement getDocumentSeries() API call
- [ ] Implement getNextNumber() API call
- [ ] Implement getStateFromAddress() API call
- [ ] Implement getWarehouseState() API call
- [ ] Implement getFreightCharges() API call
- [ ] Implement getItemsForModal() API call
- [ ] Implement getBatchesByItem() API call
- [ ] Implement getUomConversionFactor() API call
- [ ] Implement fetchOpenDocuments() API call
- [ ] Implement fetchDocumentLines() API call
- [ ] Implement copyToDocument() API call

### 5.2 API Error Handling

- [ ] Implement error interceptor
- [ ] Implement retry logic for failed requests
- [ ] Implement timeout handling
- [ ] Implement network error handling
- [ ] Implement validation error handling

## Phase 6: Testing

### 6.1 Unit Tests

- [ ] Test fetchOpenDocuments() function
- [ ] Test fetchDocumentLines() function
- [ ] Test validateBaseReference() function
- [ ] Test transformSourceLines() function
- [ ] Test line total calculation
- [ ] Test tax calculation
- [ ] Test batch detection
- [ ] Test form validation
- [ ] Test API error handling

### 6.2 Integration Tests

- [ ] Test Copy From workflow end-to-end
- [ ] Test Copy To workflow end-to-end
- [ ] Test quotation creation
- [ ] Test quotation update
- [ ] Test quotation deletion
- [ ] Test quotation retrieval
- [ ] Test batch allocation
- [ ] Test multi-line copy

### 6.3 Property-Based Tests

- [ ] Test Base Reference Integrity property
- [ ] Test Open Quantity Preservation property
- [ ] Test Customer Consistency property
- [ ] Test Document Status Validation property
- [ ] Test Batch Allocation Consistency property

### 6.4 UI Tests

- [ ] Test SalesQuotation page rendering
- [ ] Test form field interactions
- [ ] Test modal open/close
- [ ] Test Copy From workflow
- [ ] Test Copy To workflow
- [ ] Test error message display
- [ ] Test success message display
- [ ] Test loading states

## Phase 7: Documentation

### 7.1 Code Documentation

- [ ] Document all backend functions
- [ ] Document all frontend components
- [ ] Document all API endpoints
- [ ] Document all data models
- [ ] Document all error codes

### 7.2 User Documentation

- [ ] Create user guide for Sales Quotation
- [ ] Create user guide for Copy From
- [ ] Create user guide for Copy To
- [ ] Create FAQ document
- [ ] Create troubleshooting guide

### 7.3 Developer Documentation

- [ ] Create architecture documentation
- [ ] Create API documentation
- [ ] Create database schema documentation
- [ ] Create deployment guide
- [ ] Create configuration guide

## Phase 8: Deployment

### 8.1 Pre-Deployment

- [ ] Code review
- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] User acceptance testing

### 8.2 Deployment

- [ ] Deploy backend services
- [ ] Deploy frontend components
- [ ] Deploy database schema
- [ ] Deploy API endpoints
- [ ] Verify deployment

### 8.3 Post-Deployment

- [ ] Monitor system performance
- [ ] Monitor error logs
- [ ] Gather user feedback
- [ ] Fix critical issues
- [ ] Plan for future enhancements

## Estimated Timeline

- Phase 1: 2 weeks
- Phase 2: 1.5 weeks
- Phase 3: 1.5 weeks
- Phase 4: 3 weeks
- Phase 5: 1 week
- Phase 6: 2 weeks
- Phase 7: 1 week
- Phase 8: 1 week

**Total: 13.5 weeks**

## Resource Requirements

- Backend Developer: 1 FTE
- Frontend Developer: 1 FTE
- QA Engineer: 0.5 FTE
- Technical Lead: 0.25 FTE
- Product Manager: 0.25 FTE

## Risk Assessment

### High Risk

1. SAP B1 API compatibility issues
2. Database performance with large datasets
3. Complex tax calculations

### Medium Risk

1. Batch management complexity
2. Multi-tab form state management
3. Error handling edge cases

### Low Risk

1. UI component development
2. API integration
3. Documentation

## Success Criteria

1. All tasks completed on time
2. All tests passing
3. Zero critical bugs
4. User acceptance testing passed
5. Performance benchmarks met
6. Security audit passed
7. Code coverage > 80%
