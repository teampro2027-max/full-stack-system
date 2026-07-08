const SupportMessage = require('../models/SupportMessage');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./notificationController');

// POST /api/support
const createSupportMessage = async (req, res) => {
    try {
        const { message, title, type } = req.body;
        if (!message) {
            return res.status(400).json({ message: 'Fariintu waa muhiim (Message is required)' });
        }

        const support = await SupportMessage.create({
            userId: req.user._id,
            title: title || 'Help Request',
            message,
            type: type || 'support',
            status: 'pending'
        });

        res.status(201).json(support);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/support
const getMySupportMessages = async (req, res) => {
    try {
        const messages = await SupportMessage.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/support/admin
const adminGetSupportMessages = async (req, res) => {
    try {
        const messages = await SupportMessage.find()
            .populate('userId', 'name email phone')
            .sort({ status: 1, createdAt: -1 }); // pending first, then newest
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/support/admin/reply/:id
const adminReplySupportMessage = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json({ message: 'Jawaabtu waa muhiim (Reply is required)' });
        }

        const ticket = await SupportMessage.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Fariinta lama helin (Message not found)' });
        }

        ticket.reply = reply;
        ticket.replyDate = new Date();
        ticket.status = 'resolved';
        await ticket.save();

        // Abuur notification u gaar ah user-ka
        await Notification.create({
            userId: ticket.userId,
            title: 'Jawaab Caawinaad / Support Reply',
            message: `Maamulaha ayaa ka soo jawaabay fariintaadii: "${reply.substring(0, 50)}${reply.length > 50 ? '...' : ''}"`
        });

        // Isku day in aad u dirto push notification
        try {
            await sendPushNotification(
                ticket.userId,
                'Jawaab Caawinaad / Support Reply',
                reply
            );
        } catch (pushErr) {
            console.log('Push notification failed for support reply: ', pushErr.message);
        }

        res.json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createSupportMessage,
    getMySupportMessages,
    adminGetSupportMessages,
    adminReplySupportMessage
};
