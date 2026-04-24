const FORM_SETTINGS_STORAGE_KEY = 'sapb1.salesOrder.formSettings.v1';

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
  { key: 'itemNo', label: 'Item No.', visible: true },
  { key: 'itemDescription', label: 'Item Description', visible: true },
  { key: 'sellerQuality', label: 'Seller - Quality', visible: true },
  { key: 'buyerQuality', label: 'Buyer - Quality', visible: true },
  { key: 'quantity', label: 'Quantity', visible: true },
  { key: 'unitPrice', label: 'Unit Price', visible: true },
  { key: 'sellerPrice', label: 'Seller - Price', visible: true },
  { key: 'buyerPrice', label: 'Buyer - Price', visible: true },
  { key: 'sellerDelivery', label: 'Seller - Delivery', visible: true },
  { key: 'buyerDelivery', label: 'Buyer - Delivery', visible: true },
  { key: 'sellerBrokerageAmtPer', label: 'Seller Brokerage(Amt./Per)', visible: true },
  { key: 'sellerBrokeragePercent', label: 'Seller Brokerage in Percentage', visible: true },
  { key: 'sellerBrokerage', label: 'Seller Brokerage', visible: true },
  { key: 'buyerBrokerage', label: 'Buyer Brokerage', visible: true },
  { key: 'deliveredQty', label: 'Delivered Qty', visible: true },
  { key: 'stdDiscount', label: 'Discount %', visible: true },
  { key: 'stcode', label: 'STCODE', visible: true },
  { key: 'taxCode', label: 'Tax Code', visible: true },
  { key: 'taxAmount', label: 'Tax Amount (LC)', visible: true },
  { key: 'totalLC', label: 'Total (LC)', visible: true },
  { key: 'whse', label: 'Whse', visible: true },
  { key: 'distRule', label: 'Distr. Rule', visible: true },
  { key: 'openQty', label: 'Open Qty', visible: true },
  { key: 'loc', label: 'Loc.', visible: true },
  { key: 'hsnCode', label: 'HSN', visible: true },
  { key: 'unitPriceRepeat', label: 'Unit Price', visible: true },
  { key: 'sacCode', label: 'SAC', visible: true },
  // Hidden by default - after SAC
  { key: 'specialRebate', label: 'Special Rebate', visible: false },
  { key: 'commission', label: 'Commision', visible: false },
  { key: 'sellerBrokeragePerQty', label: 'BrokPerQty', visible: false },
  { key: 'buyerPaymentTerms', label: 'Buyer - Terms of Payment', visible: false },
  { key: 'buyerSpecialInstruction', label: 'Buyer - Special Instruction', visible: false },
  { key: 'sellerSpecialInstruction', label: 'Seller - Special Instruction', visible: false },
  { key: 'buyerBillDiscount', label: 'Buyer Bill Discount', visible: false },
  { key: 'sellerBillDiscount', label: 'Seller Bill Discount', visible: false },
  { key: 'sellerItem', label: 'S_Item', visible: false },
  { key: 'sellerQty', label: 'S_Qty', visible: false },
  { key: 'freightPurchase', label: 'Freight Purchase', visible: false },
  { key: 'freightSales', label: 'Freight Sales', visible: false },
  { key: 'freightProvider', label: 'Freight Provider', visible: false },
  { key: 'freightProviderName', label: 'Freight Provider Name', visible: false },
  { key: 'brokerageNumber', label: 'Brokerage Number', visible: false },
];

const createUdfState = (definitions) =>
  definitions.reduce((acc, field) => {
    acc[field.key] = field.defaultValue;
    return acc;
  }, {});

const buildVisibilitySettings = (definitions) =>
  definitions.reduce((acc, field) => {
    acc[field.key] = { visible: field.visible !== undefined ? field.visible : true, active: true };
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
