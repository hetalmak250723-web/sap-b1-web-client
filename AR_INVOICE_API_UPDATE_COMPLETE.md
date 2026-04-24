# AR Invoice - API and Reference Updates COMPLETE

## Summary
Successfully updated AR Invoice page to use correct AR Invoice API endpoints instead of Delivery API, and updated all references from "Delivery" to "AR Invoice".

## Changes Made

### 1. API Imports Updated
**File**: `frontend/src/modules/ar-invoice/ARInvoicePage.jsx`

#### Before (Delivery API):
```javascript
import {
  fetchDeliveryReferenceData,
  fetchDeliveryCustomerDetails,
  fetchDeliveryByDocEntry,
  submitDelivery,
  updateDelivery,
  fetchDocumentSeries,
  fetchNextNumber,
  fetchStateFromWarehouse,
  fetchOpenSalesOrders,
  fetchSalesOrderForCopy,
  fetchBatchesByItem,
} from '../../api/deliveryApi';
import { SALES_ORDER_COMPANY_ID } from '../../config/appConfig';
```

#### After (AR Invoice API):
```javascript
import {
  fetchARInvoiceReferenceData,
  fetchARInvoiceCustomerDetails,
  fetchARInvoiceByDocEntry,
  submitARInvoice,
  updateARInvoice,
  fetchDocumentSeries,
  fetchNextNumber,
  fetchStateFromAddress,
} from '../../api/arInvoiceApi';
import { AR_INVOICE_COMPANY_ID } from '../../config/appConfig';
```

### 2. API Function Calls Updated

#### Reference Data Loading:
```javascript
// Before
fetchDeliveryReferenceData(SALES_ORDER_COMPANY_ID)

// After
fetchARInvoiceReferenceData(AR_INVOICE_COMPANY_ID)
```

#### Fetch by DocEntry:
```javascript
// Before
const r = await fetchDeliveryByDocEntry(docEntry);
const so = r.data.delivery;

// After
const r = await fetchARInvoiceByDocEntry(docEntry);
const so = r.data.ar_invoice;
```

#### Customer Details:
```javascript
// Before
const r = await fetchDeliveryCustomerDetails(code);

// After
const r = await fetchARInvoiceCustomerDetails(code);
```

#### Submit/Update:
```javascript
// Before
const payload = { company_id: SALES_ORDER_COMPANY_ID, header: prep, lines, header_udfs: headerUdfs };
const r = currentDocEntry ? await updateDelivery(currentDocEntry, payload) : await submitDelivery(payload);

// After
const payload = { company_id: AR_INVOICE_COMPANY_ID, header: prep, lines, header_udfs: headerUdfs };
const r = currentDocEntry ? await updateARInvoice(currentDocEntry, payload) : await submitARInvoice(payload);
```

### 3. Component Name Updated

```javascript
// Before
function Delivery() {
  ...
}
export default Delivery;

// After
function ARInvoicePage() {
  ...
}
export default ARInvoicePage;
```

### 4. User-Facing Text Updated

#### Error Messages:
```javascript
// Before
'Please save the delivery first before copying to another document'

// After
'Please save the AR invoice first before copying to another document'
```

#### Tooltips:
```javascript
// Before
title={!currentDocEntry ? 'Save the delivery first' : 'Copy to another document'}

// After
title={!currentDocEntry ? 'Save the AR invoice first' : 'Copy to another document'}
```

## API Endpoints Used

### AR Invoice API (`/ar-invoice`)

1. **GET** `/ar-invoice/reference-data?company_id={id}` - Load reference data
2. **GET** `/ar-invoice/customers/{customerCode}` - Load customer details
3. **GET** `/ar-invoice/series` - Load document series
4. **GET** `/ar-invoice/series/next?series={series}` - Get next document number
5. **GET** `/ar-invoice/state-from-address?address={address}` - Get state from address
6. **GET** `/ar-invoice/{docEntry}` - Load AR invoice by DocEntry
7. **POST** `/ar-invoice` - Create new AR invoice
8. **PATCH** `/ar-invoice/{docEntry}` - Update existing AR invoice
9. **GET** `/ar-invoice/list` - List AR invoices

## Configuration

### Company ID Constant
```javascript
// frontend/src/config/appConfig.js
const AR_INVOICE_COMPANY_ID = process.env.REACT_APP_AR_INVOICE_COMPANY_ID || '1';

export {
  AR_INVOICE_COMPANY_ID,
  // ... other constants
};
```

### Environment Variable
```bash
# .env
REACT_APP_AR_INVOICE_COMPANY_ID=1
```

## Removed Imports

The following Delivery-specific imports were removed as they're not needed for AR Invoice:

- `fetchStateFromWarehouse` - AR Invoice uses `fetchStateFromAddress` instead
- `fetchOpenSalesOrders` - Not needed for AR Invoice
- `fetchSalesOrderForCopy` - Not needed for AR Invoice
- `fetchBatchesByItem` - Batch management handled differently in AR Invoice

## Backend Verification

The backend AR Invoice API is already implemented with the following endpoints:

✅ `backend/routes/arInvoiceRoutes.js` - Route definitions
✅ `backend/controllers/arInvoiceController.js` - Controller logic
✅ `backend/services/arInvoiceService.js` - SAP B1 integration
✅ `backend/services/arInvoiceDbService.js` - Database operations

## Data Structure

### Request Payload:
```javascript
{
  company_id: "1",
  header: {
    vendor: "C00001",
    name: "Customer Name",
    postingDate: "2024-01-15",
    documentDate: "2024-01-15",
    deliveryDate: "2024-01-20",
    placeOfSupply: "Maharashtra",
    branch: "1",
    warehouse: "WH01",
    // ... other header fields
  },
  lines: [
    {
      itemNo: "ITEM001",
      itemDescription: "Product Name",
      hsnCode: "8471",
      quantity: "10",
      unitPrice: "100.00",
      uomCode: "PCS",
      taxCode: "GST18",
      total: "1000.00",
      whse: "WH01",
      branch: "1",
      // ... other line fields
    }
  ],
  header_udfs: {
    // User-defined fields
  }
}
```

### Response Structure:
```javascript
{
  message: "AR Invoice created successfully",
  doc_num: "INV-2024-001",
  doc_entry: 123,
  ar_invoice: {
    doc_entry: 123,
    doc_num: "INV-2024-001",
    header: { ... },
    lines: [ ... ],
    header_udfs: { ... }
  }
}
```

## Testing Checklist

- [ ] Load AR Invoice page - reference data loads correctly
- [ ] Select customer - customer details load correctly
- [ ] Select series - next number generates correctly
- [ ] Add line items - all fields work correctly
- [ ] Calculate totals - tax calculations work correctly
- [ ] Save new AR Invoice - creates successfully
- [ ] Load existing AR Invoice - loads correctly
- [ ] Update AR Invoice - updates successfully
- [ ] Copy To functionality - works correctly
- [ ] Validation - all validations work correctly
- [ ] Error handling - errors display correctly

## Related Files

### Frontend:
- ✅ `frontend/src/modules/ar-invoice/ARInvoicePage.jsx` - Main component (updated)
- ✅ `frontend/src/api/arInvoiceApi.js` - API client (already exists)
- ✅ `frontend/src/config/appConfig.js` - Configuration (already has constant)

### Backend:
- ✅ `backend/routes/arInvoiceRoutes.js` - Routes
- ✅ `backend/controllers/arInvoiceController.js` - Controller
- ✅ `backend/services/arInvoiceService.js` - SAP service
- ✅ `backend/services/arInvoiceDbService.js` - Database service

## Status
✅ **COMPLETE** - AR Invoice page now uses correct AR Invoice API endpoints and all references have been updated from Delivery to AR Invoice.

## Next Steps

1. **Test the AR Invoice page** with the backend API
2. **Verify all CRUD operations** work correctly
3. **Test Copy From/Copy To** functionality
4. **Verify tax calculations** match SAP B1
5. **Test batch allocation** if applicable
6. **Verify document series** and numbering
7. **Test validation** and error handling
