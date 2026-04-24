# Requirements Document: Sales Quotation Copy From/Copy To Functionality

## Functional Requirements

### FR1: Sales Quotation Page Creation

**Description**: Create a complete Sales Quotation page with full CRUD operations, mirroring AR Credit Memo and Sales Order implementations.

**Acceptance Criteria**:
1. Page displays in Create mode with empty form
2. Page displays in Edit mode with existing quotation data
3. Page displays in View mode with read-only fields
4. All header fields are editable in Create/Edit modes
5. All line items are editable in Create/Edit modes
6. Form validation prevents submission with invalid data
7. Success message displayed on successful save
8. Error message displayed on failed save

### FR2: Copy From Functionality

**Description**: Allow users to copy quotation lines from source documents (AR Invoice, Delivery, Sales Order) with automatic base reference tracking.

**Acceptance Criteria**:
1. "Copy From" button visible on Sales Quotation page
2. Copy From Modal displays available source document types
3. Modal fetches open documents for selected customer
4. Modal displays document list with DocNum, DocDate, CardCode, CardName
5. User can select a document to view its lines
6. Modal displays line items with ItemCode, ItemName, OpenQty, Price, TaxCode
7. User can select lines to copy
8. Selected lines populate quotation item matrix
9. Base references (BaseEntry, BaseType, BaseLine) are automatically set
10. Batch information is fetched for batch-managed items
11. Modal closes after successful copy
12. Error message displayed if source document not found
13. Error message displayed if no open lines available
14. Error message displayed if customer mismatch

### FR3: Copy To Functionality

**Description**: Allow users to copy quotation data to target documents (AR Invoice, Delivery) for order fulfillment.

**Acceptance Criteria**:
1. "Copy To" button visible on saved Sales Quotation page
2. Copy To Modal displays available target document types
3. User can select target document type (Invoice or Delivery)
4. Backend creates reverse transaction with quotation data
5. Success message displays with created document number
6. Error message displayed if quotation not saved
7. Error message displayed if copy to operation fails
8. Created document is linked to quotation via base references

### FR4: Header Fields

**Description**: Implement all header fields for Sales Quotation, matching AR Credit Memo and Sales Order.

**Acceptance Criteria**:
1. Customer field is required and searchable
2. Contact Person field is populated from customer contacts
3. Branch field is selectable from available branches
4. Warehouse field is selectable from available warehouses
5. Payment Terms field is selectable from payment terms list
6. Posting Date field is date picker
7. Delivery Date field is date picker
8. Document Date field is date picker
9. Journal Remark field is text input
10. Other Instruction field is text input
11. Discount field accepts numeric input
12. Freight field accepts numeric input
13. Sales Employee field is selectable from sales employees list
14. All fields maintain their values during form submission

### FR5: Line Items Management

**Description**: Implement complete line items management with item selection, quantity, pricing, and tax handling.

**Acceptance Criteria**:
1. Item matrix displays all line items
2. Add Line button opens ItemSelectionModal
3. ItemSelectionModal displays searchable item list
4. User can select item and add to matrix
5. Item Code field is required
6. Item Name field is auto-populated from item master
7. Quantity field is required and accepts numeric input
8. Unit Price field is required and accepts numeric input
9. Discount field accepts numeric input
10. Tax Code field is selectable from tax codes list
11. Warehouse field is selectable from warehouses list
12. UOM Code field is auto-populated from item master
13. HSN Code field is auto-populated from item master
14. Line Total is calculated as Quantity * Unit Price
15. Delete Line button removes line from matrix
16. Edit Line button allows inline editing

### FR6: Batch Management

**Description**: Detect batch-managed items and provide batch allocation UI.

**Acceptance Criteria**:
1. Batch-managed items are detected from item master
2. Batch Allocation button visible for batch-managed items
3. BatchAllocationModal displays available batches
4. Modal shows batch number, available quantity, expiry date
5. User can allocate batches to line quantity
6. Total batch quantity must equal line quantity
7. Error message displayed if batch quantities don't match
8. Batch allocations are saved with line item
9. Batch allocations are displayed in item matrix

### FR7: Logistics Tab

**Description**: Implement Logistics tab for shipping and delivery details.

**Acceptance Criteria**:
1. Logistics tab displays shipping type selection
2. Shipping type field is selectable from shipping types list
3. Delivery Date field is date picker
4. Shipping Address field is selectable from customer addresses
5. Billing Address field is selectable from customer addresses
6. Ship To Address field is selectable from customer addresses
7. Pay To Address field is selectable from customer addresses
8. Freight Charges section displays available freight charges
9. Freight charges can be added to quotation
10. All logistics data is saved with quotation

### FR8: Accounting Tab

**Description**: Implement Accounting tab for payment terms and accounting details.

**Acceptance Criteria**:
1. Accounting tab displays payment terms selection
2. Payment Terms field is selectable from payment terms list
3. Payment Method field is selectable from payment methods
4. Owner field is selectable from sales employees
5. Purchaser field is selectable from sales employees
6. Branch field is selectable from branches
7. Warehouse field is selectable from warehouses
8. All accounting data is saved with quotation

### FR9: Tax Tab

**Description**: Implement Tax tab for tax calculations and GST details.

**Acceptance Criteria**:
1. Tax tab displays tax code selection
2. Tax Code field is selectable from tax codes list
3. GST Type field displays INTERSTATE, INTRASTATE, or OTHER
4. IGST field displays calculated IGST amount
5. CGST field displays calculated CGST amount
6. SGST field displays calculated SGST amount
7. Total Tax field displays sum of all taxes
8. Tax calculations are updated when line items change
9. Tax calculations are updated when tax code changes
10. All tax data is saved with quotation

### FR10: Electronic Documents Tab

**Description**: Implement Electronic Documents tab for e-invoice and e-way bill support.

**Acceptance Criteria**:
1. Electronic Documents tab displays e-invoice status
2. E-invoice status shows pending, generated, or failed
3. E-invoice number is displayed when generated
4. E-way bill status is displayed
5. E-way bill number is displayed when generated
6. E-document generation can be triggered from tab
7. All electronic document data is saved with quotation

### FR11: Attachments Tab

**Description**: Implement Attachments tab for document attachments.

**Acceptance Criteria**:
1. Attachments tab displays list of attachments
2. Add Attachment button allows file upload
3. File upload supports common document formats
4. Attachment list shows file name, size, upload date
5. Delete Attachment button removes attachment
6. Attachments are saved with quotation
7. Attachments can be downloaded from quotation

### FR12: Backend APIs

**Description**: Implement backend APIs for Sales Quotation operations.

**Acceptance Criteria**:
1. GET /api/sales/quotation/reference-data returns all reference data
2. GET /api/sales/quotation/list returns list of quotations
3. GET /api/sales/quotation/:docEntry returns single quotation
4. POST /api/sales/quotation creates new quotation
5. PATCH /api/sales/quotation/:docEntry updates quotation
6. DELETE /api/sales/quotation/:docEntry deletes quotation
7. GET /api/sales/quotation/copy-from?type=Invoice&cardCode=CUS001 returns open documents
8. GET /api/sales/quotation/document-lines?docEntry=123&type=Invoice returns document lines
9. POST /api/sales/quotation/copy-to creates reverse transaction
10. All APIs return appropriate HTTP status codes
11. All APIs return error messages on failure

### FR13: Base Reference Tracking

**Description**: Maintain SAP B1 compatibility through BaseEntry, BaseType, and BaseLine fields.

**Acceptance Criteria**:
1. BaseEntry field stores source document entry
2. BaseType field stores source document type (13/15/17)
3. BaseLine field stores source line number
4. Base references are set when copying from source document
5. Base references are validated before saving
6. Base references are displayed in line items
7. Base references are used for reverse transactions in Copy To

### FR14: Form Validation

**Description**: Implement comprehensive form validation.

**Acceptance Criteria**:
1. Customer field is required
2. At least one line item is required
3. Line item quantity must be positive
4. Line item unit price must be non-negative
5. Discount must be between 0 and 100
6. Tax code must be valid
7. Warehouse must be valid
8. Posting date must be valid date
9. Delivery date must be after posting date
10. Error messages displayed for each validation failure
11. Form submission prevented if validation fails

### FR15: Data Persistence

**Description**: Ensure all quotation data is properly saved and retrieved.

**Acceptance Criteria**:
1. All header fields are saved to database
2. All line items are saved to database
3. All logistics data is saved to database
4. All accounting data is saved to database
5. All tax data is saved to database
6. All electronic document data is saved to database
7. All attachments are saved to database
8. All data is retrieved correctly when editing quotation
9. All data is retrieved correctly when viewing quotation

## Non-Functional Requirements

### NFR1: Performance

**Description**: System must perform efficiently with large datasets.

**Acceptance Criteria**:
1. Copy From modal loads document list within 2 seconds
2. Copy From modal loads line items within 2 seconds
3. Item selection modal loads item list within 2 seconds
4. Batch allocation modal loads batches within 1 second
5. Quotation save completes within 3 seconds
6. Quotation load completes within 2 seconds
7. Copy To operation completes within 5 seconds

### NFR2: Scalability

**Description**: System must handle growing data volumes.

**Acceptance Criteria**:
1. Document list pagination supports 20 items per page
2. Item list pagination supports 50 items per page
3. Batch list pagination supports 100 items per page
4. System handles quotations with 100+ line items
5. System handles customers with 1000+ documents

### NFR3: Usability

**Description**: System must be user-friendly and intuitive.

**Acceptance Criteria**:
1. All buttons have clear labels
2. All fields have helpful placeholder text
3. Error messages are clear and actionable
4. Success messages confirm operations
5. Modal dialogs are easy to navigate
6. Tab navigation is intuitive
7. Form layout is logical and organized

### NFR4: Reliability

**Description**: System must be reliable and handle errors gracefully.

**Acceptance Criteria**:
1. System handles database connection failures
2. System handles API timeouts
3. System handles invalid data gracefully
4. System provides meaningful error messages
5. System logs all errors for debugging
6. System recovers from errors without data loss

### NFR5: Security

**Description**: System must protect sensitive data.

**Acceptance Criteria**:
1. User authentication is required
2. User authorization is enforced
3. SQL injection is prevented
4. XSS attacks are prevented
5. CSRF attacks are prevented
6. Sensitive data is encrypted
7. Audit trail is maintained

### NFR6: Compatibility

**Description**: System must be compatible with SAP B1.

**Acceptance Criteria**:
1. BaseEntry, BaseType, BaseLine fields match SAP B1 format
2. Document types match SAP B1 constants
3. Tax codes match SAP B1 tax codes
4. Warehouse codes match SAP B1 warehouse codes
5. Item codes match SAP B1 item codes
6. Customer codes match SAP B1 customer codes

## Technical Requirements

### TR1: Frontend Components

**Description**: Implement required frontend components.

**Acceptance Criteria**:
1. SalesQuotation.jsx main component created
2. CopyFromModal.jsx component created
3. CopyToModal.jsx component created
4. ContentsTab.jsx component created
5. LogisticsTab.jsx component created
6. AccountingTab.jsx component created
7. TaxTab.jsx component created
8. ElectronicDocumentsTab.jsx component created
9. AttachmentsTab.jsx component created
10. ItemSelectionModal.jsx component created
11. BatchAllocationModal.jsx component created
12. All components follow React best practices
13. All components have proper error handling
14. All components have proper loading states

### TR2: Backend Services

**Description**: Implement required backend services.

**Acceptance Criteria**:
1. salesQuotationService.js created
2. salesQuotationDbService.js created
3. salesQuotationController.js created
4. All CRUD operations implemented
5. All Copy From operations implemented
6. All Copy To operations implemented
7. All services follow Node.js best practices
8. All services have proper error handling
9. All services have proper logging

### TR3: Database Schema

**Description**: Implement required database schema.

**Acceptance Criteria**:
1. OQUT table exists for quotation headers
2. QUT1 table exists for quotation lines
3. All required fields are present
4. All indexes are created for performance
5. Foreign keys are properly defined
6. Constraints are properly defined

### TR4: API Endpoints

**Description**: Implement required API endpoints.

**Acceptance Criteria**:
1. GET /api/sales/quotation/reference-data endpoint created
2. GET /api/sales/quotation/list endpoint created
3. GET /api/sales/quotation/:docEntry endpoint created
4. POST /api/sales/quotation endpoint created
5. PATCH /api/sales/quotation/:docEntry endpoint created
6. DELETE /api/sales/quotation/:docEntry endpoint created
7. GET /api/sales/quotation/copy-from endpoint created
8. GET /api/sales/quotation/document-lines endpoint created
9. POST /api/sales/quotation/copy-to endpoint created
10. All endpoints have proper request validation
11. All endpoints have proper response formatting
12. All endpoints have proper error handling

## Acceptance Criteria Summary

### Must Have (MVP)

1. Sales Quotation page with Create/Edit/View modes
2. Copy From functionality for AR Invoice, Delivery, Sales Order
3. Copy To functionality for AR Invoice, Delivery
4. Header fields: Customer, Contact Person, Branch, Warehouse, Payment Terms, Dates
5. Line items with Item Code, Quantity, Unit Price, Tax Code, Warehouse
6. Base reference tracking (BaseEntry, BaseType, BaseLine)
7. Batch management for batch-managed items
8. Backend APIs for CRUD operations
9. Backend APIs for Copy From/Copy To operations
10. Form validation and error handling

### Should Have

1. Logistics Tab with shipping details
2. Accounting Tab with payment terms
3. Tax Tab with GST calculations
4. Attachments Tab for document attachments
5. Electronic Documents Tab for e-invoice/e-way bill
6. Item selection modal for manual item addition
7. Batch allocation modal for batch management
8. Performance optimization with pagination
9. Comprehensive error handling and recovery

### Nice to Have

1. Advanced search and filtering
2. Bulk operations (copy multiple documents)
3. Document templates
4. Email integration for quotation distribution
5. PDF export functionality
6. Quotation comparison
7. Quotation versioning
8. Quotation approval workflow

## Success Metrics

1. All functional requirements implemented and tested
2. All non-functional requirements met
3. All technical requirements implemented
4. Zero critical bugs in production
5. User acceptance testing passed
6. Performance benchmarks met
7. Security audit passed
8. Code coverage > 80%
