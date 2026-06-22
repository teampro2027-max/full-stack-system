const express = require('express');
const router = express.Router();
const { registerUser, verifyRegisterOtp, loginUser, forgotPassword, resetPassword, resendRegisterOtp } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/verify-otp', verifyRegisterOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-register-otp', resendRegisterOtp);

module.exports = router;

