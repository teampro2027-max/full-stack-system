const express = require('express');
const router = express.Router();
const { registerUser, verifyRegisterOtp, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/verify-otp', verifyRegisterOtp);
router.post('/login', loginUser);

module.exports = router;

