const cron = require('node-cron');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../controllers/notificationController');
const { sendBillReminderEmail } = require('./emailService');

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
            const billsToProcess = await Bill.find({
                notificationDate: { $exists: true, $ne: null, $lte: now }
            }).populate('userId', 'name email');

            for (let bill of billsToProcess) {
                if (!bill.userId) {
                    console.log(`Skipping reminder for bill ${bill._id} because userId is missing.`);
                    continue;
                }

                const wasPaid = bill.status === 'paid';
                
                // If the bill was paid, reset to unpaid and clear lastPaidDate
                if (wasPaid) {
                    bill.status = 'unpaid';
                    bill.lastPaidDate = null;
                }

                const userName = bill.userId.name || 'Macaamiil';
                const userEmail = bill.userId.email;
                
                const msg = wasPaid
                    ? `Waqtigii lacag bixinta biilkaaga "${bill.title}" waa la gaaray. Fadlan bixi $${bill.amount}.`
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
                        // default to monthly
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    }
                    bill.notificationDate = nextDate;
                    bill.dueDate = nextDate;
                } else {
                    // Set notificationDate to null so it doesn't trigger again
                    bill.notificationDate = null;
                }

                await bill.save();
                console.log(`Processed reminder/reset for bill ${bill._id}`);
            }
        } catch (error) {
            console.error('Error running minute-by-minute reminder cron job:', error.message);
        }
    });
};

module.exports = setupCronJobs;
