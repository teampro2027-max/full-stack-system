const express = require('express');
const router = express.Router();
const { updateFcmToken, sendNotification, broadcastNotification } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/update-token', protect, updateFcmToken);
router.post('/send', protect, admin, sendNotification);
router.post('/broadcast', protect, admin, broadcastNotification);

module.exports = router;
