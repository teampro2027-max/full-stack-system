const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const User = require('./models/User');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Bill.deleteMany({});
        await Payment.deleteMany({});
        console.log('Cleared existing data.');

        // 1. Create Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@admin.com',
            password: adminPassword,
            role: 'admin',
            mfaEnabled: false
        });

        // 2. Create a Regular User
        const userPassword = await bcrypt.hash('user123', 10);
        const user = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: userPassword,
            role: 'user'
        });

        console.log('Created Users.');

        // 3. Create Bills for John Doe
        const bills = await Bill.insertMany([
            {
                userId: user._id,
                title: 'Electricity Bill - Oct',
                amount: 145,
                dueDate: new Date(2026, 9, 15),
                category: 'electricity',
                status: 'unpaid',
                isRecurring: true
            },
            {
                userId: user._id,
                title: 'Water Bill - Oct',
                amount: 45,
                dueDate: new Date(2026, 9, 20),
                category: 'water',
                status: 'paid',
                isRecurring: true
            },
            {
                userId: user._id,
                title: 'Internet Subscription',
                amount: 60,
                dueDate: new Date(2026, 9, 10),
                category: 'internet',
                status: 'overdue',
                isRecurring: true
            },
            {
                userId: user._id,
                title: 'Rent - October',
                amount: 850,
                dueDate: new Date(2026, 10, 1),
                category: 'rent',
                status: 'unpaid'
            }
        ]);

        console.log('Created Bills.');

        // 4. Create a Payment for the paid bill
        const paidBill = bills.find(b => b.status === 'paid');
        await Payment.create({
            userId: user._id,
            billId: paidBill._id,
            amount: paidBill.amount,
            method: 'EVC',
            status: 'success',
            transactionId: 'EVC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            paidDate: new Date()
        });

        console.log('Created Payments.');
        console.log('Seeding completed successfully! 🚀');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
