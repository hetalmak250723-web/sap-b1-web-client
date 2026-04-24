/**
 * Direct SQL Server connection to SAP B1 company database.
 * Uses mssql (TDS protocol) — no ODBC driver install needed.
 */
const sql = require('mssql');
const env = require('../config/env');

const config = {
  server: env.dbServer,
  database: env.dbName,
  options: {
    instanceName:          env.dbInstance || undefined,
    trustServerCertificate: env.dbTrustCert,
    encrypt:               env.dbEncrypt,
  },
  authentication: {
    type: 'default',
    options: { userName: env.dbUser, password: env.dbPassword },
  },
  connectionTimeout: 15000,
  requestTimeout:    30000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let _pool = null;

const getPool = async () => {
  if (_pool && _pool.connected) return _pool;
  _pool = await sql.connect(config);
  console.log('[DB] SQL Server pool connected');
  return _pool;
};

const query = async (queryStr, params = {}) => {
  const pool = await getPool();
  const req  = pool.request();
  for (const [k, v] of Object.entries(params)) {
    req.input(k, v);
  }
  return req.query(queryStr);
};

module.exports = { query, sql };
