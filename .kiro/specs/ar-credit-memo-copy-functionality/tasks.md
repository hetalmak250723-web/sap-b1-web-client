# Tasks: AR Credit Memo Copy From/Copy To Functionality

## Phase 1: Backend API Implementation

### 1.1 Implement Copy From API Endpoints
- [ ] Create GET /api/sales/copy-from endpoint
  - [ ] Query open documents by type and customer
  - [ ] Filter by DocStatus = 'O' and Cancelled = 'N'
  - [ ] Filter documents with open lines only
  - [ ] Return DocEntry, DocNum, DocDate, CardCode, CardName, Status
  - [ ] Sort by DocDate descending
  - [ ] Add error handling and logging
- [ ] Create GET /api/sales/document-lines endpoint
  - [ ] Query lines from source document
  - [ ] Calculate OpenQty = Quantity - QuantityReturned
  - [ ] Filter lines with OpenQty > 0
  - [ ] Return LineNum, ItemCode, ItemName, OpenQty, Price, TaxCode, Warehouse
  - [ ] Include base reference fields (BaseEntry, BaseType, BaseLine)
  - [ ] Sort by LineNum ascending
  - [ ] Add error handling and logging

### 1.2 Implement Copy To API Endpoint
- [ ] Create POST /api/sales/copy-to endpoint
  - [ ] Validate source document exists
  - [ ] Validate target document type
  - [ ] Transform credit memo data to target document format
  - [ ] Create document via SAP Service Layer
  - [ ] Maintain base references
  - [ ] Return new document entry and number
  - [ ] Add error handling and logging

### 1.3 Database Query Optimization
- [ ] Create indexes on OINV(CardCode, DocStatus, Cancelled)
- [ ] Create indexes on ODLN(CardCode, DocStatus, Cancelled)
- [ ] Create indexes on ORDR(CardCode, DocStatus, Cancelled)
- [ ] Optimize open quantity calculation queries
- [ ] Test query performance (target: < 500ms)

### 1.4 Add Base Reference Validation
- [ ] Create validateBaseReference() function
  - [ ] Validate baseEntry is positive integer
  - [ ] Validate baseType is 13, 15, or 17
  - [ ] Validate baseLine is non-negative
  - [ ] Verify source document exists
  - [ ] Verify source line exists
  - [ ] Verify source line has openQty > 0
- [ ] Add validation to line population logic
- [ ] Return validation errors to frontend

## Phase 2: Frontend Components

### 2.1 Create Copy From Modal Component
- [ ] Create CopyFromModal.jsx component
  - [ ] Document type selector (tabs or dropdown)
  - [ ] Document list table with columns: DocNum, DocDate, CardName, Status
  - [ ] Line list table with columns: ItemCode, ItemName, OpenQty, Price, TaxCode, Warehouse
  - [ ] Select All / Deselect All checkboxes
  - [ ] Copy button (enabled when lines selected)
  - [ ] Cancel button
  - [ ] Loading indicators
  - [ ] Error message display
- [ ] Implement document fetching logic
- [ ] Implement line fetching logic
- [ ] Implement line selection logic
- [ ] Add styling and responsive design

### 2.2 Create Copy To Modal Component
- [ ] Create CopyToModal.jsx component
  - [ ] Target document type selector
  - [ ] Confirmation message with credit memo details
  - [ ] Create button
  - [ ] Cancel button
  - [ ] Loading indicator
  - [ ] Success/error message display
- [ ] Implement copy to logic
- [ ] Add styling and responsive design

### 2.3 Integrate Copy From Button
- [ ] Add "Copy From" button to AR Credit Memo form
  - [ ] Button visible only when cardCode selected
  - [ ] Button visible only in Add Mode
  - [ ] Button disabled if no customer selected
  - [ ] Click handler opens Copy From Modal
- [ ] Add button styling and icon
- [ ] Add button to form header

### 2.4 Integrate Copy To Button
- [ ] Add "Copy To" button to AR Credit Memo form
  - [ ] Button visible only after document saved
  - [ ] Button disabled if no lines
  - [ ] Click handler opens Copy To Modal
- [ ] Add button styling and icon
- [ ] Add button to form header

### 2.5 Implement Line Population Logic
- [ ] Create populateItemMatrix() function
  - [ ] Map source line fields to credit memo line fields
  - [ ] Assign base references
  - [ ] Calculate totals
  - [ ] Apply tax codes
  - [ ] Load batch information
- [ ] Update form state with populated lines
- [ ] Recalculate totals and taxes
- [ ] Close modal after population

### 2.6 Implement Batch Management
- [ ] Detect batch-managed items
- [ ] Fetch available batches from warehouse
- [ ] Display batch allocation UI
- [ ] Validate batch quantity sum
- [ ] Load batch data into line object

## Phase 3: API Integration

### 3.1 Create API Functions
- [ ] Create fetchOpenDocuments() in arCreditMemoApi.js
  - [ ] GET /api/sales/copy-from?type=X&cardCode=Y
  - [ ] Handle response and errors
- [ ] Create fetchDocumentLines() in arCreditMemoApi.js
  - [ ] GET /api/sales/document-lines?docEntry=X&type=Y
  - [ ] Handle response and errors
- [ ] Create copyToDocument() in arCreditMemoApi.js
  - [ ] POST /api/sales/copy-to
  - [ ] Handle response and errors

### 3.2 Add Error Handling
- [ ] Handle network errors
- [ ] Handle API errors (4xx, 5xx)
- [ ] Display user-friendly error messages
- [ ] Log errors for debugging
- [ ] Implement retry logic for transient errors

### 3.3 Add Loading States
- [ ] Show loading indicator while fetching documents
- [ ] Show loading indicator while fetching lines
- [ ] Show loading indicator while creating reverse transaction
- [ ] Disable buttons during loading
- [ ] Show loading spinner in modals

## Phase 4: Testing

### 4.1 Unit Tests - Backend
- [ ] Test fetchOpenDocuments() with various inputs
  - [ ] Valid customer code
  - [ ] Invalid customer code
  - [ ] No open documents
  - [ ] Multiple open documents
- [ ] Test fetchDocumentLines() with various inputs
  - [ ] Valid document entry
  - [ ] Invalid document entry
  - [ ] No open lines
  - [ ] Multiple open lines
- [ ] Test validateBaseReference() with various inputs
  - [ ] Valid base reference
  - [ ] Invalid baseType
  - [ ] Non-existent source document
  - [ ] Non-existent source line

### 4.2 Unit Tests - Frontend
- [ ] Test CopyFromModal component
  - [ ] Modal opens/closes correctly
  - [ ] Document list displays correctly
  - [ ] Line list displays correctly
  - [ ] Selection logic works
  - [ ] Copy button enabled/disabled correctly
- [ ] Test CopyToModal component
  - [ ] Modal opens/closes correctly
  - [ ] Confirmation message displays
  - [ ] Create button works
- [ ] Test populateItemMatrix() function
  - [ ] Lines populated correctly
  - [ ] Base references assigned correctly
  - [ ] Totals calculated correctly
  - [ ] Tax codes applied correctly

### 4.3 Integration Tests
- [ ] End-to-end Copy From workflow
  - [ ] Select customer
  - [ ] Open Copy From modal
  - [ ] Select document
  - [ ] Select lines
  - [ ] Verify lines populated in item matrix
  - [ ] Verify base references assigned
- [ ] End-to-end Copy To workflow
  - [ ] Save credit memo
  - [ ] Open Copy To modal
  - [ ] Select target type
  - [ ] Verify reverse transaction created
  - [ ] Verify new document number displayed
- [ ] Multi-line copy
  - [ ] Copy document with multiple lines
  - [ ] Verify all lines populated
- [ ] Batch-managed items
  - [ ] Copy document with batch items
  - [ ] Verify batch allocation UI shown
  - [ ] Verify batch quantities validated

### 4.4 Error Scenario Tests
- [ ] Source document not found
- [ ] No open lines in document
- [ ] Customer mismatch
- [ ] Document cancelled
- [ ] Invalid base reference
- [ ] Batch quantity mismatch
- [ ] Network error during fetch
- [ ] API error during creation

### 4.5 Performance Tests
- [ ] Modal load time < 2 seconds
- [ ] Line fetch time < 1 second
- [ ] Item matrix population < 1 second
- [ ] Database query time < 500ms

## Phase 5: Documentation & Deployment

### 5.1 Code Documentation
- [ ] Add JSDoc comments to all functions
- [ ] Document API endpoints
- [ ] Document component props and state
- [ ] Add inline comments for complex logic
- [ ] Create README for feature

### 5.2 User Documentation
- [ ] Create user guide for Copy From feature
- [ ] Create user guide for Copy To feature
- [ ] Add screenshots and examples
- [ ] Document error messages and recovery steps

### 5.3 Deployment
- [ ] Code review and approval
- [ ] Merge to main branch
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor for errors

## Phase 6: Post-Deployment

### 6.1 Monitoring
- [ ] Monitor API performance
- [ ] Monitor error rates
- [ ] Monitor user adoption
- [ ] Collect user feedback

### 6.2 Bug Fixes
- [ ] Address any reported issues
- [ ] Optimize performance if needed
- [ ] Improve error messages based on feedback

### 6.3 Enhancements
- [ ] Consider additional source/target document types
- [ ] Consider bulk copy operations
- [ ] Consider copy templates
