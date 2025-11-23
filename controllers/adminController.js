const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin, User, ApiKey } = require('../models');
require('dotenv').config();

function statusForKey(apiKey) {
  const created = new Date(apiKey.createdAt);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return (apiKey.isActive && diffDays < 30) ? 'valid' : 'invalid';
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.findAll({ include: [{ model: ApiKey, as: 'apiKeys' }], order: [['id','ASC']] });
    const payload = users.map(u => ({
      id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, createdAt: u.createdAt,
      apiKeys: u.apiKeys.map(k => ({ id: k.id, key: k.key, isActive: k.isActive, createdAt: k.createdAt, status: statusForKey(k) }))
    }));
    return res.json({ users: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateApiKey(req, res) {
  try {
    const id = Number(req.params.id);
    const { key, isActive } = req.body;
    const apikey = await ApiKey.findByPk(id);
    if (!apikey) return res.status(404).json({ message: 'ApiKey not found' });

    if (typeof key === 'string' && key.trim().length) apikey.key = key.trim();
    if (typeof isActive === 'boolean') apikey.isActive = isActive;
    await apikey.save();

    return res.json({ id: apikey.id, key: apikey.key, isActive: apikey.isActive, createdAt: apikey.createdAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteApiKey(req, res) {
  try {
    const id = Number(req.params.id);
    const apikey = await ApiKey.findByPk(id);
    if (!apikey) return res.status(404).json({ message: 'ApiKey not found' });
    await apikey.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login, listUsers, updateApiKey, deleteApiKey };
