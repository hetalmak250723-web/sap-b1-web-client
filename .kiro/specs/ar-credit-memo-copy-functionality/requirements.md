# Requirements Document: AR Credit Memo Copy From/Copy To Functionality

## Feature Overview

Implement Copy From and Copy To functionality in the AR Credit Memo page to replicate SAP Business One behavior. This enables users to efficiently populate credit memo lines from source documents and create reverse transactions to target documents while maintaining SAP B1 data integrity through base reference tracking.

## Functional Requirements

### Copy From Functionality

#### FR-1: Copy From Button Availability
- **Description**: Display "Copy From" button in AR Credit Memo form
- **Trigger**: Button visible when Business Partner is selected AND document is in Add Mode
- **Behavior**: Clicking button opens Copy From Modal
- **Acceptance Criteria**:
  - Button appears only when cardCode is selected
  - Button appears only in Add Mode (not Edit Mode)
  - Button is disabled if no customer selected
  - Button is disabled if document already has lines (optional: allow append)

#### FR-2: Copy From Modal - Document Selection
- **Description**: Modal displays available source documents for selected customer
- **Source Documents**: AR Invoice, Delivery, Sales Order
- **Display Fields**: DocNum, DocDate, Customer Code, Customer Name, Balance Qty/Open Amount, Status
- **Filtering Rules**:
  - Same Customer (matching cardCode)
  - Open documents only (DocStatus = 'O')
  - Not Cancelled (Cancelled = 'N')
  - Must have at least one line with open quantity > 0
- **Acceptance Criteria**:
  - Modal shows only documents matching all filter criteria
  - Documents sorted by DocDate descending
  - User can select document type (Invoice/Delivery/SalesOrder) via tabs or dropdown
  - Modal displays "No documents found" if no matches
  - Modal shows loading indicator while fetching

#### FR-3: Copy From Modal - Line Display
- **Description**: After document selection, display available lines from selected document
- **Display Fields**: ItemCode, ItemName, OpenQty, Price, TaxCode, Warehouse
- **Line Filtering**: Only lines with OpenQty > 0
- **Acceptance Criteria**:
  - Lines displayed in table format
  - OpenQty calculated as (Quantity - QuantityReturned)
  - All lines from selected document shown
  - User can select individual lines or select all
  - Modal shows "No lines available" if document has no open lines

#### FR-4: Copy From - Line Population
- **Description**: Populate AR Credit Memo item matrix with selected lines
- **Data Mapping**:
  - ItemCode → itemNo
  - ItemName → itemDescription
  - OpenQty → quantity
  - Price → unitPrice
  - TaxCode → taxCode
  - Warehouse → whse
  - HSNCode → hsnCode (fetched from item master)
  - UoMCode → uomCode (fetched from item master)
- **Base Reference Assignment**:
  - AR Invoice: BaseType = 13, BaseEntry = DocEntry, BaseLine = LineNum
  - Delivery: BaseType = 15, BaseEntry = DocEntry, BaseLine = LineNum
  - Sales Order: BaseType = 17, BaseEntry = DocEntry, BaseLine = LineNum
- **Acceptance Criteria**:
  - All selected lines populated in item matrix
  - Base references correctly assigned per document type
  - Totals calculated (Quantity × UnitPrice)
  - Tax codes applied
  - Batch information loaded for batch-managed items
  - Modal closes after population
  - Item matrix updated with new lines

#### FR-5: Batch Management for Copied Lines
- **Description**: Handle batch allocation for batch-managed items
- **Behavior**:
  - Detect if item is batch-managed (ManBtchNum = 'Y')
  - Fetch available batches from source warehouse
  - Display batch allocation UI if item is batch-managed
  - Allow user to allocate quantities to batches
- **Acceptance Criteria**:
  - Batch flag detected correctly
  - Batches fetched from correct warehouse
  - Batch allocation UI shown for batch-managed items
  - Total batch quantities must equal line quantity
  - Batch expiry dates displayed

### Copy To Functionality

#### FR-6: Copy To Button Availability
- **Description**: Display "Copy To" button in AR Credit Memo form
- **Trigger**: Button visible only after AR Credit Memo is Added/Saved
- **Behavior**: Clicking button opens Copy To Modal
- **Acceptance Criteria**:
  - Button appears only after document is saved (docEntry exists)
  - Button disabled if document not saved
  - Button disabled if no lines in document
  - Clicking button opens Copy To Modal

#### FR-7: Copy To Modal - Target Selection
- **Description**: Modal displays available target document types
- **Target Documents**: AR Invoice, Delivery (optional based on design)
- **Behavior**:
  - User selects target document type
  - System creates reverse transaction in target document
- **Acceptance Criteria**:
  - Modal shows available target types
  - User can select target type
  - Modal shows confirmation before creating
  - Modal closes after successful creation

#### FR-8: Copy To - Reverse Transaction Creation
- **Description**: Create reverse transaction in target document
- **Data Transfer**:
  - Header: CardCode, CardName, PostingDate, DeliveryDate, Branch, PaymentTerms, Remarks
  - Lines: ItemCode, Quantity, UnitPrice, Warehouse, TaxCode
  - Base References: Maintain reference to source credit memo
- **Acceptance Criteria**:
  - Target document created successfully
  - All header data transferred
  - All line data transferred
  - Base references maintained
  - Document number generated
  - Success message displayed with new document number

### Backend API Requirements

#### API-1: GET /api/sales/copy-from
- **Purpose**: Fetch open source documents for customer
- **Query Parameters**:
  - `type`: Document type (Invoice, Delivery, SalesOrder)
  - `cardCode`: Customer code
- **Response**:
  ```json
  {
    "documents": [
      {
        "docEntry": 123,
        "docNum": "INV-001",
        "docDate": "2024-01-15",
        "cardCode": "CUS001",
        "cardName": "Customer A",
        "status": "O",
        "cancelled": false
      }
    ]
  }
  ```
- **Acceptance Criteria**:
  - Returns only open documents
  - Returns only non-cancelled documents
  - Returns only documents for specified customer
  - Returns only documents with open lines
  - Sorted by DocDate descending

#### API-2: GET /api/sales/document-lines
- **Purpose**: Fetch lines from source document
- **Query Parameters**:
  - `docEntry`: Document entry
  - `type`: Document type (Invoice, Delivery, SalesOrder)
- **Response**:
  ```json
  {
    "lines": [
      {
        "lineNum": 0,
        "itemCode": "ITEM001",
        "itemName": "Product A",
        "openQty": 10,
        "price": 100,
        "taxCode": "GST18",
        "warehouse": "WH01",
        "baseEntry": 123,
        "baseType": 13,
        "baseLine": 0
      }
    ]
  }
  ```
- **Acceptance Criteria**:
  - Returns only lines with openQty > 0
  - OpenQty calculated correctly (Qty - QtyReturned)
  - Includes base reference fields
  - Sorted by LineNum ascending

#### API-3: POST /api/sales/copy-to
- **Purpose**: Create reverse transaction in target document
- **Request Body**:
  ```json
  {
    "sourceDocEntry": 456,
    "sourceDocType": 14,
    "targetDocType": "Invoice",
    "header": {
      "cardCode": "CUS001",
      "cardName": "Customer A",
      "postingDate": "2024-01-20",
      "deliveryDate": "2024-01-25"
    },
    "lines": [
      {
        "itemCode": "ITEM001",
        "quantity": 10,
        "unitPrice": 100,
        "warehouse": "WH01",
        "taxCode": "GST18",
        "baseEntry": 456,
        "baseType": 14,
        "baseLine": 0
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "docEntry": 789,
    "docNum": "INV-003",
    "message": "Reverse transaction created successfully"
  }
  ```
- **Acceptance Criteria**:
  - Creates document in SAP B1
  - Returns new document entry and number
  - Maintains base references
  - Returns error if creation fails

### Frontend UI Requirements

#### UI-1: Copy From Button
- **Location**: AR Credit Memo form header, next to other action buttons
- **Label**: "Copy From"
- **Icon**: Document copy icon
- **State**: Enabled only when cardCode selected and in Add Mode
- **Behavior**: Opens Copy From Modal on click

#### UI-2: Copy From Modal
- **Title**: "Copy From Document"
- **Layout**:
  - Document type selector (tabs or dropdown): Invoice, Delivery, Sales Order
  - Document list table with columns: DocNum, DocDate, CardName, Status
  - Line list table (shown after document selection) with columns: ItemCode, ItemName, OpenQty, Price, TaxCode, Warehouse
  - Select All / Deselect All checkboxes
  - Copy button (enabled when lines selected)
  - Cancel button
- **Behavior**:
  - Fetch documents on modal open
  - Fetch lines on document selection
  - Show loading indicators
  - Display error messages
  - Close on successful copy

#### UI-3: Copy To Button
- **Location**: AR Credit Memo form header, next to Copy From button
- **Label**: "Copy To"
- **Icon**: Document export icon
- **State**: Enabled only after document saved (docEntry exists)
- **Behavior**: Opens Copy To Modal on click

#### UI-4: Copy To Modal
- **Title**: "Copy To Document"
- **Layout**:
  - Target document type selector: Invoice, Delivery
  - Confirmation message showing credit memo details
  - Create button
  - Cancel button
- **Behavior**:
  - Show confirmation before creating
  - Display loading indicator during creation
  - Show success message with new document number
  - Close on successful creation

### Data Integrity Requirements

#### DI-1: Base Reference Validation
- **Requirement**: All copied lines must have valid base references
- **Validation Rules**:
  - baseEntry must be positive integer
  - baseType must be 13, 15, or 17
  - baseLine must be non-negative integer
  - Source document must exist
  - Source line must exist
  - Source line must have openQty > 0
- **Acceptance Criteria**:
  - Invalid base references rejected
  - Error message displayed
  - Line not populated if validation fails

#### DI-2: Customer Consistency
- **Requirement**: All copied lines must belong to same customer
- **Validation Rules**:
  - Source document cardCode must match credit memo cardCode
  - All lines from same source document
- **Acceptance Criteria**:
  - Mismatch detected and prevented
  - Error message displayed
  - Copy operation cancelled

#### DI-3: Quantity Validation
- **Requirement**: Copied quantity must not exceed open quantity
- **Validation Rules**:
  - Copied quantity ≤ source line openQty
  - For batch items: sum of batch quantities = line quantity
- **Acceptance Criteria**:
  - Quantity validation enforced
  - Error message if validation fails
  - User can adjust quantities

#### DI-4: Document Status Validation
- **Requirement**: Only open, non-cancelled documents can be copied
- **Validation Rules**:
  - DocStatus = 'O'
  - Cancelled = 'N'
- **Acceptance Criteria**:
  - Closed/cancelled documents filtered out
  - Not shown in Copy From modal
  - Error if user attempts to copy cancelled document

## Non-Functional Requirements

### Performance Requirements

#### PERF-1: Copy From Modal Load Time
- **Requirement**: Modal should load and display documents within 2 seconds
- **Acceptance Criteria**:
  - Document list fetched and displayed in < 2 seconds
  - Line list fetched and displayed in < 1 second
  - No UI freezing during load

#### PERF-2: Item Matrix Population
- **Requirement**: Lines should populate in item matrix within 1 second
- **Acceptance Criteria**:
  - All lines populated in < 1 second
  - No UI lag during population
  - Batch data loaded asynchronously if needed

#### PERF-3: Database Query Optimization
- **Requirement**: Database queries should use indexes and efficient filtering
- **Acceptance Criteria**:
  - Queries use indexed columns (CardCode, DocStatus, Cancelled)
  - EXISTS clause used for open line filtering
  - Query execution time < 500ms

### Security Requirements

#### SEC-1: Authorization
- **Requirement**: User must have permission to create/edit AR Credit Memos
- **Acceptance Criteria**:
  - Permission checked before allowing Copy From/Copy To
  - Unauthorized users cannot access functionality
  - Audit log records all operations

#### SEC-2: Data Validation
- **Requirement**: All inputs must be validated and sanitized
- **Acceptance Criteria**:
  - SQL injection prevented
  - Invalid inputs rejected
  - Error messages don't expose system details

#### SEC-3: Audit Trail
- **Requirement**: All Copy From/Copy To operations logged
- **Acceptance Criteria**:
  - User, timestamp, source/target documents logged
  - Logs retained for audit purposes
  - Base reference assignments tracked

### Usability Requirements

#### USAB-1: Error Messages
- **Requirement**: Clear, actionable error messages
- **Acceptance Criteria**:
  - Error messages explain what went wrong
  - Error messages suggest corrective action
  - Error messages don't use technical jargon

#### USAB-2: Loading Indicators
- **Requirement**: Show loading state during API calls
- **Acceptance Criteria**:
  - Loading spinner shown during fetch
  - Buttons disabled during operation
  - User knows operation is in progress

#### USAB-3: Confirmation Dialogs
- **Requirement**: Confirm before destructive operations
- **Acceptance Criteria**:
  - Confirmation shown before Copy To
  - User can cancel operation
  - Clear description of what will happen

## Acceptance Criteria Summary

### Copy From Feature
- ✓ Button visible only when customer selected and in Add Mode
- ✓ Modal displays open documents for selected customer
- ✓ Modal displays lines with open quantities
- ✓ Lines populated in item matrix with correct data
- ✓ Base references assigned correctly per document type
- ✓ Batch information loaded for batch-managed items
- ✓ Error handling for all failure scenarios
- ✓ Performance: < 2 seconds to load modal, < 1 second to populate lines

### Copy To Feature
- ✓ Button visible only after document saved
- ✓ Modal displays target document type options
- ✓ Reverse transaction created successfully
- ✓ Base references maintained in target document
- ✓ Success message displays new document number
- ✓ Error handling for all failure scenarios

### Data Integrity
- ✓ Base references valid and traceable
- ✓ Customer consistency maintained
- ✓ Quantities validated
- ✓ Document status validated
- ✓ Batch quantities sum correctly

### Security & Audit
- ✓ Authorization checked
- ✓ All inputs validated
- ✓ Operations logged for audit
- ✓ No SQL injection vulnerabilities
