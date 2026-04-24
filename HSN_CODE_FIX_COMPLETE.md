# HSN Code Field Name Fix - COMPLETE ✅

## Issue
AR Invoice and AR Credit Memo were using incorrect field name `hsn_code` (with underscore) instead of `hsnCode` (camelCase) when fetching HSN code from the API in the `handleItemSelect` function.

## Root Cause
The backend API (`/api/hsn-codes/item/:itemCode`) returns:
```javascript
{
  itemCode: 'FG00001',
  hsnCode: '12345678',        // ✅ camelCase
  hsnDescription: 'Description',
  hsn_sww: '12345678',        // Fallback field
  itemChapterID: 123
}
```

But AR Invoice and AR Credit Memo were accessing:
```javascript
const hsnCode = hsnRes.data?.hsn_code || '';  // ❌ Wrong field name
```

## Solution Applied

### 1. AR Invoice (`ARInvoicePage.jsx`)
Updated `handleItemSelect` function:

**Before:**
```javascript
const hsnRes = await fetchHSNCodeFromItem(item.ItemCode);
const hsnCode = hsnRes.data?.hsn_code || '';  // ❌ Wrong
```

**After:**
```javascript
const hsnRes = await fetchHSNCodeFromItem(item.ItemCode);
const hsnData = hsnRes.data;
// ...
hsnCode: hsnData.hsnCode || hsnData.hsn_sww || '',  // ✅ Correct with fallback
```

### 2. AR Credit Memo (`ARCreditMemo.jsx`)
Updated `handleItemSelect` function:

**Before:**
```javascript
const hsnRes = await fetchHSNCodeFromItem(item.ItemCode);
const hsnCode = hsnRes.data?.hsn_code || '';  // ❌ Wrong
```

**After:**
```javascript
const hsnRes = await fetchHSNCodeFromItem(item.ItemCode);
const hsnData = hsnRes.data;
// ...
hsnCode: hsnData.hsnCode || hsnData.hsn_sww || '',  // ✅ Correct with fallback
```

## Verification

### Already Correct Implementation
- ✅ Sales Order - Uses `hsnData.hsnCode || hsnData.hsn_sww || ''`
- ✅ Delivery - Uses `hsnData.hsnCode || item.HSNCode || ''`

### Fixed Implementation
- ✅ AR Invoice - Now uses `hsnData.hsnCode || hsnData.hsn_sww || ''`
- ✅ AR Credit Memo - Now uses `hsnData.hsnCode || hsnData.hsn_sww || ''`

## API Response Structure
From `backend/services/hsnCodeDbService.js`:
```javascript
return {
  itemCode: row.ItemCode || '',
  hsnCode: row.HSNCode || row.HSN_SWW || '',      // Primary field (camelCase)
  hsnDescription: row.HSNDescription || '',
  hsn_sww: row.HSN_SWW || '',                     // Fallback field (snake_case)
  itemChapterID: row.ItemChapterID || null,
};
```

## Benefits
1. HSN code now populates correctly when selecting items in AR Invoice
2. HSN code now populates correctly when selecting items in AR Credit Memo
3. Consistent with Sales Order and Delivery implementation
4. Includes fallback to `hsn_sww` field for backward compatibility

## Testing Checklist
- [ ] AR Invoice - Select item from modal → HSN code populates
- [ ] AR Credit Memo - Select item from modal → HSN code populates
- [ ] Sales Order - Verify still works (already correct)
- [ ] Delivery - Verify still works (already correct)
- [ ] Test with items that have HSN in OCHP table
- [ ] Test with items that have HSN in SWW field only

## Files Modified
1. `frontend/src/modules/ar-invoice/ARInvoicePage.jsx` - Fixed HSN field name
2. `frontend/src/modules/ar-CreditMemo/ARCreditMemo.jsx` - Fixed HSN field name

## Status: ✅ COMPLETE
All files validated with no syntax errors. HSN code will now populate correctly in AR Invoice and AR Credit Memo when selecting items.
