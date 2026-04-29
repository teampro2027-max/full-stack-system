const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    updateFcmToken,
    sendNotification,
    broadcastNotification
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.post('/update-token', protect, updateFcmToken);
router.post('/send', protect, sendNotification); // Consider adding admin protection for this route
router.post('/broadcast', protect, broadcastNotification); // Consider adding admin protection for this route

module.exports = router;