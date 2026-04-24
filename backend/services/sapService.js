/**
 * SAP Business One Service Layer integration service
 */
const axios = require('axios');
const https = require('https');
const env   = require('../config/env');

const httpsAgent = new https.Agent({
  rejectUnauthorized: env.sapRejectUnauthorized,
});

let sessionCookie   = '';
let sessionActive   = false;
let sessionExpireAt = 0;          // epoch ms — SAP B1 sessions last ~30 min by default

const SESSION_TTL_MS = 25 * 60 * 1000; // 25 minutes (safe margin under 30)

const buildUrl = (path) => {
  // SAP B1 v1 requires OData $ operators URL-encoded as %24.
  // We fully encode the query string here; axios must not re-encode it.
  const qIdx = path.indexOf('?');
  if (qIdx === -1) return `${env.sapBaseUrl}${path}`;
  const base = path.slice(0, qIdx);
  const qs   = path.slice(qIdx + 1);
  // Encode spaces and single-quotes in values, replace $ with %24
  const encodedQs = qs
    .replace(/\$/g, '%24')
    .replace(/ /g, '%20')
    .replace(/'/g, '%27');
  return `${env.sapBaseUrl}${base}?${encodedQs}`;
};

const extractCookie = (header) => {
  if (!Array.isArray(header)) return header || '';
  return header.map((c) => String(c).split(';')[0]).filter(Boolean).join('; ');
};

// ── Auth ──────────────────────────────────────────────────────────────────────

const login = async () => {
  if (!env.sapBaseUrl || !env.sapUsername || !env.sapPassword || !env.sapCompanyDb) {
    throw new Error('Missing SAP configuration. Check backend/.env.');
  }
  const response = await axios.post(
    buildUrl('/Login'),
    { UserName: env.sapUsername, Password: env.sapPassword, CompanyDB: env.sapCompanyDb },
    { httpsAgent }
  );
  sessionCookie   = extractCookie(response.headers['set-cookie']);
  sessionActive   = true;
  sessionExpireAt = Date.now() + SESSION_TTL_MS;
  console.log('[SAP] Session established');
  return sessionCookie;
};

// No more ping — just check if we have a cookie and it hasn't expired by time
const ensureSession = async () => {
  if (!sessionActive || !sessionCookie || Date.now() >= sessionExpireAt) {
    await login();
  }
};

// ── Generic request (auto-retry on 401/403) ───────────────────────────────────
// Uses Node https directly so the pre-encoded URL is never re-processed by axios.
const { URL } = require('url');

const rawRequest = (method, fullUrl, headers, body) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(fullUrl);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 443,
      path:     parsed.pathname + parsed.search,
      method:   method.toUpperCase(),
      headers:  { 'Content-Type': 'application/json', ...headers },
      rejectUnauthorized: env.sapRejectUnauthorized,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const err = new Error(`SAP ${res.statusCode}`);
          try { err.response = { status: res.statusCode, data: JSON.parse(data) }; }
          catch { err.response = { status: res.statusCode, data }; }
          return reject(err);
        }
        try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

const request = async (config, retryOnAuth = true) => {
  await ensureSession();
  try {
    const result = await rawRequest(
      config.method || 'get',
      buildUrl(config.url),
      { Cookie: sessionCookie, ...(config.headers || {}) },
      config.data || null,
    );
    return result;
  } catch (error) {
    if (retryOnAuth && [401, 403].includes(error.response?.status)) {
      console.log('[SAP] Auth error — re-logging in');
      sessionActive = false;
      await login();
      return request(config, false);
    }
    throw error;
  }
};

// ── Items ─────────────────────────────────────────────────────────────────────

const createItem = async (data) => {
  const res = await request({ method: 'POST', url: '/Items', data });
  return res.data;
};

const getItem = async (itemCode) => {
  // SAP B1 v2 returns all sub-collections inline — no $expand needed
  const res = await request({ method: 'GET', url: `/Items('${encodeURIComponent(itemCode)}')` });
  return res.data;
};

const updateItem = async (itemCode, data) => {
  await request({ method: 'PATCH', url: `/Items('${encodeURIComponent(itemCode)}')`, data });
  return getItem(itemCode);
};

const searchItems = async (query = '', top = 50, skip = 0) => {
  const filter = query
    ? `&$filter=contains(ItemCode,'${query}') or contains(ItemName,'${query}')`
    : '';
  const res = await request({
    method: 'GET',
    url: `/Items?$select=ItemCode,ItemName,ForeignName,ItemsGroupCode,InventoryItem,SalesItem,PurchaseItem,AssetItem,Valid,Frozen,ItemType,ItemClass&$top=${top}&$skip=${skip}${filter}`,
  });
  return res.data.value || [];
};

// ── Lookups ───────────────────────────────────────────────────────────────────

const getItemGroups = async () => {
  const res = await request({ method: 'GET', url: '/ItemGroups?$select=Number,GroupName' });
  return res.data.value || [];
};

const getPriceLists = async () => {
  const res = await request({ method: 'GET', url: '/PriceLists?$select=PriceListNo,PriceListName' });
  return res.data.value || [];
};

// Generic POST for any SAP entity (BusinessPartners, etc.)
const createItem_generic = async (endpoint, data) => {
  const res = await request({ method: 'POST', url: endpoint, data });
  return res.data;
};

module.exports = {
  login,
  ensureSession,
  request,
  createItem,
  createItem_generic,
  getItem,
  updateItem,
  searchItems,
  getItemGroups,
  getPriceLists,
};
