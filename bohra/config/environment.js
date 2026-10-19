require('dotenv').config();

let localEnv = {};
try {
  localEnv = require('../env');
} catch {}

const value = (name, fallback) => process.env[name] || localEnv[name] || fallback;

module.exports = {
  MONGO_URI: value('MONGO_URI'),
  PORT: Number(value('PORT', 4000)),
  JWT_SECRET: value('JWT_SECRET'),
  EMAIL_USER: value('EMAIL_USER'),
  EMAIL_PASS: value('EMAIL_PASS'),
  ADMIN_EMAIL: value('ADMIN_EMAIL'),
  BACKEND_URL: value('BACKEND_URL', 'http://localhost:4000').replace(/\/+$/, ''),
  FRONTEND_URL: value('FRONTEND_URL', 'http://localhost:5173').replace(/\/+$/, ''),
};