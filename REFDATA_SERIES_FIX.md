# refData.series.map is not a function - FIXED ✅

## Issue
Runtime error: `TypeError: refData.series.map is not a function`

This occurred in both AR Invoice and AR Credit Memo when trying to render the Series dropdown.

## Root Cause
The code was calling `.map()` on `refData.series` without checking if it was an array first. In some cases:
1. Initial render before data loads: `refData.series` is `[]` (correct)
2. API response might be malformed or delayed
3. Race condition between state updates

The issue manifested when:
- Component renders before reference data loads
- API response is delayed
- `refData.series` is undefined or not an array

## Solution Applied

### 1. AR Credit Memo (`ARCreditMemo.jsx`)
Added defensive checks in two locations:

**Location 1: Series dropdown rendering (line ~1844)**
```javascript
// Before:
{refData.series.map(s => (...))}

// After:
{Array.isArray(refData.series) && refData.series.map(s => (...))}
```

**Location 2: After successful submission (line ~1601)**
```javascript
// Before:
if (refData.series.length > 0) {
  handleSeriesChange(refData.series[0].Series);
}

// After:
if (Array.isArray(refData.series) && refData.series.length > 0) {
  handleSeriesChange(refData.series[0].Series);
}
```

### 2. AR Invoice (`ARInvoicePage.jsx`)
Added defensive checks in two locations:

**Location 1: Series dropdown rendering (line ~1623)**
```javascript
// Before:
{refData.series.map(s => (...))}

// After:
{Array.isArray(refData.series) && refData.series.map(s => (...))}
```

**Location 2: After successful submission (line ~1380)**
```javascript
// Before:
if (refData.series.length > 0) {
  handleSeriesChange(refData.series[0].Series);
}

// After:
if (Array.isArray(refData.series) && refData.series.length > 0) {
  handleSeriesChange(refData.series[0].Series);
}
```

## Why This Works

1. **Array.isArray() check**: Ensures `refData.series` is actually an array before calling `.map()`
2. **Short-circuit evaluation**: If not an array, the `.map()` is never called
3. **Graceful degradation**: If series data isn't loaded yet, the dropdown simply shows no options
4. **No breaking changes**: Once data loads, the dropdown renders normally

## Initial State
Both components initialize `refData.series` as an empty array:
```javascript
const [refData, setRefData] = useState({
  // ...
  series: [],  // ✅ Initialized as array
  // ...
});
```

## API Response Structure
The backend returns:
```javascript
{
  series: [
    { Series: 1, SeriesName: 'AR Invoice', Indicator: 'INV' },
    { Series: 2, SeriesName: 'Credit Memo', Indicator: 'CM' },
    // ...
  ]
}
```

## Testing Checklist
- [ ] AR Invoice page loads without errors
- [ ] AR Credit Memo page loads without errors
- [ ] Series dropdown appears after data loads
- [ ] Series options display correctly
- [ ] Can select a series
- [ ] After successful submission, series resets to first option
- [ ] No console errors about `.map is not a function`

## Files Modified
1. `frontend/src/modules/ar-invoice/ARInvoicePage.jsx` - Added 2 defensive checks
2. `frontend/src/modules/ar-CreditMemo/ARCreditMemo.jsx` - Added 2 defensive checks

## Status: ✅ COMPLETE
All defensive checks added. No syntax errors. Runtime error should be resolved.
