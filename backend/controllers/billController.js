const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./notificationController');

const getBills = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }
        const bills = await Bill.find(query).populate('userId', 'name email');
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createBill = async (req, res) => {
    const { title, amount, dueDate, category, isRecurring, recurringInterval, notes } = req.body;
    
    const targetUserId = (req.user.role === 'admin' && req.body.userId) ? req.body.userId : req.user._id;

    try {
        const bill = await Bill.create({
            userId: targetUserId,
            title,
            amount,
            dueDate,
            category,
            isRecurring: isRecurring || false,
            recurringInterval: recurringInterval || 'monthly',
            notes: notes || ''
        });

        // Create in-app notification for the user
        const msg = `Biil cusub oo "${title}" ah oo dhan $${amount} ayaa laguu soo saaray.`;
        await Notification.create({
            userId: targetUserId,
            title: 'Biil Cusub',
            message: msg
        });

        // Push Notification (non-blocking - won't fail the request if it fails)
        sendPushNotification(targetUserId, 'Biil Cusub', msg).catch(() => {});

        res.status(201).json(bill);
    } catch (error) {
        console.error('CREATE BILL ERROR:', error.message);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};


const updateBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Check ownership unless admin
        if (bill.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to update this bill' });
        }

        const updatedBill = await Bill.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedBill);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Check ownership unless admin
        if (bill.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this bill' });
        }

        await Bill.deleteOne({ _id: req.params.id });

        res.json({ message: 'Bill removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getBills,
    createBill,
    updateBill,
    deleteBill
};
