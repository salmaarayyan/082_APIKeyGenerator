const express = require('express');
const router = express.Router();
const { ApiKey, User } = require('../models');

router.get('/validate/:key', async (req, res) => {
  const { key } = req.params;
  const ak = await ApiKey.findOne({ where: { key }, include: User });
  if (!ak) return res.json({ valid: false, reason: 'not_found' });
  if (!ak.active) return res.json({ valid: false, reason: 'inactive' });

  const created = new Date(ak.createdAt);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  const valid = diffDays < 30;
  return res.json({ valid, daysElapsed: diffDays, createdAt: ak.createdAt, user: ak.User });
});

module.exports = router;