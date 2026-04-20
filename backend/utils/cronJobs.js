const cron = require('node-cron');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');

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
                await Notification.create({
                    userId: bill.userId,
                    message: `Reminder: Your ${bill.category} bill of $${bill.amount} is due on ${new Date(bill.dueDate).toLocaleDateString()}.`
                });
            }

            // 2. Check for overdue bills
            const overdueBills = await Bill.find({
                status: 'unpaid',
                dueDate: { $lt: today }
            });

            for (let bill of overdueBills) {
                bill.status = 'overdue';
                await bill.save();

                await Notification.create({
                    userId: bill.userId,
                    message: `Alert: Your ${bill.category} bill of $${bill.amount} is OVERDUE.`
                });
            }

            console.log('Finished daily cron jobs successfully.');
        } catch (error) {
            console.error('Error running cron jobs:', error.message);
        }
    });
};

module.exports = setupCronJobs;
