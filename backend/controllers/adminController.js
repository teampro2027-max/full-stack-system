const User = require('../models/User');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');

// ─── Dashboard Stats ─────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            activeBills,
            paidBills,
            overdueBills,
            pendingBills,
            monthlyPayments,
            allPaymentsThisMonth,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Bill.countDocuments({ status: 'unpaid' }),
            Bill.countDocuments({ status: 'paid' }),
            Bill.countDocuments({ status: 'overdue' }),
            Bill.countDocuments({ status: 'unpaid' }),
            Payment.aggregate([
                { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Payment.countDocuments({ createdAt: { $gte: startOfMonth } }),
        ]);

        // Monthly revenue for last 6 months
        const monthlyRevenue = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 7 }
        ]);

        // Bill category breakdown
        const categoryStats = await Bill.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } },
            { $sort: { count: -1 } }
        ]);

        // Recent payments with user + bill info
        const recentPayments = await Payment.find({ status: 'success' })
            .populate('userId', 'name email')
            .populate('billId', 'title category')
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

        // Upcoming bills due in next 7 days
        const upcoming = await Bill.find({
            status: 'unpaid',
            dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
        })
            .populate('userId', 'name phone')
            .sort({ dueDate: 1 })
            .limit(5)
            .lean();

        res.json({
            stats: {
                totalUsers,
                activeBills,
                paidBills,
                overdueBills,
                pendingBills,
                monthlyRevenue: monthlyPayments[0]?.total || 0,
                monthlyTransactions: allPaymentsThisMonth,
            },
            monthlyRevenue,
            categoryStats,
            recentPayments,
            upcomingBills: upcoming,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Admin User Management ───────────────────────────────────
const adminGetUsers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        const query = { role: 'user' };
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }
        const users = await User.find(query)
            .select('-password -mfaSecret')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        // For each user, attach bill count
        const withBills = await Promise.all(users.map(async (u) => ({
            ...u,
            billCount: await Bill.countDocuments({ userId: u._id }),
        })));

        const total = await User.countDocuments(query);
        res.json({ users: withBills, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminCreateUser = async (req, res) => {
    try {
        const { name, email, phone, password, role = 'user', status = 'active' } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already exists' });
        const hashed = await bcrypt.hash(password || 'Welcome@123', 10);
        const user = await User.create({ name, email, phone, password: hashed, role, status });
        res.status(201).json({ _id: user._id, name, email, phone, role, status });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminUpdateUser = async (req, res) => {
    try {
        const { name, phone, status, role, mfaEnabled } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (status) user.status = status;
        if (role) user.role = role;
        if (mfaEnabled !== undefined) user.mfaEnabled = mfaEnabled;
        if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
        await user.save();
        res.json({ message: 'User updated', user: { _id: user._id, name: user.name, status: user.status } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminDeleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Admin Bills ─────────────────────────────────────────────
const adminGetBills = async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (category && category !== 'all') query.category = category;
        const bills = await Bill.find(query)
            .populate('userId', 'name phone email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const filtered = search
            ? bills.filter(b =>
                b.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
                b.category?.includes(search.toLowerCase()))
            : bills;

        const total = await Bill.countDocuments(query);
        res.json({ bills: filtered, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminCreateBill = async (req, res) => {
    try {
        const bill = await Bill.create(req.body);
        res.status(201).json(bill);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminUpdateBill = async (req, res) => {
    try {
        const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bill) return res.status(404).json({ message: 'Bill not found' });
        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminDeleteBill = async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Bill deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── Admin Payments ──────────────────────────────────────────
const adminGetPayments = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        const payments = await Payment.find(query)
            .populate('userId', 'name phone email')
            .populate('billId', 'title category')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const total = await Payment.countDocuments(query);
        res.json({ payments, total });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminConfirmPayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'success', confirmedBy: req.user._id, confirmedAt: new Date() },
            { new: true }
        );
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        // Mark bill as paid
        await Bill.findByIdAndUpdate(payment.billId, { status: 'paid' });
        res.json({ message: 'Payment confirmed', payment });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const adminRejectPayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'failed' },
            { new: true }
        );
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json({ message: 'Payment rejected', payment });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    adminGetUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
    adminGetBills, adminCreateBill, adminUpdateBill, adminDeleteBill,
    adminGetPayments, adminConfirmPayment, adminRejectPayment,
};
