/**
 * Sales Order reference data — loaded directly from SAP B1 SQL Server database.
 * Column names verified against NCPL_110126 schema.
 */
const db = require('./dbService');

const safe = async (promise) => {
  try {
    const r = await promise;
    return r.recordset || [];
  } catch (e) {
    return [];
  }
};

// ── queries ───────────────────────────────────────────────────────────────────

const getCustomers = () => safe(db.query(`
  SELECT CardCode, CardName, CardType, Currency,
         VatGroup, GroupNum AS PayTermsGrpCode
  FROM   OCRD
  WHERE  CardType = 'C'
    AND  frozenFor <> 'Y'
  ORDER  BY CardName
`));

const getItems = () => safe(db.query(`
  SELECT ItemCode, ItemName,
         SalUnitMsr  AS SalesUnit,
         InvntryUom  AS InventoryUOM,
         SUoMEntry   AS UoMGroupEntry,
         SWW         AS HSNCode,
         CountryOrg  AS ItemCountryOrg,
         SACEntry    AS SACEntry,
         VatGourpSa  AS TaxCodeAR,
         ''          AS DistributionRule,
         DfltWH      AS DefaultWarehouse
  FROM   OITM
  WHERE  SellItem = 'Y'
    AND  validFor  <> 'N'
  ORDER  BY ItemCode
`));

// Enhanced item list for modal with all details
const getItemsForModal = () => safe(db.query(`
  SELECT 
    T0.ItemCode,
    T0.ItemName,
    T0.FrgnName AS ForeignName,
    T0.ItmsGrpCod AS ItemGroupCode,
    T1.ItmsGrpNam AS ItemGroup, 
    CAST(T0.OnHand AS DECIMAL(19,2)) AS InStock,
    T0.IsCommited AS Committed,
    T0.OnOrder AS Ordered,
    T0.SalUnitMsr AS SalesUnit,
    T0.InvntryUom AS InventoryUOM,
    T0.SUoMEntry AS UoMGroupEntry,
    CHP.ChapterID AS HSNCode,
    T0.validFor AS Active,
    T0.frozenFor AS Frozen,
    T0.PrchseItem AS PurchaseItem,
    T0.SellItem AS SalesItem,
    T0.InvntItem AS InventoryItem,
    T0.DfltWH AS DefaultWarehouse,
    T0.ManBtchNum AS BatchManaged,
    T0.ManSerNum AS SerialManaged,
    T0.CountryOrg AS ItemCountryOrg,
    T0.SACEntry AS SACEntry,
    T0.VatGourpSa AS TaxCodeAR,
    '' AS DistributionRule
    --T0.brand AS Brand,
    --T0.U_Origin AS Origin
  FROM OITM T0
 LEFT JOIN OITB T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod 
   LEFT JOIN OCHP CHP ON CHP.AbsEntry = T0.ChapterID

 WHERE T0.SellItem = 'Y'
    AND T0.validFor <> 'N'
  ORDER BY T0.ItemCode

 
`));

// Get freight charges for modal
const getFreightCharges = (docEntry) => {
  if (!docEntry) {
    // CREATE MODE
    return safe(db.query(`
      SELECT 
        T0.ExpnsCode,
        T0.ExpnsName,
        T0.DistrbMthd AS DistributionMethod,
        T0.DistrbMthd AS FreightTaxDistributionMethod,
        T0.TaxLiable,
        T0.RevFixSum AS DefaultAmount,
        'O' AS Status
      FROM OEXD T0
      ORDER BY T0.ExpnsName
    `));
  }

  // EDIT MODE
  return safe(db.query(`
    SELECT 
      T0.ExpnsCode,
      T0.ExpnsName,
      T0.DistrbMthd AS DistributionMethod,
      T0.DistrbMthd AS FreightTaxDistributionMethod,
      T0.TaxLiable,
      T0.RevFixSum AS DefaultAmount,
      'O' AS Status,
      ISNULL(T1.LineTotal, 0) AS LineTotal,
      T1.TaxCode,
      ISNULL(T1.VatSum, 0) AS TaxAmount,
      T1.Comments
    FROM OEXD T0
    LEFT JOIN RDR3 T1 
      ON T0.ExpnsCode = T1.ExpnsCode 
     AND T1.DocEntry = @DocEntry
    ORDER BY T0.ExpnsName
  `, { DocEntry: docEntry }));
};

const getWarehouses = () => safe(db.query(`
  SELECT WhsCode, WhsName, Street, Block, Building,
         City, County, State, ZipCode, Country, BPLid AS BranchID
  FROM   OWHS
  WHERE  Inactive <> 'Y'
  ORDER  BY WhsCode
`));

const getPaymentTerms = () => safe(db.query(`
  SELECT GroupNum, PymntGroup
  FROM   OCTG
  ORDER  BY PymntGroup
`));

const getShippingTypes = () => safe(db.query(`
  SELECT TrnspCode, TrnspName
  FROM   OSHP
  ORDER  BY TrnspName
`));

const getBranches = () => safe(db.query(`
  SELECT BPLId, BPLName
  FROM   OBPL where Disabled='N'
  ORDER  BY BPLName
`));

const getStates = () => safe(db.query(`
  SELECT Code, Name
  FROM   OCST
  WHERE  Country = 'IN'
  ORDER  BY Name
`));

const getCountries = () => safe(db.query(`
  SELECT Code, Name
  FROM   OCRY
  ORDER  BY Name
`));

const getDistributionRules = () => safe(db.query(`
  SELECT TOP 200 OcrCode AS FactorCode, OcrName AS FactorDescription
  FROM   OOCR
  WHERE  Active <> 'N'
  ORDER  BY OcrCode
`));
const getTaxCodes = () => safe(db.query(`
  SELECT 
    T0.Code,
    T0.Name,
    SUM(T1.EfctivRate) AS Rate,
    CASE 
        WHEN 
            MAX(CASE WHEN T1.STACode LIKE '%IGST%' THEN 1 ELSE 0 END) = 1 
            THEN 'INTERSTATE'
        WHEN 
            COUNT(DISTINCT CASE 
                WHEN T1.STACode LIKE '%CGST%' THEN 'CGST'
                WHEN T1.STACode LIKE '%SGST%' THEN 'SGST'
            END) = 2 
            THEN 'INTRASTATE'
        ELSE 'OTHER'
    END AS GSTType
FROM OSTC T0
INNER JOIN STC1 T1 ON T0.Code = T1.STCCode  and T1.[STAType] In ('-100','-110','-120')
WHERE 
    T0.Lock = 'N'
GROUP BY 
    T0.Code, T0.Name
ORDER BY 
    T0.Code;
`));

// const getTaxCodes = () => safe(db.query(`
//   SELECT 
//     T0.Code,
//     T0.Name,
//     SUM(T1.Rate) AS Rate,
//     CASE 
//         WHEN EXISTS (
//             SELECT 1 FROM VTG1 T2 
//             WHERE T2.Code = T0.Code AND T2.TaxType = 'C'
//         ) AND EXISTS (
//             SELECT 1 FROM VTG1 T3 
//             WHERE T3.Code = T0.Code AND T3.TaxType = 'S'
//         ) THEN 'INTRASTATE'
//         WHEN EXISTS (
//             SELECT 1 FROM VTG1 T4 
//             WHERE T4.Code = T0.Code AND T4.TaxType = 'I'
//         ) THEN 'INTERSTATE'
//         ELSE 'OTHER'
//     END AS GSTType
// FROM OVTG T0
// INNER JOIN VTG1 T1 ON T0.Code = T1.Code
// GROUP BY T0.Code, T0.Name
// ORDER BY T0.Code
// `));

const getUomGroups = () => safe(db.query(`
  SELECT g.UgpEntry AS AbsEntry,
         g.UgpCode  AS Name,
         u.UomCode
  FROM   OUGP g
  LEFT JOIN UGP1 d ON d.UgpEntry = g.UgpEntry
  LEFT JOIN OUOM u ON u.UomEntry = d.UomEntry
  WHERE  g.Locked <> 'Y'
  ORDER  BY g.UgpEntry, d.LineNum
`));

let rdr1FieldMetadataPromise = null;
const itemUomContextCache = new Map();

const getSalesOrderLineFieldMetadata = async () => {
  if (!rdr1FieldMetadataPromise) {
    rdr1FieldMetadataPromise = safe(db.query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'RDR1'
      ORDER BY ORDINAL_POSITION
    `)).then((rows) => rows.reduce((acc, row) => {
      const columnName = String(row.COLUMN_NAME || '').trim();
      if (!columnName) return acc;
      acc[columnName] = String(row.DATA_TYPE || '').trim().toLowerCase();
      return acc;
    }, {}));
  }

  return rdr1FieldMetadataPromise;
};

const getItemUomContext = async (itemCode) => {
  const normalizedItemCode = String(itemCode || '').trim();
  if (!normalizedItemCode) return null;

  if (!itemUomContextCache.has(normalizedItemCode)) {
    itemUomContextCache.set(normalizedItemCode, safe(db.query(`
      SELECT TOP 1
        T0.ItemCode,
        T0.UgpEntry,
        T0.SUoMEntry,
        T0.IUoMEntry,
        T0.SalUnitMsr,
        T0.InvntryUom,
        SU.UomCode AS SalesUomCode,
        IU.UomCode AS InventoryUomCode
      FROM OITM T0
      LEFT JOIN OUOM SU ON SU.UomEntry = T0.SUoMEntry
      LEFT JOIN OUOM IU ON IU.UomEntry = T0.IUoMEntry
      WHERE T0.ItemCode = @itemCode
    `, { itemCode: normalizedItemCode })).then((rows) => rows[0] || null));
  }

  return itemUomContextCache.get(normalizedItemCode);
};

const resolveSalesOrderLineUomEntry = async (itemCode, uomValue) => {
  const item = await getItemUomContext(itemCode);
  if (!item) return null;

  const rawValue = uomValue == null ? '' : String(uomValue).trim();
  const requestedUomEntry = Number(rawValue);
  const requestedUomCode = rawValue.toUpperCase();
  const ugpEntry = Number(item.UgpEntry);
  const salesUomEntry = Number(item.SUoMEntry);
  const inventoryUomEntry = Number(item.IUoMEntry);

  const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

  if (isPositiveInteger(requestedUomEntry)) {
    if (ugpEntry > 0) {
      const rows = await safe(db.query(`
        SELECT TOP 1 UomEntry
        FROM UGP1
        WHERE UgpEntry = @ugpEntry
          AND UomEntry = @uomEntry
      `, { ugpEntry, uomEntry: requestedUomEntry }));
      return rows[0]?.UomEntry != null ? Number(rows[0].UomEntry) : null;
    }

    const rows = await safe(db.query(`
      SELECT TOP 1 UomEntry
      FROM OUOM
      WHERE UomEntry = @uomEntry
    `, { uomEntry: requestedUomEntry }));
    return rows[0]?.UomEntry != null ? Number(rows[0].UomEntry) : null;
  }

  if (requestedUomCode) {
    if (ugpEntry > 0) {
      const rows = await safe(db.query(`
        SELECT TOP 1 U.UomEntry
        FROM UGP1 G
        INNER JOIN OUOM U ON U.UomEntry = G.UomEntry
        WHERE G.UgpEntry = @ugpEntry
          AND UPPER(LTRIM(RTRIM(U.UomCode))) = @uomCode
      `, { ugpEntry, uomCode: requestedUomCode }));

      if (rows[0]?.UomEntry != null) {
        return Number(rows[0].UomEntry);
      }

      return null;
    }

    const rows = await safe(db.query(`
      SELECT TOP 1 UomEntry
      FROM OUOM
      WHERE UPPER(LTRIM(RTRIM(UomCode))) = @uomCode
      ORDER BY UomEntry
    `, { uomCode: requestedUomCode }));

    if (rows[0]?.UomEntry != null) {
      return Number(rows[0].UomEntry);
    }
  }

  if (isPositiveInteger(salesUomEntry)) {
    return salesUomEntry;
  }

  if (isPositiveInteger(inventoryUomEntry)) {
    return inventoryUomEntry;
  }

  return null;
};

const getSalesEmployees = () => safe(db.query(`
  SELECT SlpCode, SlpName, Memo, Commission, Active
  FROM   OSLP
  WHERE  Active = 'Y'
  ORDER  BY SlpName
`));

const getOwners = () => safe(db.query(`
  SELECT empID, firstName, lastName, 
         firstName + ' ' + ISNULL(lastName, '') AS FullName
  FROM   OHEM
  ORDER  BY firstName, lastName
`));

const LOOKUP_UDF_CONFIG = {
  U_Buyer_Quality: {
    tableId: 'RDR1',
    aliasId: 'Buyer_Quality',
    columnName: 'U_Buyer_Quality',
  },
  U_Seller_Quality: {
    tableId: 'RDR1',
    aliasId: 'Seller_Quality',
    columnName: 'U_Seller_Quality',
  },
  U_Buyer_Price: {
    tableId: 'RDR1',
    aliasId: 'Buyer_Price',
    columnName: 'U_Buyer_Price',
  },
  U_Seller_Price: {
    tableId: 'RDR1',
    aliasId: 'Seller_Price',
    columnName: 'U_Seller_Price',
  },
};

const normalizeLookupAlias = (aliasId) => {
  const normalized = String(aliasId || '').trim();
  if (!normalized) return '';
  if (LOOKUP_UDF_CONFIG[normalized]) return normalized;

  const prefixed = normalized.startsWith('U_') ? normalized : `U_${normalized}`;
  if (LOOKUP_UDF_CONFIG[prefixed]) return prefixed;

  const byAliasId = Object.entries(LOOKUP_UDF_CONFIG).find(([, config]) => (
    String(config.aliasId || '').toLowerCase() === normalized.replace(/^U_/, '').toLowerCase()
  ));

  return byAliasId ? byAliasId[0] : '';
};

const mapLookupRows = (rows = []) => {
  const seen = new Set();
  const options = [];

  rows.forEach((row) => {
    const rawValue = row?.Value ?? row?.FldValue ?? '';
    const rawDescription = row?.Description ?? row?.Descr ?? '';
    const description = String(rawDescription || '').trim();
    const value = String(rawValue || description || '').trim();

    if (!value) return;

    const normalized = value.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);

    options.push({
      value,
      description,
      label: description && description !== value ? `${value} - ${description}` : value,
    });
  });

  return options;
};

const getUdfValidValues = (tableId, aliasId) => safe(db.query(`
  SELECT
    LTRIM(RTRIM(ISNULL(T1.FldValue, ''))) AS Value,
    LTRIM(RTRIM(ISNULL(T1.Descr, ''))) AS Description,
    T1.IndexID
  FROM CUFD T0
  INNER JOIN UFD1 T1
    ON T0.TableID = T1.TableID
   AND T0.FieldID = T1.FieldID
  WHERE T0.TableID = @tableId
    AND (T0.AliasID = @aliasId OR CONCAT('U_', T0.AliasID) = @aliasId)
  ORDER BY T1.IndexID, T1.FldValue
`, { tableId, aliasId }));

const getExistingLookupValues = async (aliasId) => {
  const normalizedAlias = normalizeLookupAlias(aliasId);
  const columnName = LOOKUP_UDF_CONFIG[normalizedAlias]?.columnName;
  if (!columnName) return [];

  return safe(db.query(`
    SELECT DISTINCT
      LTRIM(RTRIM(CAST(${columnName} AS NVARCHAR(254)))) AS Value,
      '' AS Description
    FROM RDR1
    WHERE NULLIF(LTRIM(RTRIM(CAST(${columnName} AS NVARCHAR(254)))), '') IS NOT NULL
    ORDER BY Value
  `));
};

const getLookupValues = async (aliasId) => {
  const normalizedAlias = normalizeLookupAlias(aliasId);
  const config = LOOKUP_UDF_CONFIG[normalizedAlias];
  if (!config) return [];

  const [validValues, existingValues] = await Promise.all([
    getUdfValidValues(config.tableId, normalizedAlias),
    getExistingLookupValues(normalizedAlias),
  ]);

  return mapLookupRows([...validValues, ...existingValues]);
};

const getLookupUdfDefinition = async (aliasId) => {
  const normalizedAlias = normalizeLookupAlias(aliasId);
  const config = LOOKUP_UDF_CONFIG[normalizedAlias];
  if (!config) return null;

  const rows = await safe(db.query(`
    SELECT TOP 1 TableID, AliasID, FieldID, Descr
    FROM CUFD
    WHERE TableID = @tableId
      AND AliasID = @aliasId
  `, {
    tableId: config.tableId,
    aliasId: config.aliasId,
  }));

  return rows[0] || null;
};

const createLookupValue = async (aliasId, value, description = '') => {
  const normalizedAlias = normalizeLookupAlias(aliasId);
  const config = LOOKUP_UDF_CONFIG[normalizedAlias];
  if (!config) {
    throw new Error('Unsupported lookup field.');
  }

  const udfDefinition = await getLookupUdfDefinition(normalizedAlias);
  if (!udfDefinition) {
    throw new Error(`SAP UDF definition not found for ${normalizedAlias}.`);
  }

  const normalizedValue = String(value || '').trim();
  const normalizedDescription = String(description || normalizedValue).trim();

  if (!normalizedValue) {
    throw new Error('Value is required.');
  }

  const existingRows = await safe(db.query(`
    SELECT TOP 1
      LTRIM(RTRIM(ISNULL(FldValue, ''))) AS Value,
      LTRIM(RTRIM(ISNULL(Descr, ''))) AS Description
    FROM UFD1
    WHERE TableID = @tableId
      AND FieldID = @fieldId
      AND UPPER(LTRIM(RTRIM(ISNULL(FldValue, '')))) = @fieldValue
  `, {
    tableId: config.tableId,
    fieldId: udfDefinition.FieldID,
    fieldValue: normalizedValue.toUpperCase(),
  }));

  if (existingRows[0]) {
    return mapLookupRows(existingRows)[0];
  }

  const nextIndexRows = await db.query(`
    SELECT ISNULL(MAX(IndexID), -1) + 1 AS NextIndex
    FROM UFD1
    WHERE TableID = @tableId
      AND FieldID = @fieldId
  `, {
    tableId: config.tableId,
    fieldId: udfDefinition.FieldID,
  });

  const nextIndex = Number(nextIndexRows.recordset?.[0]?.NextIndex ?? 0);

  await db.query(`
    INSERT INTO UFD1 (TableID, FieldID, IndexID, FldValue, Descr, FldDate)
    VALUES (@tableId, @fieldId, @indexId, @fieldValue, @description, NULL)
  `, {
    tableId: config.tableId,
    fieldId: udfDefinition.FieldID,
    indexId: nextIndex,
    fieldValue: normalizedValue,
    description: normalizedDescription,
  });

  return mapLookupRows([{
    Value: normalizedValue,
    Description: normalizedDescription,
  }])[0];
};

// ── Document Series ───────────────────────────────────────────────────────────

const getDocumentSeries = async () => {
  const result = await safe(db.query(`
    SELECT 
    T0.Series,
    T0.SeriesName,
    T0.Indicator,
    T0.NextNumber,
    T1.Name AS FinancialYear,
    T1.F_RefDate AS FromDate,
    T1.T_RefDate AS ToDate
FROM NNM1 T0
INNER JOIN OFPR T1 
    ON T0.Indicator = T1.Indicator
WHERE T0.ObjectCode = '17'
    AND T0.Locked = 'N'
    AND GETDATE() BETWEEN T1.F_RefDate AND T1.T_RefDate
ORDER BY T0.SeriesName
  `));
  
  return result.map(s => ({
    Series: s.Series,
    SeriesName: s.SeriesName,
    NextNumber: s.NextNumber,
    Indicator: s.Indicator,
  }));
};

const getNextNumber = async (series) => {
  const result = await safe(db.query(`
    SELECT NextNumber
    FROM   NNM1
    WHERE  ObjectCode = '17'
      AND  Series = @series
      AND  Locked = 'N'
  `, { series }));
  
  if (result.length === 0) {
    throw new Error('Series not found or locked');
  }
  
  return {
    nextNumber: result[0].NextNumber,
  };
};
const getContactsByCustomer = async (cardCode) => {
  const result = await safe(db.query(`
    SELECT 
      CntctCode,
      Name,
      FirstName,
      LastName,
      E_MailL AS E_Mail,
      Cellolar AS MobilePhone,   -- ✅ FIXED
      Tel1 AS Phone1,
      CardCode
    FROM OCPR
    WHERE UPPER(LTRIM(RTRIM(CardCode))) = UPPER(LTRIM(RTRIM(@cardCode)))
    ORDER BY Name
  `, { cardCode }));

  return result;
};
const getAddressesByCustomer = (cardCode) => safe(db.query(`
  SELECT CardCode, AdresType, Address,
         Street, StreetNo, Block, Building,
         Address2, Address3,
         City, County, State, ZipCode, Country
  FROM   CRD1
  WHERE  CardCode = @cardCode
  ORDER  BY AdresType, Address
`, { cardCode }));

const getStateFromAddress = async (cardCode, addressCode) => {
  if (!cardCode || !addressCode) {
    return { state: '' };
  }
  
  const result = await safe(db.query(`
    SELECT State
    FROM   CRD1
    WHERE  CardCode = @cardCode
      AND  Address = @addressCode
  `, { cardCode, addressCode }));
  
  return {
    state: result.length > 0 ? result[0].State || '' : '',
  };
};

// ── aggregators ───────────────────────────────────────────────────────────────

const getReferenceData = async () => {
  const [
    customers, items, warehouses, paymentTerms,
    shippingTypes, branches, states, countries, distributionRules, taxCodes, uomRaw, salesEmployees, owners,
    buyerQualityOptions, sellerQualityOptions, buyerPriceOptions, sellerPriceOptions,
  ] = await Promise.all([
    getCustomers(), getItems(), getWarehouses(), getPaymentTerms(),
    getShippingTypes(), getBranches(), getStates(), getCountries(), getDistributionRules(), getTaxCodes(), getUomGroups(), getSalesEmployees(), getOwners(),
    getLookupValues('U_Buyer_Quality'),
    getLookupValues('U_Seller_Quality'),
    getLookupValues('U_Buyer_Price'),
    getLookupValues('U_Seller_Price'),
  ]);

  // Group UoM rows: UgpEntry -> { AbsEntry, Name, uomCodes[] }
  const uomMap = {};
  for (const row of uomRaw) {
    if (!uomMap[row.AbsEntry]) {
      uomMap[row.AbsEntry] = { AbsEntry: row.AbsEntry, Name: row.Name, uomCodes: [] };
    }
    if (row.UomCode && row.UomCode !== 'Manual' && !uomMap[row.AbsEntry].uomCodes.includes(row.UomCode)) {
      uomMap[row.AbsEntry].uomCodes.push(row.UomCode);
    }
  }
  const uom_groups = Object.values(uomMap);

  const mappedCustomers = customers.map(c => ({
    CardCode:        c.CardCode,
    CardName:        c.CardName,
    Currency:        c.Currency,
    VatGroup:        c.VatGroup,
    PayTermsGrpCode: c.PayTermsGrpCode,
  }));

  const mappedWarehouses = warehouses.map(w => ({
    WhsCode: w.WhsCode, WhsName: w.WhsName,
    Street: w.Street, Block: w.Block, Building: w.Building,
    City: w.City, County: w.County, State: w.State,
    ZipCode: w.ZipCode, Country: w.Country, BranchID: w.BranchID,
  }));

  return {
    customers:           mappedCustomers,
    vendors:             mappedCustomers,
    items: items.map(i => ({
      ItemCode:      i.ItemCode,
      ItemName:      i.ItemName,
      SalesUnit:     i.SalesUnit,
      InventoryUOM:  i.InventoryUOM,
      UoMGroupEntry: i.UoMGroupEntry,
      SWW:           i.HSNCode || '',
      ItemCountryOrg:i.ItemCountryOrg || '',
      SACEntry:      i.SACEntry != null ? String(i.SACEntry) : '',
      TaxCodeAR:     i.TaxCodeAR || '',
      DistributionRule: i.DistributionRule || '',
      DefaultWarehouse: i.DefaultWarehouse || '',
    })),
    warehouses:          mappedWarehouses,
    warehouse_addresses: mappedWarehouses,
    payment_terms:  paymentTerms.map(t => ({ GroupNum: t.GroupNum, PymntGroup: t.PymntGroup })),
    shipping_types: shippingTypes.map(s => ({ TrnspCode: s.TrnspCode, TrnspName: s.TrnspName })),
    branches:       branches.map(b => ({ BPLId: b.BPLId, BPLName: b.BPLName })),
    states:         states.map(st => ({ Code: st.Code, Name: st.Name })),
    countries:      countries.map(country => ({ Code: country.Code, Name: country.Name })),
    distribution_rules: distributionRules.map(rule => ({
      FactorCode: rule.FactorCode || '',
      FactorDescription: rule.FactorDescription || '',
    })),
    tax_codes:      taxCodes.map(t => ({ Code: t.Code, Name: t.Name, Rate: t.Rate, GSTType: t.GSTType })),
    uom_groups,
    sales_employees: salesEmployees.map(e => ({ SlpCode: e.SlpCode, SlpName: e.SlpName })),
    owners:         owners.map(o => ({ empID: o.empID, firstName: o.firstName, lastName: o.lastName, FullName: o.FullName })),
    quality_options: {
      buyer: buyerQualityOptions,
      seller: sellerQualityOptions,
    },
    price_options: {
      buyer: buyerPriceOptions,
      seller: sellerPriceOptions,
    },
    contacts:           [],
    pay_to_addresses:   [],
    company_address:    {},
    decimal_settings:   { QtyDec: 2, PriceDec: 2, SumDec: 2, RateDec: 2, PercentDec: 2 },
    warnings:           [],
  };
};

const getCustomerDetails = async (cardCode) => {
  
  const [contacts, addresses] = await Promise.all([
    
    getContactsByCustomer(cardCode),
    getAddressesByCustomer(cardCode),
  ]);

  const billTo = addresses.filter(a => a.AdresType === 'B');

  return {
    contacts: contacts.map(c => ({
      CardCode:    c.CardCode,
      CntctCode:   c.CntctCode,
      Name:        c.Name || `${c.FirstName || ''} ${c.LastName || ''}`.trim(),
      FirstName:   c.FirstName,
      LastName:    c.LastName,
      E_Mail:      c.E_Mail,
      MobilePhone: c.MobilePhone,
      Phone1:      c.Phone1,
    })),
    bill_to_addresses: billTo,
    pay_to_addresses:  billTo,
  };
};

const getItemDetails = async (itemCode) => {
  const rows = await safe(db.query(`
    SELECT ItemCode, ItemName,
           SalUnitMsr AS SalesUnit,
           InvntryUom AS InventoryUOM,
           UgpEntry   AS UgpEntry,
           SUoMEntry  AS UoMGroupEntry,
           IUoMEntry  AS InventoryUomEntry,
           SWW        AS HSNCode,
           CountryOrg AS ItemCountryOrg,
           SACEntry   AS SACEntry,
           VatGourpSa AS TaxCodeAR,
           ''         AS DistributionRule,
           DfltWH     AS DefaultWarehouse
    FROM   OITM
    WHERE  ItemCode = @itemCode
  `, { itemCode }));
  const item = rows[0];
  if (!item) return null;
  return {
    ItemCode:      item.ItemCode,
    ItemName:      item.ItemName,
    SalesUnit:     item.SalesUnit,
    InventoryUOM:  item.InventoryUOM,
    UgpEntry:      item.UgpEntry,
    UoMGroupEntry: item.UoMGroupEntry,
    InventoryUomEntry: item.InventoryUomEntry,
    SWW:           item.HSNCode || '',
    ItemCountryOrg:item.ItemCountryOrg || '',
    SACEntry:      item.SACEntry != null ? String(item.SACEntry) : '',
    TaxCodeAR:     item.TaxCodeAR || '',
    DistributionRule: item.DistributionRule || '',
    DefaultWarehouse: item.DefaultWarehouse || '',
  };
};

// ── sales order list ──────────────────────────────────────────────────────────

const getSalesOrderList = async () => {
  const orders = await safe(db.query(`
    SELECT TOP 100
           DocEntry, DocNum, CardCode, CardName,
           DocDate, DocDueDate, DocStatus,
           DocTotal, DocCur
    FROM   ORDR
    WHERE  CANCELED <> 'Y'
    ORDER  BY DocEntry DESC
  `));

  return {
    orders: orders.map(o => ({
      doc_entry: o.DocEntry,
      doc_num: o.DocNum,
      customer_code: o.CardCode,
      customer_name: o.CardName,
      posting_date: o.DocDate ? o.DocDate.toISOString().split('T')[0] : '',
      delivery_date: o.DocDueDate ? o.DocDueDate.toISOString().split('T')[0] : '',
      status: o.DocStatus === 'O' ? 'Open' : o.DocStatus === 'C' ? 'Closed' : 'Unknown',
      total_amount: Number(o.DocTotal || 0),
      currency: o.DocCur || '',
    })),
  };
};

// ── single sales order ────────────────────────────────────────────────────────

const resolveSalesOrderDocEntry = async (identifier) => {
  const normalizedIdentifier = Number(identifier);
  if (!Number.isFinite(normalizedIdentifier)) {
    throw new Error(`Invalid Sales Order identifier: ${identifier}`);
  }

  const rows = await safe(db.query(`
    SELECT TOP 1 DocEntry, DocNum
    FROM ORDR
    WHERE DocEntry = @DocEntry
       OR DocNum = @DocNum
    ORDER BY CASE WHEN DocEntry = @DocEntry THEN 0 ELSE 1 END, DocEntry
  `, {
    DocEntry: normalizedIdentifier,
    DocNum: normalizedIdentifier,
  }));

  return rows[0] || null;
};

const getSalesOrder = async (docEntry) => {
  const resolvedDocument = await resolveSalesOrderDocEntry(docEntry);
  if (!resolvedDocument) {
    throw new Error(`Sales Order ${docEntry} not found`);
  }

  const resolvedDocEntry = resolvedDocument.DocEntry;

  // ✅ Get complete header and line data with Place of Supply and HSN Code
  let rows = await safe(db.query(`
   SELECT 
    -- 🔹 HEADER
    T0.DocEntry,
    T0.DocNum,
    T0.CardCode,
    T0.CardName,
    T0.DocDate,
    T0.DocDueDate,
    T0.TaxDate,
    T0.DocStatus,
    T0.NumAtCard,
    T0.Comments AS Remarks,
    T0.DocTotal,
    T0.DocCur,
    T0.CntctCode,
    T0.BPLId,
    T0.GroupNum,
    T0.ShipToCode,
    T0.PayToCode,
    T0.Address,
    T0.Address2,
    T0.TrnspCode,
    T0.Confirmed,
    T0.JrnlMemo,
    T0.Series,
    T0.DiscPrcnt,

    -- 🔹 SALES EMPLOYEE
    T0.SlpCode,
    SLP.SlpName AS SalesEmployeeName,

    -- 🔹 OWNER
    T0.OwnerCode,
    CASE 
      WHEN EMP.empID IS NOT NULL 
      THEN EMP.firstName + ' ' + ISNULL(EMP.lastName,'')
      ELSE NULL
    END AS OwnerName,

    -- 🔹 FINANCIALS
    T0.TotalExpns AS Freight,
    T0.VatSum AS TaxAmount,

    -- 🔹 PLACE OF SUPPLY (NO DUPLICATE FIXED)
    ST.Name AS PlaceOfSupply,

    -- 🔹 LINE DATA
    T1.LineNum,
    T1.ItemCode,
    T1.Dscription,
    T1.Quantity,
    T1.Price,
    T1.DiscPrcnt AS LineDiscPrcnt,
    T1.TaxCode AS TaxCode,
    T1.WhsCode,
    T1.unitMsr AS UomCode,
    T1.OcrCode AS DistributionRule,
    T1.FreeTxt AS [FreeText],
    T1.CountryOrg AS CountryOfOrigin,
    T1.OpenQty AS OpenQuantity,
    CAST((ISNULL(T1.Quantity, 0) - ISNULL(T1.OpenQty, 0)) AS DECIMAL(19, 6)) AS DeliveredQuantity,
    ISNULL(T1.VatSum, 0) AS LineTaxAmount,
    T1.LineTotal,
    T1.U_SPLRBT AS SpecialRebate,
    T1.U_COMPRC AS Commission,
    T1.U_S_BrokPerQty AS SellerBrokeragePerQty,
    T1.U_Unit_Price AS UnitPriceUdf,
    T1.U_Brok_Seller AS SellerBrokerage,
    T1.U_Brok_Buyer AS BuyerBrokerage,
    T1.U_Buyer_Delivery AS BuyerDelivery,
    T1.U_Seller_Delivery AS SellerDelivery,
    T1.U_Buyer_Payment_Terms AS BuyerPaymentTerms,
    T1.U_Buyer_Quality AS BuyerQuality,
    T1.U_Seller_Quality AS SellerQuality,
    T1.U_Buyer_Price AS BuyerPrice,
    T1.U_Seller_Price AS SellerPrice,
    T1.U_Buyer_SPINS AS BuyerSpecialInstruction,
    T1.U_Seller_SPINS AS SellerSpecialInstruction,
    T1.U_Sel_Brok_AP AS SellerBrokerageAmtPer,
    T1.U_Seller_Brok_Per AS SellerBrokeragePercent,
    T1.U_Buyer_Bill_Disc AS BuyerBillDiscount,
    T1.U_Seller_Bill_Disc AS SellerBillDiscount,
    T1.U_SELLTCODE AS STCODE,
    T1.U_S_Item AS SellerItem,
    T1.U_S_Qty AS SellerQty,
    T1.U_Freight_pur AS FreightPurchase,
    T1.U_Freight_sales AS FreightSales,
    T1.U_Fr_trans AS FreightProvider,
    T1.U_Fr_trans_name AS FreightProviderName,
    T1.U_BDNum AS BrokerageNumber,

    -- 🔹 HSN
    CHP.ChapterID AS HSNCode

FROM ORDR T0

-- ✅ LINES (KEEP INNER JOIN if lines must exist)
INNER JOIN RDR1 T1 ON T0.DocEntry = T1.DocEntry

-- ✅ SALES EMPLOYEE
LEFT JOIN OSLP SLP ON SLP.SlpCode = T0.SlpCode

-- ✅ OWNER
LEFT JOIN OHEM EMP ON EMP.empID = T0.OwnerCode

-- ✅ ADDRESS FIX (NO DUPLICATE ISSUE)
OUTER APPLY (
    SELECT TOP 1 C.State, C.Country
    FROM CRD1 C
    WHERE C.CardCode = T0.CardCode
      AND C.Address = T0.ShipToCode
      AND C.AdresType = 'S'
) C

LEFT JOIN OCST ST 
    ON ST.Code = C.State 
   AND ST.Country = C.Country

-- ✅ HSN
LEFT JOIN OITM ITM ON ITM.ItemCode = T1.ItemCode
LEFT JOIN OCHP CHP ON CHP.AbsEntry = ITM.ChapterID

WHERE T0.DocEntry = @DocEntry

ORDER BY T1.LineNum
  `, { DocEntry: resolvedDocEntry }));

  console.log('🔍 [Backend] Query returned', rows.length, 'rows for requested identifier', docEntry, 'resolved DocEntry', resolvedDocEntry);

  if (!rows.length) {
    throw new Error(`Sales Order ${docEntry} not found`);
  }

  const header = rows[0];  // Header data is same in all rows
  const placeOfSupply = header.PlaceOfSupply || '';

  // ✅ Try to get header UDFs if they exist
  let headerUdfs = {};
  try {
    const udfRows = await db.query(`
      SELECT U_LoadPortRemark, U_InspectionReq, U_SupplierRefDate, U_PaymentAdvice
      FROM   ORDR
      WHERE  DocEntry = @DocEntry
    `, { DocEntry: resolvedDocEntry });
    if (udfRows.recordset && udfRows.recordset.length > 0) {
      const udf = udfRows.recordset[0];
      headerUdfs = {
        U_LoadPortRemark: udf.U_LoadPortRemark || '',
        U_InspectionReq: udf.U_InspectionReq || 'No',
        U_SupplierRefDate: udf.U_SupplierRefDate ? udf.U_SupplierRefDate.toISOString().split('T')[0] : '',
        U_PaymentAdvice: udf.U_PaymentAdvice || '',
      };
    }
  } catch (err) {
    // Header UDF fields don't exist, skip them
  }

  // Use line data from the main joined query (rows already contains all lines)
  const lineRows = rows;

  // ✅ Try to get line UDFs if they exist
  let lineUdfs = {};
  try {
    const udfLineRows = await db.query(`
      SELECT
        LineNum,
        U_Brand,
        U_Origin,
        U_PackSize,
        U_QcStatus,
        U_SPLRBT,
        U_COMPRC,
        U_S_BrokPerQty,
        U_Unit_Price,
        U_Brok_Seller,
        U_Brok_Buyer,
        U_Buyer_Delivery,
        U_Seller_Delivery,
        U_Buyer_Payment_Terms,
        U_Buyer_Quality,
        U_Seller_Quality,
        U_Buyer_Price,
        U_Seller_Price,
        U_Buyer_SPINS,
        U_Seller_SPINS,
        U_Sel_Brok_AP,
        U_Seller_Brok_Per,
        U_Buyer_Bill_Disc,
        U_Seller_Bill_Disc,
        U_SELLTCODE,
        U_S_Item,
        U_S_Qty,
        U_Freight_pur,
        U_Freight_sales,
        U_Fr_trans,
        U_Fr_trans_name,
        U_BDNum
      FROM   RDR1
      WHERE  DocEntry = @DocEntry
    `, { DocEntry: resolvedDocEntry });
    if (udfLineRows.recordset) {
      udfLineRows.recordset.forEach(row => {
        lineUdfs[row.LineNum] = {
          U_Brand: row.U_Brand || '',
          U_Origin: row.U_Origin || '',
          U_PackSize: row.U_PackSize || '',
          U_QcStatus: row.U_QcStatus || 'Pending',
          U_SPLRBT: row.U_SPLRBT ?? '',
          U_COMPRC: row.U_COMPRC ?? '',
          U_S_BrokPerQty: row.U_S_BrokPerQty ?? '',
          U_Unit_Price: row.U_Unit_Price ?? '',
          U_Brok_Seller: row.U_Brok_Seller ?? '',
          U_Brok_Buyer: row.U_Brok_Buyer ?? '',
          U_Buyer_Delivery: row.U_Buyer_Delivery || '',
          U_Seller_Delivery: row.U_Seller_Delivery || '',
          U_Buyer_Payment_Terms: row.U_Buyer_Payment_Terms || '',
          U_Buyer_Quality: row.U_Buyer_Quality || '',
          U_Seller_Quality: row.U_Seller_Quality || '',
          U_Buyer_Price: row.U_Buyer_Price || '',
          U_Seller_Price: row.U_Seller_Price || '',
          U_Buyer_SPINS: row.U_Buyer_SPINS || '',
          U_Seller_SPINS: row.U_Seller_SPINS || '',
          U_Sel_Brok_AP: row.U_Sel_Brok_AP || '',
          U_Seller_Brok_Per: row.U_Seller_Brok_Per ?? '',
          U_Buyer_Bill_Disc: row.U_Buyer_Bill_Disc ?? '',
          U_Seller_Bill_Disc: row.U_Seller_Bill_Disc ?? '',
          U_SELLTCODE: row.U_SELLTCODE || '',
          U_S_Item: row.U_S_Item || '',
          U_S_Qty: row.U_S_Qty ?? '',
          U_Freight_pur: row.U_Freight_pur ?? '',
          U_Freight_sales: row.U_Freight_sales ?? '',
          U_Fr_trans: row.U_Fr_trans || '',
          U_Fr_trans_name: row.U_Fr_trans_name || '',
          U_BDNum: row.U_BDNum || '',
        };
      });
    }
  } catch (err) {
    // Line UDF fields don't exist, skip them
  }

  // ✅ Get batch numbers for each line (if any)
  const batchRows = await safe(db.query(`
    SELECT BaseLineNum, BatchNum, Quantity
    FROM   IBT1
    WHERE  BaseEntry = @DocEntry
      AND  BaseType = 17
    ORDER  BY BaseLineNum, BatchNum
  `, { DocEntry: resolvedDocEntry }));

  // Group batches by line number
  const batchesByLine = {};
  batchRows.forEach(b => {
    if (!batchesByLine[b.BaseLineNum]) {
      batchesByLine[b.BaseLineNum] = [];
    }
    batchesByLine[b.BaseLineNum].push({
      batchNumber: b.BatchNum || '',
      quantity: String(b.Quantity || 0),
      expiryDate: '', // ExpDate column doesn't exist in IBT1
    });
  });

  const result = {
    sales_order: {
      doc_entry: header.DocEntry,
      doc_num: header.DocNum,
      header: {
        customerCode: header.CardCode,
        customerName: header.CardName,
        contactPerson: String(header.CntctCode || ''),
        branch: String(header.BPLId || ''),
        series: String(header.Series || ''),
        placeOfSupply: placeOfSupply,
        postingDate: header.DocDate ? header.DocDate.toISOString().split('T')[0] : '',
        deliveryDate: header.DocDueDate ? header.DocDueDate.toISOString().split('T')[0] : '',
        documentDate: header.TaxDate ? header.TaxDate.toISOString().split('T')[0] : '',
        customerRefNo: header.NumAtCard || '',
        remarks: header.Comments || '',
        otherInstruction: header.Comments || '',  // Map Comments to otherInstruction for frontend
        docNum: header.DocNum,
        status: header.DocStatus === 'O' ? 'Open' : header.DocStatus === 'C' ? 'Closed' : 'Unknown',
        paymentTerms: String(header.GroupNum || ''),
        salesEmployee: String(header.SlpCode || ''),
        purchaser: header.SalesEmployeeName || '',  // Return name for frontend
        owner: header.OwnerName || '',  // Return owner name
        freight: String(header.Freight || ''),  // Use Freight (mapped from TotalExpns)
        shipToCode: header.ShipToCode || '',
        payToCode: header.PayToCode || '',
        shipTo: header.Address || '',
        payTo: header.Address2 || '',
        shippingType: String(header.TrnspCode || ''),
        confirmed: header.Confirmed === 'Y',
        journalRemark: header.JrnlMemo || '',
        discount: String(header.DiscPrcnt || ''),
        tax: '', // Tax is calculated, not stored
        currency: header.DocCur || 'INR',
      },
      header_udfs: headerUdfs,
      lines: lineRows.map(line => {
        const lineUdf = lineUdfs[line.LineNum] || {};
        // Get HSN Code from the joined query
        const hsnCode = line.HSNCode || '';
        
        console.log('🔍 [Backend] Processing line:', line.LineNum, 'Item:', line.ItemCode, 'HSN:', hsnCode);
        
        return {
          lineNum: line.LineNum != null ? Number(line.LineNum) : undefined,
          itemNo: line.ItemCode,
          itemDescription: line.Dscription || '',
          hsnCode: hsnCode,
          quantity: String(line.Quantity || 0),
          unitPrice: String(line.Price || 0),
          unitPriceUdf: lineUdf.U_Unit_Price != null && lineUdf.U_Unit_Price !== '' ? String(lineUdf.U_Unit_Price) : (line.UnitPriceUdf != null && line.UnitPriceUdf !== '' ? String(line.UnitPriceUdf) : String(line.Price || 0)),
          sellerQuality: lineUdf.U_Seller_Quality || line.SellerQuality || '',
          buyerQuality: lineUdf.U_Buyer_Quality || line.BuyerQuality || '',
          sellerPrice: lineUdf.U_Seller_Price || line.SellerPrice || '',
          buyerPrice: lineUdf.U_Buyer_Price || line.BuyerPrice || '',
          sellerDelivery: lineUdf.U_Seller_Delivery || line.SellerDelivery || '',
          buyerDelivery: lineUdf.U_Buyer_Delivery || line.BuyerDelivery || '',
          sellerBrokerageAmtPer: lineUdf.U_Sel_Brok_AP || line.SellerBrokerageAmtPer || '',
          sellerBrokeragePercent: lineUdf.U_Seller_Brok_Per != null ? String(lineUdf.U_Seller_Brok_Per) : (line.SellerBrokeragePercent != null ? String(line.SellerBrokeragePercent) : ''),
          sellerBrokerage: lineUdf.U_Brok_Seller != null ? String(lineUdf.U_Brok_Seller) : (line.SellerBrokerage != null ? String(line.SellerBrokerage) : ''),
          buyerBrokerage: lineUdf.U_Brok_Buyer != null ? String(lineUdf.U_Brok_Buyer) : (line.BuyerBrokerage != null ? String(line.BuyerBrokerage) : ''),
          stcode: lineUdf.U_SELLTCODE || line.TaxCode || '',
          specialRebate: lineUdf.U_SPLRBT != null ? String(lineUdf.U_SPLRBT) : (line.SpecialRebate != null ? String(line.SpecialRebate) : ''),
          commission: lineUdf.U_COMPRC != null ? String(lineUdf.U_COMPRC) : (line.Commission != null ? String(line.Commission) : ''),
          sellerBrokeragePerQty: lineUdf.U_S_BrokPerQty != null ? String(lineUdf.U_S_BrokPerQty) : (line.SellerBrokeragePerQty != null ? String(line.SellerBrokeragePerQty) : ''),
          buyerPaymentTerms: lineUdf.U_Buyer_Payment_Terms || line.BuyerPaymentTerms || '',
          buyerSpecialInstruction: lineUdf.U_Buyer_SPINS || line.BuyerSpecialInstruction || '',
          sellerSpecialInstruction: lineUdf.U_Seller_SPINS || line.SellerSpecialInstruction || '',
          buyerBillDiscount: lineUdf.U_Buyer_Bill_Disc != null ? String(lineUdf.U_Buyer_Bill_Disc) : (line.BuyerBillDiscount != null ? String(line.BuyerBillDiscount) : ''),
          sellerBillDiscount: lineUdf.U_Seller_Bill_Disc != null ? String(lineUdf.U_Seller_Bill_Disc) : (line.SellerBillDiscount != null ? String(line.SellerBillDiscount) : ''),
          sellerItem: lineUdf.U_S_Item || line.SellerItem || '',
          sellerQty: lineUdf.U_S_Qty != null ? String(lineUdf.U_S_Qty) : (line.SellerQty != null ? String(line.SellerQty) : ''),
          freightPurchase: lineUdf.U_Freight_pur != null ? String(lineUdf.U_Freight_pur) : (line.FreightPurchase != null ? String(line.FreightPurchase) : ''),
          freightSales: lineUdf.U_Freight_sales != null ? String(lineUdf.U_Freight_sales) : (line.FreightSales != null ? String(line.FreightSales) : ''),
          freightProvider: lineUdf.U_Fr_trans || line.FreightProvider || '',
          freightProviderName: lineUdf.U_Fr_trans_name || line.FreightProviderName || '',
          brokerageNumber: lineUdf.U_BDNum || line.BrokerageNumber || '',
          uomCode: line.UomCode || '',
          stdDiscount: String(line.LineDiscPrcnt || ''),
          taxCode: line.TaxCode || '',
          total: String(line.LineTotal || 0),
          taxAmount: String(line.LineTaxAmount || 0),
          whse: line.WhsCode || '',
          distRule: line.DistributionRule || '',
          freeText: line.FreeText || '',
          countryOfOrigin: line.CountryOfOrigin || '',
          openQty: line.OpenQuantity != null ? String(line.OpenQuantity) : '',
          deliveredQty: line.DeliveredQuantity != null ? String(line.DeliveredQuantity) : '',
          batches: batchesByLine[line.LineNum] || [],
          udf: {
            U_Brand: lineUdf.U_Brand || '',
            U_Origin: lineUdf.U_Origin || '',
            U_PackSize: lineUdf.U_PackSize || '',
            U_QcStatus: lineUdf.U_QcStatus || 'Pending',
            U_SPLRBT: lineUdf.U_SPLRBT ?? '',
            U_COMPRC: lineUdf.U_COMPRC ?? '',
            U_S_BrokPerQty: lineUdf.U_S_BrokPerQty ?? '',
            U_Unit_Price: lineUdf.U_Unit_Price ?? '',
            U_Brok_Seller: lineUdf.U_Brok_Seller ?? '',
            U_Brok_Buyer: lineUdf.U_Brok_Buyer ?? '',
            U_Buyer_Delivery: lineUdf.U_Buyer_Delivery || '',
            U_Seller_Delivery: lineUdf.U_Seller_Delivery || '',
            U_Buyer_Payment_Terms: lineUdf.U_Buyer_Payment_Terms || '',
            U_Buyer_Quality: lineUdf.U_Buyer_Quality || '',
            U_Seller_Quality: lineUdf.U_Seller_Quality || '',
            U_Buyer_Price: lineUdf.U_Buyer_Price || '',
            U_Seller_Price: lineUdf.U_Seller_Price || '',
            U_Buyer_SPINS: lineUdf.U_Buyer_SPINS || '',
            U_Seller_SPINS: lineUdf.U_Seller_SPINS || '',
            U_Sel_Brok_AP: lineUdf.U_Sel_Brok_AP || '',
            U_Seller_Brok_Per: lineUdf.U_Seller_Brok_Per ?? '',
            U_Buyer_Bill_Disc: lineUdf.U_Buyer_Bill_Disc ?? '',
            U_Seller_Bill_Disc: lineUdf.U_Seller_Bill_Disc ?? '',
            U_SELLTCODE: lineUdf.U_SELLTCODE || '',
            U_S_Item: lineUdf.U_S_Item || '',
            U_S_Qty: lineUdf.U_S_Qty ?? '',
            U_Freight_pur: lineUdf.U_Freight_pur ?? '',
            U_Freight_sales: lineUdf.U_Freight_sales ?? '',
            U_Fr_trans: lineUdf.U_Fr_trans || '',
            U_Fr_trans_name: lineUdf.U_Fr_trans_name || '',
            U_BDNum: lineUdf.U_BDNum || '',
          },
        };
      }),
    },
  };
  
  console.log('🔍 [Backend] Returning header fields:');
  console.log('  - salesEmployee (SlpCode):', result.sales_order.header.salesEmployee);
  console.log('  - purchaser (SlpName):', result.sales_order.header.purchaser);
  console.log('  - owner (OwnerName):', result.sales_order.header.owner);
  console.log('  - freight:', result.sales_order.header.freight);
  console.log('  - remarks:', result.sales_order.header.remarks);
  console.log('  - otherInstruction:', result.sales_order.header.otherInstruction);
  
  return result;
};

// ── OPEN SALES ORDERS (FOR COPY FROM) ────────────────────────────────────────

const getOpenSalesOrders = () => safe(db.query(`
  SELECT TOP 200
    T0.DocEntry,
    T0.DocNum,
    T0.DocDate,
    T0.DocDueDate,
    T0.CardCode,
    T0.CardName,
    T0.Comments,
    T0.DocTotal
  FROM ORDR T0
  WHERE T0.DocStatus = 'O'
    AND T0.CANCELED <> 'Y'
  ORDER BY T0.DocDate DESC, T0.DocNum DESC
`));

const getSalesOrderForCopy = async (docEntry) => {
  const headerResult = await db.query(`
    SELECT
      T0.DocEntry, T0.DocNum, T0.DocDate, T0.DocDueDate, T0.TaxDate,
      T0.CardCode, T0.CardName, T0.CntctCode,
      T0.NumAtCard, T0.Comments,
      T0.BPLId, T0.BPL_IDAssignedToInvoice,
      T0.GroupNum, T0.SlpCode,
      T0.DiscPrcnt, T0.TotalExpns AS Freight
    FROM ORDR T0
    WHERE T0.DocEntry = @DocEntry
  `, { DocEntry: docEntry });

  const linesResult = await db.query(`
    SELECT
      T0.LineNum, T0.ItemCode,
      T0.Dscription AS ItemDescription,
      T0.OpenQty AS Quantity,
      T0.Price AS UnitPrice,
      T0.DiscPrcnt AS DiscountPercent,
      T0.WhsCode AS WarehouseCode,
      T0.TaxCode, T0.unitMsr AS UomCode,
      T0.OcrCode AS DistributionRule,
      T0.FreeTxt AS FreeText,
      T0.CountryOrg AS CountryOfOrigin,
      T0.OpenQty AS OpenQty,
      CAST((ISNULL(T0.Quantity, 0) - ISNULL(T0.OpenQty, 0)) AS DECIMAL(19, 6)) AS DeliveredQty,
      ISNULL(T0.VatSum, 0) AS TaxAmount,
      CHP.ChapterID AS HSNCode,
      T0.DocEntry AS BaseEntry,
      T0.LineNum AS BaseLine,
      17 AS BaseType,
      T0.U_SPLRBT AS SpecialRebate,
      T0.U_COMPRC AS Commission,
      T0.U_S_BrokPerQty AS SellerBrokeragePerQty,
      T0.U_Unit_Price AS UnitPriceUdf,
      T0.U_Brok_Seller AS SellerBrokerage,
      T0.U_Brok_Buyer AS BuyerBrokerage,
      T0.U_Buyer_Delivery AS BuyerDelivery,
      T0.U_Seller_Delivery AS SellerDelivery,
      T0.U_Buyer_Payment_Terms AS BuyerPaymentTerms,
      T0.U_Buyer_Quality AS BuyerQuality,
      T0.U_Seller_Quality AS SellerQuality,
      T0.U_Buyer_Price AS BuyerPrice,
      T0.U_Seller_Price AS SellerPrice,
      T0.U_Buyer_SPINS AS BuyerSpecialInstruction,
      T0.U_Seller_SPINS AS SellerSpecialInstruction,
      T0.U_Sel_Brok_AP AS SellerBrokerageAmtPer,
      T0.U_Seller_Brok_Per AS SellerBrokeragePercent,
      T0.U_Buyer_Bill_Disc AS BuyerBillDiscount,
      T0.U_Seller_Bill_Disc AS SellerBillDiscount,
      T0.U_SELLTCODE AS STCODE,
      T0.U_S_Item AS SellerItem,
      T0.U_S_Qty AS SellerQty,
      T0.U_Freight_pur AS FreightPurchase,
      T0.U_Freight_sales AS FreightSales,
      T0.U_Fr_trans AS FreightProvider,
      T0.U_Fr_trans_name AS FreightProviderName,
      T0.U_BDNum AS BrokerageNumber
    FROM RDR1 T0
    LEFT JOIN OITM ITM ON T0.ItemCode = ITM.ItemCode
    LEFT JOIN OCHP CHP ON ITM.ChapterID = CHP.AbsEntry
    WHERE T0.DocEntry = @DocEntry
      AND T0.LineStatus = 'O'
      AND T0.OpenQty > 0
    ORDER BY T0.LineNum
  `, { DocEntry: docEntry });

  const header = headerResult.recordset?.[0] || {};
  return { ...header, DocumentLines: linesResult.recordset || [] };
};

module.exports = {
  getReferenceData,
  getCustomerDetails,
  getItemDetails,
  getSalesOrderLineFieldMetadata,
  resolveSalesOrderLineUomEntry,
  getLookupValues,
  createLookupValue,
  getSalesOrderList,
  getSalesOrder,
  getDocumentSeries,
  getNextNumber,
  getStateFromAddress,
  getItemsForModal,
  getFreightCharges,
  getOpenSalesOrders,
  getSalesOrderForCopy,
};
