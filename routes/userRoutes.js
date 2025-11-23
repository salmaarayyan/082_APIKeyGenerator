const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

router.post('/', userCtrl.createUserWithKey);
router.get('/:id', userCtrl.getUser);

module.exports = router;