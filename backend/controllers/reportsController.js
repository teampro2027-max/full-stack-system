const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateMonthlyReportPDF } = require('../utils/pdfGenerator');

// GET /api/reports/monthly
const monthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month);

        const start = m ? new Date(y, m - 1, 1) : new Date(y, 0, 1);
        const end = m ? new Date(y, m, 0, 23, 59, 59) : new Date(y, 11, 31, 23, 59, 59);

        const query = req.user.role === 'admin' ? {} : { userId: req.user._id };

        const bills = await Bill.find({ ...query, dueDate: { $gte: start, $lte: end } });
        const payments = await Payment.find({ ...query, paidDate: { $gte: start, $lte: end }, status: 'success' }).populate('billId');

        const totalDue = bills.reduce((s, b) => s + b.amount, 0);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        const byCategory = {};
        bills.forEach(b => {
            byCategory[b.category] = (byCategory[b.category] || 0) + b.amount;
        });

        res.json({
            year: y, month: m,
            totalBills: bills.length,
            totalDue,
            totalPaid,
            outstanding: totalDue - totalPaid,
            byCategory,
            bills,
            payments
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/category
const categoryReport = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
        const bills = await Bill.find(query);
        const byCategory = {};
        const categories = [
            'electricity','water','internet','rent','school_fees',
            'mobile_postpaid','tv_subscription','waste_collection','loan_installment','government_license'
        ];
        categories.forEach(c => { byCategory[c] = { count: 0, total: 0, paid: 0, overdue: 0 }; });
        bills.forEach(b => {
            if (!byCategory[b.category]) return;
            byCategory[b.category].count++;
            byCategory[b.category].total += b.amount;
            if (b.status === 'paid') byCategory[b.category].paid++;
            if (b.status === 'overdue') byCategory[b.category].overdue++;
        });
        res.json({ byCategory });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/export-pdf
const exportPDF = async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month);

        // Harmonized logic for Annual vs Monthly dates
        const start = m ? new Date(y, m - 1, 1) : new Date(y, 0, 1);
        const end = m ? new Date(y, m, 0, 23, 59, 59) : new Date(y, 11, 31, 23, 59, 59);

        const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
        const bills = await Bill.find({ ...query, dueDate: { $gte: start, $lte: end } });
        const payments = await Payment.find({ ...query, paidDate: { $gte: start, $lte: end }, status: 'success' }).populate('billId');
        let user = await User.findById(req.user._id).select('-password');
        
        // Safety: ensure user exists for the PDF header
        if (!user) {
            user = { name: 'MultiBill User', email: req.user.email || 'user@multibill.app' };
        }
        
        // Safety: check if date is valid before calling toLocaleString
        let monthLabel;
        try {
            monthLabel = month 
                ? start.toLocaleString('en-US', { month: 'long', year: 'numeric' })
                : `Annual Report ${y}`;
            if (monthLabel === 'Invalid Date') throw new Error('Invalid Date');
        } catch (e) {
            monthLabel = month ? `Month ${m} ${y}` : `Year ${y}`;
        }

        const pdfBuffer = await generateMonthlyReportPDF(bills, payments, user, monthLabel);

        if (!pdfBuffer || !pdfBuffer.length) {
            throw new Error('PDF generation produced empty buffer');
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=report-${y}-${m || 'annual'}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF Export Error:', error.stack || error);
        res.status(500).json({ message: error.message || 'Error generating report' });
    }
};

// GET /api/reports/audit (admin only)
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/phone/:number
const getPhoneReport = async (req, res) => {
    try {
        const { number } = req.params;
        if (!number) return res.status(400).json({ message: 'Phone number is required' });

        // Admins can search across all records, users only their own
        const query = req.user.role === 'admin' ? { phoneNumber: number } : { phoneNumber: number, userId: req.user._id };

        const payments = await Payment.find(query)
            .populate('billId', 'title category amount')
            .sort({ createdAt: -1 });

        const totalCount = payments.length;
        const totalAmount = payments.reduce((sum, p) => p.status === 'success' ? sum + p.amount : sum, 0);
        const successCount = payments.filter(p => p.status === 'success').length;
        const failedCount = payments.filter(p => p.status === 'failed').length;

        res.json({
            phoneNumber: number,
            totalTransfers: totalCount,
            totalAmount,
            successCount,
            failedCount,
            payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/reports/phone/:number/export
const exportPhonePDF = async (req, res) => {
    try {
        const { number } = req.params;
        const query = req.user.role === 'admin' ? { phoneNumber: number } : { phoneNumber: number, userId: req.user._id };
        const payments = await Payment.find(query).populate('billId').sort({ createdAt: -1 });
        const user = await User.findById(req.user._id).select('name email');
        
        const { generatePhoneReportPDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generatePhoneReportPDF(payments, number, user);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=phone-report-${number}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error exporting PDF' });
    }
};

// GET /api/reports/users-activity (admin only)
const getUsersActivityReport = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password -mfaSecret');
        const report = await Promise.all(users.map(async (user) => {
            const daysActive = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
            const totalBills = await Bill.countDocuments({ userId: user._id });
            const paidBills = await Bill.countDocuments({ userId: user._id, status: 'paid' });
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '—',
                status: user.status,
                createdAt: user.createdAt,
                daysActive,
                totalBills,
                paidBills
            };
        }));
        res.json({ users: report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { monthlyReport, categoryReport, exportPDF, getAuditLogs, getPhoneReport, exportPhonePDF, getUsersActivityReport };
