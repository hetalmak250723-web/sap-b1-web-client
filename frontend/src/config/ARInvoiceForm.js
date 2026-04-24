const FORM_SETTINGS_STORAGE_KEY = 'sapb1.arInvoice.formSettings.v1';

const HEADER_UDF_DEFINITIONS = [
  { key: 'U_InvoiceNotes', label: 'Invoice Notes', type: 'text', defaultValue: '' },
  { key: 'U_PaymentTerms', label: 'Payment Terms', type: 'select', defaultValue: 'Standard', options: ['Immediate', 'Net 30', 'Net 60', 'Net 90'] },
  { key: 'U_DueDate', label: 'Due Date', type: 'date', defaultValue: '' },
  { key: 'U_InvoiceRemarks', label: 'Invoice Remarks', type: 'textarea', defaultValue: '' },
];

const ROW_UDF_DEFINITIONS = [
  { key: 'U_ItemRemarks', label: 'Item Remarks', type: 'text', defaultValue: '' },
  { key: 'U_DeliveryDate', label: 'Delivery Date', type: 'date', defaultValue: '' },
  { key: 'U_QualityCheck', label: 'Quality Check', type: 'select', defaultValue: 'Pending', options: ['Pending', 'Passed', 'Failed'] },
];

const BASE_MATRIX_COLUMNS = [
  { key: 'itemServiceType', label: 'Type' },
  { key: 'itemNo', label: 'Item No.' },
  { key: 'itemDescription', label: 'Description' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'discountPercent', label: 'Discount %' },
  { key: 'priceAfterDiscount', label: 'Price After Discount' },
  { key: 'taxCode', label: 'Tax Code' },
  { key: 'totalLC', label: 'Total (LC)' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'baseType', label: 'Base Type' },
  { key: 'baseEntry', label: 'Base Entry' },
  { key: 'baseLine', label: 'Base Line' },
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
    acc[groupKey] = { ...defaults[groupKey], ...saved[groupKey] };
    return acc;
  }, {});

const readSavedFormSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(FORM_SETTINGS_STORAGE_KEY));
    return mergeNestedSettings(createDefaultFormSettings(), saved);
  } catch (e) {
    return createDefaultFormSettings();
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
