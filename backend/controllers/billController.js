const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./notificationController');
const { resolveBillDates } = require('../utils/billDateUtils');
const { processReminderBills } = require('../utils/cronJobs');

const getBills = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }
        const { status, category, search } = req.query;
        if (status && status !== 'all') query.status = status;
        if (category && category !== 'all') query.category = category;

        try {
            await processReminderBills(new Date());
        } catch (reminderError) {
            console.error('Reminder refresh failed during bill fetch:', reminderError.message);
        }

        let bills = await Bill.find(query).populate('userId', 'name email').sort({ createdAt: -1 });

        if (search) {
            bills = bills.filter(b =>
                b.title?.toLowerCase().includes(search.toLowerCase()) ||
                b.category?.includes(search.toLowerCase())
            );
        }

        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createBill = async (req, res) => {
    let { title, amount, dueDate, category, isRecurring, recurringInterval, notes, startDate, notificationDate, reminderEnabled } = req.body;
    
    const targetUserId = (req.user.role === 'admin' && req.body.userId) ? req.body.userId : req.user._id;

    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 mins buffer

    const resolvedDates = resolveBillDates({ dueDate, notificationDate, startDate, now });
    const { dueDate: resolvedDueDate, notificationDate: resolvedNotificationDate, startDate: resolvedStartDate } = resolvedDates;

    if (reminderEnabled) {
        if (resolvedNotificationDate && resolvedNotificationDate.getTime() < now.getTime() - buffer) {
            return res.status(400).json({ message: 'Notification date and time cannot be in the past' });
        }
        if (resolvedNotificationDate && resolvedNotificationDate.getTime() < resolvedStartDate.getTime()) {
            return res.status(400).json({ message: 'Notification date must be after the start date' });
        }
    }
    
    if (resolvedDueDate && resolvedDueDate.getTime() < resolvedStartDate.getTime()) {
        return res.status(400).json({ message: 'Due date must be after the start date' });
    }

    try {
        const bill = await Bill.create({
            userId: targetUserId,
            title,
            amount,
            dueDate: resolvedDueDate,
            category,
            isRecurring: isRecurring || false,
            recurringInterval: recurringInterval || 'monthly',
            notes: notes || '',
            startDate: resolvedStartDate,
            notificationDate: reminderEnabled ? (resolvedNotificationDate || undefined) : undefined,
            reminderEnabled: reminderEnabled || false
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

        const now = new Date();
        const buffer = 5 * 60 * 1000;
        const { reminderEnabled } = req.body;

        if (reminderEnabled === false) {
            req.body.notificationDate = null;
        }

        const resolvedDates = resolveBillDates({
            dueDate: req.body.dueDate,
            notificationDate: req.body.notificationDate,
            startDate: req.body.startDate,
            now,
            existingDueDate: bill.dueDate,
        });
        const { dueDate: resolvedDueDate, notificationDate: resolvedNotificationDate, startDate: resolvedStartDate } = resolvedDates;

        if (reminderEnabled !== false) {
            if (resolvedNotificationDate && resolvedNotificationDate.getTime() < now.getTime() - buffer) {
                return res.status(400).json({ message: 'Notification date and time cannot be in the past' });
            }
            if (resolvedNotificationDate && resolvedNotificationDate.getTime() < resolvedStartDate.getTime()) {
                return res.status(400).json({ message: 'Notification date must be after the start date' });
            }
        }

        if (resolvedDueDate && resolvedDueDate.getTime() < resolvedStartDate.getTime()) {
            return res.status(400).json({ message: 'Due date must be after the start date' });
        }

        req.body.dueDate = resolvedDueDate;
        req.body.notificationDate = resolvedNotificationDate;
        req.body.startDate = resolvedStartDate;

        if (bill.status === 'paid' && resolvedNotificationDate && resolvedNotificationDate.getTime() <= now.getTime()) {
            req.body.status = 'unpaid';
            req.body.lastPaidDate = null;
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
