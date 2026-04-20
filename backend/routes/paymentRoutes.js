const express = require('express');
const router = express.Router();
const { processWaafiPayment, processStripePayment, getPaymentHistory, downloadReceipt } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/waafi', protect, processWaafiPayment);
router.post('/evc', protect, processWaafiPayment);
router.post('/stripe', protect, processStripePayment);
router.get('/history', protect, getPaymentHistory);
router.get('/receipt/:id', protect, downloadReceipt);

module.exports = router;
