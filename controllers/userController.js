const { User, ApiKey } = require('../models');

function statusForKey(apiKey) {
  const created = new Date(apiKey.createdAt);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return (apiKey.isActive && diffDays < 30) ? 'valid' : 'invalid';
}

async function createUserWithKey(req, res) {
  try {
    const { firstName, lastName, email, apikey } = req.body;
    if (!firstName || !lastName || !apikey) return res.status(400).json({ message: 'firstName, lastName and apikey required' });

    let user;
    if (email && String(email).trim()) {
      // jika email diberikan, pakai findOrCreate berdasarkan email
      const [u] = await User.findOrCreate({
        where: { email: email.trim() },
        defaults: { firstName, lastName, email: email.trim() }
      });
      user = u;
      // update nama bila berubah
      if (user.firstName !== firstName || user.lastName !== lastName) {
        user.firstName = firstName;
        user.lastName = lastName;
        await user.save();
      }
    } else {
      // jika email kosong → buat user baru setiap kali (email optional)
      user = await User.create({ firstName, lastName, email: null });
    }

    const created = await ApiKey.create({ key: apikey, userId: user.id });
    return res.status(201).json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      apikey: { id: created.id, key: created.key, createdAt: created.createdAt, status: statusForKey(created) }
    });
  } catch (err) {
    console.error('createUserWithKey error:', err);
    // kirim pesan error lebih deskriptif untuk debugging
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getUser(req, res) {
  try {
    const id = Number(req.params.id);
    const user = await User.findByPk(id, { include: [{ model: ApiKey, as: 'apiKeys' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const apiKeys = user.apiKeys.map(k => ({ id: k.id, key: k.key, createdAt: k.createdAt, isActive: k.isActive, status: statusForKey(k) }));
    return res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, apiKeys });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createUserWithKey, getUser };