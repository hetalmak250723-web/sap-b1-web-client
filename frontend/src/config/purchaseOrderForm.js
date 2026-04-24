const FORM_SETTINGS_STORAGE_KEY = 'sapb1.purchaseOrder.formSettings.v1';

const HEADER_UDF_DEFINITIONS = [
  { key: 'U_LoadPortRemark', label: 'Load Port Remark', type: 'text', defaultValue: '' },
  { key: 'U_InspectionReq', label: 'Inspection Required', type: 'select', defaultValue: 'No', options: ['No', 'Yes'] },
  { key: 'U_SupplierRefDate', label: 'Supplier Ref. Date', type: 'date', defaultValue: '' },
  { key: 'U_PaymentAdvice', label: 'Payment Advice', type: 'textarea', defaultValue: '' },
];

const ROW_UDF_DEFINITIONS = [
  { key: 'U_Loc', label: 'Loc', type: 'text', defaultValue: '' },
  { key: 'U_Branch', label: 'Branch', type: 'text', defaultValue: '' },
  { key: 'U_QcStatus', label: 'QC Status', type: 'select', defaultValue: 'Pending', options: ['Pending', 'Approved', 'Rejected'] },
];

const BASE_MATRIX_COLUMNS = [
  { key: 'itemNo', label: 'Item No.' },
  { key: 'itemDescription', label: 'Item Description' },
  { key: 'hsnCode', label: 'HSN Code' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'uomCode', label: 'UoM' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'stdDiscount', label: 'Discount %' },
  { key: 'taxCode', label: 'Tax Code' },
  { key: 'totalBeforeTax', label: 'Total Before Tax' },
  { key: 'total', label: 'Total (LC)' },
  { key: 'whse', label: 'Whse' },
];

const createUdfState = (definitions) =>
  definitions.reduce((acc, field) => {
    acc[field.key] = field.defaultValue;
    return acc;
  }, {});

const buildVisibilitySettings = (definitions) =>
  definitions.reduce((acc, field) => {
    acc[field.key] = { visible: true, active: true };
    return acc;
  }, {});

const createDefaultFormSettings = () => ({
  headerUdfs: buildVisibilitySettings(HEADER_UDF_DEFINITIONS),
  matrixColumns: buildVisibilitySettings(BASE_MATRIX_COLUMNS),
  rowUdfs: buildVisibilitySettings(ROW_UDF_DEFINITIONS),
});

const mergeNestedSettings = (defaults, saved = {}) =>
  Object.keys(defaults).reduce((acc, groupKey) => {
    acc[groupKey] = {
      ...defaults[groupKey],
      ...(saved[groupKey] || {}),
    };
    return acc;
  }, {});

const readSavedFormSettings = () => {
  const defaults = createDefaultFormSettings();

  try {
    const raw = localStorage.getItem(FORM_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    return mergeNestedSettings(defaults, JSON.parse(raw));
  } catch (error) {
    return defaults;
  }
};

export {
  BASE_MATRIX_COLUMNS,
  FORM_SETTINGS_STORAGE_KEY,
  HEADER_UDF_DEFINITIONS,
  ROW_UDF_DEFINITIONS,
  createDefaultFormSettings,
  createUdfState,
  readSavedFormSettings,
};
