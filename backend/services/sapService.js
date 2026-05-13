/**
 * SAP Business One Service Layer integration service
 */
const axios = require('axios');
const https = require('https');
const { URL } = require('url');
const env = require('../config/env');
const authDbService = require('./authDbService');
const { getRequestContext } = require('./requestContextService');

const httpsAgent = new https.Agent({
  rejectUnauthorized: env.sapRejectUnauthorized,
});

const SESSION_TTL_MS = 25 * 60 * 1000;
const sessionsByCompanyDb = new Map();
const pendingLoginsByCompanyDb = new Map();

const buildUrl = (path) => {
  const qIdx = path.indexOf('?');
  if (qIdx === -1) return `${env.sapBaseUrl}${path}`;

  const base = path.slice(0, qIdx);
  const qs = path.slice(qIdx + 1);
  const encodedQs = qs
    .replace(/\$/g, '%24')
    .replace(/ /g, '%20')
    .replace(/'/g, '%27');

  return `${env.sapBaseUrl}${base}?${encodedQs}`;
};

const extractCookie = (header) => {
  if (!Array.isArray(header)) return header || '';
  return header.map((cookie) => String(cookie).split(';')[0]).filter(Boolean).join('; ');
};

const getSessionKey = (companyDb) => String(companyDb || '').trim().toLowerCase();

const getSessionState = (companyDb) => {
  const sessionKey = getSessionKey(companyDb);

  if (!sessionsByCompanyDb.has(sessionKey)) {
    sessionsByCompanyDb.set(sessionKey, {
      companyDb: String(companyDb || '').trim(),
      sessionCookie: '',
      sessionActive: false,
      sessionExpireAt: 0,
    });
  }

  return sessionsByCompanyDb.get(sessionKey);
};

const resolveCompanyDb = async (requestConfig = {}) => {
  const explicitCompanyDb = String(requestConfig.companyDb || '').trim();
  if (explicitCompanyDb) {
    return explicitCompanyDb;
  }

  const context = getRequestContext();
  if (context?.companyDb) {
    return context.companyDb;
  }

  const authUserId = Number(context?.req?.auth?.userId);
  const authCompanyId = Number(context?.req?.auth?.companyId);

  if (Number.isFinite(authUserId) && Number.isFinite(authCompanyId)) {
    const assignedCompany = await authDbService.getAssignedCompanyForUser(authUserId, authCompanyId);
    const companyDb = String(assignedCompany?.DbName || '').trim();

    if (companyDb) {
      if (context) {
        context.companyDb = companyDb;
      }
      return companyDb;
    }
  }

  return String(env.sapCompanyDb || '').trim();
};

const login = async (companyDb) => {
  const resolvedCompanyDb = String(companyDb || '').trim();
  if (!env.sapBaseUrl || !env.sapUsername || !env.sapPassword || !resolvedCompanyDb) {
    throw new Error('Missing SAP configuration. Check backend/.env and company assignment.');
  }

  const loginKey = getSessionKey(resolvedCompanyDb);
  const pendingLogin = pendingLoginsByCompanyDb.get(loginKey);
  if (pendingLogin) {
    return pendingLogin;
  }

  const loginPromise = axios.post(
    buildUrl('/Login'),
    {
      UserName: env.sapUsername,
      Password: env.sapPassword,
      CompanyDB: resolvedCompanyDb,
    },
    { httpsAgent },
  ).then((response) => {
    const sessionState = getSessionState(resolvedCompanyDb);
    sessionState.sessionCookie = extractCookie(response.headers['set-cookie']);
    sessionState.sessionActive = true;
    sessionState.sessionExpireAt = Date.now() + SESSION_TTL_MS;
    console.log(`[SAP] Session established for ${resolvedCompanyDb}`);
    return sessionState.sessionCookie;
  }).finally(() => {
    pendingLoginsByCompanyDb.delete(loginKey);
  });

  pendingLoginsByCompanyDb.set(loginKey, loginPromise);
  return loginPromise;
};

const ensureSession = async (companyDb) => {
  const resolvedCompanyDb = String(companyDb || '').trim();
  const sessionState = getSessionState(resolvedCompanyDb);

  if (!sessionState.sessionActive || !sessionState.sessionCookie || Date.now() >= sessionState.sessionExpireAt) {
    await login(resolvedCompanyDb);
  }
};

const rawRequest = (method, fullUrl, headers, body) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(fullUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json', ...headers },
      rejectUnauthorized: env.sapRejectUnauthorized,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const err = new Error(`SAP ${res.statusCode}`);
          try {
            err.response = { status: res.statusCode, data: JSON.parse(data) };
          } catch {
            err.response = { status: res.statusCode, data };
          }
          return reject(err);
        }

        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

const request = async (config, retryOnAuth = true) => {
  const companyDb = await resolveCompanyDb(config);
  await ensureSession(companyDb);
  const sessionState = getSessionState(companyDb);

  try {
    return await rawRequest(
      config.method || 'get',
      buildUrl(config.url),
      { Cookie: sessionState.sessionCookie, ...(config.headers || {}) },
      config.data || null,
    );
  } catch (error) {
    if (retryOnAuth && [401, 403].includes(error.response?.status)) {
      console.log(`[SAP] Auth error for ${companyDb}; re-logging in`);
      sessionState.sessionActive = false;
      sessionState.sessionCookie = '';
      sessionState.sessionExpireAt = 0;
      await login(companyDb);
      return request(config, false);
    }

    throw error;
  }
};

const createItem = async (data) => {
  const res = await request({ method: 'POST', url: '/Items', data });
  return res.data;
};

const getItem = async (itemCode) => {
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

const getItemGroups = async () => {
  const res = await request({ method: 'GET', url: '/ItemGroups?$select=Number,GroupName' });
  return res.data.value || [];
};

const getPriceLists = async () => {
  const res = await request({ method: 'GET', url: '/PriceLists?$select=PriceListNo,PriceListName' });
  return res.data.value || [];
};

const createItem_generic = async (endpoint, data) => {
  const res = await request({ method: 'POST', url: endpoint, data });
  return res.data;
};

module.exports = {
  login,
  ensureSession,
  request,
  resolveCompanyDb,
  createItem,
  createItem_generic,
  getItem,
  updateItem,
  searchItems,
  getItemGroups,
  getPriceLists,
};
