const User = require('../models/User');
const admin = require('../config/firebase');

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

        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return res.status(404).json({ message: 'User or FCM token not found' });
        }

        const message = {
            notification: { title, body },
            data: data || {},
            token: user.fcmToken
        };

        const response = await admin.messaging().send(message);
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

module.exports = { updateFcmToken, sendNotification, broadcastNotification };
