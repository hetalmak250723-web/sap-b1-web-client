const dbService = require('../services/dbService');

const query = async (sql, params = {}) => dbService.query(sql, params);

module.exports = {
  query,
};
