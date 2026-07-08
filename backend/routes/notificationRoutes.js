const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
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
router.post('/send', protect, admin, sendNotification); 
router.post('/broadcast', protect, admin, broadcastNotification);

module.exports = router;