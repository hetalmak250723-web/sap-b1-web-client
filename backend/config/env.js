const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

module.exports = {
  port: Number(process.env.PORT || 5001),
  sapBaseUrl: process.env.SAP_BASE_URL || '',
  sapUsername: process.env.SAP_USERNAME || '',
  sapPassword: process.env.SAP_PASSWORD || '',
  sapCompanyDb: process.env.SAP_COMPANY_DB || '',
  sapRejectUnauthorized: parseBoolean(process.env.SAP_REJECT_UNAUTHORIZED, false),
  // Direct SQL Server
  dbServer:    process.env.DB_SERVER    || '',
  dbInstance:  process.env.DB_INSTANCE  || '',
  dbName:      process.env.DB_NAME      || '',
  dbUser:      process.env.DB_USER      || '',
  dbPassword:  process.env.DB_PASSWORD  || '',
  dbEncrypt:   parseBoolean(process.env.DB_ENCRYPT,   false),
  dbTrustCert: parseBoolean(process.env.DB_TRUST_CERT, true),
};
