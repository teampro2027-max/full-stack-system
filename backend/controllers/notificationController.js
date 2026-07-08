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
        if (!body) {
            return res.status(400).json({ message: 'Notification body is required' });
        }

        // 1. Get all customer users (role = 'user')
        const users = await User.find({ role: 'user' });

        if (users.length === 0) {
            return res.status(404).json({ message: 'No customer users found to broadcast to' });
        }

        // 2. Save Notification in MongoDB for each user
        const notificationPromises = users.map(user => {
            return Notification.create({
                userId: user._id,
                title: title || 'Ogeysiis Cusub / Announcement',
                message: body,
                status: 'unread'
            });
        });
        await Promise.all(notificationPromises);

        // 3. Attempt FCM push notifications
        const tokens = users.map(u => u.fcmToken).filter(t => !!t);
        let pushResponse = { successCount: 0, failureCount: 0 };
        
        if (tokens.length > 0) {
            try {
                const message = {
                    notification: { title: title || 'Ogeysiis Cusub', body: body },
                    data: data || {},
                    tokens: tokens
                };
                const fcmRes = await admin.messaging().sendMulticast(message);
                pushResponse.successCount = fcmRes.successCount;
                pushResponse.failureCount = fcmRes.failureCount;
            } catch (fcmError) {
                console.warn('FCM multicast warning (likely not configured or invalid cert):', fcmError.message);
            }
        }

        res.json({ 
            message: 'Broadcast completed and saved to database', 
            recipientCount: users.length,
            pushSuccessCount: pushResponse.successCount,
            pushFailureCount: pushResponse.failureCount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error broadcasting', error: error.message });
    }
};

// PUT /api/notifications/:id - mark as read
const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        // Ensure the notification belongs to the requesting user
        if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }
        notification.status = 'read';
        await notification.save();
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating notification', error: error.message });
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

module.exports = { updateFcmToken, sendNotification, broadcastNotification, sendPushNotification, getNotifications, markNotificationAsRead };
