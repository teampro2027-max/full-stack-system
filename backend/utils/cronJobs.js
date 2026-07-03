const cron = require('node-cron');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../controllers/notificationController');
const { sendBillReminderEmail } = require('./emailService');

// Run everyday at 8:00 AM
const setupCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily bill reminder check');
        
        try {
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            // 1. Check for upcoming bills (1-3 days)
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

            // 2. Check for overdue bills
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

            // 3. Check for paid bills that have reached their 30-day cycle
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            thirtyDaysAgo.setHours(23, 59, 59, 999); // Safe boundary for end of day

            const recurringBillsToReset = await Bill.find({
                status: 'paid',
                lastPaidDate: { $lte: thirtyDaysAgo }
            }).populate('userId', 'name email');

            for (let bill of recurringBillsToReset) {
                if (!bill.userId) {
                    console.log(`Skipping recurring reset for bill ${bill._id} because userId is missing.`);
                    continue;
                }

                // Reset back to unpaid
                bill.status = 'unpaid';
                // Set the new due date to today (or + X days if you want a grace period, e.g. + 5)
                bill.dueDate = new Date(); 
                // Unset lastPaidDate so it doesn't keep triggering until paid again
                bill.lastPaidDate = null;
                await bill.save();

                const userName = bill.userId.name || 'Macaamiil';
                const userEmail = bill.userId.email;
                const msg = `Waqtigii lacag bixinta biilkaaga "${bill.title}" waa la gaaray (30 maalmood ayaa dhammaatay). Fadlan bixi $${bill.amount}.`;
                
                // In-App Notification
                await Notification.create({
                    userId: bill.userId._id,
                    title: 'Waqtigii Biilka Oo La Gaaray',
                    message: msg
                });

                // Push Notification
                await sendPushNotification(bill.userId._id, 'Waqtigii Biilka Oo La Gaaray', msg);

                // Email Reminder
                if (userEmail) {
                    await sendBillReminderEmail(userEmail, userName, bill.title, bill.amount);
                }
            }

            console.log('Finished daily cron jobs successfully.');
        } catch (error) {
            console.error('Error running cron jobs:', error.message);
        }
    });
};

module.exports = setupCronJobs;
