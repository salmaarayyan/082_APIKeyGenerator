const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { adminAuth } = require('../middleware/authMiddleware');

router.post('/login', adminCtrl.login);
router.get('/users', adminAuth, adminCtrl.listUsers);
router.put('/apikeys/:id', adminAuth, adminCtrl.updateApiKey);
router.delete('/apikeys/:id', adminAuth, adminCtrl.deleteApiKey);

module.exports = router;