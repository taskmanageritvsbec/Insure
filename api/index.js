/**
 * Vercel Serverless Entry Point
 * Requires the compiled Express app from backend/dist/server.js
 * All /api/* and /health requests are forwarded here by vercel.json rewrites.
 */
require('dotenv').config();
const app = require('../backend/dist/server');
module.exports = app;
