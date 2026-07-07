const db = require('../db/odbc');

const normalizeGroupType = (type = '') => {
  const normalized = String(type || '').trim().toLowerCase();
  if (['all', '*'].includes(normalized)) return '';
  if (['vendor', 'vendors', 'supplier', 'suppliers', 's'].includes(normalized)) return 'S';
  if (['customer', 'customers', 'lead', 'leads', 'c', 'l'].includes(normalized)) return 'C';
  return 'C';
};

const getBusinessPartnerGroups = async (query = '', typeOrOptions = {}, maybeOptions = {}) => {
  const type = typeof typeOrOptions === 'string' ? normalizeGroupType(typeOrOptions) : '';
  const options = typeof typeOrOptions === 'string' ? maybeOptions : typeOrOptions;
  const trimmed = String(query || '').trim();
  const result = await db.query(
    `
      SELECT TOP 200
        GroupCode,
        GroupName
      FROM OCRG
      WHERE (@type = '' OR GroupType = @type)
        AND (
          @query = ''
          OR CAST(GroupCode AS NVARCHAR(50)) LIKE @like
          OR GroupName LIKE @like
        )
      ORDER BY GroupName, GroupCode
    `,
    {
      query: trimmed,
      like: `%${trimmed}%`,
      type,
    },
    options,
  );

  const rows = (result.recordset || []).map((row) => ({
    code: String(row.GroupCode ?? ''),
    name: String(row.GroupName || '').trim(),
  }));

  if (!trimmed) {
    rows.push({
      code: '',
      name: 'All',
    });
  }

  return rows;
};

const getBusinessPartnerProperties = async (options = {}) => {
  const result = await db.query(
    `
      SELECT GroupCode AS number, ISNULL(GroupName, '') AS name
      FROM OCQG
      ORDER BY GroupCode
    `,
    {},
    options,
  );

  return (result.recordset || []).map((row, index) => ({
    number: Number(row.number || index + 1),
    name: String(row.name || `Business Partners Property ${index + 1}`).trim(),
  }));
};

module.exports = {
  getBusinessPartnerGroups,
  getBusinessPartnerProperties,
};
