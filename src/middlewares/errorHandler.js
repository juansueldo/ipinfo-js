const { logger } = require('../lib/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.stack || err.message || err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
};
