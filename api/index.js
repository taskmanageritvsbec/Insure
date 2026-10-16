const app = require('../backend/dist/server');

module.exports = (req, res) => {
  // Normalize incoming path so Express router handles it whether or not /api prefix was preserved
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
