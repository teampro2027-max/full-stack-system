const express = require('express');
const router = express.Router();
const { registerUser, loginUser, enableMfa, disableMfa, getMfaSetup } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/mfa/setup', protect, getMfaSetup);
router.post('/mfa/enable', protect, enableMfa);
router.post('/mfa/disable', protect, disableMfa);

module.exports = router;
