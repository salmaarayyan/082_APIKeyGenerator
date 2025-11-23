const { ApiKey, User } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

function generateApiKey() {
  // 32 bytes hex -> 64 chars
  return crypto.randomBytes(32).toString('hex');
}

async function createApiKeyForUser(req, res) {
  const { userId } = req.params;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const apiKey = generateApiKey();
  const ak = await ApiKey.create({ user_id: user.id, api_key: apiKey });
  res.json({ apiKey: ak });
}

async function editApiKey(req, res) {
  const { id } = req.params;
  const { api_key, valid } = req.body;
  const ak = await ApiKey.findByPk(id);
  if (!ak) return res.status(404).json({ message: 'Not found' });
  if (api_key) ak.api_key = api_key;
  if (typeof valid === 'boolean') ak.valid = valid;
  await ak.save();
  res.json({ apiKey: ak });
}

async function validateApiKeyMiddleware(req, res) {
  // Example endpoint to validate given api key
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (!provided) return res.status(400).json({ message: 'Missing api key' });
  const ak = await ApiKey.findOne({ where: { api_key: provided }});
  if (!ak) return res.status(404).json({ valid: false, reason: 'not found' });

  // check 30 days validity
  const created = new Date(ak.created_at);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  const stillValid = ak.valid && diffDays < 30;
  res.json({ valid: stillValid, diffDays, created_at: ak.created_at });
}

module.exports = { generateApiKey, createApiKeyForUser, editApiKey, validateApiKeyMiddleware };
