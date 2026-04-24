# Sales Order - ODBC Implementation for Sales Employee & Owner

## Overview
Implemented ODBC-based data loading for Sales Employee and Owner dropdowns, with automatic name-to-code conversion during CREATE and UPDATE operations.

## Changes Made

### 1. Backend - Database Service (`backend/services/salesOrderDbService.js`)

#### Added ODBC Queries:
```javascript
// Get all active owners (employees)
const getOwners = () => safe(db.query(`
  SELECT empID, firstName, lastName, 
         firstName + ' ' + ISNULL(lastName, '') AS FullName
  FROM   OHEM
  WHERE  Active = 'Y'
  ORDER  BY firstName, lastName
`));
```

#### Updated Reference Data:
- Added `owners` array to reference data response
- Includes: `empID`, `firstName`, `lastName`, `FullName`
- Sales Employees already existed in ODBC queries

### 2. Backend - Service Layer (`backend/services/SalesOrderService.js`)

#### New Conversion Functions:

**`convertSalesEmployeeToCode(input, salesEmployees)`**
- Accepts: name (string) or code (number)
- Returns: SlpCode (number) or null
- Flow:
  1. Check if empty or -1 → return null
  2. Check if numeric → return as-is
  3. Search in ODBC data (case-insensitive)
  4. If not found → search via Service Layer API
  5. If still not found → create new Sales Employee
  6. Return SlpCode

**`convertOwnerToCode(input, owners)`**
- Accepts: name (string) or empID (number)
- Returns: empID (number) or null
- Flow:
  1. Check if empty → return null
  2. Check if numeric → return as-is
  3. Search in ODBC data (FullName, firstName, lastName)
  4. If not found → search via Service Layer API
  5. If still not found → return null (optional field)
  6. Return empID

#### Updated CREATE Function (`submitSalesOrder`):
```javascript
// Load ODBC data
const refData = await salesOrderDb.getReferenceData();
const salesEmployees = refData.sales_employees || [];
const owners = refData.owners || [];

// Convert using ODBC data
const SlpCode = await convertSalesEmployeeToCode(salesEmployeeInput, salesEmployees);
const OwnerCode = await convertOwnerToCode(payload.header.owner, owners);
```

#### Updated UPDATE Function (`updateSalesOrder`):
- Same pattern as CREATE
- Loads ODBC data first
- Converts names to codes using ODBC data

#### SAP Payload Construction:
```javascript
// Only include if not null/undefined
...(SlpCode !== null && SlpCode !== undefined && { SalesPersonCode: SlpCode }),
...(OwnerCode !== null && OwnerCode !== undefined && { DocumentsOwner: OwnerCode }),
...(Remarks && { Comments: Remarks }),
...(Freight > 0 && { TotalExpenses: Freight }),
```

### 3. Frontend - Sales Order Page (`frontend/src/modules/sales-order/SalesOrder.jsx`)

#### Updated State:
```javascript
const [refData, setRefData] = useState({
  // ... existing fields
  sales_employees: [],  // NEW
  owners: [],           // NEW
});
```

#### Dynamic Dropdowns:

**Sales Employee Dropdown:**
```jsx
<select name="purchaser" value={header.purchaser || ''}>
  <option value="">No Sales Employee / Buyer</option>
  {(refData.sales_employees || []).map(emp => (
    <option key={emp.SlpCode} value={emp.SlpName}>
      {emp.SlpName}
    </option>
  ))}
</select>
```

**Owner Dropdown:**
```jsx
<select name="owner" value={header.owner || ''}>
  <option value="">No Owner</option>
  {(refData.owners || []).map(owner => (
    <option key={owner.empID} value={owner.FullName}>
      {owner.FullName}
    </option>
  ))}
</select>
```

## Data Flow

### CREATE Flow:
1. **Frontend** → User selects "Deepak Kothari" from Sales Employee dropdown
2. **Frontend** → Sends `{ purchaser: "Deepak Kothari" }` to backend
3. **Backend** → Loads ODBC data (sales_employees array)
4. **Backend** → Searches for "Deepak Kothari" in ODBC data
5. **Backend** → Finds match → gets SlpCode (e.g., 5)
6. **Backend** → Sends to SAP: `{ SalesPersonCode: 5 }`
7. **SAP** → Creates Sales Order with Sales Employee = 5

### UPDATE Flow:
1. **Frontend** → User changes Owner to "test"
2. **Frontend** → Sends `{ owner: "test" }` to backend
3. **Backend** → Loads ODBC data (owners array)
4. **Backend** → Searches for "test" in ODBC data
5. **Backend** → Not found in ODBC → searches Service Layer API
6. **Backend** → Finds empID (e.g., 12)
7. **Backend** → Sends to SAP: `{ DocumentsOwner: 12 }`
8. **SAP** → Updates Sales Order with Owner = 12

### EDIT Mode Flow:
1. **Backend** → Loads Sales Order from SAP via ODBC
2. **Backend** → JOINs with OSLP and OHEM tables
3. **Backend** → Returns: `{ salesEmployee: "5", purchaser: "Deepak Kothari", owner: "test" }`
4. **Frontend** → Displays "Deepak Kothari" in Sales Employee dropdown
5. **Frontend** → Displays "test" in Owner dropdown

## Benefits

1. **Performance**: ODBC queries are faster than multiple Service Layer API calls
2. **Efficiency**: Single reference data load gets all dropdown options
3. **Flexibility**: Supports both name and code inputs
4. **Auto-creation**: Creates new Sales Employees if they don't exist
5. **Fallback**: Falls back to Service Layer API if ODBC data is stale
6. **Type Safety**: Handles numeric codes and string names seamlessly

## Testing

### Test Cases:
1. ✅ Select existing Sales Employee from dropdown
2. ✅ Select existing Owner from dropdown
3. ✅ Enter new Sales Employee name (auto-creates)
4. ✅ Enter numeric Sales Employee code
5. ✅ Leave Sales Employee empty (sends null)
6. ✅ Leave Owner empty (sends null)
7. ✅ Edit mode loads correct names
8. ✅ Update with new Sales Employee
9. ✅ Update with new Owner
10. ✅ Remarks field saves and loads correctly
11. ✅ Freight field saves and loads correctly

### Test Script:
Run `node backend/scripts/testSalesEmployeeCreation.js` to test the conversion logic.

## SAP Field Mapping

| Frontend Field | Backend Field | SAP Field | Type |
|---|---|---|---|
| purchaser | salesEmployee / purchaser | SalesPersonCode | number (SlpCode) |
| owner | owner | DocumentsOwner | number (empID) |
| otherInstruction | remarks / otherInstruction | Comments | string |
| freight | freight | TotalExpenses | number |

## Notes

- Sales Employee is stored as NAME in frontend, CODE in backend/SAP
- Owner is stored as NAME in frontend, empID in backend/SAP
- ODBC data is loaded once on page load for performance
- Service Layer API is used as fallback for new entries
- Owner field is optional (returns null if not found)
- Sales Employee field is required (throws error if not found and can't create)
