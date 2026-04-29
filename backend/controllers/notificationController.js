const User = require('../models/User');
const Notification = require('../models/Notification'); // Import Notification model
const admin = require('../config/firebase');

// Function-kan waxaa loo isticmaali karaa gudaha controller-ada kale
const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            console.log(`Notification: No FCM token for user ${userId}`);
            return null;
        }

        const message = {
            notification: { title, body },
            data: data,
            token: user.fcmToken
        };

        return await admin.messaging().send(message);
    } catch (error) {
        console.error('Push Notification Error:', error);
        return null;
    }
};

// POST /api/notifications/update-token
const updateFcmToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Token is required' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.fcmToken = token;
        await user.save();

        res.json({ message: 'FCM token updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/notifications/send
const sendNotification = async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;

        const response = await sendPushNotification(userId, title, body, data);
        if (!response) {
            return res.status(400).json({ message: 'Error sending push notification' });
        }
        res.json({ message: 'Notification sent successfully', response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
};

// POST /api/notifications/broadcast
const broadcastNotification = async (req, res) => {
    try {
        const { title, body, data } = req.body;

        const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
        const tokens = users.map(u => u.fcmToken);

        if (tokens.length === 0) return res.status(404).json({ message: 'No tokens found' });

        const message = {
            notification: { title, body },
            data: data || {},
            tokens: tokens
        };

        const response = await admin.messaging().sendMulticast(message);
        res.json({ 
            message: 'Broadcast completed', 
            successCount: response.successCount,
            failureCount: response.failureCount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error broadcasting', error: error.message });
    }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 }); // Sort by newest first
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

module.exports = { updateFcmToken, sendNotification, broadcastNotification, sendPushNotification, getNotifications };
