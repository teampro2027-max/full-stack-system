const cron = require('node-cron');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../controllers/notificationController');

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

            console.log('Finished daily cron jobs successfully.');
        } catch (error) {
            console.error('Error running cron jobs:', error.message);
        }
    });

    // 3. Monthly Reset: Markay bishu dhalato (1st of every month at midnight)
    cron.schedule('0 0 1 * *', async () => {
        console.log('Running monthly bill status reset and notification');
        try {
            // Hel dhammaan biilashii horey loo bixiyey
            const paidBills = await Bill.find({ status: 'paid' });

            for (let bill of paidBills) {
                bill.status = 'unpaid';
                await bill.save();

                const msg = `Bishii cusub ayaa dhalatay! Biilkaaga "${bill.title}" hadda waa furan yahay, waad bixin kartaa.`;
                
                await Notification.create({
                    userId: bill.userId,
                    title: 'Biil Cusub oo Furan',
                    message: msg
                });

                await sendPushNotification(bill.userId, 'Biil Cusub oo Furan', msg);
            }
        } catch (error) {
            console.error('Monthly reset error:', error.message);
        }
    });
};

module.exports = setupCronJobs;
