const cron = require('node-cron');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../controllers/notificationController');
const { sendBillReminderEmail } = require('./emailService');

const processReminderBills = async (now = new Date()) => {
    const billsToProcess = await Bill.find({
        reminderEnabled: true,
        notificationDate: { $exists: true, $ne: null, $lte: now }
    }).populate('userId', 'name email');

    for (let bill of billsToProcess) {
        if (!bill.userId) {
            console.log(`Skipping reminder for bill ${bill._id} because userId is missing.`);
            continue;
        }

        const wasPaid = bill.status === 'paid';
        if (wasPaid) {
            bill.status = 'unpaid';
            bill.lastPaidDate = null;
        }

        const userName = bill.userId.name || 'Macaamiil';
        const userEmail = bill.userId.email;

        const msg = wasPaid
            ? `Xasuusin: Biilkaaga "${bill.title}" waa dib u soo shaac-baxay. Hadda waad bixin kartaa ($${bill.amount}).`
            : `Xasuusin: Biilkaaga "${bill.title}" waxaa la gaaray waqtigii loogu talagalay in la bixiyo ($${bill.amount}).`;

        // In-App Notification
        await Notification.create({
            userId: bill.userId._id,
            title: 'Xasuusin Biil',
            message: msg
        });

        // Push Notification
        await sendPushNotification(bill.userId._id, 'Xasuusin Biil', msg);

        // Email Reminder
        if (userEmail) {
            await sendBillReminderEmail(userEmail, userName, bill.title, bill.amount);
        }

        // Update dates for next cycle (if recurring) or clear reminder (if one-time)
        if (bill.isRecurring) {
            const nextDate = new Date(bill.notificationDate);
            if (bill.recurringInterval === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            bill.notificationDate = nextDate;
            bill.dueDate = nextDate;
        } else {
            bill.notificationDate = null;
        }

        await bill.save();
        console.log(`Processed reminder/reset for bill ${bill._id}`);
    }

    return billsToProcess.length;
};

const process30DayCycleBills = async (now = new Date()) => {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const billsToProcess = await Bill.find({
        status: 'paid',
        reminderEnabled: { $ne: true },
        lastPaidDate: { $exists: true, $ne: null, $lte: thirtyDaysAgo }
    }).populate('userId', 'name email');

    for (let bill of billsToProcess) {
        if (!bill.userId) {
            console.log(`Skipping 30-day cycle for bill ${bill._id} because userId is missing.`);
            continue;
        }

        bill.status = 'unpaid';
        bill.lastPaidDate = null;

        const msg = `Xasuusin: Biilkaaga "${bill.title}" waxaa dhaafay 30 maalmood tan iyo markii la bixiyay. Hadda waad bixin kartaa ($${bill.amount}).`;

        await Notification.create({
            userId: bill.userId._id,
            title: 'Xasuusin Biil',
            message: msg
        });

        await sendPushNotification(bill.userId._id, 'Xasuusin Biil', msg);

        await bill.save();
        console.log(`Processed 30-day cycle reset for bill ${bill._id}`);
    }

    return billsToProcess.length;
};

// Run everyday at 8:00 AM
const setupCronJobs = () => {
    // 1. Run everyday at 8:00 AM for Upcoming & Overdue checks
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily bill reminder check');
        
        try {
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            // Check for upcoming bills (1-3 days)
            const upcomingBills = await Bill.find({
                status: 'unpaid',
                dueDate: { $gte: today, $lte: threeDaysFromNow }
            });

            for (let bill of upcomingBills) {
                const msg = `Xasuusin: Biilkaaga ${bill.category} ($${bill.amount}) waxaa ka haray wakhti yar.`;
                await Notification.create({
                    userId: bill.userId,
                    title: 'Xasuusin Biil',
                    message: msg
                });
                await sendPushNotification(bill.userId, 'Xasuusin Biil', msg);
            }

            // Check for overdue bills
            const overdueBills = await Bill.find({
                status: 'unpaid',
                dueDate: { $lt: today }
            });

            for (let bill of overdueBills) {
                bill.status = 'overdue';
                await bill.save();

                const msg = `Digniin: Biilkaaga ${bill.category} ($${bill.amount}) wakhtigii waa ka dhacay!`;
                await Notification.create({
                    userId: bill.userId,
                    title: 'Biil Wakhtigii dhaafay',
                    message: msg
                });
                await sendPushNotification(bill.userId, 'Biil Wakhtigii dhaafay', msg);
            }

            console.log('Finished daily cron jobs successfully.');
        } catch (error) {
            console.error('Error running daily cron jobs:', error.message);
        }
    });

    // 2. Run every minute to check for specific Reminder Date/Time resets and notifications
    cron.schedule('* * * * *', async () => {
        console.log('Running minute-by-minute reminder and paid-to-unpaid reset check');
        try {
            const now = new Date();
            const processedCount = await processReminderBills(now);
            console.log(`Processed ${processedCount} reminder/reset bill(s)`);
            const cycleCount = await process30DayCycleBills(now);
            console.log(`Processed ${cycleCount} 30-day cycle bill(s)`);
        } catch (error) {
            console.error('Error running minute-by-minute reminder cron job:', error.message);
        }
    });
};

module.exports = setupCronJobs;
module.exports.processReminderBills = processReminderBills;
module.exports.process30DayCycleBills = process30DayCycleBills;
