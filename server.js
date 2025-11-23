const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize, Admin } = require('./models');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.sync();
  const adminCount = await Admin.count();
  if (!adminCount) {
    const pw = process.env.SEED_ADMIN_PASS || 'admin123';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const hash = await bcrypt.hash(pw, 10);
    await Admin.create({ email, passwordHash: hash });
    console.log('Seeded admin:', email, 'password:', pw);
  }
  app.listen(PORT, () => console.log('Server started on', PORT));
}

start().catch(err => { console.error('Startup error', err); process.exit(1); });