const axios = require('axios');
const https = require('https');
const env = require('../config/env');

const reportClient = axios.create({
  baseURL: env.reportServiceBaseUrl,
  timeout: env.reportServiceTimeoutMs,
  responseType: 'text',
  headers: {
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: env.reportServiceRejectUnauthorized,
  }),
});

let reportSessionCookie = '';
let reportSessionExpiresAt = 0;

const stripPdfPrefix = (value) =>
  String(value || '')
    .trim()
    .replace(/^data:application\/pdf;base64,/i, '')
    .replace(/\s+/g, '');

const extractCookieHeader = (cookieHeader) => {
  if (!Array.isArray(cookieHeader)) {
    return '';
  }

  return cookieHeader
    .map((cookie) => String(cookie).split(';')[0])
    .filter(Boolean)
    .join('; ');
};

const normalizeStringPayload = (value) => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return stripPdfPrefix(JSON.parse(trimmed));
    } catch (_error) {
      return stripPdfPrefix(trimmed.slice(1, -1));
    }
  }

  return stripPdfPrefix(trimmed);
};

const extractBase64Pdf = (payload) => {
  if (typeof payload === 'string') {
    return normalizeStringPayload(payload);
  }

  if (!payload) {
    return '';
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const result = extractBase64Pdf(entry);
      if (result) {
        return result;
      }
    }

    return '';
  }

  if (typeof payload === 'object') {
    const preferredKeys = ['base64Pdf', 'Base64Pdf', 'pdfBase64', 'PDFData', 'data', 'value'];

    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const result = extractBase64Pdf(payload[key]);
        if (result) {
          return result;
        }
      }
    }

    for (const value of Object.values(payload)) {
      const result = extractBase64Pdf(value);
      if (result) {
        return result;
      }
    }
  }

  return '';
};

const isKnownUnsupportedLayoutMessage = (value) =>
  /^ThereisnodefaultCrystalReportlayoutrelatedto/i.test(String(value || '').trim());

const ensureReportLoginConfig = () => {
  if (
    !env.reportServiceBaseUrl ||
    !env.reportServiceUsername ||
    !env.reportServicePassword ||
    !env.reportServiceCompanyDb
  ) {
    const error = new Error('Missing SAP Report Service login configuration. Check backend/.env.');
    error.statusCode = 500;
    throw error;
  }
};

const loginToReportService = async () => {
  ensureReportLoginConfig();

  const response = await reportClient.post('/login', {
    CompanyDB: env.reportServiceCompanyDb,
    UserName: env.reportServiceUsername,
    Password: env.reportServicePassword,
  });

  const sessionCookie = extractCookieHeader(response.headers['set-cookie']);

  if (!sessionCookie) {
    const error = new Error('SAP Report Service login did not return a session cookie.');
    error.statusCode = 502;
    throw error;
  }

  const sessionTimeoutMinutes = Number(response.data?.SessionTimeout);
  const ttlMinutes = Number.isFinite(sessionTimeoutMinutes) && sessionTimeoutMinutes > 0
    ? sessionTimeoutMinutes
    : 30;

  reportSessionCookie = sessionCookie;
  reportSessionExpiresAt = Date.now() + Math.max(ttlMinutes - 1, 1) * 60 * 1000;

  return reportSessionCookie;
};

const ensureReportSession = async () => {
  if (!reportSessionCookie || Date.now() >= reportSessionExpiresAt) {
    await loginToReportService();
  }
};

const toRequiredString = (value, fieldName) => {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    const error = new Error(`${fieldName} is required.`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const buildFileName = ({ docEntry, docCode }) => `sales-order-${docEntry}-${docCode}.pdf`;

const exportSalesOrderPdf = async ({ docEntry, schema, docCode } = {}, retryOnAuth = true) => {
  const normalizedDocEntry = toRequiredString(docEntry, 'DocEntry');
  const normalizedSchema = toRequiredString(schema || env.reportServiceDefaultSchema, 'Schema');
  const normalizedDocCode = toRequiredString(docCode || env.reportServiceDefaultDocCode, 'DocCode');

  const payload = [
    {
      name: 'Dockey@',
      type: 'xsd:number',
      value: [[normalizedDocEntry]],
    },
    {
      name: 'Schema@',
      type: 'xsd:string',
      value: [[normalizedSchema]],
    },
  ];

  await ensureReportSession();

  let response;

  try {
    response = await reportClient.post('/rs/v1/ExportPDFData', payload, {
      params: {
        DocCode: normalizedDocCode,
      },
      headers: {
        Cookie: reportSessionCookie,
      },
    });
  } catch (error) {
    if (retryOnAuth && error.response?.status === 401) {
      reportSessionCookie = '';
      reportSessionExpiresAt = 0;
      await loginToReportService();
      return exportSalesOrderPdf({ docEntry, schema, docCode }, false);
    }

    throw error;
  }

  const base64Pdf = extractBase64Pdf(response.data);

  if (!base64Pdf) {
    const error = new Error('SAP Report Service returned an empty PDF response.');
    error.statusCode = 502;
    throw error;
  }

  if (isKnownUnsupportedLayoutMessage(base64Pdf)) {
    const error = new Error(`Layout ${normalizedDocCode} is not exportable through the Crystal Report PDF API.`);
    error.statusCode = 422;
    throw error;
  }

  return {
    message: 'Sales order PDF generated successfully.',
    base64Pdf,
    mimeType: 'application/pdf',
    fileName: buildFileName({
      docEntry: normalizedDocEntry,
      docCode: normalizedDocCode,
    }),
    docEntry: normalizedDocEntry,
    docCode: normalizedDocCode,
    schema: normalizedSchema,
  };
};

module.exports = {
  exportSalesOrderPdf,
};
