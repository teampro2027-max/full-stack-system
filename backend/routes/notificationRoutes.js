const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markNotificationAsRead,
    updateFcmToken,
    sendNotification,
    broadcastNotification
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/:id', protect, markNotificationAsRead);
router.post('/update-token', protect, updateFcmToken);
router.post('/send', protect, sendNotification); // Consider adding admin protection for this route
router.post('/broadcast', protect, broadcastNotification); // Consider adding admin protection for this route

module.exports = router;