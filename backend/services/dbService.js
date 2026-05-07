/**
 * Direct SQL Server connection to SAP B1 company database.
 * Uses mssql (TDS protocol) — no ODBC driver install needed.
 */
const sql = require('mssql');
const env = require('../config/env');

const buildConfig = (databaseName = env.dbName) => ({
  server: env.dbServer,
  database: databaseName,
  options: {
    instanceName: env.dbInstance || undefined,
    trustServerCertificate: env.dbTrustCert,
    encrypt: env.dbEncrypt,
  },
  authentication: {
    type: 'default',
    options: { userName: env.dbUser, password: env.dbPassword },
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
});

const pools = new Map();

const getPool = async (databaseName = env.dbName) => {
  const resolvedDatabase = String(databaseName || env.dbName || '').trim();
  if (!resolvedDatabase) {
    throw new Error('No company database is configured for SQL access.');
  }

  const existingPool = pools.get(resolvedDatabase);
  if (existingPool?.connected) {
    return existingPool;
  }

  const pool = await new sql.ConnectionPool(buildConfig(resolvedDatabase)).connect();
  pools.set(resolvedDatabase, pool);
  console.log(`[DB] SQL Server pool connected to ${resolvedDatabase}`);
  return pool;
};

const query = async (queryStr, params = {}, options = {}) => {
  const pool = await getPool(options.databaseName);
  const req  = pool.request();
  for (const [k, v] of Object.entries(params)) {
    req.input(k, v);
  }
  return req.query(queryStr);
};

module.exports = { query, sql, getPool };
