const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === 1. Koneksi ke database MySQL ===
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2315',
  database: 'apikey_demo',
  port: 3307
});

db.connect((err) => {
  if (err) {
    console.error('Gagal konek ke MySQL:', err);
  } else {
    console.log('Terhubung ke MySQL Database.');
  }
});

// === 2. Fungsi untuk menyimpan key ===
function saveKey(name, apiKey) {
  const sql = 'INSERT INTO api_keys (name, api_key) VALUES (?, ?)';
  db.query(sql, [name || null, apiKey], (err) => {
    if (err) console.error('Gagal simpan API key:', err);
    else console.log('API key tersimpan di database');
  });
}

// === 3. Routes ===
app.post('/create', (req, res) => {
  const name = req.body.name || null;
  const key = crypto.randomBytes(16).toString('hex');
  saveKey(name, key);
  res.json({ apiKey: key });
});

// ======== ROUTE VALIDASI API KEY ========
app.post('/valid', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'API key tidak boleh kosong.' });
  }

  const sql = 'SELECT * FROM api_keys WHERE api_key = ? LIMIT 1';
  db.query(sql, [apiKey], (err, results) => {
    if (err) {
      console.error('Error saat validasi API key:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }

    if (results.length > 0) {
      res.json({ success: true, message: 'API key valid.', data: results[0] });
    } else {
      res.status(401).json({ success: false, message: 'API key tidak valid.' });
    }
  });
});

// ======== ROUTE DEFAULT ========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======== JALANKAN SERVER ========
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
